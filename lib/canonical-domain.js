const app=require('./seo-discovery');
const CANONICAL_HOST='australianproductguide.au';
function requestHost(req){return String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim().replace(/^https?:\/\//,'').split(':')[0].toLowerCase();}
function redirectToCanonical(req,res){const host=requestHost(req);if(process.env.VERCEL_ENV!=='production'||!host||host===CANONICAL_HOST)return false;if(!host.endsWith('.vercel.app'))return false;let u;try{u=new URL(req.url,'https://'+CANONICAL_HOST);}catch{return false;}res.statusCode=308;res.setHeader('Location','https://'+CANONICAL_HOST+u.pathname+u.search);res.setHeader('Cache-Control','public, max-age=3600');res.setHeader('X-Robots-Tag','noindex');res.end();return true;}
module.exports=(req,res)=>{if(redirectToCanonical(req,res))return;return app(req,res);};
module.exports.CANONICAL_HOST=CANONICAL_HOST;
