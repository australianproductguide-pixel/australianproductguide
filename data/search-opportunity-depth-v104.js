'use strict';

// APG Search Opportunity Depth v104.0
// Six deliberately curated high-intent decision areas. This module deepens existing
// category/guide/comparison routes; it does not create catalogue scale for its own sake.
// The shortlist reflects APG's current maintained priority architecture (v41/v42), not
// an invented claim about live Search Console demand.

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
    verify:Object.freeze(['Exact Australian model and screen size','Dimensions with and without the stand','Required HDMI / gaming features on that exact model','Current retailer price, stock and warranty terms']),
    pair:Object.freeze({
      a:'lg-oled-evo-c6-55-inch-oled55c6psa',
      b:'tcl-c8k-65-inch-premium-qd-miniled-tv',
      aWhen:'Prioritise a 55-inch OLED option, Dolby Vision and high-refresh gaming features, and the room conditions suit OLED.',
      bWhen:'Prioritise a larger 65-inch Mini LED option, bright-room intent and Google TV.',
      tradeoffs:Object.freeze(['55-inch versus 65-inch fit and viewing distance','OLED versus Mini LED priorities','Room brightness and reflection conditions','Gaming inputs and exact refresh behaviour','Current Australian price gap'])
    })
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
    verify:Object.freeze(['Exact Australian configuration / model code','Required application and peripheral compatibility','Memory and storage configuration','Ports, charger and external-display requirements']),
    pair:Object.freeze({
      a:'apple-macbook-air-13-inch-m5',
      b:'microsoft-surface-laptop-13-8-inch-8th-edition',
      aWhen:'Prioritise macOS, Apple ecosystem fit and a light 13-inch-class laptop, and required software is compatible.',
      bWhen:'Prioritise Windows, a touchscreen and the Surface form factor, and required Windows-on-Arm software and peripherals are compatible.',
      tradeoffs:Object.freeze(['macOS versus Windows workflow','Application and peripheral compatibility','Touchscreen requirement','Ports and docking','Exact memory and storage configuration'])
    })
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
    avoid:'Do not let an AI, app or quick-cycle label override the hard constraints: capacity, physical fit, water/energy use, cycle needs and serviceability.',
    verify:Object.freeze(['Cabinet dimensions and door clearance','Exact WELS and energy information for the model','Cycle conditions behind headline quick-wash claims','Current warranty, delivery and installation terms']),
    pair:Object.freeze({
      a:'samsung-bespoke-ai-front-load-washer-auto-dispense-9kg',
      b:'lg-9kg-series-9-front-load-washer',
      aWhen:'Prioritise a 9kg front loader with automatic dosing and Samsung SmartThings features.',
      bWhen:'Prioritise a 9kg front loader with LG ThinQ, AI DD and the maintained fast-cycle option.',
      tradeoffs:Object.freeze(['Automatic dosing preference','Normal versus quick-cycle use','Connected-home ecosystem','Installation depth and clearance','Current efficiency and retailer terms'])
    })
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
    pair:Object.freeze({
      a:'breville-barista-express-impress-bes876',
      b:'breville-barista-touch-impress-bes881',
      aWhen:'Prefer assisted dosing and tamping with a more hands-on espresso and manual milk workflow at a lower product tier.',
      bWhen:'Prefer touchscreen guidance, assisted puck preparation and automatic milk, including the maintained cold-drink capability.',
      tradeoffs:Object.freeze(['Manual versus touchscreen-guided workflow','Manual versus automatic milk preparation','Cold-drink requirement','Bench space','Current Australian price difference'])
    })
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
    verify:Object.freeze(['Dock footprint and servicing clearance','Mopping and station functions on the exact variant','Threshold / floor compatibility','Consumables, retailer support and current availability']),
    pair:Object.freeze({
      a:'eufy-robot-vacuum-omni-e28',
      b:'ecovacs-deebot-x11-pro-omni',
      aWhen:'Prioritise the maintained E28 combination of HydroJet mopping, Omni-station automation and the detachable portable deep cleaner.',
      bWhen:'Prioritise the maintained X11 PRO OMNI obstacle-avoidance and fast-charge automation feature set.',
      tradeoffs:Object.freeze(['Mopping system','Portable deep-cleaning requirement','Obstacle-avoidance priorities','Dock and maintenance workflow','Current Australian price and availability'])
    })
  }),
  smartphones:Object.freeze({
    label:'Smartphones',
    intent:'Choose ecosystem and size first, then decide how much camera, storage and charging capability you actually need.',
    decisions:Object.freeze([
      'Start with iOS versus Android based on devices, apps, services and workflow — not brand loyalty alone.',
      'Choose phone size and weight for everyday handling before paying for a larger display or battery.',
      'Define the camera jobs that matter: everyday photos, zoom, video, low light or social capture.',
      'Choose storage for the ownership period and check charging/accessory compatibility before purchase.'
    ]),
    avoid:'Do not use one camera megapixel, benchmark score or AI feature as a proxy for the whole phone. Ecosystem, size, camera system, storage and support horizon all matter.',
    verify:Object.freeze(['Exact Australian model and storage option','SIM / eSIM and carrier requirements','Charging accessories and standards','Software-support and warranty information from the manufacturer']),
    pair:Object.freeze({
      a:'apple-iphone-17',
      b:'samsung-galaxy-s26',
      aWhen:'Prioritise iOS, Apple ecosystem fit and the maintained 6.3-inch iPhone 17 feature set.',
      bWhen:'Prioritise Android, Samsung ecosystem features and the maintained compact Galaxy S26 configuration.',
      tradeoffs:Object.freeze(['iOS versus Android ecosystem','Camera-system priorities','Storage choice','Charging and accessory compatibility','Exact Australian price and plan / retailer terms'])
    })
  })
});

module.exports={VERSION,REVIEWED,categoryDepth};
