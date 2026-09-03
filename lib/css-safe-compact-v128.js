'use strict';

// Conservative CSS compaction for APG's deterministic build-time Home bundle.
// It removes ordinary comments and redundant whitespace only outside strings and url().
// Important /*! ... */ comments, quoted content, data URLs and calc operator spacing remain intact.
// This is not used in any public request and does not alter selector order or declaration order.
const VERSION='128.1';
const NO_SPACE_PUNCTUATION=new Set(['{','}',':',';',',']);

function isWhitespace(ch){return ch===' '||ch==='\n'||ch==='\r'||ch==='\t'||ch==='\f';}
function needsSpace(previous,next){
  if(!previous||!next)return false;
  if(NO_SPACE_PUNCTUATION.has(previous)||NO_SPACE_PUNCTUATION.has(next))return false;
  return true;
}
function compactImportantComment(comment){return String(comment||'').replace(/\s+/g,' ').trim();}
function compactCss(input){
  const source=String(input==null?'':input);
  let output='';
  let quote='';
  let escaped=false;
  let pendingSpace=false;
  let urlDepth=0;

  for(let index=0;index<source.length;index+=1){
    const ch=source[index];
    const next=source[index+1]||'';

    if(urlDepth>0){
      output+=ch;
      if(quote){
        if(escaped)escaped=false;
        else if(ch==='\\')escaped=true;
        else if(ch===quote)quote='';
        continue;
      }
      if(ch==='"'||ch==="'"){quote=ch;escaped=false;continue;}
      if(ch==='(')urlDepth+=1;
      else if(ch===')')urlDepth-=1;
      continue;
    }

    if(quote){
      output+=ch;
      if(escaped)escaped=false;
      else if(ch==='\\')escaped=true;
      else if(ch===quote)quote='';
      continue;
    }

    if(ch==='/'&&next==='*'){
      const end=source.indexOf('*/',index+2);
      if(end<0)throw new Error('Unterminated CSS comment');
      const important=source[index+2]==='!';
      if(important){
        const comment=compactImportantComment(source.slice(index,end+2));
        if(pendingSpace&&needsSpace(output[output.length-1],comment[0]))output+=' ';
        output+=comment;
      }
      pendingSpace=true;
      index=end+1;
      continue;
    }

    if(ch==='"'||ch==="'"){
      if(pendingSpace&&needsSpace(output[output.length-1],ch))output+=' ';
      pendingSpace=false;
      quote=ch;
      escaped=false;
      output+=ch;
      continue;
    }

    if(isWhitespace(ch)){
      pendingSpace=true;
      continue;
    }

    if(pendingSpace&&needsSpace(output[output.length-1],ch))output+=' ';
    pendingSpace=false;
    output+=ch;

    if(ch==='('&&/url$/i.test(output.slice(0,-1).trimEnd()))urlDepth=1;
  }

  if(quote)throw new Error('Unterminated CSS string');
  if(urlDepth)throw new Error('Unterminated CSS url()');
  return output.trim();
}

module.exports={VERSION,NO_SPACE_PUNCTUATION,isWhitespace,needsSpace,compactCss};
