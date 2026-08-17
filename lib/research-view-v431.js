// APG Research View v43.1 consumer-language polish.
// Keeps governance fields in the API but removes scoring jargon from the visible UI.
const app=require('./research-view-v43');

function polishAnswer(value){
  return String(value||'')
    .replace(' is the strongest maintained fit because it ',' is the strongest maintained fit. The strongest reasons APG found are: ')
    .replace('The strongest reasons APG found are: known maintained','The strongest reasons APG found are: the known maintained');
}
function polishHtml(html){
  return String(html||'')
    .replace('<small>Maintained evidence · transparent reasoning · commercial weight 0</small>','<small>Maintained evidence · transparent reasoning · affiliate-neutral ranking</small>')
    .replace(/(<p class="apg-rv-answer-copy-v43">)([\s\S]*?)(<\/p>)/,(m,a,b,c)=>a+polishAnswer(b)+c);
}
function transform(html,pathOrUrl){return polishHtml(app.transform?app.transform(String(html||''),pathOrUrl):String(html||''));}
module.exports=(req,res)=>{
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'){
      if(type.startsWith('text/html'))body=polishHtml(body);
      else if(type.startsWith('application/json')&&(path==='/api/search/research'||path==='/api/search/research/')){
        try{const data=JSON.parse(body);if(data&&typeof data==='object'&&data.answer)data.answer=polishAnswer(data.answer);body=JSON.stringify(data);}catch{}
      }
    }
    return end(body,...args);
  };
  return app(req,res);
};
module.exports.transform=transform;
module.exports.polishHtml=polishHtml;
module.exports.polishAnswer=polishAnswer;
