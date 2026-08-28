/* ================= галактика: база систем =================
   Мир описывается данными и целиком строится один раз, при запуске. В базе
   лежит вся карта: координаты систем, их светила, состав планет и объекты,
   которые там есть. Дальше движок ничего не выдумывает — он материализует
   запись: считает по ней текстуры, шум и небо.

   Разделение намеренное. Данные системы весят десятки байт и считаются за
   микросекунды, поэтому их можно сделать сразу для всей карты. Текстуры
   планеты и шар светила стоят сотню миллисекунд — они рождаются только для
   той системы, куда мы вышли.

   Именованные системы — константы (`NAMED`), процедурные — правила. Обе
   попадают в одну базу и дальше неотличимы для движка.

   Координаты пока плоские: x и y в световых годах от центра карты. Высота
   появится, когда понадобится — записи это переживут. */

const NAMED=[
  { id:"SOL", seed:"SOL", x:0, y:0, name:"n.Солнце", solar:true, descKey:"desc.sol" }
];

let GALAXY={systems:[], byId:{}, at:0};

/* состав системы: то, что можно перечислить, и ничего тяжёлого */
function makeSystemRecord(seed,x,y,extra){
  const r=mulberry32(hashStr("SYS:"+seed));
  const star=starTypeFor(seed);
  const rec=Object.assign({
    id:seed, seed:seed, x:x, y:y,
    star:star, starClass:star?star.k:null,
    visited:false, planets:[], objects:[]
  }, extra||{});

  if(rec.solar){                                   // наша система — по таблице
    rec.planets=SOLAR.planets.map((p,i)=>Object.assign({i:i},p));
  }else if(star){
    const n=1+Math.floor(r()*PLANET.maxCount);
    let au=PLANET.orbit0*(.7+r()*.9);
    for(let i=0;i<n;i++){
      const t=PLANET.types[Math.floor(r()*PLANET.types.length)];
      const gas=t.k==="gas"||t.k==="ice-g";
      rec.planets.push({
        i:i, type:t.k, name:null,
        radius:Math.round(gas ? 24000+r()*46000 : 2400+r()*7600),
        au:au, phase:r()*6.2832,
        rings:gas&&r()<PLANET.ringChance,
        moons:Math.floor(r()*(gas?9:3)),
        day:Math.round(6+r()*70)
      });
      au*=PLANET.orbitStep*(.82+r()*.5);
    }
    rec.planets[Math.floor(r()*rec.planets.length)].arrival=true;
  }
  return rec;
}

/* объекты раскладываются по системам здесь же: правила спрашиваются один раз
   на весь мир, а не при каждом заходе в систему */
function placeObjects(rec){
  const ctx={
    seed:rec.seed,
    star:rec.star,
    planetCount:rec.planets.length,
    planetNames:rec.planets.map(p=>p.name).filter(Boolean),
    planetTypes:rec.planets.map(p=>p.type)
  };
  rec.objects=OBJECTS.filter(o=>objectFits(o,ctx)).map(o=>o.id);
}

function buildGalaxy(rootSeed){
  const r=mulberry32(hashStr("GALAXY:"+rootSeed));
  GALAXY={systems:[], byId:{}, at:0};

  NAMED.forEach(n=>GALAXY.systems.push(makeSystemRecord(n.seed,n.x,n.y,n)));

  const half=JUMP.sectorLy/2;
  while(GALAXY.systems.length<SECTOR_SIZE){
    let s="";
    for(let j=0;j<6;j++) s+="0123456789ABCDEF"[Math.floor(r()*16)];
    if(r()<SUN_SPREAD.chance) s+="S";
    if(GALAXY.byId[s]) continue;
    const a=r()*6.2832, d=(.2+r()*.8)*half;
    GALAXY.systems.push(makeSystemRecord(s, Math.cos(a)*d, Math.sin(a)*d));
    GALAXY.byId[s]=1;
  }
  GALAXY.systems.forEach(placeObjects);
  GALAXY.byId={};
  GALAXY.systems.forEach((s,i)=>{ GALAXY.byId[s.id]=i; });
  GALAXY.at=0;
  GALAXY.systems[0].visited=true;
}

function systemAt(){ return GALAXY.systems[GALAXY.at]; }
function systemById(id){ const i=GALAXY.byId[id]; return i===undefined?null:GALAXY.systems[i]; }

/* расстояние между записями в световых годах — карта пока плоская */
function systemDist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }

/* цели прыжка: ближние первыми, дальше дальности привода — видно, но не достать */
function jumpTargets(){
  const here=systemAt(), out=[];
  GALAXY.systems.forEach((s,i)=>{
    if(i===GALAXY.at) return;
    const d=systemDist(here,s);
    out.push({i:i, seed:s.seed, d:d, reach:d<=JUMP.rangeLy,
              visited:s.visited, planets:s.visited?s.planets.length:null,
              star:s.star, rec:s});
  });
  out.sort((a,b)=>a.d-b.d);
  return out;
}
