"use strict";
const $=id=>document.getElementById(id);
const specs={
worksheet:{title:"Arbetsblad",help:"Skriv en fråga per rad. Materialet skapas utan AI och kan redigeras före utskrift.",fields:[["title","Rubrik","text"],["subject","Ämne och årskurs","text"],["instructions","Instruktion till eleverna","textarea"],["questions","Frågor eller uppgifter (en per rad)","textarea"]]},
exit:{title:"Exit ticket",help:"Tre korta frågor att använda som avslut på lektionen.",fields:[["title","Lektionens namn","text"],["subject","Ämne och årskurs","text"],["goal","Vad var lektionens mål?","textarea"]]},
quiz:{title:"Quiz",help:"Skriv en fråga per rad. Använd tecknet | mellan fråga och facit, exempelvis: Vad är puls? | Musikens regelbundna slag.",fields:[["title","Quizets namn","text"],["subject","Ämne och årskurs","text"],["questions","Frågor | Facit (en per rad)","textarea"]]},
support:{title:"Extra anpassningar och språkstöd",help:"En tydlig steg-för-steg-mall som läraren själv fyller i och anpassar.",fields:[["title","Uppgiftens namn","text"],["subject","Ämne och årskurs","text"],["goal","Det här ska eleven lära sig","textarea"],["steps","Arbetsgång, ett steg per rad","textarea"],["words","Viktiga begrepp och förklaringar, ett per rad","textarea"]]},
week:{title:"Min lärarvecka",help:"Skriv dina planerade lektioner och viktiga uppgifter för varje dag.",fields:[["title","Vecka / datum","text"],["monday","Måndag","textarea"],["tuesday","Tisdag","textarea"],["wednesday","Onsdag","textarea"],["thursday","Torsdag","textarea"],["friday","Fredag","textarea"]]},
library:{title:"Mina mallar och material",help:"Här finns det du sparat i denna webbläsare.",fields:[]}
};
let current=null,ownerKey="";
const lines=s=>String(s||"").split("\n").map(x=>x.trim()).filter(Boolean);
const safe=s=>String(s||"").trim();
function storageKey(){return "lararverktyget-local-material-v1-"+ownerKey;}
function load(){try{return JSON.parse(localStorage.getItem(storageKey())||"[]");}catch{return [];}}
function store(items){try{localStorage.setItem(storageKey(),JSON.stringify(items));return true;}catch{$("toast").textContent="Det gick inte att spara i webbläsaren.";return false;}}
function inputValues(){const data={};for(const field of specs[current].fields)data[field[0]]=safe($(field[0]).value);return data;}
function render(type,d){const heading=safe(d.title)||specs[type].title;const subject=d.subject?"Ämne och årskurs: "+d.subject+"\n\n":"";let body="";
if(type==="worksheet")body="Instruktion: "+(d.instructions||"Följ instruktionerna.")+"\n\n"+lines(d.questions).map((q,i)=>(i+1)+". "+q+"\n\n________________________________________").join("\n\n");
if(type==="exit")body=subject+"Lektionens mål: "+(d.goal||"________________")+"\n\n1. Det här har jag lärt mig idag:\n\n________________________________________\n\n2. Det här behöver jag öva mer på:\n\n________________________________________\n\n3. En fråga jag fortfarande har:\n\n________________________________________";
if(type==="quiz")body=subject+lines(d.questions).map((q,i)=>(i+1)+". "+q.split("|")[0].trim()+"\n\n________________________________________").join("\n\n")+"\n\n--- FACIT (för läraren, ta bort före elevutskrift) ---\n"+lines(d.questions).map((q,i)=>(i+1)+". "+(q.split("|").slice(1).join("|").trim()||"Ej angivet")).join("\n");
if(type==="support")body=subject+"Mål: "+(d.goal||"________________")+"\n\nGÖR SÅ HÄR:\n"+lines(d.steps).map((x,i)=>(i+1)+". "+x).join("\n")+"\n\nVIKTIGA ORD:\n"+lines(d.words).map(x=>"• "+x).join("\n")+"\n\nKONTROLLERA:\n□ Jag vet vad jag ska göra.\n□ Jag har följt stegen.\n□ Jag kan förklara vad jag har lärt mig.";
if(type==="week")body=[["MÅNDAG",d.monday],["TISDAG",d.tuesday],["ONSDAG",d.wednesday],["TORSDAG",d.thursday],["FREDAG",d.friday]].map(([day,content])=>day+"\n"+(content||"—")).join("\n\n");
return heading+"\n"+(type==="worksheet"?subject:"")+body;}
function show(type,data={}){current=type;$("editor").hidden=false;$("editorTitle").textContent=specs[type].title;$("editorHelp").textContent=specs[type].help;$("fields").replaceChildren();$("result").hidden=true;$("toast").textContent="";$("actions").hidden=type==="library";$("savedList").replaceChildren();
for(const [id,label,kind] of specs[type].fields){const l=document.createElement("label");l.htmlFor=id;l.textContent=label;const el=document.createElement(kind==="textarea"?"textarea":"input");el.id=id;if(kind!=="textarea")el.type="text";el.value=data[id]||"";$("fields").append(l,el);}
if(type==="library")showSaved();
$("editor").scrollIntoView({behavior:"smooth",block:"start"});}
function preview(){if(!current||current==="library")return;const d=inputValues();$("result").textContent=render(current,d);$("result").hidden=false;}
function showSaved(){const list=$("savedList");list.replaceChildren();const items=load();if(!items.length){list.textContent="Inget sparat material ännu.";return;}const heading=document.createElement("h3");heading.textContent="Sparade material";list.append(heading);for(const item of items){if(!specs[item.type]||item.type==="library")continue;const row=document.createElement("div");row.className="saved-item";const name=document.createElement("span");name.textContent=(item.data.title||specs[item.type].title)+" · "+new Date(item.created).toLocaleDateString("sv-SE");const actions=document.createElement("div");const open=document.createElement("button");open.textContent="Öppna";open.onclick=()=>{show(item.type,item.data);preview();};const del=document.createElement("button");del.className="secondary";del.textContent="Ta bort";del.onclick=()=>{if(!confirm("Ta bort detta sparade material?"))return;store(load().filter(x=>x.id!==item.id));showSaved();};actions.append(open,del);row.append(name,actions);list.append(row);}}
document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>show(b.dataset.open));
$("toolSearch").oninput=()=>{const q=$("toolSearch").value.toLowerCase().trim();document.querySelectorAll(".tool").forEach(t=>t.hidden=!!q&&!t.textContent.toLowerCase().includes(q)&&!t.dataset.key.includes(q));};
$("generate").onclick=preview;
$("save").onclick=()=>{if(!current||current==="library")return;const items=load();items.unshift({id:Date.now()+"-"+Math.random().toString(36).slice(2),type:current,data:inputValues(),created:new Date().toISOString()});if(store(items)){$("toast").textContent="Sparat i Mina mallar på den här enheten.";preview();}};
$("print").onclick=()=>{preview();const old=document.title;document.title=(inputValues().title||"Lärarverktyget").replace(/[\\/:*?"<>|]/g,"-");window.print();document.title=old;};
$("close").onclick=()=>{$("editor").hidden=true;current=null;};
(async()=>{try{const client=await getMusikportalenSupabase();const {data:{user}}=await client.auth.getUser();if(!user){location.replace("login.html");return;}const {data:profile,error}=await client.from("portal_users").select("role").eq("id",user.id).single();if(error||!["teacher","admin"].includes(profile?.role)){$("authStatus").textContent="Du behöver godkänd lärarbehörighet för att använda verktygen.";return;}ownerKey=user.id;$("authStatus").hidden=true;$("app").hidden=false;}catch(e){$("authStatus").textContent="Kunde inte kontrollera inloggningen. Försök igen senare.";}})();
