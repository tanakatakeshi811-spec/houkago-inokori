/* 「放課後の居残り」ルールページ: ミニ体験(スキルチェック/もがき/攻撃・回避)
   本編は three.js の3Dゲームだが、ここは表示速度を優先して
   軽量な素のDOM + CSSアニメーションだけで作った雰囲気体験。
   3つとも「押す/連打する/タイミングを合わせる」という本編の緊張感の再現が目的で、
   数値バランスは本編そのままではなく体験用に調整してある。 */
(function () {
  "use strict";

  /* ============================================================
     ① スキルチェック(QTEリング)
     ============================================================ */
  function initSkillCheck() {
    var root = document.getElementById("mg-skillcheck");
    if (!root) return;
    var zone = document.getElementById("sc-zone");
    var needle = document.getElementById("sc-needle");
    var btn = document.getElementById("sc-btn");
    var statusEl = document.getElementById("sc-status");
    var resultEl = document.getElementById("sc-result");
    var footEl = document.getElementById("sc-foot");

    var R = 86, CX = 100, CY = 100;
    var circumference = 2 * Math.PI * R;
    var theta = 0; // 度
    var speed = 150; // 度/秒
    var zoneStart = 0, zoneWidth = 30;
    var rafId = null, lastT = null, running = false, resolved = false;
    var tries = 0, success = 0;

    function newRound() {
      resolved = false;
      theta = 0;
      zoneWidth = 34 - Math.min(12, success * 1.5); // 成功するほど少し難しく(下限22度)
      zoneStart = 40 + Math.random() * 260; // 開始直後に来すぎないよう少し余白
      var arcLen = (circumference * zoneWidth) / 360;
      zone.setAttribute("stroke-dasharray", arcLen + " " + (circumference - arcLen));
      zone.style.transform = "rotate(" + zoneStart + "deg)";
      zone.style.transformOrigin = CX + "px " + CY + "px";
      statusEl.textContent = "タイミングを狙え";
      statusEl.className = "mg-status";
      resultEl.textContent = "🎯";
      running = true;
      lastT = null;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    function tick(t) {
      if (!running) return;
      if (lastT === null) lastT = t;
      var dt = (t - lastT) / 1000;
      lastT = t;
      theta = (theta + speed * dt) % 360;
      var rad = (theta * Math.PI) / 180;
      needle.setAttribute("cx", CX + R * Math.cos(rad));
      needle.setAttribute("cy", CY + R * Math.sin(rad));
      if (theta < speed * dt) {
        // 1周して不成功のまま戻ってきたら自動的に失敗扱い
        if (!resolved) fail();
      }
      rafId = requestAnimationFrame(tick);
    }

    function inZone() {
      var end = zoneStart + zoneWidth;
      if (end <= 360) return theta >= zoneStart && theta <= end;
      return theta >= zoneStart || theta <= end - 360;
    }

    function press() {
      if (!running || resolved) return;
      tries++;
      if (inZone()) {
        resolved = true;
        success++;
        resultEl.textContent = "🎉";
        statusEl.textContent = "成功!";
        statusEl.className = "mg-status ok";
        running = false;
        setTimeout(newRound, 850);
      } else {
        fail();
      }
      footEl.textContent = "成功: " + success + " / 挑戦: " + tries;
    }

    function fail() {
      if (resolved) return;
      resolved = true;
      resultEl.textContent = "💥";
      statusEl.textContent = "ズレた…もう一度";
      statusEl.className = "mg-status bad";
      running = false;
      footEl.textContent = "成功: " + success + " / 挑戦: " + tries;
      setTimeout(newRound, 850);
    }

    btn.addEventListener("click", press);
    btn.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); press(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== " ") return;
      var rect = root.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0 && running) {
        e.preventDefault();
        press();
      }
    });

    newRound();
    running = false; // 最初はボタンを押すまで待機
    statusEl.textContent = "「押す!」を押してスタート";
    btn.textContent = "はじめる";
    btn.addEventListener("click", function once() {
      btn.textContent = "押す!";
      btn.removeEventListener("click", once);
      running = true;
      lastT = null;
      rafId = requestAnimationFrame(tick);
    }, { once: true });
  }

  /* ============================================================
     ② もがき(両手交互連打)
     ============================================================ */
  function initMash() {
    var root = document.getElementById("mg-mash");
    if (!root) return;
    var fill = document.getElementById("mash-fill");
    var startBtn = document.getElementById("mash-start");
    var leftBtn = document.getElementById("mash-left");
    var rightBtn = document.getElementById("mash-right");
    var statusEl = document.getElementById("mash-status");
    var timeEl = document.getElementById("mash-time");

    var LIMIT = 6.0;
    var gauge = 0, timeLeft = LIMIT, lastKey = null, active = false, rafId = null, lastT = null;

    function render() {
      fill.style.width = Math.min(100, gauge) + "%";
      timeEl.textContent = "残り " + timeLeft.toFixed(1) + "秒";
    }

    function tick(t) {
      if (!active) return;
      if (lastT === null) lastT = t;
      var dt = (t - lastT) / 1000;
      lastT = t;
      timeLeft -= dt;
      gauge -= dt * 6; // 何もしないと少しずつ落ちる
      if (gauge < 0) gauge = 0;
      render();
      if (gauge >= 100) return win();
      if (timeLeft <= 0) return lose();
      rafId = requestAnimationFrame(tick);
    }

    function hit(key) {
      if (!active) return;
      var boost = key === lastKey ? 3 : 7; // 同じ手の連打より交互の方が効く
      gauge += boost;
      lastKey = key;
      var btnEl = key === "L" ? leftBtn : rightBtn;
      btnEl.classList.remove("pulse");
      void btnEl.offsetWidth;
      btnEl.classList.add("pulse");
    }

    function win() {
      active = false;
      statusEl.textContent = "逃げ切った!";
      statusEl.className = "mg-status ok";
      startBtn.textContent = "もう一度";
    }
    function lose() {
      active = false;
      statusEl.textContent = "力尽きた…もう一度!";
      statusEl.className = "mg-status bad";
      startBtn.textContent = "もう一度";
    }

    function start() {
      gauge = 0; timeLeft = LIMIT; lastKey = null; active = true; lastT = null;
      statusEl.textContent = "連打しろ!";
      statusEl.className = "mg-status";
      render();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    startBtn.addEventListener("click", start);
    leftBtn.addEventListener("pointerdown", function () { hit("L"); });
    rightBtn.addEventListener("pointerdown", function () { hit("R"); });
    document.addEventListener("keydown", function (e) {
      if (!active) return;
      var k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") { e.preventDefault(); hit("L"); }
      else if (k === "arrowright" || k === "d") { e.preventDefault(); hit("R"); }
    });
    render();
  }

  /* ============================================================
     ③ 攻撃・回避のコツ(タイミングゲーム)
     ============================================================ */
  function initDodge() {
    var root = document.getElementById("mg-dodge");
    if (!root) return;
    var teacher = document.getElementById("dodge-teacher");
    var windup = document.getElementById("dodge-windup");
    var flash = document.getElementById("dodge-flash");
    var btn = document.getElementById("dodge-btn");
    var statusEl = document.getElementById("dodge-status");
    var footEl = document.getElementById("dodge-foot");

    var telegraphActive = false, roundResolved = true, tries = 0, success = 0;
    var timers = [];

    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function roundStart() {
      clearTimers();
      roundResolved = false;
      telegraphActive = false;
      windup.classList.remove("show");
      teacher.style.transition = "none";
      teacher.style.left = "6%";
      // reflow
      void teacher.offsetWidth;
      var approachMs = 700 + Math.random() * 500;
      teacher.style.transition = "left " + approachMs + "ms linear";
      requestAnimationFrame(function () {
        teacher.style.left = "58%";
      });
      timers.push(setTimeout(function () {
        telegraphActive = true;
        windup.classList.add("show");
        var windupMs = 520;
        timers.push(setTimeout(function () {
          telegraphActive = false;
          windup.classList.remove("show");
          teacher.style.transition = "left 140ms cubic-bezier(.3,.8,.4,1)";
          teacher.style.left = "88%";
          timers.push(setTimeout(function () {
            if (!roundResolved) hitPlayer();
          }, 170));
        }, windupMs));
      }, approachMs));
    }

    function hitPlayer() {
      roundResolved = true;
      tries++;
      flash.classList.remove("hit");
      void flash.offsetWidth;
      flash.classList.add("hit");
      statusEl.textContent = "被弾!間合いを覚えよう";
      statusEl.className = "mg-status bad";
      footEl.textContent = "成功: " + success + " / 挑戦: " + tries;
      timers.push(setTimeout(roundStart, 900));
    }

    function press() {
      if (roundResolved) return;
      tries++;
      if (telegraphActive) {
        roundResolved = true;
        success++;
        clearTimers();
        teacher.style.transition = "left 220ms ease-out";
        teacher.style.left = "40%";
        statusEl.textContent = "かわした!";
        statusEl.className = "mg-status ok";
        footEl.textContent = "成功: " + success + " / 挑戦: " + tries;
        timers.push(setTimeout(roundStart, 850));
      } else {
        roundResolved = true;
        clearTimers();
        statusEl.textContent = "早すぎ/遅すぎ…構えを見てから!";
        statusEl.className = "mg-status bad";
        footEl.textContent = "成功: " + success + " / 挑戦: " + tries;
        timers.push(setTimeout(roundStart, 850));
      }
    }

    btn.addEventListener("click", function () {
      if (btn.textContent === "はじめる") {
        btn.textContent = "よける!";
        roundStart();
        return;
      }
      press();
    });

    statusEl.textContent = "「はじめる」を押してスタート";
    btn.textContent = "はじめる";
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSkillCheck();
    initMash();
    initDodge();
  });
})();
