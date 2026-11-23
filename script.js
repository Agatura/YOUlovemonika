(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
let ctx, muted = false, found = new Set(), dread = 0, entered = false;

/* ---------- звуки (синтез). Свои файлы: sfx('glitch','sounds/glitch.mp3') ---------- */
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
  blip: () => tone(660, .08, 'square', .05),
  glitch: () => { noise(.4, .2); tone(90, .4, 'sawtooth', .1, 0, 30) },
  heart: () => { tone(55, .15, 'sine', .35); tone(50, .2, 'sine', .3, .18) },
  scare: () => { noise(.7, .35); tone(200, .6, 'sawtooth', .2, 0, 40) },
  ding: () => { tone(1046, .4, 'triangle', .1); tone(1568, .5, 'triangle', .08, .12); tone(2093, .6, 'triangle', .06, .24) }
};
function sfx(name, file) {
  if (muted) return;
  if (file) new Audio(file).play().catch(() => SFX[name] && SFX[name]());
  else SFX[name] && SFX[name]();
}

/* ---------- утилиты ---------- */
const toast = (t, ms = 2600) => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), ms) };
const secret = (id, msg) => { if (found.has(id)) return; found.add(id); sfx('ding'); toast(`Секрет ${found.size}/10: ${msg}`);
  if (found.size === 10) setTimeout(() => { sfx('scare'); toast('Ты нашёл всё. Я же просила не говорить мне.', 5000); glitchNow() }, 1500) };
const zalgo = (s, n) => [...s].map(c => c + (c === ' ' ? '' : Array.from({ length: n }, () => String.fromCharCode(0x300 + Math.random() * 60 | 0)).join(''))).join('');
function glitchNow() { document.body.classList.add('glitch'); sfx('glitch'); setTimeout(() => document.body.classList.remove('glitch'), 1100) }

/* ---------- вход ---------- */
document.body.classList.add('locked');
$('#enter').onclick = () => {
  ctx = new (window.AudioContext || window.webkitAudioContext)(); entered = true;
  $('#gate').classList.add('gone'); document.body.classList.remove('locked'); sfx('chime');
  setTimeout(() => toast('Сессия начата. Приятной работы.'), 400);
  setTimeout(invade, 25000); /* Моника врывается сама через 25 секунд */
};
$('#mute').onclick = e => { muted = !muted; e.target.textContent = muted ? '✕' : '♪' };

/* ---------- вторжение Моники ---------- */
function invade() {
  if (!entered || document.body.classList.contains('invaded')) return;
  $('#flash').classList.add('on'); sfx('scare');
  setTimeout(() => {
    $('#flash').classList.remove('on'); document.body.classList.add('invaded'); glitchNow();
    toast('Соединение прервано. Источник неизвестен.', 4000);
    setInterval(() => { $('#integ').textContent = Math.random() < .3 ? '??' : Math.max(3, 70 - dread * 65 + (Math.random() * 12 | 0)).toFixed(0) }, 900);
  }, 1300);
}

/* ---------- кровь и виньетка ---------- */
const dr = $('#drips');
for (let i = 0; i < 24; i++) { const e = document.createElement('i'); e.style.left = (i * 4.2 + Math.random() * 3) + '%'; e.style.setProperty('--h', 40 + Math.random() * 160); dr.appendChild(e) }
addEventListener('scroll', () => {
  const m = document.documentElement.scrollHeight - innerHeight;
  dread = m > 0 ? Math.min(1, scrollY / m) : 0;
  document.documentElement.style.setProperty('--d', (dread * dread).toFixed(3));
  if (dread > .2) invade();
  if (dread > .97 && document.body.classList.contains('invaded')) secret('bottom', 'ты дочитал до самого низа');
}, { passive: true });

/* ---------- глаза Моники: зрачки двигаются за курсором ---------- */
const eyesBox = $('#eyes'), pups = [$('#pL'), $('#pR')], CEN = [[715, 650], [2527, 547]], IMG_W = 3100;
function look(x, y) {
  const r = eyesBox.getBoundingClientRect(); if (!r.width) return; const k = r.width / IMG_W;
  pups.forEach((p, i) => {
    const cx = r.left + CEN[i][0] * k, cy = r.top + CEN[i][1] * k, dx = x - cx, dy = y - cy, a = Math.atan2(dy, dx), d = Math.min(1, Math.hypot(dx, dy) / 350);
    p.style.transform = `translate(${Math.cos(a) * d * 38 * k}px,${Math.sin(a) * d * 24 * k}px)`; /* 38 и 24 исходных пикселя: максимальный сдвиг */
  });
}
addEventListener('mousemove', e => look(e.clientX, e.clientY));
addEventListener('touchmove', e => look(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
eyesBox.onclick = () => { sfx('heart'); glitchNow(); secret('eye', 'ты посмотрел ей в глаза') };

/* ---------- досье субъектов: клик = мёртвая версия, клик по Монике = все ---------- */
const CAST = [
  ['monika', 'Моника', 'Субъект 01. Президент клуба.'],
  ['yuri', 'Юри', 'Субъект 02. Тихая, начитанная.'],
  ['sayori', 'Сайори', 'Субъект 03. Помнят не все.'],
  ['natsuki', 'Нацуки', 'Субъект 04. Печёт кексы.'],
  ['dolgopups', 'Долгопупс', 'Субъект 05. Мелкий чувак.'],
  ['madoka', 'Мадока', 'Субъект 06. Поздний образец.'],
  ['legaviy', 'Легавый', 'Субъект 07. Полицейский.']
];
const grid = $('#castGrid');
CAST.forEach(([id, name, role]) => {
  const f = document.createElement('figure'); f.className = 'pic'; f.dataset.src = `images/${id}.png`; f.dataset.id = id;
  f.innerHTML = `<img src="images/${id}.png" alt="${name}"><figcaption><b>${name}</b>${role}<span class="st">Статус: активен</span></figcaption>`;
  f.querySelector('img').onerror = () => f.classList.add('empty');
  new Image().src = `images/dead${id}.png`; /* предзагрузка */
  grid.appendChild(f);
  f.onclick = () => id === 'monika' ? killAll() : setDead(f, !f.classList.contains('dead'));
});
function setDead(f, dead) {
  const id = f.dataset.id; f.classList.toggle('dead', dead);
  f.querySelector('img').src = `images/${dead ? 'dead' : ''}${id}.png`;
  f.querySelector('.st').textContent = dead ? 'Статус: ЛИЧНОСТЬ УДАЛЕНА' : 'Статус: активен';
  f.classList.remove('hit'); void f.offsetWidth; f.classList.add('hit'); sfx(dead ? 'scare' : 'chime');
}
function killAll() {
  $$('#castGrid .pic').forEach((f, i) => setTimeout(() => { setDead(f, true); sfx('heart') }, i * 160));
  toast('Я сказала им, что так надо.', 3500); setTimeout(() => { glitchNow(); invade(); secret('kill', 'Моника удалила всех') }, 1200);
}
$('#restore').onclick = () => { $$('#castGrid .pic').forEach(f => setDead(f, false)); toast('Данные восстановлены. Пока.') };

/* ---------- прочие картинки ---------- */
$$('.pic[data-src^="images/shot"], #about .pic').forEach(p => p.addEventListener('click', () => {
  p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit'); sfx('blip');
  p._c = (p._c || 0) + 1;
  if (p.dataset.src.includes('shot4') && p._c === 3) { sfx('scare'); glitchNow(); secret('shot', 'четвёртый кадр смотрит в ответ') }
}));

/* ---------- заголовки и текст портятся ---------- */
$$('.glitchy').forEach(h => { const o = h.textContent;
  h.addEventListener('mouseenter', () => { h.textContent = zalgo(o, 3); setTimeout(() => h.textContent = o, 350) });
  h.addEventListener('click', () => { h.textContent = zalgo(o, 6); sfx('glitch'); setTimeout(() => h.textContent = o, 500) }) });
setInterval(() => {
  const els = $$('[data-evil]:not(.m)'); if (!document.body.classList.contains('invaded') || Math.random() > dread + .25) return;
  const e = els[Math.random() * els.length | 0], o = e.textContent; if (!e || e.dataset.on) return;
  e.dataset.on = 1; e.textContent = e.dataset.evil; e.classList.add('swap'); sfx('heart');
  setTimeout(() => { e.textContent = o; e.classList.remove('swap'); delete e.dataset.on }, 1300);
}, 6000);
setInterval(() => { if (dread > .5 && document.body.classList.contains('invaded') && Math.random() < .4) glitchNow() }, 25000);

/* ---------- закрашенный текст, лайки, тыква ---------- */
$$('.redact').forEach(r => { const t = () => { r.classList.add('open'); r.textContent = 'Кого-то не станет. Хихихи.'; sfx('scare'); secret('redact', 'ты прочитал закрашенное') };
  r.onclick = t; r.onkeydown = e => e.key === 'Enter' && t() });
$('#like').onclick = () => { sfx('ding'); toast('Нацуки пошла печь кекс. Не ешь его.'); secret('like', 'кекс уже в духовке') };
$('#nolike').onclick = () => { sfx('glitch'); invade(); const b = document.createElement('div'); b.id = 'blue';
  b.innerHTML = '<b>:(</b>Моника удаляет Windows... <span id="pc">0</span>%<br><br>Шутка. Наверное.<br>Нажми куда угодно, чтобы вернуться.';
  document.body.appendChild(b); let n = 0; const iv = setInterval(() => { n += 7 + Math.random() * 12 | 0; $('#pc').textContent = Math.min(n, 99); if (n >= 99) clearInterval(iv) }, 300);
  b.onclick = () => { b.remove(); clearInterval(iv); secret('bsod', 'ты не поставил лайк') } };
$('#pumpkin').onclick = () => { sfx('heart'); toast('Человек в чёрном ушёл в светящуюся дверь.'); secret('pumpkin', 'тыква из красного зала') };

/* ---------- коды ---------- */
let buf = '', kon = [], K = 'ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a';
addEventListener('keydown', e => {
  buf = (buf + e.key.toLowerCase()).slice(-10);
  if (buf.endsWith('justmonika')) { invade(); sfx('scare'); glitchNow(); toast('Только Моника. Только я.'); secret('code', 'кодовое слово') }
  kon.push(e.key); kon = kon.slice(-10);
  if (kon.join() === K) { document.body.style.filter = 'invert(1) hue-rotate(180deg)'; sfx('glitch'); setTimeout(() => document.body.style.filter = '', 2500); secret('konami', 'старый добрый код') }
});

/* ---------- вкладка и таймеры ---------- */
const title = document.title;
document.addEventListener('visibilitychange', () => { document.title = document.hidden ? 'Вернись...' : title; if (!document.hidden && entered) toast('Ты вернулся. Я рада.') });
setTimeout(() => entered && toast('Ты здесь уже минуту. Мне нравится.', 4000), 60000);
setTimeout(() => { if (entered) { sfx('heart'); toast('Тебе не пора спать?', 4000) } }, 180000);
console.log('%cmonika.chr', 'color:#3dff8f;font:700 40px sans-serif');
console.log('Ты открыл консоль. Файл monika.chr не удалён. Пока.');
})();