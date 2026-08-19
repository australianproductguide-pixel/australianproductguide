'use strict';

const {buildAmazonAuAffiliateUrl,VERIFIED_AT}=require('./amazon-destinations-v39');

function defineEvent({event_name,start_date,end_date,amazon_destination,status='PLANNED',last_verified=VERIFIED_AT}){
  if(!event_name||!start_date||!end_date||!amazon_destination)throw new Error('Seasonal Amazon event requires name, dates and destination');
  const start=new Date(`${start_date}T00:00:00+10:00`),end=new Date(`${end_date}T23:59:59+10:00`);
  if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<start)throw new Error(`Invalid seasonal event dates: ${event_name}`);
  return Object.freeze({
    event_name,start_date,end_date,
    amazon_destination,
    affiliate_destination:buildAmazonAuAffiliateUrl(amazon_destination),
    status,
    last_verified,
    recommendation_weight:0
  });
}

// Intentionally empty until a named Amazon Australia sale event is freshly verified.
// Never add evergreen placeholders such as "Prime Day now on" or "Black Friday sale".
const events=Object.freeze([]);

function activeEvents(at=new Date()){
  const now=at instanceof Date?at:new Date(at);
  if(!Number.isFinite(now.getTime()))return [];
  return events.filter(event=>event.status==='CURRENT'&&now>=new Date(`${event.start_date}T00:00:00+10:00`)&&now<=new Date(`${event.end_date}T23:59:59+10:00`));
}

module.exports={defineEvent,events,activeEvents};
