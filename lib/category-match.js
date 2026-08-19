'use strict';
const {categories}=require('../data');

const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9$]+/g,' ').replace(/\s+/g,' ').trim();
const words=s=>norm(s).split(/\s+/).filter(Boolean);

function distance(a,b){
  if(a===b)return 0;
  if(!a.length)return b.length;
  if(!b.length)return a.length;
  let prev=[...Array(b.length+1).keys()];
  for(let i=1;i<=a.length;i++){
    const row=[i];
    for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    prev=row;
  }
  return prev[b.length];
}

function aliasesFor(c){
  return [...new Set([c.label,c.label.replace(/s$/,''),c.slug.replace(/-/g,' '),...(c.aliases||[])].map(norm).filter(Boolean))];
}
function containsPhrase(n,alias){
  const a=norm(alias);
  return !!a&&(` ${n} `).includes(` ${a} `);
}
function fuzzyTokenScore(queryTokens,alias){
  const aliasTokens=words(alias);
  if(aliasTokens.length!==1)return 0;
  const a=aliasTokens[0];
  // Typo recovery is intentionally conservative. Short aliases such as TV, PC or phone
  // must match as whole tokens and must never be inferred from a neighbouring word.
  if(a.length<5)return 0;
  let best=0;
  for(const token of queryTokens){
    if(token.length<5||Math.abs(token.length-a.length)>1)continue;
    if(distance(token,a)===1)best=Math.max(best,a.length);
  }
  return best;
}
function categoryFromQuery(input){
  const n=norm(input),queryTokens=words(n);
  let best=null;
  for(const c of Object.values(categories)){
    let exact=0,fuzzy=0;
    for(const alias of aliasesFor(c)){
      if(containsPhrase(n,alias))exact=Math.max(exact,alias.length);
      else fuzzy=Math.max(fuzzy,fuzzyTokenScore(queryTokens,alias));
    }
    // Whole-phrase matches always outrank typo recovery; within each class prefer the
    // more specific alias. This prevents `phone` inside `headphonez` while allowing
    // `headphonez` -> `headphones` when that maintained alias is one edit away.
    const score=exact?10000+exact:(fuzzy?100+fuzzy:0);
    if(score&&(!best||score>best.score))best={slug:c.slug,score,match:exact?'exact':'fuzzy',category:c};
  }
  return best;
}
function detectCategory(input,forced=''){
  if(forced&&categories[forced])return categories[forced];
  return categoryFromQuery(input)?.category||null;
}

module.exports={norm,words,distance,aliasesFor,containsPhrase,categoryFromQuery,detectCategory};
