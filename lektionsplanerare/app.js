"use strict";
const KEY="musikportalen-lesson-planner-v1";
const tips={"Kognitiva scheman":"Aktivera förkunskaper och knyt nya moment till sådant eleverna redan kan.","Scaffolding (stöttning)":"Modellera först, öva tillsammans och minska stödet gradvis när eleverna blir säkrare.","Deklarativ och procedural kunskap":"Skilj på att kunna förklara ett begrepp och att kunna utföra en färdighet genom övning.","Arbetsminne och kognitiv belastning":"Dela upp instruktioner i hanterbara steg och undvik onödiga samtidiga krav.","Återkallning och repetition":"Låt eleverna hämta fram tidigare kunskaper utan att direkt se svaret och återkom över tid.","Motivation och återkoppling":"Ge tydliga, uppnåeliga delmål och specifik återkoppling på arbetssätt och framsteg.","Kroppsligt och situerat lärande":"Använd rörelse, puls, samspel och rummets resurser för att stödja lärandet."};
const fields=["title","date","grade","subject","status","goals","steps","support","theory","evidence","reflection","next","lgrPurpose","lgrContent","lgrAssessment","literature","literaturePage"];
const $=id=>document.getElementById(id);
let items=[];try{const stored=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(stored))items=stored.filter(x=>x&&typeof x==="object")}catch(e){$("message").textContent="Kunde inte läsa tidigare sparade planeringar."}
function save(){try{localStorage.setItem(KEY,JSON.stringify(items));return true}catch(e){$("message").textContent="Kunde inte spara i webbläsaren. Exportera gärna dina planeringar.";return false}}
function tip(){$("theory-tip").textContent=tips[$("theory").value]||""}
function reset(){ $("lesson-form").reset();$("editing").value="";$("date").value=new Date().toLocaleDateString("sv-SE");$("form-title").textContent="Ny lektionsplanering";tip()}
function text(tag,value,cls){const el=document.createElement(tag);el.textContent=String(value??"");if(cls)el.className=cls;return el}
function render(){const q=$("search").value.toLocaleLowerCase("sv"),filter=$("filter").value;const shown=items.filter(x=>(!filter||x.status===filter)&&[x.title,x.grade,x.subject,x.theory,x.goals].some(v=>String(v||"").toLocaleLowerCase("sv").includes(q))).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));$("count").textContent=shown.length+" st";const root=$("lessons");root.replaceChildren();if(!shown.length){root.append(text("p","Inga planeringar matchar urvalet.","empty"));return}for(const x of shown){const card=text("article","","lesson");card.append(text("h3",x.title||"Utan rubrik"),text("div",String(x.date||"")+" · Åk "+String(x.grade||"")+" · "+String(x.subject||"")+" · "+String(x.status||""),"meta"),text("p","Teori: "+String(x.theory||"")));const actions=text("div","","actions");const edit=text("button","Redigera","light"),del=text("button","Ta bort","light");edit.type=del.type="button";edit.addEventListener("click",()=>{fields.forEach(k=>$(k).value=String(x[k]??""));$("editing").value=x.id;$("form-title").textContent="Redigera planering";tip();window.scrollTo({top:0,behavior:"smooth"})});del.addEventListener("click",()=>{if(confirm("Ta bort denna planering?")){items=items.filter(a=>a.id!==x.id);save();render()}});actions.append(edit,del);card.append(actions);root.append(card)}}
$("lesson-form").addEventListener("submit",e=>{e.preventDefault();const obj={};fields.forEach(k=>obj[k]=$(k).value);const id=$("editing").value;obj.id=id||((globalThis.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+"-"+Math.random().toString(36).slice(2));const idx=items.findIndex(x=>x.id===id);if(idx>=0)items[idx]=obj;else items.push(obj);if(save()){$("message").textContent="Planeringen sparad på den här enheten.";reset();render()}});
$("clear").addEventListener("click",reset);$("theory").addEventListener("change",tip);$("search").addEventListener("input",render);$("filter").addEventListener("change",render);
$("export").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({format:"musikportalen-lesson-planner-v1",lessons:items},null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="lektionsplaneringar.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$("import").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;if(file.size>2_000_000){$("message").textContent="Filen är för stor.";return}try{const data=JSON.parse(await file.text());if(data.format!=="musikportalen-lesson-planner-v1"||!Array.isArray(data.lessons)||data.lessons.length>1000)throw Error("Fel format");const imported=data.lessons.filter(x=>x&&typeof x.id==="string"&&typeof x.title==="string"&&fields.every(k=>typeof x[k]==="string")).map(x=>Object.fromEntries([...fields,"id"].map(k=>[k,x[k].slice(0,10000)])));if(!confirm("Importera "+imported.length+" planeringar? Befintliga planeringar med samma ID ersätts."))return;const map=new Map(items.map(x=>[x.id,x]));imported.forEach(x=>map.set(x.id,x));items=[...map.values()];save();render();$("message").textContent="Importen är klar."}catch(err){$("message").textContent="Kunde inte importera filen. Kontrollera att det är en export från denna planerare."}finally{e.target.value=""}});
reset();render();
document.getElementById("template-guitar").addEventListener("click",()=>{
if(!confirm("Fyll i exempel för gitarr åk 8? Nuvarande formulärinnehåll ersätts (sparade planeringar påverkas inte)."))return;
reset();
const example={
title:"Gitarr – ackordbyten, puls och samspel",
grade:"8",subject:"Musik",status:"Planerad",
goals:"Eleverna ska kunna spela G–D–Am och G–D–C i gemensam puls, byta ackord med ökad säkerhet och lyssna till gruppens samspel.",
lgrPurpose:"Koppling till kursplanen i musik: utveckla förmågan att musicera och samspela samt uttrycka sig musikaliskt. Kontrollera ordalydelsen i Lgr22.",
lgrContent:"Musik åk 7–9: sång och spel i olika former, musikaliska byggstenar och samspel. Kontrollera exakt centralt innehåll i aktuell kursplan.",
lgrAssessment:"Observera om eleven håller pulsen, genomför ackordbyten och anpassar sitt spel till gruppen. Dessa är lektionsnära observationer, inte en fullständig betygsbedömning.",
steps:"1. Aktivera förkunskaper: repetera G och D.\n2. Modellera G–D–Am: två slag G, två slag D, fyra slag Am.\n3. Spela gemensamt i ring med tydlig puls.\n4. Byt till G–D–C med samma slagfördelning.\n5. Låt säkrare elever lägga till rytmisk variation.\n6. Avsluta med kort återkallning och elevreflektion.",
support:"Visa ackordbilder, demonstrera långsamt, dela upp momenten och använd gemensam puls. Minska stödet successivt.",
theory:"Scaffolding (stöttning)",
literature:"Kirschner & Hendrick: kapitel 17 (scaffolding). Komplettera vid behov med kapitel om kunskap och scheman.",
literaturePage:"",
evidence:"Vilka ackordbyten fungerar utan modellering? Kan gruppen återgå till gemensam puls efter ett misstag?",
reflection:"Hur bidrog den gemensamma pulsen, rummet och samspelet till elevernas lärande? När blev stöttningen hjälpsam respektive begränsande?",
next:"Fortsätt med samspel och pröva gradvis minskat stöd. Jämför hur eleverna klarar ackordbyten med och utan gemensam puls."
};
for(const [k,v] of Object.entries(example))document.getElementById(k).value=v;
tip();window.scrollTo({top:0,behavior:"smooth"});
});
