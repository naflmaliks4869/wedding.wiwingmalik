(function ($) {
  'use strict';

  var YT_ORIGINS = {
    'https://www.youtube.com': true,
    'https://www.youtube-nocookie.com': true
  };

  var YT_STATE = {
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3
  };

  /**
   * Lacak video mana yang sedang "bersuara" (YouTube / HTML5 diputar + tidak mute).
   */
  window.BisdevInviteVideoSound = window.BisdevInviteVideoSound || (function () {
    var loudIds = {};
    var ducked = false;

    function sync() {
      var any = Object.keys(loudIds).length > 0;
      if (any && !ducked) {
        ducked = true;
        if (typeof window.__bisdevPauseUndanganMusicForVideo === 'function') {
          window.__bisdevPauseUndanganMusicForVideo();
        }
      } else if (!any && ducked) {
        ducked = false;
        if (typeof window.__bisdevResumeUndanganMusicAfterVideo === 'function') {
          window.__bisdevResumeUndanganMusicAfterVideo();
        }
      }
    }

    return {
      setLoud: function (id, on) {
        if (!id) return;
        if (on) {
          loudIds[id] = true;
        } else {
          delete loudIds[id];
        }
        sync();
      }
    };
  })();

  function isElementorEditCanvas() {
    try {
      if (window.elementorFrontend && typeof elementorFrontend.isEditMode === 'function') {
        return !!elementorFrontend.isEditMode();
      }
    } catch (e) {}
    return false;
  }

  function iframeStartsMuted(iframe) {
    var src = iframe && iframe.getAttribute ? (iframe.getAttribute('src') || '') : '';
    return /[?&]mute=1(?:&|$)/.test(src);
  }

  function setMoreVideosHidden($wrap, hidden) {
    if (!$wrap || !$wrap.length) return;
    if (hidden) {
      $wrap.addClass('bisdev-invite-video--hide-more');
    } else {
      $wrap.removeClass('bisdev-invite-video--hide-more');
    }
  }

  function shouldHideMoreVideos(state) {
    return state === YT_STATE.PAUSED || state === YT_STATE.ENDED;
  }

  function bindNativeVideo($wrap) {
    var video = $wrap.find('video.bisdev-invite-video__native').get(0);
    if (!video) return;

    $wrap.attr('data-biv-msg', '1');
    var duck = $wrap.attr('data-duck-music') === '1';
    var bivId = $wrap.attr('data-biv-id') || video.id || ('biv-' + Math.random().toString(36).slice(2));

    function syncLoud() {
      if (!duck) return;
      var loud = !video.paused && !video.ended && video.currentTime > 0 && !video.muted && video.volume > 0;
      window.BisdevInviteVideoSound.setLoud(bivId, loud);
    }

    function onNativeEvent() {
      if (video.paused || video.ended) {
        if (duck) {
          window.BisdevInviteVideoSound.setLoud(bivId, false);
        }
      } else {
        syncLoud();
      }
    }

    ['play', 'playing', 'pause', 'ended', 'volumechange'].forEach(function (ev) {
      video.addEventListener(ev, onNativeEvent);
    });
  }

  function bindYouTube($wrap) {
    var iframe = $wrap.find('iframe.bisdev-invite-video__iframe').get(0);
    if (!iframe) return;

    $wrap.attr('data-biv-msg', '1');
    var duck = $wrap.attr('data-duck-music') === '1';
    var bivId = $wrap.attr('data-biv-id') || iframe.id || ('biv-' + Math.random().toString(36).slice(2));
    var playerState = -1;
    var isMuted = iframeStartsMuted(iframe);

    function syncLoud() {
      if (!duck) return;
      var loud = playerState === YT_STATE.PLAYING && !isMuted;
      window.BisdevInviteVideoSound.setLoud(bivId, loud);
    }

    function applyState(state) {
      if (typeof state !== 'number') return;
      playerState = state;
      setMoreVideosHidden($wrap, shouldHideMoreVideos(state));
      if (state === YT_STATE.PLAYING) {
        syncLoud();
      } else if (duck) {
        window.BisdevInviteVideoSound.setLoud(bivId, false);
      }
    }

    function onMessage(event) {
      if (!event || !YT_ORIGINS[event.origin]) return;
      if (event.source !== iframe.contentWindow) return;

      var data = null;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch (e) {
        return;
      }
      if (!data || !data.event) return;

      if (data.event === 'onStateChange' && typeof data.info === 'number') {
        applyState(data.info);
        return;
      }

      if (data.event === 'infoDelivery' && data.info && typeof data.info === 'object') {
        if (typeof data.info.muted === 'boolean') {
          isMuted = data.info.muted;
        }
        if (typeof data.info.playerState === 'number') {
          applyState(data.info.playerState);
        }
      }
    }

    window.addEventListener('message', onMessage);
  }

  function bindOne($wrap) {
    if (!$wrap || !$wrap.length) return;
    if (($wrap.attr('data-biv-msg') || '') === '1') return;
    if (isElementorEditCanvas()) return;

    var videoType = ($wrap.attr('data-video-type') || 'youtube').trim();

    if (videoType === 'mp4') {
      bindNativeVideo($wrap);
      return;
    }

    bindYouTube($wrap);
  }

  function bindElementor() {
    if (typeof elementorFrontend === 'undefined') return;
    var tries = 0;
    (function wait() {
      var hooks = elementorFrontend && elementorFrontend.hooks;
      if (hooks && typeof hooks.addAction === 'function') {
        hooks.addAction('frontend/element_ready/bisdev_invite_video.default', function ($scope) {
          bindOne($scope.find('.bisdev-invite-video').first());
        });
        return;
      }
      tries++;
      if (tries < 40) setTimeout(wait, 100);
    })();
  }

  $(window).on('load', function () {
    bindElementor();
    $('.bisdev-invite-video').each(function () {
      bindOne($(this));
    });
  });
})(jQuery);
