'use strict';
const base=require('./product-intelligence-v41');
const catalogue=require('./catalogue-intelligence-v48');

const VERSION='product-intelligence-v48';
function knowledgeNode(slug){
  const node=base.knowledgeNode(slug);if(!node)return null;
  const profile=catalogue.profileFor(slug);
  const comparable=node.relationships?.comparable||[];
  return {...node,schemaVersion:VERSION,catalogueIntelligence:{...profile,alternatives:{comparableCount:comparable.length,comparable:comparable.map(x=>({slug:x.slug,brand:x.brand,name:x.name,similarity:Number(x.similarity)||0})),cheaperAlternative:node.relationships?.cheaperAlternative||null,premiumAlternative:node.relationships?.premiumAlternative||null}}};
}
function categoryNode(slug){const node=base.categoryNode(slug);return node?{...node,catalogueIntelligence:catalogue.categorySummary(slug)}:null;}
function graphSummary(){return {...base.graphSummary(),catalogueIntelligence:catalogue.summary()};}
module.exports={...base,VERSION,knowledgeNode,categoryNode,graphSummary,catalogue};