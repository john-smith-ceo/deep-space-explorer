/* ================= класс светила по сиду =================
   Считается отдельным потоком случайных чисел, привязанным к сиду: класс
   нужно знать и в меню прыжка, и при постройке базы, не строя систему. */

function starTypeFor(seed){
  if(seed==="SOL") return SUN_TYPES.filter(x=>x.k===SOLAR.star.k)[0];
  if(seed.charAt(seed.length-1)!=="S") return null;
  const r=mulberry32(hashStr("STAR:"+seed));
  return SUN_TYPES[Math.floor(r()*SUN_TYPES.length)];
}
