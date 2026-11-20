/* Added to the page by the Sixty-Four launcher (the .exe); it is not part of the hosted website.
   1. Keeps your progress in a file on this computer, so it survives clearing the browser,
      switching browser, or anything else. The file is loaded before the app starts, and every
      change is written back to it straight away.
   2. Tells the launcher the app is still open, so it can close itself after you leave. */
(function () {
  'use strict';
  var PREFIX = 'sixtyfour.', STAMP = 'sixtyfour.savedAt';

  function snapshot() {
    var o = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf(PREFIX) === 0) o[k] = localStorage.getItem(k);
    }
    return o;
  }

  var onDisk = null;
  try {
    var x = new XMLHttpRequest();
    x.open('GET', '/__data', false);          // tiny, local and needed before the app reads anything
    x.send();
    if (x.status === 200) onDisk = JSON.parse(x.responseText || '{}');
  } catch (e) { onDisk = null; }

  if (onDisk) {
    var set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
    var diskTime = +onDisk[STAMP] || 0, localTime = +localStorage.getItem(STAMP) || 0, k;

    if (diskTime >= localTime && diskTime > 0) {
      // The file is at least as new as the browser's copy: make the browser match it.
      var mine = snapshot();
      for (k in mine) if (!(k in onDisk)) remove.call(localStorage, k);
      for (k in onDisk) if (localStorage.getItem(k) !== onDisk[k]) set.call(localStorage, k, onDisk[k]);
    }

    var last = null, timer = null, dirty = false;
    var push = function (leaving) {
      if (!dirty) return;
      var body = JSON.stringify(snapshot());
      dirty = false;
      if (body === last) return;
      last = body;
      try {
        fetch('/__data', { method: 'POST', body: body, headers: { 'Content-Type': 'application/json' },
          keepalive: !!leaving && body.length < 60000 });
      } catch (e) { last = null; dirty = true; }
    };
    var changed = function () {
      dirty = true;
      set.call(localStorage, STAMP, String(Date.now()));
      clearTimeout(timer);
      timer = setTimeout(push, 250);
    };
    Storage.prototype.setItem = function (key, value) {
      set.call(this, key, value);
      if (this === localStorage && String(key).indexOf(PREFIX) === 0 && key !== STAMP) changed();
    };
    Storage.prototype.removeItem = function (key) {
      remove.call(this, key);
      if (this === localStorage && String(key).indexOf(PREFIX) === 0 && key !== STAMP) changed();
    };
    window.addEventListener('pagehide', function () { push(true); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') push(true); });

    // First run with the launcher, or the browser had newer progress than the file: write it out now.
    if (localTime > diskTime || (diskTime === 0 && Object.keys(snapshot()).length)) {
      if (!localTime) set.call(localStorage, STAMP, String(Date.now()));
      dirty = true;
      push(false);
    } else last = JSON.stringify(snapshot());

    window.SIXTYFOUR_SAVED_TO = 'file';
  }

  function ping() { try { fetch('/__ping', { cache: 'no-store' }); } catch (e) { /* launcher gone */ } }
  ping();
  setInterval(ping, 20000);
})();
