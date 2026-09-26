import {STATIONS, LINES, OUTLINE} from './data.js';
import {BALANCE as B, FLEET_TYPES, LEVELS, CARGO, BASE_CONTRACTS, OFFER_TEMPLATES, ILLEGAL_OFFER} from './balance.js';
import {money} from './format.js';
export {BALANCE, FLEET_TYPES, LEVELS, CARGO} from './balance.js';
export const SAVE_KEY = 'railway-kazakhstan-v3';
export const DAMAGED_SAVE_KEY = `${SAVE_KEY}-damaged-backup`;
const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const round = n => Math.round(n * 10) / 10;
const fail = message => ({ok:false,message});
const success = (message,extra={}) => ({ok:true,message,...extra});
const finite = n => typeof n==='number' && Number.isFinite(n);
const PROJECT_COST = B.projects, NEGOTIATION = B.negotiation, EVENTS = B.events;
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;}
function haversine(a,b){const r=Math.PI/180, dlat=(b.lat-a.lat)*r,dlon=(b.lon-a.lon)*r;return 6371*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlon/2)**2)));}
const asset = (s,id) => s.stations.find(x=>x.id===id);
const line = (s,id) => s.lines.find(x=>x.id===id);
const assetCondition = a => .4+.6*clamp(a.condition,0,100)/100;
const active = (c,s) => c.start<=s.quarter && c.end>s.quarter && !c.frozen;
function fleetPower(f){return f.capacity * assetCondition(f) * (f.age>=f.life?B.expiredFleetCapacity:1);}
function uid(s,prefix){s.nextId+=1;return `${prefix}-${s.nextId}`;}
function ensurePlayable(s){return s.status==='playing'||s.status==='won';}
export function engineerLevel(s){return LEVELS.filter(x=>s.xp>=x.xp).at(-1)?.level||1;}
export function engineerProfile(s){const level=engineerLevel(s);return {...LEVELS[level-1],nextXp:LEVELS[level]?.xp??null,xp:s.xp,levels:LEVELS,achievements:s.achievements};}
export function stationCapacity(s,id){const st=asset(s,id);if(!st)return 0;const construction=s.projects.some(p=>p.target===id&&['upgrade','stationRepair'].includes(p.type));return round(B.stationCapacity[st.level]*assetCondition(st)*(construction?PROJECT_COST.stationWorkCapacity:1));}
function lineCapacity(s,l,event){const construction=s.projects.some(p=>p.target===l.id&&p.type!=='newLine');return round(B.lineCapacity*l.tracks*assetCondition(l)*(construction?PROJECT_COST.lineWorkCapacity:1)*(event?.type==='restriction'&&event.target===l.id?EVENTS.restrictionCapacity:1));}

export function createGame(){
  const s={version:B.version,quarter:B.startingQuarter,startedQuarter:B.startingQuarter,budget:B.initialBudget,quarterOpeningBudget:B.initialBudget,xp:0,reputation:B.initialReputation,debt:0,insolvencyQuarters:0,totalTransport:0,status:'playing',seed:732019,nextId:20,stations:clone(STATIONS),lines:clone(LINES),fleet:[],contracts:[],projects:[],offers:[],reports:[],achievements:[],pendingSpend:0,wonAt:null,illegalAccepted:0,convictions:0,offerQuarter:null};
  for(const st of s.stations){st.level=st.level||(['astana'].includes(st.id)?3:['almaty','karaganda','aktobe','shymkent','atyrau'].includes(st.id)?2:1);st.condition=st.condition??88;}
  for(const l of s.lines){l.tracks=l.tracks||1;l.condition=l.condition??88;l.distance=l.distance||Math.round(haversine(asset(s,l.a),asset(s,l.b))*1.12);l.electrified=!!l.electrified;l.playerBuilt=false;}
  const bottleneck=line(s,'karaganda-astana');if(bottleneck){bottleneck.condition=38;bottleneck.tracks=1;}
  for(const [i,type] of ['diesel','diesel','coal','oil','goods'].entries())s.fleet.push({id:`fleet-${i+1}`,type,...clone(FLEET_TYPES[type]),condition:91,age:5});
  s.contracts=BASE_CONTRACTS.map(c=>({...clone(c),start:B.startingQuarter,end:Number.MAX_SAFE_INTEGER,base:true}));refreshOffers(s);return s;
}

// Up to four physically distinct simple paths; Dijkstra penalizes previous edges.
function findPath(s,a,b,edgeCapacity,stationCaps,penalties={},electricOnly=false){
  if(!asset(s,a)||!asset(s,b)||a===b)return null;
  const dist={[a]:0},prev={},visited=new Set();
  while(true){let current=null,best=Infinity;for(const id in dist){if(!visited.has(id)&&dist[id]<best){best=dist[id];current=id;}}if(current===null)return null;if(current===b)break;visited.add(current);
    for(const l of s.lines){if(l.a!==current&&l.b!==current)continue;if(electricOnly&&!l.electrified)continue;const next=l.a===current?l.b:l.a;if(visited.has(next)||(edgeCapacity&&edgeCapacity[l.id]<=.01)||(stationCaps&&stationCaps[next]<=.01))continue;const weight=l.distance*(1+(penalties[l.id]||0));const value=best+weight;if(value<(dist[next]??Infinity)){dist[next]=value;prev[next]={node:current,line:l.id};}}
  }
  const stations=[b],lines=[];let cur=b;while(cur!==a){const p=prev[cur];if(!p)return null;lines.unshift(p.line);stations.unshift(p.node);cur=p.node;}
  return {stations,lines,distance:round(lines.reduce((n,id)=>n+line(s,id).distance,0)),electrified:lines.every(id=>line(s,id).electrified)};
}
export function routeInfo(s,a,b,cargo='goods'){
  const route=findPath(s,a,b);if(!route)return null;
  const capacities=route.lines.map(id=>({id,name:`${asset(s,line(s,id).a).name} — ${asset(s,line(s,id).b).name}`,capacity:lineCapacity(s,line(s,id))})).concat(route.stations.map(id=>({id,name:asset(s,id).name,capacity:stationCapacity(s,id)})));
  const bottleneck=capacities.reduce((a,b)=>a.capacity<b.capacity?a:b);return {...route,capacity:round(bottleneck.capacity),bottleneck,cargo};
}
export function forecast(s,options={}){
  const event=options.event,edgeLoads={},stationLoads={},edgeFree={},stationFree={},fleetFree={};
  for(const l of s.lines){const capacity=lineCapacity(s,l,event);edgeLoads[l.id]={load:0,capacity,ratio:0};edgeFree[l.id]=capacity;}
  for(const st of s.stations){const capacity=stationCapacity(s,st.id);stationLoads[st.id]={load:0,capacity,ratio:0,revenue:0};stationFree[st.id]=capacity;}
  for(const [type] of Object.entries(FLEET_TYPES))fleetFree[type]=s.fleet.filter(f=>f.type===type).reduce((n,f)=>n+fleetPower(f)*(event?.type==='breakdown'&&event.target===f.id?EVENTS.breakdownCapacity:1),0);
  const fleetTotal={...fleetFree},allocations=[];let revenue=0,delivered=0,unserved=0,penalties=0,variable=0;
  const contracts=options.contracts||s.contracts;
  for(const c of contracts.filter(c=>active(c,s))){
    const seasonal=B.seasonalDemand[s.quarter%4];const demand=c.volume*(c.base?seasonal*(B.demandJitterBase+hash(`${s.seed}-${s.quarter}-${c.id}`)*B.demandJitterRange):1)*(event?.type==='demand'?EVENTS.demandFactor:1);
    let remaining=demand;const paths=[];let block='Нет сквозного маршрута';const shortest=findPath(s,c.from,c.to);
    for(let attempt=0;attempt<8&&remaining>.01;attempt++){
      // An electric path is preferred when electric traction exists, preserving diesel capacity.
      let path=fleetFree.electric>.01?findPath(s,c.from,c.to,edgeFree,stationFree,{},true):null;
      if(path&&shortest&&path.distance>shortest.distance*B.maxDetour+120)path=null;
      if(!path)path=findPath(s,c.from,c.to,edgeFree,stationFree);if(!path){block='Пропускная способность станций или путей исчерпана';break;}
      if(shortest&&path.distance>shortest.distance*B.maxDetour+120){block='Краткий маршрут перегружен; объезд слишком длинный для квартального договора';break;}
      const loco=path.electrified?fleetFree.electric+fleetFree.diesel:fleetFree.diesel;
      const routeLimit=Math.min(...path.lines.map(id=>edgeFree[id]),...path.stations.map(id=>stationFree[id]));
      const amount=Math.max(0,Math.min(remaining,routeLimit,loco,fleetFree[c.cargo]));
      if(amount<=.01){block=fleetFree[c.cargo]<=.01?`Не хватает вагонов: ${CARGO[c.cargo].name.toLowerCase()}`:loco<=.01?(path.electrified?'Не хватает локомотивов':'Не хватает тепловозов; маршрут электрифицирован не полностью'):'Лимит инфраструктуры';break;}
      const electric=path.electrified?Math.min(amount,fleetFree.electric):0;fleetFree.electric-=electric;fleetFree.diesel-=amount-electric;fleetFree[c.cargo]-=amount;
      for(const id of path.lines){edgeFree[id]-=amount;edgeLoads[id].load+=amount;}
      for(const id of path.stations){stationFree[id]-=amount;stationLoads[id].load+=amount;stationLoads[id].revenue+=amount*c.price/path.stations.length;}
      variable+=amount*(B.variableCost+path.distance*B.distanceCost)+electric*B.electricCost+(amount-electric)*B.dieselCost;
      paths.push({...path,volume:round(amount)});remaining-=amount;
      if(routeLimit<=amount+.01)block='Участок или узел достиг максимальной мощности';
      else if(fleetFree[c.cargo]<=.01)block=`Не хватает вагонов: ${CARGO[c.cargo].name.toLowerCase()}`;
      else if(fleetFree.diesel+(path.electrified?fleetFree.electric:0)<=.01)block='Достигнут предел локомотивного парка';
    }
    const amount=demand-remaining,earned=amount*c.price,penalty=remaining*c.price*(c.base?B.penaltyRate*.5:B.penaltyRate);revenue+=earned;delivered+=amount;unserved+=remaining;penalties+=penalty;
    allocations.push({contractId:c.id,name:c.name,cargo:c.cargo,from:c.from,to:c.to,demand:round(demand),delivered:round(amount),unserved:round(remaining),revenue:round(earned),penalty:round(penalty),reason:remaining>.1?block:'Весь спрос обеспечен',paths});
  }
  for(const l of Object.values(edgeLoads)){l.load=round(l.load);l.ratio=l.capacity?l.load/l.capacity:0;}
  for(const st of Object.values(stationLoads)){st.load=round(st.load);st.revenue=round(st.revenue);st.ratio=st.capacity?st.load/st.capacity:0;}
  const network=s.stations.reduce((n,st)=>n+B.stationMaintenance[st.level],0)+s.lines.reduce((n,l)=>n+l.distance*B.lineMaintenancePerKm*l.tracks,0);
  const fleet=s.fleet.reduce((n,f)=>n+f.maintenance*(f.age>=f.life?B.expiredFleetMaintenance:1),0),interest=s.debt*B.loanInterest;
  const expenses=variable+network+fleet+interest+penalties;
  const fleetUsage=Object.fromEntries(Object.keys(fleetFree).map(type=>[type,{capacity:round(fleetTotal[type]),used:round(fleetTotal[type]-fleetFree[type]),free:round(fleetFree[type]),ratio:fleetTotal[type]?(fleetTotal[type]-fleetFree[type])/fleetTotal[type]:0}]));
  const warnings=allocations.filter(a=>a.unserved>1).map(a=>`${a.name}: ${a.reason} (${a.unserved} тыс. т).`);
  if(s.budget+revenue-expenses<0)warnings.push('Следующий квартал закончится с отрицательным балансом. Доступен антикризисный кредит.');
  return {revenue:round(revenue),expenses:round(expenses),net:round(revenue-expenses),delivered:round(delivered),unserved:round(unserved),demand:round(delivered+unserved),allocations,edgeLoads,stationLoads,fleetUsage,breakdown:{variable:round(variable),network:round(network),fleet:round(fleet),interest:round(interest),penalties:round(penalties)},warnings};
}

function terrain(a,b){const mountain=Math.max(a.lon,b.lon)>75&&Math.min(a.lat,b.lat)<46;return mountain?PROJECT_COST.mountainCostFactor:1;}
// Schematic feasibility masks match the hand-drawn map. They are not surveyed shores.
const WATER_MASKS=[
  {name:'Балхаш',points:[[74.1,46.5],[74.8,46.9],[75.7,46.8],[76.7,46.2],[77.4,46.3],[78.5,46.7],[79.4,46.4],[78.7,45.9],[77.2,45.8],[75.6,46.3],[74.7,46.1]]},
  {name:'Аральское море',points:[[59,46.4],[60.8,46.6],[61.4,46.1],[61,45.3],[60.1,44.8],[59.4,45.3]]},
  {name:'Каспийское море',points:[[48.1,47.1],[49.5,46.6],[50.2,45.8],[49.8,45.1],[50.6,44.6],[49.9,44.2],[50.8,43.2],[50.6,42],[48,42],[46.6,43.4],[46.5,45]]},
  {name:'Алаколь',points:[[81.1,46.6],[81.8,46.8],[82.1,46.4],[81.7,46],[81.2,46]]},
  {name:'Зайсан',points:[[83.4,48],[84.7,48],[85.2,47.8],[84.4,47.5],[83.2,47.7]]},
];
function insidePolygon(p,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if((yi>p.lat)!==(yj>p.lat)&&p.lon<(xj-xi)*(p.lat-yi)/(yj-yi)+xi)inside=!inside;}return inside;}
function segmentsCross(a,b,c,d){
  const cross=(p,q,r)=>(q.lon-p.lon)*(r.lat-p.lat)-(q.lat-p.lat)*(r.lon-p.lon);
  const c1=cross(a,b,c),c2=cross(a,b,d),c3=cross(c,d,a),c4=cross(c,d,b);
  if(Math.max(a.lon,b.lon)<Math.min(c.lon,d.lon)||Math.max(c.lon,d.lon)<Math.min(a.lon,b.lon)||Math.max(a.lat,b.lat)<Math.min(c.lat,d.lat)||Math.max(c.lat,d.lat)<Math.min(a.lat,b.lat))return false;
  return c1*c2<=0&&c3*c4<=0;
}
function waterCrossing(points){for(const water of WATER_MASKS){if(points.some(p=>insidePolygon(p,water.points)))return water.name;for(let i=1;i<points.length;i++)for(let j=0;j<water.points.length;j++){const a=water.points[j],b=water.points[(j+1)%water.points.length];if(segmentsCross(points[i-1],points[i],{lon:a[0],lat:a[1]},{lon:b[0],lat:b[1]}))return water.name;}}return null;}
function allowedPoint(p){
  if(!p||!finite(p.lat)||!finite(p.lon))return false;
  let inside=false;for(let i=0,j=OUTLINE.length-1;i<OUTLINE.length;j=i++){
    const [xi,yi]=OUTLINE[i],[xj,yj]=OUTLINE[j];
    if((yi>p.lat)!==(yj>p.lat)&&p.lon<(xj-xi)*(p.lat-yi)/(yj-yi)+xi)inside=!inside;
    // The outline is schematic: admit a narrow tolerance along its edge.
    const dx=xj-xi,dy=yj-yi,t=clamp(((p.lon-xi)*dx+(p.lat-yi)*dy)/(dx*dx+dy*dy),0,1);
    if(Math.hypot(p.lon-(xi+t*dx),p.lat-(yi+t*dy))<.18)return true;
  }return inside;
}
function newLineId(a,b){return [a,b].includes('shu')&&[a,b].includes('kyzylorda')?'shu-kyzylorda':[a,b].sort().join('-');}
function proposalDetails(s,p){
  const level=engineerLevel(s);let cost,duration,requiredLevel=1,before='',after='',distance=0;
  const st=asset(s,p.target),l=line(s,p.target);
  if(p.type==='upgrade'){if(!st)return fail('Станция не найдена.');if(st.level>=3)return fail('Станция уже достигла уровня 3.');requiredLevel=st.level===2?2:1;cost=PROJECT_COST.upgradeCost[st.level];duration=PROJECT_COST.upgradeDuration[st.level];before=`Уровень ${st.level} · ${stationCapacity(s,st.id)} тыс. т`;after=`Уровень ${st.level+1} · ${round(B.stationCapacity[st.level+1]*assetCondition(st))} тыс. т`;}
  else if(p.type==='stationRepair'){if(!st)return fail('Станция не найдена.');if(st.condition>=99)return fail('Станция исправна.');cost=Math.round(PROJECT_COST.stationRepairBase+(100-st.condition)*PROJECT_COST.stationRepairPerConditionLevel*st.level);duration=PROJECT_COST.repairDuration;before=`Состояние ${Math.round(st.condition)}%`;after='Состояние 100%';}
  else if(p.type==='lineRepair'){if(!l)return fail('Участок не найден.');if(l.condition>=99)return fail('Участок исправен.');cost=Math.round(PROJECT_COST.lineRepairBase+(100-l.condition)*PROJECT_COST.lineRepairPerCondition+l.distance*PROJECT_COST.lineRepairPerKm);duration=PROJECT_COST.repairDuration;before=`Состояние ${Math.round(l.condition)}%`;after='Состояние 100%';}
  else if(p.type==='tracks'){if(!l)return fail('Участок не найден.');if(l.tracks>=3)return fail('Максимум три игровых пути.');requiredLevel=2;cost=Math.round(PROJECT_COST.tracksBase+l.distance*PROJECT_COST.tracksPerKm);duration=PROJECT_COST.tracksDuration+(l.distance>PROJECT_COST.longTracksKm?PROJECT_COST.longTracksExtra:0);before=`${l.tracks} путь · ${lineCapacity(s,l)} тыс. т`;after=`${l.tracks+1} пути · ${round(B.lineCapacity*(l.tracks+1)*assetCondition(l))} тыс. т`;}
  else if(p.type==='electrify'){if(!l)return fail('Участок не найден.');if(l.electrified)return fail('Участок уже электрифицирован.');requiredLevel=3;cost=Math.round(PROJECT_COST.electrifyBase+l.distance*PROJECT_COST.electrifyPerKm);duration=PROJECT_COST.electrifyDuration;before='Только тепловозы';after='Тепловозы и электровозы';}
  else if(p.type==='newLine'){
    const a=asset(s,p.a),b=asset(s,p.b);if(!a||!b||a.id===b.id)return fail('Выберите две разные существующие станции.');
    if(s.lines.some(l=>(l.a===a.id&&l.b===b.id)||(l.a===b.id&&l.b===a.id)))return fail('Прямой участок уже существует: используйте добавление путей.');
    if(!Array.isArray(p.via??[])||(p.via||[]).length>5)return fail('Трасса допускает до пяти промежуточных точек.');
    const points=[a,...(p.via||[]),b];const water=waterCrossing(points);if(water)return fail(`Трасса пересекает водоём «${water}». На схематической карте морские переходы не строятся: задайте сухопутный объезд.`);if(points.some(p=>!allowedPoint(p)))return fail('Трасса выходит за допустимую сухопутную область Казахстана.');
    for(let i=1;i<points.length;i++)for(let step=1;step<20;step++){const t=step/20,prev=points[i-1],next=points[i];if(!allowedPoint({lat:prev.lat+(next.lat-prev.lat)*t,lon:prev.lon+(next.lon-prev.lon)*t}))return fail('Прямая трасса пересекает границу или водную область. Измените промежуточные точки.');}
    distance=points.slice(1).reduce((n,p,i)=>n+haversine(points[i],p),0)*PROJECT_COST.newLineDistanceFactor;
    if(distance>PROJECT_COST.maxLineKm)return fail(`Слишком длинная линия: соединяйте сеть последовательными участками до ${PROJECT_COST.maxLineKm} км.`);
    if(distance>haversine(a,b)*PROJECT_COST.maxViaDetour)return fail('Непрактичная трасса: промежуточные точки создают чрезмерный объезд.');
    requiredLevel=distance>PROJECT_COST.longLineKm?5:4;cost=Math.round(PROJECT_COST.newLineBase+distance*PROJECT_COST.newLinePerKm*terrain(a,b));duration=distance>PROJECT_COST.longLineKm?PROJECT_COST.longLineDuration:PROJECT_COST.newLineDuration;before='Прямой игровой линии нет';after=`Новая линия · ${Math.round(distance)} км · ${B.lineCapacity} тыс. т`;
  }else return fail('Неизвестный вид проекта.');
  if(s.projects.some(x=>p.type==='newLine'?x.type==='newLine'&&((x.a===p.a&&x.b===p.b)||(x.a===p.b&&x.b===p.a)):x.target===p.target))return {...fail('На этом объекте уже идут работы.'),cost,duration,requiredLevel,before,after};
  return {ok:level>=requiredLevel,message:level>=requiredLevel?'Проект доступен.':`Нужен уровень инженера ${requiredLevel} (${LEVELS[requiredLevel-1].xp} опыта).`,cost,duration,requiredLevel,before,after,distance:Math.round(distance),proposal:clone(p)};
}
function applyProject(s,p){
  const st=asset(s,p.target),l=line(s,p.target);
  if(p.type==='upgrade')st.level=Math.min(3,st.level+1);
  if(p.type==='stationRepair')st.condition=100;
  if(p.type==='lineRepair')l.condition=100;
  if(p.type==='tracks')l.tracks=Math.min(3,l.tracks+1);
  if(p.type==='electrify')l.electrified=true;
  if(p.type==='newLine')s.lines.push({id:p.target||`${p.a}-${p.b}`,a:p.a,b:p.b,via:p.via||[],distance:p.distance,condition:100,tracks:1,electrified:false,playerBuilt:true});
}
export function projectQuote(s,proposal){
  if(proposal.type==='newLine')proposal={...proposal,target:newLineId(proposal.a,proposal.b)};
  const q=proposalDetails(s,proposal);if(q.cost===undefined)return {...q,warnings:[],impact:0};
  const before=forecast(s),future=clone(s);future.projects=future.projects.filter(x=>x.target!==proposal.target);applyProject(future,{...proposal,distance:q.distance});const after=forecast(future);
  const warnings=[];if(after.delivered-before.delivered<1)warnings.push('Текущие перевозки почти не вырастут: другое ограничение или недостаточный спрос. Проверьте маршрут и парк.');
  if(s.budget-q.cost<before.expenses)warnings.push(`После оплаты останется меньше обязательных расходов квартала (${money(before.expenses)}).`);
  if(proposal.type!=='newLine')warnings.push('Во время работ мощность объекта временно снижена; эффект появится после завершения.');
  if(proposal.type==='electrify')warnings.push('Электровозам нужен полностью электрифицированный маршрут от отправления до назначения.');
  return {...q,affordable:s.budget>=q.cost,impact:round(after.delivered-before.delivered),netImpact:round(after.net-before.net),warnings};
}
export function startProject(s,proposal){if(!ensurePlayable(s))return fail('Кампания завершена.');const q=projectQuote(s,proposal);if(!q.ok)return q;if(s.budget<q.cost)return fail('Недостаточно средств.');const p={...clone(q.proposal),id:uid(s,'project'),cost:q.cost,duration:q.duration,remaining:q.duration,distance:q.distance,started:s.quarter};s.budget=round(s.budget-q.cost);s.pendingSpend+=q.cost;s.projects.push(p);return success('Строительство началось.',{project:p});}
export function buyFleet(s,type){if(!ensurePlayable(s))return fail('Кампания завершена.');if(!Object.hasOwn(FLEET_TYPES,type))return fail('Неизвестный тип техники.');const def=FLEET_TYPES[type];if(type==='electric'&&engineerLevel(s)<3)return fail('Электровозы открываются на уровне инженера 3.');if(s.budget<def.cost)return fail('Недостаточно средств.');const f={id:uid(s,'fleet'),type,...clone(def),condition:100,age:0};s.fleet.push(f);s.budget-=def.cost;s.pendingSpend+=def.cost;return success(`${def.name}: парк пополнен.`,{fleet:f});}
export function repairFleet(s,id){if(!ensurePlayable(s))return fail('Кампания завершена.');const f=s.fleet.find(x=>x.id===id);if(!f)return fail('Техника не найдена.');if(f.condition>=99&&f.age<f.life)return fail('Ремонт пока не нужен.');const cost=Math.round(f.cost*(100-f.condition)/100*B.fleetRepairRate+(f.age>=f.life?f.cost*B.fleetLifeExtensionRate:0));if(s.budget<cost)return fail('Недостаточно средств.');s.budget-=cost;s.pendingSpend+=cost;f.condition=100;if(f.age>=f.life)f.age=Math.round(f.life*B.fleetRenewedAge);return success(`Парк восстановлен за ${money(cost)}.`,{cost});}

function refreshOffers(s){if(s.offerQuarter===s.quarter)return;s.offerQuarter=s.quarter;s.offers=[];
  for(let i=0;i<4;i++){const t=OFFER_TEMPLATES[(s.quarter-1+i)%OFFER_TEMPLATES.length];s.offers.push({...clone(t),id:`offer-${s.quarter}-${i}`,basePrice:t.price,baseVolume:t.volume,duration:4+(i%3),rounds:0,status:'open',illegal:false,description:'Обычный договор. Оплата только за выполненный объём; за недопоставку предусмотрен штраф.'});}
  if(s.quarter%EVENTS.illegalEveryQuarters===EVENTS.illegalQuarterOffset)s.offers.push({...clone(ILLEGAL_OFFER),id:`illegal-${s.quarter}`,basePrice:ILLEGAL_OFFER.price,baseVolume:ILLEGAL_OFFER.volume,rounds:0,status:'open',illegal:true});
}
export function getOffers(s){return s.offers.filter(o=>!['accepted','rejected'].includes(o.status));}
export function offerForecast(s,id,{price,volume,startDelay=0}={}){const o=s.offers.find(x=>x.id===id);if(!o)return null;const c={...o,price:price??o.price,volume:volume??o.volume,start:s.quarter+startDelay,end:s.quarter+startDelay+o.duration};const copy=clone(s);copy.quarter+=startDelay;const current=forecast(copy);const f=forecast(copy,{contracts:[...copy.contracts,c]});return {...f,incrementalNet:round(f.net-current.net),incrementalRevenue:round(f.revenue-current.revenue),offerAllocation:f.allocations.find(a=>a.contractId===o.id),note:startDelay?'Прогноз при текущей инфраструктуре; стройки и новые события могут изменить результат.':''};}
export function negotiate(s,id,{price,volume}={}){if(!ensurePlayable(s))return fail('Кампания завершена.');const o=s.offers.find(x=>x.id===id);if(!o||!['open','counter','agreed'].includes(o.status))return fail('Офер недоступен.');const maxRounds=engineerLevel(s)>=NEGOTIATION.advancedLevel?NEGOTIATION.advancedRounds:NEGOTIATION.ordinaryRounds;if(o.rounds>=maxRounds)return fail('Раунды исчерпаны. Можно принять последние условия или отказаться.');if(!finite(price)||!finite(volume)||price<=0||volume<NEGOTIATION.minVolume||volume>o.baseVolume*NEGOTIATION.maxVolumeFactor)return fail(`Укажите положительную цену и объём от ${NEGOTIATION.minVolume} до ${round(o.baseVolume*NEGOTIATION.maxVolumeFactor)} тыс. т.`);o.rounds++;const ceiling=o.basePrice*(NEGOTIATION.ceilingBase+(volume/o.baseVolume-1)*NEGOTIATION.volumeBonus+(s.reputation-NEGOTIATION.neutralReputation)*NEGOTIATION.reputationBonus);if(price<=ceiling&&volume<=o.baseVolume*NEGOTIATION.maxAgreedVolume){o.price=round(price);o.volume=round(volume);o.status='agreed';return success('Контрагент согласен с предложением.',{outcome:'accepted',offer:o});}if(price>o.basePrice*NEGOTIATION.refusalPriceFactor||o.rounds>=maxRounds){o.status='rejected';return fail('Контрагент отказался: условия слишком далеко от спроса рынка.');}o.price=round(Math.min(ceiling,o.basePrice*NEGOTIATION.counterPriceFactor));o.volume=round(Math.min(volume,o.baseVolume*NEGOTIATION.counterVolumeFactor));o.status='counter';return success('Контрагент сделал встречное предложение.',{outcome:'counter',offer:o});}
export function acceptOffer(s,id,{price,volume,startDelay=0}={}){if(!ensurePlayable(s))return fail('Кампания завершена.');const o=s.offers.find(x=>x.id===id);if(!o||!['open','counter','agreed'].includes(o.status))return fail('Этот офер уже недоступен.');if((price!==undefined&&price!==o.price)||(volume!==undefined&&volume!==o.volume))return fail('Сначала согласуйте изменённые цену и объём через переговоры.');if(!Number.isInteger(startDelay)||startDelay<0||startDelay>NEGOTIATION.maxStartDelay)return fail(`Начало договора можно отложить на 0–${NEGOTIATION.maxStartDelay} кварталов.`);const c={...clone(o),start:s.quarter+startDelay,end:s.quarter+startDelay+o.duration};s.contracts.push(c);o.status='accepted';if(c.illegal)s.illegalAccepted++;return success(startDelay?`Договор начнётся через ${startDelay} кв.`:'Договор принят.',{contract:c});}
export function rejectOffer(s,id){const o=s.offers.find(x=>x.id===id);if(!o||o.status==='accepted')return fail('Офер недоступен.');o.status='rejected';return success('Офер отклонён. Последствий нет.');}
export function cancelContract(s,id){if(!ensurePlayable(s))return fail('Кампания завершена.');const c=s.contracts.find(x=>x.id===id&&!x.base&&active(x,s));if(!c)return fail('Отменить можно дополнительный действующий договор.');const cost=round(c.volume*c.price*B.contractCancellationRate);s.budget-=cost;s.pendingSpend+=cost;c.end=s.quarter;c.cancelled=true;s.reputation=clamp(s.reputation-B.cancellationReputation,0,100);return success(`Договор расторгнут. Компенсация ${money(cost)}.`,{cost});}
export function takeLoan(s){if(!ensurePlayable(s))return fail('Кампания завершена.');if(s.debt+B.loanSize>B.maxDebt)return fail('Лимит кредита исчерпан.');s.debt+=B.loanSize;s.budget+=B.loanSize;return success(`Получено ${money(B.loanSize)}. Процент: 2,5% за квартал.`);}
export function repayLoan(s){if(!ensurePlayable(s))return fail('Кампания завершена.');const amount=Math.min(B.loanSize,s.debt);if(!amount)return fail('Задолженности нет.');if(s.budget<amount)return fail('Недостаточно средств для погашения.');s.debt-=amount;s.budget-=amount;return success(`Погашено ${money(amount)}.`);}

const CORRIDOR=[
  {id:'east-hub',label:'Хоргос: узел Алтынколь, уровень 2',type:'upgrade',target:'altynkol',required:2,requiredLevel:1},
  {id:'east-tracks',label:'Алтынколь — Алматы: второй путь',type:'tracks',target:'altynkol-almaty',required:2,requiredLevel:2},
  {id:'shu-hub',label:'Шу: транзитный узел, уровень 3',type:'upgrade',target:'shu',required:3,requiredLevel:2},
  {id:'central-shortcut',label:'Новая игровая линия Шу — Кызылорда',type:'newLine',target:'shu-kyzylorda',a:'shu',b:'kyzylorda',required:1,requiredLevel:5},
  {id:'central-power',label:'Электрификация новой линии',type:'electrify',target:'shu-kyzylorda',required:1,requiredLevel:3},
  {id:'west-tracks',label:'Кызылорда — Саксаульская: второй путь',type:'tracks',target:'kyzylorda-saksaul',required:2,requiredLevel:2},
  {id:'west-junction',label:'Саксаульская — Актобе: второй путь',type:'tracks',target:'saksaul-aktobe',required:2,requiredLevel:2},
  {id:'port-hub',label:'Каспийский выход: Актау, уровень 3',type:'upgrade',target:'aktau',required:3,requiredLevel:2},
];
export function getCorridor(s){const stages=CORRIDOR.map(c=>{const st=asset(s,c.target),l=line(s,c.target);const done=c.type==='upgrade'?!!st&&st.level>=c.required:c.type==='tracks'?!!l&&l.tracks>=c.required:c.type==='electrify'?!!l&&l.electrified:!!l;return {...c,done,inProgress:s.projects.some(p=>p.target===c.target)};});
  const route=['altynkol','almaty','shu','kyzylorda','saksaul','aktobe','atyrau','aktau'];const routeLines=route.slice(1).map((id,i)=>s.lines.find(l=>(l.a===route[i]&&l.b===id)||(l.a===id&&l.b===route[i])));
  const capacity=routeLines.every(Boolean)?Math.min(...route.map(id=>stationCapacity(s,id)),...routeLines.map(l=>lineCapacity(s,l)),s.fleet.filter(f=>f.type==='diesel'||(f.type==='electric'&&routeLines.every(l=>l.electrified))).reduce((n,f)=>n+fleetPower(f),0),s.fleet.filter(f=>f.type==='goods').reduce((n,f)=>n+fleetPower(f),0)):0;
  const completed=stages.filter(c=>c.done).length;return {percent:Math.round(completed/stages.length*100),completed,total:stages.length,stages,ready:completed===stages.length&&capacity>=B.corridorVolume,capacity:round(capacity),requiredVolume:B.corridorVolume,route};
}
function chooseEvent(s,forced){let type=typeof forced==='string'?forced:forced?.type;if(type===undefined){const roll=hash(`${s.seed}-event-${s.quarter}`);const poor=s.fleet.some(f=>f.condition<EVENTS.poorCondition);const illegal=s.contracts.some(c=>c.illegal&&active(c,s));if(illegal&&roll<EVENTS.inspectionChance)type='inspection';else if(roll<EVENTS.grantChance)type='grant';else if(roll<EVENTS.demandChance)type='demand';else if(roll<EVENTS.breakdownChance||(poor&&roll<EVENTS.poorFleetBreakdownChance))type='breakdown';else if(roll<EVENTS.restrictionChance)type='restriction';else if(roll<EVENTS.delayChance&&s.projects.length)type='delay';else type='none';}
  const e={type,...(typeof forced==='object'?forced:{})};
  if(type==='restriction'){e.target=e.target||s.lines.reduce((a,b)=>a.condition<b.condition?a:b).id;e.message=`Путевые работы: мощность одного изношенного участка снижена на ${Math.round((1-EVENTS.restrictionCapacity)*100)}% на этот квартал.`;}
  if(type==='breakdown'){e.target=e.target||s.fleet.reduce((a,b)=>a.condition<b.condition?a:b).id;e.message=`Отказ техники: одна единица парка временно теряет ${Math.round((1-EVENTS.breakdownCapacity)*100)}% мощности и ${EVENTS.breakdownWear} пунктов состояния.`;}
  if(type==='demand')e.message=`Сезонный рост заказов: доступный спрос на ${Math.round((EVENTS.demandFactor-1)*100)}% выше в этом квартале.`;
  if(type==='grant'){e.amount=EVENTS.grant;e.message=`Государственная инвестиция: ${money(EVENTS.grant)} на развитие инфраструктуры без обязательств.`;}
  if(type==='delay')e.message=s.projects.length?'Задержка поставки: один проект отложен на квартал.':'Поставки задержаны; действующих строек нет, сеть не пострадала.';
  if(type==='none')e.message='Квартал прошёл без внеплановых событий.';
  return e;
}
export function advanceQuarter(s,{event:forced}={}){
  if(!ensurePlayable(s))return fail('Кампания завершена. Начните новую игру.');
  const oldLevel=engineerLevel(s),event=chooseEvent(s,forced);let eventMoney=0;
  if(event.type==='grant'){s.budget+=event.amount;eventMoney=event.amount;}
  if(event.type==='delay'&&s.projects.length)s.projects[0].remaining+=1;
  if(['inspection','arrest'].includes(event.type)){const illicit=s.contracts.find(c=>c.illegal&&active(c,s));if(illicit){illicit.frozen=true;s.convictions++;const fine=Math.min(EVENTS.fineMax,EVENTS.fineBase+s.convictions*EVENTS.finePerConviction);s.budget-=fine;eventMoney=-fine;s.reputation=clamp(s.reputation-EVENTS.inspectionReputation,0,100);event.message=`Проверка подтвердила недостоверные документы. Договор заморожен, штраф ${money(fine)}, репутация −${EVENTS.inspectionReputation}.`;if(event.type==='arrest'||(illicit.severity>=2&&s.convictions>=EVENTS.arrestConvictions)){s.status='arrested';event.message+=' Подтверждено тяжёлое нарушение: руководитель арестован.';}}else event.message='Проверка не выявила нарушений. Последствий нет.';}
  const f=forecast(s,{event});s.budget=round(s.budget+f.net);s.totalTransport=round(s.totalTransport+f.delivered);
  const completion=f.demand?f.delivered/f.demand:1;
  const reputationDelta=completion>=.9?2:completion>=.72?1:completion>=.52?0:-2;
  s.reputation=clamp(s.reputation+reputationDelta,0,100);
  if(completion>=.6)s.xp+=B.xpReliable;
  const performed=f.allocations.filter(a=>a.delivered>=a.demand*.8).length;s.xp+=performed*B.xpDelivery;
  for(const st of s.stations)st.condition=round(Math.max(25,st.condition-B.wearStation-(f.stationLoads[st.id].ratio>.92?.45:0)));
  for(const l of s.lines)l.condition=round(Math.max(20,l.condition-B.wearLine-(f.edgeLoads[l.id]?.ratio>.92?.7:0)));
  for(const f of s.fleet){f.age++;f.condition=round(Math.max(15,f.condition-FLEET_TYPES[f.type].wear-(event.type==='breakdown'&&event.target===f.id?EVENTS.breakdownWear:0)));}
  const finished=[];for(const p of s.projects){p.remaining--;if(p.remaining<=0){applyProject(s,p);finished.push({...p});s.xp+=B.xpProject+(p.type==='newLine'?160:0);}}
  s.projects=s.projects.filter(p=>p.remaining>0);
  if(s.budget<0)s.insolvencyQuarters++;else s.insolvencyQuarters=0;
  if(s.insolvencyQuarters>=B.insolvencyGrace&&s.status!=='arrested')s.status='bankrupt';
  if(s.reputation<=8&&s.status!=='arrested')s.status='dismissed';
  const corridor=getCorridor(s);if(corridor.ready&&s.status==='playing'){s.status='won';s.wonAt=s.quarter;}
  if(finished.length&&!s.achievements.includes('Первый объект'))s.achievements.push('Первый объект');
  if(s.totalTransport>=5000&&!s.achievements.includes('Пять миллионов тонн'))s.achievements.push('Пять миллионов тонн');
  if(s.reputation>=90&&!s.achievements.includes('Надёжный партнёр'))s.achievements.push('Надёжный партнёр');
  const news=[finished.length?`Завершено объектов: ${finished.length}.`:f.unserved>10?`Не перевезено ${f.unserved} тыс. т: проверьте ограничения маршрутов.`:`Выполнено ${Math.round(completion*100)}% спроса.`,event.message,engineerLevel(s)>oldLevel?`Новый уровень инженера: ${engineerLevel(s)} — ${LEVELS[engineerLevel(s)-1].name}.`:`Транзитный коридор: ${corridor.percent}% объектов готовы.`];
  const report={quarter:s.quarter,year:2026+Math.floor(s.quarter/4),...f,event,eventMoney,news,finished,completed:finished,budgetBefore:s.quarterOpeningBudget,budgetAfter:s.budget,budgetDelta:round(s.budget-s.quarterOpeningBudget),investments:s.pendingSpend,reputationDelta,engineerLevel:engineerLevel(s),corridor:clone(corridor),fleetCondition:round(s.fleet.reduce((n,f)=>n+f.condition,0)/s.fleet.length),status:s.status,warning:s.insolvencyQuarters?`Отрицательный баланс ${s.insolvencyQuarters} из ${B.insolvencyGrace} кварталов. Восстановите бюджет: кредит, сокращение договоров, ремонт узкого места.`:''};
  s.reports.unshift(report);if(s.reports.length>120)s.reports.length=120;s.quarter++;s.contracts=s.contracts.filter(c=>c.base||c.end>=s.quarter-2);s.quarterOpeningBudget=s.budget;s.pendingSpend=0;refreshOffers(s);return success('Квартал завершён.',{report});
}

export function validateSave(raw){try{
  const s=typeof raw==='string'?JSON.parse(raw):clone(raw);
  const id=value=>typeof value==='string'&&/^[a-z][a-z0-9-]{0,79}$/.test(value);
  const text=value=>typeof value==='string'&&value.length<=2000;
  const nonnegative=value=>finite(value)&&value>=0;
  const positive=value=>finite(value)&&value>0;
  const integer=value=>Number.isSafeInteger(value)&&value>=0;
  const condition=value=>nonnegative(value)&&value<=100;
  const array=(value,max=1000)=>Array.isArray(value)&&value.length<=max;
  const unique=items=>new Set(items.map(x=>x.id)).size===items.length;
  const statuses=['playing','won','bankrupt','dismissed','arrested'];
  if(!s||s.version!==B.version)return fail('Сохранение другой версии. Начните новую кампанию; старый файл не изменён.');
  if(!integer(s.quarter)||s.quarter<1||s.startedQuarter!==B.startingQuarter||!statuses.includes(s.status))return fail('Некорректное состояние кампании.');
  for(const k of ['budget','quarterOpeningBudget'])if(!finite(s[k]))return fail(`Сохранение повреждено: ${k}.`);
  for(const k of ['xp','reputation','debt','totalTransport','pendingSpend'])if(!nonnegative(s[k]))return fail(`Сохранение повреждено: ${k}.`);
  for(const k of ['insolvencyQuarters','seed','nextId','illegalAccepted','convictions'])if(!integer(s[k]))return fail(`Сохранение повреждено: ${k}.`);
  if(s.reputation>100||s.debt>B.maxDebt||(s.wonAt!==null&&(!integer(s.wonAt)||s.wonAt>s.quarter)))return fail('Сохранение содержит недопустимые показатели.');
  for(const k of ['stations','lines','fleet','contracts','projects','offers','reports','achievements'])if(!array(s[k]))return fail(`Сохранение повреждено: ${k}.`);
  if(s.stations.length!==STATIONS.length||s.lines.length<LINES.length||!s.fleet.length)return fail('В сохранении отсутствуют обязательные объекты.');
  for(const k of ['stations','lines','fleet','contracts','projects','offers'])if(!unique(s[k]))return fail(`Дублирующиеся идентификаторы: ${k}.`);
  const stationIds=new Set();
  for(const st of s.stations){if(!id(st.id)||!STATIONS.some(x=>x.id===st.id)||!integer(st.level)||st.level<1||st.level>3||!condition(st.condition)||!finite(st.lat)||st.lat<40||st.lat>56||!finite(st.lon)||st.lon<46||st.lon>88||!text(st.name))return fail('Повреждены данные станции.');stationIds.add(st.id);}
  const lineIds=new Set();
  for(const l of s.lines){
    if(!id(l.id)||!stationIds.has(l.a)||!stationIds.has(l.b)||l.a===l.b||!positive(l.distance)||!integer(l.tracks)||l.tracks<1||l.tracks>3||!condition(l.condition)||typeof l.electrified!=='boolean')return fail('Повреждены данные участка.');
    const base=LINES.find(x=>x.id===l.id);
    if(base?(l.a!==base.a||l.b!==base.b):l.id!==newLineId(l.a,l.b))return fail('Идентификатор участка не соответствует его станциям.');
    if(!base&&(!array(l.via??[],5)||(l.via||[]).some(p=>!allowedPoint(p))))return fail('Повреждена трасса новой линии.');
    lineIds.add(l.id);
  }
  if(LINES.some(l=>!lineIds.has(l.id)))return fail('В сохранении отсутствует исходное направление сети.');
  const links=s.lines.map(l=>[l.a,l.b].sort().join('|'));if(new Set(links).size!==links.length)return fail('Продублировано направление сети.');
  for(const f of s.fleet){if(!Object.hasOwn(FLEET_TYPES,f.type)||!id(f.id)||!text(f.name)||!condition(f.condition)||!positive(f.capacity)||!integer(f.age)||!integer(f.life)||f.life===0||!nonnegative(f.maintenance)||!nonnegative(f.cost))return fail('Повреждены данные парка.');}
  for(const c of [...s.contracts,...s.offers]){if(!id(c.id)||!text(c.name)||!stationIds.has(c.from)||!stationIds.has(c.to)||c.from===c.to||!Object.hasOwn(CARGO,c.cargo)||!positive(c.volume)||!positive(c.price))return fail('Повреждены данные договора.');
    if(s.contracts.includes(c)&&(!integer(c.start)||!integer(c.end)||c.end<c.start||(c.end===c.start&&!c.cancelled)))return fail('Некорректный срок договора.');
    for(const field of ['base','illegal','frozen','cancelled'])if(c[field]!==undefined&&typeof c[field]!=='boolean')return fail('Повреждён статус договора.');
    if(c.description!==undefined&&!text(c.description))return fail('Повреждено описание договора.');
  }
  function validProject(p,finished=false){
    if(!p||!id(p.id)||!id(p.target)||!['upgrade','stationRepair','lineRepair','tracks','electrify','newLine'].includes(p.type)||!integer(p.remaining)||(!finished&&p.remaining===0)||!nonnegative(p.cost)||!integer(p.duration)||p.duration===0||!integer(p.started))return false;
    if(p.type==='newLine'){if(!stationIds.has(p.a)||!stationIds.has(p.b)||p.a===p.b||p.target!==newLineId(p.a,p.b)||!positive(p.distance)||!array(p.via??[],5)||(p.via||[]).some(x=>!allowedPoint(x)))return false;}
    else if(['upgrade','stationRepair'].includes(p.type)?!stationIds.has(p.target):!lineIds.has(p.target))return false;
    return true;
  }
  if(s.projects.some(p=>!validProject(p)))return fail('Повреждены данные проекта.');
  if(new Set(s.projects.map(p=>p.target)).size!==s.projects.length)return fail('На одном объекте продублированы работы.');
  const generatedIds=[...s.fleet,...s.projects,...s.reports.flatMap(r=>array(r?.finished)?r.finished:[])].map(x=>Number(String(x?.id).match(/^(?:fleet|project)-(\d+)$/)?.[1]||0));
  if(Math.max(0,...generatedIds)>s.nextId)return fail('Повреждён счётчик объектов.');
  for(const o of s.offers)if(!positive(o.basePrice)||!positive(o.baseVolume)||!integer(o.duration)||o.duration<1||!integer(o.rounds)||o.rounds>NEGOTIATION.advancedRounds||!['open','counter','agreed','accepted','rejected'].includes(o.status))return fail('Повреждены условия офера.');
  if(!integer(s.offerQuarter)||s.offerQuarter!==s.quarter)return fail('Повреждён квартал предложений.');
  if(s.achievements.some(a=>!text(a)))return fail('Повреждены достижения.');
  for(const r of s.reports){
    if(!r||!integer(r.quarter)||r.quarter>=s.quarter||!array(r.news,3)||r.news.some(n=>!text(n))||!array(r.allocations)||!array(r.finished)||r.finished.some(p=>!validProject(p,true))||!r.event||!text(r.event.message)||!r.corridor||!array(r.corridor.stages,8)||!r.breakdown||!statuses.includes(r.status))return fail('Повреждена история кварталов.');
    for(const k of ['net','budgetBefore','budgetAfter','budgetDelta','eventMoney','reputationDelta'])if(!finite(r[k]))return fail('Повреждены финансовые итоги квартала.');
    for(const k of ['revenue','expenses','delivered','unserved','demand','investments','fleetCondition'])if(!nonnegative(r[k]))return fail('Повреждены показатели квартала.');
    for(const k of ['variable','network','fleet','interest','penalties'])if(!nonnegative(r.breakdown[k]))return fail('Повреждена детализация расходов.');
    for(const a of r.allocations){
      if(!a||!id(a.contractId)||!text(a.name)||!text(a.reason)||!Object.hasOwn(CARGO,a.cargo)||!stationIds.has(a.from)||!stationIds.has(a.to)||!array(a.paths,8))return fail('Повреждена история перевозок.');
      for(const k of ['demand','delivered','unserved','revenue','penalty'])if(!nonnegative(a[k]))return fail('Повреждены объёмы перевозок.');
      for(const p of a.paths){if(!p||!array(p.stations,STATIONS.length)||!array(p.lines,STATIONS.length)||p.stations.length!==p.lines.length+1||!positive(p.distance)||!nonnegative(p.volume)||typeof p.electrified!=='boolean'||p.stations.some(x=>!stationIds.has(x))||p.lines.some(x=>!lineIds.has(x)))return fail('Повреждена история маршрутов.');}
    }
    for(const stage of r.corridor.stages)if(!stage||!CORRIDOR.some(c=>c.id===stage.id&&c.target===stage.target)||!text(stage.label)||typeof stage.done!=='boolean')return fail('Повреждена история коридора.');
    for(const key of ['percent','completed','total','capacity','requiredVolume'])if(!nonnegative(r.corridor[key]))return fail('Повреждена мощность коридора.');
    for(const [key,ids] of [['edgeLoads',lineIds],['stationLoads',stationIds]]){if(!r[key]||typeof r[key]!=='object'||Array.isArray(r[key]))return fail('Повреждена история загрузки.');for(const [id,load] of Object.entries(r[key]))if(!ids.has(id)||!load||!nonnegative(load.load)||!nonnegative(load.capacity)||!nonnegative(load.ratio))return fail('Повреждена загрузка объекта.');}
  }
  return success('Сохранение проверено.',{state:s});
}catch{return fail('Сохранение повреждено и не может быть прочитано. Можно безопасно начать новую кампанию.');}}
export function saveGame(s){try{const checked=validateSave(s);if(!checked.ok)return checked;globalThis.localStorage.setItem(SAVE_KEY,JSON.stringify(s));return success('Кампания сохранена на этом устройстве.');}catch{return fail('Браузер не разрешил локальное сохранение. Экспортируйте кампанию в файл.');}}
export function loadGame(){try{const raw=globalThis.localStorage.getItem(SAVE_KEY);if(!raw)return fail('Сохранённой кампании пока нет.');const result=validateSave(raw);if(!result.ok){try{globalThis.localStorage.setItem(DAMAGED_SAVE_KEY,raw);return {...result,backupKey:DAMAGED_SAVE_KEY};}catch{return result;}}return result;}catch{return fail('Локальное хранилище недоступно.');}}
