/* ================= небо ================= */

/* направление на сфере: доля inPlane тяготеет к плоскости галактики,
   остальное — равномерное гало */
function galDir(inPlane,thick){
  const th=rnd()*6.2832;
  let lat;
  if(rnd()<inPlane){
    let g=0; for(let i=0;i<3;i++) g+=rnd();  // сумма трёх ≈ нормальное распределение
    lat=(g/1.5-1)*thick;
  }else{
    lat=Math.asin(rnd()*2-1);
  }
  const cl=Math.cos(lat), sl=Math.sin(lat);
  const x=cl*Math.cos(th), y=sl, z=cl*Math.sin(th);
  const c=Math.cos(GAL_TILT), s=Math.sin(GAL_TILT);
  return {x:x*c-y*s, y:x*s+y*c, z:z};
}

/* спрайты рисуются один раз, дальше только drawImage */
function starSprite(col){
  const S=24, c=document.createElement("canvas"); c.width=c.height=S;
  const g=c.getContext("2d"), r=S/2;
  // ядро мелкое и резкое, ореол широкий и слабый — так звезда читается точкой
  // со свечением, а не шариком с ровным краем
  const gr=g.createRadialGradient(r,r,0,r,r,r);
  gr.addColorStop(0,   "rgba("+col+",1)");
  gr.addColorStop(.09, "rgba("+col+",.95)");
  gr.addColorStop(.20, "rgba("+col+",.38)");
  gr.addColorStop(.42, "rgba("+col+",.10)");
  gr.addColorStop(.72, "rgba("+col+",.025)");
  gr.addColorStop(1,   "rgba("+col+",0)");
  g.fillStyle=gr; g.fillRect(0,0,S,S);
  return c;
}
/* спектральные классы: у слабых звёзд глаз цвета не различает, поэтому
   оттенок достаётся только ярким */
const STAR_SPR=STAR_COL.map(starSprite);

function hsl2rgb(h,s,l){
  h=(h%360+360)%360; s/=100; l/=100;
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  let r,g,b;
  if(h<60){r=c;g=x;b=0} else if(h<120){r=x;g=c;b=0} else if(h<180){r=0;g=c;b=x}
  else if(h<240){r=0;g=x;b=c} else if(h<300){r=x;g=0;b=c} else {r=c;g=0;b=x}
  return Math.round((r+m)*255)+","+Math.round((g+m)*255)+","+Math.round((b+m)*255);
}

/* облако газа: одиннадцать вытянутых пятен под круглой маской. Без маски
   на небе читаются прямоугольные обрезы спрайта вместо газа */
function cloudSprite(col,peak){
  const S=256, c=document.createElement("canvas"); c.width=c.height=S;
  const g=c.getContext("2d");
  for(let i=0;i<11;i++){
    const ox=S/2+(rnd()-.5)*S*.34, oy=S/2+(rnd()-.5)*S*.34;
    const rr=S*(.11+rnd()*.20);
    const sq=.22+rnd()*.55;
    g.save();
    g.translate(ox,oy); g.rotate(rnd()*6.2832); g.scale(1,sq);
    const gr=g.createRadialGradient(0,0,0,0,0,rr);
    gr.addColorStop(0,"rgba("+col+","+peak+")");
    gr.addColorStop(.5,"rgba("+col+","+(peak*.34).toFixed(3)+")");
    gr.addColorStop(1,"rgba("+col+",0)");
    g.fillStyle=gr; g.fillRect(-rr,-rr/sq,rr*2,rr*2/sq);
    g.restore();
  }
  g.globalCompositeOperation="destination-in";
  const m=g.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  m.addColorStop(0,"rgba(0,0,0,1)"); m.addColorStop(.5,"rgba(0,0,0,.95)");
  m.addColorStop(.8,"rgba(0,0,0,.45)"); m.addColorStop(1,"rgba(0,0,0,0)");
  g.fillStyle=m; g.fillRect(0,0,S,S);
  return c;
}

/* подпись системы в верхней строке — зависит от языка, потому вынесена */
function sysLabel(){
  if(typeof sysEl==="undefined"||!sysEl) return;
  const name = sun&&sun.solar ? T("sys.solar")
    : T("sys.system")+" "+String(SEED).replace(/S$/,"");
  sysEl.textContent = name+" · "+(sun ? T("star.fmt").replace("{k}",sun.t.k) : T("sys.noStar"));
}

/* ================= мир ================= */
let SEED="", GAS_SPR=[], DUST_SPR=[];
let gas=[], dust=[], grit=[], far=[], sun=null, planets=null;

function buildWorld(seed){
  SEED=seed;
  const rec=systemById(seed);          // запись из базы: состав уже посчитан
  rnd=mulberry32(hashStr(seed));

  /* палитра туманности выводится из seed: базовый тон плюс соседние,
     один контрастный на другой стороне круга */
  const zone=HUE_ZONES[Math.floor(rnd()*HUE_ZONES.length)];
  const baseHue=zone[0]+rnd()*(zone[1]-zone[0]), spread=34+rnd()*54;
  GAS_SPR=[];
  for(let i=0;i<5;i++){
    const h = i===4 ? baseHue+152+rnd()*56 : baseHue+(rnd()-.5)*spread;
    GAS_SPR.push(cloudSprite(hsl2rgb(h, 46+rnd()*32, 31+rnd()*15), .19));
  }
  DUST_SPR=[0,1,2,3].map(()=>cloudSprite("0,1,6",.50));

  gas=[]; dust=[];
  const gasN=SKY.gasMin+Math.floor(rnd()*SKY.gasVar);
  for(let i=0;i<gasN;i++){
    const d=galDir(SKY.inPlaneGas,SKY.thickGas), r=SKY.gasR;
    gas.push({x:d.x*r,y:d.y*r,z:d.z*r,
      s:260+rnd()*580, e:.28+rnd()*.52,
      rot:rnd()*6.2832, a:.17+rnd()*.26,
      sp:GAS_SPR[Math.floor(rnd()*GAS_SPR.length)]});
  }
  for(let i=0;i<SKY.dustN;i++){
    const d=galDir(SKY.inPlaneDust,SKY.thickDust), r=SKY.dustR;
    dust.push({x:d.x*r,y:d.y*r,z:d.z*r,
      s:170+rnd()*360, e:.07+rnd()*.15,
      rot:(rnd()-.5)*.5, a:.26+rnd()*.34,
      sp:DUST_SPR[Math.floor(rnd()*DUST_SPR.length)]});
  }

  /* слабые звёзды: разложены по полосам яркости, каждая полоса рисуется
     одним путём — двенадцать тысяч смен состояния canvas дороже отрисовки */
  grit=[];
  for(let g=0;g<GRIT_BANDS;g++) grit.push([]);
  for(let i=0;i<GRIT;i++){
    const d=galDir(SKY.inPlaneGrit,SKY.thickGrit), r=SKY.gritR;
    const b=.16+Math.pow(rnd(),1.6)*.62;
    grit[Math.min(GRIT_BANDS-1,Math.floor((b-.16)/.62*GRIT_BANDS))].push({x:d.x*r,y:d.y*r,z:d.z*r});
  }

  far=[];
  for(let i=0;i<FAR;i++){
    const d=galDir(SKY.inPlaneStar,SKY.thickStar), r=SKY.starR+rnd()*SKY.starVar;
    const mag=Math.pow(rnd(),2.4);
    // цвет достаётся только заметным звёздам, слабые остаются белёсыми
    let cls;
    if(mag<.30) cls=2;
    else { const q=rnd(); cls = q<.09?0 : q<.42?1 : q<.72?2 : q<.91?3 : 4; }
    far.push({
      x:d.x*r, y:d.y*r, z:d.z*r,
      b:.05+mag*.95,
      t:rnd()*6.2832, ts:.4+rnd()*1.7,
      sp:STAR_SPR[cls],
      big:mag>.988
    });
  }

  sun=null; planets=null;
  const solar=!!(rec&&rec.solar);
  if(rec&&rec.star){
    const t=rec.star;                   // класс уже определён при постройке базы
    // где звезда окажется в кадре, больше не выбирается наугад: она стоит в
    // начале системных координат, а мы — у планеты прилёта
    const fbm=makeNoise3(), P=SUN_SPREAD;
    sun={t:t, solar:solar, name:solar?SOLAR.star.name:null,
         px:0, py:0, pz:0, x:0, y:0, z:1, fbm:fbm,
         dist:P.distMin+rnd()*(P.distMax-P.distMin),        // как далеко стоит
         aspect:P.aspectMin+rnd()*(P.aspectMax-P.aspectMin), // вытянутость ореола
         haloRot:(rnd()-.5)*3.1416,                          // и его наклон
         hue:(rnd()*2-1)*P.hueShift};                        // сдвиг оттенка внутри класса
    planets=buildPlanets(sun,rec);        // тела строятся по записи, а не наугад
    placeArrival(sun,planets);            // ставит корабль и раздаёт векторы
    sun.tex=starTexture(sun); sun.halo=starHalo(sun);
  }
  sysLabel();
  if(typeof syncSysInfo==="function") syncSysInfo();       // сводка по системе и радар
  try{ history.replaceState(null,"","#"+seed); }catch(e){}
}
