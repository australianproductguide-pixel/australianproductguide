// APG Amazon disclosure brand-voice v17.
// Preserve Amazon's required exact Associate identification statement while making surrounding copy organisational.
const app=require('./mobile-history-ux-v16');

const REQUIRED='As an Amazon Associate I earn from qualifying purchases.';
const PREFIX='Australian Product Guide may earn commissions from qualifying purchases made through eligible affiliate links.';

function transform(html){
  let out=String(html||'');
  if(out.includes('data-apg-amazon-brand-voice="v17"'))return out;
  const strong=`<strong>${REQUIRED}</strong>`;
  const replacement=`<span class="apg-amazon-brand-voice" data-apg-amazon-brand-voice="v17">${PREFIX}</span> ${strong}`;
  out=out.split(strong).join(replacement);
  return out;
}

module.exports=(req,res)=>{
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=transform(body);
    return end(body,...args);
  };
  return app(req,res);
};

module.exports.transform=transform;
module.exports.REQUIRED=REQUIRED;
module.exports.PREFIX=PREFIX;
