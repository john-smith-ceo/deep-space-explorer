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
  for(let i=0;i<GALAXY.systems.length;i++){
    const it=GALAXY.systems[i];
    const h=JUMP.sectorLy/2, x=cx+(it.x/h)*R, y=cy+(it.y/h)*R;
    const cls = i===GALAXY.at ? "sec-here" : it.visited ? "sec-seen" : "sec-new";
    const r = it.star ? 3.1 : 1.7;   // со светилом — крупнее
    s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" class="'+cls+'"/>';
    if(i===GALAXY.at) s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="6.5" class="sec-mark"/>';
  }
  s+='</svg>';
  return s;
}

function planetCardHTML(p){
  const comp=p.comp.map(c=>
    '<div class="cmp"><span>'+T(c[0])+'</span><u><i style="width:'+c[1].toFixed(0)+'%"></i></u><b>'+
    c[1].toFixed(0)+'%</b></div>').join("");
  return '<div class="pcard">'+
    '<div class="pc-head">'+T("n."+p.name)+' · '+T(p.t.key)+(p.arrival?' <em>'+T("info.arrival")+'</em>':'')+'</div>'+
    '<div class="pc-grid">'+
      '<div><span>'+T("info.radius")+'</span><b>'+fmtNum(p.radius)+' '+T("u.km")+'</b></div>'+
      '<div><span>'+T("info.orbit")+'</span><b>'+p.au.toFixed(p.au<1?3:2)+' '+T("u.au")+'</b></div>'+
      '<div><span>'+T("info.day")+'</span><b>'+p.day+' '+T("u.h")+'</b></div>'+
      '<div><span>'+T("info.year")+'</span><b>'+(p.year>900?(p.year/365.25).toFixed(1)+' '+T("u.yr"):fmtNum(p.year)+' '+T("u.d"))+'</b></div>'+
      '<div><span>'+T("info.temp")+'</span><b>'+p.tempK+' K · '+Math.round(p.tempK-273)+' °C</b></div>'+
      '<div><span>'+T("info.moons")+'</span><b>'+p.moons+'</b></div>'+
      '<div><span>'+T("info.rings")+'</span><b>'+(p.rings?T("info.yes"):T("info.no"))+'</b></div>'+
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
    return sec<1 ? (sec*1000).toFixed(0)+" "+T("u.ms")
         : sec<90 ? sec.toFixed(1)+" "+T("u.s") : (sec/60).toFixed(1)+" "+T("u.min");
  }
  const ly=lyHome();
  return ly===null ? T("comms.outside") : (Math.round(ly*10)/10)+" "+T("u.yr");
}

function commsHTML(){
  const list=commsChannels();
  if(!list.length){
    return '<div class="comms"><div class="ch-head">'+T("comms.head")+'</div>'+
      '<div class="si-empty">'+T("comms.none")+'</div></div>';
  }
  const o=list[0], c=o.comms;
  const home=sun&&sun.solar;
  return '<div class="comms">'+
    '<div class="ch-head">'+T("comms.head")+'</div>'+
    '<div class="chan'+(home?" live":"")+'" id="chan-mir">'+
      stationIcon()+
      '<div class="chan-body">'+
        '<div class="chan-name">'+T(o.nameKey)+' <em>'+c.call+'</em></div>'+
        '<div class="chan-grid">'+
          '<div><span>'+T("comms.freq")+'</span><b>'+T(c.freqKey)+'</b></div>'+
          '<div><span>'+T("comms.mode")+'</span><b>'+T(c.modeKey)+'</b></div>'+
          '<div><span>'+T("comms.power")+'</span><b>'+c.power+' '+T("u.w")+'</b></div>'+
          '<div><span>'+T("comms.orbit")+'</span><b>'+c.orbitKm+' '+T("u.km")+' · '+c.incl+'°</b></div>'+
          '<div><span>'+T("comms.crew")+'</span><b>'+c.crew+'</b></div>'+
          '<div><span>'+T("comms.delay")+'</span><b>'+commsDelay()+'</b></div>'+
        '</div>'+
      '</div>'+
      '<button class="chan-btn" id="chan-test">'+T("comms.test")+'</button>'+
    '</div></div>';
}

function buildSysInfo(){
  if(!infoEl) return;
  const head='<div class="si-top"><h2>'+(sun&&sun.solar?T("sys.solar"):T("sys.system")+" "+SEED.replace(/S$/,""))+'</h2>'+
    '<div class="si-sub">'+(sun?(sun.name?T("n."+sun.name)+" · ":"")+T("star.fmt").replace("{k}",sun.t.k)+" · "+
      fmtNum(sun.t.rKm)+" "+T("u.km"):T("star.none"))+
    ' · '+T("info.sector")+' '+(GALAXY.at+1)+'/'+GALAXY.systems.length+'</div>'+
    '<button class="si-close" id="si-close">'+T("info.close")+' · I</button></div>';

  if(!planets){
    infoEl.innerHTML=head+'<div class="si-empty">'+T("info.empty")+
      '</div><div class="si-sector">'+sectorMapSVG()+'<div class="si-cap">'+T("info.sector")+' · '+GALAXY.systems.length+' '+T("info.systems")+'</div></div>'+
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
        '<figcaption>'+T("n."+p.name)+'<span>'+T(p.t.key)+'</span></figcaption></figure>';
    }).join("");
    infoEl.innerHTML=head+
      '<div class="si-parade">'+parade+'</div>'+
      '<div class="si-cols">'+
        '<div class="si-left">'+planetCardHTML(planets.at)+'</div>'+
        '<div class="si-sector">'+sectorMapSVG()+'<div class="si-cap">'+T("info.sector")+' · '+
          GALAXY.systems.length+' '+T("info.systems")+' · '+T("info.visited")+' '+GALAXY.systems.filter(s=>s.visited).length+'</div></div>'+
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
