/* Original procedural miniature artwork. Canvas 2D, no external assets. */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const palettes = [
  { grass: '#e1dfc5', deep: '#506e74', light: '#fff8e9', patch: '#c5d5bd', sand: '#d7c5a3', leaf: '#345d4d', leaf2: '#769574', water: '#237d95', mountain: '#677c84', snow: true },
  { grass: '#b8b66b', deep: '#4e654b', light: '#dfd28a', patch: '#809d4d', sand: '#dcb76f', leaf: '#31673c', leaf2: '#7eaa42', water: '#117d95', mountain: '#797d72', snow: false },
  { grass: '#d6bc72', deep: '#566442', light: '#efd792', patch: '#91a651', sand: '#e2be7b', leaf: '#316537', leaf2: '#83a83c', water: '#097b92', mountain: '#81796b', snow: false },
  { grass: '#c4a363', deep: '#615e42', light: '#e6ca87', patch: '#a49a52', sand: '#d6b67a', leaf: '#685f31', leaf2: '#c39936', water: '#236e84', mountain: '#80786b', snow: false },
];
const country = [
  [46.8,48.3],[47.2,49.3],[46.6,50.2],[48.1,50.8],[48.7,50.6],[49.5,51.5],
  [51.4,51.4],[52.4,51.9],[53.9,51.2],[54.5,51.8],[55.7,50.6],[56.6,51.1],
  [57.4,51.0],[58.6,51.1],[59.5,50.8],[60.0,51.8],[60.8,52.7],[61.8,53.2],
  [61.2,54.0],[63.0,54.2],[64.5,54.7],[66.3,54.7],[68.0,55.3],[69.5,55.1],
  [70.6,54.1],[71.2,54.1],[72.4,54.2],[73.5,53.4],[74.7,53.7],[76.5,54.0],
  [77.8,53.0],[79.5,50.9],[80.1,50.8],[80.7,51.3],[81.5,50.7],[82.8,50.8],
  [83.2,51.0],[84.3,50.6],[85.1,49.9],[86.6,49.8],[87.2,49.0],[86.7,48.6],
  [85.5,48.4],[85.8,47.4],[84.8,46.9],[83.0,47.2],[82.4,46.6],[82.7,45.5],
  [82.0,45.1],[80.5,44.8],[80.4,43.1],[79.5,42.5],[78.0,42.9],[76.8,42.9],
  [75.3,42.5],[74.1,42.7],[73.1,42.3],[71.3,42.8],[70.8,41.9],[69.1,41.0],
  [68.4,40.8],[68.6,41.7],[66.8,42.0],[66.0,42.9],[64.5,43.6],[62.1,43.5],
  [61.0,44.1],[59.7,44.1],[58.6,45.6],[56.0,45.6],[55.9,42.9],[54.7,42.7],
  [53.0,42.0],[52.1,42.0],[51.2,43.2],[50.2,44.3],[50.8,44.8],[50.0,45.2],
  [50.3,46.2],[49.4,46.7],[48.0,46.7],[47.4,47.3]
];
const geo = (lon, lat) => ({ x: (lon - 66.8) * 27, y: (48.0 - lat) * 36 });
const outline = country.map(([lon, lat]) => geo(lon, lat));
function rng(seed) { return () => { seed = Math.imul(1664525, seed) + 1013904223 | 0; return (seed >>> 0) / 4294967296; }; }
function hash(str) { let n = 7; for (const c of String(str)) n = Math.imul(n, 31) + c.charCodeAt(0) | 0; return n >>> 0; }
function poly(ctx, pts, fill, stroke, width = 1) {
  if (!pts.length) return;
  ctx.beginPath(); ctx.moveTo(pts[0].x ?? pts[0][0], pts[0].y ?? pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x ?? pts[i][0], pts[i].y ?? pts[i][1]);
  ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function path(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); }
function ellipse(ctx, x, y, rx, ry, color) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fillStyle = color; ctx.fill(); }
function line(ctx, x, y, xx, yy, color, width = 1) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xx, yy); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }
function round(ctx, x, y, w, h, r, fill, stroke) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); } }
function inside(p, polygon = outline) { let c = false; for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { const a = polygon[i], b = polygon[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) c = !c; } return c; }
function tree(ctx, x, y, s, p, pine = false) {
  ellipse(ctx, x + s * .7, y + s * .05, s * .9, s * .29, '#24382035');
  line(ctx, x, y, x, y - s * .95, '#625236', Math.max(.8, s * .16));
  if (pine) {
    for(let k=0;k<3;k++){const yy=y-s*(.35+k*.43),ww=s*(.68-k*.12);poly(ctx,[[x,yy-s*1.15],[x-ww,yy],[x+ww*.86,yy]],p.leaf);poly(ctx,[[x,yy-s*1.15],[x-ww,yy],[x-.08*s,yy-.12*s]],p.leaf2);}
    if (p.snow) poly(ctx, [[x,y-s*2],[x-s*.3,y-s*1.2],[x+s*.31,y-s*1.2]], '#f6f6e9');
  } else {
    ellipse(ctx,x,y-s*1.13,s*.77,s*.81,p.leaf);
    ellipse(ctx,x-s*.24,y-s*1.45,s*.54,s*.57,p.snow?'#e5e9d4':p.leaf2);
    ellipse(ctx,x+s*.38,y-s*1.03,s*.39,s*.45,p.leaf);
    ellipse(ctx,x-s*.48,y-s*.89,s*.36,s*.41,p.leaf2);
    line(ctx,x,y-s*.5,x-s*.27,y-s*.94,'#6e683858',s*.11);
  }
}
function rock(ctx, x, y, s, snow = false) {
  ellipse(ctx, x+s*.4, y+s*.12, s*.8, s*.24, '#4b573923');
  poly(ctx, [[x-s*.7,y],[x-s*.5,y-s*.62],[x+s*.1,y-s*.9],[x+s*.65,y-s*.32],[x+s*.45,y+s*.13]], '#8f9481');
  poly(ctx, [[x-s*.7,y],[x-s*.5,y-s*.62],[x+s*.1,y-s*.9],[x+s*.2,y-s*.3]], snow ? '#f1f3e4' : '#d0cbb0');
}
function mountain(ctx, x, y, w, h, p) {
  ellipse(ctx, x+w*.22, y, w*.66, w*.19, '#263f3b2b');
  const peaks = [[x-w*.6,y],[x-w*.35,y-h*.42],[x-w*.15,y-h*.55],[x+w*.01,y-h],[x+w*.24,y-h*.6],[x+w*.52,y-h*.1],[x+w*.57,y+w*.06]];
  poly(ctx, peaks, p.mountain);
  poly(ctx, [[x-w*.6,y],[x-w*.35,y-h*.42],[x-w*.15,y-h*.55],[x+w*.01,y-h],[x+w*.09,y-h*.43],[x-w*.07,y-h*.23],[x+w*.05,y]], '#c4b599');
  poly(ctx,[[x+w*.01,y-h],[x+w*.24,y-h*.6],[x+w*.52,y-h*.1],[x+w*.18,y-h*.17],[x+w*.1,y-h*.52]],'#4c6160');
  poly(ctx, [[x+w*.01,y-h],[x+w*.24,y-h*.6],[x+w*.1,y-h*.68],[x+w*.07,y-h*.5],[x-w*.02,y-h*.63],[x-w*.13,y-h*.58]], '#f7f4e7');
  for(let k=0;k<4;k++){const xx=x-w*.23+k*w*.14;line(ctx,xx,y-h*(.42+k*.055),xx-w*.13,y-h*.04,'#dfceb182',.7);}
  line(ctx, x+w*.1, y-h*.68, x+w*.39,y-h*.08, '#354e55', .7);
}
function building(ctx, x, y, w, d, h, roof = '#197d9b', wall = '#f1dfb1', detail = true) {
  const z = d * .55;
  poly(ctx, [[x-w*.5,y],[x+w*.5,y],[x+w*.5+d*.45,y-z],[x-w*.5+d*.45,y-z]], '#51634127');
  poly(ctx, [[x-w*.5,y],[x+w*.5,y],[x+w*.5,y-h],[x-w*.5,y-h]], wall);
  poly(ctx, [[x+w*.5,y],[x+w*.5+d*.45,y-z],[x+w*.5+d*.45,y-z-h],[x+w*.5,y-h]], '#b9a27a');
  const ridge=z*.5+Math.min(4,w*.15);
  poly(ctx, [[x-w*.55,y-h],[x+w*.55,y-h],[x+w*.55+d*.23,y-h-ridge],[x-w*.55+d*.23,y-h-ridge]], roof);
  poly(ctx, [[x-w*.55+d*.23,y-h-ridge],[x+w*.55+d*.23,y-h-ridge],[x+w*.55+d*.49,y-h-z],[x-w*.55+d*.49,y-h-z]], '#215772');
  line(ctx,x-w*.55+d*.23,y-h-ridge,x+w*.55+d*.23,y-h-ridge,'#9ac5ca',.7);
  line(ctx,x-w*.5,y-h+1,x+w*.5,y-h+1,'#fff0c8',1.2);
  if (detail) for (let k = 0; k < Math.max(1, Math.floor(w/8)); k++) { const xx=x-w*.5+3+k*8;ctx.fillStyle = '#f9edcc';ctx.fillRect(xx-1,y-h+3,5,Math.min(7,h*.42));ctx.fillStyle = '#29526a';ctx.fillRect(xx,y-h+4,3,Math.min(5,h*.35));line(ctx,xx,y-h+6,xx+3,y-h+6,'#7cadb5',.5); }
  if (h > 9) { ctx.fillStyle = '#2f5662'; ctx.fillRect(x-2, y-6, 4, 6); }
}
function stationModel(ctx, x, y, level, p, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ellipse(ctx, 7, 3, 28+level*6, 10, '#35504425');
  poly(ctx, [[-29,4],[32,4],[41,-9],[-19,-9]], '#b6b39b');
  line(ctx,-25,2,32,2,'#f8f2d7',2);
  line(ctx,-25,4,32,4,'#5b655d',1.4);
  if (level === 1) { building(ctx,0,-3,27,14,14,'#198bb2'); building(ctx,-20,-3,11,11,9,'#236783');poly(ctx,[[-4,-17],[1,-23],[6,-17]],'#2f90ab');line(ctx,1,-23,1,-25,'#ecc55c',.7); }
  else {
    building(ctx,0,-3,level===3?46:36,17,20,'#168aaa');
    if (level===3) {
      building(ctx,-25,-2,12,14,27,'#1d7d98'); building(ctx,25,-2,12,14,27,'#1d7d98');
      building(ctx,0,-9,13,10,33,'#2393b2'); ellipse(ctx,0,-36,3,3,'#fff1c9');
      line(ctx,0,-36,0,-38,'#244457',.7); line(ctx,0,-36,1.8,-36,'#244457',.7);
      for(const x of [-26,26]){line(ctx,x,-38,x,-43,'#e6bc54',.8);ellipse(ctx,x,-43,.9,.9,'#f6d57a');}
    }
    line(ctx,-21,-3,24,-3,'#faf5da',1.4);
    for(const xx of [-11,0,11]){round(ctx,xx-2.1,-13,4.2,9,2,'#27526b');line(ctx,xx-2.1,-5,xx+2.1,-5,'#fff1cd',.8);}
    line(ctx,-19,-16,19,-16,'#fcf2d1',1);
    for (let k=0;k<4;k++) line(ctx,-16+k*10,1,-16+k*10,-7,'#788d7a',1);
    poly(ctx,[[-21,-7],[26,-7],[31,-13],[-16,-13]],'#2486a4');
    line(ctx,-21,-7,26,-7,'#9fc7c5',1);
    for(const x of [-14,-4,6,16])line(ctx,x,-7,x+5,-13,'#1e5977',.5);
  }
  ctx.fillStyle='#f5edc9';ctx.fillRect(-7,-19,14,3);ctx.fillStyle='#1f6481';ctx.fillRect(-5,-18.5,10,.8);
  tree(ctx,-35,0,6,p); if(level>1)tree(ctx,36,-3,7,p);
  ctx.restore();
}
function trainCar(ctx, head, color, freight, variant=0) {
  round(ctx,-9,0,17,7,2,'#1b292a40');
  const cargoColors=['#225b47','#ba5830','#c0a45e','#365b69'];
  round(ctx,-8,-5,15,7,1.6,head?color:(freight?cargoColors[variant%4]:'#e8eee4'),'#243d43');
  round(ctx,-7,-6,13,3,1,head?'#becfd0':(freight?cargoColors[variant%4]:'#f9f0d8'));
  if(head) {
    ctx.fillStyle='#153644';ctx.fillRect(1,-5,4,3);line(ctx,-7,-.5,6,-.5,'#f4b928',1.4);
    line(ctx,-4,-4,-4,-1.5,'#b9dbe0',1);ellipse(ctx,6.5,-1,1,.75,'#fff2b0');
    for(let k=0;k<3;k++)line(ctx,-6+k*2,-5,-6+k*2,-2,'#16394d',.65);
  } else if(!freight) {
    line(ctx,-7,0,6,0,'#227baf',1.5);for(let k=0;k<3;k++){ctx.fillStyle='#234b64';ctx.fillRect(-5+k*4,-4,2,3);}
  } else {
    if(variant%4===0){round(ctx,-6,-5,11,3,.4,'#252b28');for(let k=0;k<5;k++)ellipse(ctx,-5+k*2,-4.8,.8,.6,'#4b5246');}
    else if(variant%4===3){round(ctx,-7,-6,13,5,2,'#95afb0');line(ctx,-5,-6,-5,-1,'#456675',.7);line(ctx,3,-6,3,-1,'#456675',.7);}
    for(let k=0;k<4;k++)line(ctx,-5+k*3,-3,-5+k*3,.5,'#172f354a',.6);
  }
  ellipse(ctx,-4,2,1.5,1,'#34443a');ellipse(ctx,4,2,1.5,1,'#34443a');
  line(ctx,-9,1,-11,1,'#30484a',1.4);
}
function train(ctx, x, y, angle, scale, color, cars = 3, freight = false) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
  for(let i=cars;i>=0;i--){ctx.save();ctx.translate(-i*17,0);trainCar(ctx,i===0,color,freight);ctx.restore();}
  ctx.restore();
}
// Original miniature scenery. These landmarks illustrate the regions; they are not game assets or extra production nodes.
function pumpjack(ctx,x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ellipse(ctx,4,1,15,4,'#50452c3a');
  poly(ctx,[[-8,0],[-2,-20],[6,0]],null,'#343f39',2);line(ctx,-5,-7,3,-7,'#475149',1);line(ctx,-2,-20,8,-23,'#343f39',2.6);
  poly(ctx,[[6,-26],[12,-24],[12,-18],[8,-17]],'#b88729','#383e32',.8);line(ctx,11,-18,11,1,'#414e44',1);
  line(ctx,-2,-20,-12,-16,'#454936',2);ellipse(ctx,-11,-16,3,3,'#9a8237');round(ctx,-13,-5,8,6,1,'#45636a');ctx.restore();
}
function crane(ctx,x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ellipse(ctx,7,1,22,4,'#244b4f25');
  for(const xx of [-10,10]){line(ctx,xx,0,xx-2,-34,'#d6a335',2.7);line(ctx,xx,0,xx+6,0,'#274a58',2);}
  line(ctx,-15,-33,23,-33,'#f2c650',3);line(ctx,-13,-38,22,-38,'#ffe0a2',1);line(ctx,-13,-38,-15,-33,'#b58226',1);line(ctx,22,-38,23,-33,'#b58226',1);
  for(let i=-11;i<20;i+=6){line(ctx,i,-38,i+5,-33,'#755c2b',.8);line(ctx,i+5,-33,i+6,-38,'#755c2b',.8);}
  line(ctx,19,-33,19,-15,'#395967',.7);line(ctx,19,-15,16,-12,'#395967',1);round(ctx,-8,-31,8,7,1,'#257d9b','#dbb258');ctx.restore();
}
function silo(ctx,x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ellipse(ctx,5,1,13,4,'#263e362f');
  round(ctx,-7,-21,14,22,1,'#aeb5a5','#727e75');ellipse(ctx,0,-21,7,3,'#d2d4bd');poly(ctx,[[-8,-22],[0,-29],[8,-22]],'#c5cbba','#6d7d76',.7);
  for(let yy=-18;yy<0;yy+=5)line(ctx,-6,yy,6,yy,'#7f8e848c',.65);line(ctx,4,-23,4,0,'#526a6a',.7);ctx.restore();
}
function waterTower(ctx,x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);for(const xx of [-5,5])line(ctx,xx,0,xx*.75,-23,'#765d39',1.5);
  line(ctx,-5,-2,4,-17,'#6f6549',.9);line(ctx,5,-2,-4,-17,'#6f6549',.9);round(ctx,-7,-32,14,11,2,'#a48753','#635c45');ellipse(ctx,0,-32,7,3,'#296882');poly(ctx,[[-8,-32],[0,-37],[8,-32]],'#337c98');ctx.restore();
}
function industry(ctx,x,y,p,variant=0){
  ctx.save();ctx.translate(x,y);poly(ctx,[[-28,8],[32,8],[43,-15],[-16,-15]],'#aea785');
  building(ctx,-8,1,29,15,13,'#416d79','#c6b998');building(ctx,19,2,17,13,10,'#385f70','#d4c29b');
  for(const xx of [-19,13]){round(ctx,xx,-34,4,28,.7,'#816c59');line(ctx,xx,-26,xx+4,-26,'#dfd6b7',2);ellipse(ctx,xx+2,-34,2,1,'#48544c');}
  if(variant%2===0){silo(ctx,34,-5,.63);silo(ctx,24,-9,.62);}else{for(let i=0;i<3;i++)building(ctx,3+i*11,11,10,7,5,i%2?'#a85532':'#267f94','#b0835b',false);}
  tree(ctx,-30,-1,5,p);ctx.restore();
}
function coalMine(ctx,x,y){
  ctx.save();ctx.translate(x,y);ellipse(ctx,2,3,43,23,'#7c7153');ellipse(ctx,0,0,39,20,'#494e46');
  for(let i=0;i<6;i++){ctx.beginPath();ctx.ellipse(-i*.65,-i*.9,36-i*4.7,17-i*2.2,0,0,TAU);ctx.strokeStyle=i%2?'#b7ab86':'#807b63';ctx.lineWidth=2.6;ctx.stroke();}
  ellipse(ctx,-4,-6,10,4,'#303b37');line(ctx,7,-9,29,-28,'#344a4a',2);line(ctx,7,-7,29,-26,'#b6ad8a',.7);
  poly(ctx,[[27,-13],[30,-35],[38,-13]],null,'#4c5650',1.5);line(ctx,28,-35,40,-35,'#445751',2);ellipse(ctx,32,-34,4,4,'#48574d');
  building(ctx,43,-6,16,12,11,'#375968','#c8b48a');ctx.restore();
}
function capital(ctx,x,y,p){
  ctx.save();ctx.translate(x,y);ellipse(ctx,0,3,19,7,'#355f6138');poly(ctx,[[-8,0],[9,0],[3,-29],[-3,-29]],'#c7dfca','#4b8491',.7);
  for(const xx of [-4,0,4])line(ctx,xx,0,xx*.65,-30,'#fff3cf',.7);ellipse(ctx,0,-33,8,8,'#d6aa38');ellipse(ctx,-2,-35,4.7,5,'#f8d568');
  building(ctx,-24,-3,13,11,28,'#437f97','#9dc0b7');building(ctx,23,-4,13,11,35,'#407a96','#b8ccbf');
  for(let k=0;k<5;k++){line(ctx,-29,-7-k*4,-19,-7-k*4,'#315e75',1);line(ctx,18,-9-k*5,27,-9-k*5,'#40748a',1);}
  tree(ctx,-15,5,4,p);tree(ctx,15,5,4,p);ctx.restore();
}
function ship(ctx,x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ellipse(ctx,0,3,23,4,'#08455e3d');poly(ctx,[[-22,-2],[20,-2],[14,5],[-15,5]],'#f1dfb1','#164655',.6);poly(ctx,[[-20,1],[18,1],[14,5],[-15,5]],'#ba5738');
  building(ctx,-9,-1,9,6,7,'#1b738e','#ece1bf',false);for(let i=0;i<3;i++)building(ctx,1+i*5,-1,5,5,3,i%2?'#d9a035':'#307c93','#a77447',false);line(ctx,-10,-8,-10,-15,'#2f5463',.7);ctx.restore();
}
function lengthPath(points) { let total=0; const lengths=[0]; for(let i=1;i<points.length;i++){total+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);lengths.push(total);}return{points,lengths,total}; }
function atPath(route, amount) { const dist=clamp(amount,0,1)*route.total;let i=1;while(i<route.lengths.length-1&&route.lengths[i]<dist)i++;const a=route.points[i-1],b=route.points[i],d=route.lengths[i]-route.lengths[i-1]||1,t=(dist-route.lengths[i-1])/d;return{x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),angle:Math.atan2(b.y-a.y,b.x-a.x)}; }
function distanceSegment(p,a,b) { const x=b.x-a.x,y=b.y-a.y,t=clamp(((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1),0,1);return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y); }

export class World {
  constructor(canvas, {onSelect = () => {}} = {}) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d');this.onSelect=onSelect;
    this.state=null;this.forecast={};this.selected=null;this.layer='load';this.zoomLevel=1;this.pan={x:0,y:0};this.routes=[];this.season=-1;this.running=false;this.phase=0;this.hover=null;this.raf=null;
    // These clocks are purely visual. No renderer method advances the campaign.
    this.ambient=true;this.visualTime=0;this.trainTime=0;this.safeArea={left:100,right:70,top:150,bottom:95};
    this.motionQuery=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
    this.reducedMotion=!!this.motionQuery?.matches;
    const random=rng(93271);
    this.weatherSeeds=Array.from({length:44},()=>({x:random(),y:random(),phase:random(),size:.7+random()*1.2,speed:.7+random()*.6}));
    this.windSeeds=Array.from({length:10},()=>({x:-430+random()*880,y:-170+random()*330,phase:random()*12}));
    this.onMotionChange=event=>{this.reducedMotion=event.matches;this.lastFrame=0;this.requestRender();};
    this.motionQuery?.addEventListener?.('change',this.onMotionChange);
    this.onVisibilityChange=()=>{this.lastFrame=0;if(document.hidden){if(this.raf)cancelAnimationFrame(this.raf);this.raf=null;}else this.requestRender();};
    document.addEventListener('visibilitychange',this.onVisibilityChange);
    this.resize=this.resize.bind(this);this.render=this.render.bind(this);
    this.resizeObserver=new ResizeObserver(this.resize);this.resizeObserver.observe(canvas);
    this.bind();this.resize();
  }
  resize() {
    const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,r.width||innerWidth);this.height=Math.max(1,r.height||innerHeight);this.dpr=Math.min(devicePixelRatio||1,2);
    this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);
    const {left,right,top,bottom}=this.safeArea;
    this.baseScale=Math.max(.35,Math.min((this.width-left-right)/1210,(this.height-top-bottom)/580));
    this.center={x:(left+this.width-right)/2,y:(top+this.height-bottom)/2-6};this.requestRender();
  }
  bind() {
    this.canvas.addEventListener('pointerdown',e=>{ if(e.button!==0)return;this.drag={x:e.clientX,y:e.clientY,px:this.pan.x,py:this.pan.y,moved:false};this.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener('pointermove',e=>{const r=this.canvas.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top};if(this.drag){const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.hypot(dx,dy)>4)this.drag.moved=true;this.pan={x:this.drag.px+dx,y:this.drag.py+dy};this.canvas.style.cursor='grabbing';this.requestRender();}else{const hit=this.hit(p);if(JSON.stringify(hit)!==JSON.stringify(this.hover)){this.hover=hit;this.requestRender();}this.canvas.style.cursor=hit?'pointer':'grab';}});
    this.canvas.addEventListener('pointerup',e=>{if(!this.drag)return;const r=this.canvas.getBoundingClientRect();if(!this.drag.moved){const hit=this.hit({x:e.clientX-r.left,y:e.clientY-r.top});if(hit)this.onSelect(hit);}this.drag=null;this.canvas.style.cursor='grab';});
    this.canvas.addEventListener('pointercancel',()=>this.drag=null);
    this.canvas.addEventListener('pointerleave',()=>{if(!this.drag){this.hover=null;this.requestRender();}});
    this.canvas.addEventListener('wheel',e=>{e.preventDefault();const r=this.canvas.getBoundingClientRect();this.zoom(-Math.sign(e.deltaY)*.55,{x:e.clientX-r.left,y:e.clientY-r.top});},{passive:false});
  }
  update(state, forecast={}, selected=null) {
    this.state=state;this.forecast=forecast||{};this.selected=selected;
    const season=((Number(state.quarter)||0)%4+4)%4;
    if(season!==this.season){this.season=season;this.buildTerrain();}
    const stations=Array.isArray(state.stations)?state.stations:Object.values(state.stations||{});
    this.stations=stations.map(s=>({...s,point:geo(s.lon??s.lng??s.longitude,s.lat??s.latitude)}));this.stationById=Object.fromEntries(this.stations.map(s=>[s.id,s]));
    this.routes=(Array.isArray(state.lines)?state.lines:Object.values(state.lines||{})).map(l=>{const a=this.stationById[l.a],b=this.stationById[l.b];if(!a||!b)return null;let points=[];const waypoints=l.waypoints||(Array.isArray(l.via)?l.via:[]);if(waypoints.length){points=[a.point,...waypoints.map(p=>Array.isArray(p)?geo(p[0],p[1]):geo(p.lon??p.lng,p.lat)),b.point];}else{const dx=b.point.x-a.point.x,dy=b.point.y-a.point.y,d=Math.hypot(dx,dy),curve=((hash(l.id)%3)-1)*Math.min(11,d*.07);for(let i=0;i<=24;i++){const t=i/24;points.push({x:mix(a.point.x,b.point.x,t)-dy/(d||1)*Math.sin(t*Math.PI)*curve,y:mix(a.point.y,b.point.y,t)+dx/(d||1)*Math.sin(t*Math.PI)*curve});}}return{...l,...lengthPath(points)};}).filter(Boolean);
    this.requestRender();
  }
  setLayer(layer){this.layer=layer;this.requestRender();}
  setAmbient(enabled){this.ambient=!!enabled;this.lastFrame=0;this.requestRender();}
  setSafeArea(insets={}){this.safeArea={...this.safeArea,...insets};this.resize();}
  zoom(delta, pivot=this.center){const old=this.baseScale*this.zoomLevel;this.zoomLevel=clamp(this.zoomLevel*Math.exp(delta*.23),.7,3.4);const s=this.baseScale*this.zoomLevel;this.pan.x=(this.pan.x+this.center.x-pivot.x)*s/old+pivot.x-this.center.x;this.pan.y=(this.pan.y+this.center.y-pivot.y)*s/old+pivot.y-this.center.y;this.requestRender();}
  resetView(){this.zoomLevel=1;this.pan={x:0,y:0};this.requestRender();}
  focus(selection){this.selected=selection;let p=selection?.type==='station'?this.stationById?.[selection.id]?.point:null;if(selection?.type==='line'){const r=this.routes.find(r=>r.id===selection.id);if(r)p=atPath(r,.5);}if(p){this.zoomLevel=Math.max(1,this.zoomLevel);const s=this.baseScale*this.zoomLevel;const q=this.toScreen(p),area=this.safeArea;if(q.x<area.left||q.x>this.width-area.right||q.y<area.top||q.y>this.height-area.bottom)this.pan={x:-p.x*s,y:-p.y*s};}this.requestRender();}
  animateQuarter(value){if(value&&!this.running){this.quarterStarted=performance.now();this.quarterVisualTime=0;}this.running=!!value;if(!value){this.quarterStarted=null;this.quarterVisualTime=0;}this.requestRender();}
  toScreen(p){const s=this.baseScale*this.zoomLevel;return{x:this.center.x+this.pan.x+p.x*s,y:this.center.y+this.pan.y+p.y*s};}
  toWorld(p){const s=this.baseScale*this.zoomLevel;return{x:(p.x-this.center.x-this.pan.x)/s,y:(p.y-this.center.y-this.pan.y)/s};}
  hit(screen){if(!this.state)return null;const p=this.toWorld(screen),scale=this.baseScale*this.zoomLevel;let nearest=null,min=Infinity;for(const s of this.stations){const d=Math.hypot(p.x-s.point.x,p.y-s.point.y);if(d<23/scale&&d<min){min=d;nearest={type:'station',id:s.id};}}if(nearest)return nearest;for(const r of this.routes){for(let i=1;i<r.points.length;i++){const d=distanceSegment(p,r.points[i-1],r.points[i]);if(d<8/scale&&d<min){min=d;nearest={type:'line',id:r.id};}}}return nearest;}
  requestRender(){if(!this.destroyed&&!document.hidden&&!this.raf)this.raf=requestAnimationFrame(this.render);}
  buildTerrain(){
    const p=palettes[this.season]||palettes[1],c=document.createElement('canvas');c.width=2720;c.height=1860;const ctx=c.getContext('2d');ctx.scale(2,2);ctx.translate(680,465);this.terrain=c;
    const random=rng(75923);
    // Faded neighbouring relief frames the golden border without inventing selectable locations.
    const fade=ctx.createRadialGradient(0,20,280,0,20,690);fade.addColorStop(0,'#8d917249');fade.addColorStop(.7,'#82928a23');fade.addColorStop(1,'#82928a00');ctx.fillStyle=fade;ctx.fillRect(-680,-465,1360,930);
    ctx.save();ctx.globalAlpha=.19;for(let i=0;i<220;i++){const x=random()*1300-650,y=random()*790-380;if(inside({x,y}))continue;mountain(ctx,x,y,25+random()*50,10+random()*24,{mountain:'#758a85'});}ctx.restore();
    ctx.save();ctx.translate(7,16);ctx.shadowColor='#163c4870';ctx.shadowBlur=19;poly(ctx,outline,'#224453');ctx.restore();
    ctx.save();ctx.translate(0,7);poly(ctx,outline,p.deep,'#1e4252',2.5);ctx.restore();
    poly(ctx,outline,p.grass,'#244454',5);poly(ctx,outline,null,'#e9be55',2.3);
    ctx.save();poly(ctx,outline);ctx.clip();
    // Layered soil, northern grassland and fine grain create a hand-built strategy miniature.
    for(let i=0;i<230;i++){const x=random()*1230-650,y=random()*630-290;ctx.beginPath();ctx.ellipse(x,y,20+random()*70,8+random()*29,random()*.8,0,TAU);ctx.fillStyle=i%3===0?p.patch:i%3===1?p.light:p.sand;ctx.globalAlpha=.15+random()*.25;ctx.fill();}ctx.globalAlpha=1;
    const north=ctx.createLinearGradient(0,-290,0,170);north.addColorStop(0,p.snow?'#eaf0db6b':'#6f963960');north.addColorStop(.56,p.snow?'#eaf0db10':'#91a65012');north.addColorStop(1,'#91a65000');ctx.fillStyle=north;ctx.fillRect(-650,-290,1230,630);
    // Warm dry western steppe and the pale southern desert.
    const desert=ctx.createRadialGradient(-290,140,20,-290,140,300);desert.addColorStop(0,p.sand+'ad');desert.addColorStop(1,p.sand+'00');ctx.fillStyle=desert;ctx.fillRect(-660,-240,900,620);
    for(let i=0;i<3700;i++){const x=random()*1220-650,y=random()*600-270;if(!inside({x,y}))continue;const s=.4+random()*1.7;line(ctx,x,y,x+s,y-s*.22,i%3===0?'#fff0c95f':'#716b393b',.5);}
    // Roads are deliberately simplified, decorative local roads, not railway data.
    for(const [a,b] of [[[50.0,47.0],[54.4,49.2]],[[60,50.7],[64.6,51.7]],[[68,52.9],[73,51.1]],[[67,44.3],[74,44.8]],[[75.5,48.2],[80.4,50.3]]]) {const aa=geo(...a),bb=geo(...b);ctx.beginPath();ctx.moveTo(aa.x,aa.y);ctx.bezierCurveTo(aa.x+15,aa.y+25,bb.x-25,bb.y+30,bb.x,bb.y);ctx.strokeStyle='#8d9d6540';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#ddd3a2';ctx.lineWidth=2.2;ctx.stroke();}
    // Inland water: stylised silhouettes with pale shores and small reflections.
    this.lake(ctx,[[74.1,46.5],[74.8,46.9],[75.7,46.8],[76.7,46.2],[77.4,46.3],[78.5,46.7],[79.4,46.4],[78.7,45.9],[77.2,45.8],[75.6,46.3],[74.7,46.1]],p);
    this.lake(ctx,[[59.0,46.4],[60.8,46.6],[61.4,46.1],[61.0,45.3],[60.1,44.8],[59.4,45.3]],p);
    this.lake(ctx,[[81.1,46.6],[81.8,46.8],[82.1,46.4],[81.7,46.0],[81.2,46.0]],p);
    this.lake(ctx,[[83.4,48.0],[84.7,48.0],[85.2,47.8],[84.4,47.5],[83.2,47.7]],p);
    this.river(ctx,[[86.0,48.2],[83.8,49.4],[82.6,50.2],[80.5,50.3],[78.7,52.1],[77.2,53.3]],p);
    this.river(ctx,[[70.7,42.5],[68.7,43.2],[67.9,44.0],[65.5,44.8],[63.5,45.4],[61.2,46.1]],p);
    this.river(ctx,[[52.1,51.4],[51.4,50.6],[51.6,49.5],[51.1,48.3],[51.8,47.1]],p);
    // Forests follow the wetter northern and eastern edges; isolated groves in the steppe.
    const objects=[];
    for(let i=0;i<330;i++){const lon=47+random()*39,lat=42+random()*13,pos=geo(lon,lat);if(!inside(pos))continue;const chance=lon>78?.72:lat>50?.75:.25;if(random()>chance)continue;const grove=2+Math.floor(random()*5);for(let k=0;k<grove;k++){const x=pos.x+(random()-.5)*20,y=pos.y+(random()-.5)*11;if(inside({x,y}))objects.push({kind:'tree',x,y,s:2.6+random()*3.8,pine:lon>79||lat>52});}}
    for(let i=0;i<200;i++){const pos={x:random()*1160-590,y:random()*590-270};if(inside(pos))objects.push({kind:'rock',...pos,s:1.5+random()*3.6});}
    for(let i=0;i<64;i++){const lon=73.5+random()*10.5,lat=42.3+random()*.9,pos=geo(lon,lat);if(inside(pos))objects.push({kind:'mountain',...pos,w:15+random()*32,h:13+random()*27});}
    for(let i=0;i<62;i++){const lon=81.5+random()*5,lat=48.0+random()*2.7,pos=geo(lon,lat);if(inside(pos))objects.push({kind:'mountain',...pos,w:17+random()*34,h:18+random()*31});}
    for(let i=0;i<32;i++){const lon=65.8+random()*7,lat=47.2+random()*2.2,pos=geo(lon,lat);if(inside(pos))objects.push({kind:'mountain',...pos,w:10+random()*23,h:6+random()*12});}
    objects.sort((a,b)=>a.y-b.y);for(const o of objects){if(o.kind==='tree')tree(ctx,o.x,o.y,o.s,p,o.pine);else if(o.kind==='rock')rock(ctx,o.x,o.y,o.s,p.snow);else mountain(ctx,o.x,o.y,o.w,o.h,p);}
    // Small cultivated plots and wind farms give the landscape a lived-in scale.
    for(const [lon,lat] of [[66.7,54],[63.5,52.4],[68,53.6],[71.9,52.8],[75.4,52.5],[75.5,43.8]]){const q=geo(lon,lat);for(let i=0;i<8;i++){const x=q.x+(i%4)*15,y=q.y+Math.floor(i/4)*11;poly(ctx,[[x,y],[x+13,y],[x+19,y-9],[x+6,y-9]],p.snow?'#dae0c6':(i%3?'#d0af4d':'#99a447'),'#dac486',.6);for(let j=0;j<5;j++)line(ctx,x+2+j*2.5,y-1,x+7+j*2.5,y-8,p.snow?'#a4b29372':'#836f2872',.7);}}
    for(let i=0;i<4;i++){const q=geo(73+i*.28,45.2);line(ctx,q.x,q.y,q.x,q.y-14,'#e5e9d7',1.3);line(ctx,q.x,q.y-14,q.x-5,q.y-18,'#f7f5df',1);line(ctx,q.x,q.y-14,q.x+6,q.y-17,'#f7f5df',1);line(ctx,q.x,q.y-14,q.x,q.y-8,'#f7f5df',1);}
    // Regional signatures: western oilfields, northern grain elevators and the central coal basin.
    for(const [lon,lat] of [[53.2,47.1],[54.1,46.7],[50.2,49.5]]){const q=geo(lon,lat);poly(ctx,[[q.x-22,q.y+5],[q.x+24,q.y+5],[q.x+33,q.y-12],[q.x-14,q.y-12]],'#c3ad7f');pumpjack(ctx,q.x-9,q.y,.66);pumpjack(ctx,q.x+16,q.y-3,.7);building(ctx,q.x-18,q.y+7,11,8,5,'#3f747e','#c2b489',false);}
    for(const [lon,lat] of [[64.9,53.4],[70.4,54.1]]){const q=geo(lon,lat);for(let k=0;k<3;k++)silo(ctx,q.x+k*9,q.y,.69);building(ctx,q.x-17,q.y+4,20,11,9,'#3e737b','#d6c29a');}
    let landmark=geo(74.15,49.5);coalMine(ctx,landmark.x,landmark.y);landmark=geo(72.55,51.4);capital(ctx,landmark.x,landmark.y,p);
    for(const [lon,lat] of [[77.6,51.75],[83.3,49.9],[68.7,47.9]]){const q=geo(lon,lat);industry(ctx,q.x,q.y,p,Math.round(lon));}
    for(const [lon,lat] of [[63,48],[71,44.15]]){const q=geo(lon,lat);waterTower(ctx,q.x,q.y,.7);building(ctx,q.x+15,q.y+2,16,10,8);}
    ctx.restore();poly(ctx,outline,null,'#f3cb61',1.5);
    // Caspian Sea is outside the country shape, a separate shallow-water miniature.
    const sea=[geo(48.1,47.1),geo(49.5,46.6),geo(50.2,45.8),geo(49.8,45.1),geo(50.6,44.6),geo(49.9,44.2),geo(50.8,43.2),geo(50.6,42.0),geo(48.0,42.0),geo(46.6,43.4),geo(46.5,45.0)];
    const seaFill=ctx.createLinearGradient(-560,0,-410,180);seaFill.addColorStop(0,'#0c496a');seaFill.addColorStop(.62,'#0c8295');seaFill.addColorStop(1,'#28a4aa');
    poly(ctx,sea,seaFill,'#dcc588',2);ctx.save();poly(ctx,sea);ctx.clip();for(let i=0;i<150;i++){const x=-560+random()*135,y=24+random()*192;line(ctx,x,y,x+2+random()*10,y,'#bfe9d954',.6);}ship(ctx,-482,153,.83);ship(ctx,-491,97,.65);ctx.restore();
    const port=geo(51.4,43.9);poly(ctx,[[port.x-19,port.y+13],[port.x+22,port.y+13],[port.x+31,port.y-9],[port.x-10,port.y-9]],'#b9af89','#526f70',.7);crane(ctx,port.x,port.y,.78);crane(ctx,port.x+19,port.y+7,.6);for(let i=0;i<4;i++)building(ctx,port.x-8+i*8,port.y+17,8,7,4,i%2?'#b95630':'#197f9b','#b77e4a',false);
    this.terrainOffset={x:-680,y:-465,w:1360,h:930};
  }
  lake(ctx, coords,p){const pts=coords.map(c=>geo(...c));poly(ctx,pts,'#dbe0b6',null);ctx.save();const center={x:pts.reduce((a,p)=>a+p.x,0)/pts.length,y:pts.reduce((a,p)=>a+p.y,0)/pts.length};poly(ctx,pts.map(q=>({x:mix(center.x,q.x,.93),y:mix(center.y,q.y,.86)})),p.water,'#509aa070',1);ctx.restore();}
  river(ctx, coords,p){const pts=coords.map(c=>geo(...c));path(ctx,pts);ctx.lineJoin='round';ctx.strokeStyle='#d1dbab';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=p.water;ctx.lineWidth=2.5;ctx.stroke();}
  drawRoute(ctx, route, scale) {
    const f=this.forecast.edgeLoads?.[route.id]??{},ratio=typeof f==='number'?f:(f.ratio??f.load/(f.capacity||1));
    const selected=this.selected?.type==='line'&&this.selected.id===route.id,hover=this.hover?.type==='line'&&this.hover.id===route.id;
    const project=(this.state.projects||[]).find(p=>(p.target===route.id||p.targetId===route.id)&&p.remaining>0);
    const newLine=route.isNew||route.newLine||route.playerBuilt;
    let color=ratio>.95?'#d86642':ratio>.72?'#d4a643':'#66a18c';
    if(project)color='#efb241';if(newLine)color='#42afb5';if(selected||hover)color='#2677b6';
    if(this.layer==='load'||selected||hover||project||newLine){path(ctx,route.points);ctx.strokeStyle=color+'55';ctx.lineWidth=(selected?17:12)/Math.sqrt(scale);ctx.lineCap='round';ctx.stroke();}
    path(ctx,route.points);ctx.lineWidth=route.tracks>1?8.5:7;ctx.strokeStyle='#ac956b';ctx.lineJoin='round';ctx.stroke();
    path(ctx,route.points);ctx.lineWidth=route.tracks>1?6.8:5.5;ctx.strokeStyle='#37484b';ctx.stroke();
    const step=6.5;for(let d=0;d<route.total;d+=step){const p=atPath(route,d/route.total),nx=-Math.sin(p.angle),ny=Math.cos(p.angle);line(ctx,p.x-nx*3.6,p.y-ny*3.6,p.x+nx*3.6,p.y+ny*3.6,'#bca67a',1.4);}
    for(const offset of [-1.9,1.9]){const pts=route.points.map((p,i)=>{const a=route.points[Math.max(0,i-1)],b=route.points[Math.min(route.points.length-1,i+1)],d=Math.hypot(b.x-a.x,b.y-a.y)||1;return{x:p.x-(b.y-a.y)/d*offset,y:p.y+(b.x-a.x)/d*offset};});path(ctx,pts);ctx.strokeStyle='#f1eee0';ctx.lineWidth=.85;ctx.stroke();}
    if(this.layer==='load'||selected||hover||newLine||project){path(ctx,route.points);ctx.lineWidth=1.8/Math.sqrt(scale);ctx.strokeStyle=color;ctx.setLineDash(newLine?[6,4]:project?[3,3]:[]);ctx.stroke();ctx.setLineDash([]);}
    if(route.electrified&&scale>.72){const poles=[];for(let d=20;d<route.total;d+=39){const p=atPath(route,d/route.total);line(ctx,p.x+6,p.y+1,p.x+6,p.y-12,'#435d66',.85);line(ctx,p.x-3,p.y-12,p.x+6,p.y-12,'#385568',.85);line(ctx,p.x+6,p.y-8,p.x+1,p.y-12,'#647c78',.6);poles.push({x:p.x,y:p.y-12});}if(poles.length>1){path(ctx,poles);ctx.strokeStyle='#3e627948';ctx.lineWidth=.55;ctx.stroke();}}
    if(scale>.8&&route.total>65){const signal=atPath(route,.18);line(ctx,signal.x-7,signal.y,signal.x-7,signal.y-10,'#2e4851',1);round(ctx,signal.x-9,signal.y-14,4,7,1,'#243d44','#b4bb9c');ellipse(ctx,signal.x-7,signal.y-11,1,1,ratio>.95?'#e7673b':'#9bcb53');}
    if(project){const mid=atPath(route,.55);ctx.save();ctx.translate(mid.x,mid.y-9);poly(ctx,[[-5,2],[0,-7],[5,2]],'#f5bc49','#fff4bf',1);line(ctx,0,-3,0,-.5,'#7d6032',1);ctx.restore();}
  }
  drawTraffic(ctx){
    const loaded=this.routes.filter(r=>(this.forecast.edgeLoads?.[r.id]?.load??0)>0);
    const shown=(loaded.length?loaded:this.routes).filter((r,i)=>i%2===0).slice(0,11);
    for(const route of shown){
      if(route.total<32)continue;
      const seed=hash(route.id),direction=seed%2?1:-1,cars=2+seed%4,carScale=.57,spacing=17*carScale;
      const speed=10+(seed%19)*.7,period=route.total+(cars+1)*spacing+35;
      const head=(this.trainTime*speed+(seed%997)/997*period)%period-10;
      for(let car=cars;car>=0;car--){
        const distance=head-car*spacing;
        if(distance<0||distance>route.total)continue;
        const p=atPath(route,direction>0?distance/route.total:1-distance/route.total);
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+(direction<0?Math.PI:0));ctx.scale(carScale,carScale);
        trainCar(ctx,car===0,['#197bb1','#2c6549','#b74635','#d4a129'][seed%4],seed%3!==1,(seed+car)%4);ctx.restore();
      }
    }
  }
  drawWeather(ctx){
    if(!this.ambient&&!this.running)return;
    const t=this.visualTime,snow=this.season===0;
    // A single small weather system crosses the country. Its seed never touches game RNG.
    const cx=-405+(t*8.5+125)%840,cy=-56+Math.sin(t*.06)*28;
    ctx.save();poly(ctx,outline);ctx.clip();
    ellipse(ctx,cx+12,cy+44,82,23,'#577f7830');
    if(!this.reducedMotion)for(const seed of this.weatherSeeds){
      const fall=(seed.phase+t*(snow?.19:.63)*seed.speed)%1;
      const x=cx-63+seed.x*126+(snow?Math.sin(t*.9+seed.phase*TAU)*5:fall*12);
      const y=cy-17+fall*78;
      ctx.globalAlpha=(.25+Math.sin(fall*Math.PI)*.45);
      if(snow){ellipse(ctx,x,y,seed.size,seed.size,'#f9ffff');line(ctx,x-seed.size,y,x+seed.size,y,'#87aaa9',.45);}
      else line(ctx,x,y,x+2,y+5+seed.size*2,'#598eae',.85);
    }
    ctx.globalAlpha=1;
    const windPhase=(t%24)/24;
    if(!this.reducedMotion&&windPhase>.66){const fade=Math.sin((windPhase-.66)/.34*Math.PI);ctx.globalAlpha=fade*.42;
      for(const seed of this.windSeeds){const x=seed.x+((t*21+seed.phase*13)%100)-50,y=seed.y+Math.sin(t+seed.phase)*3;
        ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+13,y-5,x+31,y-1);ctx.strokeStyle=snow?'#ffffff':'#f7f6d6';ctx.lineWidth=1.2;ctx.stroke();}
    }
    ctx.restore();
    // Soft overlapping lobes give the cloud depth without covering the whole map.
    ctx.save();ctx.globalAlpha=.87;ellipse(ctx,cx+5,cy-17,76,17,'#8ea5a39c');
    for(const [x,y,rx,ry]of [[-48,-24,29,16],[-20,-35,37,24],[17,-38,35,24],[49,-26,30,17],[5,-17,61,17]])ellipse(ctx,cx+x,cy+y,rx,ry,snow?'#eef4f1':'#e5ece5');
    ellipse(ctx,cx-20,cy-43,24,10,'#ffffffa6');ellipse(ctx,cx+21,cy-44,18,8,'#ffffff91');ctx.restore();
  }
  drawDayNight(ctx){
    if(!this.running||this.reducedMotion)return;
    // Three compressed daylight/night cycles in one five-second quarter animation.
    const progress=clamp((performance.now()-(this.quarterStarted??performance.now()))/5000,0,1),phase=progress*3+.25,angle=phase*TAU;
    const altitude=Math.sin(angle),night=Math.max(0,-altitude);
    if(night>0){ctx.fillStyle=`rgba(34,54,86,${night*.6})`;ctx.fillRect(0,0,this.width,this.height);}
    const area=this.safeArea,left=area.left+18,right=this.width-area.right-18;
    const horizon=Math.max(area.top+80,this.height*.39),sunX=(left+right)/2-Math.cos(angle)*(right-left)*.47,sunY=horizon-altitude*Math.max(52,this.height*.17);
    if(altitude>0){const glow=ctx.createRadialGradient(sunX,sunY,2,sunX,sunY,36);glow.addColorStop(0,'#fff6b984');glow.addColorStop(1,'#ffec8d00');ctx.fillStyle=glow;ctx.fillRect(sunX-36,sunY-36,72,72);ellipse(ctx,sunX,sunY,12,12,'#ffe299');ellipse(ctx,sunX-2,sunY-2,8,8,'#fff3c4');}
    else if(night>.1){const moonX=(left+right)/2+Math.cos(angle)*(right-left)*.35,moonY=horizon-night*70;ellipse(ctx,moonX,moonY,8,8,'#edf3db');ellipse(ctx,moonX+3,moonY-2,6,7,'#b9cec3');
      for(const s of this.stations||[]){const p=this.toScreen(s.point);ellipse(ctx,p.x+3,p.y-9,2.5,1.4,`rgba(255,235,165,${night*.85})`);}
    }
  }
  renderNow(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=null;this.lastDraw=0;this.render(performance.now());}
  render(time=0){
    this.raf=null;if(this.destroyed||document.hidden)return;
    const moving=(this.running||this.ambient)&&!this.reducedMotion;
    if(moving&&this.lastDraw&&time-this.lastDraw<1000/30){this.raf=requestAnimationFrame(this.render);return;}
    const delta=this.lastFrame?clamp((time-this.lastFrame)/1000,0,.15):0;this.lastFrame=time;this.lastDraw=time;
    if(moving){this.visualTime+=delta;this.trainTime+=delta*(this.running?8:1);if(this.running)this.quarterVisualTime=(this.quarterVisualTime||0)+delta;}
    const ctx=this.ctx,dpr=this.dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,this.width,this.height);
    const bg=ctx.createRadialGradient(this.width*.53,this.height*.51,30,this.width*.5,this.height*.5,this.width*.67);bg.addColorStop(0,'#ded5ae');bg.addColorStop(.68,'#d7d5bd');bg.addColorStop(1,'#9eafb0');ctx.fillStyle=bg;ctx.fillRect(0,0,this.width,this.height);
    const scale=this.baseScale*this.zoomLevel;ctx.save();ctx.translate(this.center.x+this.pan.x,this.center.y+this.pan.y);ctx.scale(scale,scale);
    // Neighbour labels are calm and intentionally outside the active miniature.
    if(this.terrain){const o=this.terrainOffset;ctx.drawImage(this.terrain,o.x,o.y,o.w,o.h);}
    ctx.fillStyle='#35546794';ctx.font='700 12px "Segoe UI", sans-serif';ctx.textAlign='center';ctx.letterSpacing='4px';ctx.fillText('Р О С С И Я',60,-295);ctx.fillText('У З Б Е К И С Т А Н',-20,315);ctx.fillText('К И Р Г Ы З С Т А Н',300,279);ctx.fillText('К И Т А Й',598,143);ctx.letterSpacing='0px';
    // Geographic water labels sit naturally inside the miniature.
    ctx.save();ctx.fillStyle='#e3f5e2d6';ctx.font='italic 10px Georgia, serif';ctx.textAlign='center';let q=geo(48.4,44.5);ctx.save();ctx.translate(q.x,q.y);ctx.rotate(-1.4);ctx.fillText('Каспийское море',0,0);ctx.restore();q=geo(76.7,46.65);ctx.fillStyle='#165469';ctx.fillText('Балхаш',q.x,q.y);ctx.restore();
    if(this.state){
      if(this.layer!=='terrain')for(const route of this.routes)this.drawRoute(ctx,route,scale);
      else for(const route of this.routes){path(ctx,route.points);ctx.strokeStyle='#70836966';ctx.lineWidth=2;ctx.stroke();}
      const p=palettes[this.season]||palettes[1];
      for(const station of [...this.stations].sort((a,b)=>a.point.y-b.point.y)){
        const q=station.point,random=rng(hash(station.id)),level=station.level||1;
        // Two to five low blocks, offset from the platforms, suggest each small city.
        for(let i=0;i<Math.min(6,level+2);i++){const x=q.x-20+random()*35,y=q.y-16-random()*15;building(ctx,x,y,5+random()*5,6,5+random()*11,i%2?'#a08058':'#2f6f82','#dfcaa1',true);}
        stationModel(ctx,q.x,q.y,level,p,.57);
      }
      this.drawTraffic(ctx);
      if(this.layer!=='terrain')for(const [id,endpoint,label]of [['aktau',{x:-600,y:153},'В ЕВРОПУ'],['altynkol',{x:570,y:136},'ИЗ КИТАЯ']]){const point=this.stationById[id]?.point;if(!point)continue;ctx.setLineDash([4,6]);line(ctx,point.x,point.y,endpoint.x,endpoint.y,'#4c9b995e',1.7);ctx.setLineDash([]);ellipse(ctx,endpoint.x,endpoint.y,4.5,4.5,'#52948b');ellipse(ctx,endpoint.x,endpoint.y,2,2,'#e6edcf');ctx.fillStyle='#50796d';ctx.font='700 9px "Segoe UI", sans-serif';ctx.textAlign='center';ctx.fillText(label,endpoint.x,endpoint.y-11);}
      for(const project of this.state.projects||[]){if(!['newLine','new-line','buildLine','build'].includes(project.type)||!project.a||!project.b)continue;const a=this.stationById[project.a]?.point,b=this.stationById[project.b]?.point;if(!a||!b)continue;const pts=[a,...(project.via||[]).map(p=>geo(p.lon,p.lat)),b];path(ctx,pts);ctx.strokeStyle='#daf4e8';ctx.lineWidth=5;ctx.stroke();ctx.setLineDash([7,6]);path(ctx,pts);ctx.strokeStyle='#219dac';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);}
    }
    if(this.state)this.drawWeather(ctx);
    ctx.restore();
    this.drawDayNight(ctx);
    // Labels are drawn after both weather and night tint so network decisions stay readable.
    if(this.state)this.drawLabels(ctx,scale);
    // Subtle corner compass and distance clue are part of the scene, not a control.
    const compassX=this.width>1200?287:245,compassY=this.height-143;
    ctx.save();ctx.translate(compassX,compassY);ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(0,0,17,0,TAU);ctx.strokeStyle='#365f72';ctx.lineWidth=.8;ctx.stroke();line(ctx,0,-22,0,22,'#365f72',1);line(ctx,-22,0,22,0,'#365f72',1);poly(ctx,[[0,-20],[-5,0],[0,-3],[5,0]],'#294f65','#eee1b4',.6);poly(ctx,[[0,20],[-5,0],[0,3],[5,0]],'#d6b457','#365f72',.6);ctx.fillStyle='#294f65';ctx.font='800 9px "Segoe UI", sans-serif';ctx.textAlign='center';ctx.fillText('С',0,-27);ctx.restore();
    if(moving)this.raf=requestAnimationFrame(this.render);
  }
  drawLabels(ctx,scale){
    const occupied=[];const sorted=[...this.stations].sort((a,b)=>{const av=this.selected?.id===a.id?10:a.level||1,bv=this.selected?.id===b.id?10:b.level||1;return bv-av;});
    for(const station of sorted){const q=this.toScreen(station.point),selected=this.selected?.type==='station'&&this.selected.id===station.id,hover=this.hover?.type==='station'&&this.hover.id===station.id;
      if(q.x<-40||q.x>this.width+40||q.y<0||q.y>this.height+30)continue;
      const load=this.forecast.stationLoads?.[station.id],ratio=load?.ratio??0,level=station.level||1;
      const radius=selected?7:level===3?6:4.8;
      ellipse(ctx,q.x,q.y+1,radius+2.6,radius+2.6,'#153e51');ellipse(ctx,q.x,q.y+1,radius+1.2,radius+1.2,'#f1ecd5');ellipse(ctx,q.x,q.y+1,radius-.2,radius-.2,level>1?'#f2c447':'#f5f4df');
      if(level===3){ellipse(ctx,q.x,q.y+1,3.5,3.5,'#244353');ellipse(ctx,q.x,q.y+1,2,2,'#f0c654');}
      if(selected||hover){ctx.beginPath();ctx.arc(q.x,q.y+1,radius+5.5,0,TAU);ctx.strokeStyle=selected?'#169abd':'#d69e2d';ctx.lineWidth=2;ctx.stroke();}
      if(ratio>.98){ellipse(ctx,q.x+radius+2,q.y-radius+1,2.5,2.5,'#e27c46');}
      const name=(station.name||station.id).toLocaleUpperCase('ru-RU');ctx.font=`800 ${selected?11.5:10}px "Segoe UI", sans-serif`;const w=ctx.measureText(name).width+15,h=21;
      let box={x:q.x-w/2,y:q.y+12,w,h};
      if(station.labelOffset){box.x+=station.labelOffset[0];box.y+=station.labelOffset[1];}
      let collision=occupied.some(b=>box.x<b.x+b.w+3&&box.x+w>b.x-3&&box.y<b.y+b.h+2&&box.y+h>b.y-2);
      if(collision){box.y=q.y-28;collision=occupied.some(b=>box.x<b.x+b.w+3&&box.x+w>b.x-3&&box.y<b.y+b.h+2&&box.y+h>b.y-2);}
      if(collision&&!selected&&!hover&&this.zoomLevel<1.65)continue;
      occupied.push(box);ctx.save();ctx.shadowColor='#13374540';ctx.shadowBlur=4;ctx.shadowOffsetY=2;round(ctx,box.x,box.y,w,h,4,selected?'#176481':hover?'#23566b':'#133d51f5',selected?'#f4d375':'#e7d7a5');ctx.restore();
      line(ctx,box.x+5,box.y+2,box.x+w-5,box.y+2,'#5b8e9e66',.7);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff8df';ctx.fillText(name,box.x+w/2,box.y+h/2-.3);ctx.textBaseline='alphabetic';
    }
  }
  drawStation(canvas,station){return drawStation(canvas,station,{season:this.season});}
  destroy(){this.destroyed=true;this.resizeObserver.disconnect();if(this.raf)cancelAnimationFrame(this.raf);this.raf=null;document.removeEventListener('visibilitychange',this.onVisibilityChange);this.motionQuery?.removeEventListener?.('change',this.onMotionChange);}
}

export function drawStation(canvas, station, options={}) {
  if(!canvas||!station)return;const bounds=canvas.getBoundingClientRect(),width=bounds.width||320,height=bounds.height||170,dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);const p=palettes[options.season??1]||palettes[1];
  const bg=ctx.createLinearGradient(0,0,0,height);bg.addColorStop(0,'#eaf1df');bg.addColorStop(1,p.grass);ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.save();const s=Math.min(width/310,height/172);ctx.translate(width*.5,height*.53);ctx.scale(s,s);
  ellipse(ctx,0,8,155,59,p.patch);poly(ctx,[[-170,70],[150,70],[175,-12],[-130,-12]],p.grass);poly(ctx,[[-153,50],[140,50],[150,29],[-145,29]],'#d4caaa');
  const random=rng(hash(station.id));for(let i=0;i<23;i++){const x=-150+random()*300,y=-27+random()*40;if(Math.abs(x)<64)continue;tree(ctx,x,y,5+random()*5,p,i%3===0);}
  for(let i=0;i<3;i++){building(ctx,-95+i*26,-21-i*4,19,13,12+i*5,i%2?'#b68166':'#699e8d');}
  // Depot and yard with original low-poly cargo crates.
  building(ctx,99,2,36,30,19,'#809687','#d7d1b8');for(let i=0;i<4;i++){building(ctx,74+i*11,22,9,6,5,i%2?'#bd8059':'#baab77','#cbac7b',false);}
  stationModel(ctx,-3,7,station.level||1,p,1.75);
  for(let r=0;r<2;r++){const yy=45+r*18;line(ctx,-180,yy,180,yy,'#819181',8);for(let x=-175;x<180;x+=10)line(ctx,x,yy-6,x+2,yy+6,'#d9caa9',2.3);line(ctx,-180,yy-3,180,yy-3,'#e7ebd8',1.2);line(ctx,-180,yy+3,180,yy+3,'#e7ebd8',1.2);}
  train(ctx,24,43,0,1.3,'#b45e48',4,false);train(ctx,129,63,0,1.05,'#3f7d81',3,true);
  for(const x of [-68,59]){line(ctx,x,29,x,0,'#607568',1.3);line(ctx,x,0,x+9,0,'#607568',1.4);ellipse(ctx,x+9,1,3,1.5,'#fcf1bd');}
  if((station.condition??100)<55){poly(ctx,[[-19,16],[-14,5],[-9,16]],'#e6a640','#fff2ca',1);ctx.fillStyle='#78552b';ctx.font='bold 8px sans-serif';ctx.fillText('!',-15,14);}
  ctx.restore();
}
