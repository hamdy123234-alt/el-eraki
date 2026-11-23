// Shop: category filter, search, quick view, and a cart that sends one WhatsApp order.
const items = window.__CATALOG || [];
const catName = window.__CATNAME || {};
const WA = window.__WA;
const byId = Object.fromEntries(items.map((p) => [p.id, p]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const img = (id) => `${window.__BASE || '/'}img/p/${id}.webp`;
const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

/* ---------- filter + search ---------- */
const grid = $('[data-grid]');
const cards = $$('.card', grid);
const empty = $('[data-empty]');
const moreBtn = $('[data-more]');
const LIMIT = () => (matchMedia('(max-width: 760px)').matches ? 8 : 12);
let cat = 'all';
let q = '';
let expanded = false;

function apply() {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let shown = 0;
  cards.forEach((c) => {
    const ok = (cat === 'all' || c.dataset.cat === cat) && words.every((w) => c.dataset.text.includes(w));
    c.classList.toggle('hide', !ok);
    if (ok) shown++;
    c.classList.toggle('shown-extra', ok && shown > LIMIT());
  });
  const collapse = !expanded && cat === 'all' && !words.length && shown > LIMIT();
  grid.classList.toggle('collapsed', collapse);
  moreBtn.parentElement.hidden = !collapse;
  empty.hidden = shown > 0;
}

$$('[data-cat]', $('[data-cats]')).forEach((b) => b.addEventListener('click', () => {
  cat = b.dataset.cat;
  $$('.cat').forEach((x) => x.classList.toggle('is-on', x === b));
  apply();
}));
$('[data-search]').addEventListener('input', (e) => { q = e.target.value; apply(); });
moreBtn.addEventListener('click', () => { expanded = true; apply(); });
// service tiles can jump straight to a category
$$('[data-goto-cat]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  const b = $(`.cat[data-cat="${a.dataset.gotoCat}"]`);
  if (b) b.click();
  $('#shop').scrollIntoView({ behavior: 'smooth' });
}));
apply();
addEventListener('resize', apply);

/* ---------- cart ---------- */
const KEY = 'eraki-cart';
let cart = {};
try { cart = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { cart = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* private mode */ } };

const fab = $('[data-cart-open]');
const drawer = $('[data-cart]');
const scrim = $('[data-scrim]');
const list = $('[data-cart-list]');
const send = $('[data-cart-send]');

function render() {
  const ids = Object.keys(cart).filter((id) => byId[id]);
  const count = ids.reduce((n, id) => n + cart[id], 0);
  $('[data-cart-count]').textContent = count;
  $('[data-cart-empty]').hidden = ids.length > 0;
  list.innerHTML = ids.map((id) => {
    const p = byId[id];
    return `<li><img src="${img(id)}" alt=""><div><b>${p.name}</b><small>${p.brand} · ${p.model}</small></div>
      <div class="qty"><button data-dec="${id}" aria-label="أقل">−</button><span>${cart[id]}</span><button data-inc="${id}" aria-label="أكتر">+</button></div></li>`;
  }).join('');
  const lines = ids.map((id, i) => `${i + 1}. ${byId[id].name} — ${byId[id].brand} ${byId[id].model} × ${cart[id]}`);
  send.href = waLink(`أهلاً العراقي 👋\nعايز أطلب:\n${lines.join('\n')}\n\nممكن الأسعار والمتاح؟`);
  send.setAttribute('aria-disabled', ids.length ? 'false' : 'true');
  $$('[data-add]').forEach((b) => b.classList.toggle('added', !!cart[b.dataset.add]));
}

function add(id, fromEl) {
  cart[id] = (cart[id] || 0) + 1;
  save();
  render();
  fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump');
  if (fromEl) flyTo(fromEl);
}

function flyTo(el) {
  const src = el.closest('.card')?.querySelector('img') || $('[data-qv-img]');
  if (!src || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const a = src.getBoundingClientRect();
  const b = fab.getBoundingClientRect();
  const ghost = src.cloneNode();
  Object.assign(ghost.style, { position: 'fixed', left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', zIndex: 90, pointerEvents: 'none', objectFit: 'contain', transition: 'transform .7s cubic-bezier(.6,0,.2,1), opacity .7s' });
  document.body.appendChild(ghost);
  requestAnimationFrame(() => {
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(.12)`;
    ghost.style.opacity = '.3';
  });
  setTimeout(() => ghost.remove(), 750);
}

list.addEventListener('click', (e) => {
  const inc = e.target.dataset.inc; const dec = e.target.dataset.dec;
  if (inc) cart[inc]++;
  if (dec) { cart[dec]--; if (cart[dec] <= 0) delete cart[dec]; }
  if (inc || dec) { save(); render(); }
});
const openCart = (on) => { drawer.classList.toggle('open', on); scrim.classList.toggle('on', on); };
fab.addEventListener('click', () => openCart(true));
$('[data-cart-close]').addEventListener('click', () => openCart(false));
scrim.addEventListener('click', () => openCart(false));
addEventListener('keydown', (e) => { if (e.key === 'Escape') openCart(false); });

/* ---------- quick view ---------- */
const qv = $('[data-qv]');
let qvId = null;
function openQv(id) {
  const p = byId[id]; if (!p) return;
  qvId = id;
  $('[data-qv-img]').src = img(id);
  $('[data-qv-img]').alt = `${p.brand} ${p.model}`;
  $('[data-qv-brand]').textContent = p.brand;
  $('[data-qv-name]').textContent = p.name;
  $('[data-qv-model]').textContent = p.model;
  $('[data-qv-tags]').innerHTML = p.tags.map((t) => `<span>${t}</span>`).join('');
  $('[data-qv-cat]').textContent = `القسم: ${catName[p.cat] || ''} · السعر والمتاح على واتساب`;
  $('[data-qv-wa]').href = waLink(`أهلاً العراقي، عايز أسأل عن: ${p.name} (${p.brand} ${p.model}) — متاح وبكام؟`);
  qv.showModal();
}
grid.addEventListener('click', (e) => {
  const addBtn = e.target.closest('[data-add]');
  if (addBtn) { e.stopPropagation(); add(addBtn.dataset.add, addBtn); return; }
  const card = e.target.closest('.card');
  if (card) openQv(card.dataset.id);
});
grid.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList.contains('card')) openQv(e.target.dataset.id);
});
$('[data-qv-close]').addEventListener('click', () => qv.close());
qv.addEventListener('click', (e) => { if (e.target === qv) qv.close(); });
$('[data-qv-add]').addEventListener('click', (e) => { add(qvId, e.target); qv.close(); });

render();
