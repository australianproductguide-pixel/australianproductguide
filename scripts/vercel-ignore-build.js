'use strict';

const {execFileSync}=require('child_process');

const SAFE_PATH_PATTERNS=Object.freeze([
  /^\.github\//,
  /^docs\//,
  /^ops\//,
  /^README\.md$/,
  /^RELEASE$/
]);

function normalisePath(file){
  return String(file||'').trim().replace(/^\.\//,'');
}

function isSafePath(file){
  const path=normalisePath(file);
  return Boolean(path)&&SAFE_PATH_PATTERNS.some(pattern=>pattern.test(path));
}

function canIgnore(files){
  return Array.isArray(files)&&files.length>0&&files.every(isSafePath);
}

function changedFiles(previousSha){
  const output=execFileSync(
    'git',
    ['diff','--name-only','--diff-filter=ACDMRTUXB',previousSha,'HEAD'],
    {encoding:'utf8',stdio:['ignore','pipe','pipe']}
  );
  return output.split(/\r?\n/).map(normalisePath).filter(Boolean);
}

function main(){
  const previousSha=String(process.env.VERCEL_GIT_PREVIOUS_SHA||'').trim();

  // This control is deliberately fail-closed for availability: if Vercel cannot provide a
  // trustworthy previous Production SHA, APG builds rather than risking a stale runtime.
  if(!/^[0-9a-f]{40}$/i.test(previousSha)){
    console.log('APG ignored-build control: previous Production SHA unavailable or invalid; BUILD.');
    process.exit(1);
  }

  try{
    const files=changedFiles(previousSha);
    if(canIgnore(files)){
      console.log(`APG ignored-build control: documentation/operations-only change (${files.length} file(s)); SKIP BUILD.`);
      process.exit(0);
    }
    console.log(`APG ignored-build control: runtime-relevant, mixed or empty change set (${files.length} file(s)); BUILD.`);
    process.exit(1);
  }catch(error){
    const detail=error&&error.message?error.message:'unknown git diff failure';
    console.log(`APG ignored-build control: unable to prove documentation-only change (${detail}); BUILD.`);
    process.exit(1);
  }
}

module.exports={SAFE_PATH_PATTERNS,normalisePath,isSafePath,canIgnore,changedFiles};

if(require.main===module)main();
