// Récupération privée en direct depuis GestionPanneauSiemens.
// La clé du panneau est utilisée pour cette requête uniquement, jamais conservée.
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Méthode non permise.'});}
 const body=typeof req.body==='string'?(()=>{try{return JSON.parse(req.body)}catch{return null}})():req.body;
 const id=body?.id,key=body?.key;
 if(typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id))return res.status(400).json({error:'UID de panneau invalide.'});
 if(typeof key!=='string'||!key||key.length>512)return res.status(400).json({error:'Clé d’accès du panneau requise.'});
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  let r;
  try{r=await fetch('https://gestion-panneau-siemens.vercel.app/api/panel-live?id='+encodeURIComponent(id)',{method:'GET',headers:{Authorization:'Bearer '+key,Accept:'application/json'},cache:'no-store',signal:controller.signal});}
  finally{clearTimeout(timer);}
  const json=await r.json().catch(()=>null);
  if(!r.ok)return res.status(r.status===401?401:502).json({error:r.status===401?'Clé d’accès incorrecte.':json?.error||'Le panneau ne répond pas.'});
  if(!json||!Array.isArray(json.circuits))return res.status(502).json({error:'Réponse de panneau invalide.'});
  return res.status(200).json(json);
 }catch{return res.status(502).json({error:'Impossible de récupérer le panneau en direct.'});}
};
