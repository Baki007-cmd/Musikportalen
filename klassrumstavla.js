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