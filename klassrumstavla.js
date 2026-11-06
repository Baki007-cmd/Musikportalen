"use strict";const $=id=>document.getElementById(id);const key="musikportalen-board-v1";const bgKey="musikportalen-board-background";function setBackground(value){const allowed=["blue","staff","white","green","dark"];const choice=allowed.includes(value)?value:"blue";document.body.dataset.bg=choice;$("board").dataset.bg=choice;$("background").value=choice;try{localStorage.setItem(bgKey,choice);}catch{}}try{setBackground(localStorage.getItem(bgKey)||"blue");}catch{setBackground("blue");}$("background").addEventListener("change",e=>setBackground(e.target.value));let timer=null,remaining=600,running=false,metro=null,audio=null,beat=0;
function clock(){const now=new Date();$("clock").textContent=now.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit",second:"2-digit"});$("today").textContent=now.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"});}
clock();setInterval(clock,1000);
const floatingClock=$("floatingClock"),clockDrag=$("clockDrag"),clockPositionKey="musikportalen-floating-clock-position";
function placeClock(x,y){const w=floatingClock.offsetWidth,h=floatingClock.offsetHeight;floatingClock.style.left=Math.max(0,Math.min(window.innerWidth-w,x))+"px";floatingClock.style.top=Math.max(0,Math.min(window.innerHeight-h,y))+"px";floatingClock.style.right="auto";}
try{const p=JSON.parse(localStorage.getItem(clockPositionKey)||"null");if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))placeClock(p.x,p.y);}catch{}
let clockGesture=null;
clockDrag.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;e.preventDefault();const rect=floatingClock.getBoundingClientRect();placeClock(rect.left,rect.top);clockGesture={id:e.pointerId,x:e.clientX,y:e.clientY,left:rect.left,top:rect.top};clockDrag.setPointerCapture(e.pointerId);});
clockDrag.addEventListener("pointermove",e=>{if(!clockGesture||clockGesture.id!==e.pointerId)return;placeClock(clockGesture.left+e.clientX-clockGesture.x,clockGesture.top+e.clientY-clockGesture.y);});
function finishClockMove(e){if(!clockGesture||clockGesture.id!==e.pointerId)return;clockGesture=null;try{localStorage.setItem(clockPositionKey,JSON.stringify({x:floatingClock.offsetLeft,y:floatingClock.offsetTop}));}catch{}}
clockDrag.addEventListener("pointerup",finishClockMove);clockDrag.addEventListener("pointercancel",finishClockMove);
window.addEventListener("resize",()=>{const r=floatingClock.getBoundingClientRect();placeClock(r.left,r.top);});

function display(){const m=Math.floor(remaining/60),s=remaining%60;$("countdown").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");}
function stopTimer(){running=false;if(timer!==null)clearInterval(timer);timer=null;}
function setMinutes(){remaining=Math.max(1,Math.min(180,Number($("minutes").value)||10))*60;display();}
$("minutes").onchange=()=>{if(!running)setMinutes();};
$("timerStart").onclick=()=>{if(running)return;if(remaining<=0)setMinutes();running=true;let end=Date.now()+remaining*1000;timer=setInterval(()=>{remaining=Math.max(0,Math.ceil((end-Date.now())/1000));display();if(remaining===0){stopTimer();$("countdown").textContent="Tiden är slut!";}},200);};
$("timerPause").onclick=stopTimer;$("timerReset").onclick=()=>{stopTimer();setMinutes();};
function setEditor(id,html,plain){const el=$(id);if(typeof html!=="string"){el.innerText=plain||"";return;}const t=document.createElement("template");t.innerHTML=html;const allowed=new Set(["B","STRONG","I","EM","U","UL","OL","LI","P","DIV","BR","SPAN"]);function clean(root){for(const n of [...root.childNodes]){if(n.nodeType===1){clean(n);if(!allowed.has(n.tagName)){n.replaceWith(...n.childNodes);continue;}const size=n.style.fontSize;for(const a of [...n.attributes])n.removeAttribute(a.name);if(n.tagName==="SPAN"&&["16px","20px","24px","28px","32px","40px"].includes(size))n.style.fontSize=size;}else if(n.nodeType!==3)n.remove();}}clean(t.content);el.innerHTML=t.innerHTML;}
function persist(){try{localStorage.setItem(key,JSON.stringify({goals:$("goals").innerText,instructions:$("instructions").innerText,goalsHtml:$("goals").innerHTML,instructionsHtml:$("instructions").innerHTML,ending:$("ending").innerText,endingHtml:$("ending").innerHTML,light:document.querySelector(".light.active")?.dataset.light}));}catch{}}
const endingTile=document.querySelector('[data-tile="activities"]').cloneNode(true);
endingTile.dataset.tile="ending";
endingTile.querySelector("h2").textContent="AVSLUT";
endingTile.querySelector(".move-handle").setAttribute("aria-label","Flytta AVSLUT");
const endingEditor=endingTile.querySelector(".rich-editor");
endingEditor.id="ending";endingEditor.dataset.placeholder="Sammanfatta lektionen och reflektera";
document.querySelector('[data-tile="activities"]').after(endingTile);
const endingStyle=document.createElement("style");
endingStyle.textContent='#tiles [data-tile="ending"]{min-height:165px;height:175px}#tiles [data-tile="ending"] .rich-editor{min-height:55px}#tiles [data-tile="ending"] h2{font-size:clamp(1.3rem,2vw,1.9rem)}';
endingStyle.textContent+='#tiles [data-tile="ending"]{display:grid;grid-template-columns:auto 1fr;align-content:start;column-gap:14px}#tiles [data-tile="ending"] h2{grid-column:1;grid-row:1;align-self:center;margin:0}#tiles [data-tile="ending"] .format-bar{grid-column:2;grid-row:1;align-self:center;margin:0}#tiles [data-tile="ending"] .rich-editor{grid-column:1/-1;grid-row:2}#tiles [data-tile="ending"] .move-handle,#tiles [data-tile="ending"] .resize-handle{grid-column:1/-1}';
endingStyle.textContent+="#tiles [data-tile=\"goals\"],#tiles [data-tile=\"activities\"]{display:grid;grid-template-columns:auto minmax(0,1fr);align-content:start;column-gap:14px}#tiles [data-tile=\"goals\"] h2,#tiles [data-tile=\"activities\"] h2{grid-column:1;grid-row:1;align-self:center;margin:0}#tiles [data-tile=\"goals\"] .format-bar,#tiles [data-tile=\"activities\"] .format-bar{grid-column:2;grid-row:1;align-self:center;margin:0;min-width:0}#tiles [data-tile=\"goals\"] .rich-editor,#tiles [data-tile=\"activities\"] .rich-editor{grid-column:1/-1;grid-row:2}#tiles [data-tile=\"goals\"] .move-handle,#tiles [data-tile=\"activities\"] .move-handle,#tiles [data-tile=\"goals\"] .resize-handle,#tiles [data-tile=\"activities\"] .resize-handle{grid-column:1/-1}";
document.head.append(endingStyle);
try{const saved=JSON.parse(localStorage.getItem(key)||"{}");setEditor("goals",saved.goalsHtml,saved.goals);setEditor("instructions",saved.instructionsHtml,saved.instructions);setEditor("ending",saved.endingHtml,saved.ending);if(saved.light)chooseLight(saved.light);}catch{}
for(const id of ["goals","instructions","ending"]){$(id).addEventListener("input",persist);$(id).addEventListener("paste",e=>{e.preventDefault();document.execCommand("insertText",false,e.clipboardData.getData("text/plain"));});}
function chooseLight(value){document.querySelectorAll(".light").forEach(b=>b.classList.toggle("active",b.dataset.light===value));$("lightLabel").textContent=({red:"Röd – tyst arbete",yellow:"Gul – låg samtalsnivå",green:"Grön – samarbete"})[value]||"";}
document.querySelectorAll(".light").forEach(b=>b.onclick=()=>{chooseLight(b.dataset.light);persist();});
function stopMetro(){if(metro!==null)clearInterval(metro);metro=null;$("metro").textContent="Starta metronom";$("beat").textContent="♩";}
function tick(){beat++;$("beat").textContent=beat%4===1?"♩ 1":"♩ "+((beat-1)%4+1);if(!audio)return;const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.frequency.value=beat%4===1?880:620;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.15,now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+.1);osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+.11);}
$("metro").onclick=()=>{if(metro!==null){stopMetro();return;}const C=window.AudioContext||window.webkitAudioContext;if(C){audio ||= new C();audio.resume();}const bpm=Math.max(40,Math.min(220,Number($("bpm").value)||80));$("bpm").value=bpm;beat=0;tick();metro=setInterval(tick,60000/bpm);$("metro").textContent="Stoppa metronom";};
$("bpm").onchange=()=>{if(metro!==null){stopMetro();$("metro").click();}};
$("fullscreen").onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $("board").requestFullscreen?.();};
const dockToggle=$("dockToggle"),dock=document.querySelector(".bottom-dock");dockToggle.addEventListener("click",()=>{const collapsed=dock.classList.toggle("collapsed");dockToggle.setAttribute("aria-expanded",String(!collapsed));dockToggle.textContent=collapsed?"⌃":"⌄";dockToggle.title=collapsed?"Visa verktygsfältet":"Dölj verktygsfältet";});
$("reset").onclick=()=>{if(!confirm("Nollställ anteckningar, timer och arbetsro?"))return;stopTimer();stopMetro();$("goals").replaceChildren();$("instructions").replaceChildren();$("ending").replaceChildren();resizeTextAreas();$("minutes").value=10;setMinutes();chooseLight("green");persist();};
display();

let cloudClient=null,cloudUser=null,openedBoardId=null;
function boardStatus(s){$("boardStatus").textContent=s;}
function boardSnapshot(){return {grade:$("boardGrade").value,day:$("boardDay").value,lessonTime:$("boardTime").value,background:$("background").value,goals:$("goals").innerText,instructions:$("instructions").innerText,goalsHtml:$("goals").innerHTML,instructionsHtml:$("instructions").innerHTML,ending:$("ending").innerText,endingHtml:$("ending").innerHTML,light:document.querySelector(".light.active")?.dataset.light||"green",minutes:Number($("minutes").value)||10,remaining,bpm:Number($("bpm").value)||80,tilePositions:getTilePositions(),visibleExtras:getVisibleExtras()};}
function restoreBoard(data){$("boardGrade").value=String(data.grade||$("boardGrade").value);if(data.day)$("boardDay").value=data.day;if(data.lessonTime)$("boardTime").value=data.lessonTime;stopTimer();stopMetro();setBackground(data.background||"blue");setEditor("goals",data.goalsHtml,data.goals);setEditor("instructions",data.instructionsHtml,data.instructions);setEditor("ending",data.endingHtml,data.ending);chooseLight(["red","yellow","green"].includes(data.light)?data.light:"green");$("minutes").value=Math.max(1,Math.min(180,Number(data.minutes)||10));remaining=Math.max(0,Math.min(10800,Number.isFinite(Number(data.remaining))?Number(data.remaining):600));$("bpm").value=Math.max(40,Math.min(220,Number(data.bpm)||80));display();persist();applyTilePositions(data.tilePositions||{});persistPositions();setVisibleExtras([]);resizeTextAreas();}
async function listBoards(){const {data,error}=await cloudClient.from("classroom_boards").select("id,title,content,updated_at").eq("owner_id",cloudUser.id).order("updated_at",{ascending:false});if(error)throw error;const root=$("savedBoards");root.replaceChildren();const filtered=(data||[]).filter(item=>{const x=item.content||{};return (!x.grade||String(x.grade)===$("boardGrade").value)&&(!x.day||x.day===$("boardDay").value)&&(!$("boardTime").value||!x.lessonTime||x.lessonTime===$("boardTime").value);});if(!filtered.length)root.textContent="Inga sparade tavlor för det valda schemat ännu.";for(const item of filtered){const open=document.createElement("button");open.textContent="Öppna: "+item.title+" ("+[item.content?.day,item.content?.grade?"åk "+item.content.grade:"",item.content?.lessonTime].filter(Boolean).join(", ")+")";open.onclick=()=>{openedBoardId=item.id;$("boardName").value=item.title;restoreBoard(item.content||{});boardStatus("Tavlan öppnad. Välj Spara för att uppdatera den.");};const remove=document.createElement("button");remove.className="secondary";remove.textContent="Ta bort";remove.onclick=async()=>{if(!confirm("Ta bort den sparade klassrumstavlan?"))return;const {error}=await cloudClient.from("classroom_boards").delete().eq("id",item.id).eq("owner_id",cloudUser.id);if(error){boardStatus(error.message);return;}if(openedBoardId===item.id)openedBoardId=null;await listBoards();boardStatus("Tavlan togs bort.");};root.append(open,remove);}}
$("saveBoard").onclick=async()=>{if(!cloudUser){boardStatus("Logga in för att spara.");return;}const btn=$("saveBoard");btn.disabled=true;try{const row={owner_id:cloudUser.id,title:$("boardName").value.trim()||"Min klassrumstavla",content:boardSnapshot()};const query=openedBoardId?cloudClient.from("classroom_boards").update(row).eq("id",openedBoardId).eq("owner_id",cloudUser.id).select("id").single():cloudClient.from("classroom_boards").insert(row).select("id").single();const {data,error}=await query;if(error)throw error;openedBoardId=data.id;await listBoards();boardStatus("Klassrumstavlan sparades i Supabase.");}catch(e){boardStatus("Kunde inte spara: "+e.message+". Kontrollera att classroom_boards-tabellen finns.");}finally{btn.disabled=false;}};
function updateBoardName(){const now=new Date();const date=String(now.getFullYear()).slice(-2)+String(now.getMonth()+1).padStart(2,"0")+String(now.getDate()).padStart(2,"0");$("boardName").value="ÅK"+$("boardGrade").value+" "+$("boardDay").value.toLowerCase()+" "+date;}
function suggestLessonTime(){
 const day=$("boardDay").value,grade=$("boardGrade").value;
 const times={
  "Fredag|8":"14:20–15:10",
  "Torsdag|4":"09:15–09:55",
  "Torsdag|6":"10:35–11:15",
  "Torsdag|7":"11:40–12:30"
 };
 const suggested=times[day+"|"+grade];
 if(suggested)$("boardTime").value=suggested;
 else if(day==="Fredag"&&grade==="5")$("boardTime").value="09:40–10:20";
 else $("boardTime").value="";
}
for(const id of ["boardGrade","boardDay","boardTime"])$(id).addEventListener("change",()=>{if(id!=="boardTime")suggestLessonTime();if(id!=="boardTime")updateBoardName();openedBoardId=null;if(cloudClient&&cloudUser)listBoards().catch(e=>boardStatus("Kunde inte visa tavlor: "+e.message));});
suggestLessonTime();
function detectScheduledLesson(){
 const now=new Date();
 const weekdays=["Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag"];
 const day=weekdays[now.getDay()];
 const schedules={
  "Måndag":[["10:45","11:30","3"],["12:30","13:15","3"],["13:25","14:10","3"]],
  "Torsdag":[["09:15","09:55","4"],["10:35","11:15","6"],["11:40","12:30","7"],["13:20","14:10","7"]],
  "Fredag":[["09:40","10:20","5"],["10:30","11:10","5"],["11:20","12:00","5"],["14:20","15:10","8"]]
 };
 const slots=schedules[day]||[];
 if(!slots.length)return;
 const current=now.getHours()*60+now.getMinutes();
 const mins=s=>{const [h,m]=s.split(":").map(Number);return h*60+m;};
 const active=slots.find(([start,end])=>current>=mins(start)&&current<mins(end));
 const upcoming=slots.find(([start])=>current<mins(start));
 const match=active||upcoming;
 if(!match)return;
 $("boardDay").value=day;
 $("boardGrade").value=match[2];
 $("boardTime").value=match[0]+"–"+match[1];
 boardStatus((active?"Pågående lektion":"Nästa lektion")+": "+day+", åk "+match[2]+", "+$("boardTime").value+". Välj en sparad tavla nedan.");
}
detectScheduledLesson();
updateBoardName();
$("newBoard").onclick=()=>{openedBoardId=null;$("boardName").value="Min klassrumstavla";updateBoardName();restoreBoard({grade:$("boardGrade").value,day:$("boardDay").value,lessonTime:$("boardTime").value,background:"blue",goals:"",instructions:"",light:"green",minutes:10,remaining:600,bpm:80});boardStatus("Ny tavla. Spara när du vill behålla den.");};
(async()=>{try{cloudClient=await getMusikportalenSupabase();const {data:{user},error}=await cloudClient.auth.getUser();if(error||!user){location.replace("login.html");return;}cloudUser=user;boardStatus("Inloggad. Du kan spara klassrumstavlan.");await listBoards();}catch(e){boardStatus("Kunde inte läsa sparade tavlor: "+e.message);}})();




const tiles=$("tiles"),positionsKey="musikportalen-tile-positions";
const tileEls=[...tiles.querySelectorAll("[data-tile]")];
const defaultPositions=[[2,74],[2,2],[51,2],[2,45],[35,74],[68,74]];
function clamp(n,min,max){return Math.min(max,Math.max(min,n));}
function getTilePositions(){
 const result={};
 for(const tile of tileEls)result[tile.dataset.tile]={
  x:+(tile.offsetLeft/tiles.clientWidth*100).toFixed(3),
  y:+(tile.offsetTop/tiles.clientHeight*100).toFixed(3),
  w:+(tile.offsetWidth/tiles.clientWidth*100).toFixed(3),
  h:tile.offsetHeight
 };
 return result;
}
function applyTilePositions(saved){
 tileEls.forEach((tile,i)=>{
  const p=saved?.[tile.dataset.tile]||{};
  const defaultWidth=tile.dataset.tile==="ending"?48:["goals","activities"].includes(tile.dataset.tile)?47:30;
  const width=Number.isFinite(Number(p.w))&&Number(p.w)>0?Number(p.w):defaultWidth;
  tile.style.width=clamp(width,18,100)+"%";
  tile.style.height=tile.dataset.tile==="ending"&&!p.h?"175px":"";
  if(Number.isFinite(Number(p.h))&&Number(p.h)>0)tile.style.height=clamp(Number(p.h),135,1200)+"px";
  const x=Number.isFinite(Number(p.x))?Number(p.x):defaultPositions[i][0];
  const y=Number.isFinite(Number(p.y))?Number(p.y):defaultPositions[i][1];
  tile.style.left=clamp(x,0,Math.max(0,100-tile.offsetWidth/tiles.clientWidth*100))+"%";
  tile.style.top=clamp(y,0,Math.max(0,100-tile.offsetHeight/tiles.clientHeight*100))+"%";
 });
}
function persistPositions(){try{localStorage.setItem(positionsKey,JSON.stringify(getTilePositions()));}catch{}}
let initialPositions={};try{initialPositions=JSON.parse(localStorage.getItem(positionsKey)||"{}");}catch{}
applyTilePositions({});
let gesture=null;
tileEls.forEach(tile=>{
 for(const [selector,kind] of [[".move-handle","move"],[".resize-handle","resize"]]){
  const handle=tile.querySelector(selector);
  if(!handle)continue;
  handle.addEventListener("pointerdown",e=>{
   if(!document.body.classList.contains("editing")||(e.pointerType==="mouse"&&e.button!==0))return;
   e.preventDefault();
   gesture={tile,kind,id:e.pointerId,x:e.clientX,y:e.clientY,left:tile.offsetLeft,top:tile.offsetTop,width:tile.offsetWidth,height:tile.offsetHeight};
   tile.classList.add("moving");
   handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener("pointermove",e=>{
   if(!gesture||gesture.tile!==tile||gesture.id!==e.pointerId)return;
   const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
   if(gesture.kind==="move"){
    tile.style.left=clamp(gesture.left+dx,0,Math.max(0,tiles.clientWidth-tile.offsetWidth))/tiles.clientWidth*100+"%";
    tile.style.top=clamp(gesture.top+dy,0,Math.max(0,tiles.clientHeight-tile.offsetHeight))/tiles.clientHeight*100+"%";
   }else{
    tile.style.width=clamp(gesture.width+dx,220,tiles.clientWidth-gesture.left)/tiles.clientWidth*100+"%";
    tile.style.height=clamp(gesture.height+dy,135,Math.max(135,tiles.clientHeight-gesture.top))+"px";
   }
  });
  const finish=e=>{if(!gesture||gesture.tile!==tile||gesture.id!==e.pointerId)return;tile.classList.remove("moving");gesture=null;persistPositions();};
  handle.addEventListener("pointerup",finish);
  handle.addEventListener("pointercancel",finish);
  handle.addEventListener("lostpointercapture",()=>{if(gesture?.tile===tile){tile.classList.remove("moving");gesture=null;persistPositions();}});
 }
});
window.addEventListener("resize",()=>{const positions=getTilePositions();applyTilePositions(positions);});
function setEditMode(enabled){
 document.body.classList.toggle("editing",enabled);
 $("editMode").textContent=enabled?"Klar – visa tavlan":"Redigera tavlan";
 $("editMode").setAttribute("aria-pressed",String(enabled));
 for(const id of ["goals","instructions"])$(id).contentEditable="true";
 $("boardName").readOnly=!enabled;
}
$("editMode").addEventListener("click",()=>setEditMode(!document.body.classList.contains("editing")));
setEditMode(false);

const extraIds=["timer","quiet","metronome"];
const extrasKey="musikportalen-visible-extras";
function getVisibleExtras(){return extraIds.filter(id=>!tiles.querySelector('[data-tile="'+id+'"]').hidden);}
function setVisibleExtras(ids){
 const selected=Array.isArray(ids)?ids:[];
 for(const id of extraIds)tiles.querySelector('[data-tile="'+id+'"]').hidden=!selected.includes(id);
 try{localStorage.setItem(extrasKey,JSON.stringify(getVisibleExtras()));}catch{}
 document.querySelectorAll(".extra-toggle").forEach(button=>button.setAttribute("aria-pressed",String(selected.includes(button.dataset.extra))));
 $("hideExtras").hidden=getVisibleExtras().length===0;
}
document.querySelectorAll(".extra-toggle").forEach(button=>button.addEventListener("click",()=>{const id=button.dataset.extra;const visible=getVisibleExtras();setVisibleExtras(visible.includes(id)?visible.filter(x=>x!==id):[...visible,id]);}));
$("hideExtras").addEventListener("click",()=>setVisibleExtras([]));
// Extra verktyg är dolda när tavlan öppnas. De väljs via knapparna i toppmenyn.
setVisibleExtras([]);
document.querySelectorAll(".format-bar button").forEach(b=>{b.addEventListener("mousedown",e=>e.preventDefault());b.addEventListener("click",()=>{const el=b.closest(".tile").querySelector(".rich-editor");el.focus();document.execCommand(b.dataset.format,false,null);persist();resizeTextAreas();});});
document.querySelectorAll(".font-size").forEach(s=>s.addEventListener("change",()=>{const el=s.closest(".tile").querySelector(".rich-editor");const selection=window.getSelection();if(!selection.rangeCount||selection.isCollapsed||!el.contains(selection.anchorNode)){s.value="";return;}const range=selection.getRangeAt(0);const span=document.createElement("span");span.style.fontSize=s.value+"px";span.append(range.extractContents());range.insertNode(span);selection.removeAllRanges();el.focus();persist();resizeTextAreas();s.value="";}));
function resizeTextAreas(){
 for(const id of ["goals","instructions","ending"]){
  const el=$(id);
  el.style.height="auto";
  el.style.height=Math.max(260,el.scrollHeight+4)+"px";
 }
}
for(const id of ["goals","instructions"])$(id).addEventListener("input",resizeTextAreas);
resizeTextAreas();
