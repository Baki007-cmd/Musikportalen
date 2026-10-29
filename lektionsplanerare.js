"use strict";
const KEY="musikportalen_lessons_v1";
const $=id=>document.getElementById(id);
const strategies=[
["scaffolding","Scaffolding – modellering och gradvis minskat stöd"],
["declarative","Deklarativ kunskap – beskriva begrepp och ackord"],
["procedural","Procedural kunskap – automatisera färdigheter genom övning"],
["schemas","Kognitiva scheman – koppla nytt till tidigare kunskaper"],
["load","Kognitiv belastning – dela upp komplexa moment"],
["retrieval","Återkallning och repetition – hämta fram tidigare kunskaper"]];
let editing=null;
$("date").value=new Date().toLocaleDateString("sv-SE");
for(const [id,label] of strategies){const el=document.createElement("label");el.className="strategy";const cb=document.createElement("input");cb.type="checkbox";cb.value=id;cb.checked=["scaffolding","procedural","load"].includes(id);el.append(cb,document.createTextNode(label));$("strategies").append(el)}
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v:[]}catch{return []}}
function write(v){localStorage.setItem(KEY,JSON.stringify(v))}
const fields=["date","grade","subject","minutes","topic","goals","steps","done","reflection","next"];
function collect(){const o={id:editing||String(Date.now())};for(const f of fields)o[f]=$(f).value;o.strategies=[...$("strategies").querySelectorAll("input:checked")].map(x=>x.value);return o}
function fill(o){editing=o.id;for(const f of fields)$(f).value=o[f]||"";for(const cb of $("strategies").querySelectorAll("input"))cb.checked=(o.strategies||[]).includes(cb.value);window.scrollTo({top:0,behavior:"smooth"})}
function reset(){editing=null;$("lesson").reset();$("date").value=new Date().toLocaleDateString("sv-SE");$("message").textContent=""}
function render(){const root=$("archive");root.replaceChildren();const items=read();if(!items.length){root.textContent="Inga sparade planeringar ännu.";return}for(const item of items){const card=document.createElement("div");card.className="saved";const title=document.createElement("strong");title.textContent=(item.topic||"Lektion")+" · Åk "+item.grade+" · "+item.date;card.append(title);const actions=document.createElement("div");actions.className="actions";const edit=document.createElement("button");edit.textContent="Öppna";edit.type="button";edit.onclick=()=>fill(item);const del=document.createElement("button");del.textContent="Ta bort";del.type="button";del.className="secondary";del.onclick=()=>{if(confirm("Ta bort denna planering?")){write(read().filter(x=>x.id!==item.id));render()}};actions.append(edit,del);card.append(actions);root.append(card)}}
$("lesson").addEventListener("submit",e=>{e.preventDefault();const o=collect();const items=read().filter(x=>x.id!==o.id);items.unshift(o);try{write(items);editing=o.id;$("message").textContent="Planeringen sparades lokalt i webbläsaren.";render()}catch{$("message").textContent="Kunde inte spara. Kontrollera webbläsarens lagringsutrymme."}});
$("clear").onclick=reset;
$("export").onclick=()=>{const o=collect();const lines=["LEKTIONSPLANERING",...fields.map(f=>f.toUpperCase()+":\n"+o[f]),"KOGNITIONSVETENSKAP:\n"+strategies.filter(x=>o.strategies.includes(x[0])).map(x=>x[1]).join("\n")];const blob=new Blob([lines.join("\n\n")],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="lektionsplanering.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
render();