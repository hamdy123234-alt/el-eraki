import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const products = window.__PRODUCTS || [];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/* ---------- intro ---------- */
const intro = $('.intro');
function startPage() {
  intro.classList.add('done');
  setTimeout(() => intro.remove(), 1000);
  gsap.from('.hero-title .line > span', { yPercent: 110, duration: 1, stagger: .12, ease: 'power4.out', delay: .25 });
  gsap.from('.eyebrow, .hero-sub, .hero-cta', { y: 24, opacity: 0, duration: .8, stagger: .1, delay: .5, ease: 'power3.out' });
  gsap.from('.stage', { scale: .85, opacity: 0, duration: 1.2, delay: .35, ease: 'power3.out' });
  gsap.from('.switcher', { y: 20, opacity: 0, duration: .8, delay: .7 });
  startAuto();
}
if (reduce) { intro.remove(); } else { window.addEventListener('load', () => setTimeout(startPage, 1500)); }
// safety net if load is slow
setTimeout(() => { if (document.body.contains(intro) && !intro.classList.contains('done')) startPage(); }, 4500);

/* ---------- hero switcher ---------- */
const laptops = $$('.laptop');
const thumbs = $$('.thumb');
const modelWord = $('[data-model-word]');
const chips = $('[data-chips]');
let cur = 0;
let timer;

function go(n) {
  n = (n + products.length) % products.length;
  if (n === cur) return;
  const prev = laptops[cur];
  prev.classList.remove('is-on');
  prev.classList.add('is-out');
  setTimeout(() => prev.classList.remove('is-out'), 900);
  laptops[n].classList.add('is-on');
  thumbs.forEach((t, i) => t.classList.toggle('is-on', i === n));
  // scroll only the thumb strip sideways — scrollIntoView would also drag the whole page back up to the hero
  const strip = thumbs[n].parentElement;
  strip.scrollTo({ left: thumbs[n].offsetLeft - (strip.clientWidth - thumbs[n].offsetWidth) / 2, behavior: 'smooth' });
  const p = products[n];
  document.body.style.setProperty('--accent', p.accent);
  modelWord.style.opacity = 0;
  chips.classList.add('swap');
  setTimeout(() => {
    modelWord.textContent = p.model;
    modelWord.style.opacity = '';
    chips.innerHTML = p.specs.slice(0, 4).map((s) => `<li><small>${s[0]}</small><b>${s[1]}</b></li>`).join('');
    chips.classList.remove('swap');
  }, 350);
  cur = n;
}
function startAuto() { clearInterval(timer); if (!reduce) timer = setInterval(() => go(cur + 1), 4800); }
thumbs.forEach((t) => t.addEventListener('click', () => { go(+t.dataset.go); startAuto(); }));
$('[data-next]').addEventListener('click', () => { go(cur + 1); startAuto(); });
$('[data-prev]').addEventListener('click', () => { go(cur - 1); startAuto(); });

// swipe on the stage
let sx = null;
const stage = $('[data-stage]');
stage.addEventListener('pointerdown', (e) => { sx = e.clientX; });
stage.addEventListener('pointerup', (e) => {
  if (sx === null) return;
  const dx = e.clientX - sx; sx = null;
  if (Math.abs(dx) > 40) { go(cur + (dx > 0 ? 1 : -1)); startAuto(); }
});

/* ---------- pointer effects ---------- */
const tilt = $('[data-tilt]');
const glow = $('.cursor-glow');
if (finePointer && !reduce) {
  window.addEventListener('pointermove', (e) => {
    glow.style.setProperty('--mx', e.clientX + 'px');
    glow.style.setProperty('--my', e.clientY + 'px');
    const rx = (e.clientY / innerHeight - .5) * -10;
    const ry = (e.clientX / innerWidth - .5) * 14;
    tilt.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  // spotlight that follows the mouse inside cards
  $$('.pcard, .tile').forEach((el) => el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', `${e.clientX - r.left}px`);
    el.style.setProperty('--gy', `${e.clientY - r.top}px`);
  }));
}

/* ---------- nav + progress ---------- */
const nav = $('.nav');
const bar = $('.progress');
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = scrollY;
  nav.classList.toggle('hide', y > 300 && y > lastY);
  lastY = y;
  bar.style.transform = `scaleX(${y / (document.documentElement.scrollHeight - innerHeight)})`;
}, { passive: true });

/* ---------- scroll animations ---------- */
if (!reduce) {
  // hero drifts away as you scroll
  gsap.to('.stage', { yPercent: 18, scale: .9, opacity: .3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.giant', { xPercent: -20, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  $$('.reveal').forEach((el) => gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));

  // laptops: pinned horizontal rail on wide screens
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1001px)', () => {
    const rail = $('[data-rail]');
    const dist = () => Math.max(0, rail.scrollWidth - innerWidth);
    gsap.to(rail, {
      x: () => dist(), // RTL: the extra cards sit to the left, so slide right
      ease: 'none',
      scrollTrigger: { trigger: '[data-rail-pin]', start: 'center center', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true },
    });
  });

  gsap.from('.pcard', { y: 80, opacity: 0, duration: 1, stagger: .08, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: '.laptops .rail', start: 'top 85%' } });
  gsap.from('.tile', { y: 60, opacity: 0, duration: .8, stagger: .06, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: '.bento', start: 'top 85%' } });

  // story image: clip reveal + parallax
  gsap.fromTo('[data-story-media]', { clipPath: 'inset(20% 20% 20% 20% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: '.story', start: 'top 85%', end: 'center center', scrub: true } });
  gsap.fromTo('[data-story-media] img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true } });

  gsap.from('.foot-giant', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

// counters
$$('[data-count]').forEach((el) => {
  const end = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const dec = String(end).includes('.') ? 1 : 0;
  const o = { v: 0 };
  const set = () => { el.textContent = o.v.toFixed(dec) + suffix; };
  if (reduce) { o.v = end; set(); return; }
  ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: set }) });
});

window.addEventListener('load', () => ScrollTrigger.refresh());
