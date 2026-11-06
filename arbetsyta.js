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
  document.getElementById("adminLink").hidden=role!=="admin";
  document.getElementById("teacherTools").hidden=!["admin","teacher"].includes(role);
  document.getElementById("pendingNotice").hidden=role!=="pending";
  document.getElementById("status").hidden=true;
  document.getElementById("workspace").hidden=false;
 }catch(e){document.getElementById("status").textContent="Kunde inte kontrollera behörigheten: "+e.message+". Administratören behöver aktivera behörighetssystemet i Supabase.";}
})();
document.getElementById("logout").onclick=async()=>{if(client)await client.auth.signOut();location.replace("login.html");};