import { useState, useEffect, useCallback } from "react";
import { bridgeSQL } from "@/lib/bridge";

type Row = Record<string, any>;

const C = {
  cyan: "#00ccff", green: "#00e887", amber: "#ffb020",
  red: "#ff4455", violet: "#9f80f0", teal: "#20e0c0",
  muted: "#3d5570", text: "#b0c4d8", hi: "#ddeeff",
};

const SC: Record<string,string> = {
  LIVE:"#00e887", BUILDING:"#00ccff", VERIFYING:"#ffb020",
  DECLARED:"#3d5570", COMPLETE:"#20e0c0", BLOCKED:"#ff4455",
};

function fv(v: any): string {
  if (v===null||v===undefined) return "—";
  if (typeof v==="boolean") return v?"yes":"no";
  if (typeof v==="object") { const s=JSON.stringify(v); return s.length>80?s.slice(0,80)+"…":s; }
  const s=String(v);
  if (s.match(/^\d{4}-\d{2}-\d{2}T/)) return s.slice(0,16).replace("T"," ");
  return s.length>90?s.slice(0,90)+"…":s;
}

function fn(v: any): string {
  const n=parseFloat(v); if(isNaN(n)) return v??"—";
  if(n>=1e6) return `$${(n/1e6).toFixed(2)}M`;
  if(n>=1e4) return `$${(n/1e3).toFixed(1)}K`;
  if(n>=1e3) return n.toLocaleString();
  return n%1===0?n.toString():n.toFixed(2);
}

const Sk=({w="60%",h=12}:{w?:string;h?:number})=>(
  <div className="rounded animate-pulse bg-slate-800" style={{height:h,width:w}}/>
);

function KPI({label,value,sub,accent=C.cyan,loading,sm}:{
  label:string;value?:any;sub?:string;accent?:string;loading?:boolean;sm?:boolean;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-4" style={{borderTop:`2px solid ${accent}`}}>
      {loading?<Sk w="55%" h={sm?20:26}/>:
        <div className="font-black leading-none" style={{fontSize:sm?18:24,color:accent,fontFamily:"monospace"}}>{value??"—"}</div>}
      <div className="text-xs font-semibold tracking-widest uppercase mt-2 text-slate-500">{label}</div>
      {sub&&<div className="text-xs mt-1 text-slate-500">{sub}</div>}
    </div>
  );
}

function SL({icon,title,n}:{icon:string;title:string;n?:number}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{color:C.cyan}}>{icon}</span>
      <span className="text-xs font-bold tracking-widest uppercase text-slate-200">{title}</span>
      {n!=null&&<span className="text-xs text-slate-500">({n})</span>}
    </div>
  );
}

function Tbl({rows,cols,loading,max=8,empty="No records"}:{rows?:Row[];cols?:string[];loading?:boolean;max?:number;empty?:string;}) {
  if(loading) return <div className="flex flex-col gap-2">{[1,2,3].map(i=><Sk key={i} w={`${45+i*12}%`} h={9}/>)}</div>;
  if(!rows?.length) return <p className="text-xs italic text-slate-500 py-2">{empty}</p>;
  const keys=cols||Object.keys(rows[0]).slice(0,6);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{fontSize:11,fontFamily:"monospace"}}>
        <thead>
          <tr>{keys.map(k=><th key={k} className="text-left pb-2 pt-1 px-2 text-slate-500 font-medium border-b border-slate-800" style={{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase"}}>{k.replace(/_/g," ")}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0,max).map((row,i)=>(
            <tr key={i} className="border-b border-slate-800/30">
              {keys.map(k=>{
                const v=row[k];
                let color=C.text;
                if(k==="state"||k==="loop_state") color=SC[v]||C.muted;
                else if(k==="drift_flag") color=v==="OK"?C.green:v==="NO_EVIDENCE"?C.red:C.amber;
                else if(k==="blocking"&&(v===true||v==="yes")) color=C.red;
                else if(k==="status"&&(v==="done"||v==="active"||v==="live")) color=C.green;
                else if(k==="status"&&v==="pending") color=C.amber;
                else if(k==="rdti_eligible"&&(v===true||v==="yes")) color=C.green;
                else if(typeof v==="number"&&/spend|rebate|value|amount|balance/.test(k)) color=C.teal;
                return <td key={k} className="px-2 py-1 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap" style={{color}}>{fv(v)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length>max&&<div className="text-right mt-1 text-slate-500" style={{fontSize:9}}>+{rows.length-max} more</div>}
    </div>
  );
}

function HBar({label,value,max:mx,color=C.cyan}:{label:string;value:number;max:number;color?:string;}) {
  const pct=mx>0?Math.min(100,(value/mx)*100):0;
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="text-slate-500 w-36 text-right overflow-hidden text-ellipsis whitespace-nowrap shrink-0" style={{fontSize:10}}>{label}</div>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full">
        <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:color,minWidth:pct>0?4:0}}/>
      </div>
      <div className="text-slate-400 w-16 text-right shrink-0" style={{fontSize:10,fontFamily:"monospace"}}>{fn(value)}</div>
    </div>
  );
}

const Panel=({children,span=1}:{children:React.ReactNode;span?:number})=>(
  <div className="bg-slate-900 border border-slate-800 rounded-lg p-4" style={{gridColumn:`span ${span}`}}>{children}</div>
);

const TABS=[
  {id:"ops",label:"Loop OS",icon:"⬡"},
  {id:"finance",label:"Finance",icon:"◈"},
  {id:"research",label:"Research",icon:"◎"},
  {id:"infra",label:"Infra",icon:"⬢"},
  {id:"portfolio",label:"Portfolio",icon:"◇"},
  {id:"jobs",label:"Jobs",icon:"◆"},
];

const GC:Record<string,string>={G1:C.cyan,G2:C.green,G3:C.amber,G4:C.violet,G5:C.teal,G6:C.red,G7:"#38bdf8",INFRA:"#64748b",IP:C.teal,OPS:C.green,T4H:C.violet};

export default function LoopOS() {
  const [tab,setTab]=useState("ops");
  const [D,setD]=useState<Record<string,Row[]>>({});
  const [L,setL]=useState<Record<string,boolean>>({});
  const [ts,setTs]=useState(Date.now());

  const load=useCallback(async(key:string,sql:string)=>{
    setL(l=>({...l,[key]:true}));
    try { const {rows}=await bridgeSQL(sql); setD(d=>({...d,[key]:rows})); }
    catch { setD(d=>({...d,[key]:[]})); }
    finally { setL(l=>({...l,[key]:false})); }
  },[]);

  useEffect(()=>{
    load("loopTree","SELECT scope,state,COUNT(*) cnt FROM v_t4h_loop_tree GROUP BY scope,state ORDER BY scope,cnt DESC");
    load("drift","SELECT drift_flag,COUNT(*) cnt FROM v_t4h_drift_report GROUP BY drift_flag ORDER BY cnt DESC");
    load("runs","SELECT entity_id,scope,state_before,state_after,run_at FROM v_t4h_loop_runs_recent LIMIT 10");
    load("tasks","SELECT loop_name,title,blocking,status FROM v_t4h_tasks_open ORDER BY blocking DESC LIMIT 12");
    load("evCov","SELECT entity_id,total_links,real_count,partial_count,real_pct FROM v_t4h_evidence_coverage WHERE total_links>0 ORDER BY total_links DESC");
    load("fanout","SELECT target_system,status,attempts,next_run_at FROM t4h_fanout_job ORDER BY next_run_at");
    load("wire","SELECT event_type,action,outcome,occurred_at FROM t4h_wire_event ORDER BY occurred_at DESC LIMIT 8");
    load("audit","SELECT event_type,action,table_name,timestamp FROM unified_audit_log ORDER BY timestamp DESC LIMIT 8");
    load("mwu","SELECT title,area,status,blocking FROM t4h_must_wire_up WHERE status!='done' ORDER BY blocking DESC LIMIT 8");
    load("maatH","SELECT * FROM v_maat_api_health LIMIT 1");
    load("maatS","SELECT * FROM v_maat_api_summary LIMIT 1");
    load("maatM","SELECT month,total_amount,rd_amount,non_rd_amount FROM maat_monthly_spending ORDER BY month DESC LIMIT 8");
    load("cash","SELECT display_name,account_type,current_balance,institution FROM v_fin_cash_position LIMIT 6");
    load("pnl","SELECT month,line_item,revenue,expense,net FROM v_fin_pnl_monthly ORDER BY month DESC,net DESC LIMIT 10");
    load("rdElig","SELECT * FROM v_rd_eligibility_summary LIMIT 1");
    load("rdMx","SELECT study_id,study_name,study_status,rdti_eligible,maat_spend,rdti_rebate FROM rd_evidence_matrix ORDER BY maat_spend DESC NULLS LAST LIMIT 12");
    load("claims","SELECT claim_text,claim_value,evidence_status,period FROM t4h_claim ORDER BY created_at DESC LIMIT 8");
    load("contemp","SELECT log_date,activity_description FROM contemporaneous_logs ORDER BY log_date DESC LIMIT 6");
    load("mcpH","SELECT * FROM v_mcp_health LIMIT 1");
    load("tools","SELECT tool_id,tool_name,category,production_state FROM t4h_tool_registry WHERE is_active=true ORDER BY category LIMIT 14");
    load("biz","SELECT group_code,COUNT(*) cnt FROM t4h_business_registry WHERE is_active=true GROUP BY group_code ORDER BY group_code");
    load("catKpi","SELECT * FROM v_catalog_kpi LIMIT 1");
    load("sellNow","SELECT offer_name,display_price_aud,price_billing_model FROM v_t4h_sell_now LIMIT 8");
    load("pDrift","SELECT sku,product_name,drift_status,default_price_aud FROM v_t4h_price_drift LIMIT 10");
    load("jobsP","SELECT * FROM v_jobs_pipeline_status LIMIT 1");
    load("tier1","SELECT company,job_title,location,salary_min,salary_max,status FROM v_jobs_tier1_board LIMIT 10");
  },[ts,load]);

  const lbs:Record<string,Record<string,number>>={};
  (D.loopTree||[]).forEach(r=>{ if(!lbs[r.scope]) lbs[r.scope]={}; lbs[r.scope][r.state]=parseInt(r.cnt); });
  const total=Object.values(lbs).flatMap(Object.values).reduce((a,n)=>a+n,0);
  const active=Object.values(lbs).reduce((a,s)=>a+((s.BUILDING||0)+(s.VERIFYING||0)+(s.LIVE||0)),0);
  const dOK=parseInt((D.drift||[]).find(d=>d.drift_flag==="OK")?.cnt||0);
  const dBad=(D.drift||[]).filter(d=>d.drift_flag!=="OK").reduce((a,d)=>a+parseInt(d.cnt),0);
  const ms=(D.maatS?.[0]?.summary as Record<string,any>)||{};
  const jp=D.jobsP?.[0]||{};
  const ck=D.catKpi?.[0]||{};
  const mh=D.maatH?.[0]||{};
  const mcpMeta=(D.mcpH?.[0]?.mcp_health as Record<string,any>)||{};
  const qc=(mcpMeta.queue_counts as Record<string,number>)||{};
  const wk=(mcpMeta.worker_distribution as Record<string,number>)||{};
  const mw=Math.max(...Object.values(wk).map(Number),1);
  const now=new Date().toLocaleString("en-AU",{timeZone:"Australia/Sydney",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});

  return (
    <div className="min-h-screen text-slate-300" style={{background:"#05080f",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{`
        .lg{display:grid;gap:12px}
        .g4{grid-template-columns:repeat(4,1fr)}
        .g3{grid-template-columns:repeat(3,1fr)}
        .g2{grid-template-columns:repeat(2,1fr)}
        @media(max-width:900px){.g4,.g3,.g2{grid-template-columns:1fr 1fr}}
        @media(max-width:600px){.g4,.g3,.g2{grid-template-columns:1fr}}
      `}</style>

      {/* Sub-header */}
      <div className="border-b border-slate-800 px-4 mb-6" style={{background:"#090e18"}}>
        <div className="flex items-center gap-0 overflow-x-auto">
          <div className="pr-5 mr-3 border-r border-slate-800 py-3 shrink-0">
            <div className="text-xs font-black tracking-widest" style={{color:C.cyan}}>LOOP OS</div>
            <div className="text-slate-600" style={{fontSize:8,letterSpacing:"0.15em"}}>T4H MASTER DASHBOARD</div>
          </div>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-4 text-xs font-medium shrink-0 transition-all"
              style={{color:tab===t.id?C.cyan:"#475569",borderBottom:`2px solid ${tab===t.id?C.cyan:"transparent"}`,background:"none",cursor:"pointer"}}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
          <div className="flex-1"/>
          {[[`${active}/${total}`,"loops",C.cyan],[dOK,"drift ok",C.green],[dBad,"attention",dBad>0?C.amber:"#475569"],[fn(ms.rd_spend||0),"R&D",C.teal]].map(([v,l,c])=>(
            <div key={String(l)} className="text-center px-3 border-l border-slate-800 shrink-0">
              <div className="text-sm font-extrabold leading-none" style={{color:String(c),fontFamily:"monospace"}}>{v}</div>
              <div className="text-slate-600 tracking-widest uppercase mt-1" style={{fontSize:8}}>{l}</div>
            </div>
          ))}
          <button onClick={()=>setTs(Date.now())} className="ml-4 px-3 py-2 text-slate-500 border border-slate-800 rounded cursor-pointer hover:text-slate-300 transition-colors shrink-0" style={{fontSize:10,background:"none",fontFamily:"monospace"}}>↺ {now}</button>
        </div>
      </div>

      <div className="px-4 pb-16 flex flex-col gap-3">

        {tab==="ops"&&<>
          <div className="lg g4">
            <KPI label="Total Loops" value={total} loading={L.loopTree}/>
            <KPI label="Active" value={active} accent={C.cyan} sub="BUILDING+VERIFYING+LIVE" loading={L.loopTree}/>
            <KPI label="Loop Runs" value={D.runs?.length} accent={C.green} loading={L.runs}/>
            <KPI label="Open Tasks" value={D.tasks?.length} accent={D.tasks?.some(t=>t.blocking===true||t.blocking==="yes")?C.amber:C.green} sub={`${D.tasks?.filter(t=>t.blocking===true||t.blocking==="yes").length||0} blocking`} loading={L.tasks}/>
          </div>
          <div className="lg g2">
            <Panel>
              <SL icon="⬡" title="Loop State Matrix"/>
              <div className="grid grid-cols-3 gap-3">
                {["PORTFOLIO","BUSINESS","WORKSTREAM"].map(scope=>(
                  <div key={scope}>
                    <div className="text-slate-500 mb-2 font-semibold" style={{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase"}}>{scope}</div>
                    {Object.entries(lbs[scope]||{}).sort((a,b)=>b[1]-a[1]).map(([st,n])=>(
                      <div key={st} className="flex justify-between items-center py-1">
                        <span className="px-1.5 py-0.5 rounded font-bold" style={{fontSize:9,background:(SC[st]||"#3d5570")+"22",color:SC[st]||"#3d5570"}}>{st}</span>
                        <span className="font-bold text-slate-200" style={{fontSize:13,fontFamily:"monospace"}}>{n}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Panel>
            <Panel>
              <SL icon="△" title="Drift Flags"/>
              <div className="grid grid-cols-2 gap-2">
                {(D.drift||[]).map(r=>{
                  const c=r.drift_flag==="OK"?C.green:r.drift_flag==="NO_EVIDENCE"?C.red:C.amber;
                  return <div key={r.drift_flag} className="rounded p-3" style={{background:c+"12",border:`1px solid ${c}30`}}>
                    <div className="text-xl font-black" style={{color:c,fontFamily:"monospace"}}>{r.cnt}</div>
                    <div style={{fontSize:9,color:c,letterSpacing:"0.09em",marginTop:2}}>{r.drift_flag}</div>
                  </div>;
                })}
              </div>
            </Panel>
          </div>
          <div className="lg g2">
            <Panel><SL icon="↻" title="Loop Runs" n={D.runs?.length}/><Tbl rows={D.runs} loading={L.runs} cols={["entity_id","state_before","state_after","run_at"]}/></Panel>
            <Panel><SL icon="◻" title="Open Tasks" n={D.tasks?.length}/><Tbl rows={D.tasks} loading={L.tasks} cols={["loop_name","title","blocking"]}/></Panel>
          </div>
          <div className="lg g2">
            <Panel>
              <SL icon="◈" title="Evidence Coverage"/>
              {!D.evCov?.length&&!L.evCov?<p className="text-xs italic text-slate-500">No evidence links yet</p>
              :(D.evCov||[]).map((r,i)=>(
                <div key={i} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[60%]" style={{fontSize:10}}>{r.entity_id}</span>
                    <span className="text-slate-400" style={{fontSize:10,fontFamily:"monospace"}}>{r.real_count}R·{r.partial_count}P</span>
                  </div>
                  <div className="flex h-1.5 rounded overflow-hidden bg-slate-800">
                    {r.real_count>0&&<div style={{flex:r.real_count,background:C.green}}/>}
                    {r.partial_count>0&&<div style={{flex:r.partial_count,background:C.amber}}/>}
                  </div>
                </div>
              ))}
            </Panel>
            <Panel><SL icon="⊕" title="Audit Trail"/><Tbl rows={D.audit} loading={L.audit} cols={["event_type","action","table_name","timestamp"]}/></Panel>
          </div>
          <div className="lg g3">
            <Panel><SL icon="⟳" title="Fanout Queue" n={D.fanout?.length}/><Tbl rows={D.fanout} loading={L.fanout} cols={["target_system","status","next_run_at"]}/></Panel>
            <Panel><SL icon="⚡" title="Wire Events" n={D.wire?.length}/><Tbl rows={D.wire} loading={L.wire} cols={["event_type","action","outcome","occurred_at"]}/></Panel>
            <Panel><SL icon="⚠" title="Must Wire Up" n={D.mwu?.length}/><Tbl rows={D.mwu} loading={L.mwu} cols={["title","area","status"]}/></Panel>
          </div>
        </>}

        {tab==="finance"&&<>
          <div className="lg g4">
            <KPI label="Total Journals" value={mh.total_journals} loading={L.maatH}/>
            <KPI label="Transactions" value={fn(ms.transactions)} accent={C.teal} loading={L.maatS}/>
            <KPI label="R&D Spend" value={fn(ms.rd_spend)} accent={C.green} loading={L.maatS}/>
            <KPI label="FY26 Unjournalled R&D" value={mh.fy26_unjournalled_rd} accent={mh.fy26_unjournalled_rd>0?C.amber:C.green} loading={L.maatH}/>
          </div>
          <div className="lg g4">
            <KPI label="Accounts" value={ms.accounts} accent={C.violet} sm loading={L.maatS}/>
            <KPI label="Projects" value={ms.projects} accent={C.violet} sm loading={L.maatS}/>
            <KPI label="Timesheet Hrs" value={ms.timesheets_hours} accent={C.teal} sm loading={L.maatS}/>
            <KPI label="RDTI Eligible Txns" value={ms.rd_eligible} accent={C.green} sm loading={L.maatS}/>
          </div>
          <div className="lg g2">
            <Panel>
              <SL icon="$" title="Monthly Spend"/>
              {(D.maatM||[]).map((r,i)=>(
                <div key={i} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500" style={{fontSize:10}}>{String(r.month).slice(0,7)}</span>
                    <span className="text-slate-400" style={{fontSize:10,fontFamily:"monospace"}}>{fn(r.total_amount)}</span>
                  </div>
                  <div className="flex h-2 rounded overflow-hidden bg-slate-800">
                    {parseFloat(r.rd_amount)>0&&<div style={{flex:parseFloat(r.rd_amount),background:C.green}}/>}
                    {parseFloat(r.non_rd_amount)>0&&<div style={{flex:parseFloat(r.non_rd_amount),background:"#1e293b"}}/>}
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span style={{fontSize:9,color:C.green}}>R&D {fn(r.rd_amount)}</span>
                    <span className="text-slate-600" style={{fontSize:9}}>non {fn(r.non_rd_amount)}</span>
                  </div>
                </div>
              ))}
            </Panel>
            <Panel><SL icon="◈" title="Cash Position"/><Tbl rows={D.cash} loading={L.cash} cols={["display_name","account_type","current_balance","institution"]}/></Panel>
          </div>
          <div className="lg g2">
            <Panel><SL icon="◎" title="P&L Monthly"/><Tbl rows={D.pnl} loading={L.pnl} cols={["month","line_item","revenue","expense","net"]} max={10}/></Panel>
            <Panel><SL icon="△" title="Pending Approvals" n={D.pending?.length}/><Tbl rows={D.pending} loading={L.pending} max={8}/></Panel>
          </div>
        </>}

        {tab==="research"&&(()=>{
          const re=D.rdElig?.[0]||{};
          return <>
            <div className="lg g4">
              <KPI label="Project" value={String(re.project_name||"—").slice(0,22)} accent={C.cyan} loading={L.rdElig}/>
              <KPI label="Total Spend" value={fn(re.total_spend)} accent={C.teal} loading={L.rdElig}/>
              <KPI label="Evidence Links" value={re.evidence_links} accent={C.green} loading={L.rdElig}/>
              <KPI label="Txn Count" value={re.txn_count} accent={C.violet} loading={L.rdElig}/>
            </div>
            <Panel><SL icon="◎" title="R&D Evidence Matrix" n={D.rdMx?.length}/><Tbl rows={D.rdMx} loading={L.rdMx} cols={["study_id","study_name","study_status","rdti_eligible","maat_spend","rdti_rebate"]} max={12}/></Panel>
            <div className="lg g2">
              <Panel><SL icon="◈" title="RDTI Claims" n={D.claims?.length}/><Tbl rows={D.claims} loading={L.claims} cols={["claim_text","claim_value","evidence_status","period"]}/></Panel>
              <Panel><SL icon="◻" title="Contemporaneous Log" n={D.contemp?.length}/><Tbl rows={D.contemp} loading={L.contemp} cols={["log_date","activity_description"]}/></Panel>
            </div>
            <Panel>
              <SL icon="◈" title="Evidence Reality"/>
              {(D.evCov||[]).map((r,i)=>(
                <div key={i} className="flex items-center gap-4 mb-3">
                  <div className="text-slate-500 w-64 overflow-hidden text-ellipsis whitespace-nowrap shrink-0" style={{fontSize:10}}>{r.entity_id}</div>
                  <div className="flex-1 flex h-2 rounded overflow-hidden bg-slate-800">
                    {r.real_count>0&&<div style={{flex:r.real_count,background:C.green}}/>}
                    {r.partial_count>0&&<div style={{flex:r.partial_count,background:C.amber}}/>}
                  </div>
                  <div className="flex gap-2 shrink-0" style={{fontSize:10,fontFamily:"monospace"}}>
                    <span style={{color:C.green}}>{r.real_count}R</span>
                    <span style={{color:C.amber}}>{r.partial_count}P</span>
                    <span style={{color:C.cyan}}>{parseFloat(r.real_pct)||0}%</span>
                  </div>
                </div>
              ))}
              {!D.evCov?.length&&!L.evCov&&<p className="text-xs italic text-slate-500">No evidence — run RESEARCH_FINISH workstreams</p>}
            </Panel>
          </>;
        })()}

        {tab==="infra"&&<>
          <div className="lg g4">
            <KPI label="Completed" value={fn(qc.completed)} accent={C.green} loading={L.mcpH}/>
            <KPI label="Failed" value={qc.failed} accent={qc.failed>0?C.red:C.green} loading={L.mcpH}/>
            <KPI label="Cancelled" value={qc.cancelled} accent={C.amber} loading={L.mcpH}/>
            <KPI label="Stale Workers" value={mcpMeta.running_stale||0} accent={(mcpMeta.running_stale||0)>0?C.red:C.green} loading={L.mcpH}/>
          </div>
          {Object.keys(wk).length>0&&<Panel><SL icon="⬢" title="Worker Distribution"/>
            {Object.entries(wk).sort((a,b)=>b[1]-a[1]).map(([w,n])=><HBar key={w} label={w.replace("mac-Troys-MacBook-Air.local-","w-")} value={n} max={mw} color={C.cyan}/>)}
          </Panel>}
          {(mcpMeta.recent_failures as any[])?.length>0&&<Panel><SL icon="✗" title="Recent Failures" n={(mcpMeta.recent_failures as any[]).length}/>
            {(mcpMeta.recent_failures as any[]).map((f:any,i:number)=>(
              <div key={i} className="rounded p-3 mb-2" style={{background:"#ff445518",borderLeft:`3px solid ${C.red}`}}>
                <div style={{fontSize:10,color:C.red,fontFamily:"monospace",marginBottom:4}}>{fv(f.created_at)}</div>
                <div className="text-slate-300 text-xs">{String(f.error).slice(0,140)}…</div>
              </div>
            ))}
          </Panel>}
          <Panel><SL icon="⚙" title="Tool Registry" n={D.tools?.length}/><Tbl rows={D.tools} loading={L.tools} cols={["tool_id","tool_name","category","production_state"]} max={14}/></Panel>
        </>}

        {tab==="portfolio"&&<>
          <div className="lg g4">
            <KPI label="Total Products" value={ck.total_products} loading={L.catKpi}/>
            <KPI label="List Value" value={fn(ck.total_list_value)} accent={C.teal} loading={L.catKpi}/>
            <KPI label="Monthly Recurring" value={fn(ck.monthly_recurring_value)} accent={C.green} loading={L.catKpi}/>
            <KPI label="Stripe Wired" value={ck.stripe_wired} accent={ck.stripe_wired<ck.total_products?C.amber:C.green} sub={`of ${ck.total_products}`} loading={L.catKpi}/>
          </div>
          <Panel>
            <SL icon="◇" title="Business Groups"/>
            <div className="flex flex-wrap gap-2 mb-4">
              {(D.biz||[]).map(g=>{const c=GC[g.group_code]||C.cyan;return(
                <div key={g.group_code} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{background:c+"18",border:`1px solid ${c}40`,color:c}}>
                  {g.group_code} <span style={{opacity:0.7}}>{g.cnt}</span>
                </div>
              );})}
            </div>
          </Panel>
          <div className="lg g2">
            <Panel><SL icon="$" title="Ready to Sell" n={D.sellNow?.length}/><Tbl rows={D.sellNow} loading={L.sellNow} cols={["offer_name","display_price_aud","price_billing_model"]}/></Panel>
            <Panel><SL icon="△" title="Price Drift" n={D.pDrift?.length}/><Tbl rows={D.pDrift} loading={L.pDrift} cols={["sku","product_name","drift_status","default_price_aud"]}/></Panel>
          </div>
        </>}

        {tab==="jobs"&&<>
          <div className="lg g4">
            <KPI label="Tier 1 Targets" value={jp.tier1_count} accent={C.cyan} loading={L.jobsP}/>
            <KPI label="Tier 2" value={jp.tier2_count} accent={C.teal} loading={L.jobsP}/>
            <KPI label="Total Listings" value={jp.total_listings} accent={C.violet} loading={L.jobsP}/>
            <KPI label="Applied" value={jp.applied_listings||0} accent={jp.applied_listings>0?C.green:C.amber} loading={L.jobsP}/>
          </div>
          <Panel><SL icon="◆" title="Tier 1 Board" n={D.tier1?.length}/><Tbl rows={D.tier1} loading={L.tier1} cols={["company","job_title","location","salary_min","salary_max","status"]} max={10}/></Panel>
        </>}

      </div>
    </div>
  );
}
