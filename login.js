"use strict";
const status = document.getElementById("status");
const form = document.getElementById("form");
let client;
(async () => {try {client = await window.getMusikportalenSupabase(); const {data:{session}} = await client.auth.getSession(); if(session) location.replace("arbetsyta.html");}catch(e){status.textContent=e.message;status.className="error";}})();
form.addEventListener("submit",async e=>{e.preventDefault();status.textContent="Loggar in…";try{client ||= await window.getMusikportalenSupabase();const {error}=await client.auth.signInWithPassword({email:document.getElementById("email").value.trim(),password:document.getElementById("password").value});if(error)throw error;location.replace("arbetsyta.html");}catch(err){status.textContent="Inloggningen misslyckades: "+err.message;status.className="error";}});
document.getElementById("reset").addEventListener("click",async()=>{try{client ||= await window.getMusikportalenSupabase();const email=document.getElementById("email").value.trim();if(!email){status.textContent="Ange din e-postadress först.";return;}const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:new URL("aterstall-losenord.html",location.href).href});if(error)throw error;status.textContent="Om adressen finns skickas ett mejl med instruktioner.";status.className="";}catch(e){status.textContent=e.message;status.className="error";}});
