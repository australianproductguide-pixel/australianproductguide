const IMAGE_REVIEWED='2026-08-16';

/**
 * APG product-image control.
 *
 * The current production application deliberately uses APG-authored decision
 * illustrations rather than copying, scraping or hotlinking third-party
 * product photography. A product-specific photograph can replace this only
 * when its source, permitted delivery mechanism and review date are recorded.
 */
function imageStatus(product){
  return {
    slug:product.slug,
    kind:'apg-owned-decision-illustration',
    source:'Australian Product Guide',
    rights:'APG-authored SVG/CSS decision visual',
    reviewed:IMAGE_REVIEWED,
    productPhotography:false,
    amazonProgramContent:false,
    note:'No third-party product photograph is displayed until a permitted image source and delivery mechanism are verified.'
  };
}

module.exports={IMAGE_REVIEWED,imageStatus};
