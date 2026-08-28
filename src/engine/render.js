/* ================= рендер ================= */
function resize(){
  dpr=Math.min(window.devicePixelRatio||1,2);
  W=cv.clientWidth; H=cv.clientHeight;
  cv.width=W*dpr; cv.height=H*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  cx=W/2; cy=H/2; F=Math.max(W,H)*.78;
}
window.addEventListener("resize",resize);

const R={cy:1,sy:0,cp:1,sp:0};      // синусы кадра — один раз, не на каждую точку
function setRot(dy,dp){ R.cy=Math.cos(dy); R.sy=Math.sin(dy); R.cp=Math.cos(dp); R.sp=Math.sin(dp); }
function rotate(p){
  const x=p.x*R.cy - p.z*R.sy;
  let z=p.x*R.sy + p.z*R.cy;
  const y=p.y*R.cp - z*R.sp;
  z=p.y*R.sp + z*R.cp;
  p.x=x; p.y=y; p.z=z;
}

function drawSky(list,mode){
  ctx.globalCompositeOperation=mode;
  for(let i=0;i<list.length;i++){
    const p=list[i];
    rotate(p);
    if(p.z<300) continue;
    const k=F/p.z, sx=cx+p.x*k, sy=cy+p.y*k, rw=p.s*k, rh=rw*p.e;
    if(sx<-rw*2||sx>W+rw*2||sy<-rh*2||sy>H+rh*2) continue;
    ctx.save();
    ctx.translate(sx,sy); ctx.rotate(p.rot);
    ctx.globalAlpha=p.a;
    ctx.drawImage(p.sp,-rw,-rh,rw*2,rh*2);
    ctx.restore();
  }
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation="source-over";
}


let last=performance.now();
function frame(now){
  let dt=(now-last)/1000; last=now;
  if(dt>.05) dt=.05;
  S.t+=dt;

  /* --- прыжок --- */
  let jumpK=0;                       // 0 — обычный полёт, 1 — разгар тоннеля
  if(J.ph){
    J.t+=dt;
    if(J.ph===1){
      jumpK=.22*(J.t/J_CHARGE);
      if(J.t>=J_CHARGE){ J.ph=2; J.t=0; }
    }else if(J.ph===2){
      const q=J.t/J_TUNNEL;
      jumpK=.22+q*q*.78;
      J.flash=Math.pow(q,3.2);
      if(J.t>=J_TUNNEL){ J.ph=3; J.t=0; J.flash=1; arrive(); }
    }else{
      jumpK=Math.max(0,1-J.t/(J_EXIT*.7));
      J.flash=Math.max(0,1-J.t/(J_EXIT*.55));
      if(J.t>=J_EXIT){ J.ph=0; J.flash=0; }
    }
  }

  /* --- управление --- */
  const lock=J.ph===2?0:1;           // в тоннеле курс не слушается
  const tgtYaw=(K.l-K.r)*0.62*lock, tgtPitch=(K.d-K.u)*0.48*lock;
  S.vyaw += (tgtYaw-S.vyaw)*Math.min(1,dt*2.2);
  S.vpitch += (tgtPitch-S.vpitch)*Math.min(1,dt*2.2);
  const dyaw=S.vyaw*dt, dpitch=S.vpitch*dt;
  S.yaw+=dyaw; S.pitch+=dpitch;
  S.vroll += ((-S.vyaw*.30)-S.vroll)*Math.min(1,dt*1.6);
  S.roll=S.vroll;

  const bt=S.boostKey?1:0;
  S.boost += (bt-S.boost)*Math.min(1,dt*(bt?1.1:.6));
  const target=S.throttle*MAXV*(1+S.boost*3.4) + jumpK*jumpK*MAXV*26;
  S.speed += (target-S.speed)*Math.min(1,dt*(J.ph===3?2.6:1.35));
  const travel=S.speed*dt;
  const streak=STREAK+jumpK*7;       // в тоннеле пыль вытягивается в нити

  /* --- фон --- */
  ctx.fillStyle="#00010a"; ctx.fillRect(0,0,W,H);
  setRot(-dyaw,-dpitch);

  ctx.save();
  ctx.translate(cx,cy); ctx.rotate(S.roll); ctx.translate(-cx,-cy);
  drawSky(gas,"lighter");
  drawSky(dust,"source-over");

  /* --- звёздная крупа --- */
  ctx.globalCompositeOperation="lighter";
  ctx.fillStyle="#eef3ff";
  for(let g=0;g<GRIT_BANDS;g++){
    const band=grit[g], n=band.length;
    ctx.globalAlpha=(.16+((g+.5)/GRIT_BANDS)*.62)*(1-jumpK*.6);
    ctx.beginPath();
    for(let i=0;i<n;i++){
      const p=band[i];
      rotate(p);
      if(p.z<=1) continue;
      const k=F/p.z, sx=cx+p.x*k, sy=cy+p.y*k;
      if(sx<0||sx>W||sy<0||sy>H) continue;
      ctx.rect(sx,sy,1,1);
    }
    ctx.fill();
  }
  ctx.globalAlpha=1;

  /* --- звёзды --- */
  for(let i=0;i<FAR;i++){
    const p=far[i];
    rotate(p);
    if(p.z<=1) continue;
    const k=F/p.z, sx=cx+p.x*k, sy=cy+p.y*k;
    if(sx<-40||sx>W+40||sy<-40||sy>H+40) continue;
    const tw=.80+.20*Math.sin(S.t*p.ts+p.t);
    const a=p.b*tw;
    if(a<.03) continue;
    if(jumpK>.12){                   // в тоннеле звёзды растягиваются от центра
      const st=1+jumpK*jumpK*7;
      ctx.globalAlpha=a*.9;
      ctx.strokeStyle="#cfe0ff"; ctx.lineWidth=.9+p.b*1.1; ctx.lineCap="round";
      ctx.beginPath();
      ctx.moveTo(cx+(sx-cx)/st,cy+(sy-cy)/st); ctx.lineTo(sx,sy); ctx.stroke();
      continue;
    }
    // размер растёт быстрее яркости: слабые остаются крупинками,
    // а не уменьшенными копиями ярких
    const d=1.0+p.b*p.b*4.4;
    ctx.globalAlpha=a;
    ctx.drawImage(p.sp,sx-d,sy-d,d*2,d*2);
    if(p.big){                        // ярким — только второй, широкий ореол
      const r=d*2.6;
      ctx.globalAlpha=a*.34;
      ctx.drawImage(p.sp,sx-r,sy-r,r*2,r*2);
    }
  }
  ctx.globalAlpha=1;
  rotateSystem();
  if(jumpK<.5){ drawSun(); drawPlanet(); }

  /* --- ближняя пыль: стрики --- */
  const fast=Math.min(1,S.speed/MAXV);
  for(let i=0;i<NEAR;i++){
    const p=near[i];
    rotate(p);
    p.z-=travel;
    if(p.z<1.2){ seedNear(p,false); continue; }
    if(p.z>DEPTH+40){ seedNear(p,false); continue; }
    const k=F/p.z;
    const sx=cx+p.x*k, sy=cy+p.y*k;
    if(sx<-160||sx>W+160||sy<-160||sy>H+160){
      if(p.z<DEPTH*.35) seedNear(p,false);
      continue;
    }
    const z0=p.z+travel*streak*(1+S.boost*.5), k0=F/z0;
    const px=cx+p.x*k0, py=cy+p.y*k0;
    let a=p.b*Math.min(1,(DEPTH-p.z)/(DEPTH*.42))*Math.min(1,p.z/7);
    a*=.46+Math.min(1,fast)*.54;
    if(a<=.01) continue;
    const col=jumpK>.2?"186,214,255":(p.w===1?"255,212,164":p.w===2?"158,198,255":"228,240,255");
    const len=Math.hypot(sx-px,sy-py);
    if(len>1.4){
      ctx.strokeStyle="rgba("+col+","+(a*(.40+jumpK*.45)).toFixed(3)+")";
      ctx.lineWidth=Math.min(1.45,.34+k*.026)*(1+jumpK*.7);
      ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(sx,sy); ctx.stroke();
    }
    ctx.fillStyle="rgba("+col+","+a.toFixed(3)+")";
    ctx.beginPath(); ctx.arc(sx,sy,Math.min(1.6,.40+k*.028),0,6.2832); ctx.fill();
  }
  ctx.globalCompositeOperation="source-over";
  ctx.restore();

  /* --- пост: тоннель скорости, вспышка перехода, виньетка --- */
  const glow=Math.min(1,fast)*(1+S.boost)+jumpK*2.2;
  if(glow>.04){
    const gr=ctx.createRadialGradient(cx,cy,Math.min(W,H)*.16,cx,cy,Math.max(W,H)*.75);
    gr.addColorStop(0,"rgba(120,180,255,0)");
    gr.addColorStop(.62,"rgba(90,150,255,"+(glow*.05).toFixed(3)+")");
    gr.addColorStop(1,"rgba(150,190,255,"+Math.min(.85,glow*.13).toFixed(3)+")");
    ctx.globalCompositeOperation="lighter";
    ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation="source-over";
  }
  if(J.flash>.002){
    ctx.fillStyle="rgba(226,239,255,"+Math.min(1,J.flash).toFixed(3)+")";
    ctx.fillRect(0,0,W,H);
  }
  const vg=ctx.createRadialGradient(cx,cy,Math.min(W,H)*.28,cx,cy,Math.max(W,H)*.78);
  vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,2,.72)");
  ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

  /* --- HUD --- */
  if(typeof drawSysMap==="function") drawSysMap();
  if(typeof shipUpdate==="function") shipUpdate(dt,fast,S.boost,jumpK);
  if(typeof dockUpdate==="function") dockUpdate(dt);
  if(typeof audioUpdate==="function") audioUpdate(fast,S.boost,jumpK);
  spdEl.textContent=Math.round(S.speed*38).toLocaleString("ru-RU");
  fsdEl.classList.toggle("on",S.boost>.25||J.ph>0);
  fsdEl.textContent=J.ph?(J.ph===1?T("hud.charging"):J.ph===2?T("hud.witch"):T("hud.arrival")):T("hud.fsd");

  requestAnimationFrame(frame);
}
