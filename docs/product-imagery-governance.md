# APG Product Imagery Governance

Status: CURRENT CONTROL DESIGN — 17 August 2026

## Objective

Australian Product Guide should show one accurate, high-quality product image for every maintained product wherever lawful, verified imagery is available. Missing imagery must remain explicit rather than being filled with a similar product, scraped retailer image, AI recreation or fabricated asset.

## Current architecture

APG uses a single reusable product entity and central image provider path:

`verified image source -> data/product-images.js -> data/image-provenance.js -> shared product renderer -> all APG product surfaces`

The registry is deliberately empty until a real approved image is acquired and verified. This prevents image coverage targets from weakening provenance controls.

`data/product-images.js` is the canonical code-side image registry. The Google Drive Product Register is the durable operating register and already carries retailer, image source, rights/delivery, image URL, verification, variant and availability fields.

## Accepted source types

- `amazon_associates_approved`
- `manufacturer_authorised`
- `retailer_authorised`
- `other_licensed`

Only `verified` records with a documented rights basis, verification date and product-match status may render as product photography.

Match statuses:

- `exact`
- `same_model_immaterial_variant`
- `unverified`

`unverified` imagery cannot be published as verified photography.

## Amazon Australia — current manual phase

Amazon Product Advertising / Creators API access is not assumed to be active.

The current approved manual pathway is:

1. Verify the exact APG product identity and, where available, its exact Amazon Australia ASIN and affiliate product destination.
2. Obtain the image only through a current Amazon Associates-approved linking/image mechanism available to the APG Associates account, such as Basic Display Product Link functionality where available.
3. Record the source, exact ASIN, affiliate destination, image delivery location, rights basis, variant, match status and verification date.
4. Add the image record to `data/product-images.js` only after the evidence is complete.
5. Run `node scripts/product-image-qa.js` and `node scripts/amazon-associates-qa.js`.
6. Publish only if the image passes the release gates.

Amazon Program Content is not treated as an APG-owned neutral asset. APG links the displayed Amazon Program Content image to the corresponding Amazon Australia affiliate destination. Recommendation scoring remains independent of retailer economics.

## Amazon controls

Do not:

- scrape Amazon product pages;
- reverse-engineer Amazon image URLs;
- harvest images with bots or automated extraction tools;
- copy customer-review photographs;
- fabricate Amazon API responses or credentials;
- AI-recreate a real product photograph;
- silently substitute a similar model or materially different variant;
- remove Amazon marks/notices or materially alter Program Content;
- use Amazon Program Content to direct the image click to another retailer.

Where Amazon permits image resizing, preserve the original proportions.

## Example Amazon registry record

```js
images['example-product-slug']={
  asin:'VERIFIED_ASIN',
  amazon_affiliate_url:'https://www.amazon.com.au/.../dp/VERIFIED_ASIN?tag=auproductguid-22',
  image_url:'APPROVED_IMAGE_DELIVERY_URL_OR_SITE_PATH',
  image_source:'Amazon Associates approved manual product-image mechanism',
  image_source_type:'amazon_associates_approved',
  image_rights_basis:'Amazon Associates Program Content used on APG under the current Operating Agreement and Program Policies; acquisition mechanism recorded in APG evidence.',
  image_verified:true,
  image_verified_at:'YYYY-MM-DD',
  image_product_match:'exact',
  image_alt:'Brand Exact Product Name',
  image_status:'verified',
  image_link_url:'https://www.amazon.com.au/.../dp/VERIFIED_ASIN?tag=auproductguid-22',
  variant:'Exact verified variant',
  image_notes:'Evidence/reference to the approved acquisition mechanism and any variant caveat.'
};
```

Do not copy this example with placeholder values into Production.

## Retailer-neutral hero imagery

Where APG later obtains independently licensed manufacturer imagery, prefer it for retailer-neutral product hero presentation. Amazon-specific Program Content can remain within an Amazon offer context. This reduces retailer dependence and avoids using Amazon Program Content to promote competing retailer offers.

## QA release gate

`scripts/product-image-qa.js` reports:

- maintained catalogue products;
- verified imagery count;
- products without verified imagery;
- coverage percentage;
- Amazon Program Content count;
- exact vs immaterial-variant matches;
- registry record count;
- invalid mapping count.

The script fails on invalid provenance, unsafe Amazon linking, ASIN mismatches and duplicate verified image URLs. It does **not** fail merely because a product has no compliant image: gaps are reported and reconciled rather than hidden.

`.github/workflows/product-image-qa.yml` runs the image gate and Amazon Associates QA on pull requests and pushes to `main`.

## Future Amazon API migration

When APG has authorised API credentials, add a provider behind the same normalised image contract rather than rewriting templates. The provider should validate exact product identifiers, authorised image URLs, linking requirements, permitted caching/freshness behaviour and stale/error states before returning a renderable image record.

Do not persist API-derived content beyond what the applicable Amazon terms permit at that time. Re-verify the current API licence before implementation.

## Primary policy references checked 17 August 2026

- Amazon Australia Associates Program Policies and IP License: https://affiliate-program.amazon.com.au/help/operating/policies
- Amazon Australia Associates glossary / Basic Display Product Link: https://affiliate-program.amazon.com.au/help/node/topic/G5KVDATAT5RKBBBG
- Amazon Australia Associates Operating Agreement: https://affiliate-program.amazon.com.au/help/operating/agreement
- Amazon Australia disclosure guidance: https://affiliate-program.amazon.com.au/help/node/topic/GPXFHVYZMTGPUMPE
- Amazon Australia PA API requirements: https://affiliate-program.amazon.com.au/help/node/topic/GVJ2BJP35457CLML

These sources are volatile. Recheck them before material future changes to image acquisition, API integration, caching, linking or disclosure behaviour.
