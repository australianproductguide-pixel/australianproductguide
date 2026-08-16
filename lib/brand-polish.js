const assistantPlatform=require('./assistant-platform');

const BRAND='Australian Product Guide';
const PROTECTED_BLOCK=/<(script|style|code|pre|textarea|noscript)\b[\s\S]*?<\/\1>/gi;
const DISPLAY_ATTR=/\b(title|aria-label|aria-description|alt|placeholder|content)=("[^"]*"|'[^']*')/gi;

function polishText(value){
  return String(value||'').replace(/\s*—\s*/g,' - ').replace(/\bAPG\b/g,BRAND);
}

function polishTag(tag){
  return tag.replace(DISPLAY_ATTR,(match,name,quoted)=>{
    const quote=quoted[0];
    const value=quoted.slice(1,-1);
    return `${name}=${quote}${polishText(value)}${quote}`;
  });
}

function polishHtml(html){
  const protectedBlocks=[];
  const badgeSafe=String(html).replace(/(<span class="apg-assistant-(?:launcher-icon|avatar)"[^>]*>)APG(<\/span>)/g,'$1AU$2');
  const tokenised=badgeSafe.replace(PROTECTED_BLOCK,block=>`\u0000APGPROTECTED${protectedBlocks.push(block)-1}\u0000`);
  const polished=tokenised.split(/(<[^>]+>)/g).map(part=>part.startsWith('<')?polishTag(part):polishText(part)).join('');
  return polished.replace(/\u0000Australian Product GuidePROTECTED(\d+)\u0000/g,(_,index)=>protectedBlocks[Number(index)]||'')
    .replace(/\u0000APGPROTECTED(\d+)\u0000/g,(_,index)=>protectedBlocks[Number(index)]||'');
}

const clientJs=`(()=>{
const BRAND='Australian Product Guide';
const SKIP=new Set(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA']);
const replaceText=value=>String(value||'').replace(/\\s*—\\s*/g,' - ').replace(/\\bAPG\\b/g,BRAND);
function polishNode(node){
  if(!node)return;
  if(node.nodeType===Node.TEXT_NODE){
    const parent=node.parentElement;
    if(!parent||SKIP.has(parent.tagName))return;
    const next=replaceText(node.nodeValue);
    if(next!==node.nodeValue)node.nodeValue=next;
    return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE&&node.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
  if(node.nodeType===Node.ELEMENT_NODE&&!SKIP.has(node.tagName)){
    ['title','aria-label','aria-description','alt','placeholder'].forEach(name=>{
      if(!node.hasAttribute(name))return;
      const current=node.getAttribute(name)||'';
      const next=replaceText(current);
      if(next!==current)node.setAttribute(name,next);
    });
  }
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
  const textNodes=[];
  while(walker.nextNode())textNodes.push(walker.currentNode);
  textNodes.forEach(polishNode);
}
function polishMeta(){
  document.querySelectorAll('meta[content]').forEach(meta=>{
    const current=meta.getAttribute('content')||'';
    const next=replaceText(current);
    if(next!==current)meta.setAttribute('content',next);
  });
  document.title=replaceText(document.title);
}
polishNode(document.body);
polishMeta();
const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(polishNode)));
observer.observe(document.body,{childList:true,subtree:true});
})();`;

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','application/javascript; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=3600');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':clientJs);
}

function injectClient(body){
  if(body.includes('/assets/brand-polish.js'))return body;
  return body.includes('</body>')?body.replace('</body>','<script src="/assets/brand-polish.js" defer></script></body>'):body;
}

module.exports=(req,res)=>{
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname;}catch{}
  if(path==='/assets/brand-polish.js')return sendAsset(req,res);

  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      body=injectClient(polishHtml(body));
    }
    return originalEnd(body,...args);
  };
  return assistantPlatform(req,res);
};

module.exports.polishText=polishText;
module.exports.polishHtml=polishHtml;
