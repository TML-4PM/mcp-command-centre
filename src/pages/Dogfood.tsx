import { useState, useEffect, useCallback } from "react";

// ── BRIDGE ────────────────────────────────────────────────────────────────────
const BRIDGE = "https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke";

async function execSQL(sql) {
  const res = await fetch(BRIDGE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fn: "troy-sql-executor", sql }),
  });
  const d = await res.json();
  if (!d.success) throw new Error(JSON.stringify(d.rows));
  return d.rows;
}

// ── CANONICAL DATA (seeded from Supabase 2026-03-09) ─────────────────────────
// FLAG_HARDWIRED: BUSINESSES is a static array — should load from mcp_business_registry
// TODO: replace with bridgeSQL call on mount
const BUSINESSES = [{"id":1,"name":"Tech for Humanity","group":"CORE","lifecycle":"Active","topics":"Leadgen,Reporting,Finance,TaskManagement","products":[{"key":"think_tool_agent","role":"Strategic reasoning backbone"},{"key":"agent_tracking_system","role":"Monitor all running agents"},{"key":"leadgen_outreach","role":"Primary pipeline for T4H BD"},{"key":"invoice_tracker","role":"Finance/MAAT integration"},{"key":"mcp_integration","role":"Core infra bridge"}]},{"id":2,"name":"WorkFamilyAI","group":"CORE","lifecycle":"Active","topics":"Leadgen,Sales,Reporting","products":[{"key":"leadgen_outreach","role":"Main prospect funnel"},{"key":"ai_copywriter_team","role":"Content for family/AI campaigns"},{"key":"cold_email_automation","role":"Outbound sequences"},{"key":"marketing_ai_team","role":"Campaign operations"},{"key":"proposal_generator","role":"Client proposals"},{"key":"viral_baby_videos","role":"WorkFamilyAI family content series"}]},{"id":3,"name":"Augmented Humanity Coach","group":"CORE","lifecycle":"Active","topics":"Leadgen,Sales,TaskManagement","products":[{"key":"leadgen_outreach","role":"Coach prospect acquisition"},{"key":"client_onboarding_system","role":"New client intake"},{"key":"ai_think_agent_system","role":"Personalised coaching intelligence"},{"key":"think_tool_agent","role":"Session planning & insights"},{"key":"automated_sales_agents","role":"Sales pipeline"},{"key":"job_search_automation","role":"AHC job coaching placement tracker"}]},{"id":4,"name":"HoloOrg","group":"CORE","lifecycle":"Active","topics":"Reporting,TaskManagement,Finance","products":[{"key":"dynamic_ai_agent_workflow","role":"Orchestrate 10k agent framework"},{"key":"agent_tracking_system","role":"HoloOrg ops dashboard"},{"key":"mcp_integration","role":"Tool connectivity layer"},{"key":"ai_think_agent_system","role":"VP-level decision agent"},{"key":"error_logger_workflow","role":"Infra health monitoring"},{"key":"chatgpt_automation_system","role":"HoloOrg GPT action layer"}]},{"id":5,"name":"GC-BAT Core","group":"SIGNAL","lifecycle":"On hold / mid-term","topics":"DataCleansingEnrichment,Reporting","products":[{"key":"scraping_automation","role":"Market data collection"},{"key":"google_map_scraper","role":"Business directory build"},{"key":"data_cleansing_enrichment","role":"Clean scraped datasets"},{"key":"real_time_insights_system","role":"Signal monitoring"},{"key":"think_tool_agent","role":"Research synthesis"}]},{"id":6,"name":"ConsentX","group":"SIGNAL","lifecycle":"On hold / mid-term","topics":"Leadgen,DataCleansingEnrichment","products":[{"key":"claude_mcp_content","role":"Consent-first content pipeline"},{"key":"social_media_scraper","role":"Monitor consent conversation"},{"key":"viral_linkedin_posts","role":"Thought leadership posts"},{"key":"data_cleansing_enrichment","role":"User data cleanup"},{"key":"website_extractor","role":"Competitor intel"}]},{"id":7,"name":"Far-Cage","group":"SIGNAL","lifecycle":"On hold / mid-term","topics":"DataCleansingEnrichment,Leadgen","products":[{"key":"fb_ad_spy_tool","role":"Competitive ad surveillance"},{"key":"scraping_automation","role":"Cage data collection"},{"key":"data_cleansing_enrichment","role":"Signal data QA"},{"key":"ai_video_analysis","role":"Campaign video analysis"},{"key":"meta_ad_automation","role":"Ad campaign launch"}]},{"id":8,"name":"MyNeuralSignal","group":"SIGNAL","lifecycle":"On hold / strategic","topics":"Reporting,Sales","products":[{"key":"ai_video_analysis","role":"Neural signal research clips"},{"key":"think_tool_agent","role":"Research reasoning"},{"key":"claude_mcp_content","role":"Research content publishing"},{"key":"proposal_generator","role":"Grant/partner proposals"},{"key":"client_onboarding_system","role":"Research participant intake"}]},{"id":9,"name":"NEUROPAK","group":"SIGNAL","lifecycle":"On hold / long-term","topics":"Reporting,DataCleansingEnrichment","products":[{"key":"think_tool_agent","role":"Neuro research synthesis"},{"key":"ai_think_agent_system","role":"Autonomous research agent"},{"key":"claude_mcp_content","role":"Research publications"},{"key":"data_cleansing_enrichment","role":"Sensor data cleansing"},{"key":"real_time_insights_system","role":"Signal monitoring dashboard"}]},{"id":10,"name":"RATPAK","group":"SIGNAL","lifecycle":"On hold / long-term","topics":"DataCleansingEnrichment,Leadgen","products":[{"key":"scraping_automation","role":"Rat behavior data scraping"},{"key":"social_media_scraper","role":"Community monitoring"},{"key":"data_cleansing_enrichment","role":"Dataset QA"},{"key":"google_map_scraper","role":"Venue/location intel"},{"key":"real_time_insights_system","role":"Live experiment monitoring"}]},{"id":11,"name":"LifeGraph Plus","group":"SIGNAL","lifecycle":"On hold / mid-term","topics":"Sales,Reporting","products":[{"key":"ai_video_analysis","role":"Life graph video processing"},{"key":"viral_ai_videos","role":"Life story content"},{"key":"product_videography","role":"Feature showcase videos"},{"key":"ai_clone_avatar_system","role":"Personalised avatar guide"},{"key":"ai_avatar_social_automation","role":"Social distribution"}]},{"id":12,"name":"AI Olympics","group":"SIGNAL","lifecycle":"On hold / mid-term","topics":"Reporting,Sales","products":[{"key":"viral_ai_videos","role":"AI Olympics content"},{"key":"ai_video_analysis","role":"Competition performance analysis"},{"key":"viral_shorts_machine","role":"Event short-form content"},{"key":"ai_clone_avatar_system","role":"Host avatar"},{"key":"real_time_insights_system","role":"Live leaderboard insights"},{"key":"faceless_video_maker","role":"AI Olympics faceless event recaps"}]},{"id":13,"name":"Mission Critical","group":"MISSION","lifecycle":"On hold / build","topics":"Sales,Leadgen,Finance","products":[{"key":"automated_sales_agents","role":"End-to-end sales engine"},{"key":"leadgen_outreach","role":"Government/enterprise BD"},{"key":"cold_email_automation","role":"Outbound sequences"},{"key":"client_onboarding_system","role":"Contract/brief intake"},{"key":"invoice_tracker","role":"Project invoicing"}]},{"id":14,"name":"Outcome Ready","group":"MISSION","lifecycle":"Active / build","topics":"Finance,TaskManagement,Reporting","products":[{"key":"client_onboarding_system","role":"NDIS participant intake"},{"key":"invoice_tracker","role":"NDIS plan billing"},{"key":"automated_hiring_workflow","role":"Support worker hiring"},{"key":"think_tool_agent","role":"Outcome planning tool"},{"key":"proposal_generator","role":"NDIS plan proposals"},{"key":"meeting_noshow_eliminator","role":"NDIS appointment no-show prevention"}]},{"id":15,"name":"SmartPark","group":"MISSION","lifecycle":"On hold / validate","topics":"Leadgen,Sales,DataCleansingEnrichment","products":[{"key":"leadgen_outreach","role":"Property/council BD"},{"key":"google_map_scraper","role":"Parking lot discovery"},{"key":"scraping_automation","role":"Competitor data"},{"key":"meta_ad_automation","role":"Property owner ads"},{"key":"customer_support_automation","role":"Operator support"}]},{"id":16,"name":"MedLedger","group":"MISSION","lifecycle":"On hold / build","topics":"Finance,DataCleansingEnrichment,Reporting","products":[{"key":"invoice_tracker","role":"Medical billing automation"},{"key":"data_cleansing_enrichment","role":"Patient/claims data QA"},{"key":"client_onboarding_system","role":"Patient onboarding"},{"key":"ai_think_agent_system","role":"Clinical records reasoning"},{"key":"error_logger_workflow","role":"Compliance error tracking"}]},{"id":17,"name":"AquaMe","group":"MISSION","lifecycle":"On hold / explore","topics":"Leadgen,Sales","products":[{"key":"leadgen_outreach","role":"Water tech BD"},{"key":"social_media_scraper","role":"Water sector monitoring"},{"key":"viral_linkedin_posts","role":"Sustainability thought leadership"},{"key":"cold_email_automation","role":"Partner outreach"},{"key":"proposal_generator","role":"Grant proposals"}]},{"id":18,"name":"Enter Australia","group":"RETAIL","lifecycle":"Active / build","topics":"Leadgen,Sales,DataCleansingEnrichment","products":[{"key":"leadgen_outreach","role":"Immigration lead acquisition"},{"key":"google_map_scraper","role":"Migration agent directory"},{"key":"cold_email_automation","role":"Prospect sequences"},{"key":"meta_ad_automation","role":"Visa seeker ads"},{"key":"customer_support_automation","role":"Applicant support"}]},{"id":19,"name":"APAC Just Walk Out","group":"RETAIL","lifecycle":"On hold / build","topics":"DataCleansingEnrichment,Sales","products":[{"key":"ai_video_analysis","role":"Retail footage analysis"},{"key":"product_videography","role":"Product demo videos"},{"key":"scraping_automation","role":"Retail competitor intel"},{"key":"website_extractor","role":"Supplier data extraction"},{"key":"data_cleansing_enrichment","role":"SKU/inventory data QA"}]},{"id":20,"name":"Vuon Troi","group":"RETAIL","lifecycle":"On hold / build","topics":"Sales,Reporting","products":[{"key":"viral_ai_videos","role":"Vietnamese food content"},{"key":"product_videography","role":"Menu/dish showcase"},{"key":"ai_image_automation","role":"Social image generation"},{"key":"marketing_ai_team","role":"Restaurant marketing ops"},{"key":"social_media_scraper","role":"Food trend monitoring"}]},{"id":21,"name":"JustPoint","group":"RETAIL","lifecycle":"On hold / build","topics":"Sales,TaskManagement","products":[{"key":"customer_support_automation","role":"Point-of-sale support"},{"key":"whatsapp_ai_agent","role":"Customer WhatsApp bot"},{"key":"voice_ai_receptionist","role":"Booking voice agent"},{"key":"inbox_automation","role":"Order/query triage"},{"key":"error_logger_workflow","role":"Transaction error logging"},{"key":"email_complaint_automation","role":"JustPoint customer complaint handling"}]},{"id":22,"name":"XCES","group":"RETAIL","lifecycle":"On hold / explore","topics":"DataCleansingEnrichment,Reporting","products":[{"key":"scraping_automation","role":"Market data collection"},{"key":"data_cleansing_enrichment","role":"Data QA pipeline"},{"key":"website_extractor","role":"Competitor content extraction"},{"key":"real_time_insights_system","role":"Market signal tracking"},{"key":"google_map_scraper","role":"Business discovery"}]},{"id":23,"name":"House of Biscuits","group":"RETAIL","lifecycle":"On hold / seasonal","topics":"Sales,Leadgen","products":[{"key":"marketing_ai_team","role":"Biscuit brand campaigns"},{"key":"viral_shorts_machine","role":"Seasonal product shorts"},{"key":"ai_image_automation","role":"Product photography AI"},{"key":"product_videography","role":"Recipe/product videos"},{"key":"social_media_scraper","role":"Food trend monitoring"}]},{"id":24,"name":"Apex Predator Insurance","group":"FUN","lifecycle":"On hold / event-led","topics":"Sales,Finance","products":[{"key":"ai_copywriter_team","role":"Insurance copy & VSL"},{"key":"meta_ad_automation","role":"Niche insurance ads"},{"key":"viral_shorts_automation","role":"Event-led content"},{"key":"marketing_ai_team","role":"Campaign management"},{"key":"invoice_tracker","role":"Policy billing"},{"key":"lovable_web_app_builder","role":"Apex Predator quick quote tool builder"}]},{"id":25,"name":"Extreme Spotto","group":"FUN","lifecycle":"On hold / build","topics":"Leadgen,Sales","products":[{"key":"viral_ai_videos","role":"Extreme sport content"},{"key":"viral_shorts_machine","role":"Activity highlights"},{"key":"ai_clone_avatar_system","role":"Brand spokesperson avatar"},{"key":"social_media_scraper","role":"Sport trend monitoring"},{"key":"fb_ad_spy_tool","role":"Competitor ad analysis"},{"key":"faceless_video_ai","role":"Extreme Spotto action sport content"}]},{"id":26,"name":"AI Oopsies","group":"FUN","lifecycle":"On hold / build","topics":"Reporting,Leadgen","products":[{"key":"error_logger_workflow","role":"AI failure case capture"},{"key":"ai_video_analysis","role":"Oopsie clip analysis"},{"key":"real_time_insights_system","role":"Viral moment detection"},{"key":"agent_tracking_system","role":"Agent behaviour logging"},{"key":"viral_shorts_automation","role":"Oopsie reel publishing"}]},{"id":27,"name":"Rhythm Method","group":"FUN","lifecycle":"On hold / explore","topics":"Leadgen,Sales","products":[{"key":"viral_linkedin_posts","role":"Music/rhythm thought leadership"},{"key":"linkedin_ai_agent","role":"Connection & engagement"},{"key":"linkedin_visual_automation","role":"Visual content automation"},{"key":"cold_email_automation","role":"Artist/venue outreach"},{"key":"marketing_ai_team","role":"Brand campaign ops"},{"key":"chatgpt_image_workflow","role":"Rhythm Method creative image assets"}]},{"id":28,"name":"GirlMath","group":"FUN","lifecycle":"On hold / explore","topics":"Sales,Reporting","products":[{"key":"marketing_ai_team","role":"GirlMath content strategy"},{"key":"viral_shorts_automation","role":"GirlMath reel factory"},{"key":"ai_image_automation","role":"Branded image content"},{"key":"social_media_scraper","role":"Trend monitoring"},{"key":"carousel_slides_automation","role":"Educational carousel content"},{"key":"image_creation_editing","role":"GirlMath branded visual content"}]}];

const GROUPS = ["CORE","SIGNAL","MISSION","RETAIL","FUN"];
const GROUP_COLOR = {
  CORE:    { bg: "#f59e0b", text: "#000", dim: "#78350f" },
  SIGNAL:  { bg: "#06b6d4", text: "#000", dim: "#164e63" },
  MISSION: { bg: "#a78bfa", text: "#000", dim: "#3b0764" },
  RETAIL:  { bg: "#34d399", text: "#000", dim: "#064e3b" },
  FUN:     { bg: "#f87171", text: "#000", dim: "#7f1d1d" },
};

const CAT_ICON = {
  leadgen: "⚡", sales: "💰", data: "📊", tasks: "✅",
  reporting: "📈", finance: "🏦", content: "🎬", infra: "⚙️",
};

const PROD_META = {
  think_tool_agent:{cat:"reporting"},ai_video_analysis:{cat:"content"},leadgen_outreach:{cat:"leadgen"},
  invoice_tracker:{cat:"finance"},mcp_integration:{cat:"infra"},ai_copywriter_team:{cat:"sales"},
  cold_email_automation:{cat:"leadgen"},marketing_ai_team:{cat:"sales"},proposal_generator:{cat:"sales"},
  viral_baby_videos:{cat:"content"},client_onboarding_system:{cat:"tasks"},ai_think_agent_system:{cat:"reporting"},
  automated_sales_agents:{cat:"sales"},job_search_automation:{cat:"tasks"},dynamic_ai_agent_workflow:{cat:"infra"},
  agent_tracking_system:{cat:"reporting"},error_logger_workflow:{cat:"infra"},chatgpt_automation_system:{cat:"infra"},
  scraping_automation:{cat:"data"},google_map_scraper:{cat:"data"},data_cleansing_enrichment:{cat:"data"},
  real_time_insights_system:{cat:"reporting"},claude_mcp_content:{cat:"content"},social_media_scraper:{cat:"data"},
  viral_linkedin_posts:{cat:"content"},website_extractor:{cat:"data"},fb_ad_spy_tool:{cat:"leadgen"},
  meta_ad_automation:{cat:"leadgen"},viral_ai_videos:{cat:"content"},viral_shorts_machine:{cat:"content"},
  ai_clone_avatar_system:{cat:"content"},product_videography:{cat:"content"},ai_avatar_social_automation:{cat:"content"},
  faceless_video_maker:{cat:"content"},meetng_noshow_eliminator:{cat:"sales"},meeting_noshow_eliminator:{cat:"sales"},
  automated_hiring_workflow:{cat:"tasks"},customer_support_automation:{cat:"sales"},inbox_automation:{cat:"tasks"},
  lovable_web_app_builder:{cat:"infra"},viral_shorts_automation:{cat:"content"},ai_image_automation:{cat:"content"},
  whatsapp_ai_agent:{cat:"sales"},voice_ai_receptionist:{cat:"sales"},email_complaint_automation:{cat:"sales"},
  chatgpt_image_workflow:{cat:"content"},linkedin_ai_agent:{cat:"leadgen"},linkedin_visual_automation:{cat:"content"},
  faceless_video_ai:{cat:"content"},carousel_slides_automation:{cat:"content"},image_creation_editing:{cat:"content"},
};

function prodLabel(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ── STYLES ─────────────────────────────────────────────────────────────────
const S = {
  app: {
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    background: "#060609",
    minHeight: "100vh",
    color: "#e2e8f0",
    padding: "0",
  },
  header: {
    background: "#0c0c14",
    borderBottom: "1px solid #1e1e2e",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#f59e0b",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  },
  headerSub: { fontSize: "10px", color: "#475569", marginTop: "2px", letterSpacing: "0.1em" },
  badge: (col) => ({
    display: "inline-block", padding: "1px 6px", borderRadius: "2px",
    fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em",
    background: col.dim, color: col.bg, border: `1px solid ${col.bg}33`,
  }),
  main: { padding: "24px", maxWidth: "1600px", margin: "0 auto" },
  tabs: { display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid #1e1e2e", paddingBottom: "0" },
  tab: (active) => ({
    padding: "8px 16px", fontSize: "11px", letterSpacing: "0.08em",
    fontWeight: "600", cursor: "pointer", border: "none", background: "none",
    color: active ? "#f59e0b" : "#475569",
    borderBottom: active ? "2px solid #f59e0b" : "2px solid transparent",
    fontFamily: "inherit", transition: "color 0.15s",
  }),
  groupSection: { marginBottom: "32px" },
  groupHeader: (col) => ({
    fontSize: "10px", fontWeight: "700", letterSpacing: "0.2em",
    color: col.bg, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px",
  }),
  groupLine: (col) => ({ flex: 1, height: "1px", background: col.dim }),
  bizGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "8px",
  },
  bizCard: (active, grp) => ({
    background: active ? "#111120" : "#0a0a14",
    border: `1px solid ${active ? GROUP_COLOR[grp].bg : "#1e1e2e"}`,
    borderRadius: "4px", padding: "12px", cursor: "pointer",
    transition: "all 0.15s",
    boxShadow: active ? `0 0 12px ${GROUP_COLOR[grp].bg}22` : "none",
  }),
  bizId: { fontSize: "9px", color: "#334155", marginBottom: "4px", letterSpacing: "0.1em" },
  bizName: { fontSize: "12px", fontWeight: "700", color: "#e2e8f0", marginBottom: "4px", lineHeight: 1.3 },
  bizLifecycle: (active) => ({
    fontSize: "9px", color: active ? "#10b981" : "#64748b", letterSpacing: "0.05em",
  }),
  bizProductCount: (grp) => ({
    fontSize: "9px", color: GROUP_COLOR[grp].bg, marginTop: "6px", letterSpacing: "0.05em",
  }),
  panel: {
    background: "#0c0c14", border: "1px solid #1e1e2e", borderRadius: "4px",
    padding: "20px", marginTop: "16px",
  },
  panelTitle: { fontSize: "11px", color: "#94a3b8", letterSpacing: "0.1em", marginBottom: "16px" },
  prodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "8px",
  },
  prodCard: (running, cat) => {
    const catColors = {
      leadgen: "#f59e0b", sales: "#10b981", data: "#06b6d4",
      tasks: "#a78bfa", reporting: "#60a5fa", finance: "#34d399",
      content: "#f87171", infra: "#94a3b8",
    };
    const c = catColors[cat] || "#94a3b8";
    return {
      background: running ? "#0f1a0f" : "#0a0a14",
      border: `1px solid ${running ? "#22c55e" : "#1e1e2e"}`,
      borderLeft: `3px solid ${c}`,
      borderRadius: "4px", padding: "12px", cursor: "pointer",
      transition: "all 0.15s",
      position: "relative",
    };
  },
  prodKey: { fontSize: "9px", color: "#475569", marginBottom: "4px", letterSpacing: "0.05em" },
  prodName: { fontSize: "11px", fontWeight: "700", color: "#e2e8f0", marginBottom: "4px" },
  prodRole: { fontSize: "10px", color: "#64748b", lineHeight: 1.4 },
  prodCat: (cat) => {
    const catColors = {leadgen:"#f59e0b",sales:"#10b981",data:"#06b6d4",tasks:"#a78bfa",reporting:"#60a5fa",finance:"#34d399",content:"#f87171",infra:"#94a3b8"};
    return { fontSize: "9px", color: catColors[cat]||"#94a3b8", marginTop: "6px", letterSpacing: "0.08em" };
  },
  launchBtn: (grp) => ({
    marginTop: "10px", padding: "5px 10px", fontSize: "9px", fontWeight: "700",
    letterSpacing: "0.1em", background: GROUP_COLOR[grp]?.dim || "#1e2a3a",
    color: GROUP_COLOR[grp]?.bg || "#60a5fa", border: `1px solid ${GROUP_COLOR[grp]?.bg || "#60a5fa"}44`,
    borderRadius: "2px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
    textTransform: "uppercase",
  }),
  statusPill: (s) => {
    const m = {running:"#f59e0b",succeeded:"#22c55e",failed:"#ef4444",paused_hil:"#a78bfa",cancelled:"#64748b"};
    return {
      display:"inline-block", padding:"1px 6px", borderRadius:"2px",
      fontSize:"9px", fontWeight:"700", letterSpacing:"0.1em",
      background:(m[s]||"#334155")+"22", color:m[s]||"#94a3b8",
      border:`1px solid ${(m[s]||"#334155")}44`,
    };
  },
  hilQueue: { marginTop: "12px" },
  hilCard: {
    background: "#150f1e", border: "1px solid #7c3aed44",
    borderLeft: "3px solid #a78bfa", borderRadius: "4px",
    padding: "14px", marginBottom: "8px",
  },
  hilTitle: { fontSize: "11px", fontWeight: "700", color: "#a78bfa", marginBottom: "6px" },
  hilMeta: { fontSize: "10px", color: "#64748b", marginBottom: "10px", lineHeight: 1.6 },
  btn: (variant) => {
    const v = {
      approve: { bg: "#14532d", col: "#22c55e", border: "#22c55e44" },
      reject:  { bg: "#450a0a", col: "#ef4444", border: "#ef444444" },
      primary: { bg: "#1c1f2e", col: "#60a5fa", border: "#60a5fa44" },
    }[variant] || { bg:"#1e2a3a", col:"#94a3b8", border:"#33415544" };
    return {
      padding: "5px 12px", fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em",
      background: v.bg, color: v.col, border: `1px solid ${v.border}`,
      borderRadius: "2px", cursor: "pointer", fontFamily: "inherit",
      textTransform: "uppercase", transition: "all 0.15s",
    };
  },
  toast: (type) => ({
    position: "fixed", bottom: "24px", right: "24px", zIndex: 999,
    padding: "10px 16px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
    background: type === "ok" ? "#14532d" : type === "err" ? "#450a0a" : "#1c1f2e",
    color: type === "ok" ? "#22c55e" : type === "err" ? "#ef4444" : "#a78bfa",
    border: `1px solid ${type==="ok"?"#22c55e":type==="err"?"#ef4444":"#7c3aed"}44`,
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    maxWidth: "380px", lineHeight: 1.5,
  }),
  metricGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "8px", marginBottom: "20px",
  },
  metric: {
    background: "#0a0a14", border: "1px solid #1e1e2e", borderRadius: "4px",
    padding: "12px",
  },
  metricVal: { fontSize: "22px", fontWeight: "700", color: "#f59e0b", lineHeight: 1 },
  metricLabel: { fontSize: "9px", color: "#475569", marginTop: "4px", letterSpacing: "0.08em" },
  log: {
    background: "#06060a", border: "1px solid #1e1e2e", borderRadius: "4px",
    padding: "12px", fontFamily: "inherit", fontSize: "10px", color: "#475569",
    maxHeight: "200px", overflowY: "auto", lineHeight: 1.7,
  },
};

// ── COMPONENT ──────────────────────────────────────────────────────────────
export default function Dogfood() {
  const [tab, setTab] = useState("businesses");
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [runningWfs, setRunningWfs] = useState({});     // {bizId_prodKey: wfData}
  const [hilQueue, setHilQueue] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState({});

  const addLog = (msg, type = "info") => {
    const ts = new Date().toISOString().slice(11, 19);
    const prefix = { info: "→", ok: "✓", err: "✗", hil: "⏸" }[type] || "·";
    setLogs(l => [`[${ts}] ${prefix} ${msg}`, ...l].slice(0, 80));
  };

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load HIL queue + metrics
  const refreshData = useCallback(async () => {
    try {
      // HIL tasks waiting review
      const hilRows = await execSQL(`
        SELECT t.id as task_id, t.subtask_key, t.stage, t.label, t.created_at,
               w.id as workflow_id, w.business_id, w.core_product_key
        FROM dogfood_tasks t
        JOIN dogfood_workflows w ON w.id = t.workflow_id
        WHERE t.status = 'waiting_review'
        ORDER BY t.created_at ASC
        LIMIT 20
      `);
      setHilQueue(Array.isArray(hilRows) ? hilRows : []);

      // Portfolio metrics
      const mRows = await execSQL(`
        SELECT
          (SELECT COUNT(*) FROM dogfood_workflows) as total_wf,
          (SELECT COUNT(*) FROM dogfood_workflows WHERE status='succeeded') as succeeded,
          (SELECT COUNT(*) FROM dogfood_workflows WHERE status='running') as running,
          (SELECT COUNT(*) FROM dogfood_tasks WHERE status='waiting_review') as hil_pending,
          (SELECT COUNT(DISTINCT business_id) FROM dogfood_workflows) as biz_active,
          (SELECT COUNT(DISTINCT core_product_key) FROM dogfood_workflows WHERE status='succeeded') as prods_tested
      `);
      if (Array.isArray(mRows) && mRows[0]) setMetrics(mRows[0]);
    } catch (e) {
      // silent — dashboard may be fresh
    }
  }, []);

  useEffect(() => {
    refreshData();
    const iv = setInterval(refreshData, 15000);
    return () => clearInterval(iv);
  }, [refreshData]);

  // Launch workflow
  const launchWorkflow = async (biz, prodKey) => {
    const lk = `${biz.id}_${prodKey}`;
    if (loading[lk]) return;
    setLoading(l => ({ ...l, [lk]: true }));
    addLog(`Starting ${prodKey} for ${biz.name}…`);
    try {
      const rows = await execSQL(
        `SELECT rpc_dogfood_start_and_advance(${biz.id}, '${prodKey}', 'troy@t4h.com', '{}'::jsonb) as r`
      );
      const result = Array.isArray(rows) ? rows[0]?.r : rows?.r;
      if (result?.error) throw new Error(result.error);
      const wfId = result.workflow_id;
      const wfStatus = result.status || "running";
      setRunningWfs(r => ({ ...r, [lk]: { wfId, status: wfStatus, prodKey, bizId: biz.id } }));
      const msg = wfStatus === "paused_hil"
        ? `⏸ HIL: ${result.label || result.subtask_key}`
        : wfStatus === "succeeded" ? `✓ Completed` : `▶ Running`;
      addLog(`${prodKey} → ${msg}`, wfStatus === "succeeded" ? "ok" : "hil");
      showToast(`${prodKey} — ${msg}`, wfStatus === "succeeded" ? "ok" : "hil");
      await refreshData();
    } catch (e) {
      addLog(`Error: ${e.message}`, "err");
      showToast(`✗ ${e.message}`, "err");
    } finally {
      setLoading(l => ({ ...l, [lk]: false }));
    }
  };

  // HIL approve/reject
  const hilAction = async (task, action) => {
    const lk = `hil_${task.task_id}`;
    setLoading(l => ({ ...l, [lk]: true }));
    addLog(`HIL ${action}: ${task.subtask_key} (wf ${task.workflow_id?.slice(0,8)}…)`, "hil");
    try {
      const rows = await execSQL(
        `SELECT rpc_dogfood_hil_action('${task.workflow_id}'::uuid, '${task.task_id}'::uuid, '${action}', 'troy@t4h.com', 5, '${action} via frontdoor UI') as r`
      );
      const result = Array.isArray(rows) ? rows[0]?.r : rows?.r;
      if (result?.error) throw new Error(result.error);
      addLog(`HIL ${action} confirmed for ${task.subtask_key}`, "ok");
      showToast(`${action === "approve" ? "✓ Approved" : "✗ Rejected"}: ${task.label || task.subtask_key}`, action === "approve" ? "ok" : "err");
      await refreshData();
    } catch (e) {
      addLog(`HIL error: ${e.message}`, "err");
      showToast(`✗ ${e.message}`, "err");
    } finally {
      setLoading(l => ({ ...l, [lk]: false }));
    }
  };

  const grouped = GROUPS.reduce((acc, g) => {
    acc[g] = BUSINESSES.filter(b => b.group === g);
    return acc;
  }, {});

  const bizById = Object.fromEntries(BUSINESSES.map(b => [b.id, b]));

  return (
    <div style={S.app}>
      {/* HEADER */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>T4H 28×50 · Dogfood Operations</div>
          <div style={S.headerSub}>spec: t4h_28x50_internal_dogfood v1.0.0 · HIL seat: troy@t4h.com</div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {hilQueue.length > 0 && (
            <div style={{ ...S.statusPill("paused_hil"), fontSize: "10px", padding: "3px 8px", cursor: "pointer" }}
              onClick={() => setTab("hil")}>
              ⏸ {hilQueue.length} HIL PENDING
            </div>
          )}
          <div style={{ fontSize: "9px", color: "#334155" }}>
            {new Date().toLocaleTimeString("en-AU", { hour12: false })} AEST
          </div>
        </div>
      </div>

      <div style={S.main}>
        {/* TABS */}
        <div style={S.tabs}>
          {[["businesses","BUSINESSES (28)"],["hil",`HIL QUEUE (${hilQueue.length})`],["dashboard","DASHBOARD"],["log","OP LOG"]].map(([k,l]) => (
            <button key={k} style={S.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* ── BUSINESSES TAB ── */}
        {tab === "businesses" && (
          <div>
            {GROUPS.map(grp => {
              const col = GROUP_COLOR[grp];
              return (
                <div key={grp} style={S.groupSection}>
                  <div style={S.groupHeader(col)}>
                    <span>{grp}</span>
                    <div style={S.groupLine(col)} />
                    <span style={{ color: "#334155", fontSize: "9px" }}>{grouped[grp].length} BUSINESSES</span>
                  </div>
                  <div style={S.bizGrid}>
                    {grouped[grp].map(biz => {
                      const active = selectedBiz?.id === biz.id;
                      const isActive = biz.lifecycle?.startsWith("Active");
                      return (
                        <div key={biz.id}
                          style={S.bizCard(active, grp)}
                          onClick={() => setSelectedBiz(active ? null : biz)}>
                          <div style={S.bizId}>BIZ-{String(biz.id).padStart(2,"0")}</div>
                          <div style={S.bizName}>{biz.name}</div>
                          <div style={S.bizLifecycle(isActive)}>{biz.lifecycle}</div>
                          <div style={S.bizProductCount(grp)}>
                            {biz.products.length} PRODUCTS · {biz.topics.split(",").slice(0,2).join(" · ")}
                          </div>
                          {/* Running indicator */}
                          {biz.products.some(p => runningWfs[`${biz.id}_${p.key}`]) && (
                            <div style={{ fontSize:"9px", color:"#22c55e", marginTop:"4px" }}>● RUNNING</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded product panel for selected biz in this group */}
                  {selectedBiz?.group === grp && (
                    <div style={S.panel}>
                      <div style={S.panelTitle}>
                        {selectedBiz.name.toUpperCase()} <span style={S.badge(col)}>{grp}</span>
                        &nbsp;· {selectedBiz.products.length} ASSIGNED PRODUCTS
                      </div>
                      <div style={S.prodGrid}>
                        {selectedBiz.products.map(p => {
                          const cat = PROD_META[p.key]?.cat || "infra";
                          const lk = `${selectedBiz.id}_${p.key}`;
                          const wf = runningWfs[lk];
                          const isLoading = loading[lk];
                          return (
                            <div key={p.key} style={S.prodCard(!!wf, cat)}>
                              <div style={S.prodKey}>{p.key}</div>
                              <div style={S.prodName}>{prodLabel(p.key)}</div>
                              <div style={S.prodRole}>{p.role}</div>
                              <div style={S.prodCat(cat)}>{CAT_ICON[cat]} {cat.toUpperCase()}</div>
                              {wf && (
                                <div style={{ marginTop: "6px" }}>
                                  <span style={S.statusPill(wf.status)}>{wf.status}</span>
                                  <span style={{ fontSize:"9px", color:"#334155", marginLeft:"6px" }}>
                                    {wf.wfId?.slice(0,8)}…
                                  </span>
                                </div>
                              )}
                              <button
                                style={S.launchBtn(grp)}
                                onClick={() => launchWorkflow(selectedBiz, p.key)}
                                disabled={isLoading}>
                                {isLoading ? "⟳ LAUNCHING…" : wf ? "↻ RE-RUN" : "▶ LAUNCH"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── HIL QUEUE TAB ── */}
        {tab === "hil" && (
          <div>
            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "16px" }}>
              Tasks paused for human review. Approve to advance workflow. Reject to fail and stop.
            </div>
            {hilQueue.length === 0 ? (
              <div style={{ ...S.panel, textAlign: "center", color: "#334155", fontSize: "11px" }}>
                ✓ No pending HIL tasks — queue clear
              </div>
            ) : (
              <div style={S.hilQueue}>
                {hilQueue.map(task => {
                  const biz = bizById[task.business_id];
                  const col = GROUP_COLOR[biz?.group || "CORE"];
                  const lk = `hil_${task.task_id}`;
                  return (
                    <div key={task.task_id} style={S.hilCard}>
                      <div style={S.hilTitle}>
                        ⏸ {task.label || task.subtask_key}
                      </div>
                      <div style={S.hilMeta}>
                        <span style={S.badge(col)}>{biz?.name || `BIZ-${task.business_id}`}</span>
                        &nbsp;&nbsp;
                        <span style={{ color: "#94a3b8" }}>{task.core_product_key}</span>
                        &nbsp;·&nbsp;
                        <span style={{ color: "#475569" }}>STAGE: {task.stage}</span>
                        &nbsp;·&nbsp;
                        <span style={{ color: "#334155" }}>{task.subtask_key}</span>
                        <br />
                        <span style={{ color: "#1e293b" }}>
                          wf: {task.workflow_id?.slice(0,16)}… · task: {task.task_id?.slice(0,16)}…
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button style={S.btn("approve")} disabled={loading[lk]}
                          onClick={() => hilAction(task, "approve")}>
                          {loading[lk] ? "⟳" : "✓ APPROVE"}
                        </button>
                        <button style={S.btn("reject")} disabled={loading[lk]}
                          onClick={() => hilAction(task, "reject")}>
                          {loading[lk] ? "⟳" : "✗ REJECT"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DASHBOARD TAB ── */}
        {tab === "dashboard" && (
          <div>
            <div style={S.metricGrid}>
              {[
                ["total_wf", "TOTAL WORKFLOWS"],
                ["succeeded", "SUCCEEDED"],
                ["running", "RUNNING"],
                ["hil_pending", "HIL PENDING"],
                ["biz_active", "BUSINESSES ACTIVE"],
                ["prods_tested", "PRODUCTS TESTED"],
              ].map(([k, l]) => (
                <div key={k} style={S.metric}>
                  <div style={S.metricVal}>{metrics?.[k] ?? "—"}</div>
                  <div style={S.metricLabel}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: "10px", color: "#334155", marginBottom: "8px", letterSpacing: "0.08em" }}>
              PRODUCT COVERAGE (ASSIGNED)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "4px", marginBottom: "20px" }}>
              {BUSINESSES.map(b => (
                <div key={b.id} style={{ background: "#0a0a14", border: "1px solid #1e1e2e", borderRadius: "3px", padding: "8px" }}>
                  <div style={{ fontSize: "9px", color: GROUP_COLOR[b.group]?.bg, marginBottom: "3px", letterSpacing: "0.06em" }}>
                    {b.name.toUpperCase().slice(0,20)}
                  </div>
                  <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                    {b.products.map(p => {
                      const cat = PROD_META[p.key]?.cat || "infra";
                      const catColors = {leadgen:"#f59e0b",sales:"#10b981",data:"#06b6d4",tasks:"#a78bfa",reporting:"#60a5fa",finance:"#34d399",content:"#f87171",infra:"#475569"};
                      return (
                        <div key={p.key} title={p.key} style={{
                          width: "10px", height: "10px", borderRadius: "1px",
                          background: catColors[cat] || "#334155",
                          opacity: 0.8,
                        }} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: "9px", color: "#334155", marginBottom: "8px" }}>
              CATEGORY KEY: &nbsp;
              {Object.entries({leadgen:"#f59e0b",sales:"#10b981",data:"#06b6d4",tasks:"#a78bfa",reporting:"#60a5fa",finance:"#34d399",content:"#f87171",infra:"#475569"}).map(([k,c]) => (
                <span key={k} style={{ marginRight: "10px" }}>
                  <span style={{ display:"inline-block", width:"8px", height:"8px", borderRadius:"1px", background:c, marginRight:"3px", verticalAlign:"middle" }} />
                  {k}
                </span>
              ))}
            </div>

            <div style={{ fontSize: "11px", color: "#334155", marginTop: "16px", padding: "12px", background: "#0a0a14", border: "1px solid #1e1e2e", borderRadius: "4px" }}>
              TARGET: Each product ≥5 runs · Each business ≥5 products tested · All HIL-approved before external publish<br />
              <span style={{ color: "#1e293b" }}>28 businesses × 50 products = 1,400 grid cells · 150 assigned slots · 10 products with 6th-slot coverage</span>
            </div>

            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <button style={S.btn("primary")} onClick={refreshData}>↺ REFRESH</button>
            </div>
          </div>
        )}

        {/* ── OP LOG TAB ── */}
        {tab === "log" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ fontSize: "10px", color: "#334155", letterSpacing: "0.08em" }}>OPERATION LOG</div>
              <button style={S.btn("primary")} onClick={() => setLogs([])}>CLEAR</button>
            </div>
            <div style={S.log}>
              {logs.length === 0
                ? <span style={{ color: "#1e293b" }}>No operations logged yet. Launch a workflow to begin.</span>
                : logs.map((l, i) => (
                  <div key={i} style={{
                    color: l.includes("✓") ? "#22c55e" : l.includes("✗") ? "#ef4444" : l.includes("⏸") ? "#a78bfa" : "#475569"
                  }}>{l}</div>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* TOAST */}
      {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
    </div>
  );
}
