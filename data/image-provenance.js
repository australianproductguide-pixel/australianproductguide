const IMAGE_REVIEWED='2026-08-16';

/**
 * Central product-image control.
 *
 * A third-party photograph is eligible for display only when the retailer/media
 * record explicitly marks the image as verified and provides a permitted
 * delivery URL. Until then APG renders its own decision illustration. This
 * prevents templates from bypassing image provenance controls.
 */
function imageStatus(product){
  const media=(product.retailers||[]).find(r=>r.imageUrl&&r.imageVerified===true);
  if(media){
    return {
      slug:product.slug,
      kind:'verified-third-party-product-image',
      source:media.imageSource||media.retailer||'Verified third-party source',
      rights:media.imageProvenance||'Verified permitted delivery method recorded in retailer data',
      reviewed:media.verified||IMAGE_REVIEWED,
      productPhotography:true,
      amazonProgramContent:/amazon/i.test(media.retailer||'')||/amazon/i.test(media.imageSource||''),
      displayUrl:media.imageUrl,
      displayLabel:`Product image via ${media.imageSource||media.retailer||'verified source'}`,
      note:media.note||'Product-specific image source and delivery method verified.'
    };
  }
  return {
    slug:product.slug,
    kind:'apg-owned-decision-illustration',
    source:'Australian Product Guide',
    rights:'APG-authored SVG/CSS decision visual',
    reviewed:IMAGE_REVIEWED,
    productPhotography:false,
    amazonProgramContent:false,
    displayUrl:null,
    displayLabel:null,
    note:'No third-party product photograph is displayed until a permitted image source and delivery mechanism are verified.'
  };
}

module.exports={IMAGE_REVIEWED,imageStatus};
