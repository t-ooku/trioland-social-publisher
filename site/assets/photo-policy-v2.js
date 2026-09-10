(()=>{
  const SPRITE_COUNT=12;
  const SPRITE_CLASSES=[...Array(SPRITE_COUNT)].map((_,i)=>`sp${i}`);
  const KOMA_URL='https://cdn.job-medley.com/customers/image_files/converted_v1-1a78d67c-7987-4030-a68b-3f00f9f2d21b.jpg';
  const COORDS=[
    [0,0],[33.333,0],[66.667,0],[100,0],
    [0,50],[33.333,50],[66.667,50],[100,50],
    [0,100],[33.333,100],[66.667,100],[100,100]
  ];

  const clear=e=>{
    SPRITE_CLASSES.forEach(c=>e.classList.remove(c));
    e.classList.remove('ume-exterior','koma-exterior','photo-neutral');
    e.style.removeProperty('background-image');
    e.style.removeProperty('background-position');
    e.style.removeProperty('background-size');
    e.style.removeProperty('background-repeat');
  };

  const hide=e=>{
    const f=e.closest('figure');
    (f||e).classList.add('photo-hidden');
  };

  const applySprite=(e,n,url)=>{
    if(!e)return;
    clear(e);
    const [x,y]=COORDS[n];
    e.classList.add(`sp${n}`);
    e.style.backgroundImage=`url("${url}")`;
    e.style.backgroundPosition=`${x}% ${y}%`;
    e.style.backgroundSize='400% 300%';
    e.style.backgroundRepeat='no-repeat';
    e.style.backgroundColor='#f0ede7';
  };

  const applyUme=(e,url)=>{
    if(!e)return;
    applySprite(e,0,url);
    e.classList.add('ume-exterior');
    e.style.aspectRatio='900/530';
  };

  const applyKoma=e=>{
    if(!e)return;
    clear(e);
    e.classList.add('koma-exterior');
    e.style.backgroundImage=`url("${KOMA_URL}")`;
    e.style.backgroundPosition='center';
    e.style.backgroundSize='cover';
    e.style.backgroundRepeat='no-repeat';
    e.style.backgroundColor='#f0ede7';
  };

  const s=document.createElement('style');
  s.textContent=`
    .sprite-photo,.ume-exterior,.koma-exterior{aspect-ratio:4/3!important;height:auto!important;min-height:0!important;background-repeat:no-repeat!important;background-color:#f0ede7!important}
    .collage{grid-template-columns:1fr 1fr!important;grid-template-rows:auto!important;align-items:start!important}
    .collage .big{grid-column:1/-1!important;grid-row:auto!important;min-height:0!important}
    .collage .small{min-height:0!important}
    .gallery{grid-template-columns:repeat(3,minmax(0,1fr))!important}
    .gallery figure:first-child{grid-column:auto!important}
    .gallery .sprite-photo,.gallery figure:first-child .sprite-photo{height:auto!important}
    .branch .sprite-photo{height:auto!important}
    .hero-photo.sprite-photo{height:auto!important}
    .ume-exterior{aspect-ratio:900/530!important}
    .koma-exterior{aspect-ratio:4/3!important;background-size:cover!important;background-position:center!important}
    .photo-hidden{display:none!important}
    .photo-policy-umegaoka .gallery{grid-template-columns:1fr!important;max-width:760px}
    .photo-policy-umegaoka .split{grid-template-columns:1fr!important}
    .photo-policy-contact .hero{grid-template-columns:1fr!important}
    @media(max-width:900px){.gallery{grid-template-columns:1fr!important}}
    @media(max-width:600px){
      body{padding-bottom:108px!important}
      main{padding-bottom:24px!important}
      .mobilebar{padding:8px 8px calc(8px + env(safe-area-inset-bottom))!important}
      .mobilebar a{min-height:44px;display:flex!important;align-items:center;justify-content:center}
    }
  `;
  document.head.appendChild(s);

  const run=async()=>{
    const all=[...document.querySelectorAll('.sprite-photo')];
    if(!all.length)return;

    let spriteUrl='';
    try{
      const parts=await Promise.all([0,1,2,3,4].map(async n=>{
        const p=String(n).padStart(2,'0');
        const r=await fetch(`/assets/photos-b64-v5/${p}.txt?v=20260910-2135`,{cache:'no-store'});
        if(!r.ok)throw new Error(`photo chunk ${p}:${r.status}`);
        return (await r.text()).trim();
      }));
      const raw=atob(parts.join('').replace(/\s+/g,''));
      const bytes=new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      spriteUrl=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
    }catch(err){
      console.error('Trioland photo sprite load failed',err);
      return;
    }

    const path=location.pathname;

    if(path==='/'||path==='/index.html'){
      document.body.classList.add('photo-policy-home');
      // Top: large Umegaoka exterior + two unique child photos.
      applyUme(all[0],spriteUrl);
      applySprite(all[1],1,spriteUrl);
      applySprite(all[2],2,spriteUrl);
      // Daily life: three more unique child photos.
      applySprite(all[3],3,spriteUrl);
      applySprite(all[4],4,spriteUrl);
      applySprite(all[5],5,spriteUrl);
      // Nursery cards: correct exterior for each location.
      applyKoma(all[6]);
      applyUme(all[7],spriteUrl);
    }else if(path.endsWith('/komazawa.html')){
      document.body.classList.add('photo-policy-komazawa');
      // Komazawa exterior + five child photos not used on the home page.
      applyKoma(all[0]);
      applySprite(all[1],6,spriteUrl);
      applySprite(all[2],7,spriteUrl);
      applySprite(all[3],8,spriteUrl);
      applySprite(all[4],9,spriteUrl);
      applySprite(all[5],10,spriteUrl);
    }else if(path.endsWith('/umegaoka.html')){
      document.body.classList.add('photo-policy-umegaoka');
      // Keep the clean Umegaoka exterior; use the final unused child photo once.
      applyUme(all[0],spriteUrl);
      applySprite(all[1],11,spriteUrl);
      all.slice(2).forEach(hide);
    }else if(path.endsWith('/recruit.html')){
      document.body.classList.add('photo-policy-recruit');
      // Avoid reusing child photos: recruitment uses nursery exteriors instead.
      applyKoma(all[0]);
      applyUme(all[1],spriteUrl);
      all.slice(2).forEach(hide);
      document.querySelectorAll('section.soft').forEach(x=>{if(x.querySelector('.gallery'))x.classList.add('photo-hidden')});
    }else if(path.endsWith('/faq.html')){
      all.forEach(hide);
    }else if(path.endsWith('/column.html')){
      all.forEach(hide);
      document.querySelectorAll('.split').forEach(x=>x.style.gridTemplateColumns='1fr');
    }else if(path.endsWith('/contact.html')){
      document.body.classList.add('photo-policy-contact');
      const collage=document.querySelector('.collage');
      if(collage)collage.classList.add('photo-hidden');
      const branches=[...document.querySelectorAll('.branch .sprite-photo')];
      applyKoma(branches[0]);
      applyUme(branches[1],spriteUrl);
    }
  };

  document.readyState==='loading'
    ? document.addEventListener('DOMContentLoaded',run,{once:true})
    : run();
})();