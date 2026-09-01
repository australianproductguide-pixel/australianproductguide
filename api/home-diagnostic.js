'use strict';

// Temporary P0-only endpoint. Public `/` remains protected by the Vercel edge redirect.
// This endpoint exists solely to exercise cumulative native-Home runtime checkpoints in
// separate serverless invocations. Remove it when native Home is restored and certified.
const bisect=require('../lib/p0-home-bisect-v2');
module.exports=bisect.handler;
