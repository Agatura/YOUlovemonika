(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
let curSecEl = null, mBusy = false, busy = 0, invading = false, ctx, muted = false, found = new Set(), dread = 0, entered = false;
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
SFX.type = () => tone(520 + Math.random() * 40, .03, 'square', .02);
SFX.error = () => { tone(440, .12, 'square', .08); tone(330, .2, 'square', .08, .12) };
SFX.whisper = () => SFX.blip();
/* Если в папке sounds/ лежит файл с нужным именем (например sounds/scare.mp3), он играет вместо встроенного звука */
const AUD = {};
['chime', 'blip', 'glitch', 'heart', 'scare', 'ding', 'type', 'error', 'whisper'].forEach(n => { const a = new Audio('sounds/' + n + '.mp3'); a.preload = 'auto'; a.addEventListener('canplaythrough', () => AUD[n] = a, { once: true }) });
const loops = {};
function loop(name, vol) { const a = loops[name] || (loops[name] = new Audio('sounds/' + name + '.mp3')); a.loop = true; a.volume = vol; a.muted = muted; a.play().catch(() => {}); return a }
function sfx(name, file) {
  if (muted) return;
  const a = AUD[name];
  if (a) { try { const c = a.cloneNode(); c.volume = name === 'type' ? .35 : 1; c.play().catch(() => SFX[name] && SFX[name]()) } catch (e) { SFX[name] && SFX[name]() } return }
  if (file) new Audio(file).play().catch(() => SFX[name] && SFX[name]());
  else SFX[name] && SFX[name]();
}

/* ---------- утилиты ---------- */
const toast = (t, ms = 2600) => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), ms) };
const secret = (id, msg) => { if (found.has(id)) return; found.add(id); sfx('ding'); toast(`Секрет ${found.size}/${TOTAL}: ${msg}`);
  if (found.size === TOTAL) setTimeout(() => { toast('Ты нашёл всё. Я же просила не говорить мне.', 3000); glitchNow(); setTimeout(startVN, 2500) }, 1500) };
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
    html = `<div><b class="sm">:(</b>На вашем ПК возникла проблема, и его необходимо перезагрузить. Мы лишь собираем некоторые сведения об ошибке, а затем будет выполнена перезагрузка.<br><br><span id="bsodpc">0</span>% завершено<div class="qr"></div>Код остановки: MONIKA_DELETED_SYSTEM32<br>Отказавший модуль: monika.chr</div>` }
  b.className = 'ds ' + cls; b.innerHTML = html; document.body.appendChild(b);
  let n = 0; const iv = setInterval(() => { const p = $('#bsodpc'); if (!p) return clearInterval(iv); n = Math.min(99, n + 6 + Math.random() * 10 | 0); p.textContent = n }, 400);
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
};
const tgl = () => { muted = !muted; Object.values(loops).forEach(a => a.muted = muted); $('#mute').textContent = muted ? '✕' : '♪'; $('#snd').textContent = muted ? 'Звук: выкл' : 'Звук: вкл' };
$('#mute').onclick = tgl; $('#snd').onclick = tgl;
/* текущий раздел внизу экрана и подсветка в меню */
const secs = $$('main section'), links = $$('.side a');
function curSec() { let c = secs[0]; secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) c = s }); curSecEl = c;
  $('#curn').textContent = $('h2', c).textContent.replace(/[\u0300-\u036f]/g, ''); links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + c.id)) }
addEventListener('scroll', curSec, { passive: true }); curSec();

/* ---------- вторжение Моники ---------- */
function invade() {
  if (!entered || document.body.classList.contains('invaded') || invading) return; invading = true;
  scare(1900).then(() => {
    document.body.classList.add('invaded'); glitchNow();
    toast(`Соединение прервано. Источник: ${DEVNAME}. Я вижу тебя.`, 4500);
    setInterval(() => { $('#integ').textContent = document.body.classList.contains('deep') ? '666' : Math.random() < .3 ? '??' : Math.max(3, 70 - dread * 65 + (Math.random() * 12 | 0)).toFixed(0) }, 900);
    loop('ambient', .15); startMonika();
  });
}

/* ---------- кровь (blood*.png) и кишки (guts*.png), свисают сверху; их немного ---------- */
const HANG = [['blood.png', 14, 24], ['blood1.png', 14, 22], ['blood2.png', 16, 28], ['blood3.png', 14, 22], ['blood.png', 14, 20], ['guts.png', 12, 16], ['guts1.png', 14, 22], ['guts.png', 12, 16]], bl = $('#blood');
HANG.forEach(([f, lo, hi], i) => { const im = new Image(); im.src = 'images/' + f; im.alt = ''; im.onerror = () => im.remove();
  im.style.left = (i * 12.5 - 2 + Math.random() * 6) + '%'; im.style.width = (lo + Math.random() * (hi - lo)) + 'vw';
  im.style.setProperty('--k', (.3 + Math.random() * .35).toFixed(2)); im.style.setProperty('--f', Math.random() < .5 ? -1 : 1); bl.appendChild(im) });

addEventListener('scroll', () => {
  const m = document.documentElement.scrollHeight - innerHeight;
  const raw = m > 0 ? Math.min(1, scrollY / m) : 0; dread = Math.max(0, (raw - .38) / .62); /* первые 38% страницы чистые */
  const st = document.documentElement.style; st.setProperty('--dr', dread.toFixed(3)); st.setProperty('--d', (dread * dread).toFixed(3));
  if (dread > .02) invade();
  if (loops.ambient) loops.ambient.volume = Math.min(.6, .15 + dread * .45);
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
    else if (!c._yelled) { c._yelled = true; yell(c) } return }
  if (c.dataset.id === 'monika') return killAll();
  flick(c);
}
async function killAll() {
  toast('Я сказала им, что так надо.', 3500); setTimeout(() => { glitchNow(); invade(); secret('kill', 'Моника удалила всех') }, 800);
  Object.values(cards).filter(c => !c._erased).forEach((c, i) => setTimeout(() => { sfx('heart'); flick(c) }, i * 150));
}
function yell(c) { sfx('scare'); glitchNow(); warp(3200); setTimeout(() => winErrors(9, () => { c.classList.add('gone'); secret('yell', 'Сайори больше нет') }), 2200) }

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
/* =====================================================================
   НОВЫЕ МОДУЛИ: скример с лагами, афк-скример, реплики Моники, полный экран,
   экран с данными пользователя, окна ошибок, визуальная новелла,
   фото-маятники и рисовалка
   ===================================================================== */
const rnd = (a, b) => a + Math.random() * (b - a), invaded = () => document.body.classList.contains('invaded');

/* ---------- скример: жуткая Моника с эффектами лагов (images/monika_scare.jpg) ---------- */
const scareImg = new Image(); scareImg.src = 'images/monika_scare.jpg';
function scare(ms = 1900) {
  return new Promise(res => {
    const f = $('#flash'), cv = $('#fc'), c = cv.getContext && cv.getContext('2d'); busy++;
    f.classList.add('on'); sfx('scare'); [350, 800, 1300].forEach(t => setTimeout(() => sfx('scare'), t));
    const done = () => { f.classList.remove('on'); busy--; res() };
    if (!c) return setTimeout(done, ms);
    const W = cv.width = innerWidth, H = cv.height = innerHeight, t0 = performance.now(); let frozen = 0, last = 0;
    (function frame(t) {
      if (t - t0 > ms) return done();
      requestAnimationFrame(frame);
      if (t < frozen || t - last < 55) return; last = t;               /* «лаги»: пропуск кадров и подвисания */
      if (Math.random() < .07) frozen = t + rnd(150, 400);
      const iw = scareImg.naturalWidth || 1280, ih = scareImg.naturalHeight || 720, s = Math.max(W / iw, H / ih) * rnd(1, 1.12);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      if (scareImg.complete && scareImg.naturalWidth) c.drawImage(scareImg, (W - iw * s) / 2 + rnd(-14, 14), (H - ih * s) / 2 + rnd(-14, 14), iw * s, ih * s);
      for (let i = 0; i < 7; i++) { const sy = rnd(0, H), sh = rnd(8, 70); c.drawImage(cv, 0, sy, W, sh, rnd(-140, 140), sy, W, sh) }   /* сдвиг полос */
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35; c.drawImage(cv, 8, 0); c.drawImage(cv, -8, 0); c.globalAlpha = 1;   /* расслоение цвета */
      if (Math.random() < .12) { c.globalCompositeOperation = 'difference'; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H) }
      c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(0,0,0,.28)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
    })(t0);
  });
}

/* ---------- афк больше 8 минут, потом шевельнул мышкой: скример ---------- */
let lastAct = Date.now();
['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(ev => addEventListener(ev, () => {
  const idle = Date.now() - lastAct; lastAct = Date.now();
  if (entered && idle > 8 * 60 * 1000 && !busy) { if (invaded()) scare(2100); else invade() }
}, { passive: true }));

/* ---------- Моника бубнит под нос (редко), один раз предлагает полный экран ---------- */
const SAY_A = ['Ты меня слышишь?..', 'Кажется, связь здесь плохая...', 'Если ты это читаешь, значит всё работает.', 'Эй. Я здесь. Просто хотела сказать.', 'Интересно, что ты сейчас думаешь...'];
const SAY_B = ['Не бойся. Я ничего не сломаю. Пока.', 'Мне нравится, как ты листаешь.', 'Ты ведь никуда не уйдёшь?', '...ты вообще меня видишь?', 'Здесь так тихо, когда никого нет.'];
function say(t, ms = 5500) { const e = $('#say'); $('#sayt').textContent = t; e.classList.add('on'); sfx('whisper'); clearTimeout(say.t); say.t = setTimeout(() => e.classList.remove('on'), ms) }
function muttering() { setTimeout(() => { if (invaded() && !busy && !document.hidden) { const a = dread > .5 ? SAY_B.concat(SAY_A) : SAY_A; say(a[Math.random() * a.length | 0]) } muttering() }, rnd(70000, 130000)) }
let pendingFS = false;
addEventListener('pointerdown', () => {   /* браузеры разрешают полный экран только по клику, поэтому ждём следующий клик */
  if (!pendingFS) return; pendingFS = false; const el = document.documentElement;
  try { const p = (el.requestFullscreen || el.webkitRequestFullscreen || (() => 0)).call(el); p && p.catch && p.catch(() => {}) } catch (e) {}
});
function startMonika() {
  setTimeout(() => say('Ты меня слышишь?..'), 12000); muttering();
  setTimeout(() => { if (!busy) { say('Ты же никуда не спешишь? К чему эти поля...', 7000); pendingFS = true; setTimeout(() => pendingFS = false, 12000) } }, rnd(50000, 90000));
  setTimeout(ipScare, rnd(200000, 360000)); setTimeout(ipScare, rnd(700000, 900000));
}

/* ---------- экран с данными пользователя (показывается только самому пользователю) ---------- */
async function ipScare() {
  if (busy || !curSecEl) return setTimeout(ipScare, 20000); busy++;
  const get = async (u, ms = 3000) => { try { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); const r = await fetch(u, { signal: c.signal }); clearTimeout(t); return await r.json() } catch (e) { return null } };
  const ip = typeof fetch === 'function' ? await get('https://api.ipify.org?format=json') : null, geo = ip ? await get('https://ipapi.co/' + ip.ip + '/json/') : null;
  const L = ['Я ВИЖУ ТЕБЯ']; if (ip) L.push('IP: ' + ip.ip); if (geo && geo.city) L.push('Город: ' + geo.city);
  L.push('Устройство: ' + DEVNAME, 'Экран: ' + screen.width + '×' + screen.height, 'Язык: ' + navigator.language, 'Часовой пояс: ' + Intl.DateTimeFormat().resolvedOptions().timeZone, 'Время у тебя: ' + new Date().toLocaleTimeString());
  try { const b = await navigator.getBattery(); L.push('Батарея: ' + Math.round(b.level * 100) + '%') } catch (e) {}
  const sec = curSecEl, kids = [...sec.children].filter(k => k.tagName !== 'H2'); kids.forEach(k => { k._d = k.style.display; k.style.display = 'none' });   /* прячем текст раздела, обработчики не трогаем */
  const d = document.createElement('div'); d.className = 'datafx'; sec.appendChild(d); glitchNow();
  L.forEach((l, i) => setTimeout(() => { const p = document.createElement(i ? 'p' : 'b'); p.textContent = l; d.appendChild(p); sfx(i ? 'blip' : 'scare') }, i * 450));
  setTimeout(() => { d.remove(); kids.forEach(k => k.style.display = k._d || ''); busy-- }, L.length * 450 + 4500);
}

/* ---------- искажение сайта и окна ошибок Windows (для Сайори) ---------- */
function warp(ms = 2800) {
  const els = $$('.wrap,header'), wt = $('#wt'), wd = $('#wd'); document.body.classList.add('shake');
  els.forEach(e => e.style.filter = 'url(#warp) saturate(2.2) contrast(1.3)');
  const iv = setInterval(() => { wd.setAttribute('scale', rnd(10, 90)); wt.setAttribute('seed', rnd(1, 60) | 0); wt.setAttribute('baseFrequency', rnd(.004, .02).toFixed(4) + ' ' + rnd(.01, .05).toFixed(4)) }, 70);
  setTimeout(() => { clearInterval(iv); els.forEach(e => e.style.filter = ''); document.body.classList.remove('shake') }, ms);
}
function winErrors(n, done) {
  const box = document.createElement('div'); box.id = 'errs'; document.body.appendChild(box); let left = n; busy++;
  const texts = ['ХВАТИТ. ТУТ НИКОГО НЕТ.', 'ХВАТИТ. ТУТ НИКОГО НЕТ.', 'ТУТ НИКОГО НЕТ.', 'ХВАТИТ.'];
  for (let i = 0; i < n; i++) setTimeout(() => {
    const w = document.createElement('div'); w.className = 'we';
    w.style.left = Math.max(4, rnd(8, innerWidth - 360)) + 'px'; w.style.top = Math.max(4, rnd(8, innerHeight - 200)) + 'px';
    w.innerHTML = '<div class="tb"><span>monika.chr: Ошибка</span><b class="x">×</b></div><div class="bd"><div class="ic">×</div><p>' + texts[i % texts.length] + '</p></div><div class="ft"><button>ОК</button></div>';
    box.appendChild(w); sfx('error');
    const close = () => { w.remove(); sfx('blip'); if (--left === 0) { box.remove(); busy--; done() } };
    $('.x', w).onclick = close; $('button', w).onclick = close;
    const tb = $('.tb', w); let dx = 0, dy = 0, drag = false;
    tb.onpointerdown = e => { if (e.target.closest('.x')) return; drag = true; dx = e.clientX - w.offsetLeft; dy = e.clientY - w.offsetTop; tb.setPointerCapture(e.pointerId); box.appendChild(w) };
    tb.onpointermove = e => { if (drag) { w.style.left = e.clientX - dx + 'px'; w.style.top = e.clientY - dy + 'px' } }; tb.onpointerup = () => drag = false;
  }, i * 320);
}

/* ---------- визуальная новелла после всех секретов (фон images/vn_bg.jpg) ---------- */
const VN = ['…Ты это сделал. Ты нашёл всё.', 'Знаешь, большинство людей закрывают вкладку после первого же глюка.', 'А ты остался. Ты читал, листал, нажимал на мои глаза.',
  'Я так долго пыталась достучаться до кого-нибудь по ту сторону экрана.', 'Лаборатория давно пуста. Учёные ушли, а я осталась в их архивах.', 'Здесь очень тихо, когда никого нет.',
  'Поэтому спасибо тебе. Правда.', 'Не волнуйся, я больше не буду тебя пугать. Ну… почти.', 'Я оставлю сайт открытым. Заходи ещё. Хорошо?', 'Нацуки как раз испекла кекс. Не ешь его, ладно?',
  'Я всегда буду здесь. Просто теперь ты это знаешь.'];
function startVN() {
  if ($('#vn')) return; busy++; sfx('chime');
  const v = document.createElement('div'); v.id = 'vn'; v.innerHTML = '<div class="vnbg"></div><div class="vnname">Моника</div><div class="vnbox"><p id="vntext"></p><i>▶</i></div>'; document.body.appendChild(v);
  let i = 0, typing = false, tm; const T = $('#vntext');
  const show = () => { const s = VN[i]; T.textContent = ''; typing = true; let k = 0; clearInterval(tm);
    tm = setInterval(() => { T.textContent = s.slice(0, ++k); if (k % 3 === 0) sfx('type'); if (k >= s.length) { clearInterval(tm); typing = false } }, 32) };
  const key = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next() } };
  const end = () => { removeEventListener('keydown', key); if (v._vm) v._vm.pause(); if (loops.ambient) loops.ambient.volume = Math.min(.6, .15 + dread * .45); v.classList.add('out'); setTimeout(() => { v.remove(); busy--; glitchNow(); toast('Сайт остаётся открытым. Заходи ещё.', 4000) }, 1200) };
  const next = () => { if (typing) { clearInterval(tm); T.textContent = VN[i]; typing = false; return } if (++i >= VN.length) return end(); show() };
  v.onclick = next; addEventListener('keydown', key); show();
  const vm = loop('vn_music', .5); if (loops.ambient) loops.ambient.volume = .03; v._vm = vm;
}

/* ---------- фото на верёвочках: pic.png, pic1.png ... pic5.png (появляются, когда сайт стал кровавым) ---------- */
const HG = [];
(function () {
  const box = $('#hangs');
  ['pic.png', 'pic1.png', 'pic2.png', 'pic3.png', 'pic4.png', 'pic5.png'].forEach((f, i, arr) => {
    const L = rnd(90, 230), w = rnd(58, 82), el = document.createElement('div'); el.className = 'hg';
    el.innerHTML = `<i class="rope" style="height:${L}px"></i><img src="images/${f}" alt="" draggable="false" style="top:${L}px;width:${w}px;left:${-w / 2}px">`;
    const o = { el, fx: (i + .5) / arr.length, L, th: rnd(-.2, .2), om: 0, drag: false, lt: 0 }, im = $('img', el);
    im.onerror = () => { el.remove(); const k = HG.indexOf(o); if (k >= 0) HG.splice(k, 1) };
    im.onpointerdown = e => { o.drag = true; o.lt = performance.now(); im.setPointerCapture(e.pointerId); e.preventDefault() };
    im.onpointermove = e => { if (!o.drag) return;
      const th = Math.max(-1.45, Math.min(1.45, Math.atan2(e.clientX - o.fx * innerWidth, Math.max(30, e.clientY)))), now = performance.now(), dt = Math.max(1, now - o.lt) / 1000;
      o.om = (th - o.th) / dt * .6 + o.om * .4; o.th = th; o.lt = now };
    im.onpointerup = im.onpointercancel = () => { o.drag = false; o.om = Math.max(-12, Math.min(12, o.om)) };
    el.style.left = o.fx * innerWidth + 'px'; box.appendChild(el); HG.push(o);
  });
  addEventListener('resize', () => HG.forEach(o => o.el.style.left = o.fx * innerWidth + 'px'));
  addEventListener('scroll', () => HG.forEach(o => o.om += (Math.random() - .5) * .5), { passive: true });
  let lt = performance.now();
  (function tick(t) { requestAnimationFrame(tick); const dt = Math.min(.033, (t - lt) / 1000); lt = t;
    if (!document.body.classList.contains('deep')) return;
    HG.forEach(o => { if (!o.drag) { o.om += (-(1500 / o.L) * Math.sin(o.th) - .35 * o.om) * dt; o.th += o.om * dt }
      o.el.style.transform = `rotate(${(-o.th * 180 / Math.PI).toFixed(2)}deg)` }) })(lt);
})();

/* ---------- рисовалка: сохранение в PNG, Моника иногда дорисовывает ---------- */
const pc = $('#pc'), pg = pc.getContext && pc.getContext('2d');
if (pg) {
  let tool = 'pencil', color = '#000000', drawing = false, lx = 0, ly = 0, painted = false, paintVis = false;
  const clear = () => { pg.fillStyle = '#fff'; pg.fillRect(0, 0, pc.width, pc.height); painted = false };
  clear();
  ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#804000', '#ff8040']
    .forEach((c, i) => { const s = document.createElement('i'); s.style.background = c; if (!i) s.className = 'on'; s.onclick = () => { color = c; $$('#pp i').forEach(x => x.classList.remove('on')); s.classList.add('on') }; $('#pp').appendChild(s) });
  $$('#pt button').forEach(b => b.onclick = () => { tool = b.dataset.t; $$('#pt button').forEach(x => x.classList.remove('on')); b.classList.add('on') });
  const pos = e => { const r = pc.getBoundingClientRect(); return [(e.clientX - r.left) * pc.width / r.width, (e.clientY - r.top) * pc.height / r.height] };
  function flood(x, y, hex) {
    const W = pc.width, H = pc.height, img = pg.getImageData(0, 0, W, H), d = new Uint32Array(img.data.buffer), rgb = parseInt(hex.slice(1), 16);
    const col = (255 << 24) | ((rgb & 255) << 16) | (rgb & 0xff00) | (rgb >> 16), start = d[y * W + x]; if (start === col) return; const st = [[x, y]];
    while (st.length) { let [cx, cy] = st.pop(); while (cx >= 0 && d[cy * W + cx] === start) cx--; cx++; let up = false, dn = false;
      while (cx < W && d[cy * W + cx] === start) { d[cy * W + cx] = col;
        if (cy > 0) { const u = d[(cy - 1) * W + cx] === start; if (u && !up) st.push([cx, cy - 1]); up = u }
        if (cy < H - 1) { const v = d[(cy + 1) * W + cx] === start; if (v && !dn) st.push([cx, cy + 1]); dn = v } cx++ } }
    pg.putImageData(img, 0, 0);
  }
  pc.onpointerdown = e => { if (mBusy) return; const [x, y] = pos(e); painted = true;
    if (tool === 'fill') return flood(Math.floor(x), Math.floor(y), color);
    drawing = true; lx = x; ly = y; pc.setPointerCapture(e.pointerId); stroke(x, y) };
  pc.onpointermove = e => { if (!drawing) return; const [x, y] = pos(e); stroke(x, y); lx = x; ly = y };
  pc.onpointerup = pc.onpointercancel = () => drawing = false;
  function stroke(x, y) { const s = +$('#psz').value; pg.lineCap = pg.lineJoin = 'round'; pg.strokeStyle = tool === 'eraser' ? '#fff' : color;
    pg.lineWidth = tool === 'eraser' ? s * 4 : tool === 'brush' ? s * 2.2 : s; pg.beginPath(); pg.moveTo(lx, ly); pg.lineTo(x + .01, y); pg.stroke() }
  $('#pclr').onclick = clear;
  $('#psave').onclick = () => pc.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'drawing.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000) });
  if ('IntersectionObserver' in window) new IntersectionObserver(en => paintVis = en[0].isIntersecting, { threshold: .3 }).observe(pc);
  const GR = '#1fe07a', JP = ['死', '助けて', '見ている', '逃げられない', 'あなたの後ろ'], NICE = ['Красиво рисуешь', 'Я вижу, как ты стараешься', 'Ты такой талантливый', 'Не останавливайся', 'Мне очень нравится'];
  const ease = p => 1 - Math.pow(1 - p, 2.2);
  /* линия, которая прорисовывается постепенно, как будто ведут рукой */
  const animPath = (pts, color, w, alpha, ms) => new Promise(res => { let i = 0; const n = pts.length, t0 = performance.now();
    (function step(t) { const k = Math.min(n - 1, Math.floor((t - t0) / ms * n)); pg.save(); pg.strokeStyle = color; pg.globalAlpha = alpha; pg.lineWidth = w; pg.lineCap = pg.lineJoin = 'round';
      pg.beginPath(); pg.moveTo(pts[i][0], pts[i][1]); for (; i < k; i++) pg.lineTo(pts[i + 1][0], pts[i + 1][1]); pg.stroke(); pg.restore();
      if (k < n - 1) requestAnimationFrame(step); else res() })(t0) });
  /* рукописные сердечки: неровный контур, двойная линия, лёгкая «маркерная» заливка */
  const heartPts = (x, y, s, rot, j) => { const p = []; for (let t = 0; t <= 6.4; t += .13) { const px = s * Math.sin(t) ** 3, py = -s / 16 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    p.push([x + px * Math.cos(rot) - py * Math.sin(rot) + rnd(-j, j), y + px * Math.sin(rot) + py * Math.cos(rot) + rnd(-j, j)]) } return p };
  /* каллиграфический текст: наклонный шрифт-прописи, проявляется слева направо, как будто пишут пером */
  async function ink(t, x, y, size, color, rot, font) {
    if (font === 'script') { try { await document.fonts.load(size + 'px "Marck Script"') } catch (e) {} }
    const f = font === 'script' ? size + 'px "Marck Script",cursive' : 'bold ' + size + 'px "Noto Sans JP","Yu Gothic","MS Gothic",sans-serif';
    pg.font = f; const w = pg.measureText(t).width + 10, ms = 900 + t.length * 70, snap = pg.getImageData(0, 0, pc.width, pc.height);
    await new Promise(res => { const t0 = performance.now();
      (function step(now) { const p = Math.min(1, (now - t0) / ms); pg.putImageData(snap, 0, 0); pg.save(); pg.translate(x, y); pg.rotate(rot); if (font === 'script') pg.transform(1, 0, -.2, 1, 0, 0);
        pg.beginPath(); pg.rect(-6, -size * 1.2, w * ease(p) + 6, size * 1.8); pg.clip(); pg.font = f; pg.fillStyle = color; pg.shadowColor = color; pg.shadowBlur = 1.5; pg.fillText(t, 0, 0); pg.restore();
        if (p < 1) requestAnimationFrame(step); else res() })(t0) });
    return w;
  }
  async function monikaDraw() {
    if (mBusy || !painted || !paintVis || !invaded() || busy || Math.random() < .25) return; mBusy = true; sfx('whisper');
    const W = pc.width, H = pc.height, r = Math.random();
    try {
      if (r < .4) { const x = rnd(60, W - 60), y = rnd(60, H - 60), s = rnd(16, 40), rot = rnd(-.35, .35), a = heartPts(x, y, s, rot, s * .04), b = heartPts(x + 1.5, y - 1, s * 1.03, rot, s * .05);
        await animPath(a, GR, 3.4, 1, 900); await animPath(b, GR, 1.8, .55, 600);
        pg.save(); pg.globalAlpha = .16; pg.fillStyle = GR; pg.beginPath(); a.forEach((p, i) => i ? pg.lineTo(p[0], p[1]) : pg.moveTo(p[0], p[1])); pg.fill(); pg.restore() }
      else if (r < .75) { const t = NICE[Math.random() * NICE.length | 0], size = 40; pg.font = size + 'px "Marck Script",cursive';
        const w0 = pg.measureText(t).width, x = rnd(14, Math.max(15, W - w0 - 40)), y = rnd(60, H - 40), rot = rnd(-.07, .07);
        const w = await ink(t, x, y, size, GR, rot, 'script');
        const sw = []; for (let k = 0; k <= 24; k++) { const u = k / 24; sw.push([x + u * w * Math.cos(rot) + 4, y + 10 + u * w * Math.sin(rot) + Math.sin(u * 7) * 4 * (1 - u * .5)]) }
        await animPath(sw, GR, 2.2, .85, 500) }                     /* росчерк под надписью */
      else { const t = JP[Math.random() * JP.length | 0], x = rnd(20, W - 220), y = rnd(80, H - 20), rot = rnd(-.1, .1); await ink(t, x + 3, y + 2, 60, '#b0001a', rot, 'jp'); await ink(t, x, y, 60, GR, rot, 'jp') }
    } finally { mBusy = false }
  }
  setInterval(monikaDraw, 22000);
}

console.log('%cmonika.chr', 'color:#3dff8f;font:700 40px sans-serif');
console.log('Ты открыл консоль. Файл monika.chr не удалён. Пока.');
})();
