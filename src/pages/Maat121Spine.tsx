import { useState, useCallback, useEffect, useRef } from "react";

// ─── Bridge ────────────────────────────────────────────────────────────────
const BRIDGE = "https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke";
const BRIDGE_KEY = "bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4";
const SUPABASE_URL = "https://lzfgigiyqpuuxslsygjt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxNzQ2OSwiZXhwIjoyMDU5OTkzNDY5fQ.B6SMaQNb8tER_vqrqkmjNW2BFjcoIowulQOREtRcD8Q";

async function sql(query: string): Promise<any[]> {
  const r = await fetch(BRIDGE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${BRIDGE_KEY}`,
      "x-api-key": BRIDGE_KEY,
    },
    body: JSON.stringify({ fn: "troy-sql-executor", sql: query }),
  });
  const d = await r.json();
  return d.rows ?? [];
}

// sha256 in browser
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Types ─────────────────────────────────────────────────────────────────
type AuthUser = { id: string; email: string; display_name: string; role: string };
type ReportDef = { key: string; wave: number; group: string; title: string; status: string; src: string; lodge: boolean; audit: boolean; gen: boolean; blocker: string };
type ReportData = { rows: any[]; cols: string[]; generated_at: string };

// ─── Report definitions (85 docs) ──────────────────────────────────────────
const REPORTS: ReportDef[] = [
  {key:"W0-001",wave:0,group:"RDTI Program",title:"R&D Program Register",status:"GENERATABLE",src:"maat_rd_projects",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-002",wave:0,group:"RDTI Program",title:"R&D Activity Register",status:"GENERATABLE",src:"maat_rd_projects",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-003",wave:0,group:"RDTI Program",title:"Technical Uncertainty Statements",status:"GENERATABLE",src:"maat_rd_projects",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-004",wave:0,group:"RDTI Program",title:"Experiment Design Documents",status:"GENERATABLE",src:"maat_rd_projects",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-005",wave:0,group:"RDTI Program",title:"Iteration Logs",status:"PARTIAL",src:"maat_timesheets",lodge:true,audit:true,gen:false,blocker:"FY23-24/FY24-25 timesheets missing"},
  {key:"W0-006",wave:0,group:"RDTI Program",title:"Failure Logs",status:"PARTIAL",src:"maat_rd_projects",lodge:true,audit:true,gen:false,blocker:"Narrative completion needed"},
  {key:"W0-007",wave:0,group:"RDTI Program",title:"Technical Conclusions Summary",status:"GENERATABLE",src:"maat_rd_projects",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-008",wave:0,group:"RDTI Program",title:"R&D Timeline (milestone log)",status:"GENERATABLE",src:"maat_rd_projects",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-009",wave:0,group:"RDTI Program",title:"Version-controlled Research Plan",status:"PARTIAL",src:"research_asset_register",lodge:true,audit:true,gen:false,blocker:"Git snapshot verification needed"},
  {key:"W0-010",wave:0,group:"RDTI Financials",title:"R&D Cost Allocation Report",status:"GENERATABLE",src:"v_rdti_by_fy",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-011",wave:0,group:"RDTI Financials",title:"Apportionment Methodology Document",status:"GENERATABLE",src:"maat_rd_projects",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-012",wave:0,group:"RDTI Financials",title:"Internal R&D Claim Justification Memo",status:"GENERATABLE",src:"v_rdti_by_fy",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-013",wave:0,group:"RDTI Financials",title:"Board Sign-off on R&D Claim",status:"MISSING",src:"Director resolution",lodge:true,audit:true,gen:false,blocker:"Troy must execute as sole director"},
  {key:"W0-014",wave:0,group:"Evidence Pack",title:"R&D Evidence Matrix",status:"GENERATABLE",src:"maat_evidence_registry",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-015",wave:0,group:"Evidence Pack",title:"Contemporaneous Records Pack",status:"GENERATABLE",src:"maat_timesheets",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-016",wave:0,group:"Tax & BAS",title:"ATO BAS Statements — All Quarters",status:"GENERATABLE",src:"maat_bas_periods",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-017",wave:0,group:"Tax & BAS",title:"GST Working Papers",status:"GENERATABLE",src:"maat_bas_periods",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W0-018",wave:0,group:"Tax & BAS",title:"Income Tax Return (Company)",status:"MISSING",src:"Hales Redden",lodge:true,audit:true,gen:false,blocker:"External — Gordon McKirdy only"},
  {key:"W0-019",wave:0,group:"Tax & BAS",title:"PAYG Summaries",status:"MISSING",src:"N/A",lodge:true,audit:true,gen:false,blocker:"Director only entity — confirm N/A"},
  {key:"W0-020",wave:0,group:"Tax & BAS",title:"Bank Statements (All Accounts)",status:"PARTIAL",src:"maat_bank_accounts",lodge:true,audit:true,gen:false,blocker:"Amex Feb/Mar + ANZ Dec23/Mar26 missing"},
  {key:"W0-021",wave:0,group:"Tax & BAS",title:"Stripe Export",status:"MISSING",src:"N/A",lodge:true,audit:false,gen:false,blocker:"Pre-revenue — no Stripe data"},
  {key:"W0-022",wave:0,group:"Tax & BAS",title:"Director Loan Ledger",status:"GENERATABLE",src:"maat_div7a_rates",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-001",wave:1,group:"Core Financials",title:"Trial Balance",status:"GENERATABLE",src:"maat_journal",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-002",wave:1,group:"Core Financials",title:"General Ledger",status:"GENERATABLE",src:"maat_journal",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-003",wave:1,group:"Core Financials",title:"Profit & Loss (All FY)",status:"GENERATABLE",src:"v_pl_t4h_by_fy",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-004",wave:1,group:"Core Financials",title:"Balance Sheet",status:"PARTIAL",src:"maat_journal",lodge:true,audit:true,gen:false,blocker:"Formal closing entries needed"},
  {key:"W1-005",wave:1,group:"Core Financials",title:"Cash Flow Statement",status:"PARTIAL",src:"maat_transactions",lodge:true,audit:true,gen:false,blocker:"Amex Feb/Mar gap"},
  {key:"W1-006",wave:1,group:"Core Financials",title:"Working Papers",status:"GENERATABLE",src:"v_pl_t4h_by_fy",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-007",wave:1,group:"Expense Analysis",title:"Expense Breakdown by Category",status:"GENERATABLE",src:"v_pl_t4h_by_fy",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-008",wave:1,group:"Expense Analysis",title:"Capital vs Expense Classification",status:"GENERATABLE",src:"maat_fixed_asset_register",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-009",wave:1,group:"Assets & Loans",title:"Director Loan Movement Summary",status:"GENERATABLE",src:"v_maat_api_director_loan",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-010",wave:1,group:"Assets & Loans",title:"Asset Register",status:"GENERATABLE",src:"maat_fixed_asset_register",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-011",wave:1,group:"Assets & Loans",title:"Depreciation Schedule",status:"GENERATABLE",src:"v_maat_depreciation_schedule",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-012",wave:1,group:"N/A",title:"Aged Receivables Report",status:"MISSING",src:"N/A",lodge:false,audit:false,gen:false,blocker:"Pre-revenue — no receivables"},
  {key:"W1-013",wave:1,group:"N/A",title:"Aged Payables Report",status:"MISSING",src:"N/A",lodge:false,audit:false,gen:false,blocker:"Cash basis contractors"},
  {key:"W1-014",wave:1,group:"Expense Analysis",title:"R&D Adjustment Schedule",status:"GENERATABLE",src:"v_rdti_by_fy",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-015",wave:1,group:"Expense Analysis",title:"Non-Deductible Expense Schedule",status:"GENERATABLE",src:"v_pl_t4h_by_fy",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W1-016",wave:1,group:"Expense Analysis",title:"Private Use Adjustments",status:"PARTIAL",src:"maat_transactions",lodge:true,audit:true,gen:false,blocker:"Motor vehicle % + home office % needed"},
  {key:"W1-017",wave:1,group:"Expense Analysis",title:"GST Adjustment Summary",status:"GENERATABLE",src:"maat_bas_periods",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-001",wave:2,group:"Transaction Data",title:"MAAT Transaction Export (Raw)",status:"GENERATABLE",src:"maat_transactions",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-002",wave:2,group:"Transaction Data",title:"Categorised Transaction Ledger",status:"GENERATABLE",src:"maat_transactions",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-003",wave:2,group:"Mapping & Rules",title:"Business Slug Mapping",status:"GENERATABLE",src:"t4h_business_canonical",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-004",wave:2,group:"Mapping & Rules",title:"Cost Centre Mapping",status:"GENERATABLE",src:"maat_bank_coa_map",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-005",wave:2,group:"Mapping & Rules",title:"R&D vs Non-R&D Allocation Logic",status:"GENERATABLE",src:"maat_classification_rules",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-006",wave:2,group:"Evidence & Coverage",title:"Evidence Binding Table",status:"GENERATABLE",src:"maat_evidence_link",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-007",wave:2,group:"Mapping & Rules",title:"Allocation Rules Documentation",status:"GENERATABLE",src:"maat_classification_rules",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-008",wave:2,group:"System Docs",title:"MAAT Schema Definition",status:"GENERATABLE",src:"information_schema",lodge:false,audit:true,gen:true,blocker:""},
  {key:"W2-009",wave:2,group:"System Docs",title:"MAAT Change Log",status:"PARTIAL",src:"maat_immutable_event",lodge:false,audit:true,gen:false,blocker:"Full history may be incomplete"},
  {key:"W2-010",wave:2,group:"System Docs",title:"Exception Register",status:"GENERATABLE",src:"maat_exception_queue",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-011",wave:2,group:"Reconciliations",title:"MAAT vs Bank Reconciliation",status:"PARTIAL",src:"v_maat_bank_recon_summary",lodge:true,audit:true,gen:false,blocker:"Amex Feb/Mar + ANZ gaps"},
  {key:"W2-012",wave:2,group:"Reconciliations",title:"MAAT vs Stripe Reconciliation",status:"MISSING",src:"N/A",lodge:false,audit:false,gen:false,blocker:"Pre-revenue"},
  {key:"W2-013",wave:2,group:"Reconciliations",title:"MAAT vs BAS Reconciliation",status:"GENERATABLE",src:"maat_bas_periods",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-014",wave:2,group:"Reconciliations",title:"Cloud Provider Invoice Match",status:"GENERATABLE",src:"maat_transactions",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-015",wave:2,group:"Transaction Data",title:"Orphan Transaction Report",status:"GENERATABLE",src:"maat_transactions",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-016",wave:2,group:"Evidence & Coverage",title:"Evidence Coverage Ratio Report",status:"GENERATABLE",src:"v_maat_rd_coverage_summary",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-017",wave:2,group:"Evidence & Coverage",title:"Reality Ledger Classification Report",status:"GENERATABLE",src:"maat_reality_classification",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W2-018",wave:2,group:"Evidence & Coverage",title:"REAL / PARTIAL / PRETEND Summary",status:"GENERATABLE",src:"maat_reality_classification",lodge:true,audit:true,gen:true,blocker:""},
  {key:"W3-001",wave:3,group:"Corporate",title:"Company Constitution",status:"MISSING",src:"External — ASIC",lodge:false,audit:true,gen:false,blocker:"Locate from ASIC formation docs"},
  {key:"W3-002",wave:3,group:"Corporate",title:"ASIC Registration Extract",status:"MISSING",src:"ASIC Connect portal",lodge:false,audit:true,gen:false,blocker:"Download from ASIC Connect"},
  {key:"W3-003",wave:3,group:"Corporate",title:"Director Resolutions",status:"GENERATABLE",src:"Template",lodge:false,audit:true,gen:true,blocker:""},
  {key:"W3-004",wave:3,group:"Corporate",title:"Shareholder Register",status:"GENERATABLE",src:"Company records",lodge:false,audit:true,gen:true,blocker:""},
  {key:"W3-005",wave:3,group:"IP Legal",title:"IP Assignment Deed",status:"MISSING",src:"Solicitor required",lodge:false,audit:true,gen:false,blocker:"Hales Redden or IP lawyer"},
  {key:"W3-006",wave:3,group:"IP Legal",title:"Trademark Filings",status:"PARTIAL",src:"IP Australia",lodge:false,audit:false,gen:false,blocker:"Confirm filing status"},
  {key:"W3-007",wave:3,group:"IP Legal",title:"Patent Filings",status:"MISSING",src:"N/A",lodge:false,audit:false,gen:false,blocker:"Not applicable"},
  {key:"W3-008",wave:3,group:"Agreements",title:"Div7A Loan Agreements",status:"PARTIAL",src:"maat_div7a_rates",lodge:false,audit:true,gen:false,blocker:"Locate signed copy"},
  {key:"W3-009",wave:3,group:"Agreements",title:"Employment Contracts",status:"MISSING",src:"N/A",lodge:false,audit:false,gen:false,blocker:"Director only — N/A"},
  {key:"W3-010",wave:3,group:"Agreements",title:"Contractor Agreements",status:"MISSING",src:"Files",lodge:false,audit:false,gen:false,blocker:"Recategorised — agreements on file"},
  {key:"W4-001",wave:4,group:"IP Register",title:"Master IP Register",status:"GENERATABLE",src:"research_asset_register",lodge:false,audit:false,gen:true,blocker:""},
  {key:"W4-002",wave:4,group:"IP Register",title:"Artefact Registry",status:"GENERATABLE",src:"maat_artifact_registry",lodge:false,audit:false,gen:true,blocker:""},
  {key:"W4-003",wave:4,group:"IP Register",title:"Claim Registry",status:"GENERATABLE",src:"maat_claim",lodge:false,audit:false,gen:true,blocker:""},
  {key:"W4-004",wave:4,group:"IP Register",title:"Research Asset Register",status:"GENERATABLE",src:"research_asset_register",lodge:false,audit:false,gen:true,blocker:""},
  {key:"W4-005",wave:4,group:"Code & Versions",title:"Version History Snapshots",status:"PARTIAL",src:"GitHub TML-4PM",lodge:false,audit:false,gen:false,blocker:"Manual snapshot export needed"},
  {key:"W4-006",wave:4,group:"Code & Versions",title:"Source Code Repository Archive",status:"PARTIAL",src:"GitHub TML-4PM",lodge:false,audit:false,gen:false,blocker:"Snapshot Lambda needed"},
  {key:"W4-007",wave:4,group:"Architecture",title:"Supabase Schema Export",status:"GENERATABLE",src:"information_schema",lodge:false,audit:false,gen:true,blocker:""},
  {key:"W4-008",wave:4,group:"Architecture",title:"System Architecture Diagram",status:"GENERATABLE",src:"maat_systems",lodge:false,audit:false,gen:true,blocker:""},
  {key:"W4-009",wave:4,group:"Architecture",title:"Integrity Stack Lifecycle Docs",status:"PARTIAL",src:"autonomy_pattern_registry",lodge:false,audit:false,gen:false,blocker:"Narrative layer needed"},
  {key:"W4-010",wave:4,group:"Project Docs",title:"ConsentX Governance Layer Docs",status:"PARTIAL",src:"maat_rd_projects",lodge:false,audit:false,gen:false,blocker:"Project spec exists — doc not built"},
  {key:"W4-011",wave:4,group:"Project Docs",title:"MyNeuralSignal Research Logs",status:"PARTIAL",src:"research_asset_register",lodge:false,audit:false,gen:false,blocker:"Assets registered — log not built"},
  {key:"W5-001",wave:5,group:"Research",title:"Annual Research Summary Report",status:"GENERATABLE",src:"maat_rd_projects",lodge:false,audit:false,gen:true,blocker:""},
  {key:"W5-002",wave:5,group:"Roadmap",title:"Technology Roadmap",status:"PARTIAL",src:"maat_rd_projects",lodge:false,audit:false,gen:false,blocker:"Narrative not built"},
  {key:"W5-003",wave:5,group:"Roadmap",title:"Innovation Thesis",status:"PARTIAL",src:"research_asset_register",lodge:false,audit:false,gen:false,blocker:"Narrative not built"},
  {key:"W5-004",wave:5,group:"Commercial",title:"IP Commercialisation Strategy",status:"PARTIAL",src:"t4h_sku",lodge:false,audit:false,gen:false,blocker:"SKU catalogue exists — doc not built"},
  {key:"W5-005",wave:5,group:"Commercial",title:"Revenue Model Mapping",status:"PARTIAL",src:"t4h_business_canonical",lodge:false,audit:false,gen:false,blocker:"28 businesses — formal model not built"},
  {key:"W5-006",wave:5,group:"Grants & Investors",title:"Grant Application Copies",status:"MISSING",src:"N/A",lodge:false,audit:false,gen:false,blocker:"None filed"},
  {key:"W5-007",wave:5,group:"Grants & Investors",title:"Investor Updates",status:"MISSING",src:"N/A",lodge:false,audit:false,gen:false,blocker:"Pre-investor stage"},
];

// ─── SQL queries per report key ─────────────────────────────────────────────
const REPORT_SQL: Record<string, string> = {
  "W0-001": "SELECT project_code, project_name, financial_year, research_domain, technical_uncertainty, ato_defensibility, total_rnd_cost FROM maat_rd_projects ORDER BY financial_year, project_code",
  "W0-002": "SELECT project_code, project_name, financial_year, hypothesis_1, hypothesis_2, experiment_1, experiment_2, why_not_routine FROM maat_rd_projects ORDER BY financial_year, project_code",
  "W0-003": "SELECT project_code, project_name, financial_year, technical_uncertainty, knowledge_gap, still_unknown FROM maat_rd_projects ORDER BY financial_year, project_code",
  "W0-004": "SELECT project_code, project_name, financial_year, experiment_1, experiment_2, experiment_3, iteration_evidence FROM maat_rd_projects ORDER BY financial_year, project_code",
  "W0-007": "SELECT project_code, project_name, financial_year, new_knowledge_summary, what_changed, ato_defensibility, total_score FROM maat_rd_projects ORDER BY financial_year, project_code",
  "W0-008": "SELECT project_code, project_name, financial_year, total_rnd_cost, ato_defensibility, ausindustry_strength FROM maat_rd_projects ORDER BY financial_year, project_code",
  "W0-010": "SELECT fy, labour, bank_rd, total_eligible, rdti_refund FROM v_rdti_by_fy ORDER BY fy",
  "W0-011": "SELECT project_code, project_name, financial_year, labour_pct, compute_pct, external_pct, mixed_use_notes FROM maat_rd_projects ORDER BY financial_year, project_code",
  "W0-012": "SELECT fy, labour, bank_rd, total_eligible, rdti_refund FROM v_rdti_by_fy ORDER BY fy",
  "W0-014": "SELECT * FROM maat_evidence_registry ORDER BY created_at DESC LIMIT 200",
  "W0-015": "SELECT financial_year, staff_name, work_date, hours_worked, activity_description, source FROM maat_timesheets ORDER BY financial_year, work_date",
  "W0-016": "SELECT period_label, period_start, period_end, status, label_1a_gst_collected, label_1b_gst_paid, gst_payable, total_payable FROM maat_bas_periods ORDER BY period_start",
  "W0-017": "SELECT period_label, period_start, period_end, g1_total_sales, g11_non_capital_purchases, label_1a_gst_collected, label_1b_gst_paid, gst_payable FROM maat_bas_periods ORDER BY period_start",
  "W0-022": "SELECT fy_ending, total_credits_to_dl, total_debits_from_dl, net_balance, journal_count FROM v_maat_api_director_loan ORDER BY fy_ending",
  "W1-001": "SELECT source, status, reality, journals, lines, debits, credits FROM v_maat_api_ledger ORDER BY debits DESC LIMIT 100",
  "W1-002": "SELECT source, status, reality, journals, lines, debits, credits FROM v_maat_api_ledger ORDER BY source",
  "W1-003": "SELECT fy, category, pl_section, total, txn_count FROM v_pl_t4h_by_fy ORDER BY fy DESC, display_order",
  "W1-006": "SELECT fy, pl_section, SUM(total) as section_total, COUNT(*) as line_items FROM v_pl_t4h_by_fy GROUP BY fy, pl_section ORDER BY fy DESC, pl_section",
  "W1-007": "SELECT fy, category, pl_section, total, txn_count FROM v_pl_t4h_by_fy ORDER BY fy DESC, total DESC",
  "W1-008": "SELECT * FROM maat_fixed_asset_register ORDER BY acquisition_date",
  "W1-009": "SELECT fy_ending, total_credits_to_dl, total_debits_from_dl, net_balance FROM v_maat_api_director_loan ORDER BY fy_ending",
  "W1-010": "SELECT * FROM maat_fixed_asset_register ORDER BY acquisition_date",
  "W1-011": "SELECT * FROM v_maat_depreciation_schedule ORDER BY asset_name LIMIT 100",
  "W1-014": "SELECT fy, labour, bank_rd, total_eligible, rdti_refund FROM v_rdti_by_fy ORDER BY fy",
  "W1-015": "SELECT fy, category, total FROM v_pl_t4h_by_fy WHERE pl_section = 'Personal' ORDER BY fy DESC, total DESC",
  "W1-017": "SELECT period_label, period_start, label_1a_gst_collected, label_1b_gst_paid, gst_payable FROM maat_bas_periods ORDER BY period_start",
  "W2-001": "SELECT transaction_date, description, amount, category, subcategory FROM maat_transactions WHERE is_estimate = false ORDER BY transaction_date DESC LIMIT 500",
  "W2-002": "SELECT transaction_date, description, amount, category, subcategory, coa_code FROM maat_transactions WHERE is_estimate = false ORDER BY transaction_date DESC LIMIT 500",
  "W2-003": "SELECT business_key, business_name, group_id, status FROM t4h_business_canonical ORDER BY group_id, business_key LIMIT 100",
  "W2-004": "SELECT * FROM maat_bank_coa_map ORDER BY bank_name LIMIT 100",
  "W2-005": "SELECT rule_name, vendor_match, category, subcategory, rd_eligible, is_active FROM maat_classification_rules ORDER BY rule_name LIMIT 200",
  "W2-006": "SELECT * FROM maat_evidence_link ORDER BY created_at DESC LIMIT 200",
  "W2-007": "SELECT rule_name, vendor_match, category, subcategory, rd_eligible FROM maat_classification_rules WHERE is_active = true ORDER BY category, rule_name",
  "W2-008": "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position LIMIT 500",
  "W2-010": "SELECT * FROM maat_exception_queue ORDER BY created_at DESC LIMIT 200",
  "W2-013": "SELECT period_label, period_start, period_end, status, gst_payable FROM maat_bas_periods ORDER BY period_start",
  "W2-014": "SELECT transaction_date, description, amount, category FROM maat_transactions WHERE category IN ('Cloud/Infrastructure','AI/LLM Services','Development Tools') AND is_estimate = false ORDER BY transaction_date DESC LIMIT 300",
  "W2-015": "SELECT transaction_date, description, amount FROM maat_transactions WHERE category IS NULL OR category = '' ORDER BY amount DESC LIMIT 200",
  "W2-016": "SELECT * FROM v_maat_rd_coverage_summary LIMIT 100",
  "W2-017": "SELECT * FROM maat_reality_classification ORDER BY created_at DESC LIMIT 200",
  "W2-018": "SELECT reality, COUNT(*) as count, SUM(amount) as total FROM maat_transactions WHERE reality IS NOT NULL GROUP BY reality ORDER BY total DESC",
  "W3-003": "SELECT 'Tech 4 Humanity Pty Ltd' as entity, 'Troy Latter' as director, 'Sole Director & Shareholder' as role, now()::date as resolution_date",
  "W3-004": "SELECT 'Troy Latter' as shareholder, '100%' as shareholding, 'Ordinary' as share_class, 'Sole Shareholder' as notes",
  "W4-001": "SELECT title, status, asset_type, fy FROM research_asset_register ORDER BY status, fy LIMIT 300",
  "W4-002": "SELECT * FROM maat_artifact_registry ORDER BY created_at DESC LIMIT 200",
  "W4-003": "SELECT * FROM maat_claim ORDER BY created_at DESC LIMIT 200",
  "W4-004": "SELECT title, status, asset_type, fy FROM research_asset_register ORDER BY status, asset_type LIMIT 300",
  "W4-007": "SELECT table_name, COUNT(*) as columns FROM information_schema.columns WHERE table_schema = 'public' GROUP BY table_name ORDER BY table_name LIMIT 300",
  "W4-008": "SELECT name, type, layer, status, purpose FROM maat_systems ORDER BY layer",
  "W5-001": "SELECT financial_year, project_code, project_name, research_domain, total_rnd_cost, ato_defensibility, ausindustry_strength FROM maat_rd_projects ORDER BY financial_year DESC, project_code",
};

// ─── Wave config ────────────────────────────────────────────────────────────
const WAVES = [
  {id:0,label:"Lodgement Spine",sub:"RDTI + Tax + BAS",color:"#00c2ff"},
  {id:1,label:"Accountant Backbone",sub:"P&L + GL + Working Papers",color:"#22c55e"},
  {id:2,label:"MAAT Reconciliation",sub:"Recon + Rules + Evidence",color:"#f5c842"},
  {id:3,label:"Corporate & Legal",sub:"Existential protection",color:"#f97316"},
  {id:4,label:"IP Defensibility",sub:"Assets + Architecture",color:"#a78bfa"},
  {id:5,label:"Strategic Layer",sub:"Research + Roadmap",color:"#ec4899"},
];

// ─── Auth Screen ────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (u: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const hash = await sha256(pass);
      const rows = await sql(
        `SELECT id, email, display_name, role, is_active FROM public.maat_portal_users WHERE email = '${email.toLowerCase().trim()}' AND password_hash = '${hash}' AND is_active = true`
      );
      if (!rows.length) { setErr("Invalid credentials."); setLoading(false); return; }
      // update last_login
      await sql(`UPDATE public.maat_portal_users SET last_login = now() WHERE email = '${email.toLowerCase().trim()}'`);
      onAuth(rows[0] as AuthUser);
    } catch {
      setErr("Connection error. Try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#06090f", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace" }}>
      <div style={{ width:380, padding:"40px 36px", background:"#0d1320", border:"1px solid #1e2d47", borderRadius:12 }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, letterSpacing:"0.16em", color:"#00c2ff", marginBottom:8, textTransform:"uppercase" }}>MAAT — 121 Document Spine</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#e8edf5", fontFamily:"sans-serif" }}>Accountant Portal</div>
          <div style={{ fontSize:12, color:"#6b7fa0", marginTop:4 }}>Tech 4 Humanity Pty Ltd · ABN 61 605 746 618</div>
        </div>
        <form onSubmit={login}>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#6b7fa0", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>Email</div>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width:"100%", padding:"10px 12px", background:"#141c2e", border:"1px solid #1e2d47", borderRadius:6, color:"#e8edf5", fontSize:13, outline:"none", boxSizing:"border-box" }}
              placeholder="your@email.com.au"
            />
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:"#6b7fa0", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>Password</div>
            <input
              type="password" value={pass} onChange={e => setPass(e.target.value)} required
              style={{ width:"100%", padding:"10px 12px", background:"#141c2e", border:"1px solid #1e2d47", borderRadius:6, color:"#e8edf5", fontSize:13, outline:"none", boxSizing:"border-box" }}
            />
          </div>
          {err && <div style={{ color:"#f87171", fontSize:12, marginBottom:14 }}>⚠ {err}</div>}
          <button
            type="submit" disabled={loading}
            style={{ width:"100%", padding:"11px", background: loading ? "#253552" : "#00c2ff", border:"none", borderRadius:6, color:"#000", fontWeight:700, fontSize:13, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>
        <div style={{ marginTop:20, fontSize:11, color:"#6b7fa0", borderTop:"1px solid #1e2d47", paddingTop:16 }}>
          For access, contact: troy@tech4humanity.com.au
        </div>
      </div>
    </div>
  );
}

// ─── Report Viewer ──────────────────────────────────────────────────────────
function ReportViewer({ report, onClose }: { report: ReportDef; onClose: () => void }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const query = REPORT_SQL[report.key];

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    sql(query).then(rows => {
      const cols = rows.length ? Object.keys(rows[0]) : [];
      setData({ rows, cols, generated_at: new Date().toISOString() });
      setLoading(false);
    }).catch(() => { setErr("Failed to load data."); setLoading(false); });
  }, [report.key]);

  const exportCSV = () => {
    if (!data?.rows.length) return;
    const header = data.cols.join(",");
    const rows = data.rows.map(r => data.cols.map(c => `"${String(r[c] ?? "").replace(/"/g,'""')}"`).join(","));
    const csv = [header, ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `MAAT_${report.key}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const waveColor = WAVES[report.wave]?.color ?? "#00c2ff";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"40px 20px", overflowY:"auto" }}>
      <div style={{ width:"100%", maxWidth:1100, background:"#0d1320", border:"1px solid #1e2d47", borderRadius:12, overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"20px 24px", background:"#06090f", borderBottom:"1px solid #1e2d47", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ padding:"4px 10px", background:waveColor+"22", border:`1px solid ${waveColor}44`, borderRadius:6, fontSize:11, color:waveColor, fontFamily:"monospace" }}>
            W{report.wave} · {report.key}
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#e8edf5" }}>{report.title}</div>
            <div style={{ fontSize:11, color:"#6b7fa0", fontFamily:"monospace" }}>Source: {report.src}</div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
            {data?.rows.length ? (
              <button onClick={exportCSV} style={{ padding:"7px 14px", background:"#1e2d47", border:"1px solid #253552", borderRadius:6, color:"#e8edf5", fontSize:12, cursor:"pointer" }}>
                ↓ Export CSV
              </button>
            ) : null}
            <button onClick={onClose} style={{ padding:"7px 14px", background:"transparent", border:"1px solid #1e2d47", borderRadius:6, color:"#6b7fa0", fontSize:12, cursor:"pointer" }}>
              ✕ Close
            </button>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding:24 }}>
          {loading && <div style={{ textAlign:"center", color:"#6b7fa0", padding:"60px 0", fontFamily:"monospace" }}>Loading data from MAAT…</div>}
          {err && <div style={{ color:"#f87171", padding:"40px 0", textAlign:"center" }}>{err}</div>}
          {!query && !loading && (
            <div style={{ textAlign:"center", padding:"60px 0", color:"#6b7fa0", fontFamily:"monospace" }}>
              <div style={{ fontSize:24, marginBottom:8 }}>⚠</div>
              <div>This document has a blocker: {report.blocker || "requires manual input"}</div>
              <div style={{ marginTop:8, fontSize:11 }}>Status: {report.status}</div>
            </div>
          )}
          {data && (
            <>
              <div style={{ marginBottom:12, display:"flex", alignItems:"center", gap:16, fontSize:11, color:"#6b7fa0", fontFamily:"monospace" }}>
                <span style={{ color:"#22c55e" }}>✓ {data.rows.length} rows</span>
                <span>Generated: {new Date(data.generated_at).toLocaleString("en-AU")}</span>
              </div>
              <div style={{ overflowX:"auto", border:"1px solid #1e2d47", borderRadius:8 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:"monospace" }}>
                  <thead>
                    <tr>
                      {data.cols.map(c => (
                        <th key={c} style={{ padding:"8px 12px", background:"#06090f", color:"#6b7fa0", textAlign:"left", borderBottom:"1px solid #1e2d47", whiteSpace:"nowrap", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.slice(0,200).map((r, i) => (
                      <tr key={i} style={{ borderBottom:"1px solid #141c2e", background: i%2 ? "#0d1320" : "transparent" }}>
                        {data.cols.map(c => (
                          <td key={c} style={{ padding:"7px 12px", color:"#b0bed4", maxWidth:300, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                            title={String(r[c] ?? "")}>
                            {String(r[c] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.rows.length > 200 && (
                  <div style={{ padding:"10px 16px", background:"#06090f", color:"#6b7fa0", fontSize:11, borderTop:"1px solid #1e2d47", fontFamily:"monospace" }}>
                    Showing 200 of {data.rows.length} rows. Export CSV for full dataset.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function Maat121Spine() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeWave, setActiveWave] = useState<number | "all">("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openReport, setOpenReport] = useState<ReportDef | null>(null);

  // Persist session in sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("maat_spine_user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
  }, []);

  const handleAuth = (u: AuthUser) => {
    setUser(u);
    sessionStorage.setItem("maat_spine_user", JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem("maat_spine_user");
  };

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  const filtered = REPORTS.filter(r => {
    const wm = activeWave === "all" || r.wave === activeWave;
    const sm = activeStatus === "all" || r.status === activeStatus;
    const q = search.toLowerCase();
    const qm = !q || r.title.toLowerCase().includes(q) || r.key.toLowerCase().includes(q) || r.group.toLowerCase().includes(q);
    return wm && sm && qm;
  });

  const wavesToShow = activeWave === "all" ? WAVES.map(w=>w.id) : [activeWave as number];

  const statusBg = (s:string) => s==="GENERATABLE"?"rgba(34,197,94,0.12)":s==="PARTIAL"?"rgba(249,115,22,0.12)":"rgba(239,68,68,0.08)";
  const statusColor = (s:string) => s==="GENERATABLE"?"#22c55e":s==="PARTIAL"?"#f97316":"#f87171";
  const statusLabel = (s:string) => s==="GENERATABLE"?"✓ Ready":s==="PARTIAL"?"◐ Partial":"✗ Missing";

  const totalGen = REPORTS.filter(r=>r.gen).length;
  const totalPart = REPORTS.filter(r=>r.status==="PARTIAL").length;
  const totalMiss = REPORTS.filter(r=>r.status==="MISSING").length;

  return (
    <div style={{ minHeight:"100vh", background:"#06090f", color:"#e8edf5", fontFamily:"sans-serif" }}>
      {openReport && <ReportViewer report={openReport} onClose={() => setOpenReport(null)} />}

      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"rgba(6,9,15,0.95)", backdropFilter:"blur(8px)", borderBottom:"1px solid #1e2d47", padding:"0 24px", height:52, display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ fontWeight:800, fontSize:16, color:"#00c2ff", letterSpacing:"0.04em" }}>MAAT</div>
        <div style={{ color:"#253552" }}>/</div>
        <div style={{ fontSize:14, color:"#e8edf5", fontWeight:600 }}>121 Spine</div>
        <div style={{ fontSize:10, color:"#6b7fa0", fontFamily:"monospace", letterSpacing:"0.1em" }}>COMPLIANCE DOCUMENT MATRIX</div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:11, color:"#22c55e", fontFamily:"monospace", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:100, padding:"3px 10px" }}>
            ● {totalGen} ready
          </div>
          <div style={{ fontSize:11, color:"#f97316", fontFamily:"monospace", background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:100, padding:"3px 10px" }}>
            ◐ {totalPart} partial
          </div>
          <div style={{ fontSize:11, color:"#f87171", fontFamily:"monospace", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:100, padding:"3px 10px" }}>
            ○ {totalMiss} missing
          </div>
          <div style={{ borderLeft:"1px solid #1e2d47", paddingLeft:12, fontSize:12, color:"#6b7fa0" }}>
            {user.display_name}
          </div>
          <button onClick={handleLogout} style={{ fontSize:11, color:"#6b7fa0", background:"transparent", border:"1px solid #1e2d47", borderRadius:4, padding:"3px 10px", cursor:"pointer" }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding:"32px 24px 24px", borderBottom:"1px solid #1e2d47", background:"linear-gradient(180deg,rgba(0,194,255,0.04) 0%,transparent 100%)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-20, top:-50, fontSize:200, fontWeight:900, color:"rgba(0,194,255,0.025)", fontFamily:"sans-serif", pointerEvents:"none", lineHeight:1 }}>121</div>
        <div style={{ fontSize:10, letterSpacing:"0.18em", color:"#00c2ff", textTransform:"uppercase", marginBottom:8, fontFamily:"monospace" }}>
          Tech 4 Humanity Pty Ltd · ABN 61 605 746 618 · FY2024–25
        </div>
        <div style={{ fontSize:28, fontWeight:800, color:"#e8edf5", marginBottom:6 }}>
          MAAT — <span style={{ color:"#00c2ff" }}>121</span> Document Spine
        </div>
        <div style={{ color:"#6b7fa0", fontSize:13, marginBottom:20 }}>
          Complete compliance, RDTI, accountant and IP document map. Click any ready document to generate live data.
        </div>
        <div style={{ display:"flex", gap:28, flexWrap:"wrap" }}>
          {[{n:"85",l:"Mapped docs",c:"#e8edf5"},{n:"50",l:"Ready now",c:"#22c55e"},{n:"20",l:"Partial",c:"#f97316"},{n:"15",l:"Missing/N/A",c:"#f87171"},{n:"14/22",l:"Wave 0 ready",c:"#00c2ff"},{n:"30 Apr",l:"AusIndustry",c:"#f5c842"}].map(s=>(
            <div key={s.l}>
              <div style={{ fontSize:24, fontWeight:700, color:s.c, lineHeight:1 }}>{s.n}</div>
              <div style={{ fontSize:10, color:"#6b7fa0", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"monospace", marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding:"12px 24px", borderBottom:"1px solid #1e2d47", background:"#0d1320", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        {/* Wave filters */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {[{id:"all",label:"All Waves",color:"#00c2ff"}, ...WAVES.map(w=>({id:w.id,label:`W${w.id} ${w.label}`,color:w.color}))].map(f=>{
            const active = activeWave === f.id;
            return <button key={String(f.id)} onClick={()=>setActiveWave(f.id as any)}
              style={{ padding:"4px 10px", border:`1px solid ${active?f.color:"#1e2d47"}`, borderRadius:6, background: active?f.color+"22":"transparent", color: active?f.color:"#6b7fa0", fontSize:11, cursor:"pointer", fontFamily:"monospace", transition:"all 0.15s" }}>
              {f.label}
            </button>;
          })}
        </div>
        <div style={{ width:1, height:20, background:"#1e2d47", margin:"0 4px" }} />
        {/* Status filters */}
        <div style={{ display:"flex", gap:4 }}>
          {[{id:"all",label:"All",c:"#6b7fa0"},{id:"GENERATABLE",label:"✓ Ready",c:"#22c55e"},{id:"PARTIAL",label:"◐ Partial",c:"#f97316"},{id:"MISSING",label:"✗ Missing",c:"#f87171"}].map(f=>{
            const active = activeStatus === f.id;
            return <button key={f.id} onClick={()=>setActiveStatus(f.id)}
              style={{ padding:"4px 10px", border:`1px solid ${active?f.c:"#1e2d47"}`, borderRadius:6, background: active?f.c+"22":"transparent", color: active?f.c:"#6b7fa0", fontSize:11, cursor:"pointer", fontFamily:"monospace" }}>
              {f.label}
            </button>;
          })}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents…"
          style={{ marginLeft:"auto", padding:"5px 12px", background:"#141c2e", border:"1px solid #1e2d47", borderRadius:6, color:"#e8edf5", fontSize:12, outline:"none", width:220, fontFamily:"monospace" }} />
      </div>

      {/* Content */}
      <div style={{ padding:"24px", maxWidth:1200, margin:"0 auto" }}>
        {wavesToShow.map(wid => {
          const wave = WAVES[wid];
          const wdocs = filtered.filter(r=>r.wave===wid);
          if(!wdocs.length) return null;
          const genCount = REPORTS.filter(r=>r.wave===wid&&r.gen).length;
          const totalCount = REPORTS.filter(r=>r.wave===wid).length;
          const pct = Math.round(genCount/totalCount*100);

          // Group by group name
          const groups: Record<string, ReportDef[]> = {};
          wdocs.forEach(d => { if(!groups[d.group]) groups[d.group]=[]; groups[d.group].push(d); });

          return (
            <div key={wid} style={{ marginBottom:36 }}>
              {/* Wave header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, paddingBottom:12, borderBottom:`1px solid #1e2d47` }}>
                <div style={{ width:28, height:28, borderRadius:6, background:wave.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#000" }}>
                  {wid}
                </div>
                <div>
                  <div style={{ fontSize:17, fontWeight:700, color:"#e8edf5" }}>Wave {wid} — {wave.label}</div>
                  <div style={{ fontSize:10, color:"#6b7fa0", fontFamily:"monospace" }}>{wave.sub}</div>
                </div>
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:11, color:"#6b7fa0", fontFamily:"monospace" }}>{genCount}/{totalCount} ready</span>
                  <div style={{ width:80, height:4, background:"#1e2d47", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:wave.color, borderRadius:2 }} />
                  </div>
                </div>
              </div>

              {/* Groups */}
              {Object.entries(groups).map(([gname, gdocs]) => (
                <div key={gname} style={{ background:"#0d1320", border:"1px solid #1e2d47", borderRadius:10, marginBottom:10, overflow:"hidden" }}>
                  <div style={{ padding:"10px 16px", background:"#141c2e", borderBottom:"1px solid #1e2d47", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#e8edf5" }}>{gname}</span>
                    <span style={{ fontSize:10, color:"#6b7fa0", fontFamily:"monospace" }}>{gdocs.length} docs</span>
                    <span style={{ marginLeft:8, fontSize:10, color:"#22c55e", fontFamily:"monospace" }}>
                      {gdocs.filter(d=>d.gen).length} generatable
                    </span>
                  </div>
                  {gdocs.map((doc, i) => (
                    <div key={doc.key}
                      onClick={doc.gen ? () => setOpenReport(doc) : undefined}
                      style={{
                        padding:"10px 16px", display:"flex", alignItems:"center", gap:12,
                        borderBottom: i < gdocs.length-1 ? "1px solid #141c2e" : "none",
                        cursor: doc.gen ? "pointer" : "default",
                        background: "transparent",
                        transition:"background 0.1s",
                      }}
                      onMouseEnter={e => { if(doc.gen) (e.currentTarget as HTMLDivElement).style.background="#141c2e"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background="transparent"; }}
                    >
                      <span style={{ fontFamily:"monospace", fontSize:10, color:"#6b7fa0", width:56, flexShrink:0 }}>{doc.key}</span>
                      <span style={{ flex:1, fontSize:13, color: doc.status==="MISSING"?"#6b7fa0":"#e8edf5" }}>{doc.title}</span>
                      <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                        <span style={{ padding:"2px 8px", borderRadius:4, background:statusBg(doc.status), color:statusColor(doc.status), fontSize:10, fontFamily:"monospace", border:`1px solid ${statusColor(doc.status)}33` }}>
                          {statusLabel(doc.status)}
                        </span>
                        {doc.lodge && <span style={{ padding:"2px 6px", borderRadius:4, background:"rgba(0,194,255,0.08)", color:"#00c2ff", fontSize:9, fontFamily:"monospace", border:"1px solid rgba(0,194,255,0.15)" }}>LODGE</span>}
                        {doc.audit && <span style={{ padding:"2px 6px", borderRadius:4, background:"rgba(245,200,66,0.08)", color:"#f5c842", fontSize:9, fontFamily:"monospace", border:"1px solid rgba(245,200,66,0.15)" }}>AUDIT</span>}
                        {doc.gen && <span style={{ fontSize:11, color:"#6b7fa0" }}>→</span>}
                        {doc.blocker && <span style={{ maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:10, color:"#f87171", fontFamily:"monospace" }} title={doc.blocker}>⚠ {doc.blocker}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"80px 0", color:"#6b7fa0", fontFamily:"monospace" }}>No documents match your filter.</div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop:"1px solid #1e2d47", padding:"16px 24px", display:"flex", gap:12, color:"#6b7fa0", fontSize:11, fontFamily:"monospace" }}>
        <span style={{ color:"#00c2ff" }}>MAAT</span>
        <span>—</span>
        <span>Multi-domain Agentic Accounting & Tax</span>
        <span>·</span>
        <span>Tech 4 Humanity Pty Ltd</span>
        <span>·</span>
        <span>Generated live from Supabase</span>
        <span style={{ marginLeft:"auto" }}>ABN 61 605 746 618</span>
      </div>
    </div>
  );
}
