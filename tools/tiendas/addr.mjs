import { readFile } from 'node:fs/promises';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/156.0 Safari/537.36';
const ents=JSON.parse(await readFile(process.argv[2],'utf8'));
async function g(u){const c=new AbortController();const t=setTimeout(()=>c.abort(),12000);
 try{const r=await fetch(u,{headers:{'user-agent':UA},signal:c.signal,redirect:'follow'});return await r.text();}catch{return ''}finally{clearTimeout(t)}}
for(const e of ents){
  let found=[];
  for(const p of ['/','/pages/contact','/contacto','/pages/contacto']){
    const h=await g('https://'+e.dominio+p);
    for(const m of h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)){
      try{const j=JSON.parse(m[1].replace(/&quot;/g,'"'));
        const walk=o=>{if(!o||typeof o!=='object')return;
          if(o.address&&typeof o.address==='object'){
            const a=o.address; if(a.addressCountry||a.addressLocality)
              found.push([a.streetAddress,a.postalCode,a.addressLocality,a.addressRegion,a.addressCountry].filter(Boolean).join(' | '));
          }
          for(const v of Object.values(o)) if(typeof v==='object') walk(v);};
        walk(j);
      }catch{}
    }
    if(found.length) break;
  }
  console.log(`${e.name}\t${e.dominio}\t${[...new Set(found)].slice(0,2).join(' /// ')||'-'}`);
}
