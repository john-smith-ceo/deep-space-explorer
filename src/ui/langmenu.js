/* ================= выбор языка (клавиша P) =================
   Заставку смотрят не только дома, поэтому по умолчанию английский, а
   русский — выбором, который запоминается. Меню маленькое и живёт по тем же
   правилам, что и остальные: стрелки, Enter, Esc. */

const langEl=document.getElementById("langmenu");
let langOpen=false, langSel=0;

function buildLangMenu(){
  if(!langEl) return;
  langSel=Math.max(0,LANG_LIST.map(l=>l[0]).indexOf(LANG));
  langEl.innerHTML=
    '<div class="lg-box">'+
      '<div class="lg-head">'+T("lang.title")+'<span class="lg-key">P</span></div>'+
      LANG_LIST.map((l,i)=>
        '<div class="lg-row'+(i===langSel?" sel":"")+(l[0]===LANG?" cur":"")+
        '" data-code="'+l[0]+'"><b>'+l[1]+'</b><i>'+l[0].toUpperCase()+'</i></div>').join("")+
      '<div class="lg-hint">'+T("lang.hint")+'</div>'+
    '</div>';
  langEl.querySelectorAll(".lg-row").forEach(r=>{
    r.addEventListener("click",()=>{ setLang(r.dataset.code); buildLangMenu(); });
  });
}

function toggleLangMenu(){
  if(!langEl) return;
  langOpen=!langOpen;
  if(langOpen) buildLangMenu();
  langEl.classList.toggle("on",langOpen);
  wake();
}

function langMove(step){
  if(!langOpen) return;
  langSel=(langSel+step+LANG_LIST.length)%LANG_LIST.length;
  const rows=langEl.querySelectorAll(".lg-row");
  rows.forEach((r,i)=>r.classList.toggle("sel",i===langSel));
}

function langConfirm(){
  if(!langOpen) return;
  setLang(LANG_LIST[langSel][0]);
  buildLangMenu();
}
