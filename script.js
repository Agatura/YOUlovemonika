(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
let ctx, muted = false, found = new Set(), dread = 0;

/* ---------- ЗВУКИ (синтез, без файлов). Чтобы использовать свои mp3, см. sfx() ниже ---------- */
function tone(f, t = .15, type = 'sine', v = .12, when = 0, slide) {
  if (muted || !ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain(), s = ctx.currentTime + when;
  o.type = type; o.frequency.setValueAtTime(f, s);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, s + t);
  g.gain.setValueAtTime(v, s); g.gain.exponentialRampToValueAtTime(.001, s + t);
  o.connect(g).connect(ctx.destination); o.start(s); o.stop(s + t);
}
function noise(t = .3, v = .15) {
  if (muted || !ctx) return;
  const n = ctx.sampleRate * t, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = v;
  s.buffer = b; s.connect(g).connect(ctx.destination); s.start();
}
const SFX = {
  chime: () => { tone(880, .25, 'sine', .1); tone(1320, .3, 'sine', .08, .1) },
  glitch: () => { noise(.4, .2); tone(90, .4, 'sawtooth', .1, 0, 30) },
  heart: () => { tone(55, .15, 'sine', .35); tone(50, .2, 'sine', .3, .18) },
  scare: () => { noise(.7, .35); tone(200, .6, 'sawtooth', .2, 0, 40) },
  ding: () => { tone(1046, .4, 'triangle', .1); tone(1568, .5, 'triangle', .08, .12); tone(2093, .6, 'triangle', .06, .24) }
};
/* свой звук: положи файл в папку sounds/ и вызови sfx('glitch','sounds/glitch.mp3') */
function sfx(name, file) {
  if (muted) return;
  if (file) { const a = new Audio(file); a.play().catch(() => SFX[name] && SFX[name]()); }
  else SFX[name] && SFX[name]();
}

/* ---------- утилиты ---------- */
const toast = (t, ms = 2600) => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), ms) };
const secret = (id, msg) => { if (found.has(id)) return; found.add(id); sfx('ding'); toast(`Секрет ${found.size}/10: ${msg}`);
  if (found.size === 10) setTimeout(() => { sfx('scare'); toast('Ты нашёл всё. Я же просила не говорить мне.', 5000); glitchNow() }, 1500) };
const zalgo = (s, n) => [...s].map(c => c + (c === ' ' ? '' : Array.from({ length: n }, () => String.fromCharCode(0x300 + Math.random() * 60 | 0)).join(''))).join('');
function glitchNow() { document.body.classList.add('glitch'); sfx('glitch'); setTimeout(() => document.body.classList.remove('glitch'), 1100) }

/* ---------- вход ---------- */
$('#enter').onclick = () => {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  $('#gate').classList.add('gone'); document.body.classList.remove('locked'); sfx('chime');
  setTimeout(() => toast('Спасибо, что пришёл ♥'), 400);
};
document.body.classList.add('locked');
$('#mute').onclick = e => { muted = !muted; e.target.textContent = muted ? '✕' : '♪'; };

/* ---------- кровь и виньетка растут по мере прокрутки ---------- */
const dr = $('#drips');
for (let i = 0; i < 24; i++) { const e = document.createElement('i'); e.style.left = (i * 4.2 + Math.random() * 3) + '%'; e.style.setProperty('--h', 40 + Math.random() * 160); dr.appendChild(e); }
function onScroll() {
  const m = document.documentElement.scrollHeight - innerHeight;
  dread = m > 0 ? Math.min(1, scrollY / m) : 0;
  document.documentElement.style.setProperty('--d', (dread * dread).toFixed(3));
  if (dread > .97) secret('bottom', 'ты дочитал до самого низа');
}
addEventListener('scroll', onScroll, { passive: true });

/* ---------- глаза следят ---------- */
const eyes = $$('.eyes i');
function look(x, y) { eyes.forEach(e => { const r = e.getBoundingClientRect(), a = Math.atan2(y - r.top - r.height / 2, x - r.left - r.width / 2);
  e.style.setProperty('--ex', Math.cos(a) * 9 + 'px'); e.style.setProperty('--ey', Math.sin(a) * 9 + 'px') }) }
addEventListener('mousemove', e => look(e.clientX, e.clientY));
addEventListener('touchmove', e => look(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
eyes.forEach(e => e.onclick = () => { sfx('heart'); secret('eye', 'ты посмотрел ей в глаза') });

/* ---------- заголовки и текст портятся ---------- */
$$('.glitchy').forEach(h => { const o = h.textContent;
  h.addEventListener('mouseenter', () => { h.textContent = zalgo(o, 3); setTimeout(() => h.textContent = o, 350) });
  h.addEventListener('click', () => { h.textContent = zalgo(o, 6); sfx('glitch'); setTimeout(() => h.textContent = o, 500) }) });
setInterval(() => {
  const els = $$('[data-evil]'); if (!els.length || dread < .15 || Math.random() > dread + .2) return;
  const e = els[Math.random() * els.length | 0], o = e.textContent; if (e.dataset.on) return;
  e.dataset.on = 1; e.textContent = e.dataset.evil; sfx('heart');
  setTimeout(() => { e.textContent = o; delete e.dataset.on }, 1300);
}, 6000);
setInterval(() => { if (dread > .5 && Math.random() < .4) glitchNow() }, 25000);

/* ---------- картинки ---------- */
$$('.pic').forEach(p => p.addEventListener('click', () => {
  p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit'); sfx('chime');
  const c = (p._c = (p._c || 0) + 1);
  if (p.dataset.src.includes('shot4') && c === 3) { sfx('scare'); glitchNow(); secret('shot', 'четвёртая картинка смотрит в ответ') }
  if (p.dataset.src.includes('monika') && c === 5) secret('mon', 'ты слишком любишь Монику');
}));

/* ---------- закрашенный текст ---------- */
$$('.redact').forEach(r => { const t = () => { r.classList.add('open'); r.textContent = 'Кого-то не станет. Хихихи.'; sfx('scare'); secret('redact', 'ты прочитал закрашенное') };
  r.onclick = t; r.onkeydown = e => e.key === 'Enter' && t() });

/* ---------- лайки ---------- */
$('#like').onclick = () => { sfx('ding'); toast('Нацуки пошла печь кекс. Не ешь его.'); secret('like', 'кекс уже в духовке') };
$('#nolike').onclick = () => { sfx('glitch'); const b = document.createElement('div'); b.id = 'blue'; b.className = 'on';
  b.innerHTML = '<b>:(</b>Моника удаляет Windows... <span id="pc">0</span>%<br><br>Шутка. Наверное.<br>Нажми куда угодно, чтобы вернуться.';
  document.body.appendChild(b); let n = 0; const iv = setInterval(() => { n += 7 + Math.random() * 12 | 0; $('#pc').textContent = Math.min(n, 99); if (n >= 99) clearInterval(iv) }, 300);
  b.onclick = () => { b.remove(); secret('bsod', 'ты не поставил лайк') } };

/* ---------- тыква ---------- */
$('#pumpkin').onclick = () => { sfx('heart'); toast('Человек в чёрном ушёл в светящуюся дверь.'); secret('pumpkin', 'тыква из красного зала') };

/* ---------- коды: justmonika и Konami ---------- */
let buf = '', kon = [], K = 'ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a';
addEventListener('keydown', e => {
  buf = (buf + e.key.toLowerCase()).slice(-10);
  if (buf.endsWith('justmonika')) { sfx('scare'); glitchNow(); toast('Только Моника. Только я.'); secret('code', 'кодовое слово') }
  kon.push(e.key); kon = kon.slice(-10);
  if (kon.join() === K) { document.body.style.filter = 'invert(1) hue-rotate(180deg)'; sfx('glitch'); setTimeout(() => document.body.style.filter = '', 2500); secret('konami', 'старый добрый код') }
});

/* ---------- вкладка и таймеры ---------- */
const title = document.title;
document.addEventListener('visibilitychange', () => { document.title = document.hidden ? 'Вернись...' : title; if (!document.hidden) toast('Ты вернулся. Я рада.') });
setTimeout(() => toast('Ты здесь уже минуту. Мне нравится.', 4000), 60000);
setTimeout(() => { sfx('heart'); toast('Тебе не пора спать?', 4000) }, 180000);
console.log('%cmonika.chr', 'color:#b0001a;font:700 40px sans-serif');
console.log('Ты открыл консоль. Файл monika.chr не удалён. Пока.');
})();