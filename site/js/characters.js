/* 「放課後の居残り」キャラ図鑑の描画・検索・絞り込み・詳細モーダル
   データは characters-data.js の CHARACTERS 配列(自動生成)を使う。 */
(function () {
  "use strict";
  if (typeof CHARACTERS === "undefined") return;

  var grid = document.getElementById("char-grid");
  var empty = document.getElementById("char-empty");
  var countEl = document.getElementById("char-count");
  var searchEl = document.getElementById("char-search");
  var tabs = document.querySelectorAll(".tabbar .tab-btn");
  var modalOverlay = document.getElementById("char-modal");
  var modalBody = document.getElementById("char-modal-body");
  var modalClose = document.getElementById("char-modal-close");

  var state = { side: "teacher", q: "" };

  var SYMBOL_TEACHER = ["😈", "👹", "🧟", "🎭", "🩻", "🧛", "🐺", "🦇", "🕯️", "🪞", "🩸", "🦴"];
  var SYMBOL_STUDENT = ["🙂", "😊", "😳", "😶", "🥲", "😮", "😅", "🙃"];

  function pickSymbol(c, idx) {
    var pool = c.side === "teacher" ? SYMBOL_TEACHER : SYMBOL_STUDENT;
    return pool[idx % pool.length];
  }

  function matches(c) {
    if (c.side !== state.side) return false;
    if (!state.q) return true;
    var hay = (c.name + " " + (c.short || "") + " " + c.tagline).toLowerCase();
    return hay.indexOf(state.q.toLowerCase()) >= 0;
  }

  function render() {
    var list = CHARACTERS.filter(matches);
    grid.innerHTML = "";
    countEl.textContent = list.length + "体";
    empty.style.display = list.length ? "none" : "block";
    list.forEach(function (c, i) {
      var card = document.createElement("button");
      card.className = "char-card reveal in-view";
      card.type = "button";
      card.innerHTML =
        '<div class="char-thumb" style="background:linear-gradient(160deg,' + c.color + 'cc, #14161a)">' +
        '<span class="side-badge ' + (c.side === "teacher" ? "badge-teacher" : "badge-student") + '">' +
        (c.side === "teacher" ? "先生" : "生徒") + "</span>" +
        pickSymbol(c, i) +
        "</div>" +
        '<div class="char-info"><div class="cname">' + escapeHtml(c.name) + '</div>' +
        '<div class="ctag">' + escapeHtml(c.tagline || "") + "</div></div>";
      card.addEventListener("click", function () { openModal(c, i); });
      grid.appendChild(card);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function openModal(c, idx) {
    var symbol = pickSymbol(c, idx);
    var html = "";
    html += '<div class="modal-head">';
    html += '<button class="modal-close" id="char-modal-close-x" aria-label="閉じる">✕</button>';
    html += '<div class="modal-thumb" style="background:linear-gradient(160deg,' + c.color + 'cc,#14161a)">' + symbol + "</div>";
    html += "<h3>" + escapeHtml(c.name) + "</h3>";
    html += '<div class="modal-tag">' + (c.side === "teacher" ? "先生" : "生徒") + " ・ " + escapeHtml(c.tagline || "") + "</div>";
    html += "</div><div class='modal-body'>";
    if (c.intro) html += '<p class="modal-intro">' + escapeHtml(c.intro) + "</p>";
    (c.abilities || []).forEach(function (a) {
      html += '<div class="ability-block"><div class="a-label">';
      html += a.label ? "🔹 " + escapeHtml(a.label) : "🔹 特徴";
      if (a.kind === "active" && a.cd) html += '<span class="a-meta">CT ' + a.cd + "秒" + (a.uses ? " ・ " + a.uses + "回まで" : "") + "</span>";
      if (a.kind === "passive") html += '<span class="a-meta">常時発動</span>';
      html += "</div>";
      html += '<p class="a-text">' + escapeHtml(a.text) + "</p></div>";
    });
    if (c.side === "teacher" && c.cd) {
      html += '<div class="ability-block"><div class="a-label">⏱ クールタイムの目安</div><p class="a-text">能力の再使用まで、約' + c.cd + "秒。</p></div>";
    }
    html += "</div>";
    modalBody.innerHTML = html;
    modalOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
    document.getElementById("char-modal-close-x").addEventListener("click", closeModal);
  }

  function closeModal() {
    modalOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });
  if (modalClose) modalClose.addEventListener("click", closeModal);

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      state.side = tab.getAttribute("data-side");
      render();
    });
  });

  if (searchEl) {
    searchEl.addEventListener("input", function () {
      state.q = searchEl.value.trim();
      render();
    });
  }

  render();
})();
