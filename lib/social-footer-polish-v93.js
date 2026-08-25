'use strict';

// APG Social + Footer Polish v93.1
//
// Presentation-only refinement of APG's shared social profile surfaces, mobile footer
// and My APG mobile workspace. It addresses the observed mobile defects without
// changing account, consent, recommendation, analytics, SEO or commerce behaviour:
//   1) the final row of social cards has deliberate space before the footer rule;
//   2) Cookie preferences aligns to the same mobile content edge as the footer;
//   3) the optional My APG account-sync form is a clean single-column mobile form; and
//   4) My APG workspace headings/actions use a consistent left-aligned mobile layout.
//
// It also standardises social identity treatment across footer, mobile navigation and
// other shared v56 social surfaces. The marks use the recognisable platform forms and
// current brand treatments: Facebook blue, Instagram gradient glyph, current Threads
// white mark on black, X black/white, Pinterest's white scripted P in its red badge,
// and LinkedIn's permitted [in] social icon treatment.
//
// No social destination, account semantics, consent semantics, recommendation logic,
// analytics, SEO or commerce behaviour is changed. No third-party logo host is
// introduced at runtime.
const downstream=require('./category-directory-mobile-alignment-v92');

const VERSION='93.1';
const CSS_PATH='/assets/social-footer-polish-v931.css';
const ORIGIN='https://australianproductguide.au';

const marks=Object.freeze({
  facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 21v-7.3h2.5l.4-3h-2.9V8.8c0-.9.3-1.5 1.6-1.5h1.5V4.6c-.7-.1-1.5-.2-2.3-.2-2.3 0-4 1.4-4 4.1v2.2H8v3h2.5V21h3.2Z"/></svg>',
  instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.7" r="1.2" fill="currentColor" stroke="none"/></svg>',
  threads:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"/></svg>',
  x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4.2l3.7 5.1L17.3 4H20l-5.8 6.8L20.5 20h-4.2l-4-5.6L7.5 20H4.8l6.1-7.3L5 4Zm3 1.8 9.2 12.4h1.3L9.3 5.8H8Z"/></svg>',
  pinterest:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>',
  linkedin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5A2.5 2.5 0 1 1 5 8.5 2.5 2.5 0 0 1 5 3.5ZM3 10h4v11H3V10Zm6.5 0h3.8v1.5h.1c.5-1 1.9-2 3.9-2 4.2 0 4.9 2.7 4.9 6.3V21h-4v-4.6c0-2.2 0-3.7-2.3-3.7-2.3 0-2.6 1.8-2.6 3.6V21h-4V10Z"/></svg>'
});

const css=`
/* APG Social + Footer Polish v93.1 */
.apg-social-v56,
.apg-mobile-social-v56,
.apg-social-about-v56{
  --apg-social-border:rgba(148,163,184,.30);
  --apg-social-border-hover:rgba(96,165,250,.72);
  --apg-social-surface:rgba(255,255,255,.035);
  --apg-social-surface-hover:rgba(37,99,235,.10);
}

.apg-social-v56{
  padding-bottom:24px!important;
}

.apg-social-v56-list,
.apg-mobile-social-v56-list{
  align-items:stretch!important;
  gap:10px!important;
}

.apg-social-v56-link,
.apg-mobile-social-v56-link{
  box-sizing:border-box!important;
  border-color:var(--apg-social-border)!important;
  border-radius:12px!important;
  background:var(--apg-social-surface)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;
  gap:10px!important;
  transform:none!important;
}

.apg-social-v56-link:hover,
.apg-social-v56-link:focus-visible,
.apg-mobile-social-v56-link:hover,
.apg-mobile-social-v56-link:focus-visible{
  border-color:var(--apg-social-border-hover)!important;
  background:var(--apg-social-surface-hover)!important;
  transform:none!important;
}

.apg-social-v56-glyph{
  width:28px!important;
  height:28px!important;
  min-width:28px!important;
  min-height:28px!important;
  flex:0 0 28px!important;
  border-radius:7px!important;
  box-shadow:none!important;
}

.apg-social-v56-glyph svg{
  width:18px!important;
  height:18px!important;
}

.apg-social-v56-glyph.is-facebook{
  background:#0866FF!important;
  color:#fff!important;
  border-radius:50%!important;
}

.apg-social-v56-glyph.is-instagram{
  background:radial-gradient(circle at 31% 107%,#fdf497 0 5%,#fdf497 5% 9%,#fd5949 40%,#d6249f 60%,#285AEB 90%)!important;
  color:#fff!important;
  border-radius:8px!important;
}

.apg-social-v56-glyph.is-threads{
  background:#000!important;
  color:#fff!important;
  border-radius:8px!important;
}

.apg-social-v56-glyph.is-x{
  background:#000!important;
  color:#fff!important;
  border-radius:7px!important;
}

.apg-social-v56-glyph.is-pinterest{
  background:#E60023!important;
  color:#fff!important;
  border-radius:50%!important;
}

.apg-social-v56-glyph.is-linkedin{
  background:#0A66C2!important;
  color:#fff!important;
  border-radius:6px!important;
}

.apg-mobile-social-v56{
  padding-bottom:16px!important;
}

@media (max-width:760px){
  .apg-social-v56{
    margin-bottom:0!important;
    padding-bottom:26px!important;
  }

  .apg-social-v56-list{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:10px!important;
  }

  .apg-social-v56-link{
    width:100%!important;
    min-width:0!important;
    min-height:48px!important;
    padding:9px 12px!important;
    justify-content:flex-start!important;
  }

  .apg-social-v56-link>span:last-child,
  .apg-mobile-social-v56-link>span:last-child{
    min-width:0!important;
    font-size:15px!important;
    line-height:1.15!important;
    font-weight:700!important;
    letter-spacing:-.01em!important;
  }

  .apg-social-v56 + .footer-v11-rulebar{
    margin-top:0!important;
  }

  .apg-mobile-social-v56-list{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
  }

  .apg-mobile-social-v56-link{
    width:100%!important;
    min-width:0!important;
    min-height:46px!important;
    padding:8px 11px!important;
    justify-content:flex-start!important;
  }

  /* Keep Cookie preferences on the certified 20px mobile footer content edge. */
  .apg-footer-v11 .apg-cookie-footer-wrap,
  .apg-footer-v11 + .apg-cookie-footer-wrap,
  .apg-cookie-footer-wrap{
    display:flex!important;
    align-items:center!important;
    justify-content:flex-start!important;
    box-sizing:border-box!important;
    width:100%!important;
    max-width:none!important;
    margin:0!important;
    padding:20px 20px calc(24px + env(safe-area-inset-bottom,0px))!important;
  }

  .apg-cookie-footer-button{
    position:static!important;
    left:auto!important;
    right:auto!important;
    align-self:flex-start!important;
    margin:0!important;
    transform:none!important;
  }

  /* My APG optional account sync: isolate mobile sizing from legacy grid/flex rules. */
  body[data-platform-page="/my-apg/"] .apg-account-shell{
    width:100%!important;
    max-width:100%!important;
    box-sizing:border-box!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-head{
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-body{
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    padding:20px!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-form{
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    grid-auto-flow:row!important;
    align-items:stretch!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    gap:16px!important;
    margin:0!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-form > label:not(.apg-account-consent){
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    grid-column:1!important;
    gap:7px!important;
    align-items:start!important;
    justify-items:stretch!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin:0!important;
    padding:0!important;
    position:static!important;
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-form input[type="email"],
  body[data-platform-page="/my-apg/"] .apg-account-form input[type="password"],
  body[data-platform-page="/my-apg/"] .apg-account-form input[type="text"]{
    display:block!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    height:auto!important;
    margin:0!important;
    position:static!important;
    left:auto!important;
    right:auto!important;
    transform:none!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-actions{
    grid-column:1!important;
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    align-items:stretch!important;
    gap:10px!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    margin:0!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-actions .button,
  body[data-platform-page="/my-apg/"] .apg-account-actions button{
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin:0!important;
    text-align:center!important;
    white-space:normal!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-small,
  body[data-platform-page="/my-apg/"] .apg-account-form > p{
    grid-column:1!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin-left:0!important;
    margin-right:0!important;
    text-align:left!important;
  }

  /* Workspace cards: titles and eyebrow labels align to the content edge. */
  body[data-platform-page="/my-apg/"] .workspace-panel,
  body[data-platform-page="/my-apg/"] .research-shelf{
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] .workspace-panel .section-head,
  body[data-platform-page="/my-apg/"] .workspace-panel .section-head.compact-head,
  body[data-platform-page="/my-apg/"] .research-shelf .section-head,
  body[data-platform-page="/my-apg/"] .research-shelf .section-head.compact-head{
    display:block!important;
    align-items:flex-start!important;
    justify-content:flex-start!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin-left:0!important;
    margin-right:0!important;
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] .workspace-panel .section-head > div,
  body[data-platform-page="/my-apg/"] .research-shelf .section-head > div,
  body[data-platform-page="/my-apg/"] .workspace-panel .section-head .kicker,
  body[data-platform-page="/my-apg/"] .research-shelf .section-head .kicker,
  body[data-platform-page="/my-apg/"] .workspace-panel .section-head h2,
  body[data-platform-page="/my-apg/"] .research-shelf .section-head h2{
    display:block!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin-left:0!important;
    margin-right:0!important;
    text-align:left!important;
    align-self:flex-start!important;
  }

  /* Prevent the two history-level actions becoming an uneven wrapped mobile pair. */
  body[data-platform-page="/my-apg/"] .workspace-actions{
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    align-items:stretch!important;
    gap:10px!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
  }

  body[data-platform-page="/my-apg/"] .workspace-actions .button,
  body[data-platform-page="/my-apg/"] .workspace-actions button,
  body[data-platform-page="/my-apg/"] .workspace-actions a{
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin:0!important;
    text-align:center!important;
    white-space:normal!important;
  }
}

@media (max-width:380px){
  .apg-social-v56-link,
  .apg-mobile-social-v56-link{
    padding-left:10px!important;
    padding-right:10px!important;
    gap:8px!important;
  }

  .apg-social-v56-link>span:last-child,
  .apg-mobile-social-v56-link>span:last-child{
    font-size:14px!important;
  }
}

@media (max-width:360px){
  body[data-platform-page="/my-apg/"] .apg-account-actions{
    grid-template-columns:minmax(0,1fr)!important;
  }
}
`;

function replaceSocialMarks(html){
  return String(html||'').replace(
    /<span\s+class=["']apg-social-v56-glyph\s+is-(facebook|instagram|threads|x|pinterest|linkedin)["']\s+aria-hidden=["']true["']>([\s\S]*?)<\/span>/gi,
    (whole,key)=>`<span class="apg-social-v56-glyph is-${String(key).toLowerCase()}" aria-hidden="true" data-apg-social-mark="v${VERSION}">${marks[String(key).toLowerCase()]||''}</span>`
  );
}

function inject(html){
  let out=replaceSocialMarks(html);
  if(!out.includes('name="apg-social-footer-polish"')){
    out=out.replace('</head>',`<meta name="apg-social-footer-polish" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  return out;
}

function sendCss(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Social-Footer-Polish','v'+VERSION);
  return res.end(req.method==='HEAD'?'':css);
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  if(path===CSS_PATH&&(req.method==='GET'||req.method==='HEAD'))return sendCss(req,res);

  res.setHeader('X-APG-Social-Footer-Polish','v'+VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      const next=inject(original);
      if(next!==original){
        body=wasBuffer?Buffer.from(next,'utf8'):next;
        try{res.removeHeader('Content-Length')}catch{}
      }
    }
    res.setHeader('X-APG-Social-Footer-Polish','v'+VERSION);
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  SOCIAL_FOOTER_POLISH_VERSION:VERSION,
  SOCIAL_FOOTER_POLISH_CSS_PATH:CSS_PATH,
  socialFooterPolishCss:css,
  replaceSocialMarks,
  injectSocialFooterPolish:inject
});

module.exports=handler;
