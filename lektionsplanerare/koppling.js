"use strict";
(function(){
const PLANS="musikportalen-lesson-planner-v1",SCHEDULE="musikportalen-oversikt-v1";
const read=(key,fallback)=>{try{const x=JSON.parse(localStorage.getItem(key)||"null");return x??fallback}catch(e){return fallback}};
const save=(key,data)=>{try{localStorage.setItem(key,JSON.stringify(data));return true}catch(e){alert("Det gick inte att spara kopplingen lokalt.");return false}};
const plans=()=>{const x=read(PLANS,[]);return Array.isArray(x)?x:[]};
const schedule=()=>{const x=read(SCHEDULE,{blocks:[],areas:[],events:[]});return x&&Array.isArray(x.blocks)?x:{blocks:[],areas:[],events:[]}};
function label(plan){return (plan.title||"Utan rubrik")+" · Åk "+(plan.grade||"")+" · "+(plan.date||"")}
if(document.getElementById("lesson-select")){
 const select=document.getElementById("lesson-select");
 function populate(){const old=select.value;select.replaceChildren(new Option("Ingen koppling ännu",""));for(const p of plans())select.add(new Option(label(p),p.id));select.value=[...select.options].some(o=>o.value===old)?old:""}
 function enhanceRows(){populate();const s=schedule();const rows=document.querySelectorAll("#week-list tr");const week=document.getElementById("week-picker").value;const klass=document.getElementById("week-class").value;const matching=s.blocks.filter(x=>(x.recurring||x.week===week)&&(!klass||x.klass===klass)).sort((a,b)=>Number(a.day)-Number(b.day)||String(a.start).localeCompare(String(b.start)));
 rows.forEach((row,i)=>{const b=matching[i];if(!b)return;const td=row.lastElementChild;if(!td||td.querySelector(".plan-link"))return;const a=document.createElement("a");a.className="plan-link";a.href=b.lessonId?"./?plan="+encodeURIComponent(b.lessonId):"./?schema="+encodeURIComponent(b.id)+"&week="+encodeURIComponent(week);a.textContent=b.lessonId?"Öppna planering":"Skapa planering";a.style.display="inline-block";a.style.marginRight="8px";td.prepend(a)})}
 const observer=new MutationObserver(()=>{observer.disconnect();enhanceRows();observer.observe(document.getElementById("week-list"),{childList:true})});
 observer.observe(document.getElementById("week-list"),{childList:true});enhanceRows();
 window.addEventListener("focus",enhanceRows);
}
if(document.getElementById("lesson-form")){
 const params=new URLSearchParams(location.search),planId=params.get("plan"),blockId=params.get("schema"),week=params.get("week");
 function openExisting(){if(!planId)return;const p=plans().find(x=>x.id===planId);if(!p){document.getElementById("message").textContent="Planeringen hittades inte på denna enhet.";return}const fields=["title","date","grade","subject","status","goals","steps","support","theory","evidence","reflection","next","lgrPurpose","lgrContent","lgrAssessment","literature","literaturePage"];for(const k of fields){const field=document.getElementById(k);if(field)field.value=p[k]||""}document.getElementById("editing").value=p.id;document.getElementById("form-title").textContent="Redigera kopplad planering";document.getElementById("theory").dispatchEvent(new Event("change"))}
 function dateFor(week,day){if(!/^\d{4}-W\d{2}$/.test(week||""))return"";const [y,w]=week.split("-W").map(Number),d=new Date(y,0,4,12);d.setDate(d.getDate()-(d.getDay()||7)+1+(w-1)*7+Number(day)-1);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
 function prefill(){if(!blockId)return;const b=schedule().blocks.find(x=>x.id===blockId);if(!b)return;document.getElementById("title").value=b.content||b.subject+" – "+b.klass;document.getElementById("subject").value=[...document.getElementById("subject").options].some(x=>x.value===b.subject)?b.subject:"Annat";const grade=/^[3-9]/.exec(b.klass||"");if(grade)document.getElementById("grade").value=grade[0];const d=dateFor(week,b.day);if(d)document.getElementById("date").value=d;document.getElementById("steps").value=b.content||"";document.getElementById("message").textContent="Planeringen kopplas till schemablocket när du sparar."}
 if(planId)openExisting();else prefill();
 if(blockId){document.getElementById("lesson-form").addEventListener("submit",()=>{const s=schedule(),b=s.blocks.find(x=>x.id===blockId);if(!b)return;const old=new Set(plans().map(x=>x.id));setTimeout(()=>{const list=plans(),candidate=list.filter(x=>!old.has(x.id)).at(-1);if(candidate){b.lessonId=candidate.id;save(SCHEDULE,s);document.getElementById("message").textContent="Planeringen sparad och kopplad till schemat."}},30)})}
}
})();