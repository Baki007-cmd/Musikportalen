"use strict";
const $=id=>document.getElementById(id);
let client=null,questions=[],hostId=null,studentToken=null,lastPosition=-2,hostState=null,studentState=null,busy=false;
const msg=text=>$("message").textContent=text;
const show=id=>{for(const x of ["chooser","teacher","host","student"])$(x).classList.toggle("hidden",x!==id)};
const call=async(action,data={})=>{if(!client)client=await getMusikportalenSupabase();const {data:result,error}=await client.rpc("classroom_quiz_action",{p_action:action,p_data:data});if(error)throw Error(error.message);return result};
let qrPin="";function renderJoinQr(pin){if(!/^\d{6}$/.test(String(pin))||qrPin===String(pin))return;qrPin=String(pin);const link=new URL("klassrumsquiz.html",location.href);link.searchParams.set("pin",qrPin);const url=link.toString();const el=$("quizQr");el.replaceChildren();$("quizJoinLink").href=url;$("quizJoinLink").textContent="Direktlänk för elever";if(typeof QRCode==="undefined"){el.textContent="QR-biblioteket kunde inte laddas. Använd länken.";return}new QRCode(el,{text:url,width:240,height:240,colorDark:"#18233c",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M})}const make=(tag,text,parent)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el};
for(let i=0;i<4;i++){const label=make("label","Svarsalternativ "+(i+1),$("answerInputs"));const input=document.createElement("input");input.id="answer"+i;input.maxLength=160;input.required=true;label.append(input)}
$("teacherMode").onclick=async()=>{try{client=await getMusikportalenSupabase();const {data:{user}}=await client.auth.getUser();if(!user)throw Error("Logga in som lärare först.");const {data:profile}=await client.from("portal_users").select("role").eq("id",user.id).single();if(!["teacher","admin"].includes(profile?.role))throw Error("Du behöver godkänd lärarbehörighet.");show("teacher");msg("");refreshSavedQuizzes().catch(e=>msg(e.message))}catch(e){msg(e.message)}};
$("studentMode").onclick=()=>{show("student");msg("")};
async function uploadQuizImage(file){
 if(!file)return "";
 if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw Error("Välj en JPG-, PNG- eller WebP-bild.");
 if(file.size>5*1024*1024)throw Error("Bilden får vara högst 5 MB.");
 if(!client)client=await getMusikportalenSupabase();
 const {data:{user}}=await client.auth.getUser();
 if(!user)throw Error("Logga in som lärare för att bifoga bilder.");
 const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type];
 const path=user.id+"/"+crypto.randomUUID()+"."+ext;
 const {error}=await client.storage.from("classroom-quiz-images").upload(path,file,{contentType:file.type,upsert:false});
 if(error)throw Error("Bilduppladdningen misslyckades. Kontrollera att lagringsytan classroom-quiz-images finns i Supabase. "+error.message);
 return "quiz-image:"+path;
}
function quizImagePath(value){
 if(typeof value!=="string")return "";
 if(value.startsWith("quiz-image:"))return value.slice(11);
 try{const u=new URL(value);const marker="/storage/v1/object/public/classroom-quiz-images/";if(u.pathname.includes(marker))return decodeURIComponent(u.pathname.split(marker)[1]||"")}catch(e){}
 return "";
}
async function displayQuizImage(value,parent,alt,token){
 if(!value)return;
 const img=document.createElement("img");img.alt=alt;img.className="quiz-image";parent.append(img);
 const path=quizImagePath(value);
 if(!path){if(/^https:\/\//i.test(value))img.src=value;else img.remove();return}
 try{
  if(!client)client=await getMusikportalenSupabase();
  const {data:{session}}=await client.auth.getSession();
  const headers={"Content-Type":"application/json"};
  if(session?.access_token)headers.Authorization="Bearer "+session.access_token;
  const response=await fetch("/api/quiz-image-url",{method:"POST",headers,body:JSON.stringify({path,studentToken:token||undefined})});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||"Bilden kunde inte visas");
  if(img.isConnected)img.src=result.url;
 }catch(e){img.alt="Bilden är inte tillgänglig";msg(e.message)}
}
function addImageUpload(label,q){
 const fileInput=document.createElement("input");fileInput.type="file";fileInput.accept="image/jpeg,image/png,image/webp";label.append(fileInput);
 const status=document.createElement("small");label.append(status);
 fileInput.onchange=async()=>{
  const file=fileInput.files?.[0];if(!file)return;
  fileInput.disabled=true;status.textContent="Laddar upp bild …";
  try{q.image=await uploadQuizImage(file);const url=label.querySelector('input[type="url"]');if(url)url.value=q.image;status.textContent="Bilden är bifogad och sparas med frågan.";msg("Bilden har laddats upp.");}
  catch(e){status.textContent=e.message;msg(e.message)}
  finally{fileInput.disabled=false;fileInput.value=""}
 };
}
// Original, synthesized background loops; no external music or copyrighted recordings.
let musicContext=null,musicTimer=null,musicMode="none",musicStep=0,musicEnabled=false;
const musicPatterns={pulse:[220,0,330,0,262,0,392,0],arcade:[392,494,587,494,440,523,659,523],calm:[262,330,392,330,294,349,440,349]};
function stopQuizMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}musicMode="none"}
function musicNote(freq,duration,mode){
 if(!musicContext||!freq)return;
 const oscillator=musicContext.createOscillator(),gain=musicContext.createGain(),now=musicContext.currentTime;
 oscillator.type=mode==="calm"?"sine":mode==="arcade"?"square":"triangle";
 oscillator.frequency.value=freq;
 gain.gain.setValueAtTime(0.0001,now);
 gain.gain.exponentialRampToValueAtTime(mode==="calm"?0.035:0.023,now+0.025);
 gain.gain.exponentialRampToValueAtTime(0.0001,now+duration);
 oscillator.connect(gain).connect(musicContext.destination);
 oscillator.start(now);oscillator.stop(now+duration+0.02);
}
function setQuizMusic(mode){
 if(!musicEnabled)return;
 if(musicMode===mode&&musicTimer)return;
 stopQuizMusic();if(!musicPatterns[mode])return;
 musicMode=mode;musicStep=0;
 const play=()=>{const notes=musicPatterns[mode];musicNote(notes[musicStep++%notes.length],mode==="calm"?0.42:0.17,mode)};
 play();musicTimer=setInterval(play,mode==="calm"?490:mode==="arcade"?230:280);
}
$("toggleMusic").onclick=async()=>{
 if(musicEnabled){musicEnabled=false;stopQuizMusic();$("toggleMusic").textContent="▶ Starta bakgrundsmusik";return}
 try{musicContext ||=new (window.AudioContext||window.webkitAudioContext)();await musicContext.resume();musicEnabled=true;$("toggleMusic").textContent="■ Stäng av musik";updateQuizMusic()}catch(e){msg("Kunde inte spela upp musik: "+e.message)}
};
$("lobbyMusic").onchange=()=>updateQuizMusic();
function updateQuizMusic(){
 if(!musicEnabled||!hostState)return;
 const state=hostState;
 const mode=state.status==="finished"?"none":state.position<0?$("lobbyMusic").value:(state.questions[state.position]?.music||"none");
 setQuizMusic(mode);
}
function renderQuestionList(){
 const list=$("questionList");list.replaceChildren();
 $("questionCount").textContent=questions.length+" frågor tillagda";
 questions.forEach((q,index)=>{
  const li=document.createElement("li");li.className="quiz-edit-item";
  const heading=make("strong","Fråga "+(index+1),li);
  const questionLabel=make("label","Frågetext",li);
  const questionInput=document.createElement("textarea");questionInput.rows=2;questionInput.maxLength=300;questionInput.value=q.text;questionLabel.append(questionInput);
  questionInput.oninput=()=>{q.text=questionInput.value.trim()};
  const answerInputs=[];
  for(let i=0;i<4;i++){
   const label=make("label","Alternativ "+String.fromCharCode(65+i),li);
   const input=document.createElement("input");input.maxLength=160;input.value=q.answers[i]||"";label.append(input);
   input.oninput=()=>{q.answers[i]=input.value.trim()};answerInputs.push(input);
  }
  const correctLabel=make("label","Rätt svar",li);
  const correctSelect=document.createElement("select");
  for(let i=0;i<4;i++){const option=document.createElement("option");option.value=String(i);option.textContent="Alternativ "+String.fromCharCode(65+i);correctSelect.append(option)}
  correctSelect.value=String(q.correct);correctSelect.onchange=()=>{q.correct=Number(correctSelect.value)};correctLabel.append(correctSelect);
  const imageLabel=make("label","Bildadress (valfritt)",li);
  const imageInput=document.createElement("input");imageInput.type="text";imageInput.placeholder="https:// eller privat bild";imageInput.value=q.image||"";imageInput.oninput=()=>{q.image=imageInput.value.trim()};imageLabel.append(imageInput);addImageUpload(imageLabel,q);
  const musicLabel=make("label","Bakgrundsmusik för frågan",li);const musicSelect=document.createElement("select");musicSelect.className="music-choice";for(const [value,name] of [["none","Ingen musik"],["pulse","Spännande puls"],["arcade","Spelmusik"],["calm","Lugn musik"]]){const option=document.createElement("option");option.value=value;option.textContent=name;musicSelect.append(option)}musicSelect.value=q.music||"pulse";q.music=musicSelect.value;musicSelect.onchange=()=>{q.music=musicSelect.value};musicLabel.append(musicSelect);
  const timeLabel=make("label","Tidsgräns",li);const timeSelect=document.createElement("select");
  for(const seconds of [15,30,60,0]){const option=document.createElement("option");option.value=String(seconds);option.textContent=seconds?seconds+" sekunder":"Ingen tidsgräns";timeSelect.append(option)}
  timeSelect.value=String(q.seconds??30);timeSelect.onchange=()=>{q.seconds=Number(timeSelect.value)};timeLabel.append(timeSelect);
  const duplicate=make("button","Duplicera",li);duplicate.type="button";duplicate.className="secondary";duplicate.onclick=()=>{if(questions.length>=30){msg("Högst 30 frågor.");return}questions.splice(index+1,0,JSON.parse(JSON.stringify(q)));renderQuestionList()};
  const remove=make("button","Ta bort",li);remove.type="button";remove.className="secondary";remove.onclick=()=>{questions.splice(index,1);renderQuestionList()};
  list.append(li);
 });
}
function validateQuestions(){
 if(!questions.length)return "Lägg till minst en fråga.";
 for(let i=0;i<questions.length;i++){
  const q=questions[i];
  if(!q.text||q.text.trim().length<3||!Array.isArray(q.answers)||q.answers.length!==4||q.answers.some(a=>!a||!a.trim()))return "Kontrollera fråga "+(i+1)+": skriv frågan och alla fyra svar.";
  if(!Number.isInteger(q.correct)||q.correct<0||q.correct>3)return "Välj rätt svar för fråga "+(i+1)+".";
  if(q.image&&!/^https:\/\//i.test(q.image)&&!quizImagePath(q.image))return "Bildadressen i fråga "+(i+1)+" måste börja med https://.";
 }
 return "";
}
$("addQuestion").onclick=async()=>{
 const text=$("questionText").value.trim(),answers=[0,1,2,3].map(i=>$("answer"+i).value.trim()),correct=Number($("correct").value);
 if(text.length<3||answers.some(a=>!a)){msg("Fyll i frågan och alla fyra svarsalternativ.");return}
 if(questions.length>=30){msg("Högst 30 frågor.");return}
 let image=$("questionImage").value.trim();
 if(image&&!/^https:\/\//i.test(image)&&!quizImagePath(image)){msg("Bildadressen måste börja med https://");return}
 const file=$("questionImageFile")?.files?.[0];
 if(file){$("addQuestion").disabled=true;$("questionImageStatus").textContent="Laddar upp bild …";try{image=await uploadQuizImage(file)}catch(e){msg(e.message);$("questionImageStatus").textContent=e.message;return}finally{$("addQuestion").disabled=false}}
 const seconds=Number($("questionTime").value);
 questions.push({text,answers,correct,image,seconds,music:$("questionMusic").value});
 $("questionImage").value="";$("questionImageFile").value="";$("questionImageStatus").textContent="";$("questionText").value="";
 for(let i=0;i<4;i++)$("answer"+i).value="";
 renderQuestionList();msg("Frågan är tillagd. Du kan redigera alla alternativ nedan.");
};
$("startGame").onclick=async()=>{const validation=validateQuestions();if(validation){msg(validation);return}try{const result=await call("create",{title:$("quizTitle").value.trim(),subject:$("quizSubject").value.trim(),grade:Number($("quizGrade").value),questions});hostId=result.id;show("host");$("pin").textContent=result.pin;await refreshHost();msg("Spel skapat. Visa koden på tavlan.")}catch(e){msg(e.message)}};
$("nextQuestion").onclick=async()=>{if(autoAdvanceBusy)return;autoAdvanceBusy=true;try{const state=await call("host",{id:hostId});if(state.status==="finished")return;if(state.position>=state.questions.length-1)await call("finish",{id:hostId});else await call("advance",{id:hostId});}catch(e){msg(e.message)}finally{autoAdvanceBusy=false;await refreshHost()}};
$("finishGame").onclick=async()=>{if(!confirm("Avsluta quizet och visa resultat?"))return;try{await call("finish",{id:hostId});await refreshHost()}catch(e){msg(e.message)}};
let ceremonyRanking=[],ceremonyIndex=0,ceremonyHostId=null;
function showCeremony(){
 if(!hostState||hostState.status!=="finished")return;
 ceremonyRanking=[...(hostState.players||[])].sort((a,b)=>Number(b.score||0)-Number(a.score||0)).slice(0,3);
 ceremonyIndex=0;ceremonyHostId=hostId;
 $("ceremonyStage").replaceChildren();
 $("ceremonyStatus").textContent="Nu ska vi hylla våra tre bästa deltagare! 🎉";
 $("revealCeremony").disabled=!ceremonyRanking.length;
 $("revealCeremony").textContent="Avslöja nästa placering";
 $("ceremony").classList.remove("hidden");
 stopQuizMusic();
}
$("startCeremony").onclick=showCeremony;
$("closeCeremony").onclick=()=>$("ceremony").classList.add("hidden");
$("revealCeremony").onclick=()=>{
 if(ceremonyIndex>=ceremonyRanking.length)return;
 const index=ceremonyRanking.length-1-ceremonyIndex;
 const p=ceremonyRanking[index],place=index+1;
 const medal=["🥇","🥈","🥉"][index];
 const card=make("div","",$("ceremonyStage"));card.className="ceremony-winner";
 make("div",medal,card).className="medal";
 make("h3",place+":a plats",card);
 make("strong",p.nickname,card);
 make("small",p.score+" poäng",card);
 $("ceremonyStatus").textContent=place===1?"🎊 Grattis till segern!": "Applåder för "+place+":e plats!";
 ceremonyIndex++;
 if(ceremonyIndex>=ceremonyRanking.length){$("revealCeremony").textContent="🎉 Prisutdelningen är klar";$("revealCeremony").disabled=true}
 else $("revealCeremony").textContent="Avslöja nästa placering";
};
function renderResults(state){
 const panel=$("quizResults");if(state.status!=="finished"){panel.classList.add("hidden");$("startCeremony").classList.add("hidden");return}
 panel.classList.remove("hidden");panel.replaceChildren();$("startCeremony").classList.remove("hidden");
 make("h2","Resultat för "+state.title,panel);
 const players=state.players||[],qs=state.questions||[];
 const total=players.length*qs.length;
 let correct=0,answered=0;
 for(const p of players)for(const a of p.answers||[]){if(!Number.isInteger(a.position)||!qs[a.position])continue;answered++;if(Number(a.choice)===Number(qs[a.position].correct))correct++}
 const summary=make("p",players.length+" deltagare · "+correct+" rätt av "+total+" möjliga svar ("+(total?Math.round(100*correct/total):0)+" %) · "+answered+" registrerade svar",panel);summary.className="result-summary";
 make("h3","Resultat per fråga",panel);
 qs.forEach((q,index)=>{
  const block=make("div","",panel);block.className="result-question";
  make("h4","Fråga "+(index+1)+": "+q.text,block);
  const counts=[0,0,0,0];
  for(const p of players)for(const a of p.answers||[])if(a.position===index&&Number.isInteger(Number(a.choice))&&Number(a.choice)>=0&&Number(a.choice)<4)counts[Number(a.choice)]++;
  const sum=counts.reduce((a,b)=>a+b,0);
  q.answers.forEach((answer,i)=>{
   const line=make("div","",block);line.className="result-line"+(i===Number(q.correct)?" result-correct":"");
   make("div",String.fromCharCode(65+i)+". "+answer+(i===Number(q.correct)?" ✓ Rätt svar":""),line);
   const track=make("div","",line);track.className="result-track";track.setAttribute("role","img");track.setAttribute("aria-label",counts[i]+" av "+sum+" svar");
   const bar=make("span","",track);bar.style.width=(sum?100*counts[i]/sum:0)+"%";
   make("small",counts[i]+" svar ("+(sum?Math.round(100*counts[i]/sum):0)+" %)",line);
  });
 });
 make("h3","Poängställning",panel);
 const ranking=[...players].sort((a,b)=>Number(b.score||0)-Number(a.score||0));
 if(!ranking.length)make("p","Inga deltagare ännu.",panel);
 ranking.forEach((p,i)=>{const line=make("div",(i+1)+". "+p.nickname+" – "+p.score+" poäng",panel);line.className="score"});
}
let autoAdvanceBusy=false;
async function autoAdvanceTimedQuestion(state){
 if(autoAdvanceBusy||!hostId||state.status!=="playing"||state.position<0||!state.started_at)return;
 const question=state.questions?.[state.position];
 const limit=Number(question?.seconds??30);
 const timedOut=Number.isFinite(limit)&&limit>0&&Date.now()>=new Date(state.started_at).getTime()+limit*1000;
 const allAnswered=state.players.length>0&&state.players.every(p=>(p.answers||[]).some(a=>Number(a.position)===state.position));
 if(!timedOut&&!allAnswered)return;
 autoAdvanceBusy=true;
 try{
  if(state.position>=state.questions.length-1)await call("finish",{id:hostId});
  else await call("advance",{id:hostId});
  hostState=await call("host",{id:hostId});
 }catch(e){msg("Kunde inte byta fråga automatiskt: "+e.message)}
 finally{autoAdvanceBusy=false}
}
async function refreshHost(){if(!hostId)return;hostState=await call("host",{id:hostId});await autoAdvanceTimedQuestion(hostState);const s=hostState;$("hostTitle").textContent=s.title;$("pin").textContent=s.pin;renderJoinQr(s.pin);$("joined").textContent=s.players.length+" deltagare";$("players").replaceChildren();for(const p of s.players)make("div","🎮 "+p.nickname,$("players")).className="lobby-player";const rank=$("liveRanking");rank.replaceChildren();if(s.position>=0){make("h3","🏆 Aktuell poängställning",rank);[...s.players].sort((a,b)=>Number(b.score||0)-Number(a.score||0)).slice(0,10).forEach((p,i)=>make("div",(i+1)+". "+p.nickname+" – "+p.score+" poäng",rank).className="score")}updateQuizMusic();$("nextQuestion").disabled=s.status==="finished";$("nextQuestion").textContent=s.position<0?"Starta första frågan":s.position>=s.questions.length-1?"Avsluta sista frågan och visa resultat":"Hoppa över väntetiden – nästa fråga";$("finishGame").disabled=s.status==="finished";renderResults(s);const container=$("hostQuestion");container.replaceChildren();if(s.position>=0){const q=s.questions[s.position];if(q.image)displayQuizImage(q.image,container,"Bild till quizfrågan");make("h2","Fråga "+(s.position+1)+" av "+s.questions.length,container);make("div",q.text,container).className="question";const answers=make("div","",container);answers.className="answers";q.answers.forEach((answer,i)=>make("button",answer,answers).disabled=true);const total=s.players.reduce((n,p)=>n+p.answers.filter(a=>a.position===s.position).length,0);make("p",total+" av "+s.players.length+" har svarat.",container);if(s.status==="finished")make("p","Rätt svar: "+q.answers[q.correct],container)}if(s.status==="finished")msg("Quizet är avslutat. Resultaten och diagrammen visas nedan.")};
$("joinGame").onclick=async()=>{try{const result=await call("join",{pin:$("joinCode").value.trim(),nickname:$("nickname").value.trim()});studentToken=result.token;$("joinGame").disabled=true;$("studentGame").classList.remove("hidden");msg("Du är med! Vänta på läraren.");await refreshStudent()}catch(e){msg(e.message)}};
async function refreshStudent(){if(!studentToken)return;studentState=await call("student",{token:studentToken});const s=studentState;$("studentScore").textContent="Poäng: "+s.score;const target=$("studentAnswers");if(s.position!==lastPosition){target.replaceChildren();$("answerFeedback").classList.add("hidden");lastPosition=s.position;if(s.question){if(s.question.image)displayQuizImage(s.question.image,target,"Bild till frågan",studentToken);s.question.answers.forEach((a,i)=>{const b=make("button",a,target);b.onclick=async()=>{try{await call("answer",{token:studentToken,choice:i});await refreshStudent()}catch(e){msg(e.message)}}})}}$("studentHeading").textContent=s.status==="finished"?"Quizet är avslutat!":s.position<0?"Väntar på läraren …":s.question.text;if(s.answered||s.status==="finished"||(s.seconds>0&&s.started_at&&Date.now()>=new Date(s.started_at).getTime()+s.seconds*1000)){for(const b of target.querySelectorAll("button"))b.disabled=true;if(s.answered){const chosen=Number(s.selected_choice),correct=Number(s.correct_choice);for(const [i,b] of [...target.querySelectorAll("button")].entries()){b.classList.toggle("answer-correct",i===correct);b.classList.toggle("answer-wrong",i===chosen&&chosen!==correct)}const feedback=$("answerFeedback");feedback.textContent=Number.isInteger(correct)&&correct>=0&&correct<4?(chosen===correct?"✓ Rätt svar!":"✗ Inte riktigt. Rätt svar är "+String.fromCharCode(65+correct)+"."):"Svar registrerat.";feedback.classList.remove("hidden");feedback.classList.toggle("feedback-correct",chosen===correct);feedback.classList.toggle("feedback-wrong",chosen!==correct);if(s.status!=="finished")msg("Svar registrerat. Vänta på nästa fråga.")}else{$("answerFeedback").classList.add("hidden")}}else if(s.position>=0)msg("Välj ett svar.")};
function secondsRemaining(state){if(!state||state.position<0||!state.started_at)return null;const q=state.questions?.[state.position];const limit=state.seconds??q?.seconds??30;if(!limit)return null;return Math.max(0,Math.ceil((new Date(state.started_at).getTime()+limit*1000-Date.now())/1000))}
setInterval(()=>{if(hostState){const n=secondsRemaining(hostState);$("hostTimer").textContent=n===null?"":n+" sekunder kvar"}if(studentState){const n=secondsRemaining(studentState);$("studentTimer").textContent=n===null?"":n+" sekunder kvar";if(n===0){for(const b of $("studentAnswers").querySelectorAll("button"))b.disabled=true}}},500);
$("generateAi").onclick=async()=>{const button=$("generateAi");button.disabled=true;msg("AI skapar frågor …");try{if(!client)client=await getMusikportalenSupabase();const {data:{session}}=await client.auth.getSession();if(!session)throw Error("Logga in som lärare");const response=await fetch("/api/generate-classroom-quiz",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({subject:$("quizSubject").value,grade:Number($("quizGrade").value),topic:$("aiTopic").value,count:Number($("aiCount").value)})});const data=await response.json();if(!response.ok)throw Error(data.error||"AI-fel");questions.push(...data.questions.slice(0,Math.max(0,30-questions.length)));renderQuestionList();msg("AI-frågor skapade. Granska innehåll och facit innan du startar.")}catch(e){msg(e.message)}finally{button.disabled=false}};
let selectedSavedQuizId=null;
async function refreshSavedQuizzes(){
 const list=$("savedQuizList");list.replaceChildren();
 if(!client)client=await getMusikportalenSupabase();
 const {data,error}=await client.from("classroom_quiz_library").select("id,title,subject,grade,questions,updated_at").order("updated_at",{ascending:false}).limit(100);
 if(error)throw Error("Kunde inte läsa sparade quiz. Kontrollera att SQL för quizbiblioteket är installerad. "+error.message);
 if(!data.length){make("p","Du har ännu inga sparade quiz.",list);return}
 for(const item of data){
  const row=make("div","",list);row.className="saved-quiz-row";
  make("strong",item.title||"Namnlöst quiz",row);
  make("span"," · "+item.subject+" · Åk "+item.grade+" · "+(item.questions?.length||0)+" frågor ",row);
  const open=make("button","Öppna",row);open.type="button";open.className="secondary";open.onclick=()=>{
   selectedSavedQuizId=item.id;
   questions=JSON.parse(JSON.stringify(item.questions||[])).slice(0,30);
   $("quizTitle").value=item.title||"";$("quizSubject").value=item.subject||"Musik";$("quizGrade").value=String(item.grade||6);
   renderQuestionList();msg("Quizet är öppnat. Du kan redigera frågorna eller starta ett nytt spel.");
   $("questionEditor").scrollIntoView({behavior:"smooth",block:"start"});
  };
  const del=make("button","Ta bort",row);del.type="button";del.className="secondary";del.onclick=async()=>{
   if(!confirm("Vill du ta bort det sparade quizet "+item.title+"?"))return;
   const {error}=await client.from("classroom_quiz_library").delete().eq("id",item.id);
   if(error){msg(error.message);return}
   if(selectedSavedQuizId===item.id)selectedSavedQuizId=null;
   await refreshSavedQuizzes();msg("Det sparade quizet har tagits bort.");
  };
 }
}
$("saveQuizLibrary").onclick=async()=>{
 const validation=validateQuestions();if(validation){msg(validation);return}
 const title=$("quizTitle").value.trim();if(!title){msg("Skriv ett namn på quizet först.");return}
 try{
  if(!client)client=await getMusikportalenSupabase();
  const {data:{user}}=await client.auth.getUser();if(!user)throw Error("Logga in som lärare för att spara.");
  const payload={owner_id:user.id,title,subject:$("quizSubject").value.trim()||"Musik",grade:Number($("quizGrade").value),questions:JSON.parse(JSON.stringify(questions)),updated_at:new Date().toISOString()};
  const query=selectedSavedQuizId?client.from("classroom_quiz_library").update(payload).eq("id",selectedSavedQuizId):client.from("classroom_quiz_library").insert(payload);
  const {data,error}=await query.select("id").single();if(error)throw Error(error.message);
  selectedSavedQuizId=data.id;await refreshSavedQuizzes();msg("Quizet är sparat i ditt quizbibliotek med alla frågor och svar.");
 }catch(e){msg("Kunde inte spara: "+e.message)}
};
$("newQuizLibrary").onclick=()=>{selectedSavedQuizId=null;questions=[];$("quizTitle").value="";renderQuestionList();msg("Nytt quiz. Tidigare sparade quiz finns kvar i biblioteket.")};
$("refreshQuizLibrary").onclick=async()=>{try{await refreshSavedQuizzes();msg("Quizbiblioteket är uppdaterat.")}catch(e){msg(e.message)}};
$("saveDraft").onclick=()=>{try{localStorage.setItem("lararverktyget-quiz-draft",JSON.stringify({questions,title:$("quizTitle").value,subject:$("quizSubject").value,grade:$("quizGrade").value}));msg("Utkast sparat i denna webbläsare. Det synkroniseras inte mellan enheter.")}catch(e){msg("Kunde inte spara utkast: "+e.message)}};
$("loadDraft").onclick=()=>{try{const data=JSON.parse(localStorage.getItem("lararverktyget-quiz-draft")||"null");if(!data||!Array.isArray(data.questions))throw Error("Inget sparat utkast");questions=data.questions.slice(0,30);$("quizTitle").value=data.title||"";$("quizSubject").value=data.subject||"Musik";$("quizGrade").value=data.grade||"6";renderQuestionList();msg("Utkast laddat. Frågor och svarsalternativ kan redigeras.")}catch(e){msg(e.message)}};
$("duplicateQuestion").onclick=()=>{if(!questions.length){msg("Lägg först till en fråga.");return}if(questions.length>=30){msg("Högst 30 frågor.");return}questions.push(JSON.parse(JSON.stringify(questions[questions.length-1])));renderQuestionList();msg("Sista frågan duplicerad. Du kan redigera kopian.")};
setInterval(async()=>{if(busy)return;busy=true;try{if(hostId)await refreshHost();if(studentToken)await refreshStudent()}catch(e){msg("Uppdatering misslyckades: "+e.message)}finally{busy=false}},2500);

$("downloadQr").onclick=()=>{const canvas=$("quizQr").querySelector("canvas"),img=$("quizQr").querySelector("img");const href=canvas?.toDataURL("image/png")||img?.src;if(!href){msg("QR-koden är inte klar ännu.");return}const a=document.createElement("a");a.href=href;a.download="klassrumsquiz-qr.png";a.click()};
const pinFromLink=new URLSearchParams(location.search).get("pin");if(/^\d{6}$/.test(pinFromLink||"")){$("joinCode").value=pinFromLink;show("student");msg("Ange ett smeknamn och tryck Gå med.");}
