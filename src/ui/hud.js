/* ================= ввод ================= */
const spdEl=document.getElementById("spd"), fsdEl=document.getElementById("fsd"),
      tfill=document.getElementById("tfill"), tval=document.getElementById("tval"),
      hud=document.getElementById("hud"), help=document.getElementById("help"),
      boot=document.getElementById("boot"), sysEl=document.getElementById("sys");

function setThrottle(v){
  S.throttle=Math.max(0,Math.min(1,v));
  tfill.style.height=(S.throttle*100)+"%";
  tval.textContent=Math.round(S.throttle*100)+"%";
}
window.addEventListener("pointermove",()=>wake(),{passive:true});   // мышь курс не ведёт — только будит интерфейс
window.addEventListener("wheel",e=>{
  setThrottle(S.throttle-Math.sign(e.deltaY)*.05); wake();
},{passive:true});
window.addEventListener("keydown",e=>{
  const k=e.key.toLowerCase();
  /* опции перехватывают управление первыми: это окно самое верхнее */
  if(optOpen){
    if(e.key==="ArrowUp"){optMove(-1);e.preventDefault();return}
    if(e.key==="ArrowDown"){optMove(1);e.preventDefault();return}
    if(e.key==="Enter"){optConfirm();e.preventDefault();return}
    if(e.key==="Escape"||k==="o"||k==="щ"){toggleOptions();e.preventDefault();return}
    return;
  }
  /* пока открыто меню прыжка, стрелки выбирают цель, а не ведут курс */
  if(jumpOpen){
    if(e.key==="ArrowUp"){jumpMove(-1);e.preventDefault();return}
    if(e.key==="ArrowDown"){jumpMove(1);e.preventDefault();return}
    if(e.key==="Enter"){jumpConfirm();e.preventDefault();return}
    if(e.key==="Escape"||k==="j"||k==="о"){toggleJumpMenu();e.preventDefault();return}
    return;
  }
  wake();
  if(e.key==="ArrowLeft"){K.l=1;e.preventDefault()}
  else if(e.key==="ArrowRight"){K.r=1;e.preventDefault()}
  else if(e.key==="ArrowUp"){K.u=1;e.preventDefault()}
  else if(e.key==="ArrowDown"){K.d=1;e.preventDefault()}
  else if(k==="w"||k==="ц"){setThrottle(S.throttle+.06);e.preventDefault()}
  else if(k==="s"||k==="ы"){setThrottle(S.throttle-.06);e.preventDefault()}
  else if(e.code==="Space"){S.boostKey=true;e.preventDefault()}
  else if(k==="j"||k==="о"){toggleJumpMenu();e.preventDefault()}
  else if(k==="f"||k==="а"){toggleFS()}
  else if(k==="h"||k==="р"){hud.classList.toggle("off")}
  else if(k==="x"||k==="ч"){setThrottle(0)}
  else if(k==="m"||k==="ь"){noiseCancel()}
  else if(k==="k"||k==="л"){toggleSoundPanel()}
  else if(k==="o"||k==="щ"){toggleOptions()}
  else if(k==="i"||k==="ш"){toggleSysInfo()}
  else if(e.key==="Escape"&&infoOpen){toggleSysInfo()}
});
window.addEventListener("keyup",e=>{
  if(e.code==="Space") S.boostKey=false;
  else if(e.key==="ArrowLeft") K.l=0;
  else if(e.key==="ArrowRight") K.r=0;
  else if(e.key==="ArrowUp") K.u=0;
  else if(e.key==="ArrowDown") K.d=0;
});
window.addEventListener("blur",()=>{K.l=K.r=K.u=K.d=0;S.boostKey=false;});

function toggleFS(){
  if(!document.fullscreenElement) (document.documentElement.requestFullscreen||function(){}).call(document.documentElement);
  else document.exitFullscreen();
}
document.addEventListener("dblclick",toggleFS);

/* курсор и подсказка уходят в покое */
let idle=null;
function wake(){
  document.body.classList.remove("hidecursor");
  help.classList.remove("off");
  clearTimeout(idle);
  idle=setTimeout(()=>{
    document.body.classList.add("hidecursor");
    help.classList.add("off");
  },4000);
}

document.addEventListener("visibilitychange",()=>{ if(!document.hidden) last=performance.now(); });

/* старт */
document.getElementById("go").addEventListener("click",()=>{
  audioStart();                 // звук можно пускать только по жесту
  boot.classList.add("gone");
  setTimeout(()=>boot.remove(),1000);
  toggleFS();
  wake();
});
