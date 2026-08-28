/* Стартуем дома: сид SOL — наша система, выход из прыжка у Земли */
const fromHash=(location.hash||"").replace(/^#/,"").toUpperCase();
const startSeed = fromHash==="SOL" ? "SOL"
  : (fromHash.replace(/[^0-9A-FS]/g,"") || "SOL");
resize();                        // размеры кадра нужны раньше мира:
                                 // от них зависит расстояние до планеты прилёта
buildSector(startSeed);          // двадцать систем на старте
buildWorld(startSeed);
noteSystem();          // родная система сразу известна
setThrottle(.45);
requestAnimationFrame(t=>{last=t;requestAnimationFrame(frame)});
