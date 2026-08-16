const app=require('./app');

const MEASUREMENT_ID='G-PV16VQTVY4';
const VERIFICATION_PATH='/google2e35d1ac089ebb56.html';
const VERIFICATION_BODY='google-site-verification: google2e35d1ac089ebb56.html';

const GOOGLE_TAG=`<script async src="https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});gtag('config','${MEASUREMENT_ID}',{page_location:window.location.origin+window.location.pathname,allow_google_signals:false,allow_ad_personalization_signals:false});</script>`;

const OLD_PRIVACY=`<h2 id="cookies">5. Cookies and analytics</h2><p>The current APG application code does not include a first-party behavioural analytics or advertising-pixel implementation. Hosting, security infrastructure and third-party services may process technical data required to operate their services. If APG later introduces analytics or advertising technology, this policy and any consent/notice controls will need to be reviewed before activation.</p>`;
const NEW_PRIVACY=`<h2 id="cookies">5. Cookies and analytics</h2><p>APG uses Google Analytics 4 (GA4) to understand aggregate website usage and improve navigation, content and product-decision journeys. GA4 can use a first-party analytics identifier cookie and collect technical usage information such as page views, browser/device information and coarse location derived from network information. APG configures the Google tag to disable Google Signals and advertising-personalisation signals, keeps advertising consent types denied, and sends the page path without query-string values so search terms, finder inputs and URL parameters are not intentionally included in the Analytics page-location field. Google states that IP addresses used for GA4 location derivation are discarded before being logged. APG does not use Analytics data to alter product suitability scores or affiliate rankings. Broader advertising, remarketing or materially expanded tracking would require a fresh privacy and consent-control review before activation.</p>`;

function extendCsp(value){
  let csp=String(value||'');
  csp=csp.replace("script-src 'self' 'unsafe-inline'","script-src 'self' 'unsafe-inline' https://www.googletagmanager.com");
  csp=csp.replace("img-src 'self' data: https://*.media-amazon.com https://m.media-amazon.com","img-src 'self' data: https://*.media-amazon.com https://m.media-amazon.com https://www.google-analytics.com https://*.google-analytics.com");
  csp=csp.replace("connect-src 'self' https://gozovvhofdsshjuixcys.supabase.co","connect-src 'self' https://gozovvhofdsshjuixcys.supabase.co https://www.google-analytics.com https://*.google-analytics.com");
  return csp;
}

module.exports=(req,res)=>{
  let pathname='';
  try{pathname=new URL(req.url,'https://example.invalid').pathname;}catch{}

  if(pathname===VERIFICATION_PATH){
    res.statusCode=200;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=3600');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Robots-Tag','noindex');
    return res.end(req.method==='HEAD'?'':VERIFICATION_BODY);
  }

  const originalSetHeader=res.setHeader.bind(res);
  res.setHeader=(name,value)=>{
    if(String(name).toLowerCase()==='content-security-policy')value=extendCsp(value);
    return originalSetHeader(name,value);
  };

  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const contentType=String(res.getHeader('Content-Type')||'');
    if(req.method!=='HEAD'&&typeof body==='string'&&contentType.toLowerCase().startsWith('text/html')){
      if(body.includes('</head>')&&!body.includes(`googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`))body=body.replace('</head>',GOOGLE_TAG+'</head>');
      if(pathname==='/privacy/'&&body.includes(OLD_PRIVACY))body=body.replace(OLD_PRIVACY,NEW_PRIVACY);
    }
    return originalEnd(body,...args);
  };

  return app(req,res);
};
