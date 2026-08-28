/* ================= язык =================
   По умолчанию английский: заставку смотрят не только дома. Русский
   переключается в меню по клавише P, выбор запоминается.

   Ключи плоские, без вложенности: словарь читается глазами целиком, а
   пропущенный ключ виден сразу — T() возвращает его как есть. */

const LANG_LIST=[["en","English"],["ru","Русский"]];
let LANG=(function(){
  try{ const s=localStorage.getItem("dse-lang"); if(s==="ru"||s==="en") return s; }catch(e){}
  return "en";
})();

const DICT={
  en:{
    "sys.solar":"SOLAR SYSTEM", "sys.system":"SYSTEM", "sys.noStar":"NO STAR",
    "star.fmt":"{k}-TYPE STAR", "star.none":"no star",
    "map.noStar":"NO STAR IN SYSTEM", "map.planets":"PLANETS",
    "hud.throttle":"THROTTLE", "hud.speed":"M/S",
    "hud.fsd":"FRAME SHIFT DRIVE", "hud.charging":"FSD CHARGING",
    "hud.witch":"WITCHSPACE", "hud.arrival":"ARRIVAL",
    "help.system":"system", "help.jump":"jump target", "help.lang":"language",
    "boot.sub1":"a drift through dust and stars",
    "boot.sub2":"arrows steer · wheel sets thrust · space boosts",
    "boot.sub3":"<b>J</b> — jump to a nearby system · <b>I</b> — system report",
    "boot.go":"Launch",
    "info.close":"close", "info.empty":"No planets here — only dust and the light of other stars.",
    "info.sector":"sector", "info.systems":"systems", "info.visited":"visited",
    "info.arrival":"arrival point", "info.radius":"radius", "info.orbit":"orbit",
    "info.day":"day", "info.year":"year", "info.temp":"temperature",
    "info.moons":"moons", "info.rings":"rings", "info.yes":"yes", "info.no":"none",
    "comms.head":"COMMS", "comms.freq":"frequency", "comms.mode":"mode",
    "comms.power":"power", "comms.orbit":"orbit", "comms.crew":"crew",
    "comms.delay":"delay", "comms.test":"channel check", "comms.station":"MIR Station",
    "comms.mode.v":"FM · duplex", "comms.freq.v":"143.625 MHz", "comms.outside":"outside sector",
    "jump.sub":"select target · range", "jump.hint":"↑ ↓ select · Enter jump · Esc cancel",
    "jump.home":"home · beacon", "jump.far":"out of range", "jump.visited":"visited",
    "jump.new":"unvisited", "jump.noStar":"no star", "jump.planets":"planets",
    "jump.noPlanets":"no planets", "jump.sectorCap":"sector",
    "u.ly":"ly", "u.au":"AU", "u.km":"km", "u.kkm":"thousand km", "u.d":"d",
    "u.yr":"yr", "u.h":"h", "u.s":"s", "u.ms":"ms", "u.min":"min", "u.ppm":"ppm",
    "u.usv":"µSv/h", "u.w":"W",
    "d.throttle":"THRUST", "d.speed":"SPEED", "d.reactor":"REACTOR", "d.fuel":"FUEL",
    "d.core":"REACTOR CORE", "d.drive":"DRIVE", "d.skin":"HULL SKIN", "d.hull":"HULL",
    "d.shield":"SHIELDS", "d.fsd":"FSD", "d.range":"RANGE", "d.wear":"SERVICE LIFE",
    "d.o2":"OXYGEN", "d.co2":"CARBON DIOXIDE", "d.grav":"GRAVITY", "d.rad":"RADIATION",
    "d.star":"TO STAR", "d.target":"TO TARGET", "d.home":"COMMS · HOME", "d.drift":"NAV DRIFT",
    "lang.title":"LANGUAGE", "lang.hint":"↑ ↓ select · Enter apply · Esc close",
    "snd.title":"SOUND", "snd.select":"select", "snd.reset":"reset",
    "p.rock":"rocky", "p.iron":"iron", "p.ice":"icy", "p.ocean":"ocean",
    "p.lava":"volcanic", "p.desert":"desert", "p.gas":"gas giant", "p.ice-g":"ice giant",
    "c.hydrogen":"hydrogen", "c.helium":"helium", "c.methane":"methane",
    "c.ammonia":"ammonia", "c.ice":"ice", "c.waterIce":"water ice",
    "c.ammoniaIce":"ammonia ice", "c.silicates":"silicates", "c.iron":"iron",
    "c.water":"water", "c.carbon":"carbon", "c.sulphur":"sulphur",
    "c.basalt":"basalt", "c.nickel":"nickel", "c.oxides":"oxides", "c.magnesium":"magnesium",
    "n.Меркурий":"Mercury", "n.Венера":"Venus", "n.Земля":"Earth", "n.Марс":"Mars",
    "n.Юпитер":"Jupiter", "n.Сатурн":"Saturn", "n.Уран":"Uranus", "n.Нептун":"Neptune",
    "n.Солнце":"Sun"
  },
  ru:{
    "sys.solar":"СОЛНЕЧНАЯ СИСТЕМА", "sys.system":"СИСТЕМА", "sys.noStar":"БЕЗ СВЕТИЛА",
    "star.fmt":"КЛАСС {k}", "star.none":"светила нет",
    "map.noStar":"СИСТЕМА БЕЗ СВЕТИЛА", "map.planets":"ПЛАНЕТ",
    "hud.throttle":"ТЯГА", "hud.speed":"М/С",
    "hud.fsd":"ГИПЕРПРИВОД", "hud.charging":"РАСКРУТКА ПРИВОДА",
    "hud.witch":"ГИПЕРПРОСТРАНСТВО", "hud.arrival":"ВЫХОД",
    "help.system":"система", "help.jump":"выбор цели", "help.lang":"язык",
    "boot.sub1":"полёт сквозь пыль и звёзды",
    "boot.sub2":"стрелки ведут курс · колесо задаёт тягу · пробел форсирует",
    "boot.sub3":"<b>J</b> — прыжок в соседнюю систему · <b>I</b> — сводка по системе",
    "boot.go":"Запустить полёт",
    "info.close":"закрыть", "info.empty":"Планет в этой системе нет — только пыль и свет чужих звёзд.",
    "info.sector":"сектор", "info.systems":"систем", "info.visited":"пройдено",
    "info.arrival":"точка прилёта", "info.radius":"радиус", "info.orbit":"орбита",
    "info.day":"сутки", "info.year":"год", "info.temp":"температура",
    "info.moons":"спутники", "info.rings":"кольца", "info.yes":"есть", "info.no":"нет",
    "comms.head":"СВЯЗЬ", "comms.freq":"частота", "comms.mode":"режим",
    "comms.power":"мощность", "comms.orbit":"орбита", "comms.crew":"экипаж",
    "comms.delay":"задержка", "comms.test":"проверка канала", "comms.station":"Станция МИР",
    "comms.mode.v":"FM · дуплекс", "comms.freq.v":"143,625 МГц", "comms.outside":"вне сектора",
    "jump.sub":"выбор цели · дальность", "jump.hint":"↑ ↓ выбор · Enter прыжок · Esc отмена",
    "jump.home":"дом · маяк", "jump.far":"вне дальности", "jump.visited":"пройдена",
    "jump.new":"не посещена", "jump.noStar":"без светила", "jump.planets":"планет",
    "jump.noPlanets":"планет нет", "jump.sectorCap":"сектор",
    "u.ly":"св. г.", "u.au":"а. е.", "u.km":"км", "u.kkm":"тыс. км", "u.d":"сут",
    "u.yr":"года", "u.h":"ч", "u.s":"с", "u.ms":"мс", "u.min":"мин", "u.ppm":"ppm",
    "u.usv":"мкЗв/ч", "u.w":"Вт",
    "d.throttle":"ТЯГА", "d.speed":"СКОРОСТЬ", "d.reactor":"РЕАКТОР", "d.fuel":"ТОПЛИВО",
    "d.core":"АКТИВНАЯ ЗОНА", "d.drive":"ДВИГАТЕЛЬ", "d.skin":"ОБШИВКА", "d.hull":"КОРПУС",
    "d.shield":"ЩИТЫ", "d.fsd":"ПРИВОД", "d.range":"ДАЛЬНОСТЬ", "d.wear":"РЕСУРС",
    "d.o2":"КИСЛОРОД", "d.co2":"УГЛЕКИСЛОТА", "d.grav":"ТЯЖЕСТЬ", "d.rad":"РАДИАЦИЯ",
    "d.star":"ДО СВЕТИЛА", "d.target":"ДО ЦЕЛИ", "d.home":"СВЯЗЬ · ДОМ", "d.drift":"СНОС НАВИГ.",
    "lang.title":"ЯЗЫК", "lang.hint":"↑ ↓ выбор · Enter принять · Esc закрыть",
    "snd.title":"ЗВУК", "snd.select":"выделить", "snd.reset":"сброс",
    "p.rock":"каменистая", "p.iron":"железная", "p.ice":"ледяная", "p.ocean":"океаническая",
    "p.lava":"вулканическая", "p.desert":"пустынная", "p.gas":"газовый гигант",
    "p.ice-g":"ледяной гигант",
    "c.hydrogen":"водород", "c.helium":"гелий", "c.methane":"метан",
    "c.ammonia":"аммиак", "c.ice":"лёд", "c.waterIce":"водяной лёд",
    "c.ammoniaIce":"аммиачный лёд", "c.silicates":"силикаты", "c.iron":"железо",
    "c.water":"вода", "c.carbon":"углерод", "c.sulphur":"сера",
    "c.basalt":"базальт", "c.nickel":"никель", "c.oxides":"оксиды", "c.magnesium":"магний",
    "n.Меркурий":"Меркурий", "n.Венера":"Венера", "n.Земля":"Земля", "n.Марс":"Марс",
    "n.Юпитер":"Юпитер", "n.Сатурн":"Сатурн", "n.Уран":"Уран", "n.Нептун":"Нептун",
    "n.Солнце":"Солнце"
  }
};

function T(key){
  const d=DICT[LANG]||DICT.en;
  return (key in d) ? d[key] : ((key in DICT.en) ? DICT.en[key] : key);
}

/* число с разделителем разрядов по правилам выбранного языка */
function TN(v){ return v.toLocaleString(LANG==="ru"?"ru-RU":"en-GB"); }

function setLang(code){
  if(!DICT[code]||code===LANG) return;
  LANG=code;
  try{ localStorage.setItem("dse-lang",code); }catch(e){}
  document.documentElement.lang=code;
  applyStaticLang();
  if(typeof syncStarPanelLang==="function") syncStarPanelLang();
  if(typeof syncSysInfo==="function") syncSysInfo();
  if(typeof dockRelabel==="function") dockRelabel();
  if(typeof buildJumpMenu==="function"&&typeof jumpOpen!=="undefined"&&jumpOpen) buildJumpMenu();
  if(typeof sysEl!=="undefined"&&sysEl&&typeof SEED!=="undefined") sysLabel();
}

/* надписи, которые лежат прямо в разметке */
function applyStaticLang(){
  const set=(id,txt)=>{ const e=document.getElementById(id); if(e) e.innerHTML=txt; };
  set("tlabel",T("hud.throttle"));
  set("uspeed",T("hud.speed"));
  set("boot1",T("boot.sub1"));
  set("boot2",T("boot.sub2"));
  set("boot3",T("boot.sub3"));
  set("go",T("boot.go"));
  set("help-i",T("help.system"));
  set("help-j",T("help.jump"));
  set("help-p",T("help.lang"));
}
