const assistantPlatform=require('./assistant-platform');

const PRIMARY_HOST='australianproductguide.au';
const BRAND='Australian Product Guide';

const clientJs=`(()=>{
const SKIP=new Set(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA']);
const replaceText=value=>String(value||'').replace(/—/g,'-').replace(/\\bAPG\\b/g,'Australian Product Guide');
function polish(root){
  if(!root)return;
  if(root.nodeType===Node.TEXT_NODE){
    const parent=root.parentElement;
    if(!parent||SKIP.has(parent.tagName))return;
    const next=replaceText(root.nodeValue);
    if(next!==root.nodeValue)root.nodeValue=next;
    return