'use strict';

// Defensive/idempotent page repair for v45. Earlier materialisation could replace
// the helper fallback before the actual category-page slot on a first pass. Keep
// the fallback safe, preserve Australian currency formatting, and guarantee that
// category pages render categoryHeroMedia(c).
const fs=require('fs');
const path=require('path');
const file=path.join(__dirname,'..','lib','pages.js');
let s=fs.readFileSync(file,'utf8');

const badMoney="const money=n=>n?`A${Number(n).toLocaleString('en-AU')}`:'Check current retailer';";
const goodMoney="const money=n=>n?`A$${Number(n).toLocaleString('en-AU')}`:'Check current retailer';";
// Use a replacement function so the literal "$${" sequence is not interpreted
// as String.replace replacement syntax (where "$$" collapses to a single "$" ).
if(s.includes(badMoney))s=s.replace(badMoney,()=>goodMoney);

const brokenFallback='if(!image)return `${categoryHeroMedia(c)}`;';
const heroArt='<div class="category-hero-art">${categoryIcon(c.icon,\'large\')}<strong>${c.products.length} maintained products</strong><span>Evidence + comparison + finder + retailer pathways</span></div>';
const safeFallback='if(!image)return `'+heroArt+'`;';
if(s.includes(brokenFallback))s=s.replace(brokenFallback,()=>safeFallback);

const categoryStart=s.indexOf('function categoryPage(req,c,u)');
if(categoryStart<0)throw new Error('categoryPage() not found');
const categoryTail=s.slice(categoryStart);
if(!categoryTail.includes('${categoryHeroMedia(c)}')){
  const relative=categoryTail.indexOf(heroArt);
  if(relative<0)throw new Error('Category hero slot not found for image renderer');
  const absolute=categoryStart+relative;
  s=s.slice(0,absolute)+'${categoryHeroMedia(c)}'+s.slice(absolute+heroArt.length);
}

if(!s.includes(goodMoney))throw new Error('Australian A$ price formatting is not intact');
if(s.includes(brokenFallback))throw new Error('Recursive category hero fallback remains');
if(!s.slice(s.indexOf('function categoryPage(req,c,u)')).includes('${categoryHeroMedia(c)}'))throw new Error('Category page is not wired to categoryHeroMedia(c)');
if(!s.includes('Editorial category image — not a reviewed product.'))throw new Error('Editorial-image disclaimer missing');

fs.writeFileSync(file,s);
console.log('Category hero page wiring hardened: safe fallback, A$ formatting and live category render verified.');
