'use strict';

// APG Header Navigation ARIA Normalisation v118.1
// Narrow post-transform accessibility remediation for Header Navigation v118.0.
// The original Products trigger can arrive with legacy aria-controls/aria-expanded state;
// v118.0 replaces its behaviour with the All drawer. This layer guarantees exactly one
// canonical relationship to #apgAllDrawer without changing navigation, search or decision logic.
const VERSION='118.1';

function normalise(html){
  let out=String(html||'');
  if(!out.includes('data-apg-drawer-trigger'))return out;
  out=out.replace(/<button\b([^>]*\bdata-apg-drawer-trigger\b[^>]*)>/i,(match,attrs)=>{
    let clean=String(attrs||'')
      .replace(/\sdata-apg-drawer-trigger(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi,'')
      .replace(/\saria-controls=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'')
      .replace(/\saria-expanded=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'')
      .replace(/\s{2,}/g,' ')
      .trimEnd();
    return `<button${clean?' '+clean.trimStart():''} data-apg-drawer-trigger aria-controls="apgAllDrawer" aria-expanded="false">`;
  });
  return out;
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Header ARIA normalisation requires downstream handler');
  function handler(req,res){
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=normalise(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Header-ARIA-Normalisation','v'+VERSION);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{HEADER_ARIA_NORMALISATION_VERSION:VERSION});
  return handler;
}

module.exports={VERSION,normalise,wrap};
