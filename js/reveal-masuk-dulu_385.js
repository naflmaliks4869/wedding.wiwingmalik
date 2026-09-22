/* Title: EFEK MASUK DULU (Legacy) */
(function () {
  // hindari double-init
  if (window.__NIKU_REVEAL_LEGACY_INITED__) return;
  window.__NIKU_REVEAL_LEGACY_INITED__ = true;

  function revealElements(className){
    var reveals = document.querySelectorAll("." + className);
    for (var i = 0; i < reveals.length; i++){
      var windowHeight = window.innerHeight;
      var elementTop = reveals[i].getBoundingClientRect().top;
      var elementVisible = 150;
      if (elementTop < windowHeight - elementVisible){
        reveals[i].classList.add("active");
      } else {
        reveals[i].classList.remove("active");
      }
    }
  }

  function initReveal(){
    revealElements("reveal");
    revealElements("revealin");
    revealElements("revealkanan");
    revealElements("revealkiri");
    revealElements("revealatas");
    revealElements("revealr");
  }

  window.addEventListener("scroll", initReveal, { passive: true });

  // run awal
  document.addEventListener("DOMContentLoaded", initReveal);
})();
