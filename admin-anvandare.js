"use strict";
const status=document.getElementById("status"),panel=document.getElementById("adminPanel"),tbody=document.getElementById("users");
const roles={pending:"Väntar på godkännande",teacher:"Lärare",student:"Elev",admin:"Administratör"};
let client,currentUser;
async function loadUsers(){
 status.textContent="Hämtar användare…";
 const {data,error}=await client.from("portal_users").select("id,email,role,created_at").order("created_at",{ascending:false});
 if(error)throw error;
 tbody.replaceChildren();
 for(const user of data||[]){
  const tr=document.createElement("tr"),email=document.createElement("td"),role=document.createElement("td"),change=document.createElement("td"),action=document.createElement("td");
  email.textContent=user.email;role.textContent=roles[user.role]||user.role;
  if(user.id===currentUser.id){change.textContent="Ditt konto";action.textContent="—";}
  else {
   const select=document.createElement("select");
   for(const [value,label] of Object.entries(roles)){const option=document.createElement("option");option.value=value;option.textContent=label;select.append(option);}
   select.value=user.role;
   const button=document.createElement("button");button.type="button";button.textContent="Spara";button.disabled=true;
   select.addEventListener("change",()=>button.disabled=select.value===user.role);
   button.addEventListener("click",async()=>{
    if(!confirm("Ändra behörighet för "+user.email+" till "+roles[select.value]+"?"))return;
    button.disabled=true;
    const {error}=await client.from("portal_users").update({role:select.value}).eq("id",user.id);
    if(error){status.textContent="Kunde inte ändra behörighet: "+error.message;button.disabled=false;return;}
    try{await loadUsers();}catch(e){status.textContent=e.message;}
   });
   change.append(select);action.append(button);
  }
  tr.append(email,role,change,action);tbody.append(tr);
 }
 status.textContent="Användarlistan är uppdaterad.";
}
(async()=>{
 try{
  client=await getMusikportalenSupabase();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user){location.replace("login.html");return;}
  currentUser=user;
  const {data:profile,error:profileError}=await client.from("portal_users").select("role").eq("id",user.id).single();
  if(profileError)throw profileError;
  if(profile.role!=="admin"){status.textContent="Du har inte administratörsbehörighet.";return;}
  panel.hidden=false;
  await loadUsers();
 }catch(e){status.textContent="Kunde inte läsa behörigheter: "+e.message+" Kontrollera att BEHORIGHETER-SUPABASE.sql har körts.";}
})();
document.getElementById("refresh").addEventListener("click",()=>loadUsers().catch(e=>status.textContent=e.message));