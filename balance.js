// Все значения экономики — игровые допущения, не тарифы железной дороги.
export const BALANCE = Object.freeze({
  version: 3, initialBudget: 15000, initialReputation: 72, startingQuarter: 1,
  stationCapacity: [0, 180, 340, 620], lineCapacity: 155,
  stationMaintenance: [0, 13, 23, 39], lineMaintenancePerKm: .025,
  variableCost: 3.15, distanceCost: .0012, maxDetour: 1.8, dieselCost: .6, electricCost: .32,
  penaltyRate: .12, loanSize: 6000, maxDebt: 18000, loanInterest: .025,
  insolvencyGrace: 4, corridorVolume: 125, wearStation: .55, wearLine: .8,
  xpReliable: 25, xpDelivery: 7, xpProject: 110,
  fleetRepairRate: .45, fleetLifeExtensionRate: .2, fleetRenewedAge: .65,
  expiredFleetCapacity: .65, expiredFleetMaintenance: 1.5,
  contractCancellationRate: .2, cancellationReputation: 2,
  seasonalDemand: [.95, 1, 1.08, 1.03], demandJitterBase: .96, demandJitterRange: .08,
  projects: Object.freeze({
    upgradeCost: [0, 2600, 4800], upgradeDuration: [0, 2, 3],
    stationRepairBase: 200, stationRepairPerConditionLevel: 13,
    lineRepairBase: 250, lineRepairPerCondition: 9, lineRepairPerKm: .28, repairDuration: 1,
    tracksBase: 2300, tracksPerKm: 3.1, tracksDuration: 2, longTracksKm: 600, longTracksExtra: 1,
    electrifyBase: 1500, electrifyPerKm: 2.8, electrifyDuration: 2,
    newLineBase: 2800, newLinePerKm: 10, newLineDuration: 3, longLineDuration: 4,
    longLineKm: 700, maxLineKm: 1300, newLineDistanceFactor: 1.08, maxViaDetour: 1.85,
    mountainCostFactor: 1.35, stationWorkCapacity: .85, lineWorkCapacity: .78,
  }),
  negotiation: Object.freeze({
    ordinaryRounds: 2, advancedRounds: 3, advancedLevel: 3,
    minVolume: 20, maxVolumeFactor: 2, maxAgreedVolume: 1.4,
    ceilingBase: 1.08, volumeBonus: .12, neutralReputation: 70, reputationBonus: .001,
    refusalPriceFactor: 1.6, counterPriceFactor: 1.12, counterVolumeFactor: 1.2,
    maxStartDelay: 6,
  }),
  events: Object.freeze({
    // Cumulative deterministic lottery thresholds, in this order.
    inspectionChance: .4, grantChance: .1, demandChance: .22, breakdownChance: .29,
    poorFleetBreakdownChance: .45, restrictionChance: .36, delayChance: .4, poorCondition: 55,
    grant: 1200, demandFactor: 1.12, restrictionCapacity: .65, breakdownCapacity: .6,
    breakdownWear: 9, fineBase: 1200, finePerConviction: 400, fineMax: 2800,
    inspectionReputation: 30, arrestConvictions: 2,
    illegalEveryQuarters: 8, illegalQuarterOffset: 5,
  }),
});
export const LEVELS = Object.freeze([
  {level:1,xp:0,name:'Инженер участка',unlock:'Ремонт, станции до уровня 2, парк и договоры'},
  {level:2,xp:150,name:'Начальник дистанции',unlock:'Дополнительные пути и станции уровня 3'},
  {level:3,xp:480,name:'Главный инженер',unlock:'Электрификация и третий раунд переговоров'},
  {level:4,xp:950,name:'Архитектор сети',unlock:'Проектирование новых линий до 700 км'},
  {level:5,xp:1550,name:'Магнат магистралей',unlock:'Крупные новые линии и завершение транзитного коридора'},
]);
export const CARGO = Object.freeze({coal:{name:'Уголь',icon:'◆',color:'#647888'},oil:{name:'Нефть',icon:'●',color:'#ba7cdf'},goods:{name:'Товары',icon:'▣',color:'#efae51'}});
export const FLEET_TYPES = Object.freeze({
  diesel:{name:'Тепловозы',cost:2700,capacity:280,maintenance:75,life:48,wear:1.3,role:'locomotive'},
  electric:{name:'Электровозы',cost:3400,capacity:350,maintenance:52,life:56,wear:1,role:'locomotive'},
  coal:{name:'Полувагоны',cost:1650,capacity:250,maintenance:36,life:60,wear:.85,role:'wagon'},
  oil:{name:'Цистерны',cost:1900,capacity:230,maintenance:42,life:56,wear:.9,role:'wagon'},
  goods:{name:'Крытые вагоны',cost:1800,capacity:260,maintenance:38,life:60,wear:.85,role:'wagon'},
});

// Scenario demand and tariff tuning. Geography is defined separately in data.js.
export const BASE_CONTRACTS = Object.freeze([
  {id:'base-coal',name:'Тепло столицы',from:'karaganda',to:'astana',cargo:'coal',volume:145,price:14},
  {id:'base-goods',name:'Грузовой экспресс',from:'almaty',to:'astana',cargo:'goods',volume:80,price:20},
  {id:'base-oil',name:'Каспийская нефть',from:'atyrau',to:'aktobe',cargo:'oil',volume:110,price:14},
  {id:'base-south',name:'Южная торговля',from:'shymkent',to:'almaty',cargo:'goods',volume:65,price:16},
]);
export const OFFER_TEMPLATES = Object.freeze([
  {name:'Столичный строительный сезон',from:'karaganda',to:'astana',cargo:'goods',volume:65,price:20},
  {name:'Металлургический заказ',from:'pavlodar',to:'karaganda',cargo:'coal',volume:75,price:18},
  {name:'Западный нефтяной терминал',from:'atyrau',to:'aktau',cargo:'oil',volume:90,price:18},
  {name:'Грузы Нового шёлкового пути',from:'altynkol',to:'almaty',cargo:'goods',volume:85,price:23},
  {name:'Товары южных регионов',from:'shymkent',to:'kyzylorda',cargo:'goods',volume:80,price:20},
  {name:'Уголь для промышленности',from:'karaganda',to:'kostanay',cargo:'coal',volume:70,price:21},
]);
export const ILLEGAL_OFFER = Object.freeze({name:'Груз без подтверждённой декларации',from:'dostyk',to:'almaty',cargo:'goods',volume:50,price:48,duration:3,severity:2,description:'ПОДОЗРИТЕЛЬНО: контрагент просит принять груз с заведомо недостоверными документами. Возможны проверка, штраф, увольнение и арест. Безопасный выбор — отказ.'});
