/* =================================================================
   LE DISTRIBUTEUR — logique du jeu
   100% front-end : aucun backend, aucun appel réseau, aucune IA.
   Le jugement du potin est un score par mots-clés (§2 du brief).
   ================================================================= */
(() => {
"use strict";

/* ============================================================
   0. RACCOURCIS
   ============================================================ */
const $ = (sel) => document.querySelector(sel);
const rnd    = (a, b) => Math.random() * (b - a) + a;
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick   = (arr) => arr[Math.floor(Math.random() * arr.length)];
const wait   = (ms) => new Promise((r) => setTimeout(r, ms));

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
  parClouds: $("#parClouds"), parCoins: $("#parCoins"),
};
const segments = [...el.jauge.children];

/* ============================================================
   1. LE VOCABULAIRE DU POTIN (§2)
   ------------------------------------------------------------
   On stocke des RACINES, pas des mots entiers : "engueul" attrape
   engueulé, engueulée, engueulés, engueuler... Sans ça, le moindre
   pluriel passait à travers et la machine refusait tout.
   ============================================================ */
const racines = [
  // trahisons
  "tromp", "cocu", "infidel", "trahi", "poucav", "cafard", "balance", "dossier", "nude",
  // relations
  "embrass", "largu", "plaqu", "quitt", "amoureu", "dragu", "flirt",
  "crush", "ruptur", "rompu", "celibat", "pecho", "chopp", "bais", "cuch", "kiff", "galoch",
  // mensonges et secrets
  "menti", "menteur", "mensonge", "mytho", "cach", "avou", "jure",
  "secret", "chuchot", "rumeur", "parait", "scandal", "surpris", "jalou",
  // argent
  "argent", "dette", "fauch", "rembours", "vole", "arnaqu", "piqu", "rachet",
  // conflits
  "engueul", "bagarre", "clash", "insult", "harcel", "menac", "frapp", "gifl",
  "embrouill", "malaise", "honte", "genan", "ridicul",
  // école & cours
  "trich", "copi", "vire", "renvoy", "exclu", "redoubl", "convoqu", "surveillant", "prof", "note", "exam", "sech",
  // vie & soirées
  "ivre", "bourr", "vomi", "pleur", "demission", "licenci", "grossesse", "enceinte", "soiree", "fete", "alcool",
  // réseaux
  "story", "insta", "snap", "captur", "screen", "supprim", "bloqu", "ghost", "photo", "video",
];

/* Mots courts : seulement s'ils sont le mot entier (sinon "vol" attrape "volley") */
const motsExacts = ["ex", "vol", "nue", "nu"];

/* Expressions : recherchées telles quelles dans la phrase */
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

/* Les trois paliers de l'analyse, affichés sur le bandeau de la machine */
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

/* ============================================================
   2. SON — synthèse Web Audio (aucun fichier requis)
   ------------------------------------------------------------
   TODO SONS : pour brancher de vrais samples libres de droits
   (freesound.org), déposer les fichiers dans assets/sounds/ puis
   passer USE_FILES à true. Le reste du jeu ne change pas.
   ============================================================ */
const USE_FILES = false;                       // TODO SONS : passer à true si les mp3 sont fournis
const FILES = {
  hum:    "assets/sounds/hum.mp3",
  glitch: "assets/sounds/glitch.mp3",
  growl:  "assets/sounds/growl.mp3",
  accept: "assets/sounds/accept-chime.mp3",
};

const Audio_ = (() => {
  let ctx = null, master = null, humNodes = null, noiseBuf = null;
  const tags = {};

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

    if (USE_FILES) {
      for (const k in FILES) {
        const a = new Audio(FILES[k]);
        a.preload = "auto";
        if (k === "hum") { a.loop = true; a.volume = .35; }
        tags[k] = a;
      }
    }
  }

  const file = (k) => {
    if (!USE_FILES || !tags[k]) return false;
    try { tags[k].currentTime = 0; tags[k].play(); } catch (e) {}
    return true;
  };

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
      if (file("hum")) return;
      if (!ctx || humNodes) return;
      const o1 = ctx.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = 47;
      const o2 = ctx.createOscillator(); o2.type = "square";   o2.frequency.value = 23.5;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 180; lp.Q.value = 6;
      const g  = ctx.createGain(); g.gain.value = 0;
      const lfo = ctx.createOscillator(); lfo.frequency.value = .17;
      const lfoG = ctx.createGain(); lfoG.gain.value = 34;
      lfo.connect(lfoG).connect(lp.frequency);
      o1.connect(lp); o2.connect(lp); lp.connect(g).connect(master);
      o1.start(); o2.start(); lfo.start();
      g.gain.linearRampToValueAtTime(.14, ctx.currentTime + 2.5);
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3000;
      const ng = ctx.createGain(); ng.gain.value = .012;
      src.connect(hp).connect(ng).connect(master); src.start();
      humNodes = { o1, o2, lfo, g, noise: src, ng, lp };
    },

    stopHum(fade = .35) {
      if (USE_FILES && tags.hum) { try { tags.hum.pause(); } catch (e) {} }
      if (!ctx || !humNodes) return;
      const n = humNodes; humNodes = null;
      n.g.gain.cancelScheduledValues(ctx.currentTime);
      n.g.gain.setValueAtTime(n.g.gain.value, ctx.currentTime);
      n.g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade);
      n.ng.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade);
      setTimeout(() => {
        [n.o1, n.o2, n.lfo, n.noise].forEach((o) => { try { o.stop(); } catch (e) {} });
      }, fade * 1000 + 60);
    },

    humTension(k) {
      if (!ctx || !humNodes) return;
      humNodes.lp.frequency.setTargetAtTime(180 + k * 520, ctx.currentTime, .4);
      humNodes.g.gain.setTargetAtTime(.14 + k * .1, ctx.currentTime, .5);
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
      o.frequency.setValueAtTime(40, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 1.4);
      g.gain.exponentialRampToValueAtTime(.1, ctx.currentTime + .5);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + 1.6);
      o.connect(g).connect(master); o.start(); o.stop(ctx.currentTime + 1.7);
      noise(.5, .1, "bandpass", 1200, .8);
    },

    blip(high = false) {
      if (!ctx) return;
      const o = ctx.createOscillator(); o.type = "square";
      o.frequency.value = high ? rnd(1100, 1500) : rnd(680, 980);
      const g = ctx.createGain();
      g.gain.setValueAtTime(high ? .022 : .035, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .04);
      o.connect(g).connect(master); o.start(); o.stop(ctx.currentTime + .05);
    },

    clack(rate) { noise(.05, .05 + rate * .09, "bandpass", 300 + rate * 1100, 3); },

    heart(k = 0) {
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(72 + k * 20, t);
      o.frequency.exponentialRampToValueAtTime(38, t + .16);
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.22 + k * .18, t + .02);
      g.gain.exponentialRampToValueAtTime(.0001, t + .28);
      o.connect(g).connect(master); o.start(t); o.stop(t + .3);
    },

    riser(dur) {
      if (!ctx) return null;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(70, t);
      o.frequency.exponentialRampToValueAtTime(880, t + dur);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(300, t);
      lp.frequency.exponentialRampToValueAtTime(3200, t + dur);
      lp.Q.value = 8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.09, t + dur * .8);
      o.connect(lp).connect(g).connect(master);
      o.start(t);
      return { stop(){ try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.linearRampToValueAtTime(.0001, ctx.currentTime + .08);
        o.stop(ctx.currentTime + .12);
      } catch (e) {} } };
    },

    static(dur = .3) { if (!file("glitch")) noise(dur, .22, "highpass", 900, 1); },

    growl() {
      if (file("growl")) return;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(230, t);
      o.frequency.exponentialRampToValueAtTime(26, t + 1.2);
      const sh = ctx.createWaveShaper();
      const curve = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 8); }
      sh.curve = curve; sh.oversample = "4x";
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 950;
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.55, t + .04);
      g.gain.exponentialRampToValueAtTime(.0001, t + 1.3);
      o.connect(sh).connect(lp).connect(g).connect(master);
      o.start(t); o.stop(t + 1.4);
      noise(.7, .32, "lowpass", 700, 1);
    },

    chime() {
      if (file("accept")) return;
      if (!ctx) return;
      const t = ctx.currentTime;
      [880, 1320, 1760, 2640].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(.0001, t + i * .05);
        g.gain.exponentialRampToValueAtTime(.16 / (i + 1), t + i * .05 + .01);
        g.gain.exponentialRampToValueAtTime(.0001, t + 2.4 + i * .1);
        o.connect(g).connect(master); o.start(t + i * .05); o.stop(t + 3);
      });
    },

    heaven() {
      if (!ctx) return null;
      const t = ctx.currentTime;
      const g = ctx.createGain(); g.gain.value = 0; g.connect(master);
      [261.6, 329.6, 392, 523.2].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = i === 3 ? "triangle" : "sine";
        o.frequency.value = f;
        const og = ctx.createGain(); og.gain.value = .07 / (i * .5 + 1);
        o.connect(og).connect(g); o.start(); o.stop(t + 30);
      });
      g.gain.linearRampToValueAtTime(.5, t + 2.2);
      return g;
    },
  };
})();

/* ============================================================
   3. LES YEUX — clignement irrégulier + suivi du curseur
   ============================================================ */
const Eyes = (() => {
  const nodes = [...document.querySelectorAll("[data-eye]")];
  let blinkTimer = null, tracking = false, mx = 0, my = 0, raf = null;

  function scheduleBlink() {
    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(() => {
      // les yeux ne clignent jamais ensemble : c'est plus dérangeant
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
      const updateCoords = (cx, cy) => {
        mx = cx; my = cy;
        if (!raf) raf = requestAnimationFrame(loop);
      };
      window.addEventListener("pointermove", (e) => updateCoords(e.clientX, e.clientY), { passive: true });
      window.addEventListener("pointerdown", (e) => updateCoords(e.clientX, e.clientY), { passive: true });
      window.addEventListener("touchmove", (e) => {
        if (e.touches && e.touches[0]) updateCoords(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
    },
    scanning(on) { el.eyes.classList.toggle("scanning", on); },
    lunge(on)    { el.eyes.classList.toggle("lunge", on); },
    freeze()     { nodes.forEach((n) => { const b = n.querySelector(".eye__ball"); if (b) b.style.transform = "translate(0,0)"; }); },
    center()     { nodes.forEach((n) => { const b = n.querySelector(".eye__ball"); if (b) b.style.transform = ""; }); },
  };
})();

/* ============================================================
   4. LE BANDEAU DE LA MACHINE (dot-matrix + jauge)
   ============================================================ */
function ticker(texte, ton) {
  el.tickerTxt.textContent = texte;
  el.tickerTxt.className = "ticker__txt" + (ton ? " " + ton : "");
}
function jauge(p) {                              // p entre 0 et 1
  const n = segments.length;
  segments.forEach((s, i) => s.classList.toggle("on", i / n < p));
}

/* ============================================================
   5. LA BOÎTE DE DIALOGUE — tout se dit lettre par lettre
   ============================================================ */
let typing = 0;                                  // jeton d'annulation

function speaker(who) {
  el.dlgWho.textContent = who;
  el.dlgWho.classList.toggle("is-you", who === "VOUS");
}

async function say(text, { speed = 32, cls = "", sound = true } = {}) {
  const token = ++typing;
  el.dlgText.className = "dialogue__text caret" + (cls ? " " + cls : "");
  el.dlgText.textContent = "";
  for (const ch of text) {
    if (token !== typing) return false;
    el.dlgText.textContent += ch;
    if (sound && ch !== " " && Math.random() > .3) Audio_.blip();
    await wait(ch === "." || ch === "," ? speed * 3.5 : speed + rnd(-8, 16));
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

/* ============================================================
   6. LE JUGEMENT (§2) — score par mots-clés, jamais affiché
   ============================================================ */
const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const escapeRe  = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* racine + jusqu'à 8 lettres : attrape les accords et les conjugaisons françaises
   ("engueul" -> engueulé, engueulée, engueulés, engueuler, engueulaient)   */
const testRacine = (norm, r) =>
  new RegExp(`(^|[^a-z0-9])${escapeRe(r)}[a-z]{0,8}([^a-z0-9]|$)`).test(norm);
const testExact = (norm, m) =>
  new RegExp(`(^|[^a-z0-9])${escapeRe(m)}([^a-z0-9]|$)`).test(norm);

function juger(texte) {
  const brut = texte.trim();
  const mots = brut.split(/\s+/).filter(Boolean);
  const norm = normalize(brut);

  // --- Rejets automatiques ---
  if (mots.length < 3) return { accepte: false, raison: "court" };
  // "rien", "je sais pas"… ne disqualifient que les phrases courtes :
  // « je sais pas si c'est vrai mais Camille a trompé Julien » reste un potin.
  if (mots.length <= 6) {
    for (const bidon of phrasesBidons) {
      if (norm.includes(normalize(bidon))) return { accepte: false, raison: "bidon" };
    }
  }

  // --- Score ---
  let score = 0;

  // +2 par trouvaille distincte, plafonné à +6 (anti-spam d'un même mot)
  const trouves = new Set();
  for (const r of racines)     if (testRacine(norm, normalize(r))) trouves.add(r);
  for (const m of motsExacts)  if (testExact(norm, normalize(m)))  trouves.add(m);
  for (const e of expressions) if (norm.includes(normalize(e)))    trouves.add(e);
  score += Math.min(trouves.size * 2, 6);

  // +2 si quelqu'un est nommément visé (majuscule ailleurs qu'en début de phrase ou ALL CAPS)
  const motsExclus = ["ET", "LA", "LE", "LES", "UN", "UNE", "DES", "PAR", "SUR", "DANS", "AVEC", "POUR", "mais", "mais".toUpperCase()];
  const nomPropre = mots.slice(1).some((m) => {
    const w = m.replace(/^[^A-Za-zÀ-ÿ]+|[^A-Za-zÀ-ÿ]+$/g, "");
    if (w.length <= 1 || motsExclus.includes(w)) return false;
    return /^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’-]+$/.test(w) || /^[A-ZÀ-ÖØ-Þ]{2,}$/.test(w);
  });
  if (nomPropre) score += 2;

  // le détail paie
  if (mots.length > 6)  score += 1;
  if (mots.length > 12) score += 1;

  return { accepte: score >= partie.seuil, score, raison: "score" };
}

/* ============================================================
   7. COMPTEUR DE SESSION (localStorage)
   ============================================================ */
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

/* ============================================================
   8. ÉTAT DE LA PARTIE
   ============================================================ */
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

/* ============================================================
   9. LES ÉTATS DU JEU
   ============================================================ */

/* --- BOOT --------------------------------------------------- */
async function boot() {
  setEtat("BOOT", "00", "DÉMARRAGE");
  // L'humeur du jour : seuil d'exigence tiré une fois par partie (3 à 5).
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
  Eyes.lunge(false); Eyes.scanning(false);
  renderCounter();
  speaker("SYSTÈME");

  body.classList.add("is-on");                   // les paupières s'ouvrent (CSS)
  Audio_.boot();
  Audio_.startHum();
  await wait(900);

  await say("MOD.VII — MEM 64K OK — CAPTEURS OCULAIRES 3/3 — INDEX : 12 447 ENTRÉES", { speed: 9, cls: "dim" });
  await wait(280);
  Audio_.static(.25);
  speaker("LE DISTRIBUTEUR");
  await say("SYSTÈME EN COURS DE RÉVEIL...", { speed: 40 });
  await wait(620);
  await say("INSÈRE UN POTIN POUR CONTINUER.", { speed: 40 });

  waitingInput();
}

/* --- WAITING_INPUT ------------------------------------------ */
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
  Eyes.lunge(false); Eyes.scanning(false);
  el.input.focus({ preventScroll: true });
}

/* --- JUDGING : la montée de tension -------------------------- */
async function judging(texte) {
  setEtat("JUDGING", "??", "ANALYSE");
  clearDialogue();
  speaker("LE DISTRIBUTEUR");
  el.slotForm.hidden = true;
  el.retryBtn.hidden = true;
  body.classList.remove("feeding");
  panelNoise(true);
  Eyes.scanning(true);
  jauge(0);
  ticker(paliers[0].ticker);

  stats.tentatives++; saveStats(); renderCounter();

  const duree = rnd(3600, 4600);                 // l'attente est longue : c'est le but
  const riser = Audio_.riser(duree / 1000);
  let palier = 0, prochainClack = 0, prochainCoeur = 0, marmonne = false;

  tension(1);

  const t0 = performance.now();
  await new Promise((resolve) => {
    (function frame(now) {
      const p = Math.min((now - t0) / duree, 1);

      // Progression saccadée : la jauge cale, recule, repart
      let v = p;
      if (p > .34 && p < .46) v = .34 + (p - .34) * .18;      // 1er blocage
      if (p > .70 && p < .80) v = .55 - (p - .70) * .40;      // recul angoissant
      if (p >= .80) v = .50 + (p - .80) * 2.5;
      jauge(Math.max(0, Math.min(1, v)));

      // Paliers : bandeau, écran, étau, tremblement
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

  // --- LE SILENCE : tout s'arrête une seconde. C'est le pire moment. ---
  if (riser) riser.stop();
  Audio_.duck(700);
  panelNoise(false);
  jauge(1);
  ticker("VERDICT...", "alerte");
  setEtat("JUDGING", "!!", "VERDICT");
  Eyes.scanning(false);
  Eyes.freeze();
  clearDialogue();
  tension(3);
  await wait(750);

  const res = juger(texte);
  if (res.accepte) accepte(); else rejete();
}

/* --- REJETÉ (jump scare) ------------------------------------ */
async function rejete() {
  setEtat("REJECTED", "XX", "REFUSÉ");
  stats.recales++; saveStats(); renderCounter();
  ticker("REFUSÉ", "alerte");

  // 1) la ruée : flash, glitch, l'œil qui bondit, growl, mot plein écran
  Audio_.growl();
  Audio_.static(.5);
  el.scareWord.textContent = pick(motsScare);
  el.scare.hidden = false;
  body.classList.add("flash", "glitch", "rush");
  Eyes.lunge(true);
  await wait(230);
  body.classList.remove("flash");
  await wait(260);
  el.scareWord.textContent = pick(motsScare);   // le mot change : effet de saut
  Audio_.static(.25);
  await wait(320);
  body.classList.remove("rush");
  Eyes.lunge(false);
  el.scare.hidden = true;
  await wait(220);
  body.classList.remove("glitch");
  tension(0);

  // 2) la sentence, tapée lettre par lettre dans la boîte du bas
  speaker("LE DISTRIBUTEUR");
  await say(pick(repliquesRejet), { speed: 62, cls: "angry" });

  // 3) statistique inventée, purement décorative (§1.4)
  await wait(300);
  el.dlgStat.textContent = `${rndInt(70, 95)}% des visiteurs n'ont pas survécu à leur potin.`;
  await wait(260);
  el.retryBtn.hidden = false;
  el.retryBtn.focus({ preventScroll: true });
}

/* --- ACCEPTÉ (le paradis) ----------------------------------- */
async function accepte() {
  setEtat("ACCEPTED", "OK", "OUVERTURE");
  tension(0);
  ticker("ACCÈS ACCORDÉ", "ok");
  speaker("LE DISTRIBUTEUR");
  await say("ACCÈS ACCORDÉ.", { speed: 55 });

  Audio_.chime();
  await wait(650);

  // La porte s'ouvre : voile noir, changement de décor, iris qui s'agrandit.
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

/* --- RECOMMENCER (paradis -> BOOT) -------------------------- */
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
  Eyes.center();
  el.iris.classList.remove("close");
  await wait(500);
  el.iris.classList.remove("active");
  boot();
}

/* ============================================================
   10. DÉCOR DU PARADIS (nuages + pluie de pièces)
   ============================================================ */
function buildParadise() {
  const nuages = document.createDocumentFragment();
  for (let i = 0; i < 9; i++) {
    const c = document.createElement("span");
    c.className = "cloud";
    c.style.width = rndInt(140, 380) + "px";
    c.style.height = rndInt(50, 110) + "px";
    c.style.top = rndInt(2, 72) + "vh";
    c.style.left = rndInt(-10, 90) + "vw";
    c.style.opacity = rnd(.35, .85).toFixed(2);
    c.style.animationDuration = rndInt(45, 110) + "s";
    c.style.animationDelay = `-${rndInt(0, 60)}s`;
    nuages.appendChild(c);
  }
  el.parClouds.appendChild(nuages);

  const pieces = document.createDocumentFragment();
  for (let i = 0; i < 34; i++) {
    const c = document.createElement("span");
    c.className = "coin" + (i % 5 === 0 ? " bill" : "");
    c.style.left = rnd(0, 100).toFixed(2) + "vw";
    c.style.animationDuration = rnd(4.5, 11).toFixed(2) + "s";
    c.style.animationDelay = `-${rnd(0, 11).toFixed(2)}s`;
    pieces.appendChild(c);
  }
  el.parCoins.appendChild(pieces);
}

/* ============================================================
   11. BRANCHEMENTS
   ============================================================ */
el.powerBtn.addEventListener("click", async () => {
  await Audio_.unlock();
  el.powergate.classList.add("off");
  Eyes.start();
  buildParadise();
  boot();
});

// Ce que le joueur tape s'entend aussi, touche par touche
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

// Interaction avec le pavé numérique de la machine
document.querySelectorAll(".pad button").forEach((btn) => {
  btn.addEventListener("click", () => {
    Audio_.blip(true);
    const char = btn.textContent.trim() || "5";
    if (partie.etat === "WAITING") {
      let current = el.panelCode.textContent;
      if (current === "--" || current === "01" || current === "00" || current.length >= 3) {
        current = char;
      } else {
        current += char;
      }
      el.panelCode.textContent = current;
      if (current === "666" || current === "A5" || current === "D3") {
        Audio_.static(.3);
        Audio_.growl();
        el.panelState.textContent = "ERR. 666";
      }
    }
  });
});

// Entrée = réessayer après un rejet
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && partie.etat === "REJECTED" && !el.retryBtn.hidden) el.retryBtn.click();
});

renderCounter();
})();
