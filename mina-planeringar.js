"use strict";
const $=id=>document.getElementById(id);
let client,user,editing=null,items=[];
const fields=["title","grade","subject","date","lgr22","goals","steps","assessment","reflection"];
const storageKey=()=> "musikportalen-local-lessons-"+user.id;
function note(s){$("message").textContent=s;}
function clear(){editing=null;$("lesson").reset();$("subject").value="Musik";}
function read(){try{return JSON.parse(localStorage.getItem(storageKey())||"[]");}catch{return [];}}
function save(){localStorage.setItem(storageKey(),JSON.stringify(items));}
function load(){items=read();const root=$("list");root.replaceChildren();if(!items.length)root.textContent="Inga planeringar ännu.";for(const item of items){const el=document.createElement("div");el.className="item";const heading=document.createElement("strong");heading.textContent=item.title+" · Åk "+item.grade;el.append(heading);const actions=document.createElement("div");actions.className="actions";const edit=document.createElement("button");edit.textContent="Öppna";edit.onclick=()=>{editing=item.id;for(const f of fields)$(f).value=item[f]||"";window.scrollTo(0,0);};const del=document.createElement("button");del.textContent="Ta bort";del.className="secondary";del.onclick=()=>{if(!confirm("Ta bort planeringen från den här webbläsaren?"))return;items=items.filter(x=>x.id!==item.id);save();note("Planeringen borttagen lokalt.");load();};actions.append(edit,del);el.append(actions);root.append(el);}}
(async()=>{try{client=await getMusikportalenSupabase();const {data:{user:u},error}=await client.auth.getUser();if(error||!u){location.replace("login.html");return;}user=u;$("protected").hidden=false;note("Inloggad som "+user.email);load();}catch(e){note("Kunde inte öppna planeringarna: "+e.message);}})();
$("lesson").onsubmit=e=>{e.preventDefault();if(!user)return;try{const row={id:editing||crypto.randomUUID()};for(const f of fields)row[f]=$(f).value;items=read();if(editing)items=items.map(x=>x.id===editing?row:x);else items.unshift(row);save();note("Planeringen sparades i den här webbläsaren.");clear();load();}catch(err){note("Kunde inte spara lokalt: "+err.message);}};
$("new").onclick=clear;
$("logout").onclick=async()=>{if(client)await client.auth.signOut();location.replace("login.html");};
