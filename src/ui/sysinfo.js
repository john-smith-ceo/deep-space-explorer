/* ================= сводка по системе (клавиша I) =================
   Парад планет с настоящими дисками — те же процедурные текстуры, только
   мелкие, — точка прилёта, состав и карта сектора на двадцать систем. */

const infoEl=document.getElementById("sysinfo");
let infoOpen=false;

function fmtNum(n){ return Math.round(n).toLocaleString("ru-RU"); }

function sectorMapSVG(){
  const R=54, cx=60, cy=60;
  let s='<svg viewBox="0 0 120 120" class="secmap">';
  s+='<circle cx="60" cy="60" r="54" class="sec-ring"/><circle cx="60" cy="60" r="27" class="sec-ring"/>';
  for(let i=0;i<SECTOR.length;i++){
    const it=SECTOR[i], x=cx+it.x*R, y=cy+it.y*R;
    const cls = i===sectorAt ? "sec-here" : it.visited ? "sec-seen" : "sec-new";
    const r = it.seed.slice(-1)==="S" ? 3.1 : 1.7;   // со светилом — крупнее
    s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" class="'+cls+'"/>';
    if(i===sectorAt) s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="6.5" class="sec-mark"/>';
  }
  s+='</svg>';
  return s;
}

function planetCardHTML(p){
  const comp=p.comp.map(c=>
    '<div class="cmp"><span>'+c[0]+'</span><u><i style="width:'+c[1].toFixed(0)+'%"></i></u><b>'+
    c[1].toFixed(0)+'%</b></div>').join("");
  return '<div class="pcard">'+
    '<div class="pc-head">'+p.name+' · '+p.t.ru+(p.arrival?' <em>точка прилёта</em>':'')+'</div>'+
    '<div class="pc-grid">'+
      '<div><span>радиус</span><b>'+fmtNum(p.radius)+' км</b></div>'+
      '<div><span>орбита</span><b>'+p.au.toFixed(p.au<1?3:2)+' а. е.</b></div>'+
      '<div><span>сутки</span><b>'+p.day+' ч</b></div>'+
      '<div><span>год</span><b>'+(p.year>900?(p.year/365.25).toFixed(1)+' года':fmtNum(p.year)+' сут')+'</b></div>'+
      '<div><span>температура</span><b>'+p.tempK+' K · '+Math.round(p.tempK-273)+' °C</b></div>'+
      '<div><span>спутники</span><b>'+p.moons+'</b></div>'+
      '<div><span>кольца</span><b>'+(p.rings?"есть":"нет")+'</b></div>'+
    '</div><div class="pc-comp">'+comp+'</div></div>';
}

/* иконка станции: два модуля, панели и антенна — рисуется, а не грузится */
function stationIcon(){
  return '<svg viewBox="0 0 120 64" class="chan-ico">'+
    '<g class="ci">'+
      '<rect x="46" y="26" width="30" height="12" rx="3"/>'+
      '<rect x="30" y="28" width="16" height="8" rx="2"/>'+
      '<rect x="76" y="28" width="14" height="8" rx="2"/>'+
      '<rect x="14" y="16" width="14" height="32" class="pan"/>'+
      '<rect x="92" y="16" width="14" height="32" class="pan"/>'+
      '<line x1="28" y1="32" x2="14" y2="32"/><line x1="92" y1="32" x2="106" y2="32"/>'+
      '<line x1="61" y1="26" x2="61" y2="12"/><circle cx="61" cy="10" r="3"/>'+
      '<line x1="52" y1="38" x2="52" y2="46"/><line x1="70" y1="38" x2="70" y2="46"/>'+
    '</g></svg>';
}

/* задержка сигнала до дома: в системе Солнца — секунды, дальше — годы */
function commsDelay(){
  if(sun&&sun.solar){
    // расстояние от корабля до Земли, а не от Солнца: станция на её орбите
    const at=planets&&planets.at;
    const au=at?Math.hypot(at.x,at.y,at.z):1;
    const sec=au*499;                       // свет идёт 499 секунд на астрономическую единицу
    return sec<1 ? (sec*1000).toFixed(0)+" мс"
         : sec<90 ? sec.toFixed(1)+" с" : (sec/60).toFixed(1)+" мин";
  }
  const ly=lyHome();
  return ly===null ? "вне сектора" : fmtNum(ly*10)/10+" лет";
}

function commsHTML(){
  const c=CHANNELS[0];
  const home=sun&&sun.solar;
  return '<div class="comms">'+
    '<div class="ch-head">СВЯЗЬ</div>'+
    '<div class="chan'+(home?" live":"")+'" id="chan-mir">'+
      stationIcon()+
      '<div class="chan-body">'+
        '<div class="chan-name">'+c.name+' <em>'+c.call+'</em></div>'+
        '<div class="chan-grid">'+
          '<div><span>частота</span><b>'+c.freq+'</b></div>'+
          '<div><span>режим</span><b>'+c.mode+'</b></div>'+
          '<div><span>мощность</span><b>'+c.power+'</b></div>'+
          '<div><span>орбита</span><b>'+c.orbit+'</b></div>'+
          '<div><span>экипаж</span><b>'+c.crew+'</b></div>'+
          '<div><span>задержка</span><b>'+commsDelay()+'</b></div>'+
        '</div>'+
      '</div>'+
      '<button class="chan-btn" id="chan-test">проверка канала</button>'+
    '</div></div>';
}

function buildSysInfo(){
  if(!infoEl) return;
  const head='<div class="si-top"><h2>'+(sun&&sun.solar?"СОЛНЕЧНАЯ СИСТЕМА":"SYSTEM "+SEED.replace(/S$/,""))+'</h2>'+
    '<div class="si-sub">'+(sun?(sun.name?sun.name+" · ":"")+sun.t.k+"-TYPE STAR · "+
      fmtNum(sun.t.rKm)+" км":"светила нет")+
    ' · сектор '+(sectorAt+1)+' из '+SECTOR.length+'</div>'+
    '<button class="si-close" id="si-close">закрыть · I</button></div>';

  if(!planets){
    infoEl.innerHTML=head+'<div class="si-empty">Планет в этой системе нет — только пыль и свет чужих звёзд.'+
      '</div><div class="si-sector">'+sectorMapSVG()+'<div class="si-cap">сектор · 20 систем</div></div>'+
      commsHTML();
  }else{
    const parade=planets.list.map(p=>{
      // в каталоге планета освещена почти в лоб: с корабля половина из них
      // повёрнута ночной стороной, и парад выходит чёрным
      const real=p.light;
      p.light=[-.42,-.16,.89];
      const c=planetTexture(p,p.fbm,64);
      p.light=real;
      return '<figure class="pl'+(p.arrival?' at':'')+'">'+
        '<img src="'+c.toDataURL()+'" alt="">'+
        '<figcaption>'+p.name+'<span>'+p.t.ru+'</span></figcaption></figure>';
    }).join("");
    infoEl.innerHTML=head+
      '<div class="si-parade">'+parade+'</div>'+
      '<div class="si-cols">'+
        '<div class="si-left">'+planetCardHTML(planets.at)+'</div>'+
        '<div class="si-sector">'+sectorMapSVG()+'<div class="si-cap">сектор · '+
          SECTOR.length+' систем · пройдено '+SECTOR.filter(s=>s.visited).length+'</div></div>'+
      '</div>'+commsHTML();
  }
  const btn=document.getElementById("si-close");
  if(btn) btn.addEventListener("click",toggleSysInfo);
  const ct=document.getElementById("chan-test");
  if(ct) ct.addEventListener("click",()=>{
    const row=document.getElementById("chan-mir");
    if(commsCheck()&&row){
      row.classList.add("tx");
      setTimeout(()=>row.classList.remove("tx"),7000);
    }
  });
}

function toggleSysInfo(){
  if(!infoEl) return;
  infoOpen=!infoOpen;
  if(infoOpen) buildSysInfo();
  infoEl.classList.toggle("on",infoOpen);
  wake();
}

/* мир пересобрался — если сводка открыта, показать уже новую систему */
function syncSysInfo(){
  if(infoOpen) buildSysInfo();
}
