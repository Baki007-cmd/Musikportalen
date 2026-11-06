"use strict";const $=id=>document.getElementById(id);const key="musikportalen-board-v1";const bgKey="musikportalen-board-background";function setBackground(value){const allowed=["blue","staff","white","green","dark"];const choice=allowed.includes(value)?value:"blue";document.body.dataset.bg=choice;$("board").dataset.bg=choice;$("background").value=choice;try{localStorage.setItem(bgKey,choice);}catch{}}try{setBackground(localStorage.getItem(bgKey)||"blue");}catch{setBackground("blue");}$("background").addEventListener("change",e=>setBackground(e.target.value));let timer=null,remaining=600,running=false,metro=null,audio=null,beat=0;
function clock(){const now=new Date();$("clock").textContent=now.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit",second:"2-digit"});$("today").textContent=now.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"});}
clock();setInterval(clock,1000);
function display(){const m=Math.floor(remaining/60),s=remaining%60;$("countdown").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");}
function stopTimer(){running=false;if(timer!==null)clearInterval(timer);timer=null;}
function setMinutes(){remaining=Math.max(1,Math.min(180,Number($("minutes").value)||10))*60;display();}
$("minutes").onchange=()=>{if(!running)setMinutes();};
$("timerStart").onclick=()=>{if(running)return;if(remaining<=0)setMinutes();running=true;let end=Date.now()+remaining*1000;timer=setInterval(()=>{remaining=Math.max(0,Math.ceil((end-Date.now())/1000));display();if(remaining===0){stopTimer();$("countdown").textContent="Tiden är slut!";}},200);};
$("timerPause").onclick=stopTimer;$("timerReset").onclick=()=>{stopTimer();setMinutes();};
function persist(){try{localStorage.setItem(key,JSON.stringify({goals:$("goals").value,instructions:$("instructions").value,light:document.querySelector(".light.active")?.dataset.light}));}catch{}}
try{const saved=JSON.parse(localStorage.getItem(key)||"{}");$("goals").value=saved.goals||"";$("instructions").value=saved.instructions||"";if(saved.light)chooseLight(saved.light);}catch{}
for(const id of ["goals","instructions"])$(id).addEventListener("input",persist);
function chooseLight(value){document.querySelectorAll(".light").forEach(b=>b.classList.toggle("active",b.dataset.light===value));$("lightLabel").textContent=({red:"Röd – tyst arbete",yellow:"Gul – låg samtalsnivå",green:"Grön – samarbete"})[value]||"";}
document.querySelectorAll(".light").forEach(b=>b.onclick=()=>{chooseLight(b.dataset.light);persist();});
function stopMetro(){if(metro!==null)clearInterval(metro);metro=null;$("metro").textContent="Starta metronom";$("beat").textContent="♩";}
function tick(){beat++;$("beat").textContent=beat%4===1?"♩ 1":"♩ "+((beat-1)%4+1);if(!audio)return;const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.frequency.value=beat%4===1?880:620;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.15,now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+.1);osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+.11);}
$("metro").onclick=()=>{if(metro!==null){stopMetro();return;}const C=window.AudioContext||window.webkitAudioContext;if(C){audio ||= new C();audio.resume();}const bpm=Math.max(40,Math.min(220,Number($("bpm").value)||80));$("bpm").value=bpm;beat=0;tick();metro=setInterval(tick,60000/bpm);$("metro").textContent="Stoppa metronom";};
$("bpm").onchange=()=>{if(metro!==null){stopMetro();$("metro").click();}};
$("fullscreen").onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $("board").requestFullscreen?.();};
$("reset").onclick=()=>{if(!confirm("Nollställ anteckningar, timer och arbetsro?"))return;stopTimer();stopMetro();$("goals").value="";$("instructions").value="";$("minutes").value=10;setMinutes();chooseLight("green");persist();};
display();

let cloudClient=null,cloudUser=null,openedBoardId=null;
function boardStatus(s){$("boardStatus").textContent=s;}
function boardSnapshot(){return {background:$("background").value,goals:$("goals").value,instructions:$("instructions").value,light:document.querySelector(".light.active")?.dataset.light||"green",minutes:Number($("minutes").value)||10,remaining,bpm:Number($("bpm").value)||80,tilePositions:getTilePositions()};}
function restoreBoard(data){stopTimer();stopMetro();setBackground(data.background||"blue");$("goals").value=data.goals||"";$("instructions").value=data.instructions||"";chooseLight(["red","yellow","green"].includes(data.light)?data.light:"green");$("minutes").value=Math.max(1,Math.min(180,Number(data.minutes)||10));remaining=Math.max(0,Math.min(10800,Number(data.remaining)??600));$("bpm").value=Math.max(40,Math.min(220,Number(data.bpm)||80));display();persist();applyTilePositions(data.tilePositions||{});persistPositions();}
async function listBoards(){const {data,error}=await cloudClient.from("classroom_boards").select("id,title,content,updated_at").eq("owner_id",cloudUser.id).order("updated_at",{ascending:false});if(error)throw error;const root=$("savedBoards");root.replaceChildren();if(!data?.length)root.textContent="Inga sparade tavlor ännu.";for(const item of data||[]){const open=document.createElement("button");open.textContent="Öppna: "+item.title;open.onclick=()=>{openedBoardId=item.id;$("boardName").value=item.title;restoreBoard(item.content||{});boardStatus("Tavlan öppnad. Välj Spara för att uppdatera den.");};const remove=document.createElement("button");remove.className="secondary";remove.textContent="Ta bort";remove.onclick=async()=>{if(!confirm("Ta bort den sparade klassrumstavlan?"))return;const {error}=await cloudClient.from("classroom_boards").delete().eq("id",item.id).eq("owner_id",cloudUser.id);if(error){boardStatus(error.message);return;}if(openedBoardId===item.id)openedBoardId=null;await listBoards();boardStatus("Tavlan togs bort.");};root.append(open,remove);}}
$("saveBoard").onclick=async()=>{if(!cloudUser){boardStatus("Logga in för att spara.");return;}const btn=$("saveBoard");btn.disabled=true;try{const row={owner_id:cloudUser.id,title:$("boardName").value.trim()||"Min klassrumstavla",content:boardSnapshot()};const query=openedBoardId?cloudClient.from("classroom_boards").update(row).eq("id",openedBoardId).eq("owner_id",cloudUser.id).select("id").single():cloudClient.from("classroom_boards").insert(row).select("id").single();const {data,error}=await query;if(error)throw error;openedBoardId=data.id;await listBoards();boardStatus("Klassrumstavlan sparades i Supabase.");}catch(e){boardStatus("Kunde inte spara: "+e.message+". Kontrollera att classroom_boards-tabellen finns.");}finally{btn.disabled=false;}};
$("newBoard").onclick=()=>{openedBoardId=null;$("boardName").value="Min klassrumstavla";restoreBoard({background:"blue",goals:"",instructions:"",light:"green",minutes:10,remaining:600,bpm:80});boardStatus("Ny tavla. Spara när du vill behålla den.");};
(async()=>{try{cloudClient=await getMusikportalenSupabase();const {data:{user},error}=await cloudClient.auth.getUser();if(error||!user){location.replace("login.html");return;}cloudUser=user;boardStatus("Inloggad. Du kan spara klassrumstavlan.");await listBoards();}catch(e){boardStatus("Kunde inte läsa sparade tavlor: "+e.message);}})();




const tiles=$("tiles"),positionsKey="musikportalen-tile-positions";
const tileEls=[...tiles.querySelectorAll("[data-tile]")];
const defaultPositions=[[1,1],[34,1],[67,1],[1,38],[34,38],[67,38]];
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
  const width=Number.isFinite(Number(p.w))&&Number(p.w)>0?Number(p.w):33.333-18/Math.max(tiles.clientWidth,1)*100;
  tile.style.width=clamp(width,18,100)+"%";
  if(Number.isFinite(Number(p.h))&&Number(p.h)>0)tile.style.height=clamp(Number(p.h),135,1200)+"px";
  const x=Number.isFinite(Number(p.x))?Number(p.x):defaultPositions[i][0];
  const y=Number.isFinite(Number(p.y))?Number(p.y):defaultPositions[i][1];
  tile.style.left=clamp(x,0,Math.max(0,100-tile.offsetWidth/tiles.clientWidth*100))+"%";
  tile.style.top=clamp(y,0,Math.max(0,100-tile.offsetHeight/tiles.clientHeight*100))+"%";
 });
}
function persistPositions(){try{localStorage.setItem(positionsKey,JSON.stringify(getTilePositions()));}catch{}}
let initialPositions={};try{initialPositions=JSON.parse(localStorage.getItem(positionsKey)||"{}");}catch{}
applyTilePositions(initialPositions);
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
 for(const id of ["goals","instructions"])$(id).readOnly=false;
 $("boardName").readOnly=!enabled;
}
$("editMode").addEventListener("click",()=>setEditMode(!document.body.classList.contains("editing")));
setEditMode(false);
