"use strict";
// Private quiz image URLs are issued only to the uploading teacher or a participant
// whose current question references the requested image. Never expose the service key.
module.exports=async function(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"Endast POST"});
 try{
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key||!secret)return res.status(503).json({error:"Privat bildåtkomst är inte konfigurerad"});
  const path=String(req.body?.path||"");
  if(!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path)||path.includes(".."))return res.status(400).json({error:"Ogiltig bild"});
  const image="quiz-image:"+path;
  const authHeader=String(req.headers.authorization||"");
  const bearer=authHeader.match(/^Bearer (.+)$/i)?.[1];
  let allowed=false;
  if(bearer){
   const headers={apikey:key,Authorization:"Bearer "+bearer};
   const userRes=await fetch(url+"/auth/v1/user",{headers});
   if(userRes.ok){
    const user=await userRes.json();
    if(path.startsWith(user.id+"/")){
     const roleRes=await fetch(url+"/rest/v1/portal_users?id=eq."+encodeURIComponent(user.id)+"&select=role",{headers});
     if(roleRes.ok&&["teacher","admin"].includes((await roleRes.json())?.[0]?.role))allowed=true;
    }
   }
  }
  if(!allowed&&typeof req.body?.studentToken==="string"&&req.body.studentToken.length<=256){
   const response=await fetch(url+"/rest/v1/rpc/classroom_quiz_action",{method:"POST",headers:{"Content-Type":"application/json",apikey:key,Authorization:"Bearer "+key},body:JSON.stringify({p_action:"student",p_data:{token:req.body.studentToken}})});
   if(response.ok){
    const state=await response.json();
    const current=state?.question?.image;
    allowed=state?.status!=="finished"&&state?.position>=0&&(current===image||current===url+"/storage/v1/object/public/classroom-quiz-images/"+path);
   }
  }
  if(!allowed)return res.status(403).json({error:"Ingen behörighet till bilden"});
  const signed=await fetch(url+"/storage/v1/object/sign/classroom-quiz-images/"+path,{method:"POST",headers:{apikey:secret,Authorization:"Bearer "+secret,"Content-Type":"application/json"},body:JSON.stringify({expiresIn:60})});
  const data=await signed.json();
  if(!signed.ok||!data.signedURL)return res.status(502).json({error:"Kunde inte öppna bilden"});
  return res.status(200).json({url:new URL(data.signedURL,url).toString()});
 }catch(e){return res.status(500).json({error:"Bildåtkomsten misslyckades"})}
};