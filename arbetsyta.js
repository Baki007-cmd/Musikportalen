"use strict";
let client;
(async()=>{
 try{
  client=await getMusikportalenSupabase();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user){location.replace("login.html");return;}
  const {data:profile,error:profileError}=await client.from("portal_users").select("role").eq("id",user.id).single();
  if(profileError)throw profileError;
  const role=profile.role;
  document.getElementById("who").textContent="Inloggad som "+user.email+" · "+({admin:"Administratör",teacher:"Lärare",student:"Elev",pending:"Väntar på godkännande"}[role]||role);
  document.getElementById("adminMenuLink").hidden=role!=="admin";
  document.getElementById("teacherTools").hidden=!["admin","teacher"].includes(role);
  if(["admin","teacher"].includes(role)){document.getElementById("personalDashboard").hidden=false;loadPersonalDashboard(user.id).catch(()=>{});}
  document.getElementById("pendingNotice").hidden=role!=="pending";
  document.getElementById("status").hidden=true;
  document.getElementById("workspace").hidden=false;
 }catch(e){document.getElementById("status").textContent="Kunde inte kontrollera behörigheten: "+e.message+". Administratören behöver aktivera behörighetssystemet i Supabase.";}
})();
document.getElementById("logout").onclick=async()=>{if(client)await client.auth.signOut();location.replace("login.html");};
async function loadPersonalDashboard(userId){
 const configs=[
 {table:"lesson_plans",count:"dashPlansCount",list:"dashPlansList",url:"mina-planeringar.html",fields:"id,title,lesson_date",date:"lesson_date"},
 {table:"classroom_boards",count:"dashBoardsCount",list:"dashBoardsList",url:"klassrumstavla.html",fields:"id,title,updated_at",date:"updated_at"},
 {table:"teacher_materials",count:"dashMaterialsCount",list:"dashMaterialsList",url:"fler-lararverktyg.html",fields:"id,title,type,created_at,content",date:"created_at"}
 ];
 await Promise.all(configs.map(async config=>{
  const list=document.getElementById(config.list);
  const count=document.getElementById(config.count);
  try{
   const [recent,total]=await Promise.all([
    client.from(config.table).select(config.fields).eq("owner_id",userId).order(config.date,{ascending:false}).limit(3),
    client.from(config.table).select("id",{count:"exact",head:true}).eq("owner_id",userId)
   ]);
   if(recent.error)throw recent.error;
   if(total.error)throw total.error;
   count.textContent=String(total.count??recent.data.length);
   list.replaceChildren();
   if(!recent.data.length){const li=document.createElement("li");li.className="empty";li.textContent="Inget sparat ännu";list.append(li);}
   for(const item of recent.data){const li=document.createElement("li");const link=document.createElement("a");link.href=config.url;link.textContent=item.title||"Utan namn";li.append(link);if(item[config.date]){const small=document.createElement("div");small.className="item-label";small.textContent=new Date(item[config.date]).toLocaleDateString("sv-SE");li.append(small);}list.append(li);}
   if(config.table==="teacher_materials"){
    const {data:weeks,error:weekError}=await client.from("teacher_materials").select("title,created_at").eq("owner_id",userId).eq("type","week").order("created_at",{ascending:false}).limit(1);
    const week=!weekError&&weeks?.[0];
    document.getElementById("dashWeek").textContent=week?"Senaste veckoplanering: "+(week.title||"Utan namn"):"Öppna Min lärarvecka för att skapa eller se din veckoplanering.";
   }
  }catch(e){count.textContent="–";list.replaceChildren();const li=document.createElement("li");li.className="empty";li.textContent="Kunde inte läsa sparade uppgifter.";list.append(li);if(config.table==="teacher_materials")document.getElementById("dashWeek").textContent="Veckoplaneringen är tillfälligt otillgänglig.";}
 }));
}
