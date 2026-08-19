'use strict';

const downstream=require('./vercel-analytics-v38');
const shopping=require('./amazon-shopping-discovery-v39');
const shoppingShell=require('./amazon-shopping-shell-v39');

function requestUrl(req){
  try{return new URL(req?.url||'/','https://australianproductguide.au');}
  catch{return new URL('https://australianproductguide.au/');}
}

function injectBeforeMainEnd(html,section){
  if(!section||!html||!html.includes('</main>'))return html;
  return html.replace('</main>',section+'</main>');
}

function finalShoppingHtml(html,req){
  let body=String(html||'');
  const u=requestUrl(req);
  let path;
  try{path=decodeURIComponent(u.pathname).replace(/\/{2,}/g,'/');}
  catch{path=u.pathname||'/';}

  if(path==='/'&&!body.includes('apg-shopping-home')){
    body=injectBeforeMainEnd(body,shopping.homeSection());
  }

  const categoryMatch=path.match(/^\/categories\/([^/]+)\/$/);
  if(categoryMatch&&!body.includes('apg-category-shopping')){
    body=injectBeforeMainEnd(body,shopping.categorySection(categoryMatch[1]));
  }

  if(path==='/search/'&&!body.includes('apg-search-shopping')){
    body=injectBeforeMainEnd(body,shopping.searchSection(u.searchParams.get('q')||''));
  }

  return shoppingShell.enhance(body);
}

module.exports=(req,res)=>{
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      body=finalShoppingHtml(body,req);
    }
    return originalEnd(body,...args);
  };
  return downstream(req,res);
};

module.exports.finalShoppingHtml=finalShoppingHtml;
