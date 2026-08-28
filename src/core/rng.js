/* ================= случайность с сидом =================
   Весь мир выводится из одной строки. Одинаковый seed — одинаковое небо
   на любой машине, поэтому систему можно записать и вернуться в неё. */

function mulberry32(a){
  return function(){
    a|=0; a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
function hashStr(s){
  let h=2166136261;
  for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
  return h>>>0;
}
function newSeed(withStar){
  let s="";
  for(let i=0;i<6;i++) s+="0123456789ABCDEF"[Math.floor(Math.random()*16)];
  return withStar ? s+"S" : s;              // суффикс S — в системе есть звезда
}
let rnd=Math.random;                        // подменяется на сидированный при сборке мира
