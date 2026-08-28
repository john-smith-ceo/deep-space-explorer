/* ================= карта системы =================
   Радар рисуется из тех же векторов «объект минус корабль», по которым
   строится кадр. Поэтому направление на планету на карте и в небе совпадает
   по определению: разойтись им негде.

   Расстояние сжато логарифмом. Без этого планета прилёта, до которой
   единицы, слипалась бы с отметкой корабля, пока дальние орбиты занимают
   всю карту — направление важнее точной дистанции. */

const mapCv=document.getElementById("sysmap");
const mapCtx=mapCv?mapCv.getContext("2d"):null;
const MAP_TILT=.42;              // наклон плоскости системы на карте

/* Нос корабля на карте смотрит вверх, поэтому «вперёд» (z>0) обязано уходить
   вверх, а не вниз, и объект ниже нас — вниз. У экрана ось y направлена вниз,
   отсюда знаки: перепутанные, карта читается вверх ногами. */
function mapProject(x,y,z,k){     // 3D → экран радара
  return [x*k, y*k*.52 - z*k*MAP_TILT];
}

function mapPoint(o,R,dmax){
  const d=Math.hypot(o.x,o.y,o.z)||1e-6;
  const s=Math.log(1+d/2)/Math.log(1+dmax/2);      // сжатие по дальности
  return mapProject(o.x,o.y,o.z,(R*Math.min(1,s))/d);
}

function drawSysMap(){
  if(!mapCtx) return;
  const w=mapCv.width, h=mapCv.height, ox=w/2, oy=h*.54, R=Math.min(w,h)*.40;
  mapCtx.clearRect(0,0,w,h);

  /* плоскость: два эллипса и перекрестье */
  mapCtx.strokeStyle="rgba(255,157,47,.16)"; mapCtx.lineWidth=1;
  for(const q of [1,.55]){
    mapCtx.beginPath();
    mapCtx.ellipse(ox,oy,R*q,R*q*MAP_TILT,0,0,6.2832);
    mapCtx.stroke();
  }
  mapCtx.beginPath();
  mapCtx.moveTo(ox-R,oy); mapCtx.lineTo(ox+R,oy);
  mapCtx.moveTo(ox,oy-R*MAP_TILT); mapCtx.lineTo(ox,oy+R*MAP_TILT);
  mapCtx.stroke();

  /* корабль: нос смотрит вверх карты, то есть по курсу */
  mapCtx.fillStyle="rgba(255,157,47,.95)";
  mapCtx.beginPath();
  mapCtx.moveTo(ox,oy-5); mapCtx.lineTo(ox+3.6,oy+3.4); mapCtx.lineTo(ox-3.6,oy+3.4);
  mapCtx.closePath(); mapCtx.fill();

  if(!sun){
    mapCtx.fillStyle="rgba(255,157,47,.42)";
    mapCtx.font="9px ui-monospace,monospace"; mapCtx.textAlign="center";
    mapCtx.fillText("СИСТЕМА БЕЗ СВЕТИЛА",ox,h-6);
    return;
  }

  /* самый дальний объект задаёт масштаб карты */
  let dmax=Math.hypot(sun.x,sun.y,sun.z);
  if(planets) for(const p of planets.list){
    const d=Math.hypot(p.x,p.y,p.z);
    if(d>dmax) dmax=d;
  }

  const stalk=(px,py,o,k)=>{                        // стойка до плоскости
    const fl=mapProject(o.x,0,o.z,k);
    mapCtx.strokeStyle="rgba(255,157,47,.20)";
    mapCtx.beginPath(); mapCtx.moveTo(px,py); mapCtx.lineTo(ox+fl[0],oy+fl[1]); mapCtx.stroke();
  };

  /* звезда */
  const sd=Math.hypot(sun.x,sun.y,sun.z)||1e-6;
  const sk=(R*Math.min(1,Math.log(1+sd/2)/Math.log(1+dmax/2)))/sd;
  const sp=mapPoint(sun,R,dmax), sx=ox+sp[0], sy=oy+sp[1];
  stalk(sx,sy,sun,sk);
  mapCtx.fillStyle="rgba("+sun.t.col+",.95)";
  mapCtx.beginPath(); mapCtx.arc(sx,sy,4,0,6.2832); mapCtx.fill();

  /* планеты */
  if(planets) for(const p of planets.list){
    const d=Math.hypot(p.x,p.y,p.z)||1e-6;
    const k=(R*Math.min(1,Math.log(1+d/2)/Math.log(1+dmax/2)))/d;
    const pt=mapPoint(p,R,dmax), px=ox+pt[0], py=oy+pt[1];
    stalk(px,py,p,k);
    if(p.arrival){
      mapCtx.strokeStyle="rgba(159,212,255,.9)"; mapCtx.lineWidth=1;
      mapCtx.beginPath(); mapCtx.arc(px,py,5,0,6.2832); mapCtx.stroke();
      mapCtx.fillStyle="rgba(159,212,255,.95)";
    }else{
      mapCtx.fillStyle="rgba(255,213,160,.72)";
    }
    mapCtx.beginPath(); mapCtx.arc(px,py,p.gas?2.6:1.8,0,6.2832); mapCtx.fill();
  }

  mapCtx.fillStyle="rgba(255,157,47,.5)";
  mapCtx.font="10px ui-monospace,monospace"; mapCtx.textAlign="center";
  mapCtx.fillText((planets?planets.list.length:0)+" ПЛАНЕТ · "+sun.t.k,ox,h-6);
}
