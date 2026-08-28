/* ================= связь =================
   Проверка канала звучит так, как звучит настоящая дуплексная гарнитура:
   щелчок тангенты, шип открытого эфира, живой человек прокашливается, речь,
   и на отпускании — второй щелчок с коротким хвостом шума.

   Обе реплики синтезированы офлайн (piper) и обработаны под полосу рации.
   Наш голос — ryan, понижен на три с половиной полутона и расширен книзу до
   двухсот герц: так он звучит басовитее и глубже. Ответ станции — русская
   модель dmitri, читающая английский текст: фонемизация идёт по-русски, и
   акцент получается сам собой, без подделки. Его канал уже и тише — сигнал
   приходит издалека, и это слышно по звуку, а не по надписи.

   Кашель и щелчки не записаны, а собраны здесь: короткий шумовой всплеск с
   резкой атакой — это и есть щелчок реле, а два всплеска пониже с полосой
   около 700 Гц слышатся как покашливание. */

const COMMS={busy:false, buf:{}, loading:{}};

/* Каналы не заданы здесь: движок спрашивает каталог объектов, какие станции
   уместны в этой системе. Про МИР он не знает — знает только то, что
   объекты вида "station" умеют разговаривать. */
function commsChannels(){
  return (typeof objectsHere==="function" ? objectsHere("station") : [])
    .filter(o=>o.comms);
}

function commsNoiseBuf(ctx,sec){
  const len=Math.floor(ctx.sampleRate*sec), b=ctx.createBuffer(1,len,ctx.sampleRate);
  const d=b.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
  return b;
}

/* Щелчок тангенты: миллисекунды шума с резким спадом плюс призвук реле.
   Верх срезан вдвое ниже прежнего — щелчок должен быть глухим стуком в
   наушнике, а не цоканьем; громкость тоже вдвое меньше. */
function commsClick(at,up){
  const ctx=SND.ctx; if(!ctx) return;
  const src=ctx.createBufferSource(); src.buffer=commsNoiseBuf(ctx,.06);
  const hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=up?800:620;
  const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=2200; lp.Q.value=.8;
  const g=ctx.createGain();
  g.gain.setValueAtTime(up?.08:.11,at);
  g.gain.exponentialRampToValueAtTime(.0001,at+(up?.038:.052));   // спад длиннее — гулче
  src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(ctx.destination);
  src.start(at); src.stop(at+.08);

  const o=ctx.createOscillator(); o.type="square"; o.frequency.value=up?1500:1050;
  const og=ctx.createGain();
  og.gain.setValueAtTime(.025,at);
  og.gain.exponentialRampToValueAtTime(.0001,at+.016);
  o.connect(og); og.connect(ctx.destination);
  o.start(at); o.stop(at+.024);
}

/* Открытый эфир: шум, живущий, пока канал открыт. Полоса опущена с полутора
   килогерц до семисот и сужена — вместо шипения выходит гул в наушнике; над
   ней ещё один срез, чтобы верх не пролезал. Громкость вдвое меньше прежней. */
function commsHiss(at,dur){
  const ctx=SND.ctx; if(!ctx) return;
  const src=ctx.createBufferSource(); src.buffer=commsNoiseBuf(ctx,Math.max(1,dur+1));
  const bp=ctx.createBiquadFilter(); bp.type="bandpass";
  bp.frequency.value=720; bp.Q.value=.38;
  const lp=ctx.createBiquadFilter(); lp.type="lowpass";
  lp.frequency.value=1600; lp.Q.value=.7;
  const g=ctx.createGain();
  g.gain.setValueAtTime(.0001,at);
  g.gain.linearRampToValueAtTime(.015,at+.04);
  g.gain.setValueAtTime(.015,at+dur);
  g.gain.linearRampToValueAtTime(.0001,at+dur+.26);   // хвост после отпускания
  src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(ctx.destination);
  src.start(at); src.stop(at+dur+.45);
}

/* покашливание: два всплеска, второй короче и тише */
function commsCough(at){
  const ctx=SND.ctx; if(!ctx) return;
  [[0,.20,700,.16],[.30,.14,620,.11]].forEach(([off,dur,hz,amp])=>{
    const t=at+off;
    const src=ctx.createBufferSource(); src.buffer=commsNoiseBuf(ctx,dur+.1);
    const bp=ctx.createBiquadFilter(); bp.type="bandpass";
    bp.frequency.value=hz; bp.Q.value=1.4;
    const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=2600;
    const g=ctx.createGain();
    g.gain.setValueAtTime(.0001,t);
    g.gain.linearRampToValueAtTime(amp,t+.012);        // резкая атака
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t+dur+.05);
    // низкая составляющая: грудь, а не только горло
    const o=ctx.createOscillator(); o.type="triangle"; o.frequency.value=118;
    const og=ctx.createGain();
    og.gain.setValueAtTime(.0001,t);
    og.gain.linearRampToValueAtTime(amp*.5,t+.015);
    og.gain.exponentialRampToValueAtTime(.0001,t+dur*.8);
    o.connect(og); og.connect(ctx.destination);
    o.start(t); o.stop(t+dur);
  });
}

function commsDecode(key,cb){
  if(COMMS.buf[key]) return cb(COMMS.buf[key]);
  if(COMMS.loading[key]||typeof EARTH_MAPS==="undefined"||!EARTH_MAPS[key]) return;
  COMMS.loading[key]=true;
  fetch(EARTH_MAPS[key]).then(r=>r.arrayBuffer()).then(a=>
    SND.ctx.decodeAudioData(a,b=>{ COMMS.buf[key]=b; COMMS.loading[key]=false; cb(b); },
      ()=>{ COMMS.loading[key]=false; })
  ).catch(()=>{ COMMS.loading[key]=false; });
}

/* проиграть готовую запись через полосу гарнитуры */
function commsSay(buf,at,gain,hz,q){
  const ctx=SND.ctx;
  const src=ctx.createBufferSource(); src.buffer=buf;
  const bp=ctx.createBiquadFilter(); bp.type="bandpass";
  bp.frequency.value=hz; bp.Q.value=q;
  const g=ctx.createGain(); g.gain.value=gain;
  src.connect(bp); bp.connect(g); g.connect(ctx.destination);
  src.start(at);
  return buf.duration;
}

/* Весь обмен одной командой: наш запрос и ответ станции. Ответ идёт через
   более узкую полосу и тише — он приходит издалека, и слышно это по звуку,
   а не по надписи. */
function commsCheck(){
  if(!SND.ctx) audioStart();
  if(!SND.ctx||COMMS.busy) return false;
  const ctx=SND.ctx;
  COMMS.busy=true;
  const ch=commsChannels()[0];
  commsDecode("voice",buf=>{
    const t0=ctx.currentTime+.05;
    const ours=buf.duration+1.05;
    commsClick(t0,true);
    commsHiss(t0+.02,ours);
    commsCough(t0+.22);
    commsSay(buf,t0+.95,.62,1100,.32);           // наш голос: ниже и тише
    commsClick(t0+ours,false);

    commsDecode(ch?ch.comms.voice:"mir",mir=>{
      const t1=t0+ours+.85;                      // пауза: станция отвечает не сразу
      const theirs=mir.duration+.35;
      commsClick(t1,true);
      commsHiss(t1+.02,theirs);
      commsSay(mir,t1+.22,.52,1350,.55);         // канал дальний: полоса уже
      commsClick(t1+theirs,false);
      setTimeout(()=>{ COMMS.busy=false; },(ours+theirs+1.6)*1000);
    });
  });
  return true;
}
