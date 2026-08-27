'use strict';

// APG retailer verification refresh v109.
// Applies only dated evidence metadata from the narrow retailer-verifications-v109
// registry to already-maintained retailer/offer rows. It does not add destinations,
// alter retailer ranking, change affiliate state, or affect recommendation scoring.
const registry=require('./retailer-verifications-v109');

const VERSION='retailer-verification-refresh-v109';
const arr=value=>Array.isArray(value)?value:[];

function refreshRows(slug,rows){return arr(rows).map(row=>registry.resolve(slug,row));}
function refreshProduct(product){
  if(!product||!product.slug)return product;
  product.retailers=refreshRows(product.slug,product.retailers);
  product.offers=refreshRows(product.slug,product.offers);
  return product;
}
function apply({categoryMaps=[]}={}){
  let productsVisited=0,rowsRefreshed=0;
  const seen=new Set();
  for(const map of categoryMaps){
    for(const category of Object.values(map||{})){
      for(const product of arr(category&&category.products)){
        if(!product||!product.slug||seen.has(product))continue;
        seen.add(product);productsVisited++;
        const before=[...arr(product.retailers),...arr(product.offers)];
        refreshProduct(product);
        const after=[...arr(product.retailers),...arr(product.offers)];
        for(let i=0;i<Math.min(before.length,after.length);i++)if(before[i]!==after[i]&&after[i]?.retailerVerificationVersion===registry.VERSION)rowsRefreshed++;
      }
    }
  }
  return {version:VERSION,productsVisited,rowsRefreshed,registryVersion:registry.VERSION};
}

module.exports={VERSION,refreshRows,refreshProduct,apply};
