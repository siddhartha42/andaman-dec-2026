'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const categories = {flight:'Flights',ferry:'Ferries',hotel:'Hotels',activity:'Activities',transfer:'Cab & transfers'};
  let documents = [], urls = [], settings;
  const from64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
  const requestedCategory = new URLSearchParams(location.search).get('category');
  if (Object.hasOwn(categories, requestedCategory)) $('category').value=requestedCategory;
  const loadSettings = () => settings ? Promise.resolve(settings) : fetch('wallet.json', {cache:'no-store'}).then(r => {if (!r.ok) throw new Error('The wallet is unavailable. Please try again when connected.');return r.json();}).then(value => settings=value);
  const setMessage = (id, text, error=false) => {$(id).textContent=text;$(id).classList.toggle('error',error);};
  const el = (tag, className, text) => {const n=document.createElement(tag);if(className)n.className=className;if(text)n.textContent=text;return n;};
  function render() {
    const query=$('document-search').value.toLowerCase().trim(), category=$('category').value;
    const shown=documents.filter(d => (category==='all'||d.category===category) && `${d.title} ${d.dateLabel} ${d.description} ${d.kind}`.toLowerCase().includes(query));
    const list=$('document-list');list.replaceChildren();
    shown.forEach(d => {
      const card=el('article','document-card');
      card.append(el('div','document-meta',`${categories[d.category]||'Document'} · ${d.dateLabel}`),el('h3','',d.title),el('span','document-kind',d.kind),el('p','',d.description));
      const actions=el('div','document-actions'), open=el('a','',d.original ? 'Open original ↗' : 'Open saved confirmation ↗'), download=el('a','secondary','Download');
      open.href=d.url;open.target='_blank';open.rel='noopener noreferrer';open.setAttribute('aria-label',`${open.textContent}: ${d.title}`);
      download.href=d.url;download.download=d.filename;download.setAttribute('aria-label',`Download ${d.title}`);
      actions.append(open,download);card.append(actions,el('div','file-info',`${d.mime==='application/pdf'?'PDF':d.mime.startsWith('image/')?'Image':'Text'} · ${Math.max(1,Math.round(d.bytes/1024))} KB${d.pages ? ` · ${d.pages} pages` : ''}`));list.append(card);
    });
    $('empty').hidden=shown.length>0;
  }
  function lock() {
    $('document-list').replaceChildren();$('missing-list').replaceChildren();
    urls.forEach(url=>URL.revokeObjectURL(url));urls=[];documents=[];
    $('wallet').hidden=true;$('locked').hidden=false;$('passphrase').value='';
    $('document-search').value='';$('category').value='all';setMessage('unlock-message','');$('passphrase').focus();
  }
  $('unlock-form').addEventListener('submit',async event => {
    event.preventDefault();const button=$('unlock-button');button.disabled=true;setMessage('unlock-message','Unlocking your documents…');
    let payload, opened=[];
    try {
      if(!globalThis.crypto?.subtle) throw new Error('Please open this page in Safari or Chrome using its secure website link.');
      const meta=await loadSettings();
      const material=await crypto.subtle.importKey('raw',new TextEncoder().encode($('passphrase').value),'PBKDF2',false,['deriveKey']);
      const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:from64(meta.salt),iterations:meta.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
      const response=await fetch(meta.file,{cache:'no-store'});if(!response.ok)throw new Error('The document download failed. Reconnect and try again.');
      let plain;
      try {plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(meta.iv),additionalData:new TextEncoder().encode('andaman-document-wallet-v1')},key,await response.arrayBuffer());}
      catch {throw new Error('That passphrase did not unlock the wallet. Please try again.');}
      payload=JSON.parse(new TextDecoder().decode(plain));new Uint8Array(plain).fill(0);
      if(payload.version!==1||!Array.isArray(payload.documents))throw new Error('This wallet version could not be opened. Please reload the page.');
      documents=payload.documents.map(d=>{
        if(!['application/pdf','image/png','image/jpeg','text/plain'].includes(d.mime))throw new Error('An unsupported document type was found.');
        const bytes=from64(d.data),url=URL.createObjectURL(new Blob([bytes],{type:d.mime}));opened.push(url);
        const {data,...info}=d;return {...info,bytes:bytes.length,url};
      });
      urls=opened;$('passphrase').value='';$('document-count').textContent=`${documents.length} saved documents`;$('updated').textContent=`Updated ${payload.updatedLabel}`;
      const missing=$('missing-list');missing.replaceChildren();payload.missing.forEach(item=>missing.append(el('li','',item)));
      if(!payload.missing.length)missing.append(el('li','','All currently available confirmations are saved.'));
      $('locked').hidden=true;$('wallet').hidden=false;render();$('document-search').focus();
    }catch(error){opened.forEach(url=>URL.revokeObjectURL(url));documents=[];setMessage('unlock-message',error.message||'Unable to unlock. Please try again.',true);}
    finally{payload=null;button.disabled=false;}
  });
  $('lock-button').addEventListener('click',lock);
  $('document-search').addEventListener('input',render);$('category').addEventListener('change',render);
  addEventListener('pagehide',()=>{urls.forEach(url=>URL.revokeObjectURL(url));});
  $('offline-button').addEventListener('click',async()=>{
    const button=$('offline-button');button.disabled=true;setMessage('offline-status','Saving the encrypted wallet…');
    try{
      if(!('serviceWorker' in navigator)||!('caches' in globalThis))throw new Error('Offline saving is unavailable in this browser. You can still download individual documents after unlocking.');
      const meta=await loadSettings(),cache=await caches.open('andaman-document-wallet-v1');
      const paths=['index.html','wallet.css','wallet.js','wallet.json',meta.file];
      const responses=await Promise.all(paths.map(async path=>{const url=new URL(path,location.href);const response=await fetch(url,{cache:'reload'});if(!response.ok)throw new Error('Could not save all files. Reconnect and try again.');return {url:url.href,response};}));
      await Promise.all(responses.map(({url,response})=>cache.put(url,response)));
      await navigator.serviceWorker.register('sw.js',{scope:'./'});await navigator.serviceWorker.ready;
      if(navigator.storage?.persist)await navigator.storage.persist().catch(()=>false);
      setMessage('offline-status','Saved in this browser. Reopen this page offline and unlock with the same passphrase.');
    }catch(error){setMessage('offline-status',error.message||'Offline saving failed. Please try again.',true);}
    finally{button.disabled=false;}
  });
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{});
})();
