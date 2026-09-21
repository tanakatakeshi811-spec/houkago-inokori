/* 「放課後の居残り」ランキングページ
   Cloudflare Worker(houkago-inokori-relay)の /api/leaderboard を叩くだけ。
   ※ドメインが houkago-inokori.com 等に確定したら、Worker側のCORS許可
   (worker/src/index.js の CORS 定数)に本番ドメインも追加すること。
   現状は 'access-control-allow-origin': '*' (全許可)のため、
   Cloudflare Pagesの *.pages.dev プレビューURLからでも動作確認できる。 */
(function () {
  "use strict";
  var API = "https://houkago-inokori-relay.shunri-ai.workers.dev/api/leaderboard?limit=50";
  var tbody = document.getElementById("rank-tbody");
  var statusEl = document.getElementById("rank-status");
  if (!tbody) return;

  function medal(rank) {
    if (rank === 1) return '<span class="medal">🥇</span>';
    if (rank === 2) return '<span class="medal">🥈</span>';
    if (rank === 3) return '<span class="medal">🥉</span>';
    return "";
  }

  function pct(a, b) {
    if (!b) return "-";
    return Math.round((a / b) * 100) + "%";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  fetch(API)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var players = (data && data.players) || [];
      if (!players.length) {
        statusEl.textContent = "まだ誰もランキングに載っていません。最初のひとりになろう。";
        return;
      }
      statusEl.style.display = "none";
      tbody.innerHTML = players
        .map(function (p, i) {
          var rank = i + 1;
          var winRate = pct(p.wins, p.matches);
          return (
            '<tr class="rank-' + rank + '">' +
            "<td>" + medal(rank) + rank + "</td>" +
            "<td>" + escapeHtml(p.icon || "👤") + " " + escapeHtml(p.name || "名無し") + "</td>" +
            "<td>" + (p.points || 0) + "</td>" +
            "<td>" + (p.matches || 0) + "</td>" +
            "<td>" + winRate + "</td>" +
            "<td>" + (p.teacherWins || 0) + " / " + (p.teacherMatches || 0) + "</td>" +
            "<td>" + (p.studentEscapes || 0) + " / " + (p.studentMatches || 0) + "</td>" +
            "</tr>"
          );
        })
        .join("");
    })
    .catch(function (err) {
      statusEl.textContent = "ランキングを取得できませんでした。時間を置いてもう一度開いてみてください。";
      statusEl.className = "mg-status bad";
      console.error("[ranking] fetch failed", err);
    });
})();
