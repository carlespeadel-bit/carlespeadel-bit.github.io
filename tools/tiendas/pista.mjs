import { readFile } from 'node:fs/promises';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/156.0 Safari/537.36';
const ents=JSON.parse(await readFile(process.argv[2],'utf8'));
async function g(u){const c=new AbortController();const t=setTimeout(()=>c.abort(),12000);
 try{const r=await fetch(u,{headers:{'user-agent':UA},signal:c.signal,redirect:'follow'});return await r.text();}catch{return ''}finally{clearTimeout(t)}}
const vis=h=>h.replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ')
 .replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
for(const e of ents){
  let out=new Set(), es=false;
  for(const p of ['/','/pages/contact','/contacto','/contacto/','/pages/contacto','/aviso-legal','/pages/aviso-legal','/tiendas','/sobre-nosotros']){
    const h=await g('https://'+e.dominio+p); if(!h) continue;
    const v=vis(h);
    if(/\bEspaña\b|\+34[\s.]?\d{3}/.test(v)) es=true;
    for(const m of v.matchAll(/((?:C\/|Calle|Carrer|Av\.|Avenida|Paseo|Polígono|Carrer de|Plaza)[^|]{5,90}?(?:España|Spain|\b0[1-9]\d{3}\b|\b[1-5]\d{4}\b))/g))
      out.add(m[1].replace(/\s+/g,' ').trim().slice(0,90));
    for(const m of v.matchAll(/\b(0[1-9]\d{3}|[1-5]\d{4})\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ' .-]{3,22})/g))
      out.add(m[0].replace(/\s+/g,' ').trim());
    if(out.size>4) break;
  }
  console.log(`${e.name} :: ES=${es?1:0} :: ${[...out].slice(0,3).join(' ~ ')||'-'}`);
}
