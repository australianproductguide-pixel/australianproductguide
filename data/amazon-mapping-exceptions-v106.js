'use strict';

// Governance-only exception evidence for Amazon Australia catalogue certification.
// This is NOT a retailer destination database. The canonical Amazon destination truth
// remains data/amazon-au-mappings-v33.js. A fallback only satisfies the v106 completion
// gate when its individual investigation evidence is recorded here to the required standard.
const DOCUMENTED=Object.freeze({
  'philips-3000-series-dual-basket-na35310':Object.freeze({
    category:'air-fryers',
    exactModel:'NA353/10',
    reasonDirectUnavailable:'Australian canonical product identity is confirmed, but APG could not independently establish a current Amazon Australia detail-page identity to HIGH confidence. Candidate ASIN B0DK74HSQC remains unpromoted.',
    searchesPerformed:['Manufacturer Australian model identity review','Existing Amazon Australia candidate-ASIN review recorded in Action 5 v100'],
    evidenceChecked:['https://www.philips.com.au/c-p/NA353_10/3000-series-dual-basket-airfryer'],
    candidateAsin:'B0DK74HSQC',
    candidateRejectedBecause:'Current Amazon Australia detail-page identity was not independently recovered to APG HIGH-confidence standard.',
    lastChecked:'2026-08-24',
    nextReviewDate:'2026-09-23',
    certificationStatus:'DOCUMENTED_EXCEPTION'
  }),
  'breville-barista-pro-bes878':Object.freeze({
    category:'coffee-machines',
    exactModel:'BES878',
    reasonDirectUnavailable:'Australian canonical product identity is confirmed, but a current exact Amazon Australia detail-page match was not independently established to HIGH confidence.',
    searchesPerformed:['Manufacturer Australian model identity review','Historical/current Amazon Australia candidate-ASIN review recorded in Action 5 v100'],
    evidenceChecked:['https://www.breville.com/en-au/product/bes878'],
    candidateAsin:'B07NS3PZYH',
    candidateRejectedBecause:'The candidate is historically strong, but its current Amazon Australia detail-page identity was not independently recovered in the certified review.',
    lastChecked:'2026-08-24',
    nextReviewDate:'2026-09-07',
    certificationStatus:'DOCUMENTED_EXCEPTION'
  }),
  'delonghi-eletta-explore-ecam45086t':Object.freeze({
    category:'coffee-machines',
    exactModel:'ECAM450.86.T',
    reasonDirectUnavailable:'Australian canonical product identity is confirmed, but a current exact Amazon Australia detail-page match was not independently established to HIGH confidence.',
    searchesPerformed:['Manufacturer Australian model identity review','Existing Amazon Australia candidate-ASIN review recorded in Action 5 v100'],
    evidenceChecked:['https://www.delonghi.com/en-au/eletta-explore-hot-cold-coffee-maker-ecam450-86-t/p/ECAM450.86.T'],
    candidateAsin:'B0BTYWV92W',
    candidateRejectedBecause:'Current exact Amazon Australia detail-page identity was not independently established to APG HIGH-confidence standard.',
    lastChecked:'2026-08-24',
    nextReviewDate:'2026-09-07',
    certificationStatus:'DOCUMENTED_EXCEPTION'
  })
});

const SAFETY_EXCEPTIONS=Object.freeze({
  'anker-power-bank-20000mah-22-5w':Object.freeze({
    category:'power-banks',
    exactModel:'A1647',
    reasonDirectUnavailable:'APG resolves this record to recalled Anker model A1647. Product safety/currentness overrides retailer coverage, so APG intentionally suppresses Amazon purchase and search pathways.',
    searchesPerformed:['Canonical model resolution','Australian recall verification'],
    evidenceChecked:['https://www.anker.com/au/a1647-recall','https://www.anker.com/au/rc2506'],
    candidateAsin:null,
    candidateRejectedBecause:'No retailer destination is appropriate while the resolved product is subject to an Australian recall.',
    lastChecked:'2026-08-24',
    nextReviewDate:'2026-09-07',
    certificationStatus:'SAFETY_SUPPRESSED'
  })
});

module.exports={DOCUMENTED,SAFETY_EXCEPTIONS};
