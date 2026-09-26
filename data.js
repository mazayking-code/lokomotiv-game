// Geographic anchors: WGS84 city centres, not railway platform survey points.
// All operational properties below are fictional scenario parameters. See SOURCES.md.
export const STATIONS = [
  { id:'aktau', name:'Актау', lat:43.66105, lon:51.17392, level:2, kind:'port' },
  { id:'atyrau', name:'Атырау', lat:47.10480, lon:51.88427, level:2, kind:'oil' },
  { id:'aktobe', name:'Актобе', lat:50.27969, lon:57.20718, level:2, kind:'industry' },
  { id:'oral', name:'Уральск', lat:51.24601, lon:51.42558, level:1, kind:'city' },
  { id:'kostanay', name:'Костанай', lat:53.21435, lon:63.62463, level:2, kind:'grain' },
  { id:'petropavl', name:'Петропавловск', lat:54.87343, lon:69.15065, level:2, kind:'gateway' },
  { id:'kokshetau', name:'Кокшетау', lat:53.28414, lon:69.39364, level:1, kind:'grain' },
  { id:'astana', name:'Астана', lat:51.18010, lon:71.44598, level:3, kind:'capital' },
  { id:'pavlodar', name:'Павлодар', lat:52.27601, lon:76.96881, level:2, kind:'industry' },
  { id:'semey', name:'Семей', lat:50.42064, lon:80.25025, level:2, kind:'city' },
  { id:'oskemen', name:'Усть-Каменогорск', lat:49.97143, lon:82.60586, level:1, kind:'industry' },
  { id:'karaganda', name:'Караганда', lat:49.80187, lon:73.10211, level:2, kind:'coal' },
  { id:'zhezkazgan', name:'Жезказган', lat:47.79411, lon:67.70628, level:1, kind:'industry' },
  { id:'saksaul', name:'Саксаульская', lat:47.08152, lon:61.15239, level:1, kind:'junction' },
  { id:'kyzylorda', name:'Кызылорда', lat:44.85278, lon:65.50917, level:2, kind:'city' },
  { id:'shymkent', name:'Шымкент', lat:42.30988, lon:69.60042, level:2, kind:'industry' },
  { id:'taraz', name:'Тараз', lat:42.89799, lon:71.37334, level:1, kind:'city' },
  { id:'shu', name:'Шу', lat:43.59833, lon:73.76139, level:1, kind:'junction' },
  { id:'almaty', name:'Алматы', lat:43.25249, lon:76.91150, level:2, kind:'city' },
  { id:'aktogay', name:'Актогай', lat:46.95068, lon:79.67621, level:1, kind:'junction' },
  { id:'dostyk', name:'Достык', lat:45.25500, lon:82.48783, level:1, kind:'gateway' },
  { id:'altynkol', name:'Алтынколь', lat:44.16472, lon:80.29515, level:1, kind:'gateway' },
];

// An edge is a simplified existing transport direction, often several real sections.
// `via` discloses major omitted junctions; this is NOT a claim of a direct railway.
// Tracks, electrification, condition and km are GAME parameters, not KTZ data.
const edge = (a,b,electrified,tracks,condition,via='') => ({ id:`${a}-${b}`, a,b,electrified,tracks,condition,via,existing:true });
export const LINES = [
  edge('atyrau','aktau',false,1,79,'Макат → Бейнеу → Мангистау'),
  edge('aktobe','atyrau',false,1,76,'Кандыагаш → Макат'),
  {...edge('oral','aktobe',false,1,83,'Илецк; реальное направление проходит через РФ'),foreignTransit:true},
  edge('aktobe','kostanay',false,1,80,'Кандыагаш → Никельтау → Тобол'),
  edge('kostanay','astana',true,1,83,'Тобол → Есиль → Атбасар'),
  edge('petropavl','kokshetau',true,1,84,'Тайынша'),
  edge('kokshetau','astana',true,2,88,'Курорт-Боровое → Макинск'),
  edge('astana','pavlodar',true,1,82,'Ерейментау → Экибастуз'),
  edge('pavlodar','semey',false,1,76,'Аксу → Дегелен'),
  edge('semey','oskemen',false,1,78,'Шар'),
  edge('semey','aktogay',false,1,79,'Шар → Аягоз'),
  edge('karaganda','astana',true,1,52,'Сороковая'),
  edge('karaganda','zhezkazgan',false,1,75,'Жарык → Жанаарка'),
  edge('karaganda','shu',true,1,82,'Мойынты → Сарышаган'),
  edge('karaganda','aktogay',false,1,77,'Мойынты → Балхаш → Саяк'),
  edge('zhezkazgan','saksaul',false,1,81,'Байконыр → Косколь'),
  edge('saksaul','aktobe',false,1,74,'Шалкар → Кандыагаш'),
  edge('saksaul','aktau',false,1,78,'Шалкар → Бейнеу → Мангистау'),
  edge('kyzylorda','saksaul',false,1,80,'Казалы → Аральск'),
  edge('shymkent','kyzylorda',false,1,79,'Арысь → Туркестан'),
  edge('taraz','shymkent',true,1,85,'Тюлькубас'),
  edge('shu','taraz',true,1,84,'Луговая'),
  edge('almaty','shu',true,1,86,'Отар'),
  edge('altynkol','almaty',false,1,78,'Жетыген'),
  edge('almaty','aktogay',false,1,80,'Жетыген → Уштобе → Матай'),
  edge('dostyk','aktogay',false,1,76,'Жаланашколь → Бесколь'),
];

// Original hand-drawn visual silhouette, deliberately simplified; [longitude,latitude].
// Not a surveyed or legally authoritative border and not used as source railway geometry.
export const OUTLINE = [
  [46.5,48.5],[47.5,49.0],[46.9,50.0],[48.2,50.4],[49.3,51.5],
  [50.8,51.7],[51.6,51.2],[53.7,51.9],[54.7,50.7],[56.5,51.2],
  [57.8,51.1],[58.7,51.8],[59.5,50.9],[60.8,52.0],[61.2,53.2],
  [62.1,54.0],[64.3,54.1],[65.4,54.8],[67.0,54.5],[68.2,55.4],
  [70.7,55.2],[71.5,54.1],[73.6,54.0],[74.4,53.4],[76.2,54.1],
  [77.9,53.2],[79.1,51.5],[80.1,50.7],[81.4,50.8],[82.7,51.3],
  [84.1,50.5],[85.2,49.6],[86.7,49.6],[87.3,49.1],[85.8,48.4],
  [85.6,47.3],[84.5,46.6],[83.0,47.0],[82.2,45.6],[82.6,45.0],
  [80.5,44.9],[80.8,43.3],[80.0,42.2],[78.4,42.9],[77.0,42.9],
  [75.5,42.4],[74.2,43.0],[73.2,42.3],[71.9,42.9],[70.9,42.0],
  [69.0,41.0],[68.2,41.2],[68.1,42.5],[66.1,43.0],[64.4,43.6],
  [62.0,45.1],[60.0,45.0],[58.5,45.6],[56.0,45.1],[56.0,41.4],
  [54.0,42.1],[52.8,41.8],[52.6,42.8],[50.5,43.0],[50.3,44.4],
  [51.5,44.6],[51.0,45.6],[52.2,46.2],[51.2,47.0],[49.1,46.7],
  [48.2,47.2],[47.0,47.3],
];

export const GEOGRAPHY_NOTE = 'Координаты городских узлов: GeoNames (CC BY 4.0), Wikidata (CC0). Сеть — схема направлений; промежуточные узлы опущены. Состояние, пути и мощности — игровые.';
