/* ================= сектор =================
   Двадцать систем в кубе со стороной JUMP.sectorLy световых лет. Их сиды
   выводятся из сида первой системы, поэтому по ссылке восстанавливается не
   только небо над головой, но и весь сектор целиком. Звезда есть или нет —
   бросок монеты на каждой системе, а не очередь через одну.

   Класс светила считается отдельным потоком случайных чисел, привязанным к
   сиду: его надо знать в меню прыжка, не строя систему целиком. */

let SECTOR=[], sectorAt=0;

function starTypeFor(seed){
  if(seed==="SOL") return SUN_TYPES.filter(x=>x.k===SOLAR.star.k)[0];
  if(seed.charAt(seed.length-1)!=="S") return null;
  const r=mulberry32(hashStr("STAR:"+seed));
  return SUN_TYPES[Math.floor(r()*SUN_TYPES.length)];
}

function buildSector(rootSeed){
  const r=mulberry32(hashStr("SECTOR:"+rootSeed));
  SECTOR=[];
  for(let i=0;i<SECTOR_SIZE;i++){
    let s="";
    for(let j=0;j<6;j++) s+="0123456789ABCDEF"[Math.floor(r()*16)];
    if(r()<SUN_SPREAD.chance) s+="S";
    /* по кольцу с разбросом и небольшим выносом из плоскости: в куче
       посередине системы неразличимы, а плоский сектор — не сектор */
    const a=(i/SECTOR_SIZE)*6.2832+(r()-.5)*.5, d=.18+r()*.82;
    SECTOR.push({seed:s, x:Math.cos(a)*d, y:(r()-.5)*.5, z:Math.sin(a)*d,
                 visited:false, planets:null});
  }
  SECTOR[0].seed=rootSeed;        // первая система сектора — та, где мы стоим
  SECTOR[0].visited=true;
  sectorAt=0;
}

/* расстояние между системами сектора в световых годах */
function sectorDist(a,b){
  const h=JUMP.sectorLy/2;
  return Math.hypot((a.x-b.x)*h, (a.y-b.y)*h, (a.z-b.z)*h);
}

/* что достижимо одним прыжком: список целей, ближние первыми */
function jumpTargets(){
  const here=SECTOR[sectorAt], out=[];
  for(let i=0;i<SECTOR.length;i++){
    if(i===sectorAt) continue;
    const d=sectorDist(here,SECTOR[i]);
    out.push({i:i, seed:SECTOR[i].seed, d:d, reach:d<=JUMP.rangeLy,
              visited:SECTOR[i].visited, planets:SECTOR[i].planets,
              star:starTypeFor(SECTOR[i].seed)});
  }
  out.sort((a,b)=>a.d-b.d);
  return out;
}

/* запомнить, что увидели: число планет в системе становится известным
   только после того, как мы в ней побывали */
function noteSystem(){
  const it=SECTOR[sectorAt];
  if(!it) return;
  it.visited=true;
  it.planets=planets ? planets.list.length : 0;
}
