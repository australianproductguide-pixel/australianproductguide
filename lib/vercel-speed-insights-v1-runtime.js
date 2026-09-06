'use strict';

// APG Vercel Speed Insights runtime v1.0
// Adds Vercel's first-party Real User Monitoring script at the final HTML response boundary.
// APG account/private surfaces are excluded and metric URLs are normalised to pathname only.

const ORIGIN='https://australianproductguide.au';
const VERSION='1.0';
const SCRIPT_PATH='/_vercel/speed-insights/script.js';

function requestPath(req){
  try{return new URL(req&&req.url||'/',ORIGIN).pathname}catch{return '/'}
}
function excludedPath(pathname){
  const path=String(pathname||'/');
  return path==='/my-apg'||path==='/my-apg/'||path.startsWith('/my-apg/');
}
function addSpeedInsights(html,pathname='/'){
  const doc=String(html||'');
  if(!doc||excludedPath(pathname)||/\/_vercel\/speed-insights\/script\.js/i.test(doc))return doc;

  const snippet=`<!-- APG Vercel Speed Insights v${VERSION} -->
<script>
window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};
window.si('beforeSend',function(event){
  try{
    if(navigator.webdriver)return null;
    var url=new URL(event&&event.url?event.url:location.href,location.origin);
    if(url.pathname==='/my-apg'||url.pathname==='/my-apg/'||url.pathname.indexOf('/my-apg/')===0)return null;
    url.search='';url.hash='';
    return Object.assign({},event,{url:url.origin+url.pathname});
  }catch(_error){return event;}
});
</script>
<script defer src="${SCRIPT_PATH}"></script>`;

  if(/<\/body>/i.test(doc))return doc.replace(/<\/body>/i,`${snippet}</body>`);
  if(/<\/html>/i.test(doc))return doc.replace(/<\/html>/i,`${snippet}</html>`);
  return doc+snippet;
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Vercel Speed Insights requires downstream handler');
  function handler(req,res){
    const pathname=requestPath(req);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const method=String(req&&req.method||'GET').toUpperCase();
      const status=Number(res.statusCode||200);
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(method!=='HEAD'&&status>=200&&status<400&&type.startsWith('text/html')&&textual){
        const wasBuffer=Buffer.isBuffer(body);
        const source=wasBuffer?body.toString('utf8'):String(body);
        const next=addSpeedInsights(source,pathname);
        if(next!==source){
          body=wasBuffer?Buffer.from(next,'utf8'):next;
          try{res.removeHeader('Content-Length')}catch{}
        }
      }
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{VERCEL_SPEED_INSIGHTS_VERSION:VERSION});
  return handler;
}

module.exports={VERSION,ORIGIN,SCRIPT_PATH,requestPath,excludedPath,addSpeedInsights,wrap};
