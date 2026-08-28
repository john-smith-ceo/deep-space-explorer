/* ================= панель звука (клавиша K) =================
   Подбор на слух: каждое движение ползунка сразу применяется к живому графу.
   Длина эха и крутизна затухания требуют пересборки импульса — они помечены,
   чтобы не пересобирать свёртку на каждый пиксель ползунка. */

const SND_FIELDS=[
  ["master",   "общий уровень",     0,   .35, .005, 0],
  ["core",     "гул: тон",          0,   .6,  .01,  0],
  ["harm",     "гул: гармоника",    0,   .35, .01,  0],
  ["fifth",    "гул: полутора",     0,   .25, .005, 0],
  ["sub",      "гул: подтон",       0,   .4,  .01,  0],
  ["coreHz",   "частота контура",   18,  90,  1,    0],
  ["noise",    "шум плазмы",        0,   .5,  .01,  0],
  ["body",     "резонанс корпуса",  0,   .4,  .01,  0],
  ["bodyHz",   "его частота",       40,  260, 2,    0],
  ["hiss",     "ионизация",         0,   .06, .002, 0],
  ["cutoff",   "срез обшивки",      60,  900, 10,   0],
  ["vibHz",    "вибрация, Гц",      1,   18,  .1,   0],
  ["vib",      "вибрация, глубина", 0,   .25, .005, 0],
  ["shakeHz",  "дрожь, Гц",         12,  70,  1,    0],
  ["shake",    "дрожь, глубина",    0,   .1,  .002, 0],
  ["echo",     "эхо: доля",         0,   .8,  .01,  0],
  ["echoSec",  "эхо: длина, с",     .2,  3,   .1,   1],
  ["echoDecay","эхо: затухание",    1,   8,   .1,   1],
  ["slowA",    "перемены: фильтр",  .002,.2,  .002, 0],
  ["slowB",    "перемены: корпус",  .002,.2,  .002, 0],
  ["slowC",    "перемены: тон",     .002,.2,  .002, 0],
  ["driftHz",  "дыхание",           .01, .3,  .005, 0]
];

const sndPanel=document.getElementById("sndcfg");
let sndPanelBuilt=false, sndPanelOn=false;

function sndLine(){
  return SND_FIELDS.map(f=>f[0]+"="+(+SOUND[f[0]]).toFixed(3)).join(" ");
}

function buildSoundPanel(){
  if(!sndPanel||sndPanelBuilt) return;
  sndPanel.innerHTML=
    '<div class="sc-head">ЗВУК<span class="sc-key">K</span></div>'+
    SND_FIELDS.map((f,i)=>
      '<label><span>'+f[1]+'</span><b id="sv'+i+'">'+(+SOUND[f[0]]).toFixed(3)+'</b>'+
      '<input type="range" min="'+f[2]+'" max="'+f[3]+'" step="'+f[4]+
      '" value="'+SOUND[f[0]]+'" data-i="'+i+'"></label>').join("")+
    '<textarea class="sc-out" id="sndout" readonly rows="3"></textarea>'+
    '<div class="sc-btns"><button id="sndcopy">выделить</button>'+
    '<button id="sndreset">сброс</button></div>';

  sndPanel.querySelectorAll("input[type=range]").forEach(inp=>{
    inp.addEventListener("input",e=>{
      const i=+e.target.dataset.i, f=SND_FIELDS[i];
      SOUND[f[0]]=+e.target.value;
      document.getElementById("sv"+i).textContent=(+e.target.value).toFixed(3);
      audioApply(!!f[5]);
      document.getElementById("sndout").value=sndLine();
    });
  });
  const out=document.getElementById("sndout");
  if(out) out.value=sndLine();
  const cp=document.getElementById("sndcopy");
  if(cp) cp.addEventListener("click",()=>{ out.select(); });
  const rs=document.getElementById("sndreset");
  if(rs) rs.addEventListener("click",()=>{
    for(const k in SOUND_DEFAULTS) SOUND[k]=SOUND_DEFAULTS[k];
    sndPanelBuilt=false; sndPanel.innerHTML=""; buildSoundPanel();
    audioApply(true);
  });
  sndPanelBuilt=true;
}

function toggleSoundPanel(){
  if(!sndPanel) return;
  if(!SND.ctx) audioStart();          // без звука панель бессмысленна
  buildSoundPanel();
  sndPanelOn=!sndPanelOn;
  sndPanel.classList.toggle("on",sndPanelOn);
  wake();
}
