"use strict";
const $=id=>document.getElementById(id);
const specs={
worksheet:{title:"Arbetsblad",help:"Skriv en fråga per rad. Materialet skapas utan AI och kan redigeras före utskrift.",fields:[["title","Rubrik","text"],["subject","Ämne och årskurs","text"],["instructions","Instruktion till eleverna","textarea"],["questions","Frågor eller uppgifter (en per rad)","textarea"]]},
exit:{title:"Exit ticket",help:"Tre korta frågor att använda som avslut på lektionen.",fields:[["title","Lektionens namn","text"],["subject","Ämne och årskurs","text"],["goal","Vad var lektionens mål?","textarea"]]},
quiz:{title:"Quiz",help:"Skriv en fråga per rad. Använd tecknet | mellan fråga och facit, exempelvis: Vad är puls? | Musikens regelbundna slag.",fields:[["title","Quizets namn","text"],["subject","Ämne och årskurs","text"],["questions","Frågor | Facit (en per rad)","textarea"]]},
support:{title:"Extra anpassningar och språkstöd",help:"En tydlig steg-för-steg-mall som läraren själv fyller i och anpassar.",fields:[["title","Uppgiftens namn","text"],["subject","Ämne och årskurs","text"],["goal","Det här ska eleven lära sig","textarea"],["steps","Arbetsgång, ett steg per rad","textarea"],["words","Viktiga begrepp och förklaringar, ett per rad","textarea"]]},
week:{title:"Min lärarvecka",help:"Skriv dina planerade lektioner och viktiga uppgifter för varje dag.",fields:[["title","Vecka / datum","text"],["monday","Måndag","textarea"],["tuesday","Tisdag","textarea"],["wednesday","Onsdag","textarea"],["thursday","Torsdag","textarea"],["friday","Fredag","textarea"]]},
lesson:{title:"Lektionsupplägg",help:"Ett strukturerat lektionsförslag. Anpassa innehåll och tidsfördelning efter din grupp.",fields:[["title","Lektionens rubrik","text"],["subject","Ämne och årskurs","text"],["goal","Undervisningsmål","textarea"],["steps","Lektionens delar (en per rad)","textarea"],["assessment","Så följer jag upp lärandet","textarea"]]},
library:{title:"Mina mallar och material",help:"Här finns det du sparat i denna webbläsare.",fields:[]}
};
let current=null,ownerKey="",cloud=null,cloudReady=false;
const lines=s=>String(s||"").split("\n").map(x=>x.trim()).filter(Boolean);
const safe=s=>String(s||"").trim();
function storageKey(){return "lararverktyget-local-material-v1-"+ownerKey;}
function load(){try{return JSON.parse(localStorage.getItem(storageKey())||"[]");}catch{return [];}}
function store(items){try{localStorage.setItem(storageKey(),JSON.stringify(items));return true;}catch{$("toast").textContent="Det gick inte att spara i webbläsaren.";return false;}}
function inputValues(){const data={};for(const field of specs[current].fields)data[field[0]]=safe($(field[0]).value);if(current==="worksheet")data.language=$("editorLanguage")?.value||"sv";return data;}
function materialLanguage(data){if(["sv","sq","en"].includes(data.language))return data.language;const text=String(data.instructions||"")+" "+String(data.questions||"");if(/(?:modersmål\s*[–-]\s*albanska|shqip|fjalë|fjali|udhëzime|çfarë|shkruaj|shpjego)/i.test(String(data.subject||"")+" "+text))return "sq";return "sv";}
function render(type,d){const heading=safe(d.title)||specs[type].title;const subject=d.subject?"Ämne och årskurs: "+d.subject+"\n\n":"";let body="";
if(type==="worksheet"){const lang=d.language||"sv";const label=lang==="sq"?"Udhëzime: ":lang==="en"?"Instructions: ":"Instruktion: ";const rule="______________________________________________________";const questions=lines(d.questions);const longCount=questions.filter(q=>/paragraf|tekst|fjali|paragraph|sentences|stycke|meningar/i.test(q)).length;const compact=questions.length>=5;body=label+(d.instructions||"Följ instruktionerna.")+"\n\n"+questions.map((q,i)=>{const many=/paragraf|tekst|fjali|paragraph|sentences|stycke|meningar/i.test(q);const count=compact?(many?3:1):(many?4:2);return (i+1)+". "+q+"\n\n"+Array(count).fill(rule).join("\n");}).join("\n\n");}
if(type==="exit")body=subject+"Lektionens mål: "+(d.goal||"________________")+"\n\n1. Det här har jag lärt mig idag:\n\n________________________________________\n\n2. Det här behöver jag öva mer på:\n\n________________________________________\n\n3. En fråga jag fortfarande har:\n\n________________________________________";
if(type==="quiz")body=subject+lines(d.questions).map((q,i)=>(i+1)+". "+q.split("|")[0].trim()+"\n\n________________________________________").join("\n\n")+"\n\n--- FACIT (för läraren, ta bort före elevutskrift) ---\n"+lines(d.questions).map((q,i)=>(i+1)+". "+(q.split("|").slice(1).join("|").trim()||"Ej angivet")).join("\n");
if(type==="support")body=subject+"Mål: "+(d.goal||"________________")+"\n\nGÖR SÅ HÄR:\n"+lines(d.steps).map((x,i)=>(i+1)+". "+x).join("\n")+"\n\nVIKTIGA ORD:\n"+lines(d.words).map(x=>"• "+x).join("\n")+"\n\nKONTROLLERA:\n□ Jag vet vad jag ska göra.\n□ Jag har följt stegen.\n□ Jag kan förklara vad jag har lärt mig.";
if(type==="lesson")body=subject+"MÅL\n"+(d.goal||"") + "\n\nLEKTIONENS GÅNG\n"+lines(d.steps).map((x,i)=>(i+1)+". "+x).join("\n")+"\n\nUPPFÖLJNING\n"+(d.assessment||"");
if(type==="week")body=[["MÅNDAG",d.monday],["TISDAG",d.tuesday],["ONSDAG",d.wednesday],["TORSDAG",d.thursday],["FREDAG",d.friday]].map(([day,content])=>day+"\n"+(content||"—")).join("\n\n");
if(type==="worksheet"){const lang=d.language||"sv";const headingText=lang==="sq"?heading.replace(/\s*[–—-]\s*Arbetsblad$/," – Fletë pune"):lang==="en"?heading.replace(/\s*[–—-]\s*Arbetsblad$/," – Worksheet"):heading;const subjectLabel=lang==="sq"?"Lënda dhe klasa: ":lang==="en"?"Subject and grade: ":"Ämne och årskurs: ";const student=lang==="sq"?"Emri dhe mbiemri: __________________________    Data: ______________":lang==="en"?"Name: __________________________    Date: ______________":"Namn: __________________________    Datum: ______________";return headingText+"\n"+subjectLabel+(d.subject||"")+"\n"+student+"\n\n"+body;}return heading+"\n"+body;}
function show(type,data={}){current=type;$("editor").hidden=false;$("editorTitle").textContent=specs[type].title;$("editorHelp").textContent=specs[type].help;$("fields").replaceChildren();$("result").hidden=true;$("toast").textContent="";$("actions").hidden=type==="library";$("savedList").replaceChildren();
if(type==="worksheet"){const languageLabel=document.createElement("label");languageLabel.htmlFor="editorLanguage";languageLabel.textContent="Materialets språk";const languageSelect=document.createElement("select");languageSelect.id="editorLanguage";for(const [value,label] of [["sv","Svenska"],["sq","Albanska – Shqip"],["en","Engelska – English"]]){const option=document.createElement("option");option.value=value;option.textContent=label;languageSelect.append(option);}languageSelect.value=materialLanguage(data);$("fields").append(languageLabel,languageSelect);}
for(const [id,label,kind] of specs[type].fields){const l=document.createElement("label");l.htmlFor=id;l.textContent=label;const el=document.createElement(kind==="textarea"?"textarea":"input");el.id=id;if(kind!=="textarea")el.type="text";el.value=data[id]||"";$("fields").append(l,el);}
if(type==="library")showSaved();
$("editor").scrollIntoView({behavior:"smooth",block:"start"});}
function preview(){if(!current||current==="library")return;const d=inputValues();$("result").textContent=render(current,d);$("result").hidden=false;}
async function showSaved(){const list=$("savedList");list.replaceChildren();let items=load();if(cloudReady){const {data,error}=await cloud.from("teacher_materials").select("id,type,title,content,shared,created_at,owner_id").eq("owner_id",ownerKey).order("created_at",{ascending:false}).limit(150);if(!error)items=(data||[]).filter(x=>x.owner_id===ownerKey).map(x=>({id:x.id,type:x.type,data:x.content,created:x.created_at,shared:x.shared,remote:true}));else{$("toast").textContent="Molnlagring kunde inte läsas. Visar lokalt material.";}}if(!items.length){list.textContent="Inget sparat material ännu.";return;}const heading=document.createElement("h3");heading.textContent="Sparade material";list.append(heading);for(const item of items){if(!specs[item.type]||item.type==="library")continue;const row=document.createElement("div");row.className="saved-item";const name=document.createElement("span");name.textContent=(item.data.title||specs[item.type].title)+" · "+new Date(item.created).toLocaleDateString("sv-SE");const actions=document.createElement("div");const open=document.createElement("button");open.textContent="Öppna";open.onclick=()=>{show(item.type,item.data);preview();};const del=document.createElement("button");del.className="secondary";del.textContent="Ta bort";del.onclick=async()=>{if(!confirm("Ta bort detta sparade material?"))return;if(item.remote){const {error}=await cloud.from("teacher_materials").delete().eq("id",item.id).eq("owner_id",ownerKey);if(error){$("toast").textContent=error.message;return;}}else store(load().filter(x=>x.id!==item.id));showSaved();};if(item.remote){const share=document.createElement("button");share.className="secondary";share.textContent=item.shared?"Sluta dela":"Dela med lärare";share.onclick=async()=>{if(!item.shared&&!confirm("Vill du dela detta material med alla godkända lärare på Lärarverktyget? Dela aldrig elevuppgifter."))return;const {error}=await cloud.from("teacher_materials").update({shared:!item.shared,updated_at:new Date().toISOString()}).eq("id",item.id).eq("owner_id",ownerKey);if(error){$("toast").textContent=error.message;return;}$("toast").textContent=item.shared?"Delningen är avstängd.":"Materialet är nu delat med godkända lärare.";showSaved();};actions.append(share);}actions.append(open,del);row.append(name,actions);list.append(row);}}
function setupSmartGenerator(){
 const card=document.createElement("article");card.className="tool";card.dataset.key="smart generator materialgenerator skapa arbetsblad quiz lektionsupplägg";
 card.innerHTML='<h2>Smart materialgenerator</h2><p>Välj ämne, årskurs, mål och materialtyp. Få ett redigerbart förslag utan att skriva allt från början.</p><button type="button" id="openGenerator">Skapa material</button>';
 $("tools").prepend(card);
 const section=document.createElement("section");section.className="editor";section.id="generator";section.hidden=true;
 section.innerHTML='<h2>Smart materialgenerator</h2><p class="note">Förslagen bygger på färdiga pedagogiska mallar, inte AI. Kontrollera alltid att materialet passar eleverna och kursplanen.</p><div class="material-filters"><label>Ämne<input id="genSubject" placeholder="Exempel: Musik" maxlength="90" list="genSubjects"><datalist id="genSubjects"><option value="Musik"><option value="Svenska"><option value="Matematik"><option value="Engelska"><option value="NO"><option value="SO"><option value="Bild"><option value="Modersmål – albanska"><option value="Modersmål"></datalist></label><label>Årskurs<select id="genGrade"><option value="">Välj årskurs</option></select></label><label>Materialtyp<select id="genType"><option value="worksheet">Arbetsblad</option><option value="quiz">Quiz</option><option value="lesson">Lektionsupplägg</option><option value="exit">Exit ticket</option><option value="support">Extra anpassningar</option></select></label></div><label for="genLanguage">Materialets språk</label><select id="genLanguage"><option value="sv" selected>Svenska (standard)</option><option value="sq">Albanska – Shqip</option><option value="en">Engelska – English</option><option value="other">Annat språk (egen anpassning)</option></select><label id="genOtherLanguageLabel" for="genOtherLanguage" hidden>Ange språk<input id="genOtherLanguage" placeholder="Exempel: arabiska"></label><label for="genFocus">Uppgiftens inriktning</label><select id="genFocus"><option value="auto">Automatisk ämnesanpassning</option><option value="reading">Läsförståelse och litteratur</option><option value="language">Ordförråd och skrivande</option><option value="math">Matematiska resonemang</option><option value="science">Undersökning och förklaring</option><option value="music">Musik och praktisk övning</option></select><label for="genTopic">Arbetsområde / innehåll</label><input id="genTopic" maxlength="160" placeholder="Exempel: Rytm och puls"><label for="genGoal">Undervisningsmål</label><textarea id="genGoal" placeholder="Exempel: Eleverna ska kunna hålla en gemensam puls och beskriva skillnaden mellan puls och rytm."></textarea><div class="actions"><button id="generateSmart" type="button">Skapa förslag</button><button id="closeGenerator" type="button" class="secondary">Stäng</button></div><p class="note" id="generatorStatus" role="status"></p>';
 $("editor").before(section);
 for(let i=1;i<=9;i++){const opt=document.createElement("option");opt.value=String(i);opt.textContent="Åk "+i;$("genGrade").append(opt);}
 $("genLanguage").onchange=()=>{$("genOtherLanguageLabel").hidden=$("genLanguage").value!=="other";};
 $("openGenerator").onclick=()=>{$("generator").hidden=false;$("generatorStatus").textContent="Fyll i de fyra uppgifterna och klicka på Skapa förslag."; $("generator").scrollIntoView({behavior:"smooth",block:"start"});};
 $("closeGenerator").onclick=()=>{$("generator").hidden=true;};
 $("generateSmart").onclick=()=>{
  const subject=$("genSubject").value.trim(),grade=$("genGrade").value,topic=$("genTopic").value.trim(),goal=$("genGoal").value.trim(),type=$("genType").value;
  if(!subject||!grade||!topic||!goal){const missing=[["genSubject",subject,"ämne"],["genGrade",grade,"årskurs"],["genTopic",topic,"arbetsområde"],["genGoal",goal,"undervisningsmål"]].find(x=>!x[1]);$("generatorStatus").textContent="Fyll i "+missing[2]+" för att skapa materialet.";$(missing[0]).focus();return;}
  const context=subject+" Åk "+grade,title=topic+" – "+specs[type].title;
  const data={title,subject:context,goal};
  if(type==="worksheet"){data.instructions="Läs uppgifterna om "+topic+". Använd exempel från lektionen och motivera dina svar. Mål: "+goal;data.questions=["Beskriv med egna ord vad "+topic+" innebär.","Ge ett exempel på "+topic+" från undervisningen.","Förklara hur ditt exempel hänger ihop med lektionens mål.","Jämför två exempel inom "+topic+". Vad är lika och olika?","Vad vill du lära dig mer om inom "+topic+"?"].join("\n");}
  if(type==="quiz"){data.questions=["Vad betyder ett viktigt begrepp inom "+topic+"? | [Skriv korrekt svar]","Ge ett exempel på "+topic+". | [Skriv exempel]","Hur hänger "+topic+" ihop med undervisningsmålet? | [Skriv bedömningsstöd]","Vilket påstående om "+topic+" är korrekt? | [Skriv korrekt svar]"].join("\n");}
  if(type==="lesson"){data.steps=["Start (5 min): presentera målet och koppla till elevernas tidigare kunskaper.","Genomgång (10 min): visa och förklara ett konkret exempel på "+topic+".","Gemensam övning (10 min): pröva exemplet med lärarstöd och återkoppling.","Eget eller parvis arbete (15 min): tillämpa "+topic+" med stöd vid behov.","Avslut (5 min): låt eleverna visa vad de lärt sig och besvara en exit ticket."].join("\n");data.assessment="Samla in korta elevsvar och observera arbetet. Jämför med målet: "+goal;}
  if(type==="support"){data.steps=["Läs målet: "+goal,"Titta på lärarens exempel om "+topic+".","Gör den första delen tillsammans med en kamrat eller lärare.","Fortsätt stegvis med en del i taget.","Kontrollera ditt arbete mot målet."].join("\n");data.words=["Begrepp 1 – skriv en enkel förklaring","Begrepp 2 – skriv ett exempel"].join("\n");}
  const lang=$("genLanguage").value;
  const other=$("genOtherLanguage").value.trim();
  if(lang==="other"&&!other){$("generatorStatus").textContent="Ange önskat språk."; $("genOtherLanguage").focus();return;}
  data.language=lang;
  if(lang==="sq"){
    if(type==="worksheet"){data.instructions="Tema: "+topic+". Qëllimi: të mësojmë dhe të përdorim fjalë e fjali në gjuhën shqipe për këtë temë.";data.questions=["Shpjego me fjalët e tua temën: "+topic+".","Shkruaj pesë fjalë të reja që lidhen me temën.","Formo tri fjali në gjuhën shqipe.","Shkruaj një paragraf të shkurtër për temën.","Çfarë mësove sot?"].join("\n");}
    if(type==="quiz")data.questions=["Çfarë do të thotë një fjalë nga tema "+topic+"? | [Shkruaj përgjigjen]","Shkruaj një fjali për temën. | [Shembull përgjigjeje]","Cilat tri fjalë lidhen me temën? | [Shkruaj fjalët]"].join("\n");
    if(type==="lesson"){data.steps=["Hyrje (5 min): prezanto temën "+topic+".","Shpjegim (10 min): jep shembuj dhe fjalët kryesore.","Ushtrim i përbashkët (10 min): punoni me mbështetjen e mësuesit.","Punë individuale (15 min): lexim, të folur ose shkrim.","Përmbyllje (5 min): çfarë mësuam?"].join("\n");data.assessment="Vlerëso përgjigjet dhe pjesëmarrjen sipas qëllimit: "+goal;}
    if(type==="support"){data.steps=["Lexo qëllimin: "+goal,"Shiko shembullin e mësuesit.","Puno hap pas hapi.","Kërko ndihmë kur të duhet.","Kontrollo punën tënde."].join("\n");data.words="Fjala 1 – shpjegimi\nFjala 2 – shembulli";}
  }else if(lang==="en"){
    if(type==="worksheet"){data.instructions="Work on the topic "+topic+". Goal: "+goal;data.questions=["Explain "+topic+" in your own words.","Give an example related to "+topic+".","Write three key words and use them in sentences.","Compare two examples.","What would you like to learn next?"].join("\n");}
    if(type==="quiz")data.questions=["What is a key concept related to "+topic+"? | [Add answer]","Give an example of "+topic+". | [Add example]","How does this connect to the goal? | [Add answer]"].join("\n");
    if(type==="lesson"){data.steps=["Introduction (5 min): share the goal.","Explanation (10 min): model an example of "+topic+".","Guided practice (10 min): work together.","Independent practice (15 min): apply the learning.","Reflection (5 min): check understanding."].join("\n");data.assessment="Review pupils' responses in relation to the goal: "+goal;}
    if(type==="support"){data.steps=["Read the goal: "+goal,"Look at the teacher's example.","Complete one step at a time.","Ask for help if needed.","Check your work."].join("\n");data.words="Word 1 – explanation\nWord 2 – example";}
  }else if(lang==="sv"&&/modersmål/i.test(subject)){
    if(type==="worksheet")data.questions=["Skriv fem ord på ditt modersmål om "+topic+".","Översätt orden till svenska och jämför.","Skriv tre meningar på modersmålet.","Läs dina meningar högt.","Skriv en kort text på modersmålet."].join("\n");
    if(type==="lesson")data.steps=["Start (5 min): samtala om "+topic+" på modersmålet.","Ordförråd (10 min): jämför ord på modersmålet och svenska.","Gemensam övning (10 min): läs eller samtala.","Eget arbete (15 min): skriv eller tala om "+topic+".","Avslut (5 min): sammanfatta nya ord."].join("\n");
  }
  if(lang==="other"){
    if(type==="worksheet")data.instructions+="\nÖversätt och anpassa till "+other+".";
    if(type==="quiz")data.questions+="\n[Översätt frågorna och facit till "+other+".]";
    if(type==="lesson")data.steps+="\nAnpassa instruktioner och exempel till "+other+".";
    if(type==="support")data.steps+="\nÖversätt och anpassa till "+other+".";
  }
  const focusChoice=$("genFocus").value;
  const normalized=subject.toLocaleLowerCase("sv");
  const focus=focusChoice!=="auto"?focusChoice:/modersmål|svenska|engelska/.test(normalized)?"reading":/matematik/.test(normalized)?"math":/\b(no|biologi|fysik|kemi|teknik)\b/.test(normalized)?"science":/musik/.test(normalized)?"music":"language";
  const younger=Number(grade)<=3;
  const isLiterature=/peter pan|piter pan|pani|saga|berättelse|roman|novell|bok|litteratur|tregim|përrall|libër/i.test(topic);
  if(type==="worksheet"||type==="quiz"){
    const questionSets={
      reading:{
        sv:isLiterature?["Vem är huvudpersonen i "+topic+"? Beskriv personen med stöd i texten.","Var och när utspelar sig berättelsen? Ge exempel ur texten.","Vilket problem eller vilken konflikt möter huvudpersonen?","Välj en viktig händelse och förklara varför den är betydelsefull.","Vad tror du att berättelsen vill förmedla? Motivera med texten."]:["Vad handlar texten om? Sammanfatta med egna ord.","Vilka personer eller viktiga begrepp förekommer i texten?","Hitta en viktig detalj och ange var i texten du fann den.","Vad kan du dra för slutsats av det du läst? Motivera.","Vilken fråga skulle du vilja ställa om texten?"],
        sq:isLiterature?["Kush është personazhi kryesor në "+topic+"? Përshkruaje sipas tekstit.","Ku zhvillohet ngjarja? Gjej një shembull në tekst.","Me çfarë problemi përballet personazhi kryesor?","Përshkruaj një ngjarje të rëndësishme dhe shpjego pse është e rëndësishme.","Çfarë mesazhi përcjell tregimi? Mbështete përgjigjen në tekst."]:["Për çfarë flet teksti? Përmblidhe me fjalët e tua.","Cilët janë personazhet ose idetë kryesore?","Gjej një hollësi të rëndësishme në tekst.","Çfarë përfundimi nxjerr nga leximi? Shpjego.","Çfarë pyetjeje do t'i bëje autorit?"],
        en:["What is the text mainly about?","Who are the main characters or key ideas?","Find a detail in the text that supports your answer.","What can you infer from the text? Explain.","What question would you ask about the text?"]
      },
      language:{
        sv:["Skriv fem viktiga ord om "+topic+" och förklara dem.","Använd tre av orden i egna meningar.","Jämför två ord eller uttryck och förklara skillnaden.","Skriv en kort sammanhängande text om "+topic+".","Läs igenom och förbättra en mening i din text."],
        sq:["Shkruaj pesë fjalë të rëndësishme për "+topic+" dhe shpjegoji.","Përdor tri fjalë në fjali të plota.","Krahaso dy fjalë ose shprehje.","Shkruaj një tekst të shkurtër për "+topic+".","Rilexo tekstin dhe përmirëso një fjali."],
        en:["Write five key words about "+topic+" and explain them.","Use three words in full sentences.","Compare two words or expressions.","Write a short text about "+topic+".","Reread and improve one sentence."]
      },
      math:{
        sv:["Beskriv ett matematiskt problem som hör till "+topic+".","Visa hur du löser problemet steg för steg.","Förklara varför din metod fungerar.","Lös problemet på ett annat sätt eller kontrollera svaret.","Skapa ett eget liknande problem och lös det."],
        sq:["Shkruaj një problem matematikor për "+topic+".","Trego zgjidhjen hap pas hapi.","Shpjego pse funksionon metoda jote.","Kontrollo përgjigjen me një mënyrë tjetër.","Krijo një problem të ngjashëm dhe zgjidhe."],
        en:["Write a maths problem about "+topic+".","Show your solution step by step.","Explain why your method works.","Check your answer in another way.","Create and solve a similar problem."]
      },
      science:{
        sv:["Vilken fråga vill du undersöka om "+topic+"?","Vad tror du kommer att hända? Motivera din förutsägelse.","Beskriv hur du skulle undersöka frågan på ett säkert sätt.","Vilka observationer eller resultat behöver du samla in?","Vilken slutsats kan du dra, och vad är fortfarande osäkert?"],
        sq:["Çfarë dëshiron të hulumtosh për "+topic+"?","Çfarë mendon se do të ndodhë? Shpjego.","Si do ta bëje hulumtimin në mënyrë të sigurt?","Çfarë vëzhgimesh ose të dhënash do të mblidhje?","Çfarë përfundimi mund të nxjerrësh?"],
        en:["What question would you investigate about "+topic+"?","What do you predict and why?","How would you investigate safely?","What observations would you collect?","What conclusion could you draw?"]
      },
      music:{
        sv:["Beskriv ett musikaliskt begrepp som hör till "+topic+".","Hur kan du visa begreppet genom att sjunga, spela eller lyssna?","Öva ett kort exempel och beskriv vad du behöver tänka på.","Jämför två musikaliska exempel och beskriv skillnaden.","Vad fungerade bra i din övning, och vad vill du utveckla?"],
        sq:["Shpjego një nocion muzikor që lidhet me "+topic+".","Si mund ta tregosh duke kënduar, luajtur ose dëgjuar?","Ushtro një shembull dhe përshkruaj vështirësitë.","Krahaso dy shembuj muzikorë.","Çfarë mësove dhe çfarë dëshiron të përmirësosh?"],
        en:["Describe a musical concept related to "+topic+".","How can you demonstrate it by playing, singing or listening?","Practise a short example and describe what matters.","Compare two musical examples.","What went well and what would you improve?"]
      }
    };
    const languageKey=["sq","en"].includes(lang)?lang:"sv";
    let qs=questionSets[focus][languageKey].slice();
    if(younger)qs=qs.slice(0,4);
    if(type==="worksheet"){
      data.questions=qs.join("\n");
      data.instructions=lang==="sq"?"Lexo tekstin ose materialin për temën "+topic+" dhe përgjigju pyetjeve. Përdor shembuj nga materiali.":lang==="en"?"Read or explore the material about "+topic+" and answer the questions. Use examples.":"Arbeta med "+topic+". Besvara frågorna och använd exempel från texten eller undervisningen.";
    }else{
      data.questions=qs.map(q=>q+" | ["+(lang==="sq"?"Plotëso përgjigjen sipas materialit":lang==="en"?"Add answer based on the source":"Fyll i svar utifrån underlaget")+"]").join("\n");
    }
  }
  if(type==="lesson"&&focus==="reading"){
    data.steps=(lang==="sq"?["Hyrje (5 min): prezanto tekstin dhe qëllimin.","Lexim i përbashkët (10 min): lexo dhe sqaro fjalët e reja.","Bisedë (10 min): diskuto personazhet, ngjarjet dhe shembujt nga teksti.","Punë individuale (15 min): përgjigju pyetjeve të leximit.","Përmbyllje (5 min): përmblidh tekstin me fjalët e tua."]:lang==="en"?["Introduction (5 min): introduce the text and goal.","Shared reading (10 min): clarify key words.","Discussion (10 min): explore characters and evidence.","Independent work (15 min): answer reading questions.","Reflection (5 min): summarise the text."]:["Start (5 min): presentera texten och målet.","Gemensam läsning (10 min): förklara viktiga ord.","Samtal (10 min): diskutera personer, händelser och textbelägg.","Eget arbete (15 min): besvara läsförståelsefrågor.","Avslut (5 min): sammanfatta texten."]).join("\n");
  }
  $("generatorStatus").textContent="Förslaget är skapat. Granska och redigera det innan du sparar.";
  try{show(type,data);preview();$("generator").hidden=true;$("toast").textContent="Materialet är skapat och visas nedan. Du kan redigera fälten, uppdatera förhandsvisningen och sedan spara i dina mallar.";}catch(error){$("generatorStatus").textContent="Det gick inte att skapa materialet: "+error.message;}
 };
}
setupSmartGenerator();
document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>show(b.dataset.open));
$("toolSearch").oninput=()=>{const q=$("toolSearch").value.toLowerCase().trim();document.querySelectorAll(".tool").forEach(t=>t.hidden=!!q&&!t.textContent.toLowerCase().includes(q)&&!t.dataset.key.includes(q));};
$("generate").onclick=preview;
$("save").onclick=async()=>{if(!current||current==="library")return;const data=inputValues();if(cloudReady){const {error}=await cloud.from("teacher_materials").insert({owner_id:ownerKey,type:current,title:data.title||specs[current].title,content:data});if(!error){$("toast").textContent="Sparat i ditt konto i molnet.";preview();return;}$("toast").textContent="Molnlagring misslyckades: "+error.message+" Sparar lokalt i stället.";}const items=load();items.unshift({id:Date.now()+"-"+Math.random().toString(36).slice(2),type:current,data,created:new Date().toISOString()});if(store(items)){if(!cloudReady)$("toast").textContent="Sparat lokalt. Molnlagring kräver databasinstallation.";preview();}};
$("print").onclick=()=>{preview();const old=document.title;document.title=(inputValues().title||"Lärarverktyget").replace(/[\\/:*?"<>|]/g,"-");window.print();document.title=old;};
$("close").onclick=()=>{$("editor").hidden=true;current=null;};
(async()=>{try{const client=await getMusikportalenSupabase();const {data:{user}}=await client.auth.getUser();if(!user){location.replace("login.html");return;}const {data:profile,error}=await client.from("portal_users").select("role").eq("id",user.id).single();if(error||!["teacher","admin"].includes(profile?.role)){$("authStatus").textContent="Du behöver godkänd lärarbehörighet för att använda verktygen.";return;}ownerKey=user.id;cloud=client;const {error:tableError}=await client.from("teacher_materials").select("id").limit(1);cloudReady=!tableError;$("authStatus").hidden=true;$("app").hidden=false;if(cloudReady){const article=document.createElement("article");article.className="tool";article.dataset.key="delade mallar materialbank kollegor";article.innerHTML='<h2>Delade lärarmaterial</h2><p>Hitta material som andra lärare valt att dela.</p><button id="sharedOpen">Öppna materialbanken</button>';document.getElementById("tools").append(article);document.getElementById("sharedOpen").onclick=showShared;}else{$("authStatus").hidden=false;$("authStatus").textContent="Molnlagring är ännu inte aktiverad. Material sparas lokalt tills databasinstallationen är klar.";}}catch(e){$("authStatus").textContent="Kunde inte kontrollera inloggningen. Försök igen senare.";}})();

async function showShared(){
 if(!cloudReady)return;
 current="library";$("editor").hidden=false;$("editorTitle").textContent="Delade lärarmaterial";
 $("editorHelp").textContent="Sök bland material som lärare valt att dela. Ämne och årskurs hämtas från materialets beskrivning.";
 $("fields").replaceChildren();$("actions").hidden=true;$("result").hidden=true;$("savedList").replaceChildren();
 const {data,error}=await cloud.from("teacher_materials").select("id,type,title,content,created_at").eq("shared",true).order("created_at",{ascending:false}).limit(500);
 if(error){$("savedList").textContent="Kunde inte läsa materialbanken: "+error.message;return;}
 const items=(data||[]).filter(x=>specs[x.type]);
 const filters=document.createElement("div");filters.className="material-filters";
 const search=document.createElement("input");search.type="search";search.placeholder="Sök titel, ämne eller innehåll";search.setAttribute("aria-label","Sök material");
 const subject=document.createElement("select");subject.setAttribute("aria-label","Filtrera efter ämne");
 const grade=document.createElement("select");grade.setAttribute("aria-label","Filtrera efter årskurs");
 const type=document.createElement("select");type.setAttribute("aria-label","Filtrera efter materialtyp");
 const addOptions=(el,all,values)=>{for(const [value,label] of [[ "",all],...values.map(v=>[v,v])]){const option=document.createElement("option");option.value=value;option.textContent=label;el.append(option);}};
 const subjectOf=x=>String(x.content?.subject||"").replace(/\\b(?:åk|årskurs)\\s*[0-9]+\\b/ig,"").trim().replace(/[-–,]+$/,"").trim();
 const gradeOf=x=>{const m=String(x.content?.subject||"").match(/(?:åk|årskurs)\\s*([0-9]+)/i);return m?"Åk "+m[1]:"";};
 addOptions(subject,"Alla ämnen",[...new Set(items.map(subjectOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"sv")));
 addOptions(grade,"Alla årskurser",[...new Set(items.map(gradeOf).filter(Boolean))].sort((a,b)=>Number(a.replace(/\\D/g,""))-Number(b.replace(/\\D/g,""))));
 for(const [value,label] of [["","Alla materialtyper"],...Object.entries(specs).filter(([key])=>key!=="library").map(([key,spec])=>[key,spec.title])]){const option=document.createElement("option");option.value=value;option.textContent=label;type.append(option);}
 filters.append(search,subject,grade,type);$("fields").append(filters);
 const count=document.createElement("p");count.className="note";$("savedList").append(count);
 const results=document.createElement("div");$("savedList").append(results);
 const renderItems=()=>{results.replaceChildren();const q=search.value.trim().toLocaleLowerCase("sv");const matching=items.filter(item=>(!subject.value||subjectOf(item)===subject.value)&&(!grade.value||gradeOf(item)===grade.value)&&(!type.value||item.type===type.value)&&(!q||[item.title,item.content?.subject,...Object.values(item.content||{})].join(" ").toLocaleLowerCase("sv").includes(q)));
 count.textContent=matching.length+" av "+items.length+" delade material";
 if(!matching.length){const empty=document.createElement("p");empty.textContent="Inga material matchar din sökning.";results.append(empty);}
 for(const item of matching){const row=document.createElement("div");row.className="saved-item";const label=document.createElement("span");label.textContent=[item.title,specs[item.type].title,item.content?.subject].filter(Boolean).join(" · ");const open=document.createElement("button");open.textContent="Använd som egen mall";open.onclick=()=>{show(item.type,item.content||{});preview();};row.append(label,open);results.append(row);}
 };
 for(const el of [search,subject,grade,type])el.addEventListener(el===search?"input":"change",renderItems);
 renderItems();$("editor").scrollIntoView({behavior:"smooth"});
}
