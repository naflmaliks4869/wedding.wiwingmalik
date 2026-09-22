(function(){
  "use strict";

  function pad2(n){ n = Math.floor(Math.abs(n)); return (n < 10 ? '0' : '') + n; }

  function setText(el, txt){
    if (!el) return;
    if (el.textContent !== txt) el.textContent = txt;
  }

  function computeParts(ms, showDays, showHours, showMinutes){
    ms = Math.max(0, ms);

    // Selalu tampilkan komponen kalender apa adanya (modulo), tanpa carry-over.
    // Menyembunyikan unit tertentu TIDAK mengakumulasi waktunya ke unit lain,
    // sehingga saat Hari & Jam disembunyikan, Menit tetap menampilkan 42 (bukan 54462).
    var days = Math.floor(ms / 86400000);
    var hours = Math.floor((ms % 86400000) / 3600000);
    var minutes = Math.floor((ms % 3600000) / 60000);
    var seconds = Math.floor((ms % 60000) / 1000);

    return {days:days, hours:hours, minutes:minutes, seconds:seconds};
  }

  function updateLabels(root){
    var labels = {
      days: root.getAttribute('data-label-days') || 'Hari',
      hours: root.getAttribute('data-label-hours') || 'Jam',
      minutes: root.getAttribute('data-label-minutes') || 'Menit',
      seconds: root.getAttribute('data-label-seconds') || 'Detik'
    };

    var items = root.querySelectorAll('.idb-countdown__item');
    for (var i=0;i<items.length;i++){
      var part = items[i].getAttribute('data-part');
      var labelEl = items[i].querySelector('[data-role="label"]');
      if (part && labelEl && labels[part]) setText(labelEl, labels[part]);
    }
  }

  function setNumbers(root, parts){
    var map = {
      days: String(parts.days),
      hours: pad2(parts.hours),
      minutes: pad2(parts.minutes),
      seconds: pad2(parts.seconds)
    };

    var items = root.querySelectorAll('.idb-countdown__item');
    for (var i=0;i<items.length;i++){
      var part = items[i].getAttribute('data-part');
      var numEl = items[i].querySelector('[data-role="num"]');
      if (part && numEl && Object.prototype.hasOwnProperty.call(map, part)){
        setText(numEl, map[part]);
      }
    }
  }

  function showFinish(root, finishText){
    if (!finishText) return;
    var row = root.querySelector('.idb-countdown__row');
    if (row) row.style.display = 'none';
    var el = root.querySelector('.idb-countdown__finish');
    if (!el){
      el = document.createElement('div');
      el.className = 'idb-countdown__finish';
      root.appendChild(el);
    }
    el.style.display = '';
    setText(el, finishText);
  }

  function mount(root){
    if (!root || root.__idbMounted) return;
    root.__idbMounted = true;

    updateLabels(root);

    function tick(){
      var target = parseInt(root.getAttribute('data-target') || '0', 10);
      if (!target || target <= 0){
        setNumbers(root, {days:0, hours:0, minutes:0, seconds:0});
        return;
      }

      var diff = target - Date.now();

      var showDays = (root.getAttribute('data-show-days') || '1') === '1';
      var showHours = (root.getAttribute('data-show-hours') || '1') === '1';
      var showMinutes = (root.getAttribute('data-show-minutes') || '1') === '1';

      var parts = computeParts(diff, showDays, showHours, showMinutes);
      setNumbers(root, parts);

      if (diff <= 0){
        var finishText = root.getAttribute('data-finish-text') || '';
        showFinish(root, finishText);
        if (root.__idbTimer){
          clearInterval(root.__idbTimer);
          root.__idbTimer = null;
        }
      }
    }

    tick();
    root.__idbTimer = setInterval(tick, 1000);
  }

  function scan(ctx){
    var root = ctx || document;
    if (!root.querySelectorAll) return;
    var els = root.querySelectorAll('.idb-countdown');
    for (var i=0;i<els.length;i++) mount(els[i]);
  }

  // Observe DOM changes (Elementor editor often injects widgets after DOMContentLoaded)
  function observe(){
    if (!window.MutationObserver) return;
    try{
      var mo = new MutationObserver(function(mutations){
        for (var i=0;i<mutations.length;i++){
          var m = mutations[i];
          if (!m.addedNodes || !m.addedNodes.length) continue;
          for (var j=0;j<m.addedNodes.length;j++){
            var n = m.addedNodes[j];
            if (!n || n.nodeType !== 1) continue;
            // If the node itself is a countdown, or contains countdowns
            if (n.classList && n.classList.contains('idb-countdown')) {
              mount(n);
            } else if (n.querySelectorAll) {
              scan(n);
            }
          }
        }
      });
      mo.observe(document.documentElement || document.body, {childList:true, subtree:true});
    }catch(e){}
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ scan(document); });
  } else {
    scan(document);
  }

  // Start observer early so widgets injected later will still mount
  observe();

  // Elementor preview support (robust: wait until elementorFrontend is ready)
  function bindElementor(){
    try{
      if (window.elementorFrontend && window.elementorFrontend.hooks && window.elementorFrontend.hooks.addAction){
        window.elementorFrontend.hooks.addAction('frontend/element_ready/bisdev_countdown.default', function($scope){
          var node = $scope && ($scope[0] || $scope);
          scan(node || document);
        });
        return true;
      }
    }catch(e){}
    return false;
  }

  // Try now, then retry a few times (some setups load elementorFrontend late)
  if (!bindElementor()){
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      if (bindElementor() || tries >= 20) clearInterval(t);
    }, 250);
  }

  // Also listen to Elementor init event if available
  if (window.jQuery){
    jQuery(window).on('elementor/frontend/init', function(){
      scan(document);
      bindElementor();
    });
  }
})();