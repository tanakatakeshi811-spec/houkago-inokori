/* 「放課後の居残り」公式サイト 共通処理
   ヘッダーの開閉・スクロール演出(IntersectionObserver)・チョーク粉パーティクルなど、
   全ページで使う軽量なユーティリティだけをここに置く。フレームワーク不使用。 */
(function () {
  "use strict";

  /* ---- モバイルナビの開閉 ---- */
  function setupNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".mobile-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "✕" : "☰";
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.textContent = "☰";
      });
    });
  }

  /* ---- スクロール連動フェードイン ---- */
  function setupReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---- ヒーローのチョーク粉パーティクル(軽量CSS駆動、10〜16粒だけ) ---- */
  function setupChalkDust() {
    var host = document.querySelector("[data-chalk-dust]");
    if (!host) return;
    var n = window.innerWidth < 640 ? 8 : 16;
    for (var i = 0; i < n; i++) {
      var p = document.createElement("span");
      p.className = "chalk-particle";
      var size = 2 + Math.random() * 3;
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.left = Math.random() * 100 + "%";
      p.style.bottom = Math.random() * 40 + "%";
      p.style.animationDuration = 6 + Math.random() * 8 + "s";
      p.style.animationDelay = Math.random() * 8 + "s";
      host.appendChild(p);
    }
  }

  /* ---- フッターの年号 ---- */
  function setupYear() {
    var y = document.querySelector("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupNav();
    setupReveal();
    setupChalkDust();
    setupYear();
  });
})();
