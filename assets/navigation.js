(() => {
  'use strict';
  const root = new URL(document.currentScript.dataset.tripRoot || '../', document.currentScript.src || location.href);
  const release='20261115-nav1';
  root.searchParams.set('v',release);
  const wallet = new URL('documents/', root);
  wallet.searchParams.set('v',release);
  const onWallet = location.pathname.startsWith(wallet.pathname);
  const allowed = /^(?:day-1[1-8]|stay-(?:pb1|havelock|neil|pb2)|itinerary|map|documents|bookings|stays|budget|prepare|flights|experiences|baratang-diy|transport|price-check|guide-notes)$/;
  let returnTo = new URLSearchParams(location.search).get('from');
  if (!allowed.test(returnTo || '')) returnTo = 'itinerary';
  const section = id => onWallet ? `${root.href}#${id}` : `#${id}`;
  const days = onWallet && returnTo.startsWith('day-') ? returnTo : 'itinerary';
  const icons = {
    itinerary:'<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16m-11 4h2m3 0h2"/>',
    map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15"/>',
    documents:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8m-8 4h5"/>',
    bookings:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 9 2 2 5-5m-7 9h8"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
  };
  const primary = [
    ['itinerary','Days',section(days)],['map','Map',section('map')],
    ['documents','Documents',onWallet?'#main':wallet.href],['bookings','Bookings',section('bookings')]
  ];
  const icon = id => `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id]}</svg>`;
  const primaryMarkup = compact => primary.map(([id,label,href]) => `<a href="${href}" data-quick-section="${id}">${compact ? icon(id) : ''}<span>${compact && id==='documents' ? 'Docs' : label}</span></a>`).join('') + `<button type="button" data-trip-menu data-quick-section="more" aria-haspopup="dialog" aria-controls="trip-menu" aria-expanded="false">${compact ? icon('more') : ''}<span>More</span></button>`;
  let header = document.querySelector('[data-primary-nav]');
  if (!header) {
    header = document.createElement('nav');
    header.className='site-primary';header.dataset.primaryNav='';
    header.setAttribute('aria-label','Trip navigation');
    document.querySelector('header .brand')?.after(header);
  }
  header.innerHTML=primaryMarkup(false);
  const bottom=document.createElement('nav');
  bottom.className='phone-nav trip-nav';bottom.setAttribute('aria-label','Quick trip navigation');
  bottom.innerHTML=primaryMarkup(true);document.body.append(bottom);
  const menu=document.createElement('dialog');menu.id='trip-menu';menu.className='trip-menu';menu.setAttribute('aria-labelledby','trip-menu-title');
  const links=[['itinerary','Day plan','Daily timings'],['documents','Documents','Tickets & vouchers'],['bookings','Bookings','Open tasks'],['stays','Hotels','Rooms & directions'],['budget','Budget','Costs and balances'],['prepare','Packing','Day checklists'],['flights','Flights','Connections & bags'],['experiences','Activities','Scuba, kayak, snorkel'],['baratang-diy','Baratang','Cab & caves'],['transport','Local rides','Pickups & transfers'],['price-check','Price notes','Allowances'],['guide-notes','References','Source links']];
  menu.innerHTML=`<div class="trip-menu-head"><h2 id="trip-menu-title">Explore the trip</h2><button type="button" data-close-trip-menu aria-label="Close menu">×</button></div><nav aria-label="All trip sections">${links.map(([id,label,description])=>`<a href="${id==='documents' ? (onWallet?'#main':wallet.href) : section(id==='itinerary'?days:id)}"><strong>${label}</strong><span>${description}</span></a>`).join('')}</nav>`;
  document.body.append(menu);
  let opener;
  function closeMenu(){menu.close();}
  document.querySelectorAll('[data-trip-menu]').forEach(button=>button.addEventListener('click',()=>{opener=button;menu.showModal();document.body.classList.add('trip-menu-open');document.querySelectorAll('[data-trip-menu]').forEach(b=>b.setAttribute('aria-expanded','true'));}));
  menu.querySelector('[data-close-trip-menu]').addEventListener('click',closeMenu);
  menu.addEventListener('click',event=>{if(event.target===menu){const b=menu.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)closeMenu();}if(event.target.closest('a'))closeMenu();});
  menu.addEventListener('close',()=>{document.body.classList.remove('trip-menu-open');document.querySelectorAll('[data-trip-menu]').forEach(b=>b.setAttribute('aria-expanded','false'));opener?.focus({preventScroll:true});});
  if(onWallet){
    document.querySelectorAll('[data-quick-section="documents"]').forEach(a=>a.setAttribute('aria-current','page'));
    const brand=document.querySelector('header .brand');if(brand)brand.href=root.href;
    const back=document.querySelector('header .top > a:not(.brand)');
    if(back){back.href=section(returnTo);back.textContent=returnTo.startsWith('day-')?`← ${returnTo.slice(4)} Dec`:'← Trip plan';}
  }else{
    document.addEventListener('click',event=>{
      const a=event.target.closest('a[href]');if(!a)return;
      const destination=new URL(a.href,location.href);
      if(destination.origin!==wallet.origin||destination.pathname!==wallet.pathname)return;
      destination.searchParams.set('v',release);
      const from=location.hash.slice(1);
      if(allowed.test(from)&&!destination.searchParams.has('from'))destination.searchParams.set('from',from);
      a.href=destination.href;
    });
  }
})();
