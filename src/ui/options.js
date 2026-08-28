/* ================= опции (клавиша O) =================
   Одно окно на все команды: список клавиш и выбор языка. Подсказка внизу
   экрана осталась короткой — три клавиши, — а полный перечень живёт здесь,
   и его не нужно помнить.

   Прежнее отдельное меню языка по P убрано: две двери в одну комнату. */

const optEl=document.getElementById("optmenu");
let optOpen=false, langSel=0;

const COMMANDS=[
  ["← ↑ ↓ →","cmd.steer"],
  ["W S","cmd.thrust"],
  ["wheel","cmd.wheel"],
  ["Space","cmd.boost"],
  ["X","cmd.stop"],
  ["J","cmd.jump"],
  ["I","cmd.system"],
  ["O","cmd.options"],
  ["K","cmd.sound"],
  ["M","cmd.noise"],
  ["F","cmd.fullscreen"],
  ["H","cmd.hud"]
];

function buildOptions(){
  if(!optEl) return;
  langSel=Math.max(0,LANG_LIST.map(l=>l[0]).indexOf(LANG));
  optEl.innerHTML=
    '<div class="opt-box">'+
      '<div class="opt-head">'+T("opt.title")+'<span class="opt-key">O</span></div>'+
      '<div class="opt-cols">'+
        '<div class="opt-cmds"><div class="opt-sub">'+T("opt.controls")+'</div>'+
          COMMANDS.map(c=>'<div class="opt-row"><kbd>'+c[0]+'</kbd><span>'+T(c[1])+'</span></div>').join("")+
        '</div>'+
        '<div class="opt-lang"><div class="opt-sub">'+T("opt.language")+'</div>'+
          LANG_LIST.map((l,i)=>
            '<div class="lg-row'+(i===langSel?" sel":"")+(l[0]===LANG?" cur":"")+
            '" data-code="'+l[0]+'"><b>'+l[1]+'</b><i>'+l[0].toUpperCase()+'</i></div>').join("")+
          '<div class="opt-hint">'+T("opt.hint")+'</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  optEl.querySelectorAll(".lg-row").forEach(r=>{
    r.addEventListener("click",()=>{ setLang(r.dataset.code); buildOptions(); });
  });
}

function toggleOptions(){
  if(!optEl) return;
  optOpen=!optOpen;
  if(optOpen) buildOptions();
  optEl.classList.toggle("on",optOpen);
  wake();
}

function optMove(step){
  if(!optOpen) return;
  langSel=(langSel+step+LANG_LIST.length)%LANG_LIST.length;
  optEl.querySelectorAll(".lg-row").forEach((r,i)=>r.classList.toggle("sel",i===langSel));
}

function optConfirm(){
  if(!optOpen) return;
  setLang(LANG_LIST[langSel][0]);
  buildOptions();
}
