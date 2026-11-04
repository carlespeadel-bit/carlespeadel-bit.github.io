import { readFile } from 'node:fs/promises';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/156.0 Safari/537.36';
const ents=JSON.parse(await readFile('shop-in.json','utf8'));
async function g(u){const c=new AbortController();const t=setTimeout(()=>c.abort(),12000);
 try{const r=await fetch(u,{headers:{'user-agent':UA},signal:c.signal,redirect:'follow'});return await r.text();}catch{return ''}finally{clearTimeout(t)}}
for(const e of ents){
  const h=await g('https://'+e.dominio+'/');
  const cart=/addtocart|add-to-cart|añadir al carrito|\/cart|carrito|basket/i.test(h);
  const poke=/pok[eé]mon/i.test(h);
  const precio=/[0-9],[0-9]{2}\s*&?euro|€/.test(h);
  console.log(`${e.name.padEnd(22)} carrito=${cart?1:0} pokemon=${poke?1:0} precio=${precio?1:0}`);
}
