/* Puts the website online: rebuilds dist/site and pushes it to the "gh-pages" branch of this
   repository on GitHub, which GitHub Pages serves at https://<account>.github.io/<repository>/.
   The source on "main" is not touched.

   Run:  node tools/publish-site.js      (whenever the app has changed and should go live) */
var fs = require('fs'), path = require('path'), cp = require('child_process');

var ROOT = path.resolve(__dirname, '..'), SITE = path.join(ROOT, 'dist', 'site'), WORK = path.join(ROOT, 'dist', 'build', 'pages');

function run(cmd, args, cwd, quiet) {
  var r = cp.spawnSync(cmd, args, { cwd: cwd || ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    if (quiet) return null;
    console.error(cmd + ' ' + args.join(' ') + '\n' + (r.stdout || '') + (r.stderr || ''));
    process.exit(1);
  }
  return (r.stdout || '').trim();
}

var remote = run('git', ['remote', 'get-url', 'origin'], ROOT, true);
if (!remote) { console.error('This folder has no GitHub repository yet ("origin" is not set).'); process.exit(1); }

run(process.execPath, [path.join(__dirname, 'build-site.js')]);

/* A throwaway repository holding just the built site, pushed over the old gh-pages branch. */
fs.rmSync(WORK, { recursive: true, force: true });
fs.cpSync(SITE, WORK, { recursive: true });
var name = run('git', ['config', 'user.name'], ROOT, true) || 'Sixty-Four';
var email = run('git', ['config', 'user.email'], ROOT, true) || 'sixty-four@users.noreply.github.com';
var source = run('git', ['rev-parse', '--short', 'HEAD'], ROOT, true) || 'unsaved changes';
var version = (/Version (\w+)/.exec(fs.readFileSync(path.join(SITE, 'sw.js'), 'utf8')) || [])[1] || '';

run('git', ['init', '-q', '-b', 'gh-pages'], WORK);
run('git', ['config', 'core.autocrlf', 'false'], WORK);   // publish the files byte for byte
run('git', ['add', '-A'], WORK);
run('git', ['-c', 'user.name=' + name, '-c', 'user.email=' + email,
  'commit', '-q', '-m', 'Publish site ' + version + ' (from ' + source + ')'], WORK);
run('git', ['push', '-q', '--force', remote, 'gh-pages'], WORK);
fs.rmSync(WORK, { recursive: true, force: true });

var m = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/.exec(remote);
console.log('Published version ' + version + '.' + (m ? ' Live in a minute or two at https://' + m[1].toLowerCase() + '.github.io/' + m[2] + '/' : ''));
