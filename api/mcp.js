'use strict';

const auth=require('../lib/apg-mcp-auth-v1');
const tools=require('../lib/apg-mcp-v1');

function textResult(value){return {content:[{type:'text',text:JSON.stringify(value)}],structuredContent:value};}

async function buildServer(){
  const [{McpServer},z]=await Promise.all([import('@modelcontextprotocol/server'),import('zod/v4')]);
  const server=new McpServer({name:'Australian Product Guide Growth Intelligence',version:'1.0.0'});
  const annotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:true};

  server.registerTool('google_connection_status',{
    title:'Google Growth Connection Status',
    description:'Use this when you need to verify Australian Product Guide access to Google Search Console and Google Analytics 4.',
    inputSchema:z.object({}),annotations
  },async()=>textResult(await tools.connectionStatus()));

  server.registerTool('search_console_performance',{
    title:'Search Console Performance',
    description:'Use this when you need APG Google Search Console query, page, device, country or date performance for a specified period.',
    inputSchema:z.object({
      startDate:z.string().optional().describe('YYYY-MM-DD; defaults to 28 days ago'),
      endDate:z.string().optional().describe('YYYY-MM-DD; defaults to yesterday'),
      dimensions:z.array(z.enum(['query','page','country','device','date','searchAppearance'])).max(3).optional(),
      rowLimit:z.number().int().min(1).max(250).optional(),
      query:z.string().max(180).optional(),
      page:z.string().max(500).optional()
    }),annotations
  },async input=>textResult(await tools.searchConsolePerformance(input)));

  server.registerTool('ga4_report',{
    title:'GA4 Report',
    description:'Use this when you need a read-only Google Analytics 4 report for Australian Product Guide traffic, engagement, pages, channels, devices or events.',
    inputSchema:z.object({
      startDate:z.string().max(30).optional().describe('GA4 date such as 28daysAgo or 2026-08-01'),
      endDate:z.string().max(30).optional().describe('GA4 date such as yesterday or 2026-08-20'),
      dimensions:z.array(z.enum(['date','pagePath','pageTitle','sessionDefaultChannelGroup','country','deviceCategory','eventName','firstUserDefaultChannelGroup'])).max(3).optional(),
      metrics:z.array(z.enum(['activeUsers','sessions','engagedSessions','screenPageViews','eventCount','conversions','userEngagementDuration'])).max(6).optional(),
      limit:z.number().int().min(1).max(250).optional()
    }),annotations
  },async input=>textResult(await tools.ga4Report(input)));

  server.registerTool('growth_opportunities',{
    title:'APG Organic Growth Opportunities',
    description:'Use this when you need a prioritised, explainable shortlist of APG organic-search opportunities based on Search Console impressions, CTR and ranking position.',
    inputSchema:z.object({startDate:z.string().optional(),endDate:z.string().optional(),limit:z.number().int().min(1).max(50).optional()}),annotations
  },async input=>textResult(await tools.growthOpportunities(input)));
  return server;
}

module.exports=async function handler(req,res){
  const token=auth.bearer(req);
  const access=await auth.validateOperatorToken(token);
  if(!access.ok)return auth.challenge(res,access.status,access.error);
  try{
    const [{NodeStreamableHTTPServerTransport},server]=await Promise.all([import('@modelcontextprotocol/node'),buildServer()]);
    const transport=new NodeStreamableHTTPServerTransport({sessionIdGenerator:undefined});
    await server.connect(transport);
    await transport.handleRequest(req,res);
  }catch(error){
    console.error('[APG MCP]',error&&error.message||error);
    if(!res.headersSent){res.statusCode=500;res.setHeader('Content-Type','application/json; charset=utf-8');}
    if(!res.writableEnded)res.end(JSON.stringify({error:'mcp_server_error'}));
  }
};
