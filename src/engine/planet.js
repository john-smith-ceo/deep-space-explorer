/* ================= планеты =================
   В системе их до девяти, но в небе рисуется ровно одна — та, к которой мы
   вышли из прыжка. Остальные существуют как данные: они нужны радару и
   сводке по клавише I, а рисовать их незачем, с такого расстояния это
   были бы точки, неотличимые от звёзд.

   Диск планеты, в отличие от звезды, освещён сбоку: яркость точки — это
   косинус угла между нормалью и направлением на светило. Отсюда серп,
   терминатор и ощущение шара, который висит в пустоте, а не светится сам. */

const ROMAN=["I","II","III","IV","V","VI","VII","VIII","IX"];

/* ================= карты Земли =================
   Три равнопромежуточные картинки NASA, вшитые в файл: дневная поверхность,
   ночные огни и облачный покров. Пока они не декодированы, Земля рисуется
   как любая другая планета — процедурно; когда готовы, диск пересобирается. */
const EARTH={ready:false, day:null, night:null, clouds:null};

(function(){
  if(typeof EARTH_MAPS==="undefined") return;
  let left=0;
  const grab=(src,key)=>{
    if(!src) return;
    left++;
    const im=new Image();
    im.onload=function(){
      const c=document.createElement("canvas");
      c.width=im.naturalWidth; c.height=im.naturalHeight;
      const g=c.getContext("2d"); g.drawImage(im,0,0);
      EARTH[key]={d:g.getImageData(0,0,c.width,c.height).data, w:c.width, h:c.height};
      if(--left===0){
        EARTH.ready=true;
        if(planets&&planets.at&&planets.at.earth) restylePlanet();
      }
    };
    im.onerror=function(){ if(--left===0) EARTH.ready=!!(EARTH.day&&EARTH.night&&EARTH.clouds); };
    im.src=src;
  };
  grab(EARTH_MAPS.day,"day"); grab(EARTH_MAPS.night,"night"); grab(EARTH_MAPS.clouds,"clouds");
})();

/* билинейная выборка: у края диска карта сжимается в разы, и ближайший
   пиксель даёт рваную кромку материков */
function mapLerp(m,u,v,out){
  const fx=u*m.w-.5, fy=v*m.h-.5;
  let x0=Math.floor(fx), y0=Math.floor(fy);
  const tx=fx-x0, ty=fy-y0;
  const x1=((x0+1)%m.w+m.w)%m.w, y1=Math.min(m.h-1,Math.max(0,y0+1));
  x0=((x0%m.w)+m.w)%m.w; y0=Math.min(m.h-1,Math.max(0,y0));
  const a=(y0*m.w+x0)*4, b=(y0*m.w+x1)*4, c=(y1*m.w+x0)*4, e=(y1*m.w+x1)*4;
  const w00=(1-tx)*(1-ty), w10=tx*(1-ty), w01=(1-tx)*ty, w11=tx*ty;
  out[0]=m.d[a]*w00+m.d[b]*w10+m.d[c]*w01+m.d[e]*w11;
  out[1]=m.d[a+1]*w00+m.d[b+1]*w10+m.d[c+1]*w01+m.d[e+1]*w11;
  out[2]=m.d[a+2]*w00+m.d[b+2]*w10+m.d[c+2]*w01+m.d[e+2]*w11;
  return out;
}

/* Диск Земли: дневная сторона берётся из карты, ночная — из огней, поверх
   ложатся облака. Терминатор мягкий: у настоящей планеты он размыт
   атмосферой, резкая граница выдаёт нарисованный шар. */
function earthTexture(p,size){
  const T=size||PLANET.texEarth, R=T/2, L=p.lightView||p.light, lon0=p.lon0||0;
  const c=document.createElement("canvas"); c.width=c.height=T;
  const g=c.getContext("2d"), img=g.createImageData(T,T), d=img.data;
  const D=EARTH.day, N=EARTH.night, C=EARTH.clouds;
  const cd=[0,0,0], cn=[0,0,0], cc=[0,0,0];
  for(let py=0;py<T;py++) for(let px=0;px<T;px++){
    const o=(py*T+px)*4;
    const x=(px+.5-R)/R, y=(py+.5-R)/R, d2=x*x+y*y;
    if(d2>=1){ d[o+3]=0; continue; }
    const z=Math.sqrt(1-d2);
    const lat=Math.asin(Math.max(-1,Math.min(1,-y)));        // север вверху
    let lon=Math.atan2(x,z)+lon0;
    let u=(lon/6.2832)%1; if(u<0) u+=1;
    const v=.5-lat/Math.PI;
    mapLerp(D,u,v,cd); mapLerp(N,u,v,cn); mapLerp(C,u,v,cc);
    const lam=x*L[0]+y*L[1]+z*L[2];
    const lit=Math.max(0,Math.min(1,(lam+.06)/.30));         // мягкий терминатор
    const sun=Math.pow(lit,.85);
    // суша и океан днём, огни городов ночью
    let r=cd[0]*sun, gg=cd[1]*sun, b=cd[2]*sun;
    const nf=(1-lit)*1.35;
    r+=cn[0]*nf; gg+=cn[1]*nf; b+=cn[2]*nf*1.1;
    // облака: белые, освещены тем же светом
    const cl=cc[0]/255*.92;
    if(cl>.02){
      const cs=250*sun+8;
      r=r*(1-cl)+cs*cl; gg=gg*(1-cl)+cs*cl; b=b*(1-cl)+(cs+4)*cl;
    }
    // атмосфера: голубой ободок, ярче там, где смотрим вдоль неё к свету
    const rim=Math.pow(1-z,3.0)*Math.pow(Math.max(0,lam+.25),.6)*1.9;
    r+=90*rim; gg+=140*rim; b+=225*rim;
    d[o]=Math.min(255,r); d[o+1]=Math.min(255,gg); d[o+2]=Math.min(255,b);
    d[o+3]=Math.min(255,255*Math.min(1,(1-d2)*R*.9));
  }
  g.putImageData(img,0,0);
  return c;
}

/* газовым гигантам полосы даёт функция широты, каменистым — трёхмерный шум */
function planetTexture(p,fbm,size){
  if(p.earth&&EARTH.ready) return earthTexture(p,size);
  const T=size||PLANET.tex, R=T/2, ty=p.t;
  const base=ty.base.split(",").map(Number), alt=ty.alt.split(",").map(Number);
  const atm=ty.atmCol.split(",").map(Number);
  const L=p.lightView||p.light;                       // направление на звезду
  const c=document.createElement("canvas"); c.width=c.height=T;
  const g=c.getContext("2d"), img=g.createImageData(T,T), d=img.data;
  for(let py=0;py<T;py++) for(let px=0;px<T;px++){
    const o=(py*T+px)*4;
    const x=(px+.5-R)/R, y=(py+.5-R)/R, d2=x*x+y*y;
    if(d2>=1){ d[o+3]=0; continue; }
    const z=Math.sqrt(1-d2);
    let n=fbm(x*p.noise+11, y*p.noise+11, z*p.noise+11);
    if(ty.band){                                      // полосы по широте
      const lat=Math.asin(Math.max(-1,Math.min(1,y)));
      n=n*.42+.58*(.5+.5*Math.sin(lat*p.bands+n*2.6));
    }
    const w=Math.max(0,Math.min(1,(n-.34)*2.1));      // смесь двух грунтов
    let r=base[0]+(alt[0]-base[0])*w,
        gg=base[1]+(alt[1]-base[1])*w,
        b=base[2]+(alt[2]-base[2])*w;
    // освещение: косинус к светилу плюс немного рассеянного света
    const lam=Math.max(0, x*L[0]+y*L[1]+z*L[2]);
    const lit=.035+.965*Math.pow(lam,.85);
    r*=lit; gg*=lit; b*=lit;
    // атмосферный ободок: светится там, где поверхность уходит от нас к свету
    if(ty.atm>0){
      const rim=Math.pow(1-z,2.4)*Math.pow(Math.max(0,lam),.45)*ty.atm*2.3;
      r+=atm[0]*rim; gg+=atm[1]*rim; b+=atm[2]*rim;
    }
    d[o]=Math.min(255,r); d[o+1]=Math.min(255,gg); d[o+2]=Math.min(255,b);
    d[o+3]=Math.min(255,255*Math.min(1,(1-d2)*R*.9));
  }
  g.putImageData(img,0,0);
  return c;
}

/* Кольца: два спрайта одного рисунка — светлый для самих колец и чёрный
   той же плотности. Второй нужен, чтобы положить тень колец на диск: осветлять
   и затемнять одной картинкой нельзя. */
const RING_FLAT=.28, RING_R=2.3;      // сжатие эллипса и внешний радиус в радиусах планеты

function ringTexture(p){
  const S=512, c=document.createElement("canvas"), d=document.createElement("canvas");
  c.width=c.height=d.width=d.height=S;
  const g=c.getContext("2d"), gd=d.getContext("2d"), R=S/2;
  const col=p.t.base.split(",").map(Number);
  for(let i=0;i<44;i++){
    const q=.52+ .46*(i/44);
    const gap=Math.abs(q-.72)<.03 ? .15 : 1;          // щель
    const a=(.05+.10*Math.abs(Math.sin(i*1.7)))*gap;
    g.strokeStyle="rgba("+Math.round(col[0]*1.15)+","+Math.round(col[1]*1.1)+","+
                  Math.round(col[2])+","+a+")";
    g.lineWidth=S*.0085;
    g.beginPath(); g.arc(R,R,R*q,0,6.2832); g.stroke();
    gd.strokeStyle="rgba(0,0,0,"+(a*3.4).toFixed(3)+")";
    gd.lineWidth=S*.0085;
    gd.beginPath(); gd.arc(R,R,R*q,0,6.2832); gd.stroke();
  }
  return {lit:c, dark:d};
}

/* состав выдумывается по типу, но не наобум: доли нормируются к сотне */
function planetComposition(t,r){
  // состав хранится ключами словаря: подписи переводятся, доли — нет
  const mix = t.k==="gas"   ? [["c.hydrogen",62,18],["c.helium",22,10],["c.methane",5,4],["c.ammonia",3,3]]
            : t.k==="ice-g" ? [["c.hydrogen",42,14],["c.helium",16,8],["c.methane",18,8],["c.ice",16,8]]
            : t.k==="ice"   ? [["c.waterIce",54,16],["c.silicates",22,10],["c.ammoniaIce",12,8],["c.iron",6,4]]
            : t.k==="ocean" ? [["c.water",58,14],["c.silicates",24,10],["c.iron",12,6],["c.carbon",4,3]]
            : t.k==="lava"  ? [["c.silicates",48,12],["c.iron",30,10],["c.sulphur",10,6],["c.basalt",8,5]]
            : t.k==="iron"  ? [["c.iron",62,12],["c.nickel",18,8],["c.silicates",14,8],["c.sulphur",4,3]]
            : t.k==="desert"? [["c.silicates",56,12],["c.iron",20,8],["c.oxides",16,8],["c.carbon",4,3]]
            :                 [["c.silicates",52,12],["c.iron",26,10],["c.magnesium",14,8],["c.carbon",5,4]];
  const raw=mix.map(m=>[m[0], Math.max(1, m[1]+(r()*2-1)*m[2])]);
  const sum=raw.reduce((a,m)=>a+m[1],0);
  return raw.map(m=>[m[0], m[1]/sum*100]);
}

/* Система живёт в одних координатах: начало — звезда, планеты стоят на
   орбитах, корабль — рядом с той, к которой мы вышли. Всё, что рисуется и
   в небе, и на радаре, выводится из одного вектора «объект минус корабль»,
   поэтому карта не может разойтись с тем, что видно в кадре. */
let SHIP=[0,0,0];                 // положение корабля в системных единицах

function sysVec(o){               // вектор от корабля к объекту
  o.x=o.px-SHIP[0]; o.y=o.py-SHIP[1]; o.z=o.pz-SHIP[2];
}

/* вся система: планеты по орбитам, одна из них — точка прилёта */
/* Собрать планету из честных величин: радиус в километрах, орбита в
   астрономических единицах. Всё остальное — период, температура, положение —
   выводится, а не выдумывается. */
function makePlanet(sn,i,o){
  const t=typeof o.type==="string"
    ? PLANET.types.filter(x=>x.k===o.type)[0]
    : o.type;
  const gas=t.k==="gas"||t.k==="ice-g";
  const au=o.au, ph=o.phase!==undefined?o.phase:rnd()*6.2832;
  // третий закон Кеплера: период растёт как большая полуось в степени 3/2
  const year=o.year!==undefined ? o.year
    : Math.round(365.25*Math.pow(au,1.5)/Math.sqrt(sn.t.mass));
  // равновесная температура: светимость на квадрат расстояния
  const temp=o.tempK!==undefined ? o.tempK
    : Math.round(278*Math.pow(sn.t.lum,.25)/Math.sqrt(au));
  const p={
    i:i, t:t, gas:gas,
    name:o.name||ROMAN[i],
    radius:Math.round(o.radius),
    rAU:o.radius/SCALE.kmPerAU,                     // радиус в единицах системы
    au:au, orbit:au, phase:ph,
    px:Math.cos(ph)*au, py:(rnd()-.5)*au*.05, pz:Math.sin(ph)*au,
    fbm:makeNoise3(),
    noise:1.6+rnd()*3.4,
    bands:6+Math.floor(rnd()*14),
    rings:o.rings!==undefined?o.rings:(gas&&rnd()<PLANET.ringChance),
    tilt:(rnd()-.5)*1.1,
    day:o.day!==undefined?o.day:Math.round(6+rnd()*70),
    year:year, tempK:temp,
    moons:o.moons!==undefined?o.moons:Math.floor(rnd()*(gas?9:3)),
    earth:!!o.earth,
    lon0:rnd()*6.2832                       // какой стороной планета к нам повёрнута
  };
  const ql=Math.hypot(p.px,p.py,p.pz)||1;
  p.light=[-p.px/ql, -p.py/ql, -p.pz/ql];            // свет идёт от звезды
  p.comp=planetComposition(t,rnd);
  return p;
}

function buildPlanets(sn){
  const list=[];
  if(sn.solar){                                      // наша система — по таблице
    for(let i=0;i<SOLAR.planets.length;i++) list.push(makePlanet(sn,i,SOLAR.planets[i]));
    const at=list.filter(p=>SOLAR.planets[p.i].arrival)[0]||list[2];
    at.arrival=true;
    return {list:list, at:at};
  }
  const n=1+Math.floor(rnd()*PLANET.maxCount);       // от одной до девяти
  let au=PLANET.orbit0*(.7+rnd()*.9);
  for(let i=0;i<n;i++){
    const t=PLANET.types[Math.floor(rnd()*PLANET.types.length)];
    const gas=t.k==="gas"||t.k==="ice-g";
    list.push(makePlanet(sn,i,{
      type:t,
      radius:gas ? 24000+rnd()*46000 : 2400+rnd()*7600,
      au:au
    }));
    au*=PLANET.orbitStep*(.82+rnd()*.5);             // ряд орбит, как у нас: каждая дальше
  }
  const at=list[Math.floor(rnd()*list.length)];
  at.arrival=true;
  return {list:list, at:at};
}

/* Поставить корабль. Планета прилёта оказывается почти по курсу, а нужное
   расстояние выводится из желаемого видимого размера: сколько долей экрана
   она должна занять, столько и отступаем. Всё остальное — звезда, прочие
   планеты — получает свои векторы из той же точки, без отдельных допущений. */
/* повернуть единичный вектор на угол a вокруг случайной оси, ему перпендикулярной */
function tiltVec(v,a){
  let ax=Math.abs(v[1])>.9 ? [1,0,0] : [0,1,0];
  const c1=[v[1]*ax[2]-v[2]*ax[1], v[2]*ax[0]-v[0]*ax[2], v[0]*ax[1]-v[1]*ax[0]];
  const l1=Math.hypot(c1[0],c1[1],c1[2])||1;
  const e1=[c1[0]/l1,c1[1]/l1,c1[2]/l1];
  const e2=[v[1]*e1[2]-v[2]*e1[1], v[2]*e1[0]-v[0]*e1[2], v[0]*e1[1]-v[1]*e1[0]];
  const th=rnd()*6.2832, cs=Math.cos(a), sn=Math.sin(a);
  const px=e1[0]*Math.cos(th)+e2[0]*Math.sin(th),
        py=e1[1]*Math.cos(th)+e2[1]*Math.sin(th),
        pz=e1[2]*Math.cos(th)+e2[2]*Math.sin(th);
  const r=[v[0]*cs+px*sn, v[1]*cs+py*sn, v[2]*cs+pz*sn];
  const l=Math.hypot(r[0],r[1],r[2])||1;
  return [r[0]/l, r[1]/l, r[2]/l];
}

function placeArrival(sn,pl){
  const p=pl.at;
  /* Выходим со стороны светила, но не в лоб: угол к лучу 35–60° оставляет
     три четверти диска освещёнными и серп ночи с терминатором. */
  const toStar=[-p.px, -p.py, -p.pz];
  const ls=Math.hypot(toStar[0],toStar[1],toStar[2])||1;
  const look=tiltVec([toStar[0]/ls,toStar[1]/ls,toStar[2]/ls], .61+rnd()*.44);
  const fwd=[-look[0], -look[1], -look[2]];          // куда смотрит нос корабля
  const want=PLANET.arriveMin+rnd()*(PLANET.arriveMax-PLANET.arriveMin);
  const Fn=(Math.max(W,H)||1600)*.78, mn=Math.min(W,H)||900;
  const d=Math.max(p.rAU*1.6, p.rAU*Fn/(want*mn));   // ближе поверхности не подходим
  SHIP=[p.px-fwd[0]*d, p.py-fwd[1]*d, p.pz-fwd[2]*d];

  /* Дальше вся система переводится в оси камеры. Иначе выходит так: корабль
     ставим по свету, а камера по-прежнему смотрит вдоль оси системы — и
     планета оказывается за краем кадра.

     Ось взгляда чуть отклонена от направления на планету: строго по центру
     кадр выходит мёртво симметричным. */
  const axis=tiltVec(fwd, .10+rnd()*.13);
  let upv=Math.abs(axis[1])>.92 ? [0,0,1] : [0,1,0];
  const rt=[upv[1]*axis[2]-upv[2]*axis[1], upv[2]*axis[0]-upv[0]*axis[2], upv[0]*axis[1]-upv[1]*axis[0]];
  const rl=Math.hypot(rt[0],rt[1],rt[2])||1;
  rt[0]/=rl; rt[1]/=rl; rt[2]/=rl;
  const up=[axis[1]*rt[2]-axis[2]*rt[1], axis[2]*rt[0]-axis[0]*rt[2], axis[0]*rt[1]-axis[1]*rt[0]];
  const toCam=(v)=>[ v[0]*rt[0]+v[1]*rt[1]+v[2]*rt[2],
                    -(v[0]*up[0]+v[1]*up[1]+v[2]*up[2]),   // экранный y смотрит вниз
                     v[0]*axis[0]+v[1]*axis[1]+v[2]*axis[2] ];
  /* У позиций ось z идёт вглубь кадра, у нормалей диска — наоборот, к
     зрителю. Свет живёт в системе нормалей, поэтому его z берётся с обратным
     знаком: иначе освещённой оказывается та сторона, которую мы не видим. */
  const toCamLight=(v)=>[ v[0]*rt[0]+v[1]*rt[1]+v[2]*rt[2],
                         -(v[0]*up[0]+v[1]*up[1]+v[2]*up[2]),
                        -(v[0]*axis[0]+v[1]*axis[1]+v[2]*axis[2]) ];

  for(let i=0;i<pl.list.length;i++){
    const q=pl.list[i];
    const v=toCam([q.px-SHIP[0], q.py-SHIP[1], q.pz-SHIP[2]]);
    q.x=v[0]; q.y=v[1]; q.z=v[2];
    q.lightView=toCamLight(q.light);                 // свет — в осях нормалей
  }
  sn.px=0; sn.py=0; sn.pz=0;
  const sv=toCam([-SHIP[0],-SHIP[1],-SHIP[2]]);
  sn.x=sv[0]; sn.y=sv[1]; sn.z=sv[2];                // звезда там, где ей положено

  p.tex=planetTexture(p,p.fbm);
  p.ring=p.rings?ringTexture(p):null;
  return p;
}

/* пересобрать диск планеты прилёта — нужно, когда карты Земли догрузились */
function restylePlanet(){
  if(!planets||!planets.at) return;
  planets.at.tex=planetTexture(planets.at,planets.at.fbm);
}

/* векторы на объекты крутятся вместе с небом — по ним рисуется и кадр, и радар */
function rotateSystem(){
  if(!planets) return;
  for(let i=0;i<planets.list.length;i++) rotate(planets.list[i]);
}

function drawPlanet(){
  if(!planets||!planets.at||!planets.at.tex) return;
  const p=planets.at;
  if(p.z<=p.rAU*.25) return;                  // планета за спиной или мы внутри неё
  const k=F/p.z, sx=cx+p.x*k, sy=cy+p.y*k;
  const rad=p.rAU*k*SCALE.planetVisual;       // видимый радиус — следствие расстояния
  if(sx<-rad*3||sx>W+rad*3||sy<-rad*3||sy>H+rad*3) return;

  /* Планета — тело, а не свечение: рисуется поверх фона, а не складывается с
     ним. Режим приходит сюда включённым от звёздных слоёв, и полагаться на то,
     что предыдущая функция за собой прибрала, нельзя: при светиле за краем
     кадра она выходит раньше — тогда сквозь ночную сторону видно звёзды. */
  const prevOp=ctx.globalCompositeOperation;
  ctx.globalCompositeOperation="source-over";
  if(!p.ring){
    ctx.drawImage(p.tex,sx-rad,sy-rad,rad*2,rad*2);
    ctx.globalCompositeOperation=prevOp;
    return;
  }

  /* Кольцо огибает планету, а не висит за ней: дальняя дуга рисуется до
     диска, ближняя — после. Между ними ложатся тени. */
  const Rr=rad*RING_R, L=p.light;
  const ring=(half)=>{                       // half: -1 дальняя, +1 ближняя, 0 всё
    ctx.save();
    ctx.translate(sx,sy); ctx.rotate(p.tilt); ctx.scale(1,RING_FLAT);
    if(half){
      ctx.beginPath();
      ctx.rect(-Rr, half>0?0:-Rr, Rr*2, Rr);
      ctx.clip();
    }
    ctx.globalCompositeOperation="lighter";
    ctx.drawImage(p.ring.lit,-Rr,-Rr,Rr*2,Rr*2);
    ctx.restore();
    ctx.globalCompositeOperation="source-over";
  };

  ring(-1);                                   // дальняя дуга

  /* тень планеты на кольце: полоса, уходящая от диска прочь от света */
  const lx=-L[0], ly=-L[1], ll=Math.hypot(lx,ly)||1;
  ctx.save();
  ctx.translate(sx,sy); ctx.rotate(p.tilt); ctx.scale(1,RING_FLAT);
  ctx.beginPath(); ctx.arc(0,0,Rr,0,6.2832); ctx.clip();     // только по кольцу
  ctx.rotate(-p.tilt);                                       // полоса живёт в экранных осях
  ctx.rotate(Math.atan2(ly/ll,lx/ll));
  ctx.fillStyle="rgba(0,0,4,.62)";
  ctx.fillRect(0,-rad*.92,Rr*2.4,rad*1.84);
  ctx.restore();

  ctx.drawImage(p.tex,sx-rad,sy-rad,rad*2,rad*2);            // сам диск

  /* тень колец на диске: тот же рисунок чёрным, сдвинутый по лучу света
     и прижатый к плоскости кольца */
  ctx.save();
  ctx.beginPath(); ctx.arc(sx,sy,rad*.995,0,6.2832); ctx.clip();
  ctx.translate(sx-L[0]*rad*.55, sy-L[1]*rad*.55);
  ctx.rotate(p.tilt); ctx.scale(1,RING_FLAT*.42);
  ctx.globalAlpha=.7;
  ctx.drawImage(p.ring.dark,-Rr,-Rr,Rr*2,Rr*2);
  ctx.globalAlpha=1;
  ctx.restore();

  ring(1);                                                   // ближняя дуга поверх диска
  ctx.globalCompositeOperation=prevOp;                       // вернуть режим слоям пыли
}
