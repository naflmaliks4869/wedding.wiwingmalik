/* Title: VH */
(function () {
  function setDynamicVH(){
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }

  setDynamicVH();
  window.addEventListener('resize', setDynamicVH);
})();
