"use strict";
let client,user;
const account=document.getElementById("account"),content=document.getElementById("content"),message=document.getElementById("message"),form=document.getElementById("passwordForm"),save=document.getElementById("save");
(async()=>{try{client=await getMusikportalenSupabase();const result=await client.auth.getUser();if(result.error||!result.data.user){location.replace("login.html");return;}user=result.data.user;account.textContent="Inloggad som "+user.email;
document.getElementById("infoEmail").textContent=user.email||"–";
document.getElementById("infoCreated").textContent=user.created_at?new Date(user.created_at).toLocaleDateString("sv-SE"):"–";
document.getElementById("infoVerified").textContent=user.email_confirmed_at?"Ja":"Nej";
document.getElementById("displayName").value=user.user_metadata?.full_name||"";
const {data:profile,error:profileError}=await client.from("portal_users").select("role").eq("id",user.id).single();
if(profileError)throw profileError;
const roles={pending:"Väntar på godkännande",teacher:"Lärare",student:"Elev",admin:"Administratör"};
document.getElementById("infoRole").textContent=roles[profile.role]||profile.role;
document.getElementById("infoStatus").textContent=profile.role==="pending"?"Väntar på administratörens godkännande":"Godkänd";
content.hidden=false;}catch(e){account.textContent="Kunde inte kontrollera inloggningen: "+e.message;}})();
form.addEventListener("submit",async e=>{e.preventDefault();message.className="";const current=document.getElementById("current").value,next=document.getElementById("next").value,confirm=document.getElementById("confirm").value;if(next!==confirm){message.textContent="De nya lösenorden stämmer inte överens.";message.className="error";return;}if(next===current){message.textContent="Välj ett annat lösenord än det nuvarande.";message.className="error";return;}save.disabled=true;message.textContent="Kontrollerar lösenordet…";try{const verified=await client.auth.signInWithPassword({email:user.email,password:current});if(verified.error)throw new Error("Det nuvarande lösenordet är felaktigt.");const changed=await client.auth.updateUser({password:next});if(changed.error)throw changed.error;form.reset();message.textContent="Ditt lösenord har ändrats.";message.className="success";}catch(err){message.textContent="Kunde inte ändra lösenord: "+err.message;message.className="error";}finally{save.disabled=false;}});

document.getElementById("nameForm").addEventListener("submit",async e=>{e.preventDefault();const name=document.getElementById("displayName").value.trim(),msg=document.getElementById("nameMessage"),button=document.getElementById("saveName");if(!name){msg.textContent="Ange ett namn.";msg.className="error";return;}button.disabled=true;msg.textContent="Sparar…";try{const {error}=await client.auth.updateUser({data:{full_name:name}});if(error)throw error;msg.textContent="Namnet har sparats.";msg.className="success";}catch(err){msg.textContent="Kunde inte spara namnet: "+err.message;msg.className="error";}finally{button.disabled=false;}});
