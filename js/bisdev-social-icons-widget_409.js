/* Bisdev Ikon Sosial — buka ulang tautan Maps di iOS */
(function () {
  if (window.__BISDEV_SOCIAL_ICONS_MAPS) return;
  window.__BISDEV_SOCIAL_ICONS_MAPS = true;

  function isIos() {
    var ua = String(navigator.userAgent || '');
    if (/iPad|iPhone|iPod/i.test(ua)) return true;
    return navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1;
  }

  function closestMapsLink(el) {
    while (el && el.nodeType === 1) {
      if (el.matches && el.matches('a.idb-social-icons__item[data-idb-maps-link]')) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function withFreshQuery(href) {
    href = String(href || '').trim();
    if (!href || !/^https?:\/\//i.test(href)) {
      return href;
    }
    try {
      var parsed = new URL(href, window.location.href);
      parsed.searchParams.set('idb_ts', String(Date.now()));
      return parsed.toString();
    } catch (err) {
      var sep = href.indexOf('?') >= 0 ? '&' : '?';
      return href + sep + 'idb_ts=' + Date.now();
    }
  }

  function clearStickyHover(link) {
    if (!link) return;
    try {
      link.blur();
    } catch (err) { /* ignore */ }
  }

  function openMaps(url) {
    try {
      window.location.assign(url);
      return;
    } catch (err) { /* fallback */ }
    window.location.href = url;
  }

  document.addEventListener('click', function (e) {
    if (!e || e.defaultPrevented) return;
    if (e.button && e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var link = closestMapsLink(e.target);
    if (!link) return;

    clearStickyHover(link);
    if (!isIos()) return;

    var href = (link.getAttribute('href') || '').trim();
    if (!href) return;

    e.preventDefault();
    openMaps(withFreshQuery(href));
  }, true);

  window.addEventListener('pageshow', function () {
    var nodes = document.querySelectorAll('a.idb-social-icons__item[data-idb-maps-link]');
    for (var i = 0; i < nodes.length; i++) {
      clearStickyHover(nodes[i]);
    }
  });
})();
