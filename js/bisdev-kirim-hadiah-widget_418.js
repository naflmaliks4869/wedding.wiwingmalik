/* Bisdev Kirim Hadiah — salin alamat ke clipboard */
(function () {
  window.BISDEV_KIRIM_HADIAH = window.BISDEV_KIRIM_HADIAH || { loaded: true, version: '1.0.0' };

  function closest(el, sel) {
    while (el && el.nodeType === 1) {
      if (el.matches(sel)) return el;
      el = el.parentElement;
    }
    return null;
  }

  async function copyText(text) {
    text = (text ?? '').toString();
    if (!text) return false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) { /* fallback */ }
    }

    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.left = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (e) {
      return false;
    }
  }

  function showToast(root, msg) {
    var toast = root.querySelector('.idb-kirim-hadiah__toast');
    if (!toast || !msg) return;
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(toast.__idb_to);
    toast.__idb_to = setTimeout(function () {
      toast.classList.remove('is-show');
    }, 1600);
  }

  function flashButton(btn, ok, msg) {
    var label = btn ? btn.querySelector('.idb-kirim-hadiah__copy-text') : null;
    if (!btn || !label) return;
    var orig = btn.getAttribute('data-orig') || label.textContent;
    if (!btn.getAttribute('data-orig')) btn.setAttribute('data-orig', orig);
    btn.classList.remove('is-copied', 'is-failed');
    btn.classList.add(ok ? 'is-copied' : 'is-failed');
    label.textContent = msg || orig;
    clearTimeout(btn.__idb_to);
    btn.__idb_to = setTimeout(function () {
      label.textContent = btn.getAttribute('data-orig') || orig;
      btn.classList.remove('is-copied', 'is-failed');
    }, 1400);
  }

  async function doCopy(root) {
    var text = root.getAttribute('data-copy-address') || '';
    var ok = await copyText(text);
    var msg = ok
      ? (root.getAttribute('data-copy-success') || 'Tersalin.')
      : (root.getAttribute('data-copy-fail') || 'Gagal menyalin.');
    var btn = root.querySelector('.idb-kirim-hadiah__copy-btn');
    flashButton(btn, ok, msg);
    showToast(root, msg);
  }

  document.addEventListener('click', function (e) {
    var btn = closest(e.target, '.idb-kirim-hadiah__copy-btn');
    if (!btn) return;
    var root = closest(btn, '.idb-kirim-hadiah');
    if (!root || root.getAttribute('data-copy-enabled') !== '1') return;
    e.preventDefault();
    doCopy(root);
  });
})();
