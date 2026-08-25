'use strict';

// Governance-only exception evidence for Amazon Australia catalogue certification.
// This is NOT a retailer destination database. The canonical Amazon destination truth
// remains data/amazon-au-mappings-v33.js. A fallback only satisfies the v106 completion
// gate when its individual investigation evidence is recorded here to the required standard.
const DOCUMENTED=Object.freeze({
  'breville-barista-pro-bes878':Object.freeze({
    category:'coffee-machines',
    exactModel:'BES878',
    reasonDirectUnavailable:'Australian canonical product identity is confirmed, but a current exact Amazon Australia detail-page match was not independently established to HIGH confidence.',
    searchesPerformed:['Manufacturer Australian model identity review','Historical/current Amazon Australia candidate-ASIN review recorded in Action 5 v100'],
    evidenceChecked:['https://www.breville.com/en-au/product/bes878'],
    candidateAsin:'B07NS3PZYH',
    candidateRejectedBecause:'The candidate is historically strong, but its current Amazon Australia detail-page identity was not independently recovered in the certified review.',
    lastChecked:'2026-08-25',
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
    lastChecked:'2026-08-25',
    nextReviewDate:'2026-09-07',
    certificationStatus:'DOCUMENTED_EXCEPTION'
  }),
  'makita-dhp485-18v-brushless-hammer-driver-drill':Object.freeze({
    category:'cordless-drills',
    exactModel:'DHP485Z',
    reasonDirectUnavailable:'Makita Australia confirms the APG product as DHP485Z. Research recovered ASIN B07KWN1ZWF for DHP485Z outside a current independently verified Amazon Australia detail page, while a separate candidate B099NSX8MN was confirmed to be the different DHP486Z model and was rejected. A direct Amazon AU mapping therefore remains unpromoted until the DHP485Z ASIN is independently tied to a current amazon.com.au detail page.',
    searchesPerformed:['Makita Australia exact-model review for DHP485Z','Amazon Australia and web search for DHP485Z','ASIN-to-model cross-check for B07KWN1ZWF','Wrong-model cross-check against DHP486Z'],
    evidenceChecked:['https://makita.com.au/cordless/lxt-18v-36v/drills-fastening/hammer-driver-drills/dhp485z-18-brushless-hammer-driver-drill','https://www.totaltools.com.au/134201-makita-18v-13mm-brushless-hammer-drill-skin-only-dhp485z'],
    candidateAsin:'B07KWN1ZWF',
    candidateRejectedBecause:'Exact DHP485Z identity is well supported, but APG did not independently recover the candidate ASIN on a current Amazon Australia detail page. DHP486Z ASIN B099NSX8MN is explicitly rejected because it is a different model.',
    lastChecked:'2026-08-25',
    nextReviewDate:'2026-09-08',
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
