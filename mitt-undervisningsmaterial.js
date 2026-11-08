"use strict";
const $=id=>document.getElementById(id);
const BUCKET="teaching-materials-private";
const allowed=new Set(["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","image/png","image/jpeg","image/webp"]);
let db,userId,items=[],editing=null;
for(let i=1;i<=9;i++){const o=document.createElement("option");o.value=String(i);o.textContent="Årskurs "+i;$("grade").append(o);}
function message(id,text){$(id).textContent=text;}
function reset(){editing=null;$("materialForm").reset();$("formHeading").textContent="Lägg till undervisningsmaterial";$("submit").textContent="Spara material";$("cancel").hidden=true;message("formStatus","");}
$("cancel").onclick=reset;
function fileInfo(file){if(!file)return null;if(file.size>15*1024*1024)throw Error("Filen får vara högst 15 MB.");if(!allowed.has(file.type))throw Error("Filtypen stöds inte. Använd PDF, Word, PowerPoint eller bild.");return file;}
async function reload(){
 message("listStatus","Hämtar material …");
 const {data,error}=await db.from("teaching_materials").select("*").eq("owner_id",userId).order("created_at",{ascending:false}).limit(500);
 if(error){message("listStatus","Kunde inte läsa material. Kontrollera att SQL-filen har körts i Supabase: "+error.message);return;}
 items=data||[];render();
}
function render(){
 const subjectFilter=$("filterSubject"),gradeFilter=$("filterGrade"),oldSubject=subjectFilter.value,oldGrade=gradeFilter.value;
 subjectFilter.replaceChildren(new Option("Alla ämnen",""));
 for(const v of [...new Set(items.map(x=>x.subject))].sort((a,b)=>a.localeCompare(b,"sv")))subjectFilter.add(new Option(v,v));
 subjectFilter.value=oldSubject;
 gradeFilter.replaceChildren(new Option("Alla årskurser",""));
 for(const v of [...new Set(items.map(x=>x.grade))].sort((a,b)=>a-b))gradeFilter.add(new Option("Åk "+v,String(v)));
 gradeFilter.value=oldGrade;
 const q=$("search").value.trim().toLocaleLowerCase("sv");
 const filtered=items.filter(x=>(!subjectFilter.value||x.subject===subjectFilter.value)&&(!gradeFilter.value||String(x.grade)===gradeFilter.value)&&(!q||[x.title,x.subject,x.topic,x.description,x.reflection].join(" ").toLocaleLowerCase("sv").includes(q)));
 message("listStatus",filtered.length+" av "+items.length+" material");
 const list=$("list");list.replaceChildren();
 if(!filtered.length){const p=document.createElement("p");p.textContent="Inga material matchar din sökning.";list.append(p);}
 for(const item of filtered){
  const article=document.createElement("article");article.className="item";
  const title=document.createElement("h3");title.textContent=item.title;
  const meta=document.createElement("p");meta.className="meta";meta.textContent=[item.subject,"Åk "+item.grade,item.topic,item.taught_on?"Genomfört "+item.taught_on:""].filter(Boolean).join(" · ");
  article.append(title,meta);
  for(const [label,value] of [["Arbetat med",item.description],["Reflektion",item.reflection]])if(value){const p=document.createElement("p");const strong=document.createElement("strong");strong.textContent=label+": ";p.append(strong,document.createTextNode(value));article.append(p);}
  const actions=document.createElement("div");actions.className="actions";
  if(item.file_path){const open=document.createElement("button");open.type="button";open.textContent="Öppna fil: "+(item.file_name||"material");open.onclick=async()=>{
    open.disabled=true;try{const {data,error}=await db.storage.from(BUCKET).createSignedUrl(item.file_path,60);if(error)throw error;window.open(data.signedUrl,"_blank","noopener,noreferrer");}catch(e){message("listStatus","Kunde inte öppna filen: "+e.message);}finally{open.disabled=false;}
   };actions.append(open);}
  const edit=document.createElement("button");edit.className="secondary";edit.textContent="Redigera";edit.onclick=()=>{editing=item;$("title").value=item.title;$("subject").value=item.subject;$("grade").value=String(item.grade);$("topic").value=item.topic;$("taughtOn").value=item.taught_on||"";$("description").value=item.description||"";$("reflection").value=item.reflection||"";$("file").value="";$("formHeading").textContent="Redigera material";$("submit").textContent="Spara ändringar";$("cancel").hidden=false;window.scrollTo({top:0,behavior:"smooth"});};actions.append(edit);
  const del=document.createElement("button");del.className="secondary";del.textContent="Ta bort";del.onclick=async()=>{
   if(!confirm("Ta bort materialet och den uppladdade filen permanent?"))return;
   del.disabled=true;try{
    const {error}=await db.from("teaching_materials").delete().eq("id",item.id).eq("owner_id",userId);if(error)throw error;
    if(item.file_path){const {error:storageError}=await db.storage.from(BUCKET).remove([item.file_path]);if(storageError)message("listStatus","Posten togs bort men filen kunde inte raderas: "+storageError.message);}
    await reload();
   }catch(e){message("listStatus","Kunde inte ta bort: "+e.message);del.disabled=false;}
  };actions.append(del);article.append(actions);list.append(article);
 }
}
for(const id of ["search","filterSubject","filterGrade"])$(id).addEventListener(id==="search"?"input":"change",render);
$("materialForm").addEventListener("submit",async e=>{
 e.preventDefault();const btn=$("submit");btn.disabled=true;message("formStatus","Sparar …");
 let newPath=null;
 try{
  const file=fileInfo($("file").files[0]);
  const payload={owner_id:userId,title:$("title").value.trim(),subject:$("subject").value.trim(),grade:Number($("grade").value),topic:$("topic").value.trim(),taught_on:$("taughtOn").value||null,description:$("description").value.trim(),reflection:$("reflection").value.trim(),updated_at:new Date().toISOString()};
  if(!payload.title||!payload.subject||!payload.topic||!payload.grade)throw Error("Fyll i rubrik, ämne, årskurs och arbetsområde.");
  if(file){newPath=userId+"/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-100);const {error}=await db.storage.from(BUCKET).upload(newPath,file,{contentType:file.type,upsert:false});if(error)throw error;payload.file_path=newPath;payload.file_name=file.name;payload.mime_type=file.type;}
  let error;
  if(editing){({error}=await db.from("teaching_materials").update(payload).eq("id",editing.id).eq("owner_id",userId));}
  else{({error}=await db.from("teaching_materials").insert(payload));}
  if(error)throw error;
  if(editing?.file_path&&newPath){const {error:removeError}=await db.storage.from(BUCKET).remove([editing.file_path]);if(removeError)message("formStatus","Sparat, men den gamla filen kunde inte raderas.");}
  reset();message("formStatus","Materialet har sparats privat i ditt konto.");await reload();
 }catch(error){if(newPath)await db.storage.from(BUCKET).remove([newPath]);message("formStatus","Kunde inte spara: "+error.message);}
 finally{btn.disabled=false;}
});
(async()=>{
 try{
  db=await getMusikportalenSupabase();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user){location.replace("login.html");return;}
  const {data:profile,error}=await db.from("portal_users").select("role").eq("id",user.id).single();
  if(error||!["teacher","admin"].includes(profile?.role))throw Error("Du behöver godkänd lärarbehörighet.");
  userId=user.id;$("auth").hidden=true;$("app").hidden=false;await reload();
 }catch(e){message("auth","Kunde inte öppna materialbanken: "+e.message);}
})();
