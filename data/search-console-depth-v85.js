'use strict';

// APG Search Console Depth v85
// Targeted evidence-depth correction for an existing search-visible comparison.
// This is deliberately narrow: it does not create comparison pages from keyword
// demand alone. It corrects the Philips 5000 Australian variant and upgrades the
// maintained product record using the exact Philips Australia product page.
const VERIFIED='2026-08-23';
const NEXT_REVIEW='2026-09-22';
const OLD_SLUG='philips-5000-series-handheld-steamer-sth5030-80';
const NEW_SLUG='philips-5000-series-handheld-steamer-sth5030-20';
const SOURCE='https://www.philips.com.au/c-p/STH5030_20/handheld-steamer-5000-series';

function evidence(value,unit,note){
  return {value,...(unit?{unit}:{}),source:SOURCE,sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high',...(note?{note}:{} )};
}

function apply({expandedCategories,retailersFor}){
  const category=expandedCategories&&expandedCategories['garment-steamers'];
  if(!category)throw new Error('Search Console Depth v85: garment-steamers category not found');
  const product=category.products.find(p=>p.slug===OLD_SLUG||p.slug===NEW_SLUG||String(p.name||'').includes('STH5030/80')||String(p.name||'').includes('STH5030/20'));
  if(!product)throw new Error('Search Console Depth v85: Philips 5000 steamer record not found');

  product.name='5000 Series Handheld Steamer STH5030/20';
  product.slug=NEW_SLUG;
  product.model='STH5030/20';
  product.summary='A higher-output handheld garment steamer for buyers who want Eco and Max steam settings, horizontal as well as vertical steaming, and larger interchangeable water tanks without moving to an upright steamer.';
  product.highlights=[
    'Up to 24 g/min continuous steam from a 1400 W rating at 240 V',
    '35-second heat-up with Eco and Max steam settings',
    '120 ml and 200 ml detachable tanks, heated metal plate, horizontal and vertical steaming, and StyleMat support'
  ];
  product.watch='It is larger and heavier than the foldable 3000 Series and takes about five seconds longer to heat. Choose it for stronger steam, larger tanks and horizontal steaming rather than maximum compactness.';
  product.source=SOURCE;
  product.sourceType='Official Philips Australia exact-model product/specification page';
  product.tags=[...new Set(['balanced','handheld','high-steam','horizontal-steaming','two-steam-levels','large-tank','heated-plate',...(product.tags||[]).filter(t=>t!=='compact')])];
  product.evidenceTier='deep';
  product.evidenceLabel='Manufacturer-verified Australian evidence';
  product.testingStatus='Desk-researched / manufacturer specification evidence; no hands-on testing claimed';
  product.publicationStatus='LIVE / MAINTAINED';
  product.lastSubstantiveReview=VERIFIED;
  product.lastSourceVerification=VERIFIED;
  product.lastReviewed=VERIFIED;
  product.nextReviewDue=NEXT_REVIEW;
  product.freshnessStatus='reviewed-this-month';
  product.legacySlugs=[...new Set([...(product.legacySlugs||[]),OLD_SLUG])];
  product.specs=[
    ['Exact Australian model','STH5030/20'],
    ['Heat-up time','35 sec'],
    ['Continuous steam','Up to 24 g/min'],
    ['Power','Up to 1400 W at 240 V'],
    ['Steam settings','Eco and Max'],
    ['Steam plate','Heated metal plate'],
    ['Steaming orientation','Vertical and horizontal'],
    ['Water tanks','120 ml and 200 ml detachable tanks'],
    ['Head','Adjustable tilting head'],
    ['Cord','2 m'],
    ['Dimensions','31.7 x 9.7 x 8.6 cm'],
    ['Weight','800 g'],
    ['Warranty','2 years']
  ];
  product.decisionAttributes={
    ...(product.decisionAttributes||{}),
    continuousSteamGMin:24,
    powerW:1400,
    heatUpSeconds:35,
    steamLevels:2,
    horizontalSteaming:true,
    verticalSteaming:true,
    heatedMetalPlate:true,
    maxTankMl:200,
    smallerTankMl:120,
    tiltingHead:true,
    weightG:800,
    warrantyYears:2
  };
  product.factEvidence={
    ...(product.factEvidence||{}),
    exactModel:evidence('STH5030/20',null,'Australian Philips product identity.'),
    continuousSteamGMin:evidence(24,'g/min','Manufacturer states up to 24 g/min.'),
    powerW:evidence(1400,'W','Manufacturer rating at 240 V.'),
    heatUpSeconds:evidence(35,'sec'),
    steamLevels:evidence(2,null,'Eco and Max settings.'),
    horizontalSteaming:evidence(true,null,'Philips documents horizontal as well as vertical steaming.'),
    heatedMetalPlate:evidence(true,null,'Philips describes an active heated metal steam plate.'),
    maxTankMl:evidence(200,'ml','Two detachable tanks are supplied: 120 ml and 200 ml.'),
    weightG:evidence(800,'g'),
    warrantyYears:evidence(2,'years')
  };

  if(typeof retailersFor==='function')product.retailers=retailersFor(product);
  return product;
}

module.exports={VERSION:'85.0',VERIFIED,NEXT_REVIEW,OLD_SLUG,NEW_SLUG,SOURCE,apply};
