// Đập Chuột — theo docs/02-chuc-nang, 03-man-hinh, 04-quy-tac-du-lieu
(() => {
  "use strict";

  // ── Thông số (04 · Thông số) ──
  const ROUND_MS = 10000;
  const MOLE_UP_MS = 800;
  const MOLE_GAP_MS = 300;
  const HIT_FLASH_MS = 150;
  const VIBRATE_MS = 30;
  const WARN_AT_S = 3;

  const KEY_BEST = "dapchuot.best";
  const KEY_SOUND = "dapchuot.sound";

  // F17: bố cục bàn phím số — 7 8 9 hàng trên, 1 2 3 hàng dưới
  const KEY_TO_CELL = { 7: 0, 8: 1, 9: 2, 4: 3, 5: 4, 6: 5, 1: 6, 2: 7, 3: 8 };

  // ── DOM ──
  const $ = (id) => document.getElementById(id);
  const screens = { start: $("screen-start"), play: $("screen-play"), end: $("screen-end") };
  const board = $("board");
  const scoreEl = $("score");
  const timerEl = $("timer");
  const timerWrap = $("timer-wrap");
  const soundBtn = $("sound-toggle");

  const cells = [];
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cell";
    btn.dataset.index = String(i);
    btn.setAttribute("aria-label", `Ô ${i + 1}`);
    btn.innerHTML = '<span class="mole" aria-hidden="true">🐭</span>';
    board.appendChild(btn);
    cells.push(btn);
  }

  // ── Lưu trữ (04 · Dữ liệu lưu trên máy) — có thể bị chặn, không được làm hỏng game ──
  const memory = {};
  function readStore(key) {
    try { return localStorage.getItem(key); } catch { return key in memory ? memory[key] : null; }
  }
  function writeStore(key, value) {
    memory[key] = value;
    try { localStorage.setItem(key, value); } catch { /* chặn lưu trữ: chỉ giữ trong phiên */ }
  }
  function loadBest() {
    const n = Number.parseInt(readStore(KEY_BEST), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  // ── Trạng thái (04 · Trạng thái trong một lượt) ──
  const state = {
    screen: "start",
    score: 0,
    endsAt: 0,
    moleCell: null,
    lastCell: null,
    best: loadBest(),
    soundOn: readStore(KEY_SOUND) !== "off",
    round: 0, // tăng mỗi lượt để bỏ qua hẹn giờ của lượt cũ (F07)
  };
  let moleTimer = 0;
  let tickTimer = 0;

  // ── Âm thanh tự tạo bằng Web Audio (F11) và rung (F12) ──
  let audio = null;
  function ensureAudio() {
    if (audio) return audio;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { audio = new Ctx(); } catch { audio = null; }
    return audio;
  }
  function tone(type, from, to, start, dur, peak) {
    const ctx = audio;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + start;
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
  function playHit() {
    if (!state.soundOn || !audio) return;
    tone("sine", 420, 110, 0, 0.09, 0.5); // tiếng "bốp"
  }
  function playBell() {
    if (!state.soundOn || !audio) return;
    tone("triangle", 880, 880, 0, 0.6, 0.25); // tiếng chuông hết giờ
    tone("triangle", 1320, 1320, 0.12, 0.6, 0.18);
  }
  function vibrate() {
    if (!state.soundOn || typeof navigator.vibrate !== "function") return;
    try { navigator.vibrate(VIBRATE_MS); } catch { /* không hỗ trợ: bỏ qua */ }
  }

  function renderSound() {
    soundBtn.textContent = state.soundOn ? "🔊" : "🔇";
    soundBtn.setAttribute("aria-pressed", String(state.soundOn));
    soundBtn.setAttribute("aria-label", state.soundOn ? "Tắt âm thanh và rung" : "Bật âm thanh và rung");
  }

  // ── Màn hình ──
  function show(name) {
    state.screen = name;
    for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
    $("best-start").textContent = String(state.best);
    $("best-end").textContent = String(state.best);
    const focusTarget = name === "start" ? $("btn-start") : name === "end" ? $("btn-replay") : null;
    if (focusTarget) focusTarget.focus({ preventScroll: true });
  }

  function secondsLeft() {
    return Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
  }
  function renderTimer() {
    const s = secondsLeft();
    timerEl.textContent = String(s).padStart(2, "0");
    timerWrap.classList.toggle("warn", s <= WARN_AT_S);
  }

  // ── Chuột (L3–L7) ──
  function hideMole() {
    if (state.moleCell !== null) cells[state.moleCell].classList.remove("up");
    state.moleCell = null;
  }
  function pickCell() {
    // L6: chọn đều trong 8 ô khác ô liền trước
    const choices = [];
    for (let i = 0; i < 9; i++) if (i !== state.lastCell) choices.push(i);
    return choices[Math.floor(Math.random() * choices.length)];
  }
  function scheduleNextMole(round) {
    clearTimeout(moleTimer);
    moleTimer = setTimeout(() => {
      if (round !== state.round || state.screen !== "play") return;
      if (Date.now() >= state.endsAt) return;
      const cell = pickCell();
      state.moleCell = cell;
      state.lastCell = cell;
      cells[cell].classList.add("up");
      // L4: ở lại 0,8 giây rồi tự biến mất (D4: không điểm)
      moleTimer = setTimeout(() => {
        if (round !== state.round || state.moleCell !== cell) return;
        hideMole();
        scheduleNextMole(round); // L5
      }, MOLE_UP_MS);
    }, MOLE_GAP_MS);
  }

  // ── Vòng chơi ──
  function startRound() {
    ensureAudio();
    if (audio && audio.state === "suspended") audio.resume().catch(() => {});

    state.round += 1;
    state.score = 0;
    state.moleCell = null;
    state.lastCell = null;
    state.endsAt = Date.now() + ROUND_MS;
    clearTimeout(moleTimer);
    clearInterval(tickTimer);
    for (const c of cells) c.classList.remove("up", "hit");
    board.classList.remove("locked");

    scoreEl.textContent = "0";
    renderTimer();
    show("play");

    const round = state.round;
    // F02: tính theo mốc thời gian thực nên không trôi khi đếm
    tickTimer = setInterval(() => {
      if (round !== state.round) return;
      renderTimer();
      if (Date.now() >= state.endsAt) endRound(false);
    }, 100);
    scheduleNextMole(round); // L5: chuột đầu tiên sau 0,3 giây
  }

  function endRound(aborted) {
    if (state.screen !== "play") return;
    state.round += 1; // vô hiệu mọi hẹn giờ còn lại
    clearTimeout(moleTimer);
    clearInterval(tickTimer);
    hideMole();
    board.classList.add("locked"); // L8

    let newBest = false;
    if (!aborted && state.score > state.best) {
      state.best = state.score;
      writeStore(KEY_BEST, String(state.best));
      newBest = true;
    }
    if (!aborted) playBell(); // D5

    $("end-title").textContent = aborted ? "Lượt bị dừng" : "Hết giờ!";
    $("final-score").textContent = String(state.score);
    $("new-best").hidden = !newBest;
    $("aborted-note").hidden = !aborted;
    show("end");
  }

  function whack(index) {
    // L8: hết giờ thì bỏ qua mọi thao tác trên lưới
    if (state.screen !== "play" || Date.now() >= state.endsAt) return;
    if (index !== state.moleCell) return; // D2, D3: bấm trượt không đổi điểm, không tiếng

    const cell = cells[index];
    hideMole();
    state.score += 1; // D1
    scoreEl.textContent = String(state.score);
    cell.classList.add("hit");
    setTimeout(() => cell.classList.remove("hit"), HIT_FLASH_MS);
    playHit();
    vibrate();
    scheduleNextMole(state.round); // L5
  }

  // ── Sự kiện ──
  // F14: xử lý ngay khi chạm xuống, không chờ nhả tay
  board.addEventListener("pointerdown", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell) return;
    e.preventDefault();
    whack(Number(cell.dataset.index));
  });
  // Bấm Enter/Space khi ô đang được focus bằng bàn phím
  board.addEventListener("click", (e) => {
    if (e.detail !== 0) return; // click từ chuột/chạm đã xử lý ở pointerdown
    const cell = e.target.closest(".cell");
    if (cell) whack(Number(cell.dataset.index));
  });

  document.addEventListener("keydown", (e) => {
    if (state.screen !== "play" || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if (!digit) return;
    e.preventDefault();
    whack(KEY_TO_CELL[digit[1]]);
  });

  $("btn-start").addEventListener("click", startRound);
  $("btn-replay").addEventListener("click", startRound);
  $("btn-home").addEventListener("click", () => show("start"));

  soundBtn.addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    writeStore(KEY_SOUND, state.soundOn ? "on" : "off");
    renderSound();
  });

  // F16: rời tab giữa lượt thì dừng lượt, hiện điểm nhưng không tính kỷ lục
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.screen === "play") endRound(true);
  });

  renderSound();
  show("start");
})();
