(function(){
  // Bisdev Pro: moved from includes/front/footer-scripts.php
  if (window.__IDB_FOOTER_CLEANUP_LOADED) return;
  window.__IDB_FOOTER_CLEANUP_LOADED = true;

document.addEventListener('DOMContentLoaded', function () {
// === DETEKSI EDITOR ELEMENTOR (ketat & aman untuk PREVIEW) ===
function isElementorEditing() {
  try {
    const qs = new URLSearchParams(location.search);

    // 1) Preview WordPress biasa → BUKAN editor
    if (qs.get('preview') === 'true') return false;

    // 2) Halaman "elementor-preview" (iframe konten saat builder)
    //    Anggap editor HANYA jika parent benar2 editor aktif
    if (qs.has('elementor-preview')) {
      if (window.parent && window.parent !== window) {
        const pd = window.parent.document;
        if (pd?.body?.classList?.contains('elementor-editor-active')) return true;
        if (window.parent.elementorFrontend?.isEditMode?.() === true) return true;
      }
      return false; // bukan di dalam builder → perlakukan seperti front-end
    }

    // 3) Sisa cek standar builder
    if (window.elementorFrontend?.isEditMode?.() === true) return true;
    if (document.body.classList.contains('elementor-editor-active')) return true;
    if (/\baction=elementor\b/i.test(location.search)) return true;

    // 4) (Opsional) jika halaman ditampilkan DI DALAM jendela builder
    if (window.parent && window.parent !== window) {
      const pd = window.parent.document;
      if (pd?.body?.classList?.contains('elementor-editor-active')) return true;
      if (/\baction=elementor\b/i.test(window.parent.location.search)) return true;
      if (window.parent.elementorFrontend?.isEditMode?.() === true) return true;
    }
  } catch (e) { /* cross-origin: anggap bukan editor */ }

  return false;
}

  if (isElementorEditing()) {
    console.log('[cleanup] Mode Elementor editor terdeteksi → cleanup dimatikan.');
    return; // hentikan seluruh cleanup
  }

  /** Hide cover/awal/akhir/mempelai section — dipanggil sering (Elementor inject DOM bertahap). */
  function hideEmptyBisdevPhotoSectionContainers() {
    if (!document.getElementById('idb-sd-hide-empty-photo-style')) {
      var st = document.createElement('style');
      st.id = 'idb-sd-hide-empty-photo-style';
      st.textContent = '.idb-sd-hide-empty-photo{display:none!important}';
      document.head.appendChild(st);
    }
    var pairs = [
      ['.cover-section', '.idb-bisdev-foto--auto.idb-bisdev-foto--slot-cover.idb-bisdev-foto--slot-db-empty'],
      ['.awal-section', '.idb-bisdev-foto--auto.idb-bisdev-foto--slot-opening.idb-bisdev-foto--slot-db-empty'],
      ['.akhir-section', '.idb-bisdev-foto--auto.idb-bisdev-foto--slot-closing.idb-bisdev-foto--slot-db-empty'],
      ['.mempelai-section', '.idb-bisdev-foto--auto.idb-bisdev-foto--slot-mempelai1.idb-bisdev-foto--slot-db-empty'],
      ['.mempelai-section', '.idb-bisdev-foto--auto.idb-bisdev-foto--slot-mempelai2.idb-bisdev-foto--slot-db-empty'],
    ];
    var seen = new Set();
    pairs.forEach(function (p) {
      document.querySelectorAll(p[0]).forEach(function (el) {
        seen.add(el);
      });
    });
    seen.forEach(function (el) {
      el.classList.remove('idb-sd-hide-empty-photo');
    });
    pairs.forEach(function (p) {
      document.querySelectorAll(p[0]).forEach(function (wrap) {
        if (wrap.querySelector(p[1])) wrap.classList.add('idb-sd-hide-empty-photo');
      });
    });

    var body = document.body;
    if (body && body.classList) {
      if (body.classList.contains('idb-slot-empty-cover')) {
        document.querySelectorAll('.cover-section').forEach(function (el) {
          el.classList.add('idb-sd-hide-empty-photo');
        });
      }
      if (body.classList.contains('idb-slot-empty-opening')) {
        document.querySelectorAll('.awal-section').forEach(function (el) {
          el.classList.add('idb-sd-hide-empty-photo');
        });
      }
      if (body.classList.contains('idb-slot-empty-closing')) {
        document.querySelectorAll('.akhir-section').forEach(function (el) {
          el.classList.add('idb-sd-hide-empty-photo');
        });
      }
      if (body.classList.contains('idb-slot-empty-mempelai1')) {
        document.querySelectorAll('.mempelai-section').forEach(function (el) {
          if (el.querySelector('.idb-bisdev-foto--auto.idb-bisdev-foto--slot-mempelai1')) el.classList.add('idb-sd-hide-empty-photo');
        });
      }
      if (body.classList.contains('idb-slot-empty-mempelai2')) {
        document.querySelectorAll('.mempelai-section').forEach(function (el) {
          if (el.querySelector('.idb-bisdev-foto--auto.idb-bisdev-foto--slot-mempelai2')) el.classList.add('idb-sd-hide-empty-photo');
        });
      }
    }
  }

  window.idbApplyPhotoSectionHides = hideEmptyBisdevPhotoSectionContainers;

  function schedulePhotoSectionHides() {
    hideEmptyBisdevPhotoSectionContainers();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () {
        hideEmptyBisdevPhotoSectionContainers();
        requestAnimationFrame(function () {
          hideEmptyBisdevPhotoSectionContainers();
        });
      });
    }
    [24, 72, 150, 300, 600, 1200, 2400].forEach(function (ms) {
      setTimeout(hideEmptyBisdevPhotoSectionContainers, ms);
    });
  }

  schedulePhotoSectionHides();

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) schedulePhotoSectionHides();
  });

  var _idbPhotoHideMoTimer;
  var _idbPhotoHideMo = new MutationObserver(function (mutations) {
    if (!mutations.some(function (m) { return (m.addedNodes && m.addedNodes.length) || (m.removedNodes && m.removedNodes.length); })) return;
    clearTimeout(_idbPhotoHideMoTimer);
    _idbPhotoHideMoTimer = setTimeout(hideEmptyBisdevPhotoSectionContainers, 0);
  });
  if (document.body) {
    _idbPhotoHideMo.observe(document.body, { childList: true, subtree: true });
  }

  // Utility batch remove
  function batchRemove(elements) {
    if (elements.length) {
      requestAnimationFrame(() => elements.forEach(el => el.remove()));
    }
  }

  // Canonical placeholder/empty detectors (dipakai lintas-cleanup agar konsisten)
  const IDB_EMPTY_VALUE_RE = /^(?:not\s*found\.?|n\/a|null|undefined|tidak\s*tersedia|[-—–])$/i;
  const IDB_EMPTY_TOKEN_RE = /\b(?:not\s*found|null|undefined|tidak\s*tersedia)\b|(?:^|\s)n\/a(?:\s|$)|^\s*[-—–]\s*$/i;
  function idbNormText(text) {
    return String(text || '').replace(/\s+/g, ' ').replace(/&nbsp;/gi, ' ').trim();
  }
  function idbIsBlankText(text) {
    const t = idbNormText(text);
    return !t || IDB_EMPTY_VALUE_RE.test(t);
  }
  function idbHasPlaceholderToken(text) {
    return IDB_EMPTY_TOKEN_RE.test(idbNormText(text));
  }
  
  // --- helper teks ---
function _normText(el){
  return idbNormText(el?.textContent || '');
}
function _isPlaceHolder(t){
  return idbIsBlankText(t);
}

// --- apakah section punya deskripsi valid? ---
function _sectionHasDeskripsi(sectionEl){
  if(!sectionEl) return false;
  const nodes = sectionEl.querySelectorAll(
    '.elementor-image-box-description, .elementor-widget-text-editor'
  );
  for(const n of nodes){
    const t = _normText(n);
    if (t && !_isPlaceHolder(t)) return true;
  }
  return false;
}

// --- tag spacer/divider di ls-section yang harus dipertahankan ---
function markLsSectionSpacersByDeskripsi(){
  document.querySelectorAll('.ls-section').forEach(section=>{
    const keep = _sectionHasDeskripsi(section);
    const spacers = section.querySelectorAll('.elementor-widget-spacer, .elementor-widget-divider');
    spacers.forEach(sp => {
      if (keep) sp.setAttribute('data-keep','1'); else sp.removeAttribute('data-keep');
    });
  });
}

  
  // ✅ Tambahkan helper ini DI SINI (global di dalam blok <script> / DOMContentLoaded)
    function isDivOrSpace(el){
      return !!(el && el.classList &&
        (el.classList.contains('elementor-widget-divider') ||
         el.classList.contains('elementor-widget-spacer')));
    }
  

// 1. Hapus semua tombol lokasi-btn kosong / invalid (kebal "Not Found.")
function removeButtonsLokasiIfEmpty() {
  const toRemove = [];
  const seen = new Set();

  const isBadHref = (hrefRaw) => {
    const h = (hrefRaw || '').trim();

    if (!h) return true;

    const l = h.toLowerCase();

    // Placeholder umum + pola "Not Found"
    if (
      l === '#' || l === '-' || l === 'null' || l === 'javascript:void(0)' ||
      l.includes('not%20found') || l.includes('not found') ||
      l === 'http://not%20found.' || l === 'https://not%20found.' ||
      l === 'http://not found.' || l === 'https://not found.'
    ) return true;

    // URL tidak valid (throw saat diparse)
    try {
      const u = new URL(h);
      if (!u.hostname) return true;
      // optional: kalau mau ketat hanya izinkan domain peta
      // if (!/maps\.google\.|goo\.gl\/maps|waze\.com\/ul/i.test(l)) return true;
    } catch (e) {
      return true;
    }

    return false;
  };

  // Ambil semua kandidat tombol: yang diberi class khusus ATAU teks "Lihat Lokasi"
  const candidates = document.querySelectorAll(
    '.lokasi-btn, .elementor-widget-button a.elementor-button'
  );

  candidates.forEach(node => {
    const linkEl = node.tagName === 'A'
      ? node
      : node.querySelector('a, [role="link"], [role="button"]');

    if (!linkEl) return;

    const text = (linkEl.textContent || linkEl.getAttribute('aria-label') || '').trim();
    const isLokasiBtn = node.classList.contains('lokasi-btn') || /lihat lokasi/i.test(text);

    if (!isLokasiBtn) return; // jangan ganggu tombol lain

    const href = linkEl.getAttribute('href') || '';

    if (isBadHref(href)) {
      // Hapus wrapper widget button jika ada, fallback ke .elementor-widget, terakhir anchor itu sendiri
      const wrapper =
        linkEl.closest('.elementor-widget-button') ||
        linkEl.closest('.elementor-widget') ||
        linkEl;

      if (wrapper && !seen.has(wrapper)) {
        seen.add(wrapper);
        toRemove.push(wrapper);
      }
    }
  });

  // Eksekusi penghapusan dalam batch agar aman terhadap reflow
  requestAnimationFrame(() => {
    toRemove.forEach(el => el.remove());
  });
}



  // 2. Hapus social widget kosong
// ====== Social widget cleaner ======
function isInvalidSocialHref(hrefRaw){
  var s = (hrefRaw || '').trim();

  // decode dan normalisasi
  try { s = decodeURIComponent(s); } catch(e) {}
  s = s.replace(/\s+/g, ' ').trim().toLowerCase();
  // buang skema & www
  s = s.replace(/^(https?:)?\/\/(www\.)?/, '');

  // aturan invalid
  if (!s) return true;                       // kosong
  if (s === '#' || s === '-' || s === '0') return true;
  if (s === 'null' || s === 'undefined') return true;
  if (/^javascript:/.test(s)) return true;
  if (/^mailto:\s*$/i.test(hrefRaw || '')) return true; // mailto kosong
  if (/^tel:\s*$/i.test(hrefRaw || '')) return true;    // tel kosong
  if (/^[\.\-]+$/.test(s)) return true;

  // placeholder umum (id/en)
  if (s.indexOf('not found') !== -1) return true;
  if (s.indexOf('tidak tersedia') !== -1) return true;
  if (s.indexOf('coming soon') !== -1) return true;
  if (s.indexOf('kosong') !== -1) return true;

  return false;
}

function cleanSocialWidgets() {
  document.querySelectorAll('.elementor-widget-social-icons').forEach(function(widget){
    var items = Array.from(widget.querySelectorAll('.elementor-social-icons-wrapper .elementor-grid-item'));
    var anyValid = false;

    items.forEach(function(item){
      var a = item.querySelector('a');
      var href = a ? a.getAttribute('href') : '';
      if (!a || isInvalidSocialHref(href)) {
        item.remove(); // buang icon yang invalid
      } else {
        anyValid = true;
      }
    });

    // jika semua icon terhapus → hapus widget-nya
    if (!anyValid) {
      widget.remove();
    }
  });
}


  // 3. Hapus HTML widget kosong
  function removeEmptyHTMLWidgets() {
    const toRemove = [];
    document.querySelectorAll('.elementor-widget-html').forEach(widget => {
      const container = widget.querySelector('.elementor-widget-container');
      if (!container) return;
      const html = container.innerHTML.replace(/<!--.*?-->/g, '').trim();
      if (!html) toRemove.push(widget);
    });
    batchRemove(toRemove);
  }

// 4) Hapus SELURUH .acara-con di FRONTEND jika nama_acara kosong/null/tidak ada
function removeAcaraContainerIfEmpty() {
  const toRemove = [];

  document.querySelectorAll('.acara-con').forEach(container => {
    // cari marker yg dibungkus dari shortcode
    const marker = container.querySelector('.nama-acara-marker');

    // jika marker tidak ada → kontainer ini tidak punya nama_acara → hapus
    if (!marker) {
      toRemove.push(container);
      return;
    }

    // jika marker ada tapi teks kosong / error → hapus
    const nameText = idbNormText(marker.textContent || '');
    if (idbIsBlankText(nameText)) {
      toRemove.push(container);
      return;
    }

    // kalau ada teks valid → biarkan
  });

  batchRemove(toRemove);
}

  
  // 5. Hapus widget heading waktu_acara jika kosong atau masih shortcode
function removeWaktuAcaraIfEmpty() {
  const toRemove = [];

  document.querySelectorAll('.elementor-widget-heading, .elementor-widget-text-editor').forEach(widget => {
    const container = widget.querySelector('.elementor-widget-container');
    if (!container) return;

    const rawHTML = container.innerHTML.toLowerCase();
    const cleanText = idbNormText(container.textContent || '').toLowerCase();

    // Cek apakah widget memang untuk waktu_acara (shortcode)
    const isWidgetForWaktuAcara = /\[wedding_info\s+field=["']waktu_acara["']/i.test(rawHTML);

    // Label waktu yang valid:
    // - "pukul ..." (ID)
    // - "at ..."    (EN, harus diikuti spasi/colon agar "Atuwa" tidak ikut)
    const isPukulOrAt =
      /^pukul(?:\s|:|$)/i.test(cleanText) ||
      /^at(?:\s|:|$)/i.test(cleanText);

    // Apakah isi teks mencurigakan (error-like)
    const isErrorOutput = idbHasPlaceholderToken(cleanText);

const isBebas = /\bbebas\b/i.test(cleanText);
const isTooShort = (cleanText.length < 8) && !isBebas; // "Bebas" dianggap valid
const hasClockValue = /\d{1,2}\s*[:.]\s*\d{1,2}|\d/.test(cleanText);
const shouldRemove =
  (isWidgetForWaktuAcara && (isErrorOutput || isTooShort)) ||
  (isPukulOrAt && hasClockValue && (isErrorOutput || isTooShort));

    if (shouldRemove) {
      toRemove.push(widget);
    }
  });

  batchRemove(toRemove);
}


  // 6. Hapus widget tempat_acara jika kosong atau masih shortcode
function removeTempatAcaraIfEmpty() {
  const toRemove = [];

  document.querySelectorAll('.elementor-widget-heading, .elementor-widget-text-editor').forEach(widget => {
    const container = widget.querySelector('.elementor-widget-container');
    if (!container) return;

    const rawHTML = container.innerHTML.toLowerCase();
    const cleanText = idbNormText(container.textContent || '').toLowerCase();

    // Apakah ini widget untuk [wedding_info field="tempat_acara"]
    const isTempatAcaraShortcode = /\[wedding_info\s+field=["']tempat_acara["']/i.test(rawHTML);

    // Deteksi label lokasi yang umum
    const labelKeywords = ['tempat', 'alamat', 'address', 'location'];
    const startsWithLabel = labelKeywords.some(label => cleanText.startsWith(label));

    // Deteksi kalau output error
    const isErrorOutput = idbHasPlaceholderToken(cleanText);

    // Terlalu pendek → misalnya cuma "tempat :", atau "alamat :"
    const isTooShort = cleanText.length < 10;

    const shouldRemove =
      (isTempatAcaraShortcode && (isErrorOutput || isTooShort)) ||
      (startsWithLabel && (isErrorOutput || isTooShort));

    if (shouldRemove) {
      toRemove.push(widget);
    }
  });

  batchRemove(toRemove);
}


// 7. Kosongkan SEMUA isi .ls-con jika deskripsi_ls kosong/null
function removeLoveStoryContainersIfEmpty() {
  // Fallback deteksi shortcode bila marker PHP belum aktif di beberapa halaman
  const shortcodeRegex = /\[wedding_info\s+field=["']deskripsi_ls["']\s+ls_index=["']\d+["']\]/i;

  // Kata-kata error / kosong yang valid untuk dianggap "tidak ada konten"
  // Helper: widget dianggap "trivial" bila benar-benar tidak ada nilai konten
  function isTrivialWidget(widget) {
    if (!widget) return true;

    // widget structural
    if (
      widget.classList.contains('elementor-widget-divider') ||
      widget.classList.contains('elementor-widget-spacer')
    ) return true;

    const box = widget.querySelector('.elementor-widget-container') || widget;
    const raw = box.innerHTML || '';
    const txt = idbNormText(box.textContent || '');

    // Ada media berarti bukan trivial
    if (/<(img|iframe|video|audio|picture|svg)\b/i.test(raw)) return false;

    // Kosong beneran
    if (idbIsBlankText(txt)) return true;

    // Dilunakkan: jangan anggap heading pendek otomatis trivial
    if (widget.classList.contains('elementor-widget-heading')) {
      // Hanya heading super pendek (<= 10) yang bisa dianggap trivial
      if (txt.length <= 10) return true;
      return false;
    }

    // Dilunakkan: text-editor
    if (widget.classList.contains('elementor-widget-text-editor')) {
      const words = txt.split(' ').filter(Boolean).length;
      // Dulu: words <= 3 && txt.length <= 24 → TERLALU AGRESIF
      // Sekarang: benar-benar sangat pendek saja yang dianggap trivial
      if (words === 0 || txt.length <= 2) return true;
      return false;
    }

    // Default: bukan trivial
    return false;
  }

  document.querySelectorAll('.ls-con').forEach(container => {
    let foundDeskripsi = false;
    let deskripsiEmpty = false;

    // 1) PRIORITAS: marker hasil patch PHP
    const marker = container.querySelector('.deskripsi-ls-marker');
    if (marker) {
      foundDeskripsi = true;
      const markerText = idbNormText(marker.textContent || '');
      if (idbIsBlankText(markerText)) {
        deskripsiEmpty = true;
      }
    }

    // 2) FALLBACK: deteksi berbasis shortcode (kalau marker tidak ada)
    if (!foundDeskripsi) {
      const textish = container.querySelectorAll(
        '.elementor-widget-text-editor, .elementor-widget-heading, .elementor-widget-heading :is(h1,h2,h3,h4,h5,h6)'
      );

      textish.forEach(el => {
        const widget = el.closest('.elementor-widget') || el;
        const box = widget.querySelector('.elementor-widget-container') || widget;
        const html = box.innerHTML || '';
        const text = idbNormText(box.textContent || '');

        // Jika widget ini memuat deskripsi_ls (sebagai shortcode atau hasil render)
        if (shortcodeRegex.test(html) || shortcodeRegex.test(text)) {
          foundDeskripsi = true;
          // PENTING: untuk deskripsi_ls, JANGAN pakai isTrivialWidget
          if (idbIsBlankText(text)) {
            deskripsiEmpty = true;
          }
        }
      });
    }

    // 3) Tidak ditemukan marker/shortcode → nilai agregat: semua widget trivial?
    if (!foundDeskripsi) {
      const widgets = Array.from(container.querySelectorAll('.elementor-widget'));
      const allTrivial = widgets.length > 0 && widgets.every(isTrivialWidget);
      if (allTrivial) deskripsiEmpty = true;
    }

    // 4) Eksekusi penghapusan bila benar-benar kosong
    if (deskripsiEmpty) {
      // 🔒 Bersihkan spacer/divider yang HANYA DI DALAM .ls-con
container
  .querySelectorAll('.elementor-widget-divider, .elementor-widget-spacer')
  .forEach(el => { if (!el.hasAttribute('data-keep')) el.remove(); });

      // Lalu hapus .ls-con itu sendiri
      container.remove();
      // ❌ Tidak menyentuh elemen di luar .ls-con
    }
  });
}

// Hanya singkirkan judul Love Story yang kosong/invalid, biarkan deskripsi tetap tampil
function hideLoveStoryTitlesIfBlank() {
  document.querySelectorAll('.ls-con').forEach(container => {
    const candidates = container.querySelectorAll(
      '.elementor-widget-heading .elementor-heading-title, ' +
      '.elementor-widget-heading h1, .elementor-widget-heading h2, .elementor-widget-heading h3, ' +
      '.elementor-widget-heading h4, .elementor-widget-heading h5, .elementor-widget-heading h6, ' +
      '.elementor-widget-text-editor, ' +
      '.elementor-widget-image-box .elementor-image-box-title'
    );

    candidates.forEach(el => {
      const rawHTML = (el.innerHTML || '').trim();
      const text    = idbNormText(el.textContent || '');

      const isImageBoxTitle  = el.classList?.contains('elementor-image-box-title');
      const isJudulShortcode = /\[wedding_info\s+field=["']judul_ls["']/i.test(rawHTML);
      const treatAsJudul = isJudulShortcode || isImageBoxTitle;

      if (!treatAsJudul) return;

      const isBlank = idbIsBlankText(text);
      if (!isBlank) return;

      const widget  = el.closest('.elementor-widget') || el;
      const section = widget.closest('.ls-section');
      const keepSpacer = _sectionHasDeskripsi(section);

      // Jika section masih punya deskripsi → JANGAN trim spacer
      if (!keepSpacer) {
        _removeDividerSpacerAround(widget);
      }

      // Hapus hanya judulnya
      if (isImageBoxTitle) {
        el.remove();               // h3 image-box title
      } else {
        widget.remove();           // widget heading/text-editor yang berisi judul
      }
    });
  });
}


// 8) Hapus SELURUH .stream-con di FRONTEND jika link_streaming kosong/invalid
function removeStreamContainersIfEmpty() {
  // Di editor: jangan hapus; cukup matikan klik supaya tidak kabur dari canvas
  if (typeof isElementorEditing === 'function' && isElementorEditing()) {
    document.querySelectorAll('.stream-con a').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
      a.style.pointerEvents = 'none';
    });
    return;
  }

  const isBadHref = (hrefRaw) => {
    const h = (hrefRaw || '').trim();
    if (!h) return true;
    const l = h.toLowerCase();
    // placeholder & pola "Not Found."
    if (
      l === '#' || l === '-' || l === 'null' || l === 'undefined' ||
      l === 'http://not%20found.' || l === 'https://not%20found.' ||
      l.includes('not%20found') || l.includes('not found') ||
      l.includes('tidak%20tersedia')
    ) return true;
    try {
      const u = new URL(h);
      if (!u.hostname) return true;
    } catch (e) {
      return true;
    }
    return false;
  };

  const toRemove = [];

  document.querySelectorAll('.stream-con').forEach(container => {
    // 1) Prioritas: marker dari shortcode (jika dipakai di Text Editor)
    const marker = container.querySelector('.link-streaming-marker');

    if (marker) {
      const a = marker.querySelector('a'); // kalau format=link
      const raw = a ? (a.getAttribute('href') || '').trim()
                    : (marker.textContent || '').replace(/\s+/g,' ').replace(/&nbsp;/gi,' ').trim();

      const invalid = (raw.length < 5) || idbHasPlaceholderToken(raw) || isBadHref(raw);
      if (invalid) {
        toRemove.push(container);
      }
      return; // sudah divalidasi via marker
    }

    // 2) Fallback (tanpa marker): cek semua <a> di dalam .stream-con (termasuk tombol Elementor)
    const links = Array.from(container.querySelectorAll('a'));
    if (links.length === 0) { // tidak ada link sama sekali
      toRemove.push(container);
      return;
    }

    // anggap valid jika ADA minimal satu link dengan href yang baik
    const hasValid = links.some(a => !isBadHref(a.getAttribute('href') || ''));
    if (!hasValid) {
      toRemove.push(container);
    }
  });

  // ✅ Hapus batch (tanpa naik DOM)
  batchRemove(toRemove);
}


// 12. Hapus .ls-section jika di dalamnya TIDAK ada .ls-con (dinamis)
function removeLsSectionIfEmpty() {
  if (typeof isElementorEditing === 'function' && isElementorEditing()) return;

  const toRemove = [];

  document.querySelectorAll('.ls-section').forEach(container => {
    const hasLsCon = !!container.querySelector('.ls-con');
    if (!hasLsCon) {
      toRemove.push(container);
    }
  });

  batchRemove(toRemove);
}

// 12b) Sembunyikan section bila customer mematikan switch (class HIDE)
function removeLoveStorySectionWhenDisabled() {
  if (typeof isElementorEditing === 'function' && isElementorEditing()) return;
  if (!document.body.classList.contains('idb-hide-love-story')) return;

  const toRemove = [];
  document.querySelectorAll('.ls-section').forEach(section => {
    toRemove.push(section);
  });
  batchRemove(toRemove);
}

function removeWeddingGiftSectionWhenDisabled() {
  if (typeof isElementorEditing === 'function' && isElementorEditing()) return;
  if (!document.body.classList.contains('idb-hide-wedding-gift')) return;
  const toRemove = [];
  document.querySelectorAll('.gift-con').forEach(el => toRemove.push(el));
  batchRemove(toRemove);
}

function removeKirimHadiahSectionWhenDisabled() {
  if (typeof isElementorEditing === 'function' && isElementorEditing()) return;
  if (!document.body.classList.contains('idb-hide-kirim-hadiah')) return;
  const toRemove = [];
  document.querySelectorAll('.kh-con').forEach(el => toRemove.push(el));
  batchRemove(toRemove);
}

function removeLiveStreamingSectionWhenDisabled() {
  if (typeof isElementorEditing === 'function' && isElementorEditing()) return;
  if (!document.body.classList.contains('idb-hide-live-streaming')) return;
  const toRemove = [];
  document.querySelectorAll('.stream-con').forEach(el => toRemove.push(el));
  batchRemove(toRemove);
}

// 13) Hapus .galeri-section jika galeri foto & video YouTube sama-sama kosong
function removeGaleriSectionIfEmpty() {
  if (typeof isElementorEditing === 'function' && isElementorEditing()) return;

  const toRemove = [];
  const hideGalleryTitleIfExists = (section) => {
    const headingSelector = [
      '.elementor-widget-heading',
      '.elementor-widget-text-editor',
      '.elementor-heading-title',
      '.elementor-widget-container'
    ].join(', ');
    section.querySelectorAll(headingSelector).forEach((el) => {
      const text = String(el.textContent || '').trim().toLowerCase();
      if (!text) return;
      if (text === 'galeri foto' || text === 'photo gallery') {
        const widget = el.classList?.contains('elementor-widget')
          ? el
          : el.closest('.elementor-widget');
        if (widget) {
          widget.style.display = 'none';
        } else {
          el.style.display = 'none';
        }
      }
    });
  };

  document.querySelectorAll('.galeri-section').forEach(section => {
    // 1) Cek item galeri (Elementor Gallery + Bisdev Gallery V2)
    const hasAnyItem = !!section.querySelector(
      '.idb-gallery .elementor-gallery-item, .idb-gallery .idb-gallery__item'
    );
    if (hasAnyItem) {
      return;
    }

    // 2) Cek konten video YouTube (Elementor Video, iframe langsung, marker shortcode)
    const ytSelector = [
      'iframe[src*="youtube.com"]',
      'iframe[src*="youtu.be"]',
      'iframe[src*="youtube-nocookie.com"]',
      '.elementor-widget-video iframe[src]',
      '.elementor-widget-video video[src]',
      '.link-video-youtube-marker a[href]',
      'a.link-video-youtube-anchor[href]',
    ].join(', ');
    const hasYouTubeNode = !!section.querySelector(ytSelector);

    // Elementor Video sering lazy-init: iframe belum ada saat cleanup awal.
    // Anggap "ada video" jika widget video sudah ada + punya indikasi source YouTube.
    const hasVideoWidgetWithSource = Array.from(section.querySelectorAll('.elementor-widget-video')).some((widget) => {
      const settingsRaw = String(
        widget.getAttribute('data-settings') ||
        widget.dataset?.settings ||
        ''
      );
      const textRaw = String(widget.textContent || '');
      const hasPlayableMarkup = !!widget.querySelector(
        'iframe, video, .elementor-custom-embed-image-overlay, .elementor-custom-embed-play'
      );
      const hasYouTubeHint = /youtube|youtu\.be|youtube-nocookie|link_video_youtube/i.test(settingsRaw + ' ' + textRaw);
      return hasPlayableMarkup || hasYouTubeHint;
    });

    // 3) Fallback teks: jika URL YouTube dirender sebagai teks/shortcode biasa
    const sectionText = String(section.textContent || '');
    const hasYouTubeText = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+/i.test(sectionText);

    const hasVideoOnly = !hasAnyItem && (hasYouTubeNode || hasVideoWidgetWithSource || hasYouTubeText);
    if (hasVideoOnly) {
      hideGalleryTitleIfExists(section);
      return;
    }

    if (!hasYouTubeNode && !hasVideoWidgetWithSource && !hasYouTubeText) {
      toRemove.push(section);
    }
  });

  batchRemove(toRemove);
}

// =====================
// Helpers konsisten
// =====================
function _removeDividerSpacerAround(widget) {
  const prev = widget.previousElementSibling;
  const next = widget.nextElementSibling;
  const isTrim = node => node && (
    (node.classList?.contains('elementor-widget-divider') ||
     node.classList?.contains('elementor-widget-spacer'))
    && !node.hasAttribute('data-keep')       // ⬅️ hormati spacer yang harus dipertahankan
  );
  if (isTrim(prev)) prev.remove();
  if (isTrim(next)) next.remove();
}


// ===========================================
// Jika tidak ada .ls-con tersisa → hapus .ls-section
// ===========================================
function removeEmptyLoveStorySection() {
  document.querySelectorAll('.ls-section').forEach(section => {
    const items = section.querySelectorAll('.ls-con');
    if (!items.length) {
      const widget = section.closest('.elementor-widget') || section;
      _removeDividerSpacerAround(widget);
      widget.remove();
    }
  });
}

// === Rapikan frasa ortu untuk pola inline ===
// Contoh HTML yang dihasilkan editor:
//   ... " dari Bapak " <span class="ortu-marker ayah-marker"...>Anas</span> <br>
//   " & Ibu " <span class="ortu-marker ibu-marker"...>Siti</span>
// === Rapikan frasa ortu untuk pola inline (versi robust) ===
function normalizeInlineParentNames(){
  const hideParentMap = (function () {
    try {
      var raw = document.body.dataset.idbHideParentMap;
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  })();
  const shouldHideParentForMarker = (marker) => {
    if (!marker) {
      return document.body.classList.contains('idb-hide-parent-label');
    }
    if (marker.getAttribute('data-idb-hide-parent') === '1') return true;
    const side = String(marker.getAttribute('data-idb-mempelai-side') || '').toLowerCase();
    if (side && hideParentMap && Object.prototype.hasOwnProperty.call(hideParentMap, side)) {
      return !!hideParentMap[side];
    }
    return document.body.classList.contains('idb-hide-parent-label');
  };

  // Bahasa undangan datang dari _undangan_lang melalui footer-scripts.php.
  // Nama orang tua tidak boleh menjadi language detector: kata seperti "Son" dapat merupakan nama keluarga.
  const inviteLang = String((document.body.dataset && document.body.dataset.idbInviteLang) || 'id')
    .trim()
    .toLowerCase();
  const useEnglishPrep = inviteLang === 'en';
  const isDS   = el => !!(el && el.classList && (el.classList.contains('elementor-widget-divider') || el.classList.contains('elementor-widget-spacer')));
  const textOf = el => idbNormText((el && el.textContent) || '');
  const isBad  = t  => idbIsBlankText(t);

  const textBefore = (node, root) => {
    let s = '';
    for (let n=root.firstChild; n && n!==node; n=n.nextSibling) s += (n.textContent||'');
    return s.replace(/\s+/g,' ').trim();
  };
  // Terjemahkan preposisi statis "dari" → "of" bila undangan berbahasa Inggris (tanpa menyisipkan baru).
  const translatePrepBeforeIfEnglish = (node, useEnglish) => {
    if (!useEnglish || !node) return;
    let p = node.previousSibling;
    while (p && p.nodeType !== 3) p = p.previousSibling;
    if (p && p.nodeType === 3) {
      p.nodeValue = p.nodeValue
        .replace(/\bdari[\u00A0\s]*bapak[\u00A0\s]*$/i, ' of ')
        .replace(/\bdari[\u00A0\s]*$/i, ' of ');
    }
  };

  // "dari/of" hanya menempel ke sisi putra/putri — jangan sisipkan ke blok ayah/ibu murni.
  const hasChildRelWord = (text) => /\b(?:putra|putri|son|daughter|child)\b/i.test(text || '');

  const ensurePrepBefore = (node, root, useEnglish) => {
    if (!node) return;
    const before = textBefore(node, root);
    const hasPrep = /\b(?:dari|of)\b/i.test(before);
    const mayInject = hasChildRelWord(before);
    if (useEnglish) {
      if (hasPrep) {
        translatePrepBeforeIfEnglish(node, true);
      } else if (mayInject) {
        node.before(document.createTextNode('of '));
      }
      return;
    }
    if (hasPrep || !mayInject) return;
    node.before(document.createTextNode('dari '));
    void root;
  };

  const hadLabelBefore = (node, root, word) => new RegExp(`\\b${word}\\b`, 'i').test(textBefore(node, root));
  
// Hapus label teks {word} tepat sebelum marker (mis. "... Bapak " + <span class="ayah-marker">)
const stripLabelRightBefore = (node, word) => {
  if (!node || !node.parentNode) return;
  let p = node.previousSibling;
  while (p && p.nodeType !== 3) { if (p.nodeName === 'BR') return; p = p.previousSibling; }
  if (p && p.nodeType === 3) {
    const re = new RegExp(`\\b${word}[\\u00A0\\s]*$`, 'i'); // spasi biasa / NBSP
    p.nodeValue = p.nodeValue.replace(re, '');
  }
};

// Deteksi gelar di dalam isi marker
const startsWithMr  = node => /^\s*mr\.?\b/i.test((node && node.textContent || '').trim());
const startsWithMrs = node => /^\s*mrs\.?\b/i.test((node && node.textContent || '').trim());

const stripParentLabelsBefore = (node) => {
  if (!node) return;
  stripLabelRightBefore(node, 'Bapak');
  stripLabelRightBefore(node, 'Mr');
  stripLabelRightBefore(node, 'Ibu');
  stripLabelRightBefore(node, 'Mrs');
};


  document.querySelectorAll('.elementor-widget-text-editor').forEach(widget => {
    const box = widget.querySelector('.elementor-widget-container') || widget;

    const ay = box.querySelector('.ayah-marker');
    const ib = box.querySelector('.ibu-marker');
    const hideParentLabel = shouldHideParentForMarker(ay) || shouldHideParentForMarker(ib);
    const hasAy = !!(ay && !isBad(textOf(ay)));
    const hasIb = !!(ib && !isBad(textOf(ib)));
    
// fallback: kalau tidak ada marker sama sekali (kedua nama kosong)
if (!hasAy && !hasIb && !ay && !ib) {
  const htmlMin = (box.innerHTML || '')
    .replace(/<!--.*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const txtMin = (box.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // Baris orang-tua harus mengandung "Putra/Putri" + "dari"
  const looksParent = /\bputr[ai]\b/.test(txtMin) && /\bdari\b/.test(txtMin);

  // ampersand boleh "&" atau "&amp;" atau "dan"
  const AMP = '(?:&(?:amp;)?|dan)';

  // “... dari Bapak <br> & Ibu” (tanpa nama)
  const emptyLabeled = new RegExp(
    'dari\\s*(?:bapak\\s*)?(?:<br[^>]*>\\s*)?' + AMP + '\\s*(?:ibu\\s*)?$'
  ).test(htmlMin);

  // “... dari <br> &” (varian tanpa label)
  const emptyUnlabeled = new RegExp(
    'dari\\s*(?:<br[^>]*>\\s*)?' + AMP + '\\s*$'
  ).test(htmlMin);

  if (looksParent && (emptyLabeled || emptyUnlabeled)) {
    const prev = widget.previousElementSibling, next = widget.nextElementSibling;
    if (isDS(prev)) prev.remove();
    if (isDS(next)) next.remove();
    widget.remove();
  }
  return;
}


    // dua-duanya kosong → buang widget
    if (!hasAy && !hasIb) {
      const prev = widget.previousElementSibling, next = widget.nextElementSibling;
      if (isDS(prev)) prev.remove();
      if (isDS(next)) next.remove();
      widget.remove();
      return;
    }

// ====== AYAH & IBU ADA → rapikan "&" / label; <br> hanya jika ada di template ======
if (hasAy && hasIb) {
  // Preposisi mengikuti bahasa undangan resmi, bukan isi nama orang tua.

  const wantBapak = hadLabelBefore(ay, box, 'bapak');
  let wantIbu = false;
  for (let n = ay.nextSibling; n && n !== ib; n = n.nextSibling) {
    if (/\bibu\b/i.test((n.textContent || ''))) { wantIbu = true; break; }
  }

  // Catat keinginan line-break dari template (sekali, sebelum normalisasi DOM).
  if (box.dataset.idbOrtuBr === undefined) {
    let foundBr = false;
    for (let n = ay.nextSibling; n && n !== ib; n = n.nextSibling) {
      if (n.nodeName === 'BR') { foundBr = true; break; }
    }
    box.dataset.idbOrtuBr = foundBr ? '1' : '0';
  }
  const wantBr = box.dataset.idbOrtuBr === '1';

  // buang semua isi di antara ayah dan ibu (termasuk <br> lama, "Ibu " lama, dsb.)
  for (let n = ay.nextSibling; n && n !== ib; ) { const nx = n.nextSibling; n.remove(); n = nx; }

  // --- Normalisasi label dulu
  const ayIsMr         = startsWithMr(ay);
  const ibIsMrs        = startsWithMrs(ib);
  const ayStartsBapak  = /^\s*bapak\b/i.test(textOf(ay));
  const ibStartsIbu    = /^\s*ibu\b/i.test(textOf(ib));

  // Ayah: jika nama sudah "Mr ..." ATAU sudah "Bapak ...", jangan tambah label; bersihkan label kiri jika ada.
  if (hideParentLabel) {
    stripParentLabelsBefore(ay);
  } else if (ayIsMr || ayStartsBapak) {
    stripLabelRightBefore(ay, 'Bapak');
  } else if (wantBapak) {
    const before = textBefore(ay, box);
    if (!/\bBapak\s*$/i.test(before)) ay.before(document.createTextNode('Bapak '));
  }

  // Sisipkan " & " (dan <br> hanya bila template memang punya line-break).
  let afterTxt = ' & ';
  // Tambah "Ibu " hanya jika template memang menginginkan, dan marker TIDAK sudah "Mrs ..." / "Ibu ..."
  if (!hideParentLabel && wantIbu && !ibIsMrs && !ibStartsIbu) afterTxt += 'Ibu ';
  if (wantBr) {
    const br = document.createElement('br');
    ay.after(br);
    br.after(document.createTextNode(afterTxt));
  } else {
    ay.after(document.createTextNode(afterTxt));
  }

  // Jika marker ibu sudah "Mrs ..." atau "Ibu ..." → pastikan tidak ada label "Ibu " tersisa di kiri
  if (hideParentLabel) {
    stripParentLabelsBefore(ib);
  } else if (ibIsMrs || ibStartsIbu) {
    stripLabelRightBefore(ib, 'Ibu');
  }

  // Preposisi ditempatkan TERAKHIR supaya bisa mengganti "dari (Bapak)" → " of "
  ensurePrepBefore(ay, box, useEnglishPrep);
  return;
}


// ====== HANYA AYAH → rapikan trailing & Ibu; "dari" hanya jika ada Putra/Putri di kiri ======
if (hasAy && !hasIb) {
  for (let n=ay.nextSibling; n; ) {
    const nx=n.nextSibling;
    if (n.nodeName==='BR') { n.remove(); n=nx; continue; }
    if (n.classList && n.classList.contains('ibu-marker')) { n.remove(); n=nx; continue; }
    if (n.nodeType===3) {
      const s=n.nodeValue.replace(/\s+/g,' ').trim().toLowerCase().replace(/&amp;/g,'&');
      if (s==='' || s==='&' || s==='dan' || s==='ibu') { n.remove(); n=nx; continue; }
    }
    n=nx;
  }

ensurePrepBefore(ay, box, useEnglishPrep);

// ... bereskan trailing <br>/&/ibu

// Pindahkan urutan: strip/label dulu
const ayIsMr = startsWithMr(ay);
const ayStartsBapak = /^\s*bapak\b/i.test(textOf(ay));
if (hideParentLabel) {
  stripParentLabelsBefore(ay);
} else if (ayIsMr || ayStartsBapak) {
  stripLabelRightBefore(ay, 'Bapak');
} else if (hadLabelBefore(ay, box, 'bapak')) {
  const before = textBefore(ay, box);
  if (!/\bBapak\s*$/i.test(before)) ay.before(document.createTextNode('Bapak '));
}

// LALU baru preposisi
ensurePrepBefore(ay, box, useEnglishPrep);

// sisakan fallback "& Ibu" trimming (tetap)
box.innerHTML = box.innerHTML
  .replace(/(?:<br[^>]*>\s*)?&(?:amp;)?\s*(?:ibu\s*)?(?=(?:<\/span>\s*)*$)/gi,'');
return;
}


// ====== HANYA IBU → rapikan konektor; "dari/of" hanya jika ada Putra/Putri di kiri ======
if (!hasAy && hasIb) {
  // flag marker
  const ibIsMrs             = startsWithMrs(ib);
  const markerStartsWithIbu = /^\s*ibu\b/i.test(textOf(ib));

  // Spasi + preposisi hanya jika ada putra/putri di kiri (bukan blok ibu saja).
  (function ensureSpaceAndPrepBeforeIbu(){
    let prev = ib.previousSibling;
    if (prev && prev.nodeType === 3) {
      const v = prev.nodeValue || '';
      if (/\S$/.test(v) && !/\s$/.test(v)) {
        prev.nodeValue = v + ' ';
      }
    }
    const beforeNow = textBefore(ib, box);
    if (!/\b(?:dari|of)\b/i.test(beforeNow) && hasChildRelWord(beforeNow)) {
      const prepWord = useEnglishPrep ? 'of ' : 'dari ';
      ib.before(document.createTextNode(prepWord));
    }
  })();

  // 1) Rapikan kiri marker: hapus <br> dan konektor.
  //    - Jika marker sudah "Mrs …"/"Ibu …" → boleh singkirkan label "Ibu" di kiri
  //    - Jika marker belum berlabel → JANGAN buang "Ibu", cukup buang konektornya
  for (let p = ib.previousSibling; p; ) {
    const prev = p.previousSibling;
    if (p.nodeName === 'BR') { p.remove(); p = prev; continue; }
    if (p.nodeType === 3) {
      let raw = p.nodeValue;

      if (ibIsMrs || markerStartsWithIbu || hideParentLabel) {
        raw = raw
          .replace(/(?:&|dan)\s*Ibu[\u00A0\s]*$/i, '') // "& Ibu" → hapus
          .replace(/\bIbu[\u00A0\s]*$/i, '')          // "Ibu" tunggal → hapus
          .replace(/\b(?:Bapak|Mr\.?)[\u00A0\s]*$/i, '');
      } else {
        // pertahankan label "Ibu", hanya konektornya yang dihilangkan
        raw = raw
          .replace(/(?:&|dan)\s*Ibu[\u00A0\s]*$/i, 'Ibu ')
          .replace(/(?:&|dan)[\u00A0\s]*$/i, '');
      }

      // buang "Bapak" sisa di ujung bila ada
      if (!hideParentLabel) {
        raw = raw.replace(/\bBapak[\u00A0\s]*$/i, '');
      }

      if (raw.replace(/\s+/g,'') === '') { p.remove(); p = prev; continue; }
      if (raw !== p.nodeValue) { p.nodeValue = raw; p = prev; continue; }
      break;
    }
    break;
  }

  // 2) Pastikan ada label "Ibu " bila marker tidak mengandung "Ibu/Mrs"
  if (hideParentLabel) {
    stripParentLabelsBefore(ib);
  } else if (!ibIsMrs && !markerStartsWithIbu) {
    const beforeNow = textBefore(ib, box);
    if (!/\bIbu\s*$/i.test(beforeNow)) ib.before(document.createTextNode('Ibu '));
  } else {
    // marker sudah "Mrs …" atau "Ibu …" → hapus label kiri jika masih tersisa
    stripLabelRightBefore(ib, 'Ibu');
  }

  // 3) Preposisi mengikuti bahasa undangan resmi (_undangan_lang).
  ensurePrepBefore(ib, box, useEnglishPrep);

  // 4) Safety: bersihkan ampersand sisa tepat di kiri marker
  (function cleanupAmpersand(){
    let p = ib.previousSibling;
    while (p && p.nodeType !== 3) {
      if (p.nodeName === 'BR') { p.remove(); p = ib.previousSibling; continue; }
      p = p.previousSibling;
    }
    if (p && p.nodeType === 3) {
      p.nodeValue = p.nodeValue.replace(/(?:&|dan)\s*$/i, '');
      if (/^\s*$/.test(p.nodeValue)) p.remove();
    }
  })();

  // 5) Potong pola mentah yang tersisa (dengan preposisi yang sesuai)
  const prepWord = useEnglishPrep ? 'of ' : 'dari ';
  box.innerHTML = box.innerHTML
    .replace(
      /dari\s+Bapak\s*(?:<span[^>]*class=["']ayah-marker["'][^>]*>.*?<\/span>\s*)?(?:<br[^>]*>\s*)?&(?:amp;)?\s*(?=Ibu\s*<span[^>]+class=["']ibu-marker["'])/gi,
      prepWord
    )
    .replace(
      /dari\s*(?:<span[^>]*class=["']ayah-marker["'][^>]*>.*?<\/span>\s*)?(?:<br[^>]*>\s*)?&(?:amp;)?\s*(?=<span[^>]+class=["']ibu-marker["'])/gi,
      prepWord
    );
  return;
}
  });
}


// 11) Hapus .amplop-section jika rekening + kirim hadiah sama-sama tidak ada data / dimatikan
function removeAmplopSectionIfNoData() {
  if (typeof isElementorEditing === 'function' && isElementorEditing()) return;

  const toRemove = [];
  const giftOff = document.body.classList.contains('idb-hide-wedding-gift');
  const khOff = document.body.classList.contains('idb-hide-kirim-hadiah');

  document.querySelectorAll('.amplop-section').forEach(section => {
    // Card rekening hanya render jika nomor rekening valid (sudah difilter di PHP widget)
    const hasRekeningCard = !giftOff && !!section.querySelector('.idb-copy-rek');
    // Card kirim hadiah hanya render jika ada minimal 1 data valid
    const hasGiftCard = !khOff && !!section.querySelector('.idb-kirim-hadiah');

    if (!hasRekeningCard && !hasGiftCard) {
      toRemove.push(section);
    }
  });

  batchRemove(toRemove);
}

// 11b) Hapus .gift-con jika tidak ada card rekening valid / section dimatikan
function removeGiftContainersIfNoData() {
  if (typeof isElementorEditing === 'function' && isElementorEditing()) return;
  if (document.body.classList.contains('idb-hide-wedding-gift')) {
    batchRemove(Array.from(document.querySelectorAll('.gift-con')));
    return;
  }
  const toRemove = [];
  document.querySelectorAll('.gift-con').forEach(container => {
    const hasRekeningCard = !!container.querySelector('.idb-copy-rek');
    if (!hasRekeningCard) {
      toRemove.push(container);
    }
  });
  batchRemove(toRemove);
}

// 11c) Hapus .kh-con jika tidak ada card kirim hadiah valid / section dimatikan
function removeKirimHadiahContainersIfNoData() {
  if (typeof isElementorEditing === 'function' && isElementorEditing()) return;
  if (document.body.classList.contains('idb-hide-kirim-hadiah')) {
    batchRemove(Array.from(document.querySelectorAll('.kh-con')));
    return;
  }
  const toRemove = [];
  document.querySelectorAll('.kh-con').forEach(container => {
    const hasGiftCard = !!container.querySelector('.idb-kirim-hadiah');
    if (!hasGiftCard) {
      toRemove.push(container);
    }
  });
  batchRemove(toRemove);
}

  // Jalankan semua
function runCleanup() {
      // ➕ tandai dulu spacer/divider yang harus dipertahankan
  markLsSectionSpacersByDeskripsi();
  hideEmptyBisdevPhotoSectionContainers();
  removeButtonsLokasiIfEmpty();
  cleanSocialWidgets();
  removeEmptyHTMLWidgets();
  removeAcaraContainerIfEmpty();
  removeWaktuAcaraIfEmpty();
  removeTempatAcaraIfEmpty();
  normalizeInlineParentNames();
  hideLoveStoryTitlesIfBlank();        // hilangkan judul_ls kosong
  removeLoveStoryContainersIfEmpty();  // (legacy; biarkan tetap ada jika kamu sudah pakai)
  removeEmptyLoveStorySection();   
  removeStreamContainersIfEmpty();
  removeAmplopSectionIfNoData();
  removeGiftContainersIfNoData();
  removeKirimHadiahContainersIfNoData();
  removeLoveStorySectionWhenDisabled();
  removeWeddingGiftSectionWhenDisabled();
  removeKirimHadiahSectionWhenDisabled();
  removeLiveStreamingSectionWhenDisabled();
  removeLsSectionIfEmpty();
  removeGaleriSectionIfEmpty();
}
window.runCleanup = runCleanup; 

// Pertama kali
//   if (isElementorEditing()) { console.log('[cleanup] Editor → skip'); return; }

  runCleanup();
  setTimeout(runCleanup, 250);
  setTimeout(runCleanup, 800);


  // Observer dengan debounce (lebih cepat agar DOM Elementor yang datang bertahap ikut kebersihan)
  let cleanupTimeout;
  const observer = new MutationObserver(mutations => {
    if (mutations.some(m => m.addedNodes.length || m.removedNodes.length)) {
      clearTimeout(cleanupTimeout);
      cleanupTimeout = setTimeout(runCleanup, 48);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Hook Elementor
  if (window.elementorFrontend && window.elementorFrontend.hooks) {
    ['button.default', 'social-icons.default', 'html.default', 'container', 'bisdev-dynamic-image.default'].forEach(type => {
      elementorFrontend.hooks.addAction(`frontend/element_ready/${type}`, runCleanup);
    });
    elementorFrontend.hooks.addAction('frontend/element_ready/bisdev-dynamic-image.default', schedulePhotoSectionHides);
  }
  if (window.jQuery) {
    window.jQuery(window).on('elementor/frontend/init', function () {
      schedulePhotoSectionHides();
    });
  }

});

(function(){
// ganti isi function isElementorEditing() di bootstrap universal menjadi:
function isElementorEditing(){
  try { return !!(window.isElementorEditing && window.isElementorEditing()); }
  catch(e){ return false; }
}

  function safeRun(){ if (typeof window.runCleanup==='function' && !isElementorEditing()) { try{ window.runCleanup(); }catch(e){} } }

  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', function(){ safeRun(); }); } else { safeRun(); }
  window.addEventListener('load', function(){ safeRun(); });
  window.addEventListener('pageshow', function(){ safeRun(); });
  (function(){ var n=0,t=setInterval(function(){ n++; safeRun(); if(n>=10) clearInterval(t); },300); })();
  (function(){ var n=0,t=setInterval(function(){ n++; try{ if(!isElementorEditing() && typeof window.idbApplyPhotoSectionHides==='function') window.idbApplyPhotoSectionHides(); }catch(e){} if(n>=28) clearInterval(t); },120); })();

  try{
    var mo=new MutationObserver(function(m){ for(var i=0;i<m.length;i++){ if((m[i].addedNodes&&m[i].addedNodes.length)||(m[i].removedNodes&&m[i].removedNodes.length)){ clearTimeout(window.__cleanupDebounce); window.__cleanupDebounce=setTimeout(safeRun,48); try{ if(typeof window.idbApplyPhotoSectionHides==='function') window.idbApplyPhotoSectionHides(); }catch(e2){} break; } } });
    mo.observe(document.documentElement||document.body,{childList:true,subtree:true});
  }catch(e){
    var c=0,lim=7,i2=setInterval(function(){ c++; safeRun(); if(c>=lim) clearInterval(i2); },1500);
  }

  (function hookElementor(){
    if (window.jQuery && window.elementorFrontend && window.elementorFrontend.hooks){
      try{
        jQuery(window).on('elementor/frontend/init', function(){
          var types=['button.default','social-icons.default','html.default','container','heading.default','text-editor.default','image.default','bisdev-dynamic-image.default'];
          for(var k=0;k<types.length;k++){ try{ elementorFrontend.hooks.addAction('frontend/element_ready/'+types[k], safeRun); }catch(e){} }
        });
      }catch(e){}
    } else {
      var r=0,iv=setInterval(function(){ r++; hookElementor(); if(r>6) clearInterval(iv); },400);
    }
  })();

  var ric=window.requestIdleCallback||function(cb){ return setTimeout(function(){ cb({timeRemaining:function(){return 0;}}); },500); };
  ric(function(){ safeRun(); });
})();
})();