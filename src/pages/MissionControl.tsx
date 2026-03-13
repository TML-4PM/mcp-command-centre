import { useState, useEffect, useCallback } from "react";

const INITIAL_ITEMS = [
  { id:"T001", cat:"INFRA", title:"Deploy t4h-bootstrap CFN stack", owner:"Troy", priority:"P1", status:"open", notes:"" },
  { id:"T002", cat:"INFRA", title:"Batch-delete 129 dead Lambdas", owner:"Troy", priority:"P1", status:"open", notes:"GATED — dry-run first" },
  { id:"T003", cat:"INFRA", title:"Set DATABASE_URL on troy-sql-executor", owner:"Troy", priority:"P1", status:"done", notes:"Deployed 2026-03-09" },
  { id:"T004", cat:"BASIQ", title:"Open BASIQ consent URL", owner:"Troy", priority:"P1", status:"open", notes:"" },
  { id:"T005", cat:"BASIQ", title:"Deploy maat-basiq-prod CFN stack", owner:"Troy", priority:"P1", status:"open", notes:"BLOCKED on T004" },
  { id:"T006", cat:"BASIQ", title:"Push Lambda code for BASIQ integration", owner:"Troy", priority:"P1", status:"open", notes:"3 Lambdas" },
  { id:"T007", cat:"MAAT", title:"Push maat-sources.js to Vercel repo", owner:"Troy", priority:"P2", status:"open", notes:"mcp-command-centre/public/pages/ - git push" },
    // FLAG_HARDWIRED: task from pos_task table — TODO migrate to DB: { id:"T008", cat:"MAAT", title:"Import Amex Aug 2024 bank statement", owner:"Troy", priority:"P2", status:"open", notes:"30 coverage gaps" },
    // FLAG_HARDWIRED: task from pos_task table — TODO migrate to DB: { id:"T009", cat:"MAAT", title:"Import Amex Dec 2024 bank statement", owner:"Troy", priority:"P2", status:"open", notes:"" },
  { id:"T010", cat:"MAAT", title:"Import CBA scattered statements", owner:"Troy", priority:"P2", status:"open", notes:"" },
  { id:"T011", cat:"MAAT", title:"Import all banks Jan-Mar 2026", owner:"Troy", priority:"P2", status:"open", notes:"All institutions" },
  { id:"T012", cat:"RDTI", title:"Generate R01-R05 x 7 narratives (35 total)", owner:"Claude", priority:"P1", status:"open", notes:"/rdti session" },
  { id:"T013", cat:"RDTI", title:"AusIndustry registration complete", owner:"Troy", priority:"P1", status:"open", notes:"Deadline: 30 Apr 2026" },
  { id:"T014", cat:"CC", title:"C07: RDTI progress bar widget", owner:"Claude", priority:"P1", status:"open", notes:"Tied to 30 Apr deadline" },
  { id:"T015", cat:"CC", title:"C08: Director Loan / Div 7A warning", owner:"Claude", priority:"P1", status:"open", notes:"" },
  { id:"T016", cat:"CC", title:"C11: R&D timesheet gap alert", owner:"Claude", priority:"P1", status:"open", notes:"" },
  { id:"T017", cat:"BRIDGE", title:"Audit all tools using old functionName/payload format — DONE 2026-03-10", owner:"Claude", priority:"P2", status:"open", notes:"Still returning 400" },
  { id:"T018", cat:"AGENTS", title:"Name 1,000 agents from 15 canonical seed names", owner:"Claude", priority:"P3", status:"open", notes:"AGT-0001-AGT-1000" },
  { id:"T019", cat:"AGENTS", title:"Build agent_dossiers table", owner:"Claude", priority:"P3", status:"open", notes:"" },
  { id:"T020", cat:"AGENTS", title:"Map 49 products to SKUs + Stripe", owner:"Claude", priority:"P3", status:"open", notes:"71 SKUs, 319 Stripe - no bridge yet" },
  { id:"T021", cat:"BASIQ", title:"Email support@basiq.io for production access", owner:"Troy", priority:"P2", status:"open", notes:"Currently sandbox only" },
  { id:"T022", cat:"AGOE", title:"AGOE v4 - Phase 3 planning", owner:"Claude", priority:"P3", status:"open", notes:"Post 28 Apr RDTI deadline" },
];

const CATS = ["ALL","INFRA","BASIQ","MAAT","RDTI","CC","BRIDGE","AGENTS","AGOE"];
const OWNERS = ["ALL","Troy","Claude"];
const STATUSES = ["open","in-progress","blocked","done"] as const;
type Status = typeof STATUSES[number];

const STATUS_CLR: Record<string,string> = { open:"#e85d3a", done:"#2ecc71", blocked:"#e74c3c", "in-progress":"#f39c12" };
const CAT_CLR: Record<string,string> = { INFRA:"#4a9eff",BASIQ:"#9b59b6",MAAT:"#1abc9c",RDTI:"#e74c3c",CC:"#f39c12",BRIDGE:"#e85d3a",AGENTS:"#3498db",AGOE:"#2ecc71" };
const P_CLR: Record<string,string> = { P1:"#e74c3c", P2:"#f39c12", P3:"#555e6e" };
const STORAGE_KEY = "t4h_mc_v1";

interface Task { id:string; cat:string; title:string; owner:string; priority:string; status:string; notes:string; }

const Sel = ({ val, opts, onChange }: { val:string; opts:string[]; onChange:(v:string)=>void }) => (
  <select value={val} onChange={e => onChange(e.target.value)} style={{ background:"#0d1117", border:"1px solid #1e2530", color:"#8899aa", padding:"3px 6px", fontFamily:"monospace", fontSize:11, outline:"none", cursor:"pointer" }}>
    {opts.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

export default function MissionControl() {
  const [items, setItems] = useState<Task[]>(INITIAL_ITEMS);
  const [filter, setFilter] = useState({ cat:"ALL", owner:"ALL", status:"ALL" });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string|null>(null);
  const [addMode, setAddMode] = useState(false);
  const [newItem, setNewItem] = useState<Omit<Task,"id">>({ cat:"INFRA", title:"", owner:"Troy", priority:"P2", status:"open", notes:"" });
  const [saveSig, setSaveSig] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { const d = JSON.parse(saved); if (d?.length) setItems(d); }
    } catch {}
  }, []);

  const persist = useCallback((data: Task[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setSaveSig("SAVED"); setTimeout(() => setSaveSig(""), 1500); }
    catch { setSaveSig("ERR"); }
  }, []);

  const upd = (id: string, field: keyof Task, val: string) => {
    const next = items.map(i => i.id === id ? { ...i, [field]: val } : i);
    setItems(next); persist(next);
  };

  const addNew = () => {
    if (!newItem.title.trim()) return;
    const max = items.reduce((m, i) => Math.max(m, parseInt(i.id.replace("T",""))), 0);
    const next = [...items, { ...newItem, id:`T${String(max+1).padStart(3,"0")}` }];
    setItems(next); persist(next);
    setNewItem({ cat:"INFRA", title:"", owner:"Troy", priority:"P2", status:"open", notes:"" });
    setAddMode(false);
  };

  const filtered = items.filter(i => {
    if (filter.cat !== "ALL" && i.cat !== filter.cat) return false;
    if (filter.owner !== "ALL" && i.owner !== filter.owner) return false;
    if (filter.status !== "ALL" && i.status !== filter.status) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.notes.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: items.length,
    open: items.filter(i => i.status === "open").length,
    p1open: items.filter(i => i.priority === "P1" && i.status !== "done").length,
    done: items.filter(i => i.status === "done").length,
    blocked: items.filter(i => i.status === "blocked").length,
    pct: Math.round((items.filter(i => i.status === "done").length / items.length) * 100),
  };

  const daysLeft = Math.ceil((new Date("2026-04-30").getTime() - Date.now()) / 86400000);

  const mono: React.CSSProperties = { fontFamily:"'Courier New',monospace" };

  return (
    <div style={{ background:"#070a0d", minHeight:"100vh", ...mono, color:"#b8c4d0", fontSize:12, margin:"-32px -16px" }}>
      {/* Header */}
      <div style={{ background:"#0a0d12", borderBottom:"1px solid #151d28", padding:"12px 18px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <div>
          <div style={{ color:"#4a9eff", fontSize:11, fontWeight:700, letterSpacing:4 }}>T4H MISSION CONTROL</div>
          <div style={{ color:"#2a3a4a", fontSize:9, letterSpacing:2 }}>TECH 4 HUMANITY LTD · ACN 70 666 271 272</div>
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#2ecc71", boxShadow:"0 0 8px #2ecc71" }} />
          <span style={{ color:"#2ecc71", fontSize:9, letterSpacing:2 }}>LIVE</span>
        </div>
        <div style={{ flex:1 }} />
        <span style={{ color: saveSig==="SAVED" ? "#2ecc71" : "#e74c3c", fontSize:9, minWidth:30 }}>{saveSig}</span>
        {([
          { l:"TOTAL", v:stats.total, c:"#8899aa" },
          { l:"OPEN", v:stats.open, c:"#e85d3a" },
          { l:"P1 LIVE", v:stats.p1open, c:"#e74c3c" },
          { l:"BLOCKED", v:stats.blocked, c:"#c0392b" },
          { l:"DONE", v:stats.done, c:"#2ecc71" },
        ] as {l:string;v:number;c:string}[]).map(s => (
          <div key={s.l} style={{ textAlign:"center", minWidth:44 }}>
            <div style={{ color:s.c, fontSize:20, fontWeight:700, lineHeight:1 }}>{s.v}</div>
            <div style={{ color:"#2a3a4a", fontSize:8, letterSpacing:1.5 }}>{s.l}</div>
          </div>
        ))}
        <div style={{ textAlign:"center", minWidth:60, borderLeft:"1px solid #151d28", paddingLeft:14 }}>
          <div style={{ color: daysLeft < 30 ? "#e74c3c" : "#f39c12", fontSize:20, fontWeight:700, lineHeight:1 }}>{daysLeft}d</div>
          <div style={{ color:"#2a3a4a", fontSize:8, letterSpacing:1 }}>RDTI EXP</div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height:2, background:"#0d1117" }}>
        <div style={{ height:2, background:"linear-gradient(90deg,#e74c3c,#f39c12,#2ecc71)", width:`${stats.pct}%`, transition:"width 0.6s" }} />
      </div>

      {/* Filters */}
      <div style={{ background:"#090c10", borderBottom:"1px solid #111820", padding:"8px 18px", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH..."
          style={{ background:"#0d1117", border:"1px solid #1e2530", color:"#b8c4d0", padding:"4px 10px", ...mono, fontSize:11, width:150, outline:"none" }} />
        <span style={{ color:"#2a3a4a", fontSize:9 }}>CAT</span>
        <Sel val={filter.cat} opts={CATS} onChange={v => setFilter(p=>({...p,cat:v}))} />
        <span style={{ color:"#2a3a4a", fontSize:9 }}>OWNER</span>
        <Sel val={filter.owner} opts={OWNERS} onChange={v => setFilter(p=>({...p,owner:v}))} />
        <span style={{ color:"#2a3a4a", fontSize:9 }}>STATUS</span>
        <Sel val={filter.status} opts={["ALL",...STATUSES]} onChange={v => setFilter(p=>({...p,status:v}))} />
        <div style={{ flex:1 }} />
        <span style={{ color:"#2a3a4a", fontSize:9 }}>{filtered.length}/{items.length}</span>
        <button onClick={() => setAddMode(a => !a)}
          style={{ background: addMode?"#0f2010":"#0d1117", border:"1px solid #2ecc7155", color:"#2ecc71", padding:"4px 12px", ...mono, fontSize:11, cursor:"pointer" }}>
          + NEW
        </button>
      </div>

      {/* Add form */}
      {addMode && (
        <div style={{ background:"#0c1219", borderBottom:"1px solid #151d28", padding:"10px 18px", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <Sel val={newItem.cat} opts={CATS.filter(c=>c!=="ALL")} onChange={v => setNewItem(p=>({...p,cat:v}))} />
          <input value={newItem.title} onChange={e => setNewItem(p=>({...p,title:e.target.value}))}
            onKeyDown={e => e.key==="Enter" && addNew()} placeholder="TASK TITLE"
            style={{ flex:1, minWidth:200, background:"#0d1117", border:"1px solid #4a9eff55", color:"#b8c4d0", padding:"4px 10px", ...mono, fontSize:11, outline:"none" }} />
          <Sel val={newItem.owner} opts={OWNERS.filter(o=>o!=="ALL")} onChange={v => setNewItem(p=>({...p,owner:v}))} />
          <Sel val={newItem.priority} opts={["P1","P2","P3"]} onChange={v => setNewItem(p=>({...p,priority:v}))} />
          <input value={newItem.notes} onChange={e => setNewItem(p=>({...p,notes:e.target.value}))}
            onKeyDown={e => e.key==="Enter" && addNew()} placeholder="NOTES"
            style={{ width:180, background:"#0d1117", border:"1px solid #1e2530", color:"#8899aa", padding:"4px 8px", ...mono, fontSize:11, outline:"none" }} />
          <button onClick={addNew} style={{ background:"#0f2010", border:"1px solid #2ecc71", color:"#2ecc71", padding:"4px 14px", ...mono, fontSize:11, cursor:"pointer" }}>SAVE</button>
          <button onClick={() => setAddMode(false)} style={{ background:"transparent", border:"1px solid #222", color:"#445", padding:"4px 10px", ...mono, fontSize:11, cursor:"pointer" }}>×</button>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#090c10", borderBottom:"1px solid #111820" }}>
              {["ID","CAT","TASK","OWNER","PRI","STATUS","NOTES"].map(h => (
                <th key={h} style={{ padding:"7px 14px", textAlign:"left", color:"#2a3a4a", fontSize:9, letterSpacing:2, fontWeight:400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const done = item.status === "done";
              return (
                <tr key={item.id} style={{ borderBottom:"1px solid #0d1117", background:idx%2===0?"transparent":"#080b0f", opacity:done?0.4:1 }}>
                  <td style={{ padding:"7px 14px", color:"#2a3a4a", fontSize:10 }}>{item.id}</td>
                  <td style={{ padding:"7px 14px" }}>
                    <span style={{ background:`${CAT_CLR[item.cat]}15`, color:CAT_CLR[item.cat], padding:"2px 8px", fontSize:9, letterSpacing:1, border:`1px solid ${CAT_CLR[item.cat]}35` }}>
                      {item.cat}
                    </span>
                  </td>
                  <td style={{ padding:"7px 14px", color:done?"#2a3a4a":"#b8c4d0", maxWidth:320 }}>
                    {editing === item.id
                      ? <input defaultValue={item.title} autoFocus
                          onBlur={e => { upd(item.id,"title",e.target.value); setEditing(null); }}
                          onKeyDown={e => e.key==="Enter" && (e.target as HTMLInputElement).blur()}
                          style={{ width:"100%", background:"#0d1117", border:"1px solid #4a9eff", color:"#b8c4d0", padding:"2px 6px", ...mono, fontSize:12, outline:"none" }} />
                      : <span onClick={() => !done && setEditing(item.id)} style={{ cursor:done?"default":"text", display:"flex", alignItems:"center", gap:6 }}>
                          {done && <span style={{ color:"#2ecc71", fontSize:10 }}>✓</span>}
                          {item.title}
                        </span>
                    }
                  </td>
                  <td style={{ padding:"7px 14px", color:item.owner==="Troy"?"#f39c12":"#4a9eff", fontSize:10 }}>{item.owner}</td>
                  <td style={{ padding:"7px 14px" }}>
                    <span style={{ color:P_CLR[item.priority], fontSize:10, fontWeight:700 }}>{item.priority}</span>
                  </td>
                  <td style={{ padding:"7px 14px" }}>
                    <select value={item.status} onChange={e => upd(item.id,"status",e.target.value as Status)}
                      style={{ background:`${STATUS_CLR[item.status]}15`, border:`1px solid ${STATUS_CLR[item.status]}40`, color:STATUS_CLR[item.status], padding:"2px 7px", ...mono, fontSize:10, cursor:"pointer", outline:"none" }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding:"7px 14px", color:"#3a4a5a", fontSize:10, maxWidth:220 }}>
                    {editing === `${item.id}_n`
                      ? <input defaultValue={item.notes} autoFocus
                          onBlur={e => { upd(item.id,"notes",e.target.value); setEditing(null); }}
                          onKeyDown={e => e.key==="Enter" && (e.target as HTMLInputElement).blur()}
                          style={{ width:"100%", background:"#0d1117", border:"1px solid #4a9eff", color:"#8899aa", padding:"2px 6px", ...mono, fontSize:10, outline:"none" }} />
                      : <span onClick={() => setEditing(`${item.id}_n`)} style={{ cursor:"text" }}>
                          {item.notes || <span style={{ color:"#151d28" }}>—</span>}
                        </span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ borderTop:"1px solid #0d1117", padding:"8px 18px", display:"flex", justifyContent:"space-between", color:"#1e2a38", fontSize:9 }}>
        <span>T4H MISSION CONTROL v1.0 · {stats.pct}% COMPLETE · {filtered.length}/{items.length} TASKS</span>
        <span>RDTI DEADLINE 30 APR 2026 · {daysLeft}d REMAINING</span>
      </div>
    </div>
  );
}
