module.exports=async function(req,res){
res.setHeader("Cache-Control","no-store");
if(req.method!=="POST")return res.status(405).json({error:"Endast POST"});
try{
const key=process.env.OPENAI_API_KEY,url=process.env.SUPABASE_URL,sbKey=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!key||!url||!sbKey)return res.status(503).json({error:"AI är inte konfigurerad"});
const token=(req.headers.authorization||"").replace(/^Bearer\s+/,"");
if(!token)return res.status(401).json({error:"Logga in"});
const headers={apikey:sbKey,Authorization:"Bearer "+token};
const auth=await fetch(url+"/auth/v1/user",{headers});if(!auth.ok)return res.status(401).json({error:"Logga in igen"});
const user=await auth.json();
const role=await fetch(url+"/rest/v1/portal_users?id=eq."+encodeURIComponent(user.id)+"&select=role",{headers});
if(!role.ok||!["teacher","admin"].includes((await role.json())?.[0]?.role))return res.status(403).json({error:"Lärarbehörighet krävs"});
const subject=String(req.body?.subject||"").slice(0,80).trim(),topic=String(req.body?.topic||"").slice(0,160).trim(),grade=Number(req.body?.grade),count=Math.min(12,Math.max(1,Number(req.body?.count)||5));
if(!subject||!topic||!Number.isInteger(grade)||grade<1||grade>9)return res.status(400).json({error:"Ange ämne, årskurs och arbetsområde"});
const prompt="Skapa "+count+" korrekta och pedagogiska flervalsfrågor på svenska för ämnet "+subject+", årskurs "+grade+", arbetsområde "+topic+". Fyra korta svarsalternativ per fråga, exakt ett korrekt. Undvik tvetydigheter. Returnera ENDAST JSON med nyckeln questions: en array av objekt {text:string,answers:[string,string,string,string],correct:0|1|2|3}.";
const ai=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4.1-mini",input:prompt,max_output_tokens:3500})});
const result=await ai.json();if(!ai.ok)return res.status(502).json({error:"AI-tjänsten svarade inte"});
const output=(result.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("");
const parsed=JSON.parse(output.replace(/^\s*```(?:json)?/,"").replace(/```\s*$/,"").trim());
const questions=(Array.isArray(parsed.questions)?parsed.questions:[]).filter(q=>typeof q.text==="string"&&q.text.length>2&&Array.isArray(q.answers)&&q.answers.length===4&&q.answers.every(a=>typeof a==="string"&&a.trim())&&Number.isInteger(q.correct)&&q.correct>=0&&q.correct<=3).slice(0,count).map(q=>({text:q.text.slice(0,300),answers:q.answers.map(a=>a.slice(0,160)),correct:q.correct,seconds:30,image:""}));
if(!questions.length)return res.status(502).json({error:"AI gav inga giltiga frågor"});
return res.status(200).json({questions});
}catch(e){return res.status(500).json({error:"Kunde inte skapa frågor. Försök igen."})}
};