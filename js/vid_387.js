/* Title: VID */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.getElementById("open");

    // target video background (umum)
    const videoElement = document.querySelector(".elementor-background-video-container video");
    // target khusus slideAwal (kalau ada)
    const elHostedVideo = document.querySelector(".slideAwal .elementor-background-video-container video");

    let iframeOrVideoLoaded = false;

    // Klik tombol -> play video kalau ada & paused
    if (toggleButton && videoElement) {
      toggleButton.addEventListener("click", function () {
        try {
          if (videoElement.paused) {
            const p = videoElement.play();
            if (p && typeof p.catch === "function") p.catch(function(){});
          }
        } catch (e) {}
      });
    }

    // Kalau tombol tidak ada, stop aman (jangan error)
    if (!toggleButton) return;

    function isYoutubeVideoLink(url) {
      if (!url || typeof url !== "string") return false;
      var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
      var match = url.match(regExp);
      if (match && match[7] && match[7].length == 11) return match[7];
      return false;
    }

    function getVideoSrc(v) {
      if (!v) return "";
      var src = v.getAttribute("src") || "";
      if (!src) {
        var source = v.querySelector("source");
        if (source) src = source.getAttribute("src") || "";
      }
      return src;
    }

    const src = getVideoSrc(elHostedVideo || videoElement);
    const isYoutube = isYoutubeVideoLink(src);

    setTimeout(function () {
      if (!iframeOrVideoLoaded) {
        toggleButton.classList.add("btnVisibleAfterLoad");
        console.log("Slow Network!!! Video Buffered, Force Button Visible After 15 Second");
      }
    }, 15000);

    if (!isYoutube) {
      const v = elHostedVideo || videoElement;
      if (v) {
        try { v.removeAttribute("autoplay"); } catch(e) {}

        setTimeout(function () {
          toggleButton.classList.add("btnVisibleAfterLoad");
          iframeOrVideoLoaded = true;
          console.log("Video Loaded");
        }, 200);

        v.addEventListener("canplay", function () {
          iframeOrVideoLoaded = true;
        }, { once: true });
      }
    } else {
      // YouTube case: no-op (tetap aman)
    }
  });
})();
