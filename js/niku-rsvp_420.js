(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  var w = window;
  var d = document;

  function qs(scope, sel) {
    return (scope || d).querySelector(sel);
  }

  function qsa(scope, sel) {
    return Array.prototype.slice.call(
      (scope || d).querySelectorAll(sel)
    );
  }

  function serialize(obj) {
    return Object.keys(obj)
      .map(function (k) {
        return (
          encodeURIComponent(k) +
          '=' +
          encodeURIComponent(obj[k])
        );
      })
      .join('&');
  }

  function isEditMode() {
    try {
      return !!(
        w.elementorFrontend &&
        w.elementorFrontend.isEditMode &&
        w.elementorFrontend.isEditMode()
      );
    } catch (e) {
      return false;
    }
  }

  /** Perbarui angka ringkasan Hadir / Tidak Hadir setelah AJAX */
  function updateRsvpStats(card, counts) {
    if (!card || !counts || card.getAttribute('data-show-stats') !== '1') return;
    var wrap = qs(card, '.rsvp-stats');
    if (!wrap) return;
    var nh = qs(wrap, '[data-rsvp-stat="hadir"]');
    var nt = qs(wrap, '[data-rsvp-stat="tidak"]');
    if (nh) nh.textContent = String(counts.hadir != null ? counts.hadir : 0);
    if (nt) nt.textContent = String(counts.tidak != null ? counts.tidak : 0);
  }

  // Buka WA dengan "user gesture" friendly (minim popup-blocker)
function openWhatsAppSafe(url) {
  try {
    // buka tab kosong saat masih dalam gesture click lalu arahkan
    var w = window.open('', '_blank');
    if (w) {
      w.location.href = url;
      return true;
    }
  } catch (e) {}
  // fallback biasa
  window.open(url, '_blank');
  return false;
}



  function hasDirectPopup(host) {
    if (!host || !host.children) return null;
    for (var i = 0; i < host.children.length; i++) {
      if (host.children[i].classList && host.children[i].classList.contains('niku-rsvp-popup-backdrop')) {
        return host.children[i];
      }
    }
    return null;
  }

  function findPopupHost(card) {
    if (!card || !card.getBoundingClientRect) return card;

    var cardRect = card.getBoundingClientRect();
    var viewportWidth = Math.max(
      d.documentElement.clientWidth || 0,
      w.innerWidth || 0
    );
    var candidates = [];
    var node = card.parentElement;

    while (node && node !== d.body && node !== d.documentElement) {
      if (node.getBoundingClientRect) {
        var rect = node.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          candidates.push({ el: node, rect: rect });
        }
      }
      node = node.parentElement;
    }

    for (var i = 0; i < candidates.length; i++) {
      var width = candidates[i].rect.width;
      var height = candidates[i].rect.height;
      if (width >= cardRect.width && width <= 640 && height >= cardRect.height) {
        return candidates[i].el;
      }
    }

    for (var j = 0; j < candidates.length; j++) {
      var el = candidates[j].el;
      var wdt = candidates[j].rect.width;
      if (
        wdt < viewportWidth * 0.85 &&
        (
          el.classList.contains('elementor') ||
          el.classList.contains('elementor-section') ||
          el.classList.contains('elementor-container') ||
          el.classList.contains('elementor-widget-container') ||
          el.classList.contains('entry-content') ||
          el.classList.contains('site-main')
        )
      ) {
        return el;
      }
    }

    return card;
  }
  // =====================================================================
  // Popup konfirmasi WhatsApp
  // =====================================================================
  function showWaPopup(card, waLink) {
    if (!card || !waLink) return;

    var popupEnabled = card.getAttribute('data-wa-popup') === '1';
    var popupTitle = card.getAttribute('data-wa-popup-title') || 'Konfirmasi WhatsApp';
    var popupText = card.getAttribute('data-wa-popup-text') ||
      'Apakah Anda ingin melanjutkan mengirim konfirmasi melalui WhatsApp?';
    var popupYes = card.getAttribute('data-wa-popup-yes') || 'Ya, kirim via WhatsApp';
    var popupNo = card.getAttribute('data-wa-popup-no') || 'Tidak, terima kasih';

    // Jika popup nonaktif → langsung buka WA
    if (!popupEnabled) {
      openWhatsAppSafe(waLink);
      return;
    }

    var host = findPopupHost(card) || card;
    if (host.classList) {
      host.classList.add('niku-rsvp-popup-host');
    }

    // Hapus popup lama dalam host/card ini
    var old = hasDirectPopup(host) || card.querySelector('.niku-rsvp-popup-backdrop');
    if (old) old.remove();

    var backdrop = document.createElement('div');
    backdrop.className = 'niku-rsvp-popup-backdrop';

    var box = document.createElement('div');
    box.className = 'niku-rsvp-popup';

    function esc(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    box.innerHTML =
      '<div class="niku-rsvp-popup-title">' + esc(popupTitle) + '</div>' +
      '<div class="niku-rsvp-popup-text">' + esc(popupText).replace(/\n/g, '<br>') + '</div>' +
      '<div class="niku-rsvp-popup-actions">' +
      '<button type="button" class="niku-rsvp-popup-btn niku-rsvp-popup-no">' + esc(popupNo) + '</button>' +
      '<button type="button" class="niku-rsvp-popup-btn niku-rsvp-popup-yes">' + esc(popupYes) + '</button>' +
      '</div>';

    backdrop.appendChild(box);
    host.appendChild(backdrop);

    function close() {
      backdrop.classList.remove('show');
      setTimeout(function () {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }, 180);
    }

    // Klik luar box → tutup
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });

    // Tombol Tidak
    var btnNo = box.querySelector('.niku-rsvp-popup-no');
    if (btnNo) {
      btnNo.addEventListener('click', function () {
        close();
      });
    }

    // Tombol Ya
    var btnYes = box.querySelector('.niku-rsvp-popup-yes');
    if (btnYes) {
      btnYes.addEventListener('click', function () {
        close();
        openWhatsAppSafe(waLink);
      });
    }

    // Trigger animasi
    setTimeout(function () {
      backdrop.classList.add('show');
    }, 10);
  }

  // =====================================================================
  // Popup notifikasi sukses (ucapan terkirim)
  // =====================================================================
  function showSuccessPopup(msg) {
    var old = d.body.querySelector('.niku-rsvp-success-popup');
    if (old) old.remove();

    var backdrop = document.createElement('div');
    backdrop.className = 'niku-rsvp-success-popup';
    backdrop.setAttribute('role', 'alert');
    backdrop.setAttribute('aria-live', 'polite');

    var iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
    var box = document.createElement('div');
    box.className = 'niku-rsvp-success-popup__box';
    box.innerHTML = '<span class="niku-rsvp-success-popup__icon" aria-hidden="true">' + iconSvg + '</span><span class="niku-rsvp-success-popup__text"></span>';
    box.querySelector('.niku-rsvp-success-popup__text').textContent = msg;

    backdrop.appendChild(box);
    d.body.appendChild(backdrop);

    function close() {
      backdrop.classList.remove('show');
      setTimeout(function () {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }, 250);
    }

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });

    setTimeout(function () {
      backdrop.classList.add('show');
    }, 10);

    setTimeout(close, 1800);
  }

  // Hapus dengan animasi: fade + slide + collapse, lalu remove dari DOM
    function smoothRemove(item) {
      if (!item) return;

      // Matikan pointer event pada tombol hapus agar tak dobel klik
      var delBtn = item.querySelector('.niku-rsvp-delete-comment');
      if (delBtn) delBtn.style.pointerEvents = 'none';

      // Set tinggi awal eksplisit supaya transisi height halus
      var startH = item.offsetHeight;
      item.style.height = startH + 'px';

      // Aktifkan aturan collapse (punya properti transition untuk height/margin/padding)
      item.classList.add('rsvp-item--collapse');

      // Force reflow agar browser “commit” height awal
      item.getBoundingClientRect();

      // Tahap animasi: fade + geser + height 0
      item.classList.add('is-removing');
      item.style.height = '0px';

      // Setelah transisi selesai, baru remove
      item.addEventListener('transitionend', function onEnd(e) {
        // Hanya sekali, dan pastikan event dari elemen ini sendiri
        if (e.target !== item) return;
        item.removeEventListener('transitionend', onEnd, { once: true });
        item.remove();
      }, { once: true });
    }


  // =====================================================================
  // Inisialisasi 1 card RSVP
  // =====================================================================
  function initCard(card) {
    if (!card || card.__niku_rsvp_init) return;
    card.__niku_rsvp_init = true;

    function cardMsg(attr, fallback) {
      var v = card.getAttribute(attr);
      return v !== null && v !== '' ? v : fallback;
    }

    var wrap       = qs(card, '.rsvp-comments-wrap');
    var nameInput  = qs(card, '[data-rsvp="name"]');
    var msgInput   = qs(card, '[data-rsvp="message"]');
    var sendBtn    = qs(card, '[data-rsvp="send"]');
    var pillsWrap  = qs(card, '[data-rsvp="presence"]');
    var pills      = qsa(card, '[data-rsvp-pill]');
    var jumlahTamuWrap = qs(card, '[data-rsvp="jumlah-tamu-wrap"]');
    var jumlahTamuSelect = qs(card, '[data-rsvp="jumlah_tamu"]');
    var errBox     = qs(card, '.rsvp-error--name');
    var msgErrBox  = qs(card, '.rsvp-error--message');
    var liveBox    = qs(card, '.rsvp-live');
    var msgMaxLen  = parseInt(card.getAttribute('data-msg-max-length') || '1000', 10);
    if (isNaN(msgMaxLen) || msgMaxLen < 1) msgMaxLen = 1000;
    var perm       = (card.getAttribute('data-comment-permission') || '').trim();
    var allowPublic = (perm === 'public') || (card.getAttribute('data-allow-public') === '1');
    var requireParam = (card.getAttribute('data-require-param') === '1') || (!allowPublic && (card.getAttribute('data-require-to') === '1'));
    var requireDb   = (card.getAttribute('data-require-db') === '1');
    var guestTo    = (card.getAttribute('data-guest-to') || '').trim();
    // requireTo dipertahankan untuk kompatibilitas logika lama
    var requireTo  = requireParam;
    var hpInput   = qs(card, '[data-rsvp="hp"]');
    
    // Lock nama: db_only + ?to= (nama dari DB) atau param_only + ?to= (nama dari parameter)
    if (guestTo && nameInput && (requireDb || perm === 'param_only')) {
      nameInput.setAttribute('readonly', 'readonly');
      nameInput.classList.add('is-locked');
    }
    
    // Validasi awal mode izin komentar
    var staticErr = (card.getAttribute('data-static-error') || '').trim();

    // Mode param_only / db_only: wajib ada ?to=
    if (requireParam && !guestTo) {
      if (sendBtn) sendBtn.disabled = true;
      setError(cardMsg('data-msg-invalid-link', 'Mohon maaf! Khusus untuk tamu undangan.'));
    } else if (requireDb && staticErr) {
      // Mode db_only: server sudah menentukan valid / tidaknya tamu
      if (sendBtn) sendBtn.disabled = true;
      setError(staticErr);
    } else {
      setError('');
      if (sendBtn) sendBtn.disabled = false;
    }

    var canDelete = card.getAttribute('data-can-delete') === '1';
    var delNonce  = card.getAttribute('data-del-nonce');



    if (canDelete && delNonce) {
      card.addEventListener('click', function(e) {
        var btn = e.target.closest('.niku-rsvp-delete-comment');
        if (!btn) return;

        e.preventDefault();
        var commentId = btn.getAttribute('data-comment-id');
        if (!commentId) return;
        if (!confirm(cardMsg('data-msg-delete-confirm', 'Hapus komentar ini?'))) return;

        fetch(NIKU_RSVP.ajax_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: serialize({
            action: 'niku_rsvp_delete_comment',
            comment_id: commentId,
            nonce: delNonce
          })
        })
        .then(function(res){ return res.json(); })
        .then(function(json){
          if (json && json.success) {
            var item = btn.closest('.rsvp-item');
            if (item) smoothRemove(item);
            if (json.data && json.data.counts) updateRsvpStats(card, json.data.counts);
          } else {
            var msg = (json && json.data && json.data.message) || cardMsg('data-msg-delete-fail', 'Gagal menghapus komentar.');
            alert(msg);
          }
        })
        .catch(function(){ alert(cardMsg('data-msg-delete-fail', 'Gagal menghapus komentar.')); });
      });
    }



    var postId = parseInt(
      (wrap && wrap.getAttribute('data-post')) ||
      card.getAttribute('data-post-id') ||
      '0',
      10
    );
    var perPage = parseInt(
      (wrap && wrap.getAttribute('data-per-page')) || '10',
      10
    );

    var usePresence = card.getAttribute('data-use-presence') !== '0';
    var showJumlahTamu = card.getAttribute('data-show-jumlah-tamu') === '1';
    var editorPreview = card.getAttribute('data-editor-preview') === '1';

    // Avatar template (jika ada dari Elementor)
    var avaTplEl    = qs(card, '.rsvp-ava-template');
    var avaIconHTML = avaTplEl ? avaTplEl.innerHTML.trim() : '';
    var showAvatar  = card.getAttribute('data-show-avatar') !== '0';

    function applyAvatar(scope) {
      if (!showAvatar) return;
      if (!avaIconHTML) return;
      qsa(scope || card, '.rsvp-ava').forEach(function (el) {
        el.innerHTML = avaIconHTML;
      });
    }
    applyAvatar(card);

    var editMode = isEditMode();
    var hasAjaxConfig = !!(
      w.NIKU_RSVP &&
      NIKU_RSVP.ajax_url &&
      NIKU_RSVP.nonce &&
      postId
    );

    // Di frontend: kalau ga ada config AJAX → stop (tapi biarkan tampilan statis)
    if (!hasAjaxConfig && !editMode) {
      if (window.console) {
        console.warn('[NIKU_RSVP] Konfigurasi AJAX tidak lengkap.', {
          postId: postId,
          hasAjax: !!(w.NIKU_RSVP && NIKU_RSVP.ajax_url),
          hasNonce: !!(w.NIKU_RSVP && NIKU_RSVP.nonce)
        });
      }
      return;
    }

    var hadirVal = '';
    var liveTimer = null;

    function setError(msg) {
      if (!errBox) return;
      errBox.setAttribute('role', 'alert');

      if (!msg) {
        errBox.style.display = 'none';
        errBox.textContent = '';
      } else {
        errBox.textContent = msg;
        errBox.style.display = 'block';
      }
    }

    function setMsgError(msg) {
      if (!msgErrBox) return;
      msgErrBox.setAttribute('role', 'alert');

      if (!msg) {
        msgErrBox.style.display = 'none';
        msgErrBox.textContent = '';
        if (msgInput) msgInput.classList.remove('is-over-limit');
      } else {
        msgErrBox.textContent = msg;
        msgErrBox.style.display = 'block';
        if (msgInput) msgInput.classList.add('is-over-limit');
      }
    }

    function enforceMsgLength(showOverLimitNotice) {
      if (!msgInput) return;
      var val = msgInput.value;
      var trimmed = false;

      if (val.length > msgMaxLen) {
        msgInput.value = val.slice(0, msgMaxLen);
        trimmed = true;
      }

      if (trimmed || showOverLimitNotice) {
        setMsgError(cardMsg('data-msg-content-max', 'Ucapan maksimal 1000 karakter.'));
      } else if (msgInput.value.length <= msgMaxLen) {
        setMsgError('');
      }
    }

    function setLive(msg, isError) {
      if (liveTimer) {
        clearTimeout(liveTimer);
        liveTimer = null;
      }

      if (!msg) {
        if (liveBox) {
          liveBox.classList.remove('show', 'rsvp-live--success', 'rsvp-live--error');
          liveTimer = setTimeout(function () {
            liveBox.innerHTML = '';
            if (liveBox) liveBox.className = 'rsvp-live';
            liveTimer = null;
          }, 350);
        }
        return;
      }

      // Sukses → popup; error → inline
      if (!isError) {
        showSuccessPopup(msg);
        return;
      }

      if (!liveBox) return;
      liveBox.setAttribute('role', 'status');
      liveBox.setAttribute('aria-live', 'polite');
      var iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      liveBox.innerHTML = '<span class="rsvp-live__icon" aria-hidden="true">' + iconSvg + '</span><span class="rsvp-live__text"></span>';
      liveBox.querySelector('.rsvp-live__text').textContent = msg;
      liveBox.classList.remove('rsvp-live--success', 'rsvp-live--error');
      liveBox.classList.add('show', 'rsvp-live--error');
    }

    // Pilih pill hadir / tidak hadir + tampilkan/sembunyikan Jumlah Tamu (jika fitur aktif)
    if (pillsWrap && pills.length) {
      pills.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var val = btn.getAttribute('data-rsvp-pill') || '';
          if (val === 'hadir' || val === 'tidak') {
            hadirVal = val;
          } else {
            hadirVal = '';
          }
          pills.forEach(function (b) {
            b.dataset.active = (b === btn) ? '1' : '0';
          });
          // Hapus notif "Pilih konfirmasi kehadiran" setelah user memilih
          if (hadirVal) setError('');
          // Tampilkan Jumlah Tamu hanya saat Hadir dipilih (kecuali di editor untuk preview)
          if (showJumlahTamu && jumlahTamuWrap) {
            if (hadirVal === 'hadir') {
              jumlahTamuWrap.style.display = '';
            } else {
              // Di editor tetap tampilkan untuk preview styling
              if (!editorPreview) {
                jumlahTamuWrap.style.display = 'none';
                if (jumlahTamuSelect) jumlahTamuSelect.value = '1';
              }
            }
          }
        });
      });
      // Di editor + fitur ON: pastikan Jumlah Tamu terlihat saat load
      if (showJumlahTamu && editorPreview && jumlahTamuWrap) {
        jumlahTamuWrap.style.display = '';
      }
    }

    // Helper: escape HTML untuk Optimistic UI
    function escHtml(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // Bangun HTML optimistik (mirip server) agar tampil instant
    function buildOptimisticHtml(author, content, hadirVal, jumlahTamu) {
      var pillHadirEl = qs(card, '.rsvp-pill--hadir span:last-child');
      var pillTidakEl = qs(card, '.rsvp-pill--tidak span:last-child');
      var labelHadir = (pillHadirEl && pillHadirEl.textContent) ? pillHadirEl.textContent.trim() : 'Hadir';
      var labelTidak = (pillTidakEl && pillTidakEl.textContent) ? pillTidakEl.textContent.trim() : 'Tidak Hadir';
      var tamuSuffix = cardMsg('data-suffix-jumlah-tamu', 'Tamu');
      var justNow = cardMsg('data-msg-just-now', 'Baru saja');
      var first = (author || 'G').charAt(0).toUpperCase();
      var ava = avaIconHTML ? avaIconHTML : '<span class="rsvp-ava-letter">' + escHtml(first) + '</span>';
      var statusLabel = '';
      if (hadirVal === 'hadir') {
        statusLabel = '<span class="rsvp-status-label rsvp-status-hadir"><span class="rsvp-status-dot"></span>' + escHtml(labelHadir) + '</span>';
        if (showJumlahTamu && jumlahTamu > 0) {
          statusLabel += ' <span class="rsvp-jumlah-tamu-badge">' + jumlahTamu + ' ' + escHtml(tamuSuffix) + '</span>';
        }
      } else if (hadirVal === 'tidak') {
        statusLabel = '<span class="rsvp-status-label rsvp-status-tidak"><span class="rsvp-status-dot"></span>' + escHtml(labelTidak) + '</span>';
      }
      return '<li class="rsvp-item" data-cid="0" data-optimistic="1">' +
        '<div class="rsvp-ava">' + ava + '</div>' +
        '<div class="rsvp-body">' +
        '<div class="rsvp-headline"><span class="rsvp-name">' + escHtml(author) + '</span> ' + statusLabel + '</div>' +
        '<div class="rsvp-meta">' + escHtml(justNow) + '</div>' +
        '<div class="rsvp-msg">' + escHtml(content).replace(/\n/g, '<br>') + '</div>' +
        '</div></li>';
    }

    // Baca pilihan kehadiran dari state + fallback pill aktif di DOM
    function resolveHadirVal() {
      if (hadirVal === 'hadir' || hadirVal === 'tidak') return hadirVal;
      var activePill = qs(card, '[data-rsvp-pill][data-active="1"]');
      if (!activePill) return '';
      var val = activePill.getAttribute('data-rsvp-pill') || '';
      return (val === 'hadir' || val === 'tidak') ? val : '';
    }

    function unlockSubmit() {
      if (wrap) wrap.dataset.loading = '0';
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.classList.remove('is-loading');
      }
    }

    // =================================================================
    // Submit RSVP
    // =================================================================
    function submit() {
      if (!sendBtn) return;

      // Hanya kirim AJAX jika config lengkap
      if (!hasAjaxConfig) {
        return;
      }

      // Cegah double-submit; flag hanya di-set SETELAH validasi lolos
      // (agar early return validasi tidak mengunci tombol sampai reload)
      if (wrap && wrap.dataset.loading === '1') return;

      setError('');
      setMsgError('');
      setLive('');

      var author  = (nameInput && nameInput.value ? nameInput.value : '').trim();
      var content = (msgInput && msgInput.value ? msgInput.value : '').trim();
      var selectedHadir = resolveHadirVal();
      if (selectedHadir) hadirVal = selectedHadir;
      
      // Wajib ?to=... saat mode aman
        var guestTo   = (card.getAttribute('data-guest-to') || '').trim();
        var requireTo = card.getAttribute('data-require-to') === '1';
        
        if (requireTo && !guestTo) {
          setError(cardMsg('data-msg-invalid-link', 'Mohon maaf! Khusus untuk tamu undangan.'));
          unlockSubmit();
          return;
        }

      if (!author) {
        setError(cardMsg('data-msg-name-required', 'Nama wajib diisi.'));
        unlockSubmit();
        return;
      }
      if (!content) {
        setMsgError(cardMsg('data-msg-content-required', 'Ucapan / doa wajib diisi.'));
        unlockSubmit();
        return;
      }
      if (content.length > msgMaxLen) {
        setMsgError(cardMsg('data-msg-content-max', 'Ucapan maksimal 1000 karakter.'));
        unlockSubmit();
        return;
      }
      if (usePresence && !hadirVal) {
        setError(cardMsg('data-msg-presence-required', 'Pilih konfirmasi kehadiran.'));
        unlockSubmit();
        return;
      }

      // Baca konfigurasi WA dari atribut card
      var sendWa       = card.getAttribute('data-send-wa') === '1';
      var waNumber     = card.getAttribute('data-wa-number') || '';
      var popupEnabled = card.getAttribute('data-wa-popup') === '1';

      var jumlahTamu = 1;
      if (showJumlahTamu && usePresence && hadirVal === 'hadir' && jumlahTamuSelect) {
        var jt = parseInt(jumlahTamuSelect.value || '1', 10);
        if (!isNaN(jt) && jt >= 1) jumlahTamu = jt;
      }

      // Simpan nilai form untuk rollback jika error
      var savedAuthor = author;
      var savedContent = content;
      var savedHadir = hadirVal;
      var savedPills = [];
      pills.forEach(function (b) {
        savedPills.push({ el: b, active: b.dataset.active || '0' });
      });

      // Optimistic UI: tampilkan komentar + kosongkan form segera
      var optimisticHtml = buildOptimisticHtml(author, content, hadirVal, jumlahTamu);
      var list = wrap ? qs(wrap, '.rsvp-list') : null;
      if (list) {
        list.insertAdjacentHTML('afterbegin', optimisticHtml);
        applyAvatar(wrap);
      }
      if (nameInput) nameInput.value = '';
      if (msgInput) msgInput.value = '';
      hadirVal = '';
      pills.forEach(function (b) {
        b.dataset.active = '0';
      });
      if (showJumlahTamu && jumlahTamuWrap && !editorPreview) jumlahTamuWrap.style.display = 'none';
      if (jumlahTamuSelect) jumlahTamuSelect.value = '1';
      setError('');
      setMsgError('');

      if (wrap) wrap.dataset.loading = '1';
      sendBtn.disabled = true;
      sendBtn.classList.add('is-loading');

      // Kosongkan honeypot sebelum kirim (cegah autofill mengisi & memicu "Tidak valid")
      if (hpInput) hpInput.value = '';

      var payload = {
          action: 'niku_rsvp_submit',
          nonce: NIKU_RSVP.nonce || '',
          post_id: postId,
          author: savedAuthor,
          content: savedContent,
          hadir: savedHadir,
          jumlah_tamu: jumlahTamu,
          show_jumlah_tamu: showJumlahTamu ? 1 : 0,
          use_presence: usePresence ? 1 : 0,
          send_wa: sendWa ? 1 : 0,
          wa_number: waNumber,
          guest_to: guestTo,
          hp: ''
        };

      fetch(NIKU_RSVP.ajax_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: serialize(payload)
      })
          .then(function (res) {
          return res.json().catch(function () {
            return {
              success: false,
              data: { message: cardMsg('data-msg-invalid-response', 'Respon tidak valid.') }
            };
          });
        })
        .then(function (json) {
          var optimistic = list ? list.querySelector('[data-optimistic="1"]') : null;

          if (!json || !json.success) {
            // Rollback: hapus item optimistik, restore form
            if (optimistic) optimistic.remove();
            if (nameInput) nameInput.value = savedAuthor;
            if (msgInput) msgInput.value = savedContent;
            hadirVal = savedHadir;
            savedPills.forEach(function (p) {
              p.el.dataset.active = p.active;
            });
            if (showJumlahTamu && savedHadir === 'hadir' && jumlahTamuWrap && !editorPreview) {
              jumlahTamuWrap.style.display = '';
            }
            if (jumlahTamuSelect) jumlahTamuSelect.value = String(jumlahTamu);
            setError(
              (json && json.data && json.data.message) ||
              cardMsg('data-msg-submit-fail', 'Gagal mengirim ucapan.')
            );
            setLive('');
            return;
          }

          // Ganti item optimistik dengan HTML asli dari server
          if (optimistic && json.data && json.data.html) {
            optimistic.outerHTML = json.data.html;
            applyAvatar(wrap);
          } else if (wrap && json.data && json.data.html && list) {
            if (optimistic) optimistic.remove();
            list.insertAdjacentHTML('afterbegin', json.data.html);
            applyAvatar(wrap);
          }

          // Jika server kirim link WA dan fitur aktif → popup/buka WA
          if (json.data && json.data.wa_link && sendWa) {
            if (popupEnabled) {
              showWaPopup(card, json.data.wa_link);
            } else {
              window.open(json.data.wa_link, '_blank');
            }
          }

          if (json.data && json.data.counts) {
            updateRsvpStats(card, json.data.counts);
          }

          setLive(cardMsg('data-msg-success', 'Terima kasih, ucapan kamu sudah terkirim.'), false);

          // HTML halaman 1 di cache pager masih versi sebelum submit.
          if (pageHtmlCache) {
            Object.keys(pageHtmlCache).forEach(function (k) {
              delete pageHtmlCache[k];
            });
            if (wrap && wrap.innerHTML) {
              pageHtmlCache['1'] = wrap.innerHTML;
              currentPage = 1;
            }
          }
        })
        .catch(function (e) {
          console.error('[NIKU_RSVP] AJAX error', e);
          var optimistic = list ? list.querySelector('[data-optimistic="1"]') : null;
          if (optimistic) optimistic.remove();
          if (nameInput) nameInput.value = savedAuthor;
          if (msgInput) msgInput.value = savedContent;
          hadirVal = savedHadir;
          savedPills.forEach(function (p) {
            p.el.dataset.active = p.active;
          });
          if (showJumlahTamu && savedHadir === 'hadir' && jumlahTamuWrap && !editorPreview) {
            jumlahTamuWrap.style.display = '';
          }
          if (jumlahTamuSelect) jumlahTamuSelect.value = String(jumlahTamu);
          setError(cardMsg('data-msg-connection', 'Terjadi kesalahan koneksi. Coba lagi.'));
          setLive('');
        })
        .finally(function () {
          if (wrap) wrap.dataset.loading = '0';
          sendBtn.disabled = false;
          sendBtn.classList.remove('is-loading');
        });

    }

    // Klik tombol kirim
    if (sendBtn) {
      sendBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        submit();
      });
    }

    // Enter di input nama memicu submit (textarea: Enter = baris baru)
    if (msgInput) {
      msgInput.addEventListener('beforeinput', function (e) {
        if (!e || !e.inputType) return;

        var incoming = typeof e.data === 'string' ? e.data : '';
        var start = msgInput.selectionStart;
        var end = msgInput.selectionEnd;
        if (start == null || end == null) return;

        var nextLen = msgInput.value.length - (end - start) + incoming.length;
        if (nextLen <= msgMaxLen) return;

        if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') {
          msgInput.__niku_rsvp_paste_overflow = true;
          return;
        }

        if (incoming !== '' && e.inputType.indexOf('insert') === 0) {
          setMsgError(cardMsg('data-msg-content-max', 'Ucapan maksimal 1000 karakter.'));
        }
      });

      msgInput.addEventListener('input', function () {
        enforceMsgLength(!!msgInput.__niku_rsvp_paste_overflow);
        msgInput.__niku_rsvp_paste_overflow = false;
      });
    }

    if (nameInput) {
      nameInput.addEventListener('keydown', function(e){
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    }

    // =================================================================
    // Pagination (warm prefetch + cache + abort + fade-in)
    // =================================================================
    if (wrap) {
      // Cache HTML per halaman (memory)
      var pageHtmlCache = Object.create(null);  // key: "page" -> html
      var prefetching   = Object.create(null);  // key: "page" -> Promise
      var pagerCtl      = null;
      var currentPage   = 1;

      // Simpan HTML awal sebagai page 1 (instan untuk kembali ke page 1)
      if (wrap.innerHTML) {
        pageHtmlCache[String(currentPage)] = wrap.innerHTML;
      }

      var listWrap = qs(card, '.rsvp-list-wrap');

      // Fade-in: hanya animasi saat konten sudah diganti (tanpa fade-out/loading)
      function fadeInList() {
        if (!listWrap) return;
        listWrap.classList.remove('is-fade-in');
        // force reflow biar animasi restart
        void listWrap.offsetWidth;
        listWrap.classList.add('is-fade-in');
      }

      function fetchPage(page, abortable) {
        var payload = {
          action: 'niku_rsvp_page',
          nonce: NIKU_RSVP.nonce || '',
          post_id: postId,
          page: page,
          per_page: perPage
        };

        // Abort request lama kalau user klik cepat
        var signal = undefined;
        if (abortable && typeof AbortController !== 'undefined') {
          if (pagerCtl) {
            try { pagerCtl.abort(); } catch (e) {}
          }
          pagerCtl = new AbortController();
          signal = pagerCtl.signal;
        }

        return fetch(NIKU_RSVP.ajax_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          body: serialize(payload),
          signal: signal
        })
          .then(function (res) {
            return res.json().catch(function () {
              return { success: false, data: { message: cardMsg('data-msg-invalid-response', 'Respon tidak valid.') } };
            });
          })
          .then(function (json) {
            if (!json || !json.success || !json.data || !json.data.html) {
              var msg = (json && json.data && json.data.message) ? json.data.message : cardMsg('data-msg-page-fail', 'Gagal memuat halaman.');
              throw new Error(msg);
            }
            return json.data.html;
          });
      }

      function prefetchPage(page) {
        if (!hasAjaxConfig) return Promise.resolve(null);

        page = parseInt(page || '0', 10);
        if (!page || page < 1) return Promise.resolve(null);

        var key = String(page);
        if (pageHtmlCache[key]) return Promise.resolve(pageHtmlCache[key]);
        if (prefetching[key]) return prefetching[key];

        prefetching[key] = fetchPage(page, false)
          .then(function (html) {
            if (html) pageHtmlCache[key] = html;
            return html || null;
          })
          .catch(function () {
            return null; // silent
          })
          .finally(function () {
            delete prefetching[key];
          });

        return prefetching[key];
      }

      function warmPrefetchInitial() {
        // Prefetch 2 halaman depan supaya klik pertama terasa cepat
        prefetchPage(currentPage + 1);
        prefetchPage(currentPage + 2);
      }

      function warmPrefetchAround(page) {
        // Prefetch tetangga (next/prev) agar klik selanjutnya instan
        prefetchPage(page + 1);
        prefetchPage(page - 1);
      }

      // Warm prefetch secepat mungkin setelah widget muncul
      if (hasAjaxConfig) {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(function () { warmPrefetchInitial(); }, { timeout: 800 });
        } else {
          setTimeout(warmPrefetchInitial, 120);
        }
      }

      // Hover/touchstart prefetch (user biasanya arahkan mouse dulu sebelum klik)
      wrap.addEventListener('mouseover', function (ev) {
        var btn = ev.target.closest('[data-rsvp-page]');
        if (!btn || btn.classList.contains('disabled')) return;
        var page = parseInt(btn.getAttribute('data-rsvp-page') || '1', 10);
        if (!page || page < 1) return;
        prefetchPage(page);
      });

      wrap.addEventListener('touchstart', function (ev) {
        var btn = ev.target.closest('[data-rsvp-page]');
        if (!btn || btn.classList.contains('disabled')) return;
        var page = parseInt(btn.getAttribute('data-rsvp-page') || '1', 10);
        if (!page || page < 1) return;
        prefetchPage(page);
      }, { passive: true });

      // Click pagination
      wrap.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-rsvp-page]');
        if (!btn || btn.classList.contains('disabled')) return;

        ev.preventDefault();

        if (!hasAjaxConfig) {
          return; // di editor atau tanpa config: biarkan statis
        }

        var page = parseInt(btn.getAttribute('data-rsvp-page') || '1', 10);
        if (!page || page < 1) return;

        var key = String(page);

        // 1) Cache hit → instan
        if (pageHtmlCache[key]) {
          wrap.innerHTML = pageHtmlCache[key];
          applyAvatar(wrap);
          fadeInList();
          warmPrefetchAround(page);
          return;
        }

        // 2) Jika sedang diprefetch → tunggu (biasanya lebih cepat dari mulai dari nol)
        if (prefetching[key]) {
          prefetching[key].then(function (html) {
            if (!html) return;
            wrap.innerHTML = html;
            applyAvatar(wrap);
            fadeInList();
            warmPrefetchAround(page);
          });
          return;
        }

        // 3) Fetch normal (abortable)
        fetchPage(page, true)
          .then(function (html) {
            pageHtmlCache[key] = html;
            wrap.innerHTML = html;
            applyAvatar(wrap);
            fadeInList();
            warmPrefetchAround(page);
          })
          .catch(function (e) {
            // AbortError jangan dianggap error
            if (e && (e.name === 'AbortError' || String(e).indexOf('AbortError') !== -1)) return;
            console.error('[NIKU_RSVP] Pager error', e);
            setLive(e && e.message ? e.message : cardMsg('data-msg-connection', 'Terjadi kesalahan koneksi. Coba lagi.'), true);
          })
          .finally(function () {
            pagerCtl = null;
          });
      });
    }
  }

// =====================================================================
  // Init semua card di halaman
  // =====================================================================
  function initAll() {
    qsa(d, '.rsvp-card').forEach(initCard);
  }

  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // =====================================================================
  // Hook untuk Elementor editor (nama harus cocok dengan get_name(): niku-rsvp)
  // =====================================================================
  if (w.elementorFrontend && w.elementorFrontend.hooks) {
    w.elementorFrontend.hooks.addAction(
      'frontend/element_ready/niku-rsvp.default',
      function ($element) {
        var el = $element[0] || $element;
        var card = el.querySelector('.rsvp-card');
        if (card) initCard(card);
      }
    );
  }
})();