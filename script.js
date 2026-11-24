(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
let ctx, muted = false, found = new Set(), dread = 0, entered = false;
const TOTAL = 11, wait = ms => new Promise(r => setTimeout(r, ms));

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
const secret = (id, msg) => { if (found.has(id)) return; found.add(id); sfx('ding'); toast(`Секрет ${found.size}/${TOTAL}: ${msg}`);
  if (found.size === TOTAL) setTimeout(() => { sfx('scare'); toast('Ты нашёл всё. Я же просила не говорить мне.', 5000); glitchNow() }, 1500) };
const zalgo = (s, n) => [...s].map(c => c + (c === ' ' ? '' : Array.from({ length: n }, () => String.fromCharCode(0x300 + Math.random() * 60 | 0)).join(''))).join('');
function glitchNow() { document.body.classList.add('glitch'); sfx('glitch'); setTimeout(() => document.body.classList.remove('glitch'), 1100) }

/* ---------- определяем устройство ---------- */
const DEV = (() => { const u = navigator.userAgent;
  if (/iPhone|iPod/.test(u)) return 'iphone';
  if (/iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1)) return 'ipad';
  if (/Android/.test(u)) return 'android';
  if (/Windows/.test(u)) return 'windows';
  if (/Macintosh|Mac OS/.test(u)) return 'mac';
  if (/Linux|X11|CrOS/.test(u)) return 'linux';
  return 'other' })();
const DEVNAME = { iphone: 'iPhone', ipad: 'iPad', android: 'Android', windows: 'Windows', mac: 'Mac', linux: 'Linux', other: 'неизвестного устройства' }[DEV];

function deathScreen() {
  const b = document.createElement('div'); let html, cls;
  if (DEV === 'iphone' || DEV === 'ipad') { cls = 'ds-ios'; const n = DEV === 'ipad' ? 'iPad' : 'iPhone';
    html = `<div><h1>${n} отключён</h1><p>Повторите попытку через 60 минут</p></div><span>Стереть ${n}</span>` }
  else if (DEV === 'android') { cls = 'ds-and';
    html = `<div class="dlg"><h3>Система Android не отвечает</h3><p>Приложение «monika.chr» остановило работу. Закрыть?</p><div class="btns"><span>Закрыть</span><span>Подождать</span></div></div>` }
  else if (DEV === 'mac') { cls = 'ds-mac';
    html = `<p>Ваш компьютер перезагружен из-за проблемы.<br>Нажмите любую клавишу или подождите несколько секунд для продолжения.</p><p>Your computer was restarted because of a problem.<br>Press a key or wait a few seconds to continue.</p>` }
  else if (DEV === 'linux') { cls = 'ds-lin';
    html = `[    0.000000] Kernel panic - not syncing: Attempted to kill init! exitcode=0x0000000b\n[    0.000000] CPU: 0 PID: 1 Comm: monika.chr Not tainted\n[    0.000000] Call Trace:\n[    0.000000]  dump_stack+0x6d/0x8b\n[    0.000000]  panic+0x101/0x2e3\n[    0.000000]  do_exit+0xa5c/0xb20\n[    0.000000]  delete_everything+0x666/0x666\n[    0.000000] ---[ end Kernel panic - not syncing: Attempted to kill init! ]---\n\nСистема остановлена. Я здесь.` }
  else { cls = 'ds-win';
    html = `<div><b class="sm">:(</b>На вашем ПК возникла проблема, и его необходимо перезагрузить. Мы лишь собираем некоторые сведения об ошибке, а затем будет выполнена перезагрузка.<br><br><span id="pc">0</span>% завершено<div class="qr"></div>Код остановки: MONIKA_DELETED_SYSTEM32<br>Отказавший модуль: monika.chr</div>` }
  b.className = 'ds ' + cls; b.innerHTML = html; document.body.appendChild(b);
  let n = 0; const iv = setInterval(() => { const p = $('#pc'); if (!p) return clearInterval(iv); n = Math.min(99, n + 6 + Math.random() * 10 | 0); p.textContent = n }, 400);
  sfx('glitch'); setTimeout(() => sfx('scare'), 700);
  return new Promise(res => { let ok = false; const close = () => { clearInterval(iv); b.remove(); res() };
    setTimeout(() => ok = true, 2500); b.onclick = () => ok && close(); setTimeout(close, 10000) });
}

/* ---------- вход ---------- */
document.body.classList.add('locked');
$('#enter').onclick = () => {
  ctx = new (window.AudioContext || window.webkitAudioContext)(); entered = true;
  $('#gate').classList.add('gone'); document.body.classList.remove('locked'); sfx('chime');
  setTimeout(() => toast('Сессия начата. Приятной работы.'), 400);
  setTimeout(invade, 25000);
};
$('#mute').onclick = e => { muted = !muted; e.target.textContent = muted ? '✕' : '♪' };

/* ---------- вторжение Моники ---------- */
function invade() {
  if (!entered || document.body.classList.contains('invaded')) return;
  $('#flash').classList.add('on'); sfx('scare');
  setTimeout(() => {
    $('#flash').classList.remove('on'); document.body.classList.add('invaded'); glitchNow();
    toast(`Соединение прервано. Источник: ${DEVNAME}. Я вижу тебя.`, 4500);
    setInterval(() => { $('#integ').textContent = document.body.classList.contains('deep') ? '666' : Math.random() < .3 ? '??' : Math.max(3, 70 - dread * 65 + (Math.random() * 12 | 0)).toFixed(0) }, 900);
  }, 1300);
}

/* ---------- кровь (blood*.png) и кишки (guts*.png), свисают сверху; их немного ---------- */
const HANG = [['blood.png', 14, 24], ['blood1.png', 14, 22], ['blood2.png', 16, 28], ['blood3.png', 14, 22], ['blood.png', 14, 20], ['guts.png', 12, 16], ['guts1.png', 14, 22], ['guts.png', 12, 16]], bl = $('#blood');
HANG.forEach(([f, lo, hi], i) => { const im = new Image(); im.src = 'images/' + f; im.alt = ''; im.onerror = () => im.remove();
  im.style.left = (i * 12.5 - 2 + Math.random() * 6) + '%'; im.style.width = (lo + Math.random() * (hi - lo)) + 'vw';
  im.style.setProperty('--k', (.3 + Math.random() * .35).toFixed(2)); im.style.setProperty('--f', Math.random() < .5 ? -1 : 1); bl.appendChild(im) });

addEventListener('scroll', () => {
  const m = document.documentElement.scrollHeight - innerHeight;
  dread = m > 0 ? Math.min(1, scrollY / m) : 0;
  const st = document.documentElement.style; st.setProperty('--dr', dread.toFixed(3)); st.setProperty('--d', (dread * dread).toFixed(3));
  if (dread > .2) invade();
  document.body.classList.toggle('deep', dread > .62 && document.body.classList.contains('invaded'));
  if (dread > .97 && document.body.classList.contains('invaded')) secret('bottom', 'ты дочитал до самого низа');
}, { passive: true });

/* ---------- глаза Моники: радужка двигается за курсором ---------- */
const eyesBox = $('#eyes'), pups = [$('#iL'), $('#iR')], CEN = [[676, 716], [2504, 615]], IMG_W = 3100;
function look(x, y) {
  const r = eyesBox.getBoundingClientRect(); if (!r.width) return; const k = r.width / IMG_W;
  pups.forEach((p, i) => {
    const cx = r.left + CEN[i][0] * k, cy = r.top + CEN[i][1] * k, dx = x - cx, dy = y - cy, a = Math.atan2(dy, dx), d = Math.min(1, Math.hypot(dx, dy) / 350);
    p.style.transform = `translate(${Math.cos(a) * d * 36 * k}px,${Math.sin(a) * d * 22 * k}px)`;
  });
}
addEventListener('mousemove', e => look(e.clientX, e.clientY));
addEventListener('touchmove', e => look(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
eyesBox.onclick = () => { sfx('heart'); glitchNow(); secret('eye', 'ты посмотрел ей в глаза') };

/* ---------- досье: портрет слева, данные справа ---------- */
const CAST = [
  ['monika', 'Моника', 'Женский', 'Президент литературного клуба. Улыбается всегда, особенно когда не надо.', 'Активна'],
  ['yuri', 'Юри', 'Женский', 'Тихая и начитанная. Видит то, чего не видят другие.', 'Активна'],
  ['sayori', 'Сайори', 'Женский', 'Весёлая подруга детства. Помнят о ней не все.', 'Активна'],
  ['natsuki', 'Нацуки', 'Женский', 'Любит мангу и печёт кексы. Не спрашивай, что внутри.', 'Активна'],
  ['dolgopups', 'Долгопупс', 'Мужской', 'Мелкий чувак. Новые руки есть, ума не прибавилось.', 'Активен'],
  ['madoka', 'Мадока', 'Женский', 'Поздний образец. Появилась позже остальных.', 'Активна'],
  ['legaviy', 'Легавый', 'Мужской', 'Полицейский. Никому не верит и никого не слушает.', 'Активен']
];
const grid = $('#castGrid'), cards = {};
CAST.forEach(([id, name, g, desc, st]) => {
  const c = document.createElement('article'); c.className = 'dos' + (id === 'natsuki' || id === 'dolgopups' ? '' : ' mon'); c.dataset.id = id;
  c.innerHTML = `<figure class="port"><img src="images/${id}.png" alt="${name}"></figure><dl>
    <div><dt>Имя</dt><dd class="v nm">${name}</dd></div><div><dt>Пол</dt><dd class="v">${g}</dd></div>
    <div><dt>Описание</dt><dd class="v">${desc}</dd></div><div><dt>Статус</dt><dd class="v st">${st}</dd></div></dl>`;
  c._orig = $$('.v', c).map(e => e.textContent); c._st = st; c._busy = false; c._na = 0;
  new Image().src = `images/dead${id}.png`;
  cards[id] = c; grid.appendChild(c);
  c.onclick = () => onCard(c);
});
const img = c => $('img', c), vals = c => $$('.v', c);
function die(c) { c.classList.add('cursed'); img(c).src = `images/dead${c.dataset.id}.png`; vals(c)[3].textContent = 'ЛИЧНОСТЬ УДАЛЕНА'; vals(c)[0].textContent = zalgo(c._orig[0], 4);
  c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit'); sfx('scare') }
function revive(c) { c.classList.remove('cursed'); img(c).src = `images/${c.dataset.id}.png`; vals(c).forEach((v, i) => v.textContent = c._orig[i]) }
function erase(c) { c.classList.add('erased'); vals(c).forEach(v => v.textContent = 'информация недоступна'); c._erased = true; sfx('glitch') }
async function flick(c) { if (c._busy || c.classList.contains('gone')) return; c._busy = true; die(c); await wait(1200); revive(c); c._busy = false;
  if (c.dataset.id === 'sayori') { await wait(300); erase(c) } }
async function onCard(c) {
  if (c.classList.contains('gone') || c._busy) return;
  if (c._erased) { c._na++;
    if (c._na === 1) { sfx('glitch'); toast('Информация недоступна.') }
    else if (c._na === 2) { glitchNow(); toast('Не трогай это.') }
    else yell(c); return }
  if (c.dataset.id === 'monika') return killAll();
  flick(c);
}
async function killAll() {
  toast('Я сказала им, что так надо.', 3500); setTimeout(() => { glitchNow(); invade(); secret('kill', 'Моника удалила всех') }, 800);
  Object.values(cards).filter(c => !c._erased).forEach((c, i) => setTimeout(() => { sfx('heart'); flick(c) }, i * 150));
}
function yell(c) {
  const y = document.createElement('div'); y.id = 'yell'; y.innerHTML = 'ХВАТИТ<small>ТУТ НИКОГО НЕТ</small>'; document.body.appendChild(y);
  sfx('scare'); setTimeout(() => sfx('glitch'), 400); setTimeout(() => sfx('scare'), 900);
  setTimeout(() => { y.remove(); c.classList.add('gone'); secret('yell', 'Сайори больше нет') }, 2600);
}

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
  const e = els[Math.random() * els.length | 0]; if (!e || e.dataset.on) return; const o = e.textContent;
  e.dataset.on = 1; e.textContent = e.dataset.evil; e.classList.add('swap'); sfx('heart');
  setTimeout(() => { e.textContent = o; e.classList.remove('swap'); delete e.dataset.on }, 1300);
}, 6000);
setInterval(() => { if (dread > .5 && document.body.classList.contains('invaded') && Math.random() < .4) glitchNow() }, 25000);

/* ---------- закрашенный текст, лайки, тыква ---------- */
$$('.redact').forEach(r => { const t = () => { r.classList.add('open'); r.textContent = 'Кого-то не станет. Хихихи.'; sfx('scare'); secret('redact', 'ты прочитал закрашенное') };
  r.onclick = t; r.onkeydown = e => e.key === 'Enter' && t() });
$('#like').onclick = () => { sfx('ding'); toast('Нацуки пошла печь кекс. Не ешь его.'); secret('like', 'кекс уже в духовке') };
$('#nolike').onclick = async () => { invade(); await deathScreen(); secret('bsod', 'ты не поставил лайк') };
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
