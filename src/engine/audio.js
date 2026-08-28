/* ================= звук реактора =================
   Не двигатель, а плазменный контур за переборкой. Основа — гул, а не шум:
   шум ушёл в подложку, тон вышел вперёд.

   — никаких биений. Пилы, расстроенные на пару герц, дают амплитудную
     пульсацию, и ухо слышит в ней винт. Здесь синусы, расстройка ниже сотой
     герца;
   — вибрация вместо пульсации: мелкая дрожь корпуса — на семнадцати герцах
     это уже тембр, а не ритм. Медленное качание в принятых настройках
     выключено: на слух оно читалось биением;
   — эхо отсека: свёртка с процедурным импульсом, ранние отражения плюс
     затухающий хвост. Без него звук звучит «в наушниках», а не в корпусе;
   — лёгкие перемены: три медленных LFO с несоизмеримыми периодами водят
     фильтр, резонанс и расстройку. Ничего не повторяется, но и ритма нет;
   — тихо: звук должен ощущаться, а не звучать.

   Настройки — SOUND в config.js, панель по клавише K. */

const SND={ctx:null, on:true, ready:false};

/* импульс отсека: ранние отражения от переборок плюс шумовой хвост */
function makeIR(ctx,sec,decay){
  const len=Math.max(1,Math.floor(ctx.sampleRate*sec));
  const b=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let ch=0;ch<2;ch++){
    const d=b.getChannelData(ch);
    for(let i=0;i<len;i++){
      const t=i/len;
      d[i]=(Math.random()*2-1)*Math.pow(1-t,decay)*.6;
    }
    [[.009,.7],[.017,-.5],[.028,.42],[.041,-.3],[.063,.22]].forEach(([tt,a],k)=>{
      const idx=Math.floor(tt*(1+ch*.13)*ctx.sampleRate);
      if(idx<len) d[idx]+=a;
    });
  }
  return b;
}

function audioBuild(ctx,dest){
  const S={};
  const out=ctx.createGain();
  out.gain.value=0.0001;
  S.out=out;

  /* эхо отсека: часть сигнала уходит в свёртку */
  const conv=ctx.createConvolver();
  conv.buffer=makeIR(ctx,SOUND.echoSec,SOUND.echoDecay);
  const send=ctx.createGain(); send.gain.value=SOUND.echo;
  const wet=ctx.createGain(); wet.gain.value=1;
  out.connect(dest||ctx.destination);
  out.connect(send); send.connect(conv); conv.connect(wet);
  wet.connect(dest||ctx.destination);
  S.conv=conv; S.send=send;

  /* --- контур: тон, гармоника, полуторная и подтон, все синусом --- */
  const mk=(hz,g)=>{
    const o=ctx.createOscillator(); o.type="sine"; o.frequency.value=hz;
    const gn=ctx.createGain(); gn.gain.value=g;
    o.connect(gn); gn.connect(out); o.start();
    return [o,gn];
  };
  [S.core,S.coreG]=mk(SOUND.coreHz, SOUND.core);
  [S.harm,S.harmG]=mk(SOUND.coreHz*2.004, SOUND.harm);
  [S.fifth,S.fifthG]=mk(SOUND.coreHz*1.5017, SOUND.fifth);
  [S.sub,S.subG]=mk(SOUND.coreHz*.5, SOUND.sub);

  /* --- шум плазмы: розовый, приглушённый обшивкой --- */
  const len=ctx.sampleRate*3, buf=ctx.createBuffer(1,len,ctx.sampleRate);
  const d=buf.getChannelData(0);
  let b0=0,b1=0,b2=0;
  for(let i=0;i<len;i++){
    const w=Math.random()*2-1;
    b0=.997*b0+w*.0555; b1=.985*b1+w*.0750; b2=.950*b2+w*.1538;
    d[i]=(b0+b1+b2+w*.02)*.35;
  }
  const noise=ctx.createBufferSource();
  noise.buffer=buf; noise.loop=true;

  const skin=ctx.createBiquadFilter();
  skin.type="lowpass"; skin.frequency.value=SOUND.cutoff; skin.Q.value=.5;
  const noiseG=ctx.createGain(); noiseG.gain.value=SOUND.noise;
  noise.connect(skin); skin.connect(noiseG); noiseG.connect(out);

  const body=ctx.createBiquadFilter();
  body.type="bandpass"; body.frequency.value=SOUND.bodyHz; body.Q.value=3.2;
  const bodyG=ctx.createGain(); bodyG.gain.value=SOUND.body;
  noise.connect(body); body.connect(bodyG); bodyG.connect(out);

  const hiss=ctx.createBiquadFilter();
  hiss.type="highpass"; hiss.frequency.value=4200; hiss.Q.value=.7;
  const hissG=ctx.createGain(); hissG.gain.value=SOUND.hiss;
  noise.connect(hiss); hiss.connect(hissG); hissG.connect(out);
  noise.start();
  S.skin=skin; S.noiseG=noiseG; S.body=body; S.bodyG=bodyG; S.hissG=hissG;

  /* --- вибрация корпуса: качание и мелкая дрожь, обе на общий уровень --- */
  const lfo=(hz,depth,target)=>{
    const o=ctx.createOscillator(); o.type="sine"; o.frequency.value=hz;
    const g=ctx.createGain(); g.gain.value=depth;
    o.connect(g); g.connect(target); o.start();
    return [o,g];
  };
  [S.vib,S.vibG]=lfo(SOUND.vibHz, SOUND.vib*SOUND.master, out.gain);
  [S.shake,S.shakeG]=lfo(SOUND.shakeHz, SOUND.shake*SOUND.master, out.gain);

  /* --- лёгкие перемены: три медленных водителя, периоды несоизмеримы --- */
  [S.slowA,S.slowAG]=lfo(SOUND.slowA, SOUND.cutoff*.30, skin.frequency);
  [S.slowB,S.slowBG]=lfo(SOUND.slowB, SOUND.bodyHz*.22, body.frequency);
  [S.slowC,S.slowCG]=lfo(SOUND.slowC, SOUND.coreHz*.012, S.core.frequency);
  return S;
}

function audioStart(){
  if(SND.ctx||!SND.on) return;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) return;
  const ctx=new AC();
  SND.ctx=ctx;
  const g=audioBuild(ctx);
  for(const k in g) SND[k]=g[k];
  SND.ready=true;
  audioLevel(SOUND.master*.5);
}

/* применить настройки целиком — панель зовёт это на каждое движение ползунка */
function audioApply(rebuildIR){
  if(!SND.ready) return;
  const t=SND.ctx.currentTime, set=(p,v)=>p.setTargetAtTime(v,t,.05);
  set(SND.coreG.gain,SOUND.core); set(SND.harmG.gain,SOUND.harm);
  set(SND.fifthG.gain,SOUND.fifth); set(SND.subG.gain,SOUND.sub);
  set(SND.noiseG.gain,SOUND.noise); set(SND.bodyG.gain,SOUND.body);
  set(SND.hissG.gain,SOUND.hiss);
  set(SND.core.frequency,SOUND.coreHz); set(SND.harm.frequency,SOUND.coreHz*2.004);
  set(SND.fifth.frequency,SOUND.coreHz*1.5017); set(SND.sub.frequency,SOUND.coreHz*.5);
  set(SND.skin.frequency,SOUND.cutoff); set(SND.body.frequency,SOUND.bodyHz);
  set(SND.vib.frequency,SOUND.vibHz); set(SND.vibG.gain,SOUND.vib*SOUND.master);
  set(SND.shake.frequency,SOUND.shakeHz); set(SND.shakeG.gain,SOUND.shake*SOUND.master);
  set(SND.slowA.frequency,SOUND.slowA); set(SND.slowB.frequency,SOUND.slowB);
  set(SND.slowC.frequency,SOUND.slowC);
  set(SND.send.gain,SOUND.echo);
  if(rebuildIR) SND.conv.buffer=makeIR(SND.ctx,SOUND.echoSec,SOUND.echoDecay);
}

/* один вызов на кадр: тяга поднимает контур, форсаж приоткрывает переборку */
function audioUpdate(load,boost,jump){
  if(!SND.ready||!SND.on) return;
  const t=SND.ctx.currentTime, k=.35;
  const set=(p,v)=>p.setTargetAtTime(v,t,k);
  const drive=load*.75+boost*.25;
  set(SND.out.gain, SOUND.master*(.42+.58*drive)+jump*SOUND.master*1.1);
  set(SND.core.frequency, SOUND.coreHz*(1+drive*.34+jump*.5));
  set(SND.harm.frequency, SOUND.coreHz*2.004*(1+drive*.34+jump*.5));
  set(SND.fifth.frequency, SOUND.coreHz*1.5017*(1+drive*.34+jump*.5));
  set(SND.sub.frequency, SOUND.coreHz*.5*(1+drive*.22));
  set(SND.subG.gain, SOUND.sub*(1+boost*.8));
  set(SND.skin.frequency, SOUND.cutoff*(1+drive*1.5+jump*4.5));
  set(SND.noiseG.gain, SOUND.noise*(.6+drive*.9+jump*1.6));
  set(SND.bodyG.gain, SOUND.body*(.7+drive*.8));
  set(SND.hissG.gain, SOUND.hiss*(.5+drive*1.4+jump*3));
  set(SND.vibG.gain, SOUND.vib*SOUND.master*(.6+drive*1.2+jump*2));
}

function audioLevel(v){
  if(SND.ready) SND.out.gain.setTargetAtTime(v,SND.ctx.currentTime,.3);
}

/* Шумоподавление: гасит контур, оставляя тишину в гарнитуре. Названо так,
   как это называется на борту, — глушится ведь не звук вообще, а фон
   реактора, который слышно через переборку. */
function noiseCancel(){
  SND.on=!SND.on;
  if(!SND.on) audioLevel(0.0001);
  else if(!SND.ctx) audioStart();
  else audioLevel(SOUND.master*.5);
  return !SND.on;                      // true — подавление включено
}
