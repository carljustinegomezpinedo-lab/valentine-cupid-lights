const stage = document.querySelector(".stage");
const canvas = document.getElementById("lights");
const ctx = canvas.getContext("2d");
const toggleBtn = document.getElementById("toggle");
const paletteBtn = document.getElementById("palette");
const lineBtn = document.getElementById("lineBtn");
const messageEl = document.getElementById("message");

const lines = [
  "Drag your cursor to draw glowing love trails.",
  "Little moments become constellations when shared.",
  "Your kindness can light up someone's whole evening.",
  "Love is a trail of actions, not just words.",
  "Every spark starts with one intentional step."
];

const palettes = [
  { name: "ROSE", colors: ["#ff6384", "#ff8fab", "#ff4d6d"] },
  { name: "PEACH", colors: ["#ff9770", "#ffb087", "#ff6f91"] },
  { name: "CORAL", colors: ["#ff6a70", "#ff8e72", "#ff759f"] }
];

const particles = [];
const pointer = {
  x: 0,
  y: 0,
  lastX: 0,
  lastY: 0,
  active: false
};

let effectsOn = true;
let paletteIndex = 0;
let lineIndex = 0;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function localXY(e) {
  const r = stage.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function resize() {
  const r = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(r.width * dpr);
  canvas.height = Math.floor(r.height * dpr);
  canvas.style.width = `${r.width}px`;
  canvas.style.height = `${r.height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function currentPalette() {
  return palettes[paletteIndex];
}

function pickColor() {
  const colors = currentPalette().colors;
  return colors[(Math.random() * colors.length) | 0];
}

function applyPalette() {
  const p = currentPalette();
  stage.style.setProperty("--glow-a", p.colors[0]);
  stage.style.setProperty("--glow-b", p.colors[1]);
  stage.style.setProperty("--glow-c", p.colors[2]);
  paletteBtn.textContent = `Palette: ${p.name}`;
}

function spawnHeart(x, y, burst = false) {
  particles.push({
    type: "heart",
    x,
    y,
    vx: rand(-0.35, 0.35) + (burst ? rand(-1.7, 1.7) : 0),
    vy: rand(-1.35, -0.45) + (burst ? rand(-1.8, 0.8) : 0),
    gravity: rand(0.005, 0.012),
    size: burst ? rand(9, 18) : rand(7, 14),
    life: 1,
    decay: burst ? rand(0.009, 0.016) : rand(0.0045, 0.009),
    color: pickColor(),
    phase: rand(0, Math.PI * 2),
    wave: rand(0.06, 0.11),
    waveAmp: rand(0.12, 0.35),
    rot: rand(-0.45, 0.45),
    vrot: rand(-0.025, 0.025)
  });
}

function spawnSpark(x, y, burst = false) {
  particles.push({
    type: "spark",
    x,
    y,
    vx: rand(-0.6, 0.6) + (burst ? rand(-1.9, 1.9) : 0),
    vy: rand(-1.2, -0.2) + (burst ? rand(-1.6, 0.9) : 0),
    gravity: rand(0.004, 0.011),
    size: burst ? rand(2.5, 4.5) : rand(1.6, 3.2),
    life: 1,
    decay: burst ? rand(0.012, 0.02) : rand(0.01, 0.018),
    color: pickColor(),
    phase: rand(0, Math.PI * 2),
    wave: rand(0.09, 0.14),
    waveAmp: rand(0.1, 0.3)
  });
}

function spawnTrail(x, y) {
  spawnHeart(x, y, false);
  if (Math.random() > 0.55) {
    spawnSpark(x, y, false);
  }
}

function burst(x, y) {
  for (let i = 0; i < 30; i += 1) {
    spawnHeart(x, y, true);
    if (Math.random() > 0.5) {
      spawnSpark(x, y, true);
    }
  }
}

function drawHeart(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.scale(p.size / 19, p.size / 19);

  ctx.globalAlpha = Math.max(0, p.life);
  ctx.fillStyle = p.color;
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 14;

  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-10, -4, -18, 6, 0, 20);
  ctx.bezierCurveTo(18, 6, 10, -4, 0, 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawSpark(p) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, p.life);
  ctx.fillStyle = p.color;
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function animate() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];

    p.phase += p.wave;
    p.x += p.vx + Math.sin(p.phase) * p.waveAmp;
    p.y += p.vy;
    p.vy += p.gravity;
    p.life -= p.decay;

    if (p.type === "heart") {
      p.rot += p.vrot;
      drawHeart(p);
    } else {
      drawSpark(p);
    }

    if (p.life <= 0 || p.y > h + 70 || p.x < -70 || p.x > w + 70) {
      particles.splice(i, 1);
    }
  }

  requestAnimationFrame(animate);
}

stage.addEventListener("pointermove", (e) => {
  if (!effectsOn) {
    return;
  }

  const pos = localXY(e);

  if (!pointer.active) {
    pointer.active = true;
    pointer.lastX = pos.x;
    pointer.lastY = pos.y;
  }

  const dx = pos.x - pointer.lastX;
  const dy = pos.y - pointer.lastY;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.floor(dist / 11));

  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    spawnTrail(pointer.lastX + dx * t, pointer.lastY + dy * t);
  }

  pointer.lastX = pos.x;
  pointer.lastY = pos.y;
  pointer.x = pos.x;
  pointer.y = pos.y;
});

stage.addEventListener("pointerleave", () => {
  pointer.active = false;
});

stage.addEventListener("pointerdown", (e) => {
  if (!effectsOn) {
    return;
  }
  const pos = localXY(e);
  burst(pos.x, pos.y);
});

toggleBtn.addEventListener("click", () => {
  effectsOn = !effectsOn;
  toggleBtn.textContent = `FX: ${effectsOn ? "ON" : "OFF"}`;
});

paletteBtn.addEventListener("click", () => {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  applyPalette();
});

lineBtn.addEventListener("click", () => {
  messageEl.classList.add("fade");
  setTimeout(() => {
    lineIndex = (lineIndex + 1) % lines.length;
    messageEl.textContent = lines[lineIndex];
    messageEl.classList.remove("fade");
  }, 120);
});

window.setInterval(() => {
  if (!effectsOn) {
    return;
  }

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  spawnHeart(rand(24, w - 24), h - rand(8, 28), false);
  if (Math.random() > 0.65) {
    spawnSpark(rand(24, w - 24), h - rand(8, 24), false);
  }
}, 300);

window.addEventListener("resize", resize);

resize();
applyPalette();
animate();
