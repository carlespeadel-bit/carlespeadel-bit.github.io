/* ValorCarta - buscador + calculadora de colección (sin dependencias) */
(() => {
  const KEY = 'vc.col';
  const $ = (s) => document.querySelector(s);
  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const eur = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

  let DB = null;
  let MAP = new Map();
  const enValorar = !!document.getElementById('coleccion');

  const leer = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  };
  const guardar = (list) => {
    localStorage.setItem(KEY, JSON.stringify(list));
    pintar();
  };

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('on'), 1800);
  }

  function add(slug) {
    const list = leer();
    const hit = list.find((x) => x.s === slug);
    if (hit) hit.q += 1;
    else list.push({ s: slug, q: 1 });
    guardar(list);
    toast('Añadida a tu colección');
  }

  async function cargar() {
    if (DB) return DB;
    const r = await fetch('/data/cartas.json');
    DB = await r.json();
    MAP = new Map(DB.map((row) => [row[0], row]));
    return DB;
  }

  function pintarResultados(items) {
    const box = $('#resultados');
    if (!box) return;
    if (!items.length) { box.classList.remove('on'); return; }
    box.innerHTML = items
      .map((row) => {
        const [slug, name, set, price, , img] = row;
        return `<div class="res" data-slug="${slug}">
          ${img ? `<img src="${img}/low.webp" alt="" loading="lazy">` : ''}
          <span class="res-n">${name}<br><span class="res-s">${set}</span></span>
          <span class="res-p">${eur(price)}</span>
        </div>`;
      })
      .join('');
    box.classList.add('on');
    box.querySelectorAll('.res').forEach((el) => {
      el.addEventListener('click', () => {
        const slug = el.dataset.slug;
        if (enValorar) { add(slug); $('#q').value = ''; box.classList.remove('on'); }
        else location.href = `/carta/${slug}/`;
      });
    });
  }

  function buscar(q) {
    if (!DB) return;
    const t = norm(q.trim());
    if (t.length < 2) { pintarResultados([]); return; }
    const out = [];
    const empieza = [];
    for (const row of DB) {
      const n = norm(row[1]);
      if (n.startsWith(t)) empieza.push(row);
      else if (n.includes(t) || norm(row[2]).includes(t)) out.push(row);
      if (empieza.length > 14) break;
    }
    pintarResultados([...empieza, ...out].slice(0, 14));
  }

  function pintar() {
    const box = $('#coleccion');
    if (!box) return;
    const list = leer();
    if (!list.length) {
      box.innerHTML = '<p class="muted">Todavía no has añadido cartas.</p>';
      $('#total').textContent = eur(0);
      $('#delta').textContent = '';
      $('#n-cartas').textContent = '';
      return;
    }
    let total = 0;
    let total30 = 0;
    let uds = 0;
    box.innerHTML = list
      .map((it) => {
        const row = MAP.get(it.s);
        if (!row) return '';
        const [, name, set, price, avg30, img] = row;
        const sub = price * it.q;
        total += sub;
        total30 += (avg30 ?? price) * it.q;
        uds += it.q;
        return `<div class="fila" data-slug="${it.s}">
          ${img ? `<img src="${img}/low.webp" alt="" loading="lazy">` : '<span></span>'}
          <span><span class="f-n">${name}</span><br><span class="f-s">${set}</span></span>
          <input type="number" min="1" max="99" value="${it.q}" aria-label="cantidad">
          <span class="f-p">${eur(sub)}</span>
          <button class="del" aria-label="quitar">×</button>
        </div>`;
      })
      .join('');
    $('#total').textContent = eur(total);
    $('#n-cartas').textContent = `· ${list.length} cartas · ${uds} unidades`;
    const d = total - total30;
    const pct = total30 ? (d / total30) * 100 : 0;
    $('#delta').innerHTML = total30
      ? `Últimos 30 días: <b class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : ''}${eur(d)} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)</b>`
      : '';

    box.querySelectorAll('.fila').forEach((el) => {
      const slug = el.dataset.slug;
      el.querySelector('input').addEventListener('change', (e) => {
        const list2 = leer();
        const hit = list2.find((x) => x.s === slug);
        if (!hit) return;
        hit.q = Math.max(1, Math.min(99, parseInt(e.target.value) || 1));
        guardar(list2);
      });
      el.querySelector('.del').addEventListener('click', () => {
        guardar(leer().filter((x) => x.s !== slug));
      });
    });
  }

  function enc(list) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(list)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function dec(s) {
    try { return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))); } catch { return null; }
  }

  function init() {
    const q = $('#q');
    if (q) {
      q.addEventListener('input', (e) => buscar(e.target.value));
      q.addEventListener('focus', () => { if (DB) buscar(q.value); });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.buscador')) $('#resultados')?.classList.remove('on');
      });
    }

    document.querySelectorAll('[data-add]').forEach((b) =>
      b.addEventListener('click', () => { add(b.dataset.add); }),
    );

    if (enValorar) {
      const hash = location.hash.slice(1);
      if (hash.startsWith('c=')) {
        const l = dec(hash.slice(2));
        if (Array.isArray(l)) localStorage.setItem(KEY, JSON.stringify(l));
      }
      cargar().then(pintar);

      $('#compartir')?.addEventListener('click', async () => {
        const url = `${location.origin}/valorar/#c=${enc(leer())}`;
        try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); }
        catch { prompt('Copia este enlace:', url); }
      });
      $('#csv')?.addEventListener('click', () => {
        const rows = [['carta', 'set', 'unidades', 'precio', 'subtotal']];
        for (const it of leer()) {
          const row = MAP.get(it.s);
          if (!row) continue;
          rows.push([row[1], row[2], it.q, row[3], (row[3] * it.q).toFixed(2)]);
        }
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
        a.download = 'mi-coleccion.csv';
        a.click();
      });
      $('#vaciar')?.addEventListener('click', () => {
        if (confirm('¿Vaciar la colección?')) guardar([]);
      });
    } else {
      cargar();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
