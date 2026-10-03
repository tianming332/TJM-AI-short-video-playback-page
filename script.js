const works = window.TJM_FILMS;

const $ = selector => document.querySelector(selector);
const body = document.body;
const items = $('.items');
const stage = $('.media-stage');
const poster = $('.hero-poster');
const video = $('.hero-video');
const stagePlay = $('.stage-play');
const dockPlay = $('.dock-play');
const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let current = 0;
let visible = [...works];
let chromeTimer;
let selectionTimer;
let selectionVersion = 0;

function syncCollectionCount() {
  $('.playlist-head b').textContent = `${String(visible.length).padStart(2, '0')} ${lang === 'en' ? 'films' : '部作品'}`;
}

function setPlaybackMessage(message = '') {
  const output = $('.playback-status');
  output.textContent = message;
  output.hidden = !message;
}

function syncUploadStatus(work) {
  const subtitle = $('.track-info small');
  if (work.uploadStatus !== 'pending') {
    subtitle.textContent = lang === 'en' ? 'Created with T-Agent' : 'T-Agent 全流程生成';
    return;
  }
  const isLocal = window.resolveFilmPlaybackURL(work) !== work.video;
  subtitle.textContent = lang === 'en'
    ? (isLocal ? 'Local preview · Pending upload' : 'Pending upload · URL reserved')
    : (isLocal ? '本地预览 · 待上传' : '待上传 · 链接已预留');
}

function renderItems() {
  syncCollectionCount();
  items.innerHTML = visible.map(work => `
    <article class="item ${work.id === current ? 'active' : ''}" data-id="${work.id}" tabindex="0" role="button" aria-label="播放 ${work.title}">
      <div class="item-thumb"><img src="${work.poster}" alt=""><span>${work.duration}</span></div>
      <div class="item-copy"><small>${work.date}${work.uploadStatus === 'pending' ? `<span class="upload-badge">${lang === 'en' ? 'Pending upload' : '待上传'}</span>` : ''}</small><h3>${work.title}</h3><p>${work.meta}</p></div>
    </article>`).join('');
  items.querySelectorAll('.item').forEach(item => {
    const open = () => select(Number(item.dataset.id));
    item.addEventListener('click', open);
    item.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
}

function updateCurrent(work) {
  poster.src = work.poster;
  poster.alt = work.title;
  video.setAttribute('aria-label', work.title);
  document.documentElement.style.setProperty('--video-ratio', work.ratio || '9 / 16');
  $('.track-info img').src = work.poster;
  $('.track-info b').textContent = work.title;
  syncUploadStatus(work);
  $('.control-dock time').textContent = `00:00 / ${work.duration}`;
  $('.progress i').style.width = '0%';
  renderItems();
}

function select(id, autoplay = false) {
  const work = works.find(work => work.id === id);
  if (!work) return;
  clearTimeout(selectionTimer);
  const version = ++selectionVersion;
  video.pause();
  stage.classList.add('is-switching');
  const change = () => {
    if (version !== selectionVersion) return;
    setPlaybackMessage();
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.style.display = 'none';
    poster.style.display = 'block';
    current = id;
    updateCurrent(work);
    stage.classList.remove('is-playing', 'chrome-visible', 'is-switching');
    if (autoplay) play();
  };
  selectionTimer = window.setTimeout(change, motionOK ? 160 : 0);
}

function play() {
  if (stage.classList.contains('is-switching')) return;
  const work = works[current];
  if (!video.getAttribute('src')) {
    video.src = window.resolveFilmPlaybackURL(work);
    video.style.display = 'block';
    poster.style.display = 'none';
  }
  if (video.paused) {
    setPlaybackMessage();
    const version = selectionVersion;
    video.play().catch(error => {
      // The media error handler clears src and provides the upload guidance.
      // Do not replace that specific message with a generic rejected-play error.
      if (version !== selectionVersion || error.name === 'AbortError' || !video.getAttribute('src')) return;
      setPlaybackMessage(lang === 'en' ? 'Playback could not start. Try again or check the video URL.' : '视频暂时无法播放，请重试或检查视频地址。');
    });
  }
  else video.pause();
}

function navigate(step) {
  const ids = visible.map(work => work.id);
  if (!ids.length) return;
  const position = Math.max(0, ids.indexOf(current));
  select(ids[(position + step + ids.length) % ids.length]);
}

function revealChrome() {
  if (video.paused) return;
  stage.classList.add('chrome-visible');
  clearTimeout(chromeTimer);
  chromeTimer = setTimeout(() => stage.classList.remove('chrome-visible'), 1500);
}

function setPlayIcon(isPlaying) {
  dockPlay.innerHTML = isPlaying
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12M16 6v12"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6V6Z"/></svg>';
}

stagePlay.addEventListener('click', play);
dockPlay.addEventListener('click', play);
video.addEventListener('click', play);
$('.prev').addEventListener('click', () => navigate(-1));
$('.next').addEventListener('click', () => navigate(1));
$('.expand-btn').addEventListener('click', () => {
  const target = video.getAttribute('src') ? video : stage;
  target.requestFullscreen?.();
});
$('.sound-btn').addEventListener('click', event => {
  video.muted = !video.muted;
  event.currentTarget.innerHTML = video.muted
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="m16 9 4 6M20 9l-4 6"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M15 9c1 .8 1.5 1.8 1.5 3S16 14.2 15 15"/></svg>';
  event.currentTarget.setAttribute('aria-label', video.muted ? '取消静音' : '静音');
});
const volumeRange = $('.volume-range');
let lastVolume = 0.5;
function syncVolume() {
  const value = Number(volumeRange.value);
  video.volume = value;
  video.muted = value === 0;
  if (value > 0) lastVolume = value;
  volumeRange.style.setProperty('--volume-fill', `${value * 100}%`);
}
volumeRange.addEventListener('input', syncVolume);
$('.sound-btn').addEventListener('dblclick', () => { volumeRange.value = lastVolume || 0.5; syncVolume(); });
syncVolume();

stage.addEventListener('pointermove', revealChrome);
stage.addEventListener('pointerleave', () => { if (!video.paused) stage.classList.remove('chrome-visible'); });

video.addEventListener('play', () => {
  setPlaybackMessage();
  stage.classList.add('is-playing');
  stage.classList.remove('chrome-visible');
  setPlayIcon(true);
  stagePlay.innerHTML = '<span>Ⅱ</span>';
  stagePlay.setAttribute('aria-label', '暂停当前视频');
});
video.addEventListener('pause', () => {
  stage.classList.remove('is-playing', 'chrome-visible');
  setPlayIcon(false);
  stagePlay.innerHTML = '<span>▶</span>';
  stagePlay.setAttribute('aria-label', '播放当前视频');
});
video.addEventListener('ended', () => stage.classList.remove('is-playing'));
video.addEventListener('error', () => {
  if (!video.getAttribute('src') || stage.classList.contains('is-switching')) return;
  video.style.display = 'none';
  poster.style.display = 'block';
  stage.classList.remove('is-playing', 'chrome-visible');
  video.removeAttribute('src');
  video.load();
  setPlaybackMessage(lang === 'en'
    ? 'Video unavailable. New films require the matching files to be published to GitHub Pages.'
    : '视频暂不可用。新增视频需将对应文件上传并发布到 GitHub Pages 后才能在线播放。');
});
video.addEventListener('timeupdate', () => {
  if (!video.duration) return;
  $('.progress i').style.width = `${video.currentTime / video.duration * 100}%`;
  const format = value => String(Math.floor(value)).padStart(2, '0');
  $('.control-dock time').textContent = `${format(video.currentTime / 60)}:${format(video.currentTime % 60)} / ${works[current].duration}`;
});
$('.progress').addEventListener('click', event => {
  if (!video.duration) return;
  const rect = event.currentTarget.getBoundingClientRect();
  video.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * video.duration;
});

document.querySelectorAll('.category-dock button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.category-dock button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  visible = button.dataset.filter === 'all' ? [...works] : works.filter(work => work.cat === button.dataset.filter);
  if (visible.length && !visible.some(work => work.id === current)) select(visible[0].id);
  else renderItems();
}));

// Persistent theme/language preferences.
const params = new URLSearchParams(location.search);
const safeStore = {get:key => { try { return localStorage.getItem(key); } catch { return null; } }, set:(key,value) => { try { localStorage.setItem(key,value); } catch {} }};
const allowedThemes = ['white','gray','black'];
const allowedLangs = ['zh','en'];
let theme = params.get('theme') || safeStore.get('tjm-theme') || 'gray';
let accent = params.get('accent') || safeStore.get('tjm-accent') || 'blue';
let lang = params.get('lang') || safeStore.get('tjm-lang') || 'zh';
if (theme === 'light') theme = 'white';
if (!allowedThemes.includes(theme)) theme = 'gray';
if (!allowedLangs.includes(lang)) lang = 'zh';
if (!['blue','lime','white'].includes(accent)) accent = 'blue';
const translations = {
  zh:{all:'全部作品',story:'恋爱短剧',game:'游戏影像',ad:'品牌广告',list:'播放列表'},
  en:{all:'All works',story:'Love story',game:'Game films',ad:'Brand films',list:'Playlist'}
};
function applyPreferences() {
  body.dataset.theme = theme;
  body.dataset.language = lang;
  body.dataset.accent = accent;
  safeStore.set('tjm-theme', theme);
  safeStore.set('tjm-lang', lang);
  safeStore.set('tjm-accent', accent);
  document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
  document.querySelectorAll('[data-language-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.languageChoice === lang)));
  document.querySelectorAll('[data-accent-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.accentChoice === accent)));
  const text = translations[lang];
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  const categories = document.querySelectorAll('.category-dock button');
  [text.all,text.story,text.game,text.ad].forEach((label,index) => categories[index].textContent = label);
  $('.playlist-title span').textContent = text.list;
  renderItems();
  syncUploadStatus(works.find(work => work.id === current));
  window.dispatchEvent(new CustomEvent('portfolio:themechange',{detail:{theme}}));
}
document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => { theme = button.dataset.themeChoice; applyPreferences(); }));
document.querySelectorAll('[data-language-choice]').forEach(button => button.addEventListener('click', () => { lang = button.dataset.languageChoice; applyPreferences(); }));
document.querySelectorAll('[data-accent-choice]').forEach(button => button.addEventListener('click', () => { accent = button.dataset.accentChoice; applyPreferences(); }));
const prefToggle = $('.pref-toggle');
prefToggle.addEventListener('click', () => {
  const dock = $('.preference-dock');
  dock.classList.toggle('is-collapsed');
  prefToggle.setAttribute('aria-expanded', String(!dock.classList.contains('is-collapsed')));
});

// Restrained tactile motion.
if (motionOK) {
  document.addEventListener('pointermove', event => {
    body.style.setProperty('--ambient-x', `${event.clientX}px`);
    body.style.setProperty('--ambient-y', `${event.clientY}px`);
  });
  document.querySelectorAll('[data-spotlight]').forEach(element => element.addEventListener('pointermove', event => {
    const rect = element.getBoundingClientRect();
    element.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    element.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  }));
}

renderItems();
updateCurrent(works[0]);
applyPreferences();
