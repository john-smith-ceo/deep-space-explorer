/* ================= каталог объектов =================
   Всё, что может встретиться в системе помимо светила и планет: станции,
   маяки, обломки, аномалии, чужие корабли. Каждый объект — запись данных,
   а не код, и у каждого есть `where` — правила, где ему позволено быть.

   Движок ничего не знает про МИР. Он спрашивает у каталога: «что уместно в
   этой системе?» — и получает список. Добавить новый объект значит дописать
   запись сюда, а не править движок.

   Поля `where` (все необязательны, проверяются вместе):

     system     — сид системы, где объект есть. "SOL" или "A1B2C3S"
     notSystem  — где его точно нет
     requiresStar — true: только в системах со светилом
     starClass  — список классов светила: ["G","K"]
     planet     — имя планеты, у которой объект висит; система должна её иметь
     planetType — типы планет, при которых объект уместен: ["ocean","desert"]
     minPlanets / maxPlanets — сколько планет должно быть в системе
     chance     — доля систем, где объект встречается: 0…1. Бросок
                  детерминирован сидом и идентификатором объекта, поэтому
                  одна и та же система всегда даёт один и тот же ответ

   Поле `kind` определяет, кто объект использует: "station" — связь и сводка,
   дальше появятся "beacon", "wreck", "anomaly", "ship". */

const OBJECTS=[
  {
    id:"mir",
    kind:"station",
    nameKey:"comms.station",
    icon:"station",
    where:{ system:"SOL", planet:"Земля" },
    comms:{
      call:"MIR-1",
      freqKey:"comms.freq.v",
      modeKey:"comms.mode.v",
      power:5,
      orbitKm:390,
      incl:51.6,
      crew:3,
      voice:"mir"                       // ключ записи ответа в EARTH_MAPS
    }
  }
];

/* Бросок, привязанный к системе и объекту: одна и та же система всегда даёт
   один и тот же ответ, и он не зависит от того, в каком порядке мы летали. */
function objectRoll(id,seed){
  return mulberry32(hashStr("OBJ:"+id+":"+seed))();
}

function objectFits(o,ctx){
  const w=o.where||{};
  if(w.system && w.system!==ctx.seed) return false;
  if(w.notSystem && [].concat(w.notSystem).indexOf(ctx.seed)>=0) return false;
  if(w.requiresStar && !ctx.star) return false;
  if(w.starClass && (!ctx.star || w.starClass.indexOf(ctx.star.k)<0)) return false;
  if(w.planet && ctx.planetNames.indexOf(w.planet)<0) return false;
  if(w.planetType && !ctx.planetTypes.some(t=>w.planetType.indexOf(t)>=0)) return false;
  if(w.minPlanets!==undefined && ctx.planetCount<w.minPlanets) return false;
  if(w.maxPlanets!==undefined && ctx.planetCount>w.maxPlanets) return false;
  if(w.chance!==undefined && objectRoll(o.id,ctx.seed)>w.chance) return false;
  return true;
}

/* Что уместно в системе, где мы стоим. Вызывается после сборки мира —
   правилам нужны и светило, и список планет. */
function objectsHere(kind){
  if(typeof SEED==="undefined") return [];
  const ctx={
    seed:SEED,
    star:(typeof sun!=="undefined")?sun&&sun.t:null,
    planetCount:(typeof planets!=="undefined"&&planets)?planets.list.length:0,
    planetNames:(typeof planets!=="undefined"&&planets)?planets.list.map(p=>p.name):[],
    planetTypes:(typeof planets!=="undefined"&&planets)?planets.list.map(p=>p.t.k):[]
  };
  return OBJECTS.filter(o=>(!kind||o.kind===kind)&&objectFits(o,ctx));
}
