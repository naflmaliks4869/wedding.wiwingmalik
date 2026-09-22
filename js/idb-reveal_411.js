/**
 * IDB Reveal – animasi scroll untuk elemen .idb-reveal.idb-ef
 * Cover gate: .idb-cover / data-idb-cover-selectors. Event: idbRevealStart
 */
(function () {
  'use strict';

  var DEFAULT_OFFSET = 100;
  var DEFAULT_DURATION = 2000;
  var coverGateOpen = null;
  var firstRun = true;
  var observerMap = Object.create(null);
  var observed = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
  var lastScrollY = 0;
  var scrollDirection = 'down';
  var initDone = false;
  var initRetries = 0;
  var MAX_INIT_RETRIES = 12;

  function prefersReducedMotion() {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function isEditorCanvas() {
    return document.body.classList.contains('elementor-editor-active');
  }

  function getCoverSelectors() {
    var raw = document.body.getAttribute('data-idb-cover-selectors');
    if (raw && typeof raw === 'string') {
      return raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }
    return ['.idb-cover', '#sec', '#kolom'];
  }

  function getOpenSelector() {
    var sel = document.body.getAttribute('data-idb-open-selector');
    return (sel && typeof sel === 'string') ? sel.trim() : '#open';
  }

  function coverElementVisible(el) {
    if (!el) return false;
    var s = window.getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    var op = parseFloat(s.opacity);
    if (!isNaN(op) && op <= 0) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isCoverVisible() {
    if (document.body.getAttribute('data-idb-cover-closed') === '1') return false;
    var selectors = getCoverSelectors();
    for (var i = 0; i < selectors.length; i++) {
      var nodes = document.querySelectorAll(selectors[i]);
      for (var j = 0; j < nodes.length; j++) {
        if (coverElementVisible(nodes[j])) return true;
      }
    }
    return false;
  }

  function bindCoverOpen() {
    var sel = getOpenSelector();
    var btn = document.querySelector(sel);
    if (!btn) return;
    btn.addEventListener('click', function () {
      setTimeout(function () {
        document.body.setAttribute('data-idb-cover-closed', '1');
        document.dispatchEvent(new CustomEvent('idbRevealStart'));
      }, 100);
    }, { once: true });
  }

  function isRevealEl(el) {
    return !!(el && el.classList && el.classList.contains('idb-reveal') && el.classList.contains('idb-ef'));
  }

  function getCumulativeParentDelay(el) {
    var total = 0;
    var parent = el.parentElement;
    while (parent && parent !== document.body) {
      if (isRevealEl(parent)) {
        var d = parseInt(parent.getAttribute('data-reveal-delay') || '0', 10);
        var dur = parseInt(parent.getAttribute('data-reveal-duration') || String(DEFAULT_DURATION), 10);
        total += d + dur;
      }
      parent = parent.parentElement;
    }
    if (total === 0) return null;
    var own = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
    return total + own;
  }

  function isInsideCover(el) {
    var selectors = getCoverSelectors();
    for (var i = 0; i < selectors.length; i++) {
      var containers = document.querySelectorAll(selectors[i]);
      for (var j = 0; j < containers.length; j++) {
        if (containers[j].contains(el)) return true;
      }
    }
    return false;
  }

  function hasActiveRevealParent(el) {
    var parent = el.parentElement;
    while (parent && parent !== document.body) {
      if (isRevealEl(parent) && parent.classList.contains('active')) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  function parseOffset(el) {
    var offset = parseInt(el.getAttribute('data-reveal-offset') || String(DEFAULT_OFFSET), 10);
    return (isNaN(offset) || offset < 0) ? DEFAULT_OFFSET : offset;
  }

  function updateScrollDirection() {
    var y = window.scrollY || window.pageYOffset || 0;
    if (y > lastScrollY + 1) {
      scrollDirection = 'down';
    } else if (y < lastScrollY - 1) {
      scrollDirection = 'up';
    }
    lastScrollY = y;
  }
  function restoreElementTransition(el) {
    var duration = parseInt(el.getAttribute('data-reveal-duration') || String(DEFAULT_DURATION), 10);
    var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
    el.style.setProperty('transition-property', 'transform, opacity');
    el.style.setProperty('transition-timing-function', 'ease');
    el.style.setProperty('transition-duration', duration + 'ms');
    if (delay > 0) {
      el.style.setProperty('transition-delay', delay + 'ms');
    } else {
      el.style.removeProperty('transition-delay');
    }
  }

  /** Scroll ke atas: langsung tampil tanpa animasi */
  function activateInstant(el) {
    el.classList.add('idb-reveal-static');
    el.style.setProperty('transition', 'none', 'important');
    el.classList.add('active');
  }

  /** Scroll ke bawah: animasi reveal (ulang jika perlu) */
  function activateAnimated(el, delayCover) {
    if (prefersReducedMotion()) {
      el.classList.add('active', 'idb-reveal-static');
      return;
    }

    el.classList.remove('idb-reveal-static');
    el.style.removeProperty('transition');

    var parentDelay = getCumulativeParentDelay(el);
    var duration = parseInt(el.getAttribute('data-reveal-duration') || String(DEFAULT_DURATION), 10);
    if (parentDelay != null) {
      el.style.setProperty('transition-property', 'transform, opacity', 'important');
      el.style.setProperty('transition-duration', duration + 'ms', 'important');
      el.style.setProperty('transition-timing-function', 'ease', 'important');
      el.style.setProperty('transition-delay', parentDelay + 'ms', 'important');
    } else {
      restoreElementTransition(el);
    }

    el.classList.remove('active');
    void el.offsetWidth;

    function addActive() {
      el.classList.add('active');
    }
    if (parentDelay != null) {
      requestAnimationFrame(function () {
        requestAnimationFrame(addActive);
      });
    } else if (delayCover && firstRun) {
      setTimeout(addActive, 80);
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(addActive);
      });
    }
  }

  function activateElement(el, delayCover) {
    if (scrollDirection === 'up') {
      activateInstant(el);
      return;
    }
    activateAnimated(el, delayCover);
  }

  function deactivateElement(el) {
    if (!hasActiveRevealParent(el)) {
      el.classList.remove('active', 'idb-reveal-static');
      el.style.removeProperty('transition');
    }
  }

  function elementInView(el) {
    var offset = parseOffset(el);
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight;
    return rect.top < vh - offset && rect.bottom > 0;
  }

  function syncCoverLockedState() {
    if (coverGateOpen !== false || !isCoverVisible()) return;
    document.querySelectorAll('.idb-reveal.idb-ef').forEach(function (el) {
      if (isInsideCover(el)) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  function handleIntersection(entries) {
    syncCoverLockedState();
    if (coverGateOpen === false && isCoverVisible()) return;
    if (coverGateOpen === false) {
      coverGateOpen = true;
      firstRun = true;
    }

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var el = entry.target;
      if (!isRevealEl(el)) continue;
      if (coverGateOpen === false && !isInsideCover(el)) continue;

      if (entry.isIntersecting) {
        activateElement(el, false);
      } else if (!elementInView(el)) {
        deactivateElement(el);
      }
    }
    firstRun = false;
  }

  function getObserverForOffset(offset) {
    var key = String(offset);
    if (!observerMap[key]) {
      if (typeof IntersectionObserver === 'undefined') return null;
      observerMap[key] = new IntersectionObserver(handleIntersection, {
        root: null,
        rootMargin: '0px 0px -' + offset + 'px 0px',
        threshold: 0
      });
    }
    return observerMap[key];
  }

  function observeElement(el) {
    var offset = parseOffset(el);
    var obs = getObserverForOffset(offset);
    if (obs) {
      if (observed && observed.has(el)) return;
      obs.observe(el);
      if (observed) observed.add(el);
      return;
    }
    if (elementInView(el)) {
      activateElement(el, coverGateOpen !== false && firstRun);
    }
  }

  function refreshAll() {
    var nodes = document.querySelectorAll('.idb-reveal.idb-ef');
    if (!nodes.length) return;

    if (prefersReducedMotion()) {
      revealAllStatic();
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      runScrollFallback();
      return;
    }

    for (var i = 0; i < nodes.length; i++) {
      observeElement(nodes[i]);
    }
  }

  function revealAllStatic() {
    document.querySelectorAll('.idb-reveal.idb-ef').forEach(function (el) {
      if (coverGateOpen === false && !isInsideCover(el) && isCoverVisible()) return;
      el.classList.add('active', 'idb-reveal-static');
    });
  }

  function runScrollFallback() {
    syncCoverLockedState();
    if (coverGateOpen === false && isCoverVisible()) return;
    if (coverGateOpen === false) {
      coverGateOpen = true;
      firstRun = true;
    }

    document.querySelectorAll('.idb-reveal.idb-ef').forEach(function (el) {
      if (coverGateOpen === false && !isInsideCover(el)) return;
      if (elementInView(el)) {
        activateElement(el, firstRun && coverGateOpen !== false);
      } else {
        deactivateElement(el);
      }
    });
    firstRun = false;
  }

  function hasCover() {
    var selectors = getCoverSelectors();
    for (var i = 0; i < selectors.length; i++) {
      if (document.querySelector(selectors[i])) return true;
    }
    return false;
  }

  function initCoverGate() {
    if (!hasCover()) {
      coverGateOpen = true;
      return;
    }
    if (document.body.getAttribute('data-idb-cover-closed') === '1') {
      coverGateOpen = true;
      return;
    }
    coverGateOpen = !isCoverVisible();
    if (isCoverVisible()) coverGateOpen = false;
  }

  function rescanInView() {
    syncCoverLockedState();
    if (coverGateOpen === false && isCoverVisible()) return;
    document.querySelectorAll('.idb-reveal.idb-ef').forEach(function (el) {
      if (coverGateOpen === false && !isInsideCover(el)) return;
      if (elementInView(el) && !el.classList.contains('active')) {
        activateElement(el, false);
      }
    });
  }

  function bindLateContentHooks() {
    window.addEventListener('load', function () {
      refreshAll();
      runScrollFallback();
      rescanInView();
    });

    document.addEventListener('load', function (e) {
      if (e.target && e.target.tagName === 'IMG' && e.target.closest('.idb-reveal.idb-ef')) {
        rescanInView();
        runScrollFallback();
      }
    }, true);
  }

  function scheduleInitRetry() {
    if (initDone || initRetries >= MAX_INIT_RETRIES) return;
    initRetries += 1;
    setTimeout(function () {
      if (initDone) return;
      bootReveal();
    }, 250);
  }

  function openCoverGate() {
    coverGateOpen = true;
    firstRun = true;
    scrollDirection = 'down';
    document.body.setAttribute('data-idb-cover-closed', '1');
    refreshAll();
    runScrollFallback();
    setTimeout(runScrollFallback, 200);
  }

  function rescanAll() {
    if (!initDone) {
      bootReveal();
      return;
    }
    refreshAll();
    runScrollFallback();
    rescanInView();
  }

  function bootReveal() {
    if (initDone) return;
    if (!document.querySelector('.idb-reveal.idb-ef')) {
      scheduleInitRetry();
      return;
    }
    initDone = true;

    bindCoverOpen();

    if (prefersReducedMotion()) {
      document.documentElement.classList.add('idb-reveal-reduce-motion');
      initCoverGate();
      if (coverGateOpen !== false) {
        revealAllStatic();
      } else {
        document.querySelectorAll('.idb-reveal.idb-ef').forEach(function (el) {
          if (isInsideCover(el)) el.classList.add('active', 'idb-reveal-static');
        });
      }
      document.addEventListener('idbRevealStart', openCoverGate);
      bindLateContentHooks();
      return;
    }

    if (isEditorCanvas()) return;

    initCoverGate();
    refreshAll();

    if (coverGateOpen === false) {
      document.querySelectorAll('.idb-reveal.idb-ef').forEach(function (el) {
        if (isInsideCover(el)) el.classList.add('active');
      });
    }

    var scrollRaf = 0;
    lastScrollY = window.scrollY || window.pageYOffset || 0;

    function onScroll() {
      updateScrollDirection();
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(function () {
        scrollRaf = 0;
        if (typeof IntersectionObserver === 'undefined') {
          runScrollFallback();
        } else {
          rescanInView();
        }
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    document.addEventListener('idbRevealStart', openCoverGate);
    bindLateContentHooks();

    if (hasCover() && coverGateOpen === false) {
      setTimeout(function () {
        if (!isCoverVisible()) openCoverGate();
      }, 150);
    }

    runScrollFallback();
    setTimeout(function () {
      runScrollFallback();
      rescanInView();
    }, 200);
  }

  function init() {
    bootReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('idbRevealRescan', rescanAll);
})();
