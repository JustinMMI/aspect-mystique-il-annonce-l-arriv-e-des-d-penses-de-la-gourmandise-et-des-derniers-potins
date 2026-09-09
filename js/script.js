
(() => {
"use strict";


const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const rnd = (a, b) => Math.random() * (b - a) + a;
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const body = document.body;
const el = {
  powergate: $("#powergate"), powerBtn: $("#powerBtn"),
  scene:     $("#scene"),     machine:  $("#machine"),  eyes: $("#eyes"),
  tickerTxt: $("#tickerTxt"), jauge:    $("#jauge"),
  counter:   $("#counter"),
  panelCode: $("#panelCode"), panelState: $("#panelState"), lampGreen: $("#lampGreen"),
  dlgWho:    $("#dlgWho"),    dlgText:  $("#dlgText"),   dlgStat: $("#dlgStat"),
  dialogue:  $("#dialogue"),
  slotForm:  $("#slotForm"),  input:    $("#gossip"),    feedBtn: $("#feedBtn"),
  retryBtn:  $("#retryBtn"),
  scare:     $("#scare"),     scareWord: $("#scareWord"),
  iris:      $("#iris"),
  paradise:  $("#paradise"),  parQuote: $("#parQuote"),  restartBtn: $("#restartBtn"),
  parClouds: $("#parClouds"), parCoins: $("#parCoins"), parSparkles: $("#parSparkles"),
  hintBtn: $("#hintBtn"), hintModal: $("#hintModal"), hintClose: $("#hintClose"),
  hintText: $("#hintText"), hintNext: $("#hintNext"),
};
const segments = [...el.jauge.children];


const Audio_ = (() => {
  let ctx = null, master = null, humNodes = null, noiseBuf = null;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function noise(dur, gain, type, freq, q) {
    if (!ctx) return;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(f).connect(g).connect(master);
    src.start(); src.stop(ctx.currentTime + dur + .05);
  }

  return {
    async unlock() {
      init();
      if (ctx && ctx.state === "suspended") { try { await ctx.resume(); } catch (e) {} }
    },

    startHum() {
      if (!ctx || humNodes) return;
      const o1 = ctx.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = 46;
      const o2 = ctx.createOscillator(); o2.type = "square";   o2.frequency.value = 23;
      const sub = ctx.createOscillator(); sub.type = "sine";   sub.frequency.value = 35;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 160; lp.Q.value = 5;
      const g  = ctx.createGain(); g.gain.value = 0;
      const lfo = ctx.createOscillator(); lfo.frequency.value = .18;
      const lfoG = ctx.createGain(); lfoG.gain.value = 30;
      lfo.connect(lfoG).connect(lp.frequency);
      o1.connect(lp); o2.connect(lp); sub.connect(lp); lp.connect(g).connect(master);
      o1.start(); o2.start(); sub.start(); lfo.start();
      g.gain.linearRampToValueAtTime(.14, ctx.currentTime + 2.5);

      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3200;
      const ng = ctx.createGain(); ng.gain.value = .012;
      src.connect(hp).connect(ng).connect(master); src.start();
      humNodes = { o1, o2, sub, lfo, g, noise: src, ng, lp };
    },

    stopHum(fade = .35) {
      if (!ctx || !humNodes) return;
      const n = humNodes; humNodes = null;
      n.g.gain.cancelScheduledValues(ctx.currentTime);
      n.g.gain.setValueAtTime(n.g.gain.value, ctx.currentTime);
      n.g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade);
      n.ng.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade);
      setTimeout(() => {
        [n.o1, n.o2, n.sub, n.lfo, n.noise].forEach((o) => { try { o.stop(); } catch (e) {} });
      }, fade * 1000 + 60);
    },

    humTension(k) {
      if (!ctx || !humNodes) return;
      humNodes.lp.frequency.setTargetAtTime(160 + k * 850, ctx.currentTime, .3);
      humNodes.lp.Q.setTargetAtTime(5 + k * 12, ctx.currentTime, .3);
      humNodes.g.gain.setTargetAtTime(.14 + k * .22, ctx.currentTime, .3);
      humNodes.lfo.frequency.setTargetAtTime(.18 + k * 2.8, ctx.currentTime, .3);
    },

    duck(ms = 450) {
      if (!ctx || !master) return;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0.0001, t + .06);
      master.gain.setValueAtTime(0.0001, t + ms / 1000);
      master.gain.linearRampToValueAtTime(.9, t + ms / 1000 + .05);
    },

    boot() {
      if (!ctx) return;
      const o = ctx.createOscillator(); o.type = "square";
      const g = ctx.createGain(); g.gain.value = .0001;
      o.frequency.setValueAtTime(35, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 1.4);
      g.gain.exponentialRampToValueAtTime(.12, ctx.currentTime + .5);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + 1.6);
      o.connect(g).connect(master); o.start(); o.stop(ctx.currentTime + 1.7);
      noise(.5, .12, "bandpass", 1200, .8);
    },

    blip(high = false) {
      if (!ctx) return;
      const o = ctx.createOscillator(); o.type = "square";
      o.frequency.value = high ? rnd(1100, 1500) : rnd(680, 980);
      const g = ctx.createGain();
      g.gain.setValueAtTime(high ? .025 : .04, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .04);
      o.connect(g).connect(master); o.start(); o.stop(ctx.currentTime + .05);
    },

    clack(rate) { noise(.06, .06 + rate * .12, "bandpass", 280 + rate * 1400, 3.5); },
    heart(k = 0) {
      if (!ctx) return;
      const t = ctx.currentTime;
      const o1 = ctx.createOscillator(); o1.type = "sine";
      o1.frequency.setValueAtTime(95 + k * 35, t);
      o1.frequency.exponentialRampToValueAtTime(30, t + 0.16);
      const g1 = ctx.createGain();
      g1.gain.setValueAtTime(0.001, t);
      g1.gain.exponentialRampToValueAtTime(0.4 + k * 0.25, t + 0.02);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o1.connect(g1).connect(master); o1.start(t); o1.stop(t + 0.25);
      noise(0.03, 0.05 + k * 0.04, "highpass", 2400, 4);
      const offset = Math.max(0.08, 0.12 - k * 0.03);
      const o2 = ctx.createOscillator(); o2.type = "sine";
      o2.frequency.setValueAtTime(75 + k * 28, t + offset);
      o2.frequency.exponentialRampToValueAtTime(25, t + offset + 0.14);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.001, t + offset);
      g2.gain.exponentialRampToValueAtTime(0.3 + k * 0.2, t + offset + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.24);
      o2.connect(g2).connect(master); o2.start(t + offset); o2.stop(t + offset + 0.28);
    },

    riser(dur) {
      if (!ctx) return null;
      const t = ctx.currentTime;
      const o1 = ctx.createOscillator(); o1.type = "sawtooth";
      o1.frequency.setValueAtTime(50, t);
      o1.frequency.exponentialRampToValueAtTime(1200, t + dur);
      const o2 = ctx.createOscillator(); o2.type = "square";
      o2.frequency.setValueAtTime(53, t);
      o2.frequency.exponentialRampToValueAtTime(1220, t + dur);

      const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(180, t);
      lp.frequency.exponentialRampToValueAtTime(4500, t + dur);
      lp.Q.value = 11;
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.16, t + dur * .85);
      o1.connect(lp); o2.connect(lp); lp.connect(g).connect(master);
      o1.start(t); o2.start(t);
      return { stop(){ try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.linearRampToValueAtTime(.0001, ctx.currentTime + .08);
        o1.stop(ctx.currentTime + .12); o2.stop(ctx.currentTime + .12);
      } catch (e) {} } };
    },

    static(dur = .3) { noise(dur, .32, "highpass", 750, 1.4); },
    screamer() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const sub = ctx.createOscillator(); sub.type = "sawtooth";
      sub.frequency.setValueAtTime(180, t);
      sub.frequency.exponentialRampToValueAtTime(20, t + 1.6);
      const sh = ctx.createWaveShaper();
      const curve = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 12); }
      sh.curve = curve; sh.oversample = "4x";
      const subG = ctx.createGain();
      subG.gain.setValueAtTime(0.001, t);
      subG.gain.exponentialRampToValueAtTime(0.85, t + 0.02);
      subG.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
      sub.connect(sh).connect(subG).connect(master);
      sub.start(t); sub.stop(t + 1.65);
      const carrier = ctx.createOscillator(); carrier.type = "sawtooth";
      carrier.frequency.setValueAtTime(2800, t);
      carrier.frequency.exponentialRampToValueAtTime(150, t + 0.95);
      const modulator = ctx.createOscillator(); modulator.type = "sine";
      modulator.frequency.setValueAtTime(65, t);
      modulator.frequency.exponentialRampToValueAtTime(25, t + 0.95);
      const modG = ctx.createGain(); modG.gain.value = 550;
      modulator.connect(modG).connect(carrier.frequency);
      const screechG = ctx.createGain();
      screechG.gain.setValueAtTime(0.001, t);
      screechG.gain.exponentialRampToValueAtTime(0.45, t + 0.02);
      screechG.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
      modulator.start(t); carrier.start(t);
      carrier.connect(screechG).connect(master);
      modulator.stop(t + 1.05); carrier.stop(t + 1.05);
      const growlOsc = ctx.createOscillator(); growlOsc.type = "sawtooth";
      growlOsc.frequency.setValueAtTime(120, t);
      growlOsc.frequency.linearRampToValueAtTime(45, t + 1.2);
      const growlF = ctx.createBiquadFilter(); growlF.type = "bandpass";
      growlF.frequency.setValueAtTime(1600, t);
      growlF.frequency.exponentialRampToValueAtTime(70, t + 1.2);
      growlF.Q.value = 7;
      const growlG = ctx.createGain();
      growlG.gain.setValueAtTime(0.001, t);
      growlG.gain.exponentialRampToValueAtTime(0.5, t + 0.04);
      growlG.gain.exponentialRampToValueAtTime(0.001, t + 1.25);
      growlOsc.connect(growlF).connect(growlG).connect(master);
      growlOsc.start(t); growlOsc.stop(t + 1.3);
      noise(1.1, 0.45, "lowpass", 700, 2.5);
      noise(0.6, 0.35, "highpass", 2200, 3.5);
      setTimeout(() => {
        if (!ctx) return;
        const subEcho = ctx.createOscillator(); subEcho.type = "sine";
        subEcho.frequency.setValueAtTime(40, ctx.currentTime);
        subEcho.frequency.exponentialRampToValueAtTime(18, ctx.currentTime + 1.0);
        const subEG = ctx.createGain();
        subEG.gain.setValueAtTime(0.3, ctx.currentTime);
        subEG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        subEcho.connect(subEG).connect(master);
        subEcho.start(); subEcho.stop(ctx.currentTime + 1.05);
      }, 150);
    },

    growl() { this.screamer(); },
    defeatSound() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = "triangle";
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(30, t + 0.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.5);

      noise(0.4, 0.4, "bandpass", 450, 4);
    },
    motor(dur = 1.2) {
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(110, t);
      o.frequency.linearRampToValueAtTime(85, t + dur);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 450;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.1);
      g.gain.linearRampToValueAtTime(0.001, t + dur);
      o.connect(lp).connect(g).connect(master);
      o.start(t); o.stop(t + dur + 0.05);
      noise(dur, 0.08, "bandpass", 600, 2);
    },

    coinDrop() {
      if (!ctx) return;
      const t = ctx.currentTime;
      [1800, 2400, 3100, 4200].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, t + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.05 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.14);
        o.connect(g).connect(master);
        o.start(t + i * 0.05); o.stop(t + i * 0.05 + 0.16);
      });
      noise(0.2, 0.1, "highpass", 2200, 2.5);
    },

    demonic() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(70, t);
      o.frequency.linearRampToValueAtTime(25, t + 2.8);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380; lp.Q.value = 12;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.45, t + 0.2);
      g.gain.linearRampToValueAtTime(0.001, t + 2.8);
      o.connect(lp).connect(g).connect(master);
      o.start(t); o.stop(t + 2.9);
      noise(2.8, 0.28, "lowpass", 450, 1.2);
    },
    chime() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98, 1975.53, 2349.32]; // C5 à D7
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.22 / (i * 0.25 + 1), t + i * 0.05 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2 + i * 0.1);
        o.connect(g).connect(master);
        o.start(t + i * 0.05); o.stop(t + 3.6);
      });
    },

    heaven() {
      if (!ctx) return null;
      const t = ctx.currentTime;
      const g = ctx.createGain(); g.gain.value = 0; g.connect(master);
      [130.81, 261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 1046.50].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = i % 2 === 0 ? "sine" : "triangle";
        o.frequency.value = f;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 3.5 + i * 0.4;
        const lfoG = ctx.createGain(); lfoG.gain.value = 0.02;
        lfo.connect(lfoG).connect(o.frequency);
        const og = ctx.createGain(); og.gain.value = 0.09 / (i * 0.35 + 1);
        o.connect(og).connect(g);
        lfo.start(t); o.start(t); o.stop(t + 60);
      });
      g.gain.linearRampToValueAtTime(0.6, t + 2.5);
      return g;
    },
  };
})();


const EyesAndParallax = (() => {
  const nodes = $$("[data-eye]");
  let blinkTimer = null, tracking = false, mx = window.innerWidth / 2, my = window.innerHeight / 2, raf = null;

  function scheduleBlink() {
    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(() => {
      nodes.forEach((n, i) => setTimeout(() => {
        n.classList.add("blink");
        setTimeout(() => n.classList.remove("blink"), rndInt(90, 170));
      }, i * rndInt(60, 700)));
      scheduleBlink();
    }, rndInt(1800, 6200));
  }

  function loop() {
    nodes.forEach((n) => {
      const ball = n.querySelector(".eye__ball");
      if (!ball) return;
      const r = n.getBoundingClientRect();
      if (!r.width) return;
      const dx = (mx - (r.left + r.width / 2)) / Math.max(r.width, 1);
      const dy = (my - (r.top + r.height / 2)) / Math.max(r.height, 1);
      const x = Math.max(-1, Math.min(1, dx)) * 26;
      const y = Math.max(-1, Math.min(1, dy)) * 13;
      ball.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
    raf = null;
  }

  return {
    start() {
      if (tracking) return;
      tracking = true;
      scheduleBlink();
      const update = (cx, cy) => {
        mx = cx; my = cy;
        if (!raf) raf = requestAnimationFrame(loop);
      };
      window.addEventListener("pointermove", (e) => update(e.clientX, e.clientY), { passive: true });
      window.addEventListener("pointerdown", (e) => update(e.clientX, e.clientY), { passive: true });
      window.addEventListener("touchmove", (e) => {
        if (e.touches && e.touches[0]) update(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
    },
    scanning(on) { el.eyes.classList.toggle("scanning", on); },
    lunge(on)    { el.eyes.classList.toggle("lunge", on); },
    freeze()     { nodes.forEach((n) => { const b = n.querySelector(".eye__ball"); if (b) b.style.transform = "translate(0,0)"; }); },
    center()     { nodes.forEach((n) => { const b = n.querySelector(".eye__ball"); if (b) b.style.transform = ""; }); },
  };
})();


function ticker(texte, ton) {
  el.tickerTxt.textContent = texte;
  el.tickerTxt.className = "ticker__txt" + (ton ? " " + ton : "");
}
function jauge(p) {
  const n = segments.length;
  segments.forEach((s, i) => s.classList.toggle("on", i / n < p));
}


let typing = 0;

function speaker(who) {
  el.dlgWho.textContent = who;
  el.dlgWho.classList.toggle("is-you", who === "VOUS");
}

async function say(text, { speed = 30, cls = "", sound = true } = {}) {
  const token = ++typing;
  el.dlgText.className = "dialogue__text caret" + (cls ? " " + cls : "");
  el.dlgText.textContent = "";
  for (const ch of text) {
    if (token !== typing) return false;
    el.dlgText.textContent += ch;
    if (sound && ch !== " " && Math.random() > .3) Audio_.blip();
    await wait(ch === "." || ch === "," ? speed * 3.5 : speed + rnd(-8, 14));
  }
  if (token === typing) el.dlgText.classList.remove("caret");
  return true;
}

function clearDialogue() {
  typing++;
  el.dlgText.textContent = "";
  el.dlgText.className = "dialogue__text";
  el.dlgStat.textContent = "";
}


const racines = [
  "tromp", "cocu", "infidel", "trahi", "poucav", "cafard", "balance", "dossier", "nude",
  "embrass", "largu", "plaqu", "quitt", "amoureu", "dragu", "flirt",
  "crush", "ruptur", "rompu", "celibat", "pecho", "chopp", "bais", "cuch", "kiff", "galoch",
  "menti", "menteur", "mensonge", "mytho", "cach", "avou", "jure",
  "secret", "chuchot", "rumeur", "parait", "scandal", "surpris", "jalou",
  "argent", "dette", "fauch", "rembours", "vole", "arnaqu", "piqu", "rachet",
  "engueul", "bagarre", "clash", "insult", "harcel", "menac", "frapp", "gifl",
  "embrouill", "malaise", "honte", "genan", "ridicul",
  "trich", "copi", "vire", "renvoy", "exclu", "redoubl", "convoqu", "surveillant", "prof", "note", "exam", "sech",
  "ivre", "bourr", "vomi", "pleur", "demission", "licenci", "grossesse", "enceinte", "soiree", "fete", "alcool",
  "story", "insta", "snap", "captur", "screen", "supprim", "bloqu", "ghost", "photo", "video",
];
const motsExacts = ["ex", "vol", "nue", "nu"];
const expressions = [
  "sort avec", "sortent ensemble", "vu avec", "en cachette", "dans le dos",
  "personne ne sait", "juré de ne rien dire", "il parait que", "on m a dit",
  "tout le monde le sait", "s est fait", "a couché", "coup de", "sous le nez",
];
const phrasesBidons = ["rien", "sais pas", "aucune idée", "je sais pas", "chépa", "chais pas", "bonjour", "test"];
const repliquesRejet = [
  "C'est tout ? Mes capteurs s'ennuient.",
  "Pathétique. Recommence.",
  "Je connais déjà ça, humain.",
  "Pas assez croustillant. Au suivant.",
  "Tu appelles ça un potin ?",
  "Insuffisant. Réessaie, si tu oses.",
];
const repliquesAcceptation = [
  "...Intéressant. Entre.",
  "Voilà enfin quelque chose digne de mon attention.",
  "Ça, c'est un vrai potin. Bienvenue.",
];
const paliers = [
  { ticker: "...ANALYSE EN COURS...",    code: "ANALYSE", etat: "LECTURE" },
  { ticker: "RECOUPEMENT DES TÉMOINS",   code: "RECOUP.", etat: "CROISEMENT" },
  { ticker: "MESURE DU CROUSTILLANT",    code: "CRUST.",  etat: "PESÉE" },
];
const marmonnements = [
  "je crois que j'ai déjà entendu ça.",
  "...tu transpires, humain.",
  "attends. redis-moi ce nom.",
  "mes archives se souviennent de toi.",
  "ne bouge pas. je regarde.",
  "quelqu'un va souffrir de ça.",
];
const motsScare = ["RECALÉ", "REFUSÉ", "NON", "MENSONGE", "DÉGAGE"];

const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const escapeRe  = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const testRacine = (norm, r) =>
  new RegExp(`(^|[^a-z0-9])${escapeRe(r)}[a-z]{0,8}([^a-z0-9]|$)`).test(norm);
const testExact = (norm, m) =>
  new RegExp(`(^|[^a-z0-9])${escapeRe(m)}([^a-z0-9]|$)`).test(norm);

function juger(texte) {
  const brut = texte.trim();
  const mots = brut.split(/\s+/).filter(Boolean);
  const norm = normalize(brut);

  if (mots.length < 3) return { accepte: false, raison: "court" };
  if (mots.length <= 6) {
    for (const bidon of phrasesBidons) {
      if (norm.includes(normalize(bidon))) return { accepte: false, raison: "bidon" };
    }
  }

  let score = 0;
  const trouves = new Set();
  for (const r of racines)     if (testRacine(norm, normalize(r))) trouves.add(r);
  for (const m of motsExacts)  if (testExact(norm, normalize(m)))  trouves.add(m);
  for (const e of expressions) if (norm.includes(normalize(e)))    trouves.add(e);
  score += Math.min(trouves.size * 2, 6);

  const motsExclus = ["ET", "LA", "LE", "LES", "UN", "UNE", "DES", "PAR", "SUR", "DANS", "AVEC", "POUR", "MAIS"];
  const nomPropre = mots.slice(1).some((m) => {
    const w = m.replace(/^[^A-Za-zÀ-ÿ]+|[^A-Za-zÀ-ÿ]+$/g, "");
    if (w.length <= 1 || motsExclus.includes(w)) return false;
    return /^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’-]+$/.test(w) || /^[A-ZÀ-ÖØ-Þ]{2,}$/.test(w);
  });
  if (nomPropre) score += 2;

  if (mots.length > 6)  score += 1;
  if (mots.length > 12) score += 1;

  return { accepte: score >= partie.seuil, score, raison: "score" };
}


const KEY = "distributeur.v1";
const stats = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { tentatives: s.tentatives | 0, recales: s.recales | 0 };
  } catch (e) { return { tentatives: 0, recales: 0 }; }
})();
const saveStats = () => { try { localStorage.setItem(KEY, JSON.stringify(stats)); } catch (e) {} };

function renderCounter() {
  if (stats.tentatives < 1) { el.counter.hidden = true; return; }
  el.counter.hidden = false;
  el.counter.innerHTML = `Tentatives : <b>${stats.tentatives}</b> — Recalé(e) : <b>${stats.recales}</b>`;
}

const partie = { seuil: 4, etat: "OFF" };
let paradisGain = null, panelTimer = null;

function setEtat(nom, code, label) {
  partie.etat = nom;
  el.panelCode.textContent = code;
  el.panelState.textContent = label;
}

function panelNoise(on) {
  clearInterval(panelTimer);
  if (!on) return;
  panelTimer = setInterval(() => {
    el.panelCode.textContent = rndInt(0, 255).toString(16).toUpperCase().padStart(2, "0");
  }, 110);
}

function tension(niveau) {
  body.classList.toggle("tense",   niveau >= 1);
  body.classList.toggle("tense-2", niveau >= 2);
  body.classList.toggle("tense-3", niveau >= 3);
}


async function boot() {
  setEtat("BOOT", "00", "DÉMARRAGE");
  partie.seuil = rndInt(3, 5);
  tension(0);
  clearDialogue();
  jauge(0);
  ticker("DÉMARRAGE...");
  el.slotForm.hidden = true;
  el.retryBtn.hidden = true;
  el.input.value = "";
  el.lampGreen.classList.remove("on");
  body.classList.remove("feeding");
  EyesAndParallax.lunge(false); EyesAndParallax.scanning(false);
  renderCounter();
  speaker("SYSTÈME");

  body.classList.add("is-on");
  Audio_.boot();
  Audio_.startHum();
  await wait(900);

  await say("MOD.VII — MEM 64K OK — CAPTEURS OCULAIRES 3/3 — INDEX : 12 447 ENTRÉES", { speed: 9, cls: "dim" });
  await wait(280);
  Audio_.static(.25);
  speaker("LE DISTRIBUTEUR");
  await say("SYSTÈME EN COURS DE RÉVEIL...", { speed: 38 });
  await wait(620);
  await say("INSÈRE UN POTIN POUR CONTINUER.", { speed: 38 });

  waitingInput();
}

function waitingInput() {
  setEtat("WAITING", "01", "EN ATTENTE");
  panelNoise(false);
  tension(0);
  jauge(0);
  ticker("EN ATTENTE D'UN POTIN");
  el.retryBtn.hidden = true;
  el.slotForm.hidden = false;
  el.input.value = "";
  el.input.disabled = false;
  el.feedBtn.disabled = false;
  el.lampGreen.classList.add("on");
  body.classList.remove("feeding");
  EyesAndParallax.lunge(false); EyesAndParallax.scanning(false);
  el.input.focus({ preventScroll: true });
}

async function judging(texte) {
  setEtat("JUDGING", "??", "ANALYSE");
  clearDialogue();
  speaker("LE DISTRIBUTEUR");
  el.slotForm.hidden = true;
  el.retryBtn.hidden = true;
  body.classList.remove("feeding");
  panelNoise(true);
  EyesAndParallax.scanning(true);
  jauge(0);
  ticker(paliers[0].ticker);

  stats.tentatives++; saveStats(); renderCounter();

  const duree = rnd(3600, 4600);
  const riser = Audio_.riser(duree / 1000);
  let palier = 0, prochainClack = 0, prochainCoeur = 0, marmonne = false;

  tension(1);
  const t0 = performance.now();

  await new Promise((resolve) => {
    (function frame(now) {
      const p = Math.min((now - t0) / duree, 1);
      let v = p;
      if (p > .34 && p < .46) v = .34 + (p - .34) * .18;
      if (p > .70 && p < .80) v = .55 - (p - .70) * .40;
      if (p >= .80) v = .50 + (p - .80) * 2.5;
      jauge(Math.max(0, Math.min(1, v)));

      const cible = p > .74 ? 3 : p > .40 ? 2 : 1;
      if (cible !== palier) {
        palier = cible;
        tension(palier);
        const q = paliers[palier - 1];
        ticker(q.ticker, palier === 3 ? "alerte" : "");
        el.panelState.textContent = q.etat;
        Audio_.static(.2);
      }
      Audio_.humTension(p);

      if (now > prochainClack) {
        Audio_.clack(p);
        prochainClack = now + Math.max(38, 300 - p * 265);
      }
      if (palier >= 2 && now > prochainCoeur) {
        Audio_.heart(p);
        prochainCoeur = now + Math.max(210, 720 - p * 520);
      }
      if (!marmonne && p > .48) {
        marmonne = true;
        say(pick(marmonnements), { speed: 26, cls: "dim" });
      }

      if (p < 1) requestAnimationFrame(frame); else resolve();
    })(t0);
  });

  if (riser) riser.stop();
  Audio_.duck(700);
  panelNoise(false);
  jauge(1);
  ticker("VERDICT...", "alerte");
  setEtat("JUDGING", "!!", "VERDICT");
  EyesAndParallax.scanning(false);
  EyesAndParallax.freeze();
  clearDialogue();
  tension(3);
  await wait(750);

  const res = juger(texte);
  if (res.accepte) accepte(); else rejete();
}

async function rejete() {
  setEtat("REJECTED", "XX", "REFUSÉ");
  stats.recales++; saveStats(); renderCounter();
  ticker("REFUSÉ", "alerte");

  Audio_.screamer();
  Audio_.static(.5);
  el.scareWord.textContent = pick(motsScare);
  el.scare.hidden = false;
  body.classList.add("flash", "glitch", "rush");
  EyesAndParallax.lunge(true);
  await wait(230);
  body.classList.remove("flash");
  await wait(260);
  el.scareWord.textContent = pick(motsScare);
  Audio_.static(.25);
  await wait(320);
  body.classList.remove("rush");
  EyesAndParallax.lunge(false);
  el.scare.hidden = true;
  await wait(220);
  body.classList.remove("glitch");
  Audio_.defeatSound();
  tension(0);

  speaker("LE DISTRIBUTEUR");
  await say(pick(repliquesRejet), { speed: 60, cls: "angry" });

  await wait(300);
  el.dlgStat.textContent = `${rndInt(70, 95)}% des visiteurs n'ont pas survécu à leur potin.`;
  await wait(260);
  el.retryBtn.hidden = false;
  el.retryBtn.focus({ preventScroll: true });
}

async function accepte() {
  setEtat("ACCEPTED", "OK", "OUVERTURE");
  tension(0);
  ticker("ACCÈS ACCORDÉ", "ok");
  speaker("LE DISTRIBUTEUR");
  await say("ACCÈS ACCORDÉ.", { speed: 50 });

  Audio_.chime();
  await wait(650);

  el.iris.classList.add("active");
  await wait(420);

  Audio_.stopHum(.25);
  body.classList.add("in-paradise");
  el.scene.style.display = "none";
  el.dialogue.style.display = "none";
  el.paradise.hidden = false;
  el.paradise.setAttribute("aria-hidden", "false");
  el.parQuote.textContent = pick(repliquesAcceptation);
  requestAnimationFrame(() => el.paradise.classList.add("show"));
  paradisGain = Audio_.heaven();

  el.iris.classList.add("open");
  await wait(1200);
  el.iris.classList.remove("active", "open");
}

async function recommencer() {
  if (paradisGain) {
    try { paradisGain.gain.linearRampToValueAtTime(0.0001, paradisGain.context.currentTime + .6); } catch (e) {}
    paradisGain = null;
  }
  el.iris.classList.add("active", "close");
  await wait(800);

  el.paradise.classList.remove("show");
  el.paradise.hidden = true;
  el.paradise.setAttribute("aria-hidden", "true");
  body.classList.remove("in-paradise", "is-on");
  el.scene.style.display = "";
  el.dialogue.style.display = "";
  EyesAndParallax.center();
  el.iris.classList.remove("close");
  await wait(500);
  el.iris.classList.remove("active");
  boot();
}


function triggerSnackDrop(code) {
  Audio_.motor(1.2);
  const rowLetter = code.charAt(0).toLowerCase();
  const shelf = $(`.shelf--${rowLetter}`);
  if (shelf) {
    const coils = shelf.querySelector(".shelf__coils");
    if (coils) {
      coils.style.transform = "rotateX(360deg)";
      coils.style.transition = "transform 1.2s ease-in-out";
      setTimeout(() => { coils.style.transform = ""; coils.style.transition = ""; }, 1300);
    }
  }
}

function handleKeypadClick(char) {
  Audio_.blip(true);
  if (partie.etat !== "WAITING") return;

  let current = el.panelCode.textContent;
  if (current === "--" || current === "01" || current === "00" || current.length >= 3) {
    current = char;
  } else {
    current += char;
  }
  el.panelCode.textContent = current;
  if (current === "666") {
    Audio_.demonic();
    Audio_.static(0.8);
    el.panelState.textContent = "ERR. 666";
    body.classList.add("flash", "glitch");
    setTimeout(() => body.classList.remove("flash", "glitch"), 800);
    speaker("LE DISTRIBUTEUR");
    say("MON ÂME N'EST PAS À VENDRE POUR 6,66 €.", { speed: 30, cls: "angry" });
    return;
  }
  if (current.length === 2 && /^[A-D][1-5]$/.test(current)) {
    triggerSnackDrop(current);
  }
}


function buildParadise() {
  el.parClouds.innerHTML = "";
  if (el.parSparkles) el.parSparkles.innerHTML = "";
  el.parCoins.innerHTML = "";

  const nuages = document.createDocumentFragment();
  for (let i = 0; i < 9; i++) {
    const c = document.createElement("span");
    c.className = "cloud";
    c.style.width = rndInt(160, 400) + "px";
    c.style.height = rndInt(60, 120) + "px";
    c.style.top = rndInt(2, 72) + "vh";
    c.style.left = rndInt(-10, 90) + "vw";
    c.style.opacity = rnd(.4, .85).toFixed(2);
    c.style.animationDuration = rndInt(45, 110) + "s";
    c.style.animationDelay = `-${rndInt(0, 60)}s`;
    nuages.appendChild(c);
  }
  el.parClouds.appendChild(nuages);

  if (el.parSparkles) {
    const etincelles = document.createDocumentFragment();
    for (let i = 0; i < 28; i++) {
      const s = document.createElement("span");
      s.className = "sparkle";
      const sz = rndInt(4, 10);
      s.style.width = sz + "px";
      s.style.height = sz + "px";
      s.style.left = rnd(2, 98).toFixed(2) + "vw";
      s.style.top = rnd(5, 80).toFixed(2) + "vh";
      s.style.animationDuration = rnd(1.2, 3.5).toFixed(2) + "s";
      s.style.animationDelay = `-${rnd(0, 3.5).toFixed(2)}s`;
      etincelles.appendChild(s);
    }
    el.parSparkles.appendChild(etincelles);
  }

  const pieces = document.createDocumentFragment();
  for (let i = 0; i < 42; i++) {
    const c = document.createElement("span");
    c.className = "coin" + (i % 4 === 0 ? " bill" : "");
    c.style.left = rnd(0, 100).toFixed(2) + "vw";
    c.style.animationDuration = rnd(4.2, 10.5).toFixed(2) + "s";
    c.style.animationDelay = `-${rnd(0, 10.5).toFixed(2)}s`;
    c.addEventListener("pointerdown", () => {
      Audio_.coinDrop();
      c.style.transform = "scale(2.2) rotateY(360deg)";
      c.style.opacity = "0";
      c.style.transition = "transform 0.35s ease, opacity 0.35s ease";
    });

    pieces.appendChild(c);
  }
  el.parCoins.appendChild(pieces);
}


el.powerBtn.addEventListener("click", async () => {
  await Audio_.unlock();
  el.powergate.classList.add("off");
  EyesAndParallax.start();
  buildParadise();
  boot();
});

el.input.addEventListener("input", () => {
  body.classList.toggle("feeding", el.input.value.length > 0);
  Audio_.blip(true);
});
el.input.addEventListener("focus", () => speaker("VOUS"));
el.input.addEventListener("blur", () => {
  if (partie.etat === "WAITING") speaker("LE DISTRIBUTEUR");
});

el.slotForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const texte = el.input.value.trim();
  if (!texte || partie.etat !== "WAITING") return;
  el.input.disabled = true;
  el.feedBtn.disabled = true;
  Audio_.static(.18);
  judging(texte);
});

el.retryBtn.addEventListener("click", async () => {
  el.retryBtn.hidden = true;
  clearDialogue();
  speaker("LE DISTRIBUTEUR");
  await say("INSÈRE UN POTIN POUR CONTINUER.", { speed: 30 });
  waitingInput();
});

el.restartBtn.addEventListener("click", recommencer);
$$(".slot-coin, .slot-bill, .pay__row").forEach((slot) => {
  slot.addEventListener("click", () => {
    Audio_.coinDrop();
    el.panelCode.textContent = "+0,50€";
    setTimeout(() => { if (partie.etat === "WAITING") el.panelCode.textContent = "01"; }, 1500);
  });
});
$$(".pad button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const char = btn.textContent.trim() || "5";
    handleKeypadClick(char);
  });
});


const indices = [
  "💡 CONSEIL DE SURVIE #1 :\nLe Distributeur exige un VRAI potin croustillant avec des détails. Les phrases trop courtes ou vagues sont rejetées !",
  "💡 CONSEIL DE SURVIE #2 :\nUtilisez des mots-clés comme 'sort avec', 'trompé', 'secret', 'avoué', 'dossier', 'rupture', 'soirée' ou 'rumeur'.",
  "💡 CONSEIL DE SURVIE #3 :\nExemple valide : 'Lucas sort avec Chloé en cachette depuis la soirée de vendredi.'",
  "💡 CONSEIL DE SURVIE #4 :\nAjouter un nom propre (ex: Thomas, Sarah, M. Dupont) augmente grandement votre score auprès du distributeur.",
  "💡 SECRET DES ARCHIVES :\nTapez 666 sur le clavier du distributeur pour tester la réaction du monstre..."
];

let hintIndex = 0;

function showHint() {
  if (!el.hintModal || !el.hintText) return;
  Audio_.blip(true);
  el.hintText.textContent = indices[hintIndex];
  el.hintModal.hidden = false;
  el.hintModal.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => el.hintModal.classList.add("show"));
}

function hideHint() {
  if (!el.hintModal) return;
  Audio_.blip(false);
  el.hintModal.classList.remove("show");
  setTimeout(() => {
    el.hintModal.hidden = true;
    el.hintModal.setAttribute("aria-hidden", "true");
  }, 300);
}

if (el.hintBtn) {
  el.hintBtn.addEventListener("click", showHint);
}
if (el.hintClose) {
  el.hintClose.addEventListener("click", hideHint);
}
if (el.hintNext) {
  el.hintNext.addEventListener("click", () => {
    hintIndex = (hintIndex + 1) % indices.length;
    showHint();
  });
}
if (el.hintModal) {
  el.hintModal.addEventListener("click", (e) => {
    if (e.target === el.hintModal) hideHint();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && el.hintModal && !el.hintModal.hidden) hideHint();
  if (e.key === "Enter" && partie.etat === "REJECTED" && !el.retryBtn.hidden) el.retryBtn.click();
});

renderCounter();
})();
