/* ================= Солнечная система =================
   Наша система целиком, настоящими числами. Отдельный файл: сюда же лягут
   другие именованные системы, когда появятся. */

/* --- Солнечная система =======================================
   Стартовая система — наша, и цифры в ней настоящие: радиус в километрах,
   орбита в астрономических единицах, период обращения в сутках, сутки в
   часах, средняя температура в кельвинах. Выходим из прыжка у Земли. */
const SOLAR={
  star:{k:"G", name:"Солнце"},
  planets:[
    {name:"Меркурий", type:"iron",   radius:2440,  au:0.387, year:88,    day:1408, tempK:440, moons:0, rings:false},
    {name:"Венера",   type:"desert", radius:6052,  au:0.723, year:225,   day:5832, tempK:737, moons:0, rings:false},
    {name:"Земля",    type:"ocean",  radius:6371,  au:1.000, year:365,   day:24,   tempK:288, moons:1, rings:false, arrival:true, earth:true},
    {name:"Марс",     type:"desert", radius:3390,  au:1.524, year:687,   day:25,   tempK:210, moons:2, rings:false},
    {name:"Юпитер",   type:"gas",    radius:69911, au:5.204, year:4333,  day:10,   tempK:165, moons:95, rings:true},
    {name:"Сатурн",   type:"gas",    radius:58232, au:9.583, year:10759, day:11,   tempK:134, moons:146,rings:true},
    {name:"Уран",     type:"ice-g",  radius:25362, au:19.19, year:30687, day:17,   tempK:76,  moons:28, rings:true},
    {name:"Нептун",   type:"ice-g",  radius:24622, au:30.07, year:60190, day:16,   tempK:72,  moons:16, rings:true}
  ]
};
