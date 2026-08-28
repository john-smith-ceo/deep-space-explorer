/* Стартуем дома: сид SOL — наша система, выход из прыжка у Земли */
const fromHash=(location.hash||"").replace(/^#/,"").toUpperCase();
const startSeed = fromHash==="SOL" ? "SOL"
  : (fromHash.replace(/[^0-9A-FS]/g,"") || "SOL");
resize();                        // размеры кадра нужны раньше мира:
                                 // от них зависит расстояние до планеты прилёта
buildGalaxy(startSeed);          // весь мир строится один раз, здесь
buildWorld(GALAXY.systems[0].seed);
applyStaticLang();        // подписи в разметке — на выбранном языке
setThrottle(.45);
requestAnimationFrame(t=>{last=t;requestAnimationFrame(frame)});
