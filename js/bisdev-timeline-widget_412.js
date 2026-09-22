/**
 * Bisdev Timeline Widget
 * - Garis mulai icon pertama, terhubung ke icon terakhir, nempel dengan icon
 * - Scroll animation: garis terisi warna saat scroll
 * - Icon aktif ketika garis fill sudah lewat
 * - Item reveal: idb-reveal.js (sama seperti Bisdev Reveal, termasuk cover gate)
 */
(function () {
  'use strict';

  function triggerRevealRescan() {
    document.dispatchEvent(new CustomEvent('idbRevealRescan'));
  }

  function updateIconActive(el, fill) {
    if (!el || !el.classList.contains('idb-timeline')) return;
    var icons = el.querySelectorAll('.idb-timeline__icon');
    if (icons.length === 0) return;
    if (el.classList.contains('idb-timeline--content-only')) return;
    var list = el.querySelector('.idb-timeline__list');
    var line = el.querySelector('.idb-timeline__line');
    if (!line || !list) return;
    var listRect = list.getBoundingClientRect();
    var lineTop = parseFloat(line.style.top) || 0;
    var lineHeight = listRect.height - lineTop - (parseFloat(line.style.bottom) || 0);
    if (lineHeight <= 0) return;
    icons.forEach(function (icon) {
      var r = icon.getBoundingClientRect();
      var iconCenterY = r.top - listRect.top + r.height / 2;
      var pos = (iconCenterY - lineTop) / lineHeight;
      if (fill >= pos - 0.05) {
        icon.classList.add('is-active');
      } else {
        icon.classList.remove('is-active');
      }
    });
  }

  function updateLineBounds(el) {
    if (!el || !el.classList.contains('idb-timeline')) return;
    if (el.classList.contains('idb-timeline--content-only')) return;
    var list = el.querySelector('.idb-timeline__list');
    var icons = el.querySelectorAll('.idb-timeline__icon');
    var line = el.querySelector('.idb-timeline__line');
    if (!line || !list || icons.length === 0) {
      if (line) { line.style.top = ''; line.style.bottom = ''; }
      return;
    }
    var first = icons[0];
    var last = icons.length === 1 ? first : icons[icons.length - 1];
    var listRect = list.getBoundingClientRect();
    var firstRect = first.getBoundingClientRect();
    var lastRect = last.getBoundingClientRect();
    var top = firstRect.top - listRect.top + firstRect.height / 2;
    var bottom = listRect.bottom - (lastRect.top + lastRect.height / 2);
    line.style.top = Math.max(0, top) + 'px';
    line.style.bottom = Math.max(0, bottom) + 'px';
  }

  function updateFill(el) {
    if (!el || !el.classList.contains('idb-timeline')) return;
    if (el.classList.contains('idb-timeline--content-only')) return;
    var line = el.querySelector('.idb-timeline__line');
    if (!line) return;
    var rect = el.getBoundingClientRect();
    var winH = window.innerHeight;
    var vpCenter = winH * 0.5;
    var top = rect.top;
    var height = rect.height;

    var fill = 0;
    if (height <= 0) {
      fill = 0;
    } else if (top + height < vpCenter) {
      fill = 1;
    } else if (top <= vpCenter) {
      fill = (vpCenter - top) / height;
      if (fill < 0) fill = 0;
      if (fill > 1) fill = 1;
    }
    el.style.setProperty('--idb-tl-fill', String(fill));
    updateIconActive(el, fill);
  }

  function update(el) {
    updateLineBounds(el);
    updateFill(el);
  }

  function onResize() {
    document.querySelectorAll('.idb-timeline').forEach(update);
    triggerRevealRescan();
  }

  function init() {
    var doc = document;
    function runAll() {
      doc.querySelectorAll('.idb-timeline').forEach(update);
    }
    runAll();
    triggerRevealRescan();
    [50, 100, 300, 600, 1000, 1500, 2500].forEach(function (ms) {
      setTimeout(function () {
        runAll();
        triggerRevealRescan();
      }, ms);
    });
    window.addEventListener('scroll', function () {
      document.querySelectorAll('.idb-timeline').forEach(updateFill);
    }, { passive: true });
    window.addEventListener('load', function () {
      runAll();
      triggerRevealRescan();
    });
    window.addEventListener('resize', onResize, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      var observedMap = new WeakMap();
      doc.querySelectorAll('.idb-timeline').forEach(function (el) {
        var ro = new ResizeObserver(function () { update(el); });
        ro.observe(el);
        observedMap.set(el, ro);
      });
      if (typeof MutationObserver !== 'undefined') {
        var cleanupMo = new MutationObserver(function (mutations) {
          mutations.forEach(function (m) {
            var nodes = m.removedNodes || [];
            for (var i = 0; i < nodes.length; i++) {
              var node = nodes[i];
              if (node.nodeType !== 1) continue;
              var timelines = node.classList && node.classList.contains('idb-timeline')
                ? [node] : (node.querySelectorAll ? node.querySelectorAll('.idb-timeline') : []);
              for (var j = 0; j < timelines.length; j++) {
                var ro = observedMap.get(timelines[j]);
                if (ro) {
                  ro.disconnect();
                  observedMap.delete(timelines[j]);
                }
              }
            }
          });
        });
        if (doc.body) {
          cleanupMo.observe(doc.body, { childList: true, subtree: true });
        }
      }
    }

    if (typeof elementorFrontend !== 'undefined' && elementorFrontend.on) {
      elementorFrontend.on('elements:loaded', function () {
        runAll();
        triggerRevealRescan();
      });
      elementorFrontend.on('components:init', function () {
        runAll();
        triggerRevealRescan();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
