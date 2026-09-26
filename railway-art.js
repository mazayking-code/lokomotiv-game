// Original vector rolling-stock illustrations. Cosmetic only; prices and capacity live in balance.js.
let artworkId = 0;
const stationTitles = ['Малая станция','Районная станция','Крупный узел'];
export function stationArt(value) {
 const level=Math.max(1,Math.min(3,Number(value)||1));
 return `<figure class="station-art"><img src="./assets/station-level-${level}.png" alt="${stationTitles[level-1]}: архитектура станции уровня ${level}" loading="lazy" decoding="async"><figcaption><b>Уровень ${level}</b><span>${stationTitles[level-1]}</span></figcaption></figure>`;
}
export function fleetIllustration(type) {
 const id=`rolling-stock-${++artworkId}`;
 const locomotive=type==='diesel'||type==='electric',electric=type==='electric';
 const primary=locomotive?'#1876a8':type==='coal'?'#277059':type==='oil'?'#354a57':'#ae4834';
 const wheel=x=>`<g><circle cx="${x}" cy="91" r="8" fill="#142a38" stroke="#71828a" stroke-width="2"/><circle cx="${x}" cy="91" r="3" fill="#b2b9af"/></g>`;
 const sleepers=Array.from({length:16},(_,i)=>`<path d="M${12+i*18} 113l20-13" stroke="#715941" stroke-width="4"/>`).join('');
 const ribs=Array.from({length:13},(_,i)=>`<path d="M${62+i*14} 57v27" stroke="#102f3f" stroke-opacity=".35" stroke-width="2"/>`).join('');
 const body=locomotive?`
 <path d="M43 49l20-14h174l23 17v31l-21 8H43Z" fill="url(#${id}-body)" stroke="#173b52" stroke-width="1.5"/>
 <path d="M43 49h180l14-14H63Z" fill="#b8c5c0"/><path d="M223 49l14-14 23 17-19 11Z" fill="#62a9c4"/>
 <path d="M45 70h185v10H45Z" fill="${electric?'#ede7d0':'#e9a031'}"/><path d="M230 70l28-10v10l-28 11Z" fill="#ecbd56"/>
 <path d="M208 50h17v14h-17Z" fill="#112e45" stroke="#94d3de"/><path d="M230 52l10 9 15-6-12-10Z" fill="#12334d" stroke="#9de0e8"/>
 <path d="M54 54h18v27H54Z" fill="#247da0" stroke="#c1cfbc"/><path d="M57 57h12v9H57Z" fill="#173d50"/>
 ${Array.from({length:8},(_,i)=>`<path d="M${86+i*13} 53v13m3-13v13" stroke="#0a3b60" stroke-width="2"/>`).join('')}
 <path d="M75 38h38l8 5H70Zm69 0h41l8 5h-52Z" fill="#51626a"/>
 ${electric?'<path d="M100 37l-12-11 14-10 14 10-16 11m58 0-12-11 14-10 14 10-16 11M85 15h36m21 0h36" fill="none" stroke="#b66d3b" stroke-width="2"/>':'<path d="M149 37v-9h12v9" fill="#253f4d"/><path d="M80 37v-5h37v5" fill="#7d898c"/>'}
 <path d="M40 85h199l23-9v12l-23 9H40Z" fill="#1c3542"/><path d="M53 87h165" stroke="#7995a0" stroke-width="2"/>
 <circle cx="247" cy="72" r="3" fill="#ffe8a3"/><circle cx="235" cy="78" r="2" fill="#fff0bb"/>
 `:type==='oil'?`
 <path d="M48 85h199l19-9v12l-20 9H48Z" fill="#25414c"/>
 <rect x="78" y="44" width="149" height="42" rx="4" fill="url(#${id}-tank)"/>
 <ellipse cx="78" cy="65" rx="18" ry="21" fill="#5f727b" stroke="#182f3d" stroke-width="2"/><ellipse cx="228" cy="65" rx="18" ry="21" fill="#293f4e" stroke="#79959b" stroke-width="1.5"/>
 <path d="M112 46v38m76-38v38" stroke="#adbbb8" stroke-width="3"/><path d="M156 39h18v7h-18Z" fill="#182e3b"/>
 <path d="M170 38v49m-8-39h13m-13 8h13m-13 8h13m-13 8h13m-13 8h13" stroke="#b3c0b9" stroke-width="1.2"/>
 <path d="M138 55h7v12h-7Z" fill="#e2b85b"/>
 `:type==='coal'?`
 <path d="M44 53l22-13h181l16 18-24 29H44Z" fill="#173f39"/>
 <path d="M58 50l10-8 12 1 8-9 14 7 12-4 13 8 15-11 16 8 11-5 13 9 15-7 15 5 10-7 13 8 15-3 8 11Z" fill="#384148" stroke="#7d8178"/>
 <path d="M44 54h195v34H44Z" fill="url(#${id}-body)" stroke="#1b4447"/><path d="M239 54l24-13v34l-24 13Z" fill="#17493e"/>
 ${ribs}<path d="M45 55h193M45 84h193" stroke="#a1b480" stroke-width="2"/>
 <path d="M41 88h202" stroke="#172f3a" stroke-width="7"/>
 `:`
 <path d="M45 48l23-15h174l20 15v36l-22 10H45Z" fill="#672d26"/>
 <path d="M45 48h195v39H45Z" fill="url(#${id}-body)" stroke="#793327"/><path d="M45 48l23-15h174l-2 15Z" fill="#cd8560"/>
 <path d="M240 48l22-15v42l-22 12Z" fill="#7b342a"/>${ribs}
 <path d="M123 51v33m30-33v33M122 68h33" stroke="#e1ac77" stroke-width="2"/>
 <path d="M40 90h205" stroke="#173342" stroke-width="7"/>
 `;
 return `<div class="fleet-portrait"><svg class="fleet-drawing" viewBox="0 0 320 130" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}-body" x2="0" y2="1"><stop stop-color="${primary}"/><stop offset="1" stop-color="${locomotive?'#134e7c':type==='coal'?'#174d3a':'#76342b'}"/></linearGradient><linearGradient id="${id}-tank" x2="0" y2="1"><stop stop-color="#adc2c4"/><stop offset=".36" stop-color="#5b7882"/><stop offset=".7" stop-color="#263e4b"/><stop offset="1" stop-color="#526e78"/></linearGradient></defs><ellipse cx="164" cy="105" rx="140" ry="8" fill="#625b4530"/>${sleepers}<path d="M9 113h281l25-13H32" fill="none" stroke="#203b49" stroke-width="3"/><path d="M9 111h281M32 99h281" stroke="#c1c2af" stroke-width="1.5"/>${body}${[66,88,209,230].map(wheel).join('')}<path d="M28 87h16m203-1h20" stroke="#1c3342" stroke-width="4"/></svg></div>`;
}
