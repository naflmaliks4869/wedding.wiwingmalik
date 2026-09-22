/**
 * Elementor Heading: judul hanya "&" sering hilang (HTML parser / cleanup).
 * Paksa tampil via textContent bila elemen kosong tapi markup masih mengandung & mentah.
 */
(function () {
  'use strict';

  function isLoneAmp(value) {
    var t = String(value || '')
      .replace(/\u00a0/g, ' ')
      .trim();
    return t === '&' || t === '\uFF06';
  }

  function fixHeadingTitle(titleEl) {
    if (!titleEl) return;
    var txt = String(titleEl.textContent || '')
      .replace(/\u00a0/g, ' ')
      .trim();
    if (isLoneAmp(txt)) return;

    var html = String(titleEl.innerHTML || '');
    if (isLoneAmp(html.replace(/<[^>]+>/g, '').trim())) {
      titleEl.textContent = '&';
      return;
    }

    if (txt === '' && /(?:^|>)\s*&\s*(?:<|$)/.test(html)) {
      titleEl.textContent = '&';
    }
  }

  function scan(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.elementor-widget-heading .elementor-heading-title').forEach(fixHeadingTitle);
  }

  function bindElementor() {
    if (!window.elementorFrontend || !elementorFrontend.hooks) return;
    elementorFrontend.hooks.addAction('frontend/element_ready/heading.default', function ($scope) {
      scan($scope && $scope[0] ? $scope[0] : $scope);
    });
    elementorFrontend.hooks.addAction('frontend/element_ready/global', function ($scope) {
      scan($scope && $scope[0] ? $scope[0] : $scope);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      scan(document);
      bindElementor();
    });
  } else {
    scan(document);
    bindElementor();
  }

  if (window.jQuery) {
    jQuery(window).on('elementor/frontend/init', bindElementor);
  }
})();
