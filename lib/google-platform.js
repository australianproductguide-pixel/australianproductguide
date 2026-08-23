const app=require('./app');

const PRIMARY_HOST='australianproductguide.au';
const MEASUREMENT_ID='G-PV16VQTVY4';
const VERIFICATION_PATH='/google2e35d1ac089ebb56.html';
const VERIFICATION_BODY='google-site-verification: google2e35d1ac089ebb56.html';
const SITEMAP_NAMESPACE='http://www.sitemaps.org/schemas/sitemap/0.9';

const GOOGLE_TAG=`<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});window.apgLoadGoogleAnalytics=window.apgLoadGoogleAnalytics||function(){if(window.__apgGaLoaded)return;window.__apgGaLoaded=true;gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}';document.head.appendChild(s);const cleanUrl=value=>{try{const u=new URL(value,window.location.origin);return u.origin+u.pathname}catch{return ''}};const safeTitle=window.location.pathname==='/search/'?'Search | Australian Product Guide':document.title;gtag('config','${MEASUREMENT_ID}',{page_location:cleanUrl(window.location.href),page_referrer:cleanUrl(document.referrer),page_title:safeTitle,allow_google_signals:false,allow_ad_personalization_signals:false});};</script>`;

const PRIVACY_DISCLOSURE=`<h2 id="cookies">6. Cookies, browser storage and analytics</h2><p>APG uses essential browser storage for features such as privacy choices, optional signed-in sessions and browser-local product research. Core browsing, search, comparison and recommendation features remain available without allowing analytics. APG asks before enabling Google Analytics 4 (GA4). If you allow analytics, GA4 may use a first-party analytics identifier cookie and collect technical usage information such as page views, browser/device information and coarse location derived from network information. APG configures the Google tag to disable Google Signals and advertising-personalisation signals, keeps advertising consent types denied, and sends the page path without query-string values so search terms, finder inputs and URL parameters are not intentionally included in the Analytics page-location field. Google states that IP addresses used for GA4 location derivation are discarded before being logged. Analytics data does not alter APG product-suitability scores, retailer ranking or affiliate ranking. You can change your analytics choice at any time using Cookie preferences in the site footer.</p><p>APG also samples first-party browser performance measurements such as Largest Contentful Paint, Cumulative Layout Shift, Interaction to Next Paint, First Contentful Paint and Time to First Byte. That performance payload contains the page path, broad viewport class and navigation type, but no query string, account identifier or persistent APG analytics identifier. It is sent to APG's own endpoint and recorded in hosting logs for performance diagnosis. Hosting, security infrastructure and third-party services may also process technical data required to operate their services.</p>`;

function requestHost(req){
  return String(req.headers['x-forwarded-host']||req.headers.host||'').toLowerCase().split(':')[0];
}

function extendCsp(value){
  let csp=String(value||'');
  csp=csp.replace("script-src 'self' 'unsafe-inline'","script-src 'self' 'unsafe-inline' https://www.googletagmanager.com");
  csp=csp.replace("img-src 'self' data: https://*.media-amazon.com https://m.media-amazon.com","img-src 'self' data: https://*.media-amazon.com https://m.media-amazon.com https://www.google-analytics.com https://*.google-analytics.com");
  csp=csp.replace("connect-src 'self' https://gozovvhofdsshjuixcys.supabase.co","connect-src 'self' https://gozovvhofdsshjuixcys.supabase.co https://www.google-analytics.com https://*.google-analytics.com");
  return csp;
}

function applyPrivacyDisclosure(body){
  return body.replace(/<h2 id="cookies">\d+\. Cookies and analytics<\/h2><p>[\s\S]*?<\/p>/,PRIVACY_DISCLOSURE);
}

function applySitemapNamespace(body){
  return body.replace('xmlns="http://www.sitemaps.org/sitemap/0.9"',`xmlns="${SITEMAP_NAMESPACE}"`);
}

module.exports=(req,res)=>{
  let parsed=null;
  let pathname='';
  try{parsed=new URL(req.url,`https://${PRIMARY_HOST}`);pathname=parsed.pathname;}catch{}

  const host=requestHost(req);
  if(process.env.VERCEL_ENV==='production'&&(host.endsWith('.vercel.app')||host===`www.${PRIMARY_HOST}`)){
    res.statusCode=308;
    res.setHeader('Location',`https://${PRIMARY_HOST}${parsed?parsed.pathname+parsed.search:'/'}`);
    res.setHeader('Cache-Control','public, max-age=3600');
    res.setHeader('X-Robots-Tag','noindex');
    return res.end();
  }

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
    const contentType=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'){
      if(pathname==='/sitemap.xml'&&contentType.startsWith('application/xml'))body=applySitemapNamespace(body);
      if(contentType.startsWith('text/html')){
        if(body.includes('</head>')&&!body.includes('window.apgLoadGoogleAnalytics'))body=body.replace('</head>',GOOGLE_TAG+'</head>');
        if(pathname==='/privacy/')body=applyPrivacyDisclosure(body);
      }
    }
    return originalEnd(body,...args);
  };

  return app(req,res);
};