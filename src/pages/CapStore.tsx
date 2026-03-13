import { useEffect, useState, useCallback, useRef } from "react";
import { bridgeSQL } from "@/lib/bridge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Save, Eye, EyeOff, ChevronDown, ChevronUp, Upload, X } from "lucide-react";

/* ─── types ─── */
interface CapRow {
  biz_key: string;
  group_name?: string;
  legal_name?: string;
  abn?: string;
  acn?: string;
  tagline?: string;
  description?: string;
  founded?: string;
  director?: string;
  hq?: string;
  status?: string;
  launch_date?: string;
  autonomy_tier?: string;
  kill_switch?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_heading?: string;
  font_body?: string;
  brand_voice?: string;
  aesthetic?: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  icon_url?: string;
  og_image_url?: string;
  gdrive_folder?: string;
  domain?: string;
  www_url?: string;
  vercel_project?: string;
  vercel_url?: string;
  github_repo?: string;
  platform?: string;
  hosting?: string;
  custom_domain_status?: string;
  ssl_status?: string;
  last_deploy?: string;
  analytics?: string;
  gtm_id?: string;
  ga_id?: string;
  cms?: string;
  uptime_monitor?: string;
  sentry_dsn?: string;
  aws_region?: string;
  aws_account?: string;
  lambda_prefix?: string;
  lambda_count?: string;
  supabase_schema?: string;
  s3_bucket?: string;
  cloudfront_id?: string;
  ses_region?: string;
  eventbridge_rule?: string;
  cfn_stack?: string;
  primary_email?: string;
  support_email?: string;
  ses_sender?: string;
  email_password?: string;
  email_host?: string;
  newsletter_list?: string;
  esp?: string;
  stripe_account_id?: string;
  stripe_brand_key?: string;
  stripe_pk?: string;
  stripe_sk?: string;
  stripe_webhook_secret?: string;
  checkout_url?: string;
  product_count?: string;
  price_count?: string;
  revenue_fy2425?: string;
  revenue_fy2526?: string;
  pricing_model?: string;
  currency?: string;
  brand_guide_url?: string;
  pitch_deck_url?: string;
  sow_url?: string;
  consent_pack_url?: string;
  one_pager_url?: string;
  media_kit_url?: string;
  contract_template_url?: string;
  nda_url?: string;
  terms_url?: string;
  privacy_url?: string;
  notion_page?: string;
  gdrive_root?: string;
  rdti_flag?: string;
  rdti_category?: string;
  ausindustry_reg?: string;
  rdti_fy2324?: string;
  rdti_fy2425?: string;
  rdti_fy2526?: string;
  ip_family_count?: string;
  ip_asset_count?: string;
  evidence_count?: string;
  patent_status?: string;
  patent_family?: string;
  rdti_notes?: string;
  internal_notes?: string;
  slack_channel?: string;
  notion_tasks?: string;
  jira_project?: string;
  platforms_json?: Record<string, Record<string, string>>;
  contacts_json?: Array<Record<string, string>>;
  updated_at?: string;
}

/* ─── constants ─── */
const BIZ_LIST = [
  { key: "T4H", name: "Tech 4 Humanity", group: "CORE", status: "active" },
  { key: "HOLO", name: "HoloOrg", group: "CORE", status: "active" },
  { key: "AHC", name: "AHC", group: "CORE", status: "active" },
  { key: "WFAI", name: "WorkFamilyAI", group: "CORE", status: "active" },
  { key: "HOB", name: "House of Biscuits", group: "RETAIL", status: "active" },
  { key: "ENTRA", name: "EnterAU", group: "RETAIL", status: "active" },
  { key: "GAIN", name: "GirlMath", group: "FUN", status: "active" },
  { key: "OUTRD", name: "OutcomeReady", group: "MISSION", status: "active" },
  { key: "OR", name: "OutcomeReady Pilot", group: "MISSION", status: "active" },
  { key: "GCBAT", name: "GC-BAT", group: "SIGNAL", status: "hold" },
  { key: "CX", name: "ConsentX", group: "SIGNAL", status: "hold" },
  { key: "FC", name: "Far-Cage", group: "SIGNAL", status: "hold" },
  { key: "MNS", name: "MyNeuralSignal", group: "SIGNAL", status: "hold" },
  { key: "NPRK", name: "NEUROPAK", group: "SIGNAL", status: "hold" },
  { key: "RTPK", name: "RATPAK", group: "SIGNAL", status: "hold" },
  { key: "LGP", name: "LifeGraph+", group: "SIGNAL", status: "hold" },
  { key: "AIOLY", name: "AI-Olympics", group: "SIGNAL", status: "hold" },
  { key: "APEX", name: "ApexPredator", group: "FUN", status: "hold" },
  { key: "XCES", name: "XCES", group: "RETAIL", status: "hold" },
  { key: "MC", name: "MissionCritical", group: "MISSION", status: "hold" },
  { key: "SP", name: "SmartPark", group: "MISSION", status: "hold" },
  { key: "ML", name: "MedLedger", group: "MISSION", status: "hold" },
  { key: "AQM", name: "AquaMe", group: "MISSION", status: "hold" },
  { key: "APAC", name: "APAC-JWO", group: "RETAIL", status: "hold" },
  { key: "VT", name: "VuonTroi", group: "RETAIL", status: "hold" },
  { key: "JP", name: "JustPoint", group: "RETAIL", status: "hold" },
  { key: "ES", name: "ExtremeSpotto", group: "FUN", status: "hold" },
  { key: "AIO", name: "AIOopsies", group: "FUN", status: "hold" },
  { key: "RM", name: "RhythmMethod", group: "FUN", status: "hold" },
];

const IMG_KEYS = new Set(["logo_url", "logo_dark_url", "favicon_url", "icon_url", "og_image_url"]);
const SECRET_KEYS = new Set(["email_password", "sentry_dsn", "stripe_pk", "stripe_sk", "stripe_webhook_secret"]);

const TABS = ["Identity", "Brand", "Web & Infra", "Socials", "Commerce", "Docs", "RDTI & IP", "Contacts", "Notes"];

const PLATFORMS = [
  { id: "twitter", name: "X / Twitter", color: "#000", abbr: "X" },
  { id: "linkedin_co", name: "LinkedIn (Company)", color: "#0077B5", abbr: "LI" },
  { id: "linkedin_p", name: "LinkedIn (Personal)", color: "#0A66C2", abbr: "LP" },
  { id: "tiktok", name: "TikTok", color: "#010101", abbr: "TT" },
  { id: "instagram", name: "Instagram", color: "#E1306C", abbr: "IG" },
  { id: "facebook", name: "Facebook", color: "#1877F2", abbr: "FB" },
  { id: "youtube", name: "YouTube", color: "#FF0000", abbr: "YT" },
  { id: "threads", name: "Threads", color: "#111", abbr: "TH" },
  { id: "discord", name: "Discord", color: "#5865F2", abbr: "DC" },
  { id: "reddit", name: "Reddit", color: "#FF4500", abbr: "RD" },
];

const PLAT_FIELDS = [
  { key: "handle", label: "Handle / @", ph: "@username" },
  { key: "account_email", label: "Account email", ph: "email@example.com" },
  { key: "password", label: "Password", ph: "••••••••", secret: true },
  { key: "twofa", label: "2FA method", ph: "Authy / SMS / none" },
  { key: "app_id", label: "App / Client ID", ph: "…", secret: true },
  { key: "api_key", label: "API key", ph: "…", secret: true },
  { key: "api_secret", label: "API secret", ph: "…", secret: true },
  { key: "access_token", label: "Access token", ph: "…", secret: true },
  { key: "profile_url", label: "Profile URL", ph: "https://…" },
  { key: "followers", label: "Followers", ph: "0" },
  { key: "ad_account", label: "Ad account ID", ph: "…" },
];

type TabSection = {
  title: string;
  sub?: string;
  warn?: boolean;
  rows: { key: keyof CapRow; label: string; ph: string; mono?: boolean; color?: boolean; secret?: boolean; multi?: boolean }[];
};

const SCHEMA: Record<string, TabSection[]> = {
  Identity: [
    { title: "Business", sub: "Legal identity", rows: [
      { key: "biz_key", label: "Biz key", ph: "T4H", mono: true },
      { key: "group_name", label: "Group", ph: "CORE / SIGNAL…" },
      { key: "legal_name", label: "Legal name", ph: "Tech 4 Humanity Pty Ltd" },
      { key: "abn", label: "ABN", ph: "61 605 746 618", mono: true },
      { key: "acn", label: "ACN", ph: "70 666 271 272", mono: true },
      { key: "founded", label: "Founded", ph: "2022" },
      { key: "director", label: "Director", ph: "Troy" },
      { key: "hq", label: "HQ address", ph: "Sydney, NSW, Australia" },
      { key: "tagline", label: "Tagline", ph: "—" },
      { key: "description", label: "Description", ph: "One-liner", multi: true },
    ]},
    { title: "Ops", sub: "State and controls", rows: [
      { key: "status", label: "Status", ph: "active / hold / off" },
      { key: "launch_date", label: "Launch date", ph: "YYYY-MM-DD", mono: true },
      { key: "autonomy_tier", label: "Autonomy tier", ph: "AUTONOMOUS / GATED / BLOCKED" },
      { key: "kill_switch", label: "Kill switch", ph: "ENV var name", mono: true },
    ]},
  ],
  Brand: [
    { title: "Visual identity", rows: [
      { key: "primary_color", label: "Primary colour", ph: "#000000", mono: true, color: true },
      { key: "secondary_color", label: "Secondary colour", ph: "#FFFFFF", mono: true, color: true },
      { key: "accent_color", label: "Accent colour", ph: "#FF3300", mono: true, color: true },
      { key: "font_heading", label: "Heading font", ph: "DM Serif…" },
      { key: "font_body", label: "Body font", ph: "Inter…" },
      { key: "brand_voice", label: "Brand voice", ph: "Bold / Minimal…" },
      { key: "aesthetic", label: "Aesthetic", ph: "Brutalist / Luxury…" },
    ]},
    { title: "Assets", sub: "Drop images directly onto field", rows: [
      { key: "logo_url", label: "Logo (light)", ph: "Drop or paste URL" },
      { key: "logo_dark_url", label: "Logo (dark)", ph: "Drop or paste URL" },
      { key: "favicon_url", label: "Favicon", ph: "Drop or paste URL" },
      { key: "icon_url", label: "App icon", ph: "Drop or paste URL" },
      { key: "og_image_url", label: "OG image", ph: "Drop or paste URL" },
      { key: "gdrive_folder", label: "GDrive brand folder", ph: "1KMKky0Q…", mono: true },
    ]},
  ],
  "Web & Infra": [
    { title: "Domain & deployment", rows: [
      { key: "domain", label: "Primary domain", ph: "example.com" },
      { key: "www_url", label: "Live URL", ph: "https://example.com" },
      { key: "vercel_project", label: "Vercel project", ph: "my-project", mono: true },
      { key: "vercel_url", label: "Vercel preview URL", ph: "project.vercel.app", mono: true },
      { key: "github_repo", label: "GitHub repo", ph: "TML-4PM/repo", mono: true },
      { key: "platform", label: "Platform", ph: "Next.js / Webflow…" },
      { key: "hosting", label: "Hosting", ph: "Vercel / AWS…" },
      { key: "custom_domain_status", label: "Custom domain", ph: "wired / pending" },
      { key: "ssl_status", label: "SSL", ph: "active / pending" },
      { key: "last_deploy", label: "Last deploy", ph: "YYYY-MM-DD", mono: true },
    ]},
    { title: "Infrastructure", rows: [
      { key: "aws_region", label: "AWS region", ph: "ap-southeast-2", mono: true },
      { key: "aws_account", label: "AWS account", ph: "140548542136", mono: true },
      { key: "lambda_prefix", label: "Lambda prefix", ph: "my-fn-", mono: true },
      { key: "lambda_count", label: "Lambda count", ph: "0" },
      { key: "supabase_schema", label: "Supabase schema", ph: "public", mono: true },
      { key: "s3_bucket", label: "S3 bucket", ph: "my-bucket", mono: true },
      { key: "cloudfront_id", label: "CloudFront ID", ph: "E…", mono: true },
      { key: "cfn_stack", label: "CFN stack", ph: "my-stack", mono: true },
      { key: "eventbridge_rule", label: "EventBridge rule", ph: "my-rule", mono: true },
    ]},
    { title: "Analytics", rows: [
      { key: "analytics", label: "Analytics", ph: "GA4 / Plausible…" },
      { key: "gtm_id", label: "GTM ID", ph: "GTM-XXXXX", mono: true },
      { key: "ga_id", label: "GA4 ID", ph: "G-XXXXXXXXX", mono: true },
      { key: "cms", label: "CMS", ph: "Contentful / Sanity…" },
      { key: "uptime_monitor", label: "Uptime monitor", ph: "Healthchecks…" },
      { key: "sentry_dsn", label: "Sentry DSN", ph: "https://…", secret: true },
    ]},
    { title: "Email & comms", warn: true, sub: "Testing — not wired to send", rows: [
      { key: "primary_email", label: "Primary email", ph: "hello@example.com" },
      { key: "support_email", label: "Support email", ph: "support@example.com" },
      { key: "ses_sender", label: "SES sender", ph: "noreply@…", mono: true },
      { key: "email_password", label: "Email password", ph: "••••••••", secret: true },
      { key: "email_host", label: "Email host", ph: "Google Workspace / SES" },
      { key: "newsletter_list", label: "Newsletter list ID", ph: "…", mono: true },
      { key: "esp", label: "ESP", ph: "Mailchimp / Klaviyo…" },
    ]},
  ],
  Commerce: [
    { title: "Stripe", rows: [
      { key: "stripe_account_id", label: "Account ID", ph: "acct_…", mono: true },
      { key: "stripe_brand_key", label: "Brand key", ph: "HOB / HOLO…", mono: true },
      { key: "stripe_pk", label: "Publishable key", ph: "pk_live_…", mono: true, secret: true },
      { key: "stripe_sk", label: "Secret key", ph: "sk_live_…", mono: true, secret: true },
      { key: "stripe_webhook_secret", label: "Webhook secret", ph: "whsec_…", mono: true, secret: true },
      { key: "checkout_url", label: "Checkout URL", ph: "https://…" },
    ]},
    { title: "Revenue", rows: [
      { key: "product_count", label: "Products", ph: "0" },
      { key: "price_count", label: "Prices", ph: "0" },
      { key: "revenue_fy2425", label: "Revenue FY24-25", ph: "$0" },
      { key: "revenue_fy2526", label: "Revenue FY25-26 YTD", ph: "$0" },
      { key: "pricing_model", label: "Pricing model", ph: "subscription / one-time" },
      { key: "currency", label: "Currency", ph: "AUD" },
    ]},
  ],
  Docs: [
    { title: "Documents", sub: "GDrive, Notion and public links", rows: [
      { key: "brand_guide_url", label: "Brand guide", ph: "GDrive URL" },
      { key: "pitch_deck_url", label: "Pitch deck", ph: "GDrive URL" },
      { key: "sow_url", label: "SOW / proposal", ph: "GDrive URL" },
      { key: "consent_pack_url", label: "Consent pack", ph: "GDrive URL" },
      { key: "one_pager_url", label: "One-pager", ph: "GDrive URL" },
      { key: "media_kit_url", label: "Media kit", ph: "GDrive URL" },
      { key: "contract_template_url", label: "Contract template", ph: "GDrive URL" },
      { key: "nda_url", label: "NDA template", ph: "GDrive URL" },
      { key: "terms_url", label: "Terms of service", ph: "https://…" },
      { key: "privacy_url", label: "Privacy policy", ph: "https://…" },
      { key: "notion_page", label: "Notion page", ph: "notion.so/…" },
      { key: "gdrive_root", label: "GDrive root folder", ph: "folder ID…", mono: true },
    ]},
  ],
  "RDTI & IP": [
    { title: "R&D classification", rows: [
      { key: "rdti_flag", label: "R&D eligible", ph: "YES / NO" },
      { key: "rdti_category", label: "Category", ph: "Core R&D / Supporting" },
      { key: "ausindustry_reg", label: "AusIndustry reg", ph: "pending / submitted" },
      { key: "rdti_fy2324", label: "Claim FY23-24", ph: "$0" },
      { key: "rdti_fy2425", label: "Claim FY24-25", ph: "$0" },
      { key: "rdti_fy2526", label: "Claim FY25-26", ph: "$0" },
    ]},
    { title: "IP portfolio", rows: [
      { key: "ip_family_count", label: "IP families", ph: "0" },
      { key: "ip_asset_count", label: "IP assets", ph: "0" },
      { key: "evidence_count", label: "Evidence items", ph: "0" },
      { key: "patent_status", label: "Patent status", ph: "provisional / full / none" },
      { key: "patent_family", label: "Patent family", ph: "Family A…", mono: true },
      { key: "rdti_notes", label: "Notes", ph: "Evidence gaps…", multi: true },
    ]},
  ],
  Notes: [
    { title: "Internal", rows: [
      { key: "internal_notes", label: "Notes", ph: "Free text…", multi: true },
      { key: "slack_channel", label: "Slack channel", ph: "#t4h-general", mono: true },
      { key: "notion_tasks", label: "Notion tasks", ph: "notion.so/…" },
      { key: "jira_project", label: "Jira project", ph: "T4H-…", mono: true },
    ]},
  ],
};

/* ─── helpers ─── */
const SB_URL = "https://lzfgigiyqpuuxslsygjt.supabase.co/rest/v1";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxNzQ2OSwiZXhwIjoyMDU5OTkzNDY5fQ.B6SMaQNb8tER_vqrqkmjNW2BFjcoIowulQOREtRcD8Q";
const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

const fmt = (d?: string) => d ? new Date(d).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

/* ─── component ─── */
const CapStore = () => {
  const [curBiz, setCurBiz] = useState("T4H");
  const [curTab, setCurTab] = useState("Identity");
  const [data, setData] = useState<Record<string, CapRow>>({});
  const [contacts, setContacts] = useState<Record<string, Array<Record<string, string>>>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedAt, setSavedAt] = useState<string>("");
  const [secVisible, setSecVisible] = useState<Record<string, boolean>>({});
  const [platOpen, setPlatOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getRow = (biz: string): CapRow => data[biz] || { biz_key: biz };
  const getCons = (biz: string) => contacts[biz] || [{ name: "", role: "", email: "", phone: "", last_touch: "" }];

  const loadBiz = useCallback(async (biz: string) => {
    setLoading(true);
    try {
      const r = await fetch(`${SB_URL}/cap_store?biz_key=eq.${biz}&select=*`, { headers: sbHeaders });
      const rows: CapRow[] = await r.json();
      if (rows && rows[0]) {
        setData(prev => ({ ...prev, [biz]: rows[0] }));
        setContacts(prev => ({ ...prev, [biz]: Array.isArray(rows[0].contacts_json) ? rows[0].contacts_json as Array<Record<string,string>> : [{ name: "", role: "", email: "", phone: "", last_touch: "" }] }));
        setSavedAt(rows[0].updated_at ? fmt(rows[0].updated_at) : "");
      } else {
        setData(prev => ({ ...prev, [biz]: { biz_key: biz } }));
        setContacts(prev => ({ ...prev, [biz]: [{ name: "", role: "", email: "", phone: "", last_touch: "" }] }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadBiz(curBiz); }, [curBiz, loadBiz]);

  const queueSave = useCallback((biz: string, row: CapRow, cons: Array<Record<string,string>>) => {
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const payload = { ...row, contacts_json: cons, platforms_json: row.platforms_json || {}, updated_at: new Date().toISOString() };
        const r = await fetch(`${SB_URL}/cap_store`, {
          method: "POST",
          headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify(payload),
        });
        if (r.ok || r.status === 201 || r.status === 204) {
          setSaveState("saved");
          setSavedAt(fmt(new Date().toISOString()));
        } else { setSaveState("error"); }
      } catch { setSaveState("error"); }
    }, 800);
  }, []);

  const setField = (biz: string, key: keyof CapRow, val: string) => {
    setData(prev => {
      const updated = { ...prev[biz], biz_key: biz, [key]: val };
      queueSave(biz, updated, getCons(biz));
      return { ...prev, [biz]: updated };
    });
  };

  const setPlatField = (biz: string, pid: string, key: string, val: string) => {
    setData(prev => {
      const row = prev[biz] || { biz_key: biz };
      const plats = { ...(row.platforms_json || {}), [pid]: { ...((row.platforms_json || {})[pid] || {}), [key]: val } };
      const updated = { ...row, platforms_json: plats };
      queueSave(biz, updated, getCons(biz));
      return { ...prev, [biz]: updated };
    });
  };

  const updateCon = (biz: string, idx: number, key: string, val: string) => {
    setContacts(prev => {
      const cons = [...(prev[biz] || [])];
      if (!cons[idx]) cons[idx] = {};
      cons[idx] = { ...cons[idx], [key]: val };
      queueSave(biz, getRow(biz), cons);
      return { ...prev, [biz]: cons };
    });
  };

  const addCon = (biz: string) => {
    setContacts(prev => ({ ...prev, [biz]: [...(prev[biz] || []), { name: "", role: "", email: "", phone: "", last_touch: "" }] }));
  };

  const handleDrop = (biz: string, key: keyof CapRow, e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files?.length) {
      const f = files[0];
      if (f.type.startsWith("image/")) {
        const fr = new FileReader();
        fr.onload = ev => setField(biz, key, ev.target?.result as string || "");
        fr.readAsDataURL(f);
        return;
      }
      if (f.type.startsWith("text/") || f.name.endsWith(".txt")) {
        const fr = new FileReader();
        fr.onload = ev => setField(biz, key, ev.target?.result as string || "");
        fr.readAsText(f);
        return;
      }
    }
    const txt = e.dataTransfer.getData("text/plain");
    if (txt) setField(biz, key, txt);
  };

  /* ─── render helpers ─── */
  const toggleSec = (k: string) => setSecVisible(prev => ({ ...prev, [k]: !prev[k] }));
  const togglePlat = (pid: string) => setPlatOpen(prev => ({ ...prev, [pid]: !prev[pid] }));

  const biz = curBiz;
  const row = getRow(biz);

  const renderField = (key: keyof CapRow, label: string, ph: string, opts: { mono?: boolean; color?: boolean; secret?: boolean; multi?: boolean } = {}) => {
    const val = (row[key] as string) || "";
    const sk = `${biz}__${key}`;
    const vis = secVisible[sk];
    const disp = opts.secret && !vis && val ? "••••••••" : val;
    const isImg = IMG_KEYS.has(key);

    return (
      <div key={key} className="flex items-start gap-3 px-4 py-2.5 border-b border-slate-800/60 last:border-0">
        <span className="min-w-[160px] text-xs text-slate-400 pt-1 shrink-0">{label}</span>
        <div className="flex-1 flex items-start gap-2 min-w-0">
          {opts.color && val && (
            <div className="w-3 h-3 rounded mt-1.5 shrink-0 border border-slate-600" style={{ background: val }} />
          )}
          {isImg && val && (
            <img src={val} alt="" className="w-7 h-7 object-contain rounded shrink-0 border border-slate-700" onError={e => (e.currentTarget.style.display = "none")} />
          )}
          {opts.multi ? (
            <textarea
              className="flex-1 bg-transparent text-sm text-slate-200 outline-none resize-none min-h-[56px] font-sans placeholder:text-slate-600 hover:bg-slate-800/40 focus:bg-slate-800/60 rounded px-1 py-0.5"
              placeholder={ph}
              defaultValue={val}
              onBlur={e => setField(biz, key, e.target.value)}
              onDrop={e => handleDrop(biz, key, e)}
            />
          ) : (
            <input
              className={`flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600 hover:bg-slate-800/40 focus:bg-slate-800/60 rounded px-1 py-0.5 ${opts.mono ? "font-mono text-xs" : "font-sans"} ${opts.secret && !vis ? "text-slate-500" : "text-slate-200"}`}
              type="text"
              placeholder={ph}
              defaultValue={disp}
              onFocus={e => { if (opts.secret) e.target.value = val; }}
              onBlur={e => setField(biz, key, e.target.value)}
              onDrop={e => handleDrop(biz, key, e)}
              onDragOver={e => e.preventDefault()}
            />
          )}
          {opts.secret && (
            <button onClick={() => toggleSec(sk)} className="text-slate-600 hover:text-slate-300 shrink-0 mt-0.5">
              {vis ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
          {isImg && val && (
            <button onClick={() => setField(biz, key, "")} className="text-slate-600 hover:text-slate-300 shrink-0 mt-0.5">
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (sec: TabSection) => (
    <div key={sec.title} className="mb-4">
      <div className="mb-2">
        <span className="text-xs font-medium text-slate-300">{sec.title}</span>
        {sec.warn && <span className="ml-2 text-[10px] bg-amber-900/50 text-amber-400 px-1.5 py-0.5 rounded font-medium">TESTING</span>}
        {sec.sub && <span className="ml-2 text-[11px] text-slate-500">{sec.sub}</span>}
      </div>
      <div className="bg-slate-900 border border-slate-700/60 rounded-lg overflow-hidden">
        {sec.rows.map(r => renderField(r.key, r.label, r.ph, r))}
      </div>
    </div>
  );

  const renderPlatforms = () => (
    <div className="bg-slate-900 border border-slate-700/60 rounded-lg overflow-hidden mb-4">
      {PLATFORMS.map(p => {
        const ps = (row.platforms_json || {})[p.id] || {};
        const filled = PLAT_FIELDS.filter(f => ps[f.key]?.trim()).length;
        const isOpen = platOpen[p.id];
        return (
          <div key={p.id} className="border-b border-slate-800/60 last:border-0">
            <div className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-slate-800/40" onClick={() => togglePlat(p.id)}>
              <div className="w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center shrink-0" style={{ background: p.color + "25", color: p.color }}>{p.abbr}</div>
              <span className="text-sm text-slate-300">{p.name}</span>
              <div className={`ml-auto w-1.5 h-1.5 rounded-full mr-2 ${filled === 0 ? "bg-slate-600" : filled < PLAT_FIELDS.length ? "bg-amber-500" : "bg-emerald-500"}`} />
              {isOpen ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
            </div>
            {isOpen && (
              <div className="border-t border-slate-800/60">
                {PLAT_FIELDS.map(f => {
                  const val = ps[f.key] || "";
                  const sk = `${biz}__${p.id}__${f.key}`;
                  const vis = secVisible[sk];
                  return (
                    <div key={f.key} className="flex items-center gap-3 px-4 py-2 border-b border-slate-800/40 last:border-0">
                      <span className="min-w-[150px] text-xs text-slate-500 shrink-0">{f.label}</span>
                      <input
                        className={`flex-1 bg-transparent text-xs outline-none placeholder:text-slate-700 hover:bg-slate-800/40 focus:bg-slate-800/60 rounded px-1 py-0.5 ${f.secret && !vis ? "text-slate-500 font-mono" : "text-slate-300 font-mono"}`}
                        placeholder={f.ph}
                        defaultValue={f.secret && !vis && val ? "••••••••" : val}
                        onFocus={e => { if (f.secret) e.target.value = val; }}
                        onBlur={e => setPlatField(biz, p.id, f.key, e.target.value)}
                      />
                      {f.secret && (
                        <button onClick={() => toggleSec(sk)} className="text-slate-600 hover:text-slate-300">
                          {vis ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderContacts = () => {
    const cons = getCons(biz);
    const colKeys = ["name", "role", "email", "phone", "last_touch"];
    const colLabels = ["Name", "Role", "Email", "Phone", "Last touch"];
    return (
      <div className="bg-slate-900 border border-slate-700/60 rounded-lg overflow-hidden mb-4">
        <div className="grid grid-cols-5 bg-slate-800/60">
          {colLabels.map(c => <div key={c} className="px-3 py-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider">{c}</div>)}
        </div>
        {cons.map((r, i) => (
          <div key={i} className="grid grid-cols-5 border-t border-slate-800/60">
            {colKeys.map(k => (
              <div key={k} className="px-3 py-2">
                <input
                  className="w-full bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-700 hover:bg-slate-800/40 focus:bg-slate-800/60 rounded px-1"
                  placeholder="—"
                  defaultValue={r[k] || ""}
                  onBlur={e => updateCon(biz, i, k, e.target.value)}
                />
              </div>
            ))}
          </div>
        ))}
        <button onClick={() => addCon(biz)} className="w-full px-4 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 text-left border-t border-slate-800/60 flex items-center gap-1">
          <span>+</span> add contact
        </button>
      </div>
    );
  };

  const renderTabContent = () => {
    if (curTab === "Socials") return (
      <div>
        <div className="mb-2"><span className="text-xs font-medium text-slate-300">Social media accounts</span><span className="ml-2 text-[11px] text-slate-500">Click to expand — handles, passwords, API keys</span></div>
        {renderPlatforms()}
      </div>
    );
    if (curTab === "Contacts") return (
      <div>
        <div className="mb-2"><span className="text-xs font-medium text-slate-300">Contacts & CRM</span></div>
        {renderContacts()}
      </div>
    );
    const sections = SCHEMA[curTab] || [];
    return <>{sections.map(sec => renderSection(sec))}</>;
  };

  const bizMeta = BIZ_LIST.find(b => b.key === biz);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      {/* header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select
          value={curBiz}
          onChange={e => setCurBiz(e.target.value)}
          className="bg-transparent text-base font-semibold text-slate-100 border-none outline-none cursor-pointer"
        >
          {BIZ_LIST.map(b => <option key={b.key} value={b.key} className="bg-slate-900">{b.name} ({b.key})</option>)}
        </select>
        <Badge variant="outline" className={`text-[10px] font-medium tracking-wide ${bizMeta?.status === "active" ? "border-emerald-700 text-emerald-400" : "border-amber-700 text-amber-400"}`}>
          {bizMeta?.group} · {bizMeta?.status?.toUpperCase()}
        </Badge>
        <div className="ml-auto flex items-center gap-2 text-xs">
          {saveState === "saving" && <span className="text-amber-400 flex items-center gap-1"><Save size={11} className="animate-pulse" /> saving…</span>}
          {saveState === "saved" && <span className="text-emerald-400 flex items-center gap-1"><Save size={11} /> {savedAt}</span>}
          {saveState === "error" && <span className="text-red-400">save failed</span>}
          <button onClick={() => loadBiz(curBiz)} className="text-slate-500 hover:text-slate-300 ml-1">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Domain", val: row.domain || "—" },
          { label: "Status", val: row.status || "—" },
          { label: "Stripe", val: row.stripe_brand_key || "—" },
          { label: "RDTI", val: row.rdti_flag || "—" },
        ].map(s => (
          <Card key={s.label} className="bg-slate-900 border-slate-700/60">
            <CardContent className="p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{s.label}</div>
              <div className="text-sm font-mono text-slate-300 truncate">{s.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* tabs */}
      <div className="flex gap-0 border-b border-slate-800 mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setCurTab(t)}
            className={`text-xs px-3 py-2 whitespace-nowrap border-b-2 -mb-px ${curTab === t ? "border-slate-300 text-slate-200 font-medium" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* content */}
      {loading ? (
        <div className="text-xs text-slate-500 flex items-center gap-2 py-8">
          <RefreshCw size={13} className="animate-spin" /> loading {biz}…
        </div>
      ) : renderTabContent()}
    </div>
  );
};

export default CapStore;
