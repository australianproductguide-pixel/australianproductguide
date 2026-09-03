'use strict';

// Conservative CSS compaction for APG's deterministic build-time Home bundle.
// It removes ordinary comments and collapses redundant whitespace only outside strings and url().
// Important /*! ... */ comments, quoted content, data URLs, escapes and calc operator spacing remain
// intact. This is not used in any public request and does not alter selector or declaration order.
const VERSION='128.2';
const NO_SPACE_PUNCTUATION=new Set(['{','}',';',',']);

function isWhitespace(ch){return ch===' '||ch==='\n'||ch==='\r'||ch==='\t'||ch==='\f';}
function needsSpace(previous,next){
  if(!previous||!next)return false;
  if(NO_SPACE_PUNCTUATION.has(previous)||NO_SPACE_PUNCTUATION.has(next))return false;
  return true;
}
function compactImportantComment(comment){return String(comment||'').trim();}
function compactCss(input){
  const source=String(input==null?'':input);
  let output='';
  let quote='';
  let escaped=false;
  let pendingSpace=false;
  let urlDepth=0;
  let urlEscaped=false;

  function flushSpace(next){
    if(pendingSpace&&needsSpace(output[output.length-1],next))output+=' ';
    pendingSpace=false;
  }

  for(let index=0;index<source.length;index+=1){
    const ch=source[index];
    const next=source[index+1]||'';

    if(urlDepth>0){
      output+=ch;
      if(urlEscaped){urlEscaped=false;continue;}
      if(ch==='\\'){urlEscaped=true;continue;}
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
      if(source[index+2]==='!'){
        const comment=compactImportantComment(source.slice(index,end+2));
        flushSpace(comment[0]);
        output+=comment;
      }
      // Ordinary comments are removed exactly as CSS preprocessing removes them. Whitespace
      // immediately before or after the comment is still processed by the surrounding loop.
      index=end+1;
      continue;
    }

    if(ch==='"'||ch==="'"){
      flushSpace(ch);
      quote=ch;
      escaped=false;
      output+=ch;
      continue;
    }

    if(ch==='\\'){
      flushSpace(ch);
      output+=ch;
      if(index+1<source.length){output+=source[index+1];index+=1;}
      continue;
    }

    if(isWhitespace(ch)){
      pendingSpace=true;
      continue;
    }

    flushSpace(ch);
    output+=ch;

    if(ch==='('&&/(?:^|[^-_a-z0-9])url$/i.test(output.slice(0,-1).trimEnd())){
      urlDepth=1;
      urlEscaped=false;
    }
  }

  if(quote)throw new Error('Unterminated CSS string');
  if(urlDepth)throw new Error('Unterminated CSS url()');
  return output.trim();
}

module.exports={VERSION,NO_SPACE_PUNCTUATION,isWhitespace,needsSpace,compactImportantComment,compactCss};
