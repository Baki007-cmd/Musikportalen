"use strict";
(()=>{
const languages={sv:"Svenska",en:"English",sq:"Shqip"};
const dict={
"Logga in":{en:"Log in",sq:"Hyr"},
"Registrera dig":{en:"Register",sq:"Regjistrohu"},
"Startsida":{en:"Home",sq:"Ballina"},
"Välkommen till Lärarverktyget":{en:"Welcome to Teacher Tools",sq:"Mirë se vini në Mjetet e Mësuesit"},
"Vad är Lärarverktyget?":{en:"What is Teacher Tools?",sq:"Çfarë janë Mjetet e Mësuesit?"},
"För vem är Lärarverktyget?":{en:"Who is Teacher Tools for?",sq:"Për kë janë Mjetet e Mësuesit?"},
"Digitala verktyg för grundskolans lärare":{en:"Digital tools for school teachers",sq:"Mjete digjitale për mësuesit"},
"Inloggning för lärare":{en:"Teacher login",sq:"Hyrja për mësuesit"},
"Skapa konto":{en:"Create account",sq:"Krijo llogari"},
"E-postadress":{en:"Email address",sq:"Adresa e emailit"},
"Lösenord":{en:"Password",sq:"Fjalëkalimi"},
"Upprepa lösenordet":{en:"Repeat password",sq:"Përsërit fjalëkalimin"},
"Skicka återställningslänk":{en:"Send reset link",sq:"Dërgo lidhjen e rivendosjes"},
"Musik":{en:"Music",sq:"Muzikë"},
"Mina sparade quiz":{en:"My saved quizzes",sq:"Kuizet e mia të ruajtura"},
"Spara quiz med frågor":{en:"Save quiz with questions",sq:"Ruaj kuizin me pyetje"},
"Skapa nytt quiz":{en:"Create new quiz",sq:"Krijo kuiz të ri"},
"Uppdatera listan":{en:"Refresh list",sq:"Përditëso listën"},
"Skapa spel och visa kod":{en:"Create game and show code",sq:"Krijo lojën dhe shfaq kodin"},
"Skapa frågor med AI":{en:"Create questions with AI",sq:"Krijo pyetje me AI"},
"Generera frågor med AI":{en:"Generate questions with AI",sq:"Gjenero pyetje me AI"},
"Arbetsområde":{en:"Topic",sq:"Tema"},
"Antal frågor":{en:"Number of questions",sq:"Numri i pyetjeve"},
"Lägg till fråga":{en:"Add question",sq:"Shto pyetje"},
"Fråga":{en:"Question",sq:"Pyetja"},
"Rätt svar":{en:"Correct answer",sq:"Përgjigjja e saktë"},
"Gå med":{en:"Join",sq:"Bashkohu"},
"Gå med i ett quiz":{en:"Join a quiz",sq:"Bashkohu në kuiz"},
"Spelkod":{en:"Game code",sq:"Kodi i lojës"},
"Smeknamn":{en:"Nickname",sq:"Pseudonimi"},
"Väntar på läraren …":{en:"Waiting for teacher …",sq:"Në pritje të mësuesit …"},
"Starta första frågan":{en:"Start first question",sq:"Fillo pyetjen e parë"},
"Avsluta och visa resultat":{en:"Finish and show results",sq:"Përfundo dhe shfaq rezultatet"},
"Ladda ner QR-kod":{en:"Download QR code",sq:"Shkarko kodin QR"},
"Mitt konto":{en:"My account",sq:"Llogaria ime"},
"Språk":{en:"Language",sq:"Gjuha"},
"Välj språk":{en:"Choose language",sq:"Zgjidh gjuhën"},
"Spara språk":{en:"Save language",sq:"Ruaj gjuhën"}
};
const key="musikportalen-language";
const getLang=()=>{try{return languages[localStorage.getItem(key)]?localStorage.getItem(key):"sv"}catch{return "sv"}};
let lang=getLang();
const originals=new WeakMap();
function translate(){
 document.documentElement.lang=lang;
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 let n;while(n=walker.nextNode()){
  if(!n.parentElement||n.parentElement.closest("script,style,textarea,option,#questionList,#hostQuestion,#quizResults,#studentAnswers,#savedQuizList"))continue;
  const initial=originals.get(n)??n.nodeValue;const trimmed=initial.trim();
  if(!dict[trimmed])continue;
  originals.set(n,initial);
  const output=lang==="sv"?trimmed:dict[trimmed][lang]||trimmed;
  n.nodeValue=initial.replace(trimmed,output);
 }
}
async function save(value){
 lang=value;try{localStorage.setItem(key,value)}catch{}
 translate();
 const status=document.getElementById("languageStatus");
 if(status)status.textContent=value==="sv"?"Språket är sparat.":value==="en"?"Language saved.":"Gjuha u ruajt.";
 if(typeof window.getMusikportalenSupabase==="function"){
  try{const client=await window.getMusikportalenSupabase();const {data:{user}}=await client.auth.getUser();
   if(user){const {error}=await client.auth.updateUser({data:{preferred_language:value}});if(error)throw error}
  }catch(e){if(status)status.textContent+=" (Lokalt på denna enhet.)"}
 }
}
async function loadAccount(){
 if(typeof window.getMusikportalenSupabase!=="function")return;
 try{const client=await window.getMusikportalenSupabase();const {data:{user}}=await client.auth.getUser();
  const saved=user?.user_metadata?.preferred_language;
  if(languages[saved]){lang=saved;localStorage.setItem(key,saved);translate();const selector=document.getElementById("languageSelect");if(selector)selector.value=saved}
 }catch{}
}
function mount(){
 translate();
 loadAccount();
 if(location.pathname.endsWith("/mitt-konto.html"))return;
 if(typeof window.getMusikportalenSupabase!=="function")return;
 window.getMusikportalenSupabase().then(async client=>{
  const {data:{user}}=await client.auth.getUser();
  if(!user||document.getElementById("myAccountLanguageLink"))return;
  const header=document.querySelector("header .top")||document.querySelector("header");
  if(!header)return;
  const link=document.createElement("a");link.id="myAccountLanguageLink";link.href="mitt-konto.html";
  link.textContent="⚙ Mitt konto";link.style.cssText="color:white;font-weight:600;margin-left:12px";
  header.append(link);
 }).catch(()=>{});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
