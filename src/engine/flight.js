/* ================= частицы ближней пыли ================= */
const near=[];

function seedNear(p,fresh){
  p.x=(Math.random()-.5)*SPREAD*2;
  p.y=(Math.random()-.5)*SPREAD*2;
  p.z=fresh?Math.pow(Math.random(),.72)*DEPTH+2:DEPTH;
  p.b=.30+Math.random()*.70;
  const r=Math.random(); p.w=r<.13?1:(r<.23?2:0);
  return p;
}
for(let i=0;i<NEAR;i++) near.push(seedNear({},true));

/* ================= состояние полёта ================= */
const K={l:0,r:0,u:0,d:0};
const S={yaw:0,pitch:0,vyaw:0,vpitch:0,roll:0,vroll:0,
         throttle:.35,speed:0,boost:0,boostKey:false,t:0};

/* прыжок: 1 — раскрутка привода, 2 — тоннель, 3 — выход в новую систему.
   Длительности фаз — в config.js */
const J={ph:0, t:0, flash:0, lastType:""};

/* цель выбирается в меню; сюда приходит уже принятое решение */
let jumpTarget=null;

function startJump(t){
  if(J.ph) return;
  jumpTarget=t;
  J.ph=1; J.t=0;
  wake();
}
function arrive(){
  const t=jumpTarget;
  if(t&&t.home&&SECTOR.filter(s=>s.seed==="SOL").length===0){
    buildSector("SOL");                  // вернулись домой из чужого сектора
    buildWorld("SOL");
  }else{
    let i;
    if(t&&t.home) i=SECTOR.map(s=>s.seed).indexOf("SOL");
    else if(t&&t.i>=0) i=t.i;
    else i=0;
    sectorAt=i;
    buildWorld(SECTOR[i].seed);
  }
  noteSystem();                          // теперь мы знаем, сколько тут планет
  jumpTarget=null;
  S.yaw=0; S.pitch=0; S.vyaw=0; S.vpitch=0; S.roll=0; S.vroll=0;
}
