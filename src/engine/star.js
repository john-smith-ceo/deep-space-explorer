/* ================= объёмная звезда =================
   Шар получается не из градиента, а из физики: яркость точки диска зависит
   от того, под каким углом видна поверхность — лимбовое потемнение. Оно и
   лепит объём; без него любой градиент читается плоским кругом. Фактура
   берётся из трёхмерного шума, снятого прямо с поверхности сферы.

   Звезда неподвижна: с такого расстояния вращение всё равно не читается,
   а шестнадцать кадров оборота стоили сотню миллисекунд на входе в систему. */

function makeNoise3(){
  const N=12, g=new Float32Array(N*N*N);
  for(let i=0;i<g.length;i++) g[i]=rnd();
  const at=(x,y,z)=>g[(((x%N)+N)%N)*N*N+(((y%N)+N)%N)*N+(((z%N)+N)%N)];
  function n1(x,y,z){
    const xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z);
    const xf=x-xi, yf=y-yi, zf=z-zi;
    const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf), w=zf*zf*(3-2*zf);
    let s=0;
    for(let dx=0;dx<2;dx++) for(let dy=0;dy<2;dy++) for(let dz=0;dz<2;dz++)
      s+=(dx?u:1-u)*(dy?v:1-v)*(dz?w:1-w)*at(xi+dx,yi+dy,zi+dz);
    return s;
  }
  return (x,y,z)=>n1(x,y,z)*.54+n1(x*2.1+9,y*2.1+9,z*2.1+9)*.31+n1(x*4.4+3,y*4.4+3,z*4.4+3)*.15;
}

/* цвет класса со сдвигом оттенка: две звезды одного класса не должны быть
   близнецами. Сдвиг ведёт красный и синий каналы в разные стороны — выходит
   «теплее» или «холоднее», а не просто светлее */
function tint(rgb,h){
  const p=rgb.split(",").map(Number);
  return [Math.max(0,Math.min(255,p[0]*(1+h))),
          p[1],
          Math.max(0,Math.min(255,p[2]*(1-h)))];
}

/* текстура шара. Шум берётся по трёхмерной точке поверхности, поэтому
   у края фактура естественно сжимается — как на настоящем шаре.
   Класс звезды входит множителями: горячие ярче и глаже, холодные рябее */
function starTexture(sn){
  const C=STAR_CFG, t=sn.t, fbm=sn.fbm, T=SUN_TEX, R=T/2;
  const core=tint(t.core,sn.hue), col=tint(t.col,sn.hue);
  const nsc=C.noiseScale*t.noiseK, grn=C.granGain*t.granK,
        spa=C.spotAt*t.spotK, gain=C.gain*t.gainK;
  const c=document.createElement("canvas"); c.width=c.height=T;
  const g=c.getContext("2d"), img=g.createImageData(T,T), d=img.data;
  const rw=Math.max(.001,C.rimWidth);
  for(let py=0;py<T;py++) for(let px=0;px<T;px++){
    const o=(py*T+px)*4;
    const x=(px+.5-R)/R, y=(py+.5-R)/R, d2=x*x+y*y;
    if(d2>=1){ d[o+3]=0; continue; }
    const z=Math.sqrt(1-d2), r=Math.sqrt(d2);
    const n=fbm(x*nsc+7, y*nsc+7, z*nsc+7);
    let I=(C.limbBase+(1-C.limbBase)*Math.pow(z,C.limbPow))*(C.granBase+grn*n);
    if(n<spa) I*=C.spotDark;
    // вес края: узкая полоса у лимба темнеет (rim>0) или наливается светом (rim<0)
    const edge=Math.max(0,Math.min(1,(r-(1-rw))/rw));
    I*=1-C.rim*edge*edge;
    const w=1-z*C.tempMix;                       // край холоднее ядра
    const k=I*gain;
    d[o]  =Math.min(255,(core[0]+(col[0]-core[0])*w)*k);
    d[o+1]=Math.min(255,(core[1]+(col[1]-core[1])*w)*k);
    d[o+2]=Math.min(255,(core[2]+(col[2]-core[2])*w)*k);
    d[o+3]=Math.min(255,255*Math.min(1,(1-d2)*R*.9));   // мягкий лимб на пиксель-другой
  }
  g.putImageData(img,0,0);
  return c;
}

/* ореол ступенями со степенным спадом. Четырёх опорных точек мало — на них
   край получается ватным; рисуется в спрайт, пересобирать градиент из
   тридцати стопов на каждом кадре дороже всего остального в сцене */
function starHalo(sn){
  const C=STAR_CFG, t=sn.t, S=256, c=document.createElement("canvas"); c.width=c.height=S;
  const g=c.getContext("2d"), R=S/2;
  const steps=Math.max(2,Math.round(C.haloSteps));
  const col=tint(t.col,sn.hue).map(Math.round).join(",");
  const peak=C.haloPeak*t.haloK;                 // горячие светят сильнее
  const gr=g.createRadialGradient(R,R,R*.10,R,R,R);
  for(let i=0;i<=steps;i++){
    const q=i/steps;
    gr.addColorStop(q,"rgba("+col+","+(peak*Math.pow(1-q,C.haloFall)).toFixed(4)+")");
  }
  g.fillStyle=gr; g.beginPath(); g.arc(R,R,R,0,6.2832); g.fill();
  return c;
}

/* пересобрать шар и ореол по текущим настройкам — вызывается панелью */
function restyleSun(){
  if(!sun) return;
  sun.tex=starTexture(sun);
  sun.halo=starHalo(sun);
}

function drawSun(){
  if(!sun) return;
  rotate(sun);
  if(sun.z<=0) return;                        // светило за спиной
  const C=STAR_CFG;
  // видимый размер — это собственный размер светила на его удалённость
  const k=F/sun.z, sx=cx+sun.x*k, sy=cy+sun.y*k;
  // радиус выводится из настоящего размера светила и расстояния до него;
  // starVisual — единственное умышленное преувеличение во всей сцене
  const rAU=sun.t.rKm/SCALE.kmPerAU;
  const rad=Math.max(4, rAU*SCALE.starVisual*k*C.size*sun.dist*C.dist);
  const halo=Math.round(rad*C.haloScale*sun.t.gl);
  const asp=Math.max(.2,sun.aspect*C.haloAspect);            // ореол не обязан быть круглым
  if(sx<-halo*asp-halo||sx>W+halo*asp+halo||sy<-halo*asp-halo||sy>H+halo*asp+halo) return;
  ctx.globalCompositeOperation="lighter";
  ctx.globalAlpha=1-C.haloPulse*(.5+.5*Math.sin(S.t*.9))-C.haloPulse*.3*Math.sin(S.t*2.3);
  ctx.save();
  ctx.translate(sx,sy); ctx.rotate(sun.haloRot); ctx.scale(asp,1/asp);
  ctx.drawImage(sun.halo,-halo,-halo,halo*2,halo*2);
  ctx.restore();
  ctx.globalAlpha=1;
  ctx.drawImage(sun.tex,sx-rad,sy-rad,rad*2,rad*2);
  ctx.globalCompositeOperation="source-over";
}
