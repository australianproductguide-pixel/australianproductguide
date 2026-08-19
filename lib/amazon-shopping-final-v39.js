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

function shoppingIntentMain(query){
  const item=shopping.dealIntent(query);
  if(!item)return '';
  return `<main id="main" data-shopping-search-intent="true">
<section class="search-hero"><div class="wrap"><p class="kicker">Shopping discovery</p><h1>Explore Amazon Australia shopping opportunities</h1><p class="lede">This search looks like retailer, deal or promotional intent, so Australian Product Guide is keeping it separate from ordinary product ranking. Browse a verified shopping destination, then use APG to work out which products actually suit you.</p><div class="actions"><a class="button" href="/deals/">Open Deals &amp; Shopping</a><a class="button secondary" href="/decision-lab/">Use Decision Lab</a></div></div></section>
${shopping.searchSection(query)}
<section class="section"><div class="wrap"><div class="soft-panel"><p class="kicker">Recommendation independence</p><h2>Shopping signals are useful context, not a suitability score.</h2><p>Amazon merchandising, popularity, discounts and affiliate commission contribute zero points to APG recommendations. If you want a product recommendation instead, search for the product type or tell Decision Lab what you need, your budget and your deal-breakers.</p><div class="actions"><a class="button secondary" href="/search/">Search APG products</a><a class="text-link" href="/methodology/">How APG compares products →</a></div></div></div></section>
</main>`;
}

function replaceMain(html,replacement){
  if(!replacement)return html;
  const main=/<main\b[^>]*>[\s\S]*?<\/main>/i;
  return main.test(html)?html.replace(main,replacement):html;
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

  if(path==='/search/'){
    const q=u.searchParams.get('q')||'';
    const intentMain=shoppingIntentMain(q);
    if(intentMain){
      body=replaceMain(body,intentMain);
    }else if(!body.includes('apg-search-shopping')){
      body=injectBeforeMainEnd(body,shopping.searchSection(q));
    }
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
module.exports.shoppingIntentMain=shoppingIntentMain;