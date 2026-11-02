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

  // --- intérprete de frases: "2 charizard base y un pikachu de 151" ---
  const NUM = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };

  function trocear(texto) {
    return texto
      .toLowerCase()
      .split(/[,;\n]|\by\b/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function puntuar(trozo, row) {
    const [, name, set, , , , setId] = row;
    const n = norm(name);
    const s = norm(set);
    const sid = norm(setId || '');
    const palabras = norm(trozo).split(/\s+/).filter((w) => w.length > 2 && !NUM[w]);
    if (!palabras.length) return 0;
    let score = 0;
    for (const w of palabras) {
      if (n === w) score += 6;
      else if (n.startsWith(w)) score += 4;
      else if (n.includes(w)) score += 2;
      else if (s.includes(w)) score += 1.5;
      else if (sid.includes(w)) score += 3;
      else score -= 1;
    }
    return score;
  }

  function interpretar(texto) {
    const trozos = trocear(texto);
    const salida = [];
    for (const t of trozos) {
      let qty = 1;
      let resto = t;
      const m = t.match(/^(\d+)\s+(.*)$/);
      const p = t.match(/^(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(.*)$/);
      if (m) { qty = Math.min(99, parseInt(m[1], 10)); resto = m[2]; }
      else if (p) { qty = NUM[p[1]]; resto = p[2]; }
      let mejor = null;
      let mejorScore = 0;
      for (const row of DB) {
        const sc = puntuar(resto, row);
        if (sc > mejorScore) { mejorScore = sc; mejor = row; }
      }
      if (mejor && mejorScore >= 2) salida.push({ slug: mejor[0], qty, texto: resto, nombre: mejor[1], set: mejor[2] });
      else salida.push({ slug: null, qty, texto: resto, nombre: null, set: null });
    }
    return salida;
  }

  function aplicarFrase() {
    const inp = $('#frase');
    const out = $('#frase-out');
    if (!inp || !DB) return;
    const res = interpretar(inp.value || '');
    const ok = res.filter((r) => r.slug);
    const mal = res.filter((r) => !r.slug);
    if (!ok.length) { out.textContent = 'No he reconocido ninguna carta. Prueba con el nombre y el set.'; return; }
    const list = leer();
    for (const r of ok) {
      const hit = list.find((x) => x.s === r.slug);
      if (hit) hit.q += r.qty;
      else list.push({ s: r.slug, q: r.qty });
    }
    guardar(list);
    out.innerHTML = ok.map((r) => `· ${r.qty} × ${r.nombre} <span class="muted">(${r.set})</span>`).join('<br>')
      + (mal.length ? `<br><span class="down">No reconocido:</span> ${mal.map((m) => m.texto).join(', ')}` : '');
    inp.value = '';
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

    // avisos de precio
    const WKEY = 'vc.watch';
    const leerW = () => { try { return JSON.parse(localStorage.getItem(WKEY) || '[]'); } catch { return []; } };
    document.querySelectorAll('[data-watch]').forEach((b) =>
      b.addEventListener('click', () => {
        const slug = b.dataset.watch;
        const inp = document.getElementById('umbral');
        const t = Math.max(0, parseFloat(String(inp?.value ?? '').replace(',', '.')) || 0);
        const list = leerW().filter((x) => x.s !== slug);
        list.push({ s: slug, t });
        localStorage.setItem(WKEY, JSON.stringify(list));
        toast(t ? `Aviso activado por debajo de ${t.toFixed(2)} €` : 'Aviso activado');
      }),
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
      $('#interpretar')?.addEventListener('click', aplicarFrase);
      $('#frase')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') aplicarFrase(); });
      $('#vaciar')?.addEventListener('click', () => {
        if (confirm('¿Vaciar la colección?')) guardar([]);
      });
    } else {
      cargar().then(pintarAvisos);
    }
  }

  function pintarAvisos() {
    const box = document.getElementById('alertas-lista');
    if (!box || !DB) return;
    const list = leerW();
    if (!list.length) return;
    box.innerHTML = list
      .map((it) => {
        const row = MAP.get(it.s);
        if (!row) return '';
        const [, name, set, price, , img] = row;
        const cumple = it.t > 0 && price <= it.t;
        return `<div class="fila alerta ${cumple ? 'cumple' : ''}" data-slug="${it.s}">
          ${img ? `<img src="${img}/low.webp" alt="" loading="lazy">` : '<span></span>'}
          <span><span class="f-n">${name}</span><br><span class="f-s">${set}</span></span>
          <span class="f-p">${eur(price)}<br><span class="f-s">objetivo ${it.t ? eur(it.t) : '—'}</span></span>
          <span class="estado">${cumple ? '¡está por debajo!' : 'esperando'}</span>
          <button class="del" aria-label="quitar">×</button>
        </div>`;
      })
      .join('');
    box.querySelectorAll('.fila').forEach((el) => {
      el.querySelector('.del').addEventListener('click', () => {
        localStorage.setItem(WKEY, JSON.stringify(leerW().filter((x) => x.s !== el.dataset.slug)));
        location.reload();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
