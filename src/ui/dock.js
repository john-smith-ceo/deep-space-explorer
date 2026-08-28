/* ================= нижняя панель состояния =================
   Двадцать показателей по бокам от радара: десять слева, десять справа.
   Обновляется пять раз в секунду, а не каждый кадр — цифры всё равно не
   читаются быстрее, а сорок обращений к DOM в кадре стоят дороже всей сцены. */

const dockL=document.getElementById("dock-l"), dockR=document.getElementById("dock-r");
let dockCells=null, dockT=0;

function dockBuild(){
  if(!dockL||!dockR) return;
  const rows=shipReadout();
  const half=Math.ceil(rows.length/2);
  const cell=(r)=>'<div class="cellx"><span>'+r[0]+'</span><b></b>'+
                  '<u><i style="width:0%"></i></u></div>';
  dockL.innerHTML=rows.slice(0,half).map(cell).join("");
  dockR.innerHTML=rows.slice(half).map(cell).join("");
  dockCells=[].concat(
    [].slice.call(dockL.querySelectorAll(".cellx")),
    [].slice.call(dockR.querySelectorAll(".cellx")));
}

function dockUpdate(dt){
  if(!dockCells) dockBuild();
  if(!dockCells) return;
  dockT+=dt;
  if(dockT<.2) return;
  dockT=0;
  const rows=shipReadout();
  for(let i=0;i<dockCells.length&&i<rows.length;i++){
    const c=dockCells[i], r=rows[i];
    c.children[1].textContent=r[1];
    c.children[2].children[0].style.width=Math.round(Math.max(0,Math.min(1,r[2]))*100)+"%";
    c.classList.toggle("hot", r[2]>.85 && i>1);
  }
}
