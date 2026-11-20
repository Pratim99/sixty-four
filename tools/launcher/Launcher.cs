// Sixty-Four launcher.
// A single .exe that carries the whole app inside itself. It serves the app to this computer only
// (http://127.0.0.1:56464), opens it in its own window, keeps your progress in a file under
// %APPDATA%\Sixty-Four, and closes itself a few minutes after you close the app.
// Built by tools/build-exe.js with the C# 5 compiler that ships with Windows.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;

static class Program
{
    // A fixed port, so the browser always sees the same site.
    const int Port = 56464;
    static readonly string Origin = "http://127.0.0.1:" + Port;
    static readonly Dictionary<string, byte[]> Files = new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);
    static readonly object DataLock = new object();
    static string dataFile;
    static int pings;                       // heartbeats from the page since the last check

    [STAThread]
    static int Main(string[] args)
    {
        bool selfTest = args.Length > 0 && args[0] == "--selftest";      // quick check, no window, temporary data folder
        bool quiet = selfTest || (args.Length > 0 && args[0] == "--no-window");  // normal timing, no window, temporary data folder
        string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Sixty-Four");
        if (quiet) dir = Path.Combine(Path.GetTempPath(), "Sixty-Four-selftest");
        Directory.CreateDirectory(dir);
        dataFile = Path.Combine(dir, "progress.json");

        LoadFiles();
        ThreadPool.SetMinThreads(64, 64);   // a page load asks for about forty files at once

        TcpListener listener = new TcpListener(IPAddress.Loopback, Port);
        try { listener.Start(); }
        catch (SocketException)
        {
            // Sixty-Four is already running: just show its window again.
            if (selfTest) return 2;
            OpenWindow();
            return 0;
        }

        Thread server = new Thread(delegate () { Serve(listener); });
        server.IsBackground = true;
        server.Start();

        if (!quiet) OpenWindow();

        // Stay alive while the page keeps saying hello; leave a few minutes after it stops.
        // Counting missed checks (not clock time) means a sleeping laptop does not look like a closed app.
        int interval = selfTest ? 1000 : 30000, allowed = selfTest ? 4 : 6, grace = selfTest ? 6 : 10, missed = 0, checks = 0;
        bool seen = false;
        while (true)
        {
            Thread.Sleep(interval);
            checks++;
            if (Interlocked.Exchange(ref pings, 0) > 0) { seen = true; missed = 0; }
            else if (seen) missed++;
            else if (checks >= grace) break;            // nobody ever opened the page
            if (missed >= allowed) break;
        }
        return 0;
    }

    static void LoadFiles()
    {
        Assembly asm = Assembly.GetExecutingAssembly();
        foreach (string name in asm.GetManifestResourceNames())
        {
            using (Stream s = asm.GetManifestResourceStream(name))
            using (MemoryStream m = new MemoryStream())
            {
                s.CopyTo(m);
                if (name.StartsWith("app/")) Files[name.Substring(4)] = m.ToArray();
                else if (name == "launcher/bootstrap.js") Files["__bootstrap.js"] = m.ToArray();
            }
        }
        // The page gets one extra script, first in line: it loads saved progress and keeps the launcher alive.
        byte[] page;
        if (Files.TryGetValue("index.html", out page))
        {
            string html = Encoding.UTF8.GetString(page);
            int at = html.IndexOf("<script", StringComparison.OrdinalIgnoreCase);
            if (at >= 0) html = html.Substring(0, at) + "<script src=\"/__bootstrap.js\"></script>\n" + html.Substring(at);
            Files["index.html"] = Encoding.UTF8.GetBytes(html);
        }
    }

    /* Open the app in a window of its own (Edge or Chrome in "app" mode); failing that, the default browser. */
    static void OpenWindow()
    {
        string url = Origin + "/";
        string pf = Environment.GetEnvironmentVariable("ProgramFiles") ?? "";
        string pf86 = Environment.GetEnvironmentVariable("ProgramFiles(x86)") ?? "";
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string[] browsers = {
            Path.Combine(pf86, "Microsoft\\Edge\\Application\\msedge.exe"),
            Path.Combine(pf, "Microsoft\\Edge\\Application\\msedge.exe"),
            Path.Combine(pf, "Google\\Chrome\\Application\\chrome.exe"),
            Path.Combine(pf86, "Google\\Chrome\\Application\\chrome.exe"),
            Path.Combine(local, "Google\\Chrome\\Application\\chrome.exe")
        };
        foreach (string exe in browsers)
        {
            if (!File.Exists(exe)) continue;
            try
            {
                Process.Start(new ProcessStartInfo(exe, "--app=" + url + " --window-size=1320,900") { UseShellExecute = false });
                return;
            }
            catch (Exception) { /* try the next one */ }
        }
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
        catch (Exception) { /* nothing more we can do */ }
    }

    static void Serve(TcpListener listener)
    {
        while (true)
        {
            TcpClient client;
            try { client = listener.AcceptTcpClient(); }
            catch (Exception) { return; }
            ThreadPool.QueueUserWorkItem(delegate (object o) { Handle((TcpClient)o); }, client);
        }
    }

    static void Handle(TcpClient client)
    {
        try
        {
            using (client)
            using (NetworkStream stream = client.GetStream())
            {
                stream.ReadTimeout = 8000;
                // Read the request head, then exactly as much body as it announces.
                MemoryStream all = new MemoryStream();
                byte[] buf = new byte[16384];
                int headEnd = -1;
                while (headEnd < 0 && all.Length < 65536)
                {
                    int n = stream.Read(buf, 0, buf.Length);
                    if (n <= 0) break;
                    all.Write(buf, 0, n);
                    headEnd = Find(all.GetBuffer(), (int)all.Length);
                }
                if (headEnd < 0) return;
                string head = Encoding.ASCII.GetString(all.GetBuffer(), 0, headEnd);
                string[] lines = head.Split(new string[] { "\r\n" }, StringSplitOptions.None);
                string[] first = lines[0].Split(' ');
                if (first.Length < 2) return;
                string method = first[0], path = first[1], origin = null;
                int length = 0;
                for (int i = 1; i < lines.Length; i++)
                {
                    int c = lines[i].IndexOf(':');
                    if (c < 0) continue;
                    string name = lines[i].Substring(0, c).Trim().ToLowerInvariant(), value = lines[i].Substring(c + 1).Trim();
                    if (name == "content-length") int.TryParse(value, out length);
                    else if (name == "origin") origin = value;
                }
                if (length < 0 || length > 32 * 1024 * 1024) { Send(stream, "413 Payload Too Large", "text/plain", new byte[0], false); return; }
                int have = (int)all.Length - (headEnd + 4);
                while (have < length)
                {
                    int n = stream.Read(buf, 0, Math.Min(buf.Length, length - have));
                    if (n <= 0) break;
                    all.Write(buf, 0, n);
                    have += n;
                }
                byte[] body = new byte[Math.Max(0, Math.Min(have, length))];
                Array.Copy(all.GetBuffer(), headEnd + 4, body, 0, body.Length);

                int q = path.IndexOf('?');
                if (q >= 0) path = path.Substring(0, q);
                path = Uri.UnescapeDataString(path).TrimStart('/');
                if (path.Length == 0) path = "index.html";
                bool headOnly = method == "HEAD";

                if (path == "__ping")
                {
                    Interlocked.Increment(ref pings);
                    Send(stream, "204 No Content", "text/plain", new byte[0], headOnly);
                }
                else if (path == "__data" && method == "GET")
                {
                    Send(stream, "200 OK", "application/json; charset=utf-8", ReadData(), headOnly);
                }
                else if (path == "__data" && method == "POST")
                {
                    // Only the app itself may save: another website open in the browser must not be able to.
                    if (origin != null && origin != Origin) { Send(stream, "403 Forbidden", "text/plain", new byte[0], false); return; }
                    bool ok = body.Length == length && WriteData(body);
                    Send(stream, ok ? "204 No Content" : "400 Bad Request", "text/plain", new byte[0], false);
                }
                else
                {
                    byte[] file;
                    if ((method != "GET" && method != "HEAD") || !Files.TryGetValue(path, out file))
                        Send(stream, "404 Not Found", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Not found"), headOnly);
                    else Send(stream, "200 OK", Mime(path), file, headOnly);
                }
            }
        }
        catch (Exception) { /* a dropped connection is not worth crashing over */ }
    }

    static int Find(byte[] b, int len)
    {
        for (int i = 0; i + 3 < len; i++)
            if (b[i] == 13 && b[i + 1] == 10 && b[i + 2] == 13 && b[i + 3] == 10) return i;
        return -1;
    }

    static byte[] ReadData()
    {
        lock (DataLock)
        {
            try { if (File.Exists(dataFile)) return File.ReadAllBytes(dataFile); }
            catch (Exception) { }
            return Encoding.UTF8.GetBytes("{}");
        }
    }

    static bool WriteData(byte[] body)
    {
        // A light sanity check: it must look like a JSON object.
        if (body.Length < 2 || body[0] != (byte)'{' || body[body.Length - 1] != (byte)'}') return false;
        lock (DataLock)
        {
            try
            {
                string tmp = dataFile + ".tmp";
                File.WriteAllBytes(tmp, body);
                if (File.Exists(dataFile)) File.Replace(tmp, dataFile, dataFile + ".bak");
                else File.Move(tmp, dataFile);
                return true;
            }
            catch (Exception) { return false; }
        }
    }

    static void Send(NetworkStream stream, string status, string type, byte[] body, bool headOnly)
    {
        string head = "HTTP/1.1 " + status + "\r\nContent-Type: " + type + "\r\nContent-Length: " + body.Length +
            "\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n";
        byte[] h = Encoding.ASCII.GetBytes(head);
        stream.Write(h, 0, h.Length);
        if (!headOnly && body.Length > 0) stream.Write(body, 0, body.Length);
        stream.Flush();
    }

    static string Mime(string path)
    {
        switch (Path.GetExtension(path).ToLowerInvariant())
        {
            case ".html": return "text/html; charset=utf-8";
            case ".js": return "text/javascript; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".wasm": return "application/wasm";
            case ".json": case ".webmanifest": return "application/json";
            case ".svg": return "image/svg+xml";
            case ".png": return "image/png";
            case ".ico": return "image/x-icon";
            case ".txt": case ".md": return "text/plain; charset=utf-8";
            default: return "application/octet-stream";
        }
    }
}
