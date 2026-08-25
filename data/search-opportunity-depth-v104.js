'use strict';

// APG Search Opportunity Depth v104.0
// Six deliberately curated high-intent decision areas. This deepens existing
// category, guide and comparison routes without manufacturing new catalogue scale.
// These are editorial priority areas derived from APG's maintained evidence/depth
// programme; they are not presented as a claim about live Search Console demand.

const VERSION='104.0';
const REVIEWED='2026-08-25';

const categoryDepth=Object.freeze({
  televisions:Object.freeze({
    label:'Televisions',
    intent:'Choose the right TV for the room, viewing mix and screen size before comparing feature lists.',
    decisions:Object.freeze([
      'Start with screen size and viewing distance, then confirm the TV physically fits the intended space.',
      'Choose panel and backlight technology around room brightness, movie viewing and budget rather than assuming one technology is universally best.',
      'For gaming, verify the exact model and size for refresh rate, VRR and HDMI capability instead of relying on family-level marketing.',
      'Treat the smart-TV platform as an ecosystem choice only after picture, size and connection requirements are satisfied.'
    ]),
    avoid:'Do not compare TVs by a single headline such as peak brightness, refresh rate or panel label. Those numbers can hide model-size differences and may not describe the room you actually watch in.',
    verify:Object.freeze(['Exact Australian model and screen size','Dimensions with and without the stand','Required HDMI and gaming features on that exact model','Current retailer price, stock and warranty terms']),
    comparisonQuestions:Object.freeze(['Which screen size actually fits the room and viewing distance?','Which display technology better suits the room brightness and viewing mix?','Which exact HDMI, VRR and refresh features are required?','What compromise comes with the cheaper option?','Is the current Australian price gap worth the differences that matter to you?'])
  }),
  laptops:Object.freeze({
    label:'Laptops',
    intent:'Choose around software compatibility, portability and the configuration you will live with for years.',
    decisions:Object.freeze([
      'Confirm required software, peripherals and operating-system constraints before comparing processors or design.',
      'Treat memory and storage as long-term constraints where the selected laptop cannot be practically upgraded later.',
      'Balance display quality against battery, weight and portability instead of maximising every specification.',
      'Check ports and docking needs for the way the laptop will actually be used at home, university or work.'
    ]),
    avoid:'Do not choose from benchmark headlines alone. A fast laptop can still be the wrong purchase when an application, peripheral, port, battery requirement or operating system does not fit the job.',
    verify:Object.freeze(['Exact Australian configuration or model code','Required application and peripheral compatibility','Memory and storage configuration','Ports, charger and external-display requirements']),
    comparisonQuestions:Object.freeze(['Do both laptops run the software and peripherals you actually need?','Which operating-system ecosystem is the better long-term fit?','Are memory and storage sufficient for the ownership period?','Which display, battery, weight and port trade-offs matter in daily use?','Does the current Australian price gap buy capability you will use?'])
  }),
  'washing-machines':Object.freeze({
    label:'Washing machines',
    intent:'Start with household load, installation fit and efficiency; treat smart functions as secondary.',
    decisions:Object.freeze([
      'Confirm capacity against normal household loads rather than buying the largest drum by default.',
      'Measure the installation space, access path, plumbing and door clearance before comparing convenience features.',
      'Compare energy and water efficiency alongside the cycles you will actually use.',
      'Decide whether automatic dosing, quick cycles and connected features will genuinely change the weekly routine.'
    ]),
    avoid:'Do not let an AI, app or quick-cycle label override the hard constraints: capacity, physical fit, water and energy use, cycle needs and serviceability.',
    verify:Object.freeze(['Cabinet dimensions and door clearance','Exact WELS and energy information for the model','Cycle conditions behind headline quick-wash claims','Current warranty, delivery and installation terms']),
    comparisonQuestions:Object.freeze(['Which capacity fits normal household loads without unnecessary oversizing?','Will each machine physically fit the space, access path and door clearance?','How do water and energy requirements compare for the cycles you will actually use?','Will auto dosing, quick cycles or connected features change the routine?','What are the current delivery, installation and warranty differences?'])
  }),
  'coffee-machines':Object.freeze({
    label:'Coffee machines',
    intent:'Choose the workflow first: hands-on espresso, guided preparation or convenience-focused automation.',
    decisions:Object.freeze([
      'Decide how much grinding, dosing, tamping and milk texturing you genuinely want to do each day.',
      'Match the milk system to the drinks and number of back-to-back coffees normally made.',
      'Measure bench width and depth before moving up to a larger machine for features you may not use.',
      'Treat cold-drink capability, bean switching and drink breadth as preferences after the core workflow fits.'
    ]),
    avoid:'Do not buy a premium machine because it has more drink names or automation if you actually want manual control — or buy a manual machine if the routine will stop you using it.',
    verify:Object.freeze(['Bench dimensions and clearances','Manual, guided or one-touch workflow','Milk system and cleaning routine','Current Australian retailer price and exact model']),
    comparisonQuestions:Object.freeze(['Which workflow will you still enjoy on a busy weekday?','How much milk automation or manual control do you actually want?','Will both machines fit the available bench space and cleaning routine?','Do cold drinks, bean switching or wider drink menus matter enough to pay for?','Which trade-off remains after the current Australian price difference is considered?'])
  }),
  'robot-vacuums':Object.freeze({
    label:'Robot vacuums',
    intent:'Choose the cleaning system and maintenance burden before chasing the largest suction number.',
    decisions:Object.freeze([
      'Decide whether the home needs vacuum-only cleaning or meaningful automated mopping.',
      'Treat dock emptying, washing and drying as a maintenance decision with real space requirements.',
      'For pets and cluttered homes, prioritise hair management, obstacle behaviour and reliable navigation alongside suction.',
      'Check thresholds, rugs and floor transitions that can determine whether automation works across the whole home.'
    ]),
    avoid:'Do not rank robot vacuums by stated Pa suction alone. Navigation, brush design, mopping, dock automation and the layout of the home can change the practical fit.',
    verify:Object.freeze(['Dock footprint and servicing clearance','Mopping and station functions on the exact variant','Threshold and floor compatibility','Consumables, retailer support and current availability']),
    comparisonQuestions:Object.freeze(['Which cleaning system better matches the floors, rugs and pet-hair load?','How much dock automation do you want to maintain and make room for?','Which model better handles the obstacles and transitions in the home?','Are the mopping differences meaningful for your floor mix?','What are the current consumable, support and Australian retailer differences?'])
  }),
  smartphones:Object.freeze({
    label:'Smartphones',
    intent:'Choose ecosystem and size first, then decide how much camera, storage and charging capability you actually need.',
    decisions:Object.freeze([
      'Start with iOS versus Android based on devices, apps, services and workflow — not brand loyalty alone.',
      'Choose phone size and weight for everyday handling before paying for a larger display or battery.',
      'Define the camera jobs that matter: everyday photos, zoom, video, low light or social capture.',
      'Choose storage for the ownership period and check charging and accessory compatibility before purchase.'
    ]),
    avoid:'Do not use one camera megapixel, benchmark score or AI feature as a proxy for the whole phone. Ecosystem, size, camera system, storage and support horizon all matter.',
    verify:Object.freeze(['Exact Australian model and storage option','SIM, eSIM and carrier requirements','Charging accessories and standards','Software-support and warranty information from the manufacturer']),
    comparisonQuestions:Object.freeze(['Which ecosystem better fits your existing devices, apps and services?','Which size and weight is more comfortable for daily use?','Which camera system is stronger for the photos and video you actually take?','Which storage and charging setup will suit the ownership period?','Does the current Australian price gap justify the capability difference for you?'])
  })
});

module.exports={VERSION,REVIEWED,categoryDepth};
