/* ================= состояние корабля =================
   Двадцать показателей. Половина считается из того, что происходит на самом
   деле: реактор идёт за тягой, обшивка греется у светила, радиация растёт с
   его светимостью и падает с расстоянием, задержка связи — это буквально
   расстояние до Солнца, делённое на скорость света. Остальное — расходуемое:
   топливо, ресурс, заряд привода.

   Показатели, которые ни на что не отвечают, здесь не нужны: приборная
   доска, которая врёт, хуже пустой стены. */

/* имя SHIP занято положением корабля в системе — здесь состояние */
const STATUS={
  fuel:100, hull:100, shield:100, wear:0,
  coreT:2400, driveT:310, skinT:250,
  o2:99.4, co2:410, drift:0, t:0
};

function shipUpdate(dt,load,boost,jumpK){
  STATUS.t+=dt;
  const heat=load*(1+boost*2.2)+jumpK*2.4;

  // топливо: на дрейфе почти не тратится, форсаж и прыжок жгут всерьёз
  STATUS.fuel=Math.max(0, STATUS.fuel - dt*(load*.030 + boost*.22 + jumpK*.9));
  if(STATUS.fuel<0.5) STATUS.fuel=100;                       // дозаправка у планеты

  // температуры: активная зона, двигатель, обшивка
  const coreTarget=2200+heat*1500;
  STATUS.coreT+=(coreTarget-STATUS.coreT)*Math.min(1,dt*.5);
  const driveTarget=290+heat*520;
  STATUS.driveT+=(driveTarget-STATUS.driveT)*Math.min(1,dt*.35);

  // обшивка греется от светила: закон обратных квадратов, как ему и положено
  let star=0;
  if(sun){
    const dAU=Math.max(.02,Math.hypot(sun.x,sun.y,sun.z));
    star=sun.t.lum/(dAU*dAU);
  }
  const skinTarget=60+Math.min(600,star*180)+heat*90;
  STATUS.skinT+=(skinTarget-STATUS.skinT)*Math.min(1,dt*.25);
  STATUS.star=star;

  // ресурс и снос счисления копятся, воздух дышится
  STATUS.wear=Math.min(100, STATUS.wear + dt*(load*.004+boost*.03+jumpK*.05));
  STATUS.drift+=dt*(12+load*40);
  STATUS.o2=98.6+Math.sin(STATUS.t*.11)*.7;
  STATUS.co2=402+Math.sin(STATUS.t*.07)*14+load*6;
  STATUS.shield=Math.min(100, STATUS.shield + dt*(2.2-load*1.2));
}

function fmt1(v){ return (Math.round(v*10)/10).toLocaleString("ru-RU"); }

/* расстояние до дома в световых годах — из него же выводится задержка связи */
function lyHome(){
  const home=SECTOR.filter(s=>s.seed==="SOL")[0];
  if(!home) return null;
  return sectorDist(SECTOR[sectorAt],home);
}

/* двадцать строк для нижней панели: подпись, значение, доля для полоски */
function shipReadout(){
  const load=Math.min(1,S.speed/MAXV), boost=S.boost;
  const jumpCharge=J.ph===1 ? J.t/J_CHARGE : J.ph>1 ? 1 : 0;
  const home=lyHome();
  const dStar=sun?Math.hypot(sun.x,sun.y,sun.z):null;
  const rad=8+(STATUS.star||0)*260;
  const at=planets&&planets.at;
  return [
    ["ТЯГА",        Math.round(S.throttle*100)+" %",    S.throttle],
    ["СКОРОСТЬ",    Math.round(S.speed*38).toLocaleString("ru-RU")+" м/с", load],
    ["РЕАКТОР",     Math.round(28+load*70+boost*2)+" %", .28+load*.7],
    ["ТОПЛИВО",     fmt1(STATUS.fuel)+" %",               STATUS.fuel/100],
    ["АКТИВНАЯ ЗОНА", Math.round(STATUS.coreT)+" K",      Math.min(1,STATUS.coreT/4200)],
    ["ДВИГАТЕЛЬ",   Math.round(STATUS.driveT)+" K",       Math.min(1,STATUS.driveT/900)],
    ["ОБШИВКА",     Math.round(STATUS.skinT)+" K",        Math.min(1,STATUS.skinT/700)],
    ["КОРПУС",      Math.round(STATUS.hull)+" %",         STATUS.hull/100],
    ["ЩИТЫ",        Math.round(STATUS.shield)+" %",       STATUS.shield/100],
    ["ПРИВОД",      Math.round(jumpCharge*100)+" %",    jumpCharge],
    ["ДАЛЬНОСТЬ",   JUMP.rangeLy.toFixed(1)+" св. г.",  1],
    ["РЕСУРС",      fmt1(100-STATUS.wear)+" %",           (100-STATUS.wear)/100],
    ["КИСЛОРОД",    fmt1(STATUS.o2)+" %",                 STATUS.o2/100],
    ["УГЛЕКИСЛОТА", Math.round(STATUS.co2)+" ppm",        Math.min(1,STATUS.co2/1200)],
    ["ТЯЖЕСТЬ",     (0.94+boost*.22).toFixed(2)+" g",   (0.94+boost*.22)/2],
    ["РАДИАЦИЯ",    Math.round(rad)+" мкЗв/ч",          Math.min(1,rad/900)],
    ["ДО СВЕТИЛА",  dStar===null?"—":dStar.toFixed(2)+" а. е.", dStar===null?0:Math.min(1,dStar/30)],
    ["ДО ЦЕЛИ",     at?(Math.hypot(at.x,at.y,at.z)*SCALE.kmPerAU/1000).toFixed(0)+" тыс. км":"—",
                    at?Math.min(1,Math.hypot(at.x,at.y,at.z)*4000):0],
    ["СВЯЗЬ · ДОМ", home===null?"вне сектора":fmt1(home)+" лет",
                    home===null?0:Math.min(1,home/JUMP.sectorLy)],
    ["СНОС НАВИГ.", Math.round(STATUS.drift)+" км",       Math.min(1,STATUS.drift/9000)]
  ];
}
