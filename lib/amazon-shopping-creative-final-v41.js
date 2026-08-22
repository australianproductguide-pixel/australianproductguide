'use strict';

const downstream=require('./amazon-shopping-final-v39');
const creative=require('./amazon-shopping-creative-v41');
const CSS_PATH='/assets/amazon-shopping-creative-v41.css';
const HOMEPAGE_PLACEMENT_VERSION='72.0';

function requestUrl(req){
  try{return new URL(req?.url||'/','https://australianproductguide.au');}
  catch{return new URL('https://australianproductguide.au/');}
}

function withCss(html){
  const body=String(html||'');
  if(!body.includes('data-amazon-creative-v41='))return body;
  if(body.includes(CSS_PATH))return body;
  return body.includes('</head>')?body.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=41"></head>`):body;
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

function placeHomeCreative(html){
  let out=String(html||'');
  const amazonRange=sectionRange(out,'apg-amz-v41-home');
  if(!amazonRange)return out;
  const amazon=out.slice(amazonRange.start,amazonRange.end);
  out=out.slice(0,amazonRange.start)+out.slice(amazonRange.end);

  // One strong Amazon discovery module is clearer than repeating a weaker compact strip.
  out=removeSection(out,'apg-shopping-home');

  // Keep APG's value proposition and maintained-research proof first, then shopper intent,
  // then present Amazon discovery before the broader catalogue and decision-method content.
  const situations=sectionRange(out,'apg-v12-situations');
  if(situations)out=out.slice(0,situations.end)+amazon+out.slice(situations.end);
  else {
    const mainEnd=out.indexOf('</main>');
    if(mainEnd>=0)out=out.slice(0,mainEnd)+amazon+out.slice(mainEnd);
  }

  if(!out.includes('name="apg-home-amazon-placement"')&&out.includes('</head>')){
    out=out.replace('</head>',`<meta name="apg-home-amazon-placement" content="v${HOMEPAGE_PLACEMENT_VERSION}"></head>`);
  }
  return out;
}

function finalCreativeHtml(html,req){
  const url=requestUrl(req);
  let body=withCss(creative.enhance(String(html||''),req));
  if(url.pathname==='/')body=placeHomeCreative(body);
  return body;
}

module.exports=(req,res)=>{
  const u=requestUrl(req);
  if(u.pathname===CSS_PATH){
    res.statusCode=200;
    res.setHeader('Content-Type','text/css; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=3600');
    return res.end(req.method==='HEAD'?'':creative.css);
  }
  if(u.pathname==='/')res.setHeader('X-APG-Homepage-Amazon-Placement','v'+HOMEPAGE_PLACEMENT_VERSION);
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      body=finalCreativeHtml(body,req);
    }
    return originalEnd(body,...args);
  };
  return downstream(req,res);
};

module.exports.finalCreativeHtml=finalCreativeHtml;
module.exports.placeHomeCreative=placeHomeCreative;
module.exports.sectionRange=sectionRange;
module.exports.withCss=withCss;
module.exports.CSS_PATH=CSS_PATH;
module.exports.HOMEPAGE_PLACEMENT_VERSION=HOMEPAGE_PLACEMENT_VERSION;
