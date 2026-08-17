#!/usr/bin/env node
const {qualitySnapshot}=require('../lib/intelligence-quality-v41');
const out=qualitySnapshot();
process.stdout.write(JSON.stringify(out,null,2)+'\n');
if(process.argv.includes('--gate')&&!out.releaseGate.pass)process.exitCode=1;