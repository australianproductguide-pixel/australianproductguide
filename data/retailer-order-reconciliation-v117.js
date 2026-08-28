'use strict';

// APG final retailer-order reconciliation v117.
// Retailer enrichment passes can append exact Australian destinations after the initial canonical
// retailer composition. Re-run the same evidence-bound ordering only after all retailer passes so
// the stored product.retailers array consumed by SSR matches the canonical retailer composer.
// This module changes presentation/order only; it adds no destination and contributes zero
// recommendation points.
const VERSION='retailer-order-reconciliation-v117';

function apply({categoryMaps=[],orderRetailers}={}){
  if(typeof orderRetailers!=='function')throw new TypeError('orderRetailers is required');
  const seenProducts=new Set();
  let productsVisited=0,rowsOrdered=0;
  for(const map of categoryMaps){
    for(const category of Object.values(map||{})){
      for(const product of (category&&category.products)||[]){
        if(!product||seenProducts.has(product))continue;
        seenProducts.add(product);productsVisited++;
        const before=Array.isArray(product.retailers)?product.retailers:[];
        product.retailers=orderRetailers(before);
        rowsOrdered+=product.retailers.length;
      }
    }
  }
  return {version:VERSION,productsVisited,rowsOrdered,policy:'Exact product > verified variant > product search > collection > availability unverified; freshness then retailer-name tie-break; commission contributes zero points.'};
}

module.exports={VERSION,apply};
