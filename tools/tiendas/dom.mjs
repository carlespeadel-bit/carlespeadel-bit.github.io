import { readFile } from 'node:fs/promises';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/156.0 Safari/537.36';
const ents=JSON.parse(await readFile(process.argv[2],'utf8'));
async function g(u){const c=new AbortController();const t=setTimeout(()=>c.abort(),12000);
 try{const r=await fetch(u,{headers:{'user-agent':UA},signal:c.signal,redirect:'follow'});return await r.text();}catch{return ''}finally{clearTimeout(t)}}
const vis=h=>h.replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ')
 .replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&#8211;/g,'-').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
for(const e of ents){
  let out=new Set();
  for(const p of ['/aviso-legal','/aviso-legal/','/contacto','/contacto/','/pages/contacto','/pages/contact','/quienes-somos','/sobre-nosotros','/','/pages/aviso-legal']){
    const h=await g('https://'+e.dominio+p); if(!h) continue;
    const v=vis(h);
    for(const m of v.matchAll(/(?:Direcci[oó]n|Domicilio(?: social)?|Sede(?: social)?|Direcci[oó]n fiscal)[:\s]{0,4}([^|]{5,120})/gi))
      out.add(m[1].replace(/\s+/g,' ').trim());
    for(const m of v.matchAll(/C\.?I\.?F\.?[:.\s]*([A-Z]\s?-?\d{7,8}\s?[A-Z]?)/g)) out.add('CIF '+m[1]);
    if([...out].join(' ').length>140) break;
  }
  console.log(`${e.name} :: ${[...out].slice(0,3).join(' ~ ').slice(0,240)||'-'}`);
}
