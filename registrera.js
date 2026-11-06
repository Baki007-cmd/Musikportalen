"use strict";
const form=document.getElementById("registerForm"),status=document.getElementById("status"),submit=document.getElementById("submit");
form.addEventListener("submit",async e=>{
 e.preventDefault();status.className="";
 const email=document.getElementById("email").value.trim(),password=document.getElementById("password").value;
 if(password!==document.getElementById("confirm").value){status.textContent="Lösenorden stämmer inte överens.";status.className="error";return;}
 submit.disabled=true;status.textContent="Skapar konto…";
 try{
  const client=await window.getMusikportalenSupabase();
  const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:new URL("login.html",location.href).href}});
  if(error)throw error;
  if(data.session){await client.auth.signOut();}
  status.textContent="Registreringen har skickats. Kontrollera din e-post för en eventuell bekräftelselänk och logga sedan in.";
  form.reset();
 }catch(err){status.textContent="Kunde inte registrera kontot: "+err.message;status.className="error";}
 finally{submit.disabled=false;}
});