'use strict';

// APG Brand System v46 is deliberately the final HTML presentation shell.
// All commercial, recommendation, auth, analytics and shopping behaviour stays in
// the existing downstream runtime. v46 only establishes the current visual contract.
const downstream=require('./amazon-shopping-creative-final-v41');

const VERSION='46';
const CSS_PATH='/assets/brand-system-v46.css';
const COMMERCE_CSS_PATH='/assets/brand-system-v46-commerce.css';
const MARKER='data-brand-system-v46="true"';

function inject(html){
  let out=String(html||'');
  if(!/^<!doctype html>/i.test(out)&&!/<html[\s>]/i.test(out))return out;
  if(!out.includes(MARKER))out=out.replace(/<body\b([^>]*)>/i,`<body ${MARKER}$1>`);
  const links=[];
  if(!out.includes(`${CSS_PATH}?v=${VERSION}`))links.push(`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}">`);
  if(!out.includes(`${COMMERCE_CSS_PATH}?v=${VERSION}`))links.push(`<link rel="stylesheet" href="${COMMERCE_CSS_PATH}?v=${VERSION}">`);
  if(links.length)out=out.replace('</head>',links.join('')+'</head>');
  return out;
}

function handler(req,res){
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html')&&res.statusCode>=200&&res.statusCode<500){
      const next=inject(body);
      if(next!==body){body=next;try{res.removeHeader('Content-Length');}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,{VERSION,CSS_PATH,COMMERCE_CSS_PATH,MARKER,inject,downstream});
module.exports=handler;
