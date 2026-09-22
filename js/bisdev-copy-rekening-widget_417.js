/* Bisdev Copy Rekening Widget
 * - Clipboard API + fallback
 * - Toast success/fail
 */
(function(){
  window.BISDEV_COPY_REKENING = window.BISDEV_COPY_REKENING || { loaded: true, version: '1.0.7' };

  function closest(el, sel){
    while(el && el.nodeType === 1){
      if(el.matches(sel)) return el;
      el = el.parentElement;
    }
    return null;
  }

  async function copyText(text){
    text = (text ?? '').toString();
    if(!text) return false;

    // Modern clipboard (https only)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch(e) { /* fallback */ }
    }

    // Fallback: textarea
    try{
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.left = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    }catch(e){
      return false;
    }
  }

  function showToast(root, msg){
    const toast = root.querySelector('.idb-copy-rek__toast');
    if(!toast) return;
    if(!msg) return;
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(toast.__idb_to);
    toast.__idb_to = setTimeout(()=> toast.classList.remove('is-show'), 1600);
  }

function flashButton(root, ok, msg){
  const btn = root.querySelector('.idb-copy-rek__btn');
  const label = btn ? btn.querySelector('.idb-copy-rek__btntext') : null;
  if(!btn || !label) return;
  const orig = btn.getAttribute('data-orig') || label.textContent;
  if(!btn.getAttribute('data-orig')) btn.setAttribute('data-orig', orig);
  btn.classList.remove('is-copied','is-failed');
  btn.classList.add(ok ? 'is-copied' : 'is-failed');
  label.textContent = msg || orig;
  clearTimeout(btn.__idb_to);
  btn.__idb_to = setTimeout(()=>{
    label.textContent = btn.getAttribute('data-orig') || orig;
    btn.classList.remove('is-copied','is-failed');
  }, 1400);
}

async function doCopy(root){
    const text = root.getAttribute('data-copy') || '';
    const ok = await copyText(text);
    const msg = ok ? (root.getAttribute('data-success') || 'Tersalin!') : (root.getAttribute('data-fail') || 'Gagal');
    flashButton(root, ok, msg);
    showToast(root, msg);
  }

  // Click handler (button / text)
  document.addEventListener('click', function(e){
    const btn = closest(e.target, '.idb-copy-rek__btn');
    if(btn){
      const root = closest(btn, '.idb-copy-rek');
      if(root && root.getAttribute('data-trigger-btn') === '1'){
        e.preventDefault();
        doCopy(root);
      }
      return;
    }

    const txt = closest(e.target, '.idb-copy-rek__number');
    if(txt){
      const root = closest(txt, '.idb-copy-rek');
      if(root && root.getAttribute('data-trigger-text') === '1'){
        e.preventDefault();
        doCopy(root);
      }
    }
  });

  // Keyboard (enter/space) for text trigger
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Enter' && e.key !== ' ') return;
    const el = document.activeElement;
    if(!el) return;
    if(el.classList && el.classList.contains('idb-copy-rek__number')){
      const root = closest(el, '.idb-copy-rek');
      if(root && root.getAttribute('data-trigger-text') === '1'){
        e.preventDefault();
        doCopy(root);
      }
    }
  });

})();
