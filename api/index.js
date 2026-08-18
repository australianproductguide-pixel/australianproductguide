// APG Amazon Affiliate Conversion v29 extends the verified Trust Infrastructure v28
// runtime with a prominent, affiliate-neutral Amazon Australia purchase layer.
// Product fit is still determined upstream; retailer destinations remain downstream.
const app=require('../lib/amazon-conversion-v29');

// Production visual certification identified a 5px horizontal overflow at 390px on
// category Decision shortcut cards. Keep the desktop full-bleed visual treatment,
// but contain that legacy artwork inside the mobile card instead of hiding page overflow.
const MOBILE_CATEGORY_VISUAL_FIX='<style id="apg-mobile-category-visual-fix">@media(max-width:720px){body[data-institutional-v9="true"] .pick-card>.product-visual.v7-semantic-product-visual{margin-left:0!important;margin-right:0!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}}</style>';

module.exports=(req,res)=>{
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')&&!body.includes('apg-mobile-category-visual-fix')){
      body=body.includes('</head>')?body.replace('</head>',`${MOBILE_CATEGORY_VISUAL_FIX}</head>`):body;
    }
    return originalEnd(body,...args);
  };
  return app(req,res);
};