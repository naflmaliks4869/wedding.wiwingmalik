/**
 * Bisdev Konfirmasi Transfer Widget
 * - Handle form submit
 * - Redirect ke WhatsApp dengan pesan yang diisi user
 */
(function () {
  'use strict';

  var DEFAULT_WA_TPL =
    'Hai, saya %nama%. Saya ingin mengonfirmasi bahwa saya sudah melakukan transfer wedding gift untuk acara pernikahan Anda.\nDetail transfer: %detail%\nSaya ucapkan: %pesan%.\nTerima kasih ya.';

  function utf8FromBase64(b64) {
    var raw = '';
    try {
      raw = atob(String(b64 || '').replace(/\s+/g, ''));
    } catch (e) {
      return '';
    }
    try {
      return decodeURIComponent(
        Array.prototype.map
          .call(raw, function (ch) {
            return '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    } catch (e2) {
      return raw;
    }
  }

  function repairGiftWaTemplate(tpl) {
    var s = String(tpl || '');
    s = s.replace(/%25detail%25/gi, '%detail%');
    // Perbaikan lama salah: '%detail%'.replace(/tail%/,'%detail%') → '%de%detail%'
    s = s.replace(/%de(?:%de)*%detail%/gi, '%detail%');
    // urldecode('%detail%') yang benar-benar rusak: karakter Þ/� + 'tail%'
    s = s.replace(/[\u00DE\uFFFD]tail%/g, '%detail%');
    // 'tail%' berdiri sendiri, bukan bagian dari '%detail%'
    s = s.replace(/([^eE]|^)tail%/g, '$1%detail%');
    return s;
  }

  function readWaTemplate(wrap) {
    var b64 = (wrap.getAttribute('data-wa-tpl') || '').trim();
    if (b64) {
      var decoded = utf8FromBase64(b64);
      if (decoded) return repairGiftWaTemplate(decoded);
    }
    var raw = wrap.getAttribute('data-wa-prefix') || wrap.dataset.waPrefix || '';
    return repairGiftWaTemplate(raw || DEFAULT_WA_TPL);
  }

  function fillGiftWaTemplate(tpl, nama, nominal, pesan) {
    var s = repairGiftWaTemplate(tpl);
    function put(re, val) {
      s = s.replace(re, function () {
        return val;
      });
    }
    put(/%nama%/gi, nama);
    put(/\{\{\s*nama\s*\}\}/gi, nama);
    put(/\{\s*nama\s*\}/gi, nama);
    put(/%detail%/gi, nominal);
    put(/%nominal%/gi, nominal);
    put(/\{\{\s*detail\s*\}\}/gi, nominal);
    put(/\{\{\s*nominal\s*\}\}/gi, nominal);
    put(/\{\s*detail\s*\}/gi, nominal);
    put(/\{\s*nominal\s*\}/gi, nominal);
    put(/%pesan%/gi, pesan);
    put(/%ucapan%/gi, pesan);
    put(/\{\{\s*pesan\s*\}\}/gi, pesan);
    put(/\{\s*pesan\s*\}/gi, pesan);
    return s;
  }

  function init() {
    document.querySelectorAll('.idb-konfirmasi-transfer').forEach(function (wrap) {
      if (wrap.dataset.inited === '1') return;
      wrap.dataset.inited = '1';

      var form = wrap.querySelector('.idb-konfirmasi-transfer__form');
      if (!form) return;

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var namaEl = form.querySelector('[name="nama"]');
        var nominalEl =
          form.querySelector('[name="nominal"]') ||
          form.querySelector('[name="detail"]') ||
          form.querySelector('[name="jumlah"]');
        var ucapanEl = form.querySelector('[name="ucapan"]') || form.querySelector('[name="pesan"]');
        if (!namaEl || !nominalEl || !ucapanEl) return;

        var nama = (namaEl.value || '').trim();
        var nominal = (nominalEl.value || '').trim();
        var ucapan = (ucapanEl.value || '').trim();

        if (!nama) {
          namaEl.focus();
          return;
        }
        if (!nominal) {
          nominalEl.focus();
          return;
        }

        var waOn = wrap.dataset.wa === '1';
        var waNumber = (wrap.getAttribute('data-wa-number') || wrap.dataset.waNumber || '').trim();
        var waTemplate = readWaTemplate(wrap);

        if (waOn && waNumber) {
          var msg = fillGiftWaTemplate(waTemplate, nama, nominal, ucapan);

          // Nomor sudah dinormalisasi di sisi PHP (helper idb_normalize_wa_number).
          var clean = waNumber.replace(/\D/g, '');
          if (!clean) return;

          var url = 'https://wa.me/' + clean + '?text=' + encodeURIComponent(msg);
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          // Tanpa WhatsApp: bisa trigger custom event untuk integrasi lain
          var ev = new CustomEvent('bisdev-konfirmasi-transfer-submit', {
            detail: { nama: nama, nominal: nominal, ucapan: ucapan }
          });
          wrap.dispatchEvent(ev);
        }

        form.reset();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Elementor live edit: re-init saat frontend reload
  if (window.elementorFrontend && elementorFrontend.hooks) {
    elementorFrontend.hooks.addAction('frontend/element_ready/bisdev_konfirmasi_transfer.default', function () {
      init();
    });
  }
})();
