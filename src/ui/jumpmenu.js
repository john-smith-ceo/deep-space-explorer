/* ================= выбор цели для прыжка (клавиша J) =================
   Привод тянет на JUMP.rangeLy световых лет — дальше системы видно, но не
   достать. Класс светила известен заранее, его видно и издали; сколько там
   планет — нет, пока не побывали: иначе прыжок превращается в выбор из
   каталога, а не в разведку.

   Дом доступен всегда, с любого расстояния: иначе рано или поздно окажемся
   в двадцати годах от Солнца без обратного билета. */

const jumpEl=document.getElementById("jumpmenu");
let jumpOpen=false, jumpList=[], jumpSel=0;

function jumpRow(t,sel){
  const name = t.home ? "SOL" : t.seed.replace(/S$/,"");
  const star = t.star ? t.star.k+"-type" : "без светила";
  const pl = t.home ? "8 планет"
    : (t.visited ? (t.planets===0 ? "планет нет" : t.planets+" планет") : "?");
  const dist = t.d===null ? "—" : t.d.toFixed(1)+" св. г.";
  const note = t.home ? "дом · маяк"
    : (!t.reach ? "вне дальности" : t.visited ? "пройдена" : "не посещена");
  return '<div class="jrow'+(sel?" sel":"")+(t.reach?"":" far")+'">'+
    '<b>'+name+'</b><span>'+star+'</span><span>'+pl+'</span>'+
    '<i>'+dist+'</i><em>'+note+'</em></div>';
}

function jumpMapSVG(){
  const here=SECTOR[sectorAt], R=54, cx=60, cy=60, h=JUMP.sectorLy/2;
  // круг дальности в тех же единицах, что и координаты карты
  const rr=R*(JUMP.rangeLy/h)/2;
  let s='<svg viewBox="0 0 120 120" class="jmap">';
  s+='<circle cx="60" cy="60" r="54" class="sec-ring"/>';
  s+='<circle cx="60" cy="60" r="'+rr.toFixed(1)+'" class="jrange"/>';
  for(let i=0;i<SECTOR.length;i++){
    const it=SECTOR[i];
    const x=cx+(it.x-here.x)*R/2, y=cy+(it.z-here.z)*R/2;
    const cls = i===sectorAt ? "sec-here"
      : (jumpList[jumpSel] && jumpList[jumpSel].i===i) ? "sec-target"
      : it.visited ? "sec-seen" : "sec-new";
    const r = it.seed.slice(-1)==="S"||it.seed==="SOL" ? 3.1 : 1.7;
    s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" class="'+cls+'"/>';
  }
  s+='</svg>';
  return s;
}

function buildJumpMenu(){
  if(!jumpEl) return;
  const targets=jumpTargets();
  jumpList=[];
  // дом идёт первой строкой, если мы не в нём
  if(SECTOR[sectorAt].seed!=="SOL"){
    const home=SECTOR.filter(s=>s.seed==="SOL")[0];
    jumpList.push({home:true, seed:"SOL", reach:true,
      d:home?sectorDist(SECTOR[sectorAt],home):null,
      star:starTypeFor("SOL"), visited:true, i:-1});
  }
  jumpList=jumpList.concat(targets);
  if(jumpSel>=jumpList.length) jumpSel=0;

  jumpEl.innerHTML=
    '<div class="jtop"><h2>FRAME SHIFT DRIVE</h2>'+
      '<div class="jsub">выбор цели · дальность '+JUMP.rangeLy.toFixed(1)+' св. лет</div>'+
      '<div class="jhint">↑ ↓ выбор · Enter прыжок · Esc отмена</div></div>'+
    '<div class="jbody">'+
      '<div class="jlist">'+jumpList.map((t,n)=>jumpRow(t,n===jumpSel)).join("")+'</div>'+
      '<div class="jmapbox">'+jumpMapSVG()+
        '<div class="si-cap">сектор '+JUMP.sectorLy+' св. лет</div></div>'+
    '</div>';
}

function toggleJumpMenu(){
  if(!jumpEl||J.ph) return;               // во время прыжка меню не открыть
  jumpOpen=!jumpOpen;
  if(jumpOpen){ jumpSel=0; buildJumpMenu(); }
  jumpEl.classList.toggle("on",jumpOpen);
  wake();
}

function jumpMove(step){
  if(!jumpOpen||!jumpList.length) return;
  jumpSel=(jumpSel+step+jumpList.length)%jumpList.length;
  buildJumpMenu();
}

function jumpConfirm(){
  if(!jumpOpen||!jumpList.length) return;
  const t=jumpList[jumpSel];
  if(!t.reach) return;                     // вне дальности — привод не потянет
  jumpOpen=false; jumpEl.classList.remove("on");
  startJump(t);
}
