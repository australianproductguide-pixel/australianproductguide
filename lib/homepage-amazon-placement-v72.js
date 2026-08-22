'use strict';

// APG Homepage Amazon Placement v72.
// Commercial objective: surface the governed Amazon Australia shopping-discovery module
// immediately after the shopper-situation section, while keeping APG trust/context first.
// The older compact shopping block is removed on the homepage to avoid duplicate Amazon
// merchandising and keep one clear, transparent affiliate discovery experience.
const downstream=require('./amazon-shopping-creative-final-v41');

const VERSION='72.0';
const MARKER='apg-home-amazon-placement';

function requestUrl(req){
  try{return new URL(req?.url||'/','https://australianproductguide.au');}
  catch{return new URL('https://australianproductguide.au/');}
}

function sectionRange(html,classToken){
  const source=String(html||'');
  const classAt=source.indexOf(classToken);
  if(classAt<0)return null;
  const start=source.lastIndexOf('<section',classAt);
  if(start<0)return null;
  const token=/<\/?section\b[^>]*>/gi;
  token.lastIndex=start;
  let depth=0,match;
  while((match=token.exec(source))){
    if(/^<section\b/i.test(match[0]))depth+=1;
    else depth-=1;
    if(depth===0)return {start,end:token.lastIndex};
  }
  return null;
}

function removeSection(html,classToken){
  const range=sectionRange(html,classToken);
  if(!range)return String(html||'');
  return html.slice(0,range.start)+html.slice(range.end);
}

function moveHomepageAmazon(html){
  let out=String(html||'');
  const amazonRange=sectionRange(out,'apg-amz-v41-home');
  if(!amazonRange)return out;

  const amazonSection=out.slice(amazonRange.start,amazonRange.end);
  out=out.slice(0,amazonRange.start)+out.slice(amazonRange.end);

  // Consolidate the legacy compact homepage shopping strip into the stronger visual module.
  out=removeSection(out,'apg-shopping-home');

  // Preferred position: Hero -> research proof -> shopper situations -> Amazon discovery.
  const situations=sectionRange(out,'apg-v12-situations');
  if(situations){
    out=out.slice(0,situations.end)+amazonSection+out.slice(situations.end);
  }else{
    // Defensive fallback keeps the module within main if a future homepage refactor removes v12.
    const mainEnd=out.indexOf('</main>');
    if(mainEnd>=0)out=out.slice(0,mainEnd)+amazonSection+out.slice(mainEnd);
    else out+=amazonSection;
  }

  if(!out.includes(`name="${MARKER}"`)&&out.includes('</head>')){
    out=out.replace('</head>',`<meta name="${MARKER}" content="v${VERSION}"></head>`);
  }
  return out;
}

function handler(req,res){
  const url=requestUrl(req);
  if(url.pathname==='/')res.setHeader('X-APG-Homepage-Amazon-Placement','v'+VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(url.pathname==='/'&&req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=moveHomepageAmazon(body);
      if(next!==body){body=next;try{res.removeHeader('Content-Length');}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,{VERSION,MARKER,sectionRange,removeSection,moveHomepageAmazon,downstream});
module.exports=handler;
