/* トップページ ヒーロー演出。
   three.js は持ち込まず(表示速度とスマホ性能を優先)、素のcanvas 2Dで
   「追われる生徒 / 追う先生」のシルエットが廊下を走り抜ける軽量ループだけを描く。 */
(function () {
  "use strict";
  var canvas = document.getElementById("hero-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var w = 0, h = 0;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  function person(x, y, scale, color, flip) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -scale : scale, scale);
    ctx.fillStyle = color;
    // 頭
    ctx.beginPath(); ctx.arc(0, -34, 9, 0, Math.PI * 2); ctx.fill();
    // 胴
    ctx.beginPath();
    ctx.moveTo(-7, -24); ctx.lineTo(7, -24); ctx.lineTo(9, 6); ctx.lineTo(-9, 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  var t0 = performance.now();
  var running = true, lastElapsed = 0, raf = null;
  function stopLoop() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }
  function startLoop() {
    // 既存ループが残っていたら必ず先に止める(rAFの二重起動による
    // タイマー破綻を防ぐ。可視状態の切り替えが連続で来ても安全なように)
    stopLoop();
    t0 = performance.now() - lastElapsed;
    raf = requestAnimationFrame(draw);
  }
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) startLoop(); else stopLoop();
  });

  function draw(now) {
    if (!running) return;
    var elapsed = Math.max(0, now - t0);
    lastElapsed = elapsed;
    renderFrame(elapsed);
    if (running) raf = requestAnimationFrame(draw);
  }

  function renderFrame(elapsed) {
    ctx.clearRect(0, 0, w, h);

    // 背景(廊下の窓明かり)
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#22301f");
    grad.addColorStop(1, "#141b13");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 床のタイルライン(奥行き感)
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    var floorY = h * 0.78;
    for (var i = -2; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + i * 60 - (elapsed * 0.03) % 60, h);
      ctx.lineTo(w * 0.5 + i * 10, floorY);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.stroke();

    // 窓の明かり(オレンジのぼんやりした光がゆっくり明滅)
    var glow = 0.5 + 0.5 * Math.sin(elapsed / 900);
    ctx.fillStyle = "rgba(255,140,66," + (0.05 + glow * 0.05) + ")";
    ctx.fillRect(0, h * 0.1, w, h * 0.28);

    // ループするループ位置(0〜1)
    var loop = (elapsed % 5200) / 5200;
    var runX = w * (0.12 + loop * 0.62);
    var chaseGap = 90 - Math.sin(loop * Math.PI) * 46; // 追いつきそうで追いつかない緩急
    var teacherX = runX - chaseGap;

    var bob = Math.sin(elapsed / 90) * 4;
    var bob2 = Math.sin(elapsed / 90 + 1) * 4;

    person(teacherX, floorY + bob2, 1.5, "#d64545dd", false);
    person(runX, floorY + bob, 1.35, "#5b9bd5dd", false);

    // 心音のようなリング(生徒の足元)
    var ringPhase = ((elapsed % 1400) + 1400) % 1400; // 念のため常に0以上に丸める
    var ringR = Math.max(0.5, 10 + (ringPhase / 1400) * 30);
    var ringA = 1 - ringPhase / 1400;
    ctx.beginPath();
    ctx.arc(runX, floorY + 4, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,140,66," + (ringA * 0.5) + ")";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (reduced) {
    // モーション抑制設定の人には、動かさず1コマだけ描いてループはしない
    running = false;
    renderFrame(0);
  } else if (!document.hidden) {
    startLoop();
  }
})();
