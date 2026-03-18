import { useState, useCallback, useEffect, useRef } from "react";

// ─── Bridge ────────────────────────────────────────────────────────────────
const BRIDGE = "https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke";
const BRIDGE_KEY = "bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4";

async function sql(query: string): Promise<any[]> {
  const r = await fetch(BRIDGE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BRIDGE_KEY}`,
      "x-api-key": BRIDGE_KEY,
    },
    body: JSON.stringify({ fn: "troy-sql-executor", sql: query }),
  });
  const d = await r.json();
  return d.rows ?? [];
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Types ──────────────────────────────────────────────────────────────────
type AuthUser = { id: string; email: string; display_name: string; role: string };
type ReportDef = {
  key: string; wave: number; group: string; title: string;
  status: string; src: string; lodge: boolean; audit: boolean;
  gen: boolean; blocker: string; description: string;
};
type ChatMsg = { role: "user" | "assistant"; content: string; ts: Date };

// ─── Wave config ─────────────────────────────────────────────────────────────
const WAVES = [
  { id:0, label:"Lodgement Spine",    sub:"RDTI + Tax + BAS",         color:"#00c2ff" },
  { id:1, label:"Accountant Backbone", sub:"P&L + GL + Working Papers", color:"#22c55e" },
  { id:2, label:"MAAT Reconciliation", sub:"Recon + Rules + Evidence",  color:"#f5c842" },
  { id:3, label:"Corporate & Legal",   sub:"Existential protection",    color:"#f97316" },
  { id:4, label:"IP Defensibility",    sub:"Assets + Architecture",     color:"#a78bfa" },
  { id:5, label:"Strategic Layer",     sub:"Research + Roadmap",        color:"#ec4899" },
];

// ─── Report definitions (expanded) ────────────────────────────────────────
const REPORTS: ReportDef[] = [
  // ══ WAVE 0 ══════════════════════════════════════════════════════════════
  { key:"W0-001", wave:0, group:"R&D Program", title:"R&D Program Register", status:"GENERATABLE", src:"maat_rd_projects", lodge:true,  audit:true,  gen:true,  blocker:"", description:"All R&D projects by FY with research domain, defensibility and cost" },
  { key:"W0-002", wave:0, group:"R&D Program", title:"R&D Activity Register", status:"GENERATABLE", src:"maat_rd_projects", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Hypotheses, experiments and technical activities per project" },
  { key:"W0-003", wave:0, group:"R&D Program", title:"Technical Uncertainty Statements", status:"GENERATABLE", src:"maat_rd_projects", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Technical unknowns, knowledge gaps and uncertainty justifications" },
  { key:"W0-004", wave:0, group:"R&D Program", title:"Experiment Design Documents", status:"GENERATABLE", src:"maat_rd_projects", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Experiment structures with iteration evidence per project" },
  { key:"W0-005", wave:0, group:"R&D Program", title:"Iteration Logs", status:"PARTIAL",     src:"maat_timesheets",  lodge:true,  audit:true,  gen:false, blocker:"FY23-24/FY24-25 timesheets missing", description:"Weekly activity logs per project" },
  { key:"W0-006", wave:0, group:"R&D Program", title:"Failure Logs", status:"PARTIAL",     src:"maat_rd_projects",  lodge:true,  audit:true,  gen:false, blocker:"Narrative completion needed", description:"What didn't work and why" },
  { key:"W0-007", wave:0, group:"R&D Program", title:"Technical Conclusions Summary", status:"GENERATABLE", src:"maat_rd_projects", lodge:true,  audit:true,  gen:true,  blocker:"", description:"New knowledge produced, ATO defensibility scores" },
  { key:"W0-008", wave:0, group:"R&D Program", title:"R&D Timeline (milestone log)", status:"GENERATABLE", src:"maat_rd_projects", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Project timeline by FY with cost and defensibility" },
  { key:"W0-009", wave:0, group:"R&D Program", title:"Research Plan (version-controlled)", status:"PARTIAL",     src:"research_asset_register", lodge:true,  audit:true,  gen:false, blocker:"Git snapshot needed", description:"Version history of research direction" },
  { key:"W0-010", wave:0, group:"RDTI Financials", title:"R&D Cost Allocation Report", status:"GENERATABLE", src:"v_rdti_by_fy", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Labour + bank R&D by FY with RDTI refund at 43.5%" },
  { key:"W0-011", wave:0, group:"RDTI Financials", title:"Apportionment Methodology", status:"GENERATABLE", src:"maat_rd_projects", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Labour %, compute %, external % split per project" },
  { key:"W0-012", wave:0, group:"RDTI Financials", title:"R&D Claim Justification Memo", status:"GENERATABLE", src:"v_rdti_by_fy", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Summary memo of eligible expenditure and refund entitlement" },
  { key:"W0-013", wave:0, group:"RDTI Financials", title:"Board Sign-off on R&D Claim", status:"MISSING",     src:"Director resolution", lodge:true,  audit:true,  gen:false, blocker:"Troy must execute as sole director — 30 min", description:"One-page director resolution approving RDTI claim" },
  { key:"W0-014", wave:0, group:"RDTI Financials", title:"R&D Cost Allocation by Project (FY24-25)", status:"GENERATABLE", src:"maat_rd_allocation", lodge:true,  audit:true,  gen:true,  blocker:"", description:"440 allocation lines across 13 projects FY24-25" },
  { key:"W0-015", wave:0, group:"RDTI Financials", title:"Supplementary Cost Register", status:"GENERATABLE", src:"maat_supplementary_costs", lodge:true,  audit:true,  gen:true,  blocker:"", description:"16 supplementary cost items for RDTI inclusion" },
  { key:"W0-016", wave:0, group:"Evidence Pack", title:"R&D Evidence Matrix", status:"GENERATABLE", src:"maat_evidence_spine", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Evidence binding across projects and transactions" },
  { key:"W0-017", wave:0, group:"Evidence Pack", title:"Contemporaneous Records Pack", status:"GENERATABLE", src:"maat_timesheets", lodge:true,  audit:true,  gen:true,  blocker:"", description:"FY22-23 timesheets at $350/hr — 16 entries, 865.2 hours" },
  { key:"W0-018", wave:0, group:"Evidence Pack", title:"R&D Labour Coverage Report", status:"GENERATABLE", src:"v_maat_labour_coverage", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Hours vs invoice coverage by FY" },
  { key:"W0-019", wave:0, group:"Evidence Pack", title:"Invoice Summary by FY", status:"GENERATABLE", src:"v_invoice_summary_by_fy", lodge:true,  audit:true,  gen:true,  blocker:"", description:"40 director invoices summarised by financial year" },
  { key:"W0-020", wave:0, group:"Tax & BAS", title:"ATO BAS Statements — All Quarters", status:"GENERATABLE", src:"maat_bas_periods", lodge:true,  audit:true,  gen:true,  blocker:"", description:"4 FY24-25 quarters, total refundable $22,797.72" },
  { key:"W0-021", wave:0, group:"Tax & BAS", title:"GST Working Papers", status:"GENERATABLE", src:"maat_bas_periods", lodge:true,  audit:true,  gen:true,  blocker:"", description:"G1/G11 inputs and 1A/1B GST reconciliation per quarter" },
  { key:"W0-022", wave:0, group:"Tax & BAS", title:"Income Tax Return (Company)", status:"MISSING",     src:"Hales Redden", lodge:true,  audit:true,  gen:false, blocker:"Gordon McKirdy — external only", description:"ITR to be lodged by Hales Redden" },
  { key:"W0-023", wave:0, group:"Tax & BAS", title:"PAYG Summaries", status:"MISSING",     src:"N/A", lodge:true,  audit:true,  gen:false, blocker:"Director only entity — confirm N/A", description:"N/A — no employees" },
  { key:"W0-024", wave:0, group:"Tax & BAS", title:"Bank Statements (All Accounts)", status:"PARTIAL",     src:"maat_bank_accounts", lodge:true,  audit:true,  gen:false, blocker:"Amex Feb/Mar + ANZ Dec23/Mar26 missing", description:"19 statements ingested, 4 accounts, gaps remain" },
  { key:"W0-025", wave:0, group:"Tax & BAS", title:"Director Loan Ledger", status:"GENERATABLE", src:"v_maat_api_director_loan", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Cumulative advances by FY, MYR schedule, Div7A compliance" },
  { key:"W0-026", wave:0, group:"Tax & BAS", title:"Div7A Rate Schedule", status:"GENERATABLE", src:"maat_div7a_rates", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Benchmark rates, interest components and MYR by year" },
  { key:"W0-027", wave:0, group:"Tax & BAS", title:"Tax Position Summary", status:"GENERATABLE", src:"maat_tax_summary", lodge:true,  audit:true,  gen:true,  blocker:"", description:"9 tax summary rows across FYs" },
  { key:"W0-028", wave:0, group:"Tax & BAS", title:"Personal Tax Summary", status:"GENERATABLE", src:"maat_personal_tax", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Troy personal tax position by FY" },

  // ══ WAVE 1 ══════════════════════════════════════════════════════════════
  { key:"W1-001", wave:1, group:"Core Financials", title:"Trial Balance", status:"GENERATABLE", src:"maat_journal", lodge:true,  audit:true,  gen:true,  blocker:"", description:"1,196 journals — debits/credits by source and status" },
  { key:"W1-002", wave:1, group:"Core Financials", title:"General Ledger", status:"GENERATABLE", src:"maat_journal", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Full journal listing with reality classification" },
  { key:"W1-003", wave:1, group:"Core Financials", title:"Profit & Loss — All FY", status:"GENERATABLE", src:"v_pl_t4h_by_fy", lodge:true,  audit:true,  gen:true,  blocker:"", description:"P&L by category and section, FY22-23 through FY25-26" },
  { key:"W1-004", wave:1, group:"Core Financials", title:"Monthly P&L Detail", status:"GENERATABLE", src:"maat_monthly_pl", lodge:true,  audit:true,  gen:true,  blocker:"", description:"48 monthly P&L rows for granular trend analysis" },
  { key:"W1-005", wave:1, group:"Core Financials", title:"Balance Sheet", status:"PARTIAL",     src:"maat_journal", lodge:true,  audit:true,  gen:false, blocker:"Formal closing entries needed", description:"Balance sheet accounts — requires closing entries" },
  { key:"W1-006", wave:1, group:"Core Financials", title:"Cash Flow Statement", status:"PARTIAL",     src:"maat_transactions", lodge:true,  audit:true,  gen:false, blocker:"Amex Feb/Mar bank gap", description:"Operating/investing/financing flows — gap in coverage" },
  { key:"W1-007", wave:1, group:"Core Financials", title:"Working Papers", status:"GENERATABLE", src:"v_pl_t4h_by_fy", lodge:true,  audit:true,  gen:true,  blocker:"", description:"P&L section summary — R&D, OpEx, Personal, Non-P&L" },
  { key:"W1-008", wave:1, group:"Core Financials", title:"Monthly Spending Summary", status:"GENERATABLE", src:"maat_monthly_spending", lodge:true,  audit:true,  gen:true,  blocker:"", description:"48 months of categorised spending data" },
  { key:"W1-009", wave:1, group:"Expense Analysis", title:"Expense Breakdown by Category", status:"GENERATABLE", src:"v_pl_t4h_by_fy", lodge:true,  audit:true,  gen:true,  blocker:"", description:"All expense categories with amounts and transaction counts" },
  { key:"W1-010", wave:1, group:"Expense Analysis", title:"Capital vs Expense Classification", status:"GENERATABLE", src:"maat_fixed_asset_register", lodge:true,  audit:true,  gen:true,  blocker:"", description:"4 fixed assets — Mac Studio, MacBook Pro, Peripherals, Vehicle" },
  { key:"W1-011", wave:1, group:"Expense Analysis", title:"R&D Adjustment Schedule", status:"GENERATABLE", src:"v_rdti_by_fy", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Contractor reclassification impact — revised eligible amounts" },
  { key:"W1-012", wave:1, group:"Expense Analysis", title:"Non-Deductible Expense Schedule", status:"GENERATABLE", src:"v_pl_t4h_by_fy", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Personal section items — non-deductible for company tax" },
  { key:"W1-013", wave:1, group:"Expense Analysis", title:"Deductions Summary", status:"GENERATABLE", src:"maat_deductions_summary", lodge:true,  audit:true,  gen:true,  blocker:"", description:"12 deduction line items for tax return" },
  { key:"W1-014", wave:1, group:"Expense Analysis", title:"Personal Deductions Register", status:"GENERATABLE", src:"maat_personal_deductions", lodge:true,  audit:true,  gen:true,  blocker:"", description:"12 personal deduction claims with amounts" },
  { key:"W1-015", wave:1, group:"Expense Analysis", title:"PAYE Deductions", status:"GENERATABLE", src:"maat_paye_deductions", lodge:true,  audit:true,  gen:true,  blocker:"", description:"12 PAYE deduction records" },
  { key:"W1-016", wave:1, group:"Expense Analysis", title:"Private Use Adjustments", status:"PARTIAL",     src:"maat_transactions", lodge:true,  audit:true,  gen:false, blocker:"Motor vehicle % + home office % needed", description:"FBT/private use split — awaiting percentages from Troy" },
  { key:"W1-017", wave:1, group:"Expense Analysis", title:"GST Adjustment Summary", status:"GENERATABLE", src:"maat_bas_periods", lodge:true,  audit:true,  gen:true,  blocker:"", description:"GST reconciliation per BAS period" },
  { key:"W1-018", wave:1, group:"Expense Analysis", title:"Accounting Treatments Register", status:"GENERATABLE", src:"maat_accounting_treatments", lodge:true,  audit:true,  gen:true,  blocker:"", description:"20 accounting treatment decisions and classifications" },
  { key:"W1-019", wave:1, group:"Assets & Loans", title:"Director Loan Movement Summary", status:"GENERATABLE", src:"v_maat_api_director_loan", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Advances by FY — $26.5k FY22 through $9.3k FY26 YTD" },
  { key:"W1-020", wave:1, group:"Assets & Loans", title:"Asset Register", status:"GENERATABLE", src:"maat_fixed_asset_register", lodge:true,  audit:true,  gen:true,  blocker:"", description:"4 assets: Mac Studio M2, MacBook Pro M3, Peripherals, SG Fleet vehicle" },
  { key:"W1-021", wave:1, group:"Assets & Loans", title:"Depreciation Schedule", status:"GENERATABLE", src:"v_maat_depreciation_schedule", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Depreciation by asset per year" },
  { key:"W1-022", wave:1, group:"Assets & Loans", title:"Aged Receivables Report", status:"MISSING",     src:"N/A", lodge:false, audit:false, gen:false, blocker:"Pre-revenue — no receivables", description:"N/A" },
  { key:"W1-023", wave:1, group:"Assets & Loans", title:"Aged Payables Report", status:"MISSING",     src:"N/A", lodge:false, audit:false, gen:false, blocker:"Cash basis contractors", description:"N/A" },
  { key:"W1-024", wave:1, group:"Cash & Runway", title:"Cash Flow Calendar", status:"GENERATABLE", src:"v_maat_cashflow_calendar", lodge:false, audit:true,  gen:true,  blocker:"", description:"8 cashflow calendar entries" },
  { key:"W1-025", wave:1, group:"Cash & Runway", title:"90-Day Cash Runway", status:"GENERATABLE", src:"v_maat_cash_runway_90d", lodge:false, audit:true,  gen:true,  blocker:"", description:"Forward runway calculation based on current burn" },
  { key:"W1-026", wave:1, group:"Cash & Runway", title:"Unpaid Bills Summary", status:"GENERATABLE", src:"maat_unpaid_bills_summary", lodge:false, audit:true,  gen:true,  blocker:"", description:"40 outstanding bills — aging analysis" },
  { key:"W1-027", wave:1, group:"Core Financials", title:"Chart of Accounts", status:"GENERATABLE", src:"maat_chart_of_accounts", lodge:true,  audit:true,  gen:true,  blocker:"", description:"56 accounts — assets, liabilities, income, expenses" },

  // ══ WAVE 2 ══════════════════════════════════════════════════════════════
  { key:"W2-001", wave:2, group:"Transaction Data", title:"MAAT Transaction Export (Raw)", status:"GENERATABLE", src:"maat_transactions", lodge:true,  audit:true,  gen:true,  blocker:"", description:"4,723 transactions (excluding estimates) — full dataset" },
  { key:"W2-002", wave:2, group:"Transaction Data", title:"Categorised Transaction Ledger", status:"GENERATABLE", src:"maat_transactions", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Transactions with category, subcategory and COA code" },
  { key:"W2-003", wave:2, group:"Transaction Data", title:"Cloud Provider Invoice Match", status:"GENERATABLE", src:"maat_transactions", lodge:true,  audit:true,  gen:true,  blocker:"", description:"AWS, GCP, Vercel, AI/LLM spend — matched to R&D allocation" },
  { key:"W2-004", wave:2, group:"Transaction Data", title:"Orphan Transaction Report", status:"GENERATABLE", src:"maat_transactions", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Unclassified transactions requiring categorisation" },
  { key:"W2-005", wave:2, group:"Mapping & Rules", title:"Business Slug Mapping File", status:"GENERATABLE", src:"t4h_business_canonical", lodge:true,  audit:true,  gen:true,  blocker:"", description:"28 active businesses with group and status" },
  { key:"W2-006", wave:2, group:"Mapping & Rules", title:"Cost Centre Mapping", status:"GENERATABLE", src:"maat_chart_of_accounts", lodge:true,  audit:true,  gen:true,  blocker:"", description:"56 COA codes mapped to business functions" },
  { key:"W2-007", wave:2, group:"Mapping & Rules", title:"R&D vs Non-R&D Allocation Logic", status:"GENERATABLE", src:"maat_classification_rules", lodge:true,  audit:true,  gen:true,  blocker:"", description:"184 active classification rules with R&D eligibility flag" },
  { key:"W2-008", wave:2, group:"Mapping & Rules", title:"Allocation Rules Documentation", status:"GENERATABLE", src:"maat_classification_rules", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Full rule set by vendor pattern and category" },
  { key:"W2-009", wave:2, group:"Evidence & Coverage", title:"Evidence Binding Table", status:"GENERATABLE", src:"maat_evidence_spine", lodge:true,  audit:true,  gen:true,  blocker:"", description:"7 evidence spine records linking claims to transactions" },
  { key:"W2-010", wave:2, group:"Evidence & Coverage", title:"Evidence Coverage Ratio Report", status:"GENERATABLE", src:"v_maat_rd_cost_surface", lodge:true,  audit:true,  gen:true,  blocker:"", description:"18 cost surface rows — R&D coverage by project" },
  { key:"W2-011", wave:2, group:"Evidence & Coverage", title:"Reality Ledger Report", status:"GENERATABLE", src:"maat_rd_summary", lodge:true,  audit:true,  gen:true,  blocker:"", description:"15 R&D summary records — REAL/PARTIAL classification" },
  { key:"W2-012", wave:2, group:"Evidence & Coverage", title:"REAL / PARTIAL / PRETEND Summary", status:"GENERATABLE", src:"maat_transactions", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Transaction reality breakdown by amount" },
  { key:"W2-013", wave:2, group:"Reconciliations", title:"MAAT vs BAS Reconciliation", status:"GENERATABLE", src:"maat_bas_periods", lodge:true,  audit:true,  gen:true,  blocker:"", description:"BAS lodgement status vs MAAT calculated figures" },
  { key:"W2-014", wave:2, group:"Reconciliations", title:"MAAT vs Bank Reconciliation", status:"PARTIAL",     src:"maat_bank_accounts", lodge:true,  audit:true,  gen:false, blocker:"Amex Feb/Mar + ANZ gaps", description:"Bank vs MAAT — incomplete due to missing statements" },
  { key:"W2-015", wave:2, group:"Reconciliations", title:"MAAT vs Stripe", status:"MISSING",     src:"N/A", lodge:false, audit:false, gen:false, blocker:"Pre-revenue", description:"N/A" },
  { key:"W2-016", wave:2, group:"System Docs", title:"MAAT Schema Definition", status:"GENERATABLE", src:"information_schema", lodge:false, audit:true,  gen:true,  blocker:"", description:"Table and column definitions — 2,384 tables in public schema" },
  { key:"W2-017", wave:2, group:"System Docs", title:"Exception Register", status:"GENERATABLE", src:"maat_transactions", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Transactions flagged as exceptions requiring review" },
  { key:"W2-018", wave:2, group:"System Docs", title:"MAAT Change Log", status:"PARTIAL",     src:"maat_transactions", lodge:false, audit:true,  gen:false, blocker:"Full audit trail incomplete", description:"Change history — partial coverage" },
  { key:"W2-019", wave:2, group:"Cost Surface", title:"R&D Cost Surface by Project", status:"GENERATABLE", src:"v_maat_rd_cost_surface", lodge:true,  audit:true,  gen:true,  blocker:"", description:"18 project cost surfaces with R&D allocation percentages" },
  { key:"W2-020", wave:2, group:"Cost Surface", title:"R&D Allocation Detail (440 lines)", status:"GENERATABLE", src:"maat_rd_allocation", lodge:true,  audit:true,  gen:true,  blocker:"", description:"Full allocation table — every transaction to every project" },

  // ══ WAVE 3 ══════════════════════════════════════════════════════════════
  { key:"W3-001", wave:3, group:"Corporate", title:"Company Constitution", status:"MISSING",     src:"ASIC — external", lodge:false, audit:true,  gen:false, blocker:"Locate from formation docs", description:"Locate from ASIC/company formation docs" },
  { key:"W3-002", wave:3, group:"Corporate", title:"ASIC Registration Extract", status:"MISSING",     src:"ASIC Connect portal", lodge:false, audit:true,  gen:false, blocker:"Download from ASIC Connect", description:"Current extract from ASIC Connect" },
  { key:"W3-003", wave:3, group:"Corporate", title:"Director Resolutions", status:"GENERATABLE", src:"Template", lodge:false, audit:true,  gen:true,  blocker:"", description:"Sole director resolution template — executable by Troy" },
  { key:"W3-004", wave:3, group:"Corporate", title:"Shareholder Register", status:"GENERATABLE", src:"Company records", lodge:false, audit:true,  gen:true,  blocker:"", description:"100% Troy Latter — ordinary shares" },
  { key:"W3-005", wave:3, group:"IP Legal", title:"IP Assignment Deed", status:"MISSING",     src:"Solicitor required", lodge:false, audit:true,  gen:false, blocker:"Hales Redden or IP lawyer", description:"Formal IP assignment from Troy to T4H" },
  { key:"W3-006", wave:3, group:"IP Legal", title:"Trademark Filings", status:"PARTIAL",     src:"IP Australia", lodge:false, audit:false, gen:false, blocker:"Confirm filing status", description:"IP Australia — confirm current status" },
  { key:"W3-007", wave:3, group:"IP Legal", title:"Patent Filings", status:"MISSING",     src:"N/A", lodge:false, audit:false, gen:false, blocker:"Not applicable", description:"N/A at this stage" },
  { key:"W3-008", wave:3, group:"Agreements", title:"Div7A Loan Agreement Schedule", status:"GENERATABLE", src:"maat_div7a_rates", lodge:false, audit:true,  gen:true,  blocker:"", description:"Benchmark rates + MYR — FY2024, FY2025, FY2026" },
  { key:"W3-009", wave:3, group:"Agreements", title:"Employment Contracts", status:"MISSING",     src:"N/A", lodge:false, audit:false, gen:false, blocker:"Director only — N/A", description:"N/A" },
  { key:"W3-010", wave:3, group:"Agreements", title:"Contractor Agreements", status:"MISSING",     src:"Files", lodge:false, audit:false, gen:false, blocker:"Recategorised — agreements on file", description:"Contractors recategorised as non-research" },

  // ══ WAVE 4 ══════════════════════════════════════════════════════════════
  { key:"W4-001", wave:4, group:"IP Register", title:"Master IP Register", status:"GENERATABLE", src:"research_asset_register", lodge:false, audit:false, gen:true,  blocker:"", description:"810 assets — 74 GREEN, 736 AMBER. Full registry." },
  { key:"W4-002", wave:4, group:"IP Register", title:"IP Asset Detailed Register", status:"GENERATABLE", src:"maat_ip_asset", lodge:false, audit:false, gen:true,  blocker:"", description:"241 IP asset records with lineage" },
  { key:"W4-003", wave:4, group:"IP Register", title:"Artefact Registry", status:"GENERATABLE", src:"maat_artifacts", lodge:false, audit:false, gen:true,  blocker:"", description:"All registered artefacts linked to R&D projects" },
  { key:"W4-004", wave:4, group:"IP Register", title:"Claim Registry", status:"GENERATABLE", src:"maat_claim", lodge:false, audit:false, gen:true,  blocker:"", description:"All IP claims with item-level breakdown" },
  { key:"W4-005", wave:4, group:"IP Register", title:"SKU / Product Catalogue", status:"GENERATABLE", src:"t4h_sku", lodge:false, audit:false, gen:true,  blocker:"", description:"249 SKUs across T4H product lines" },
  { key:"W4-006", wave:4, group:"Code & Versions", title:"Version History Snapshots", status:"PARTIAL",     src:"GitHub TML-4PM", lodge:false, audit:false, gen:false, blocker:"Manual snapshot export needed", description:"Source code version history" },
  { key:"W4-007", wave:4, group:"Code & Versions", title:"Source Code Repository Archive", status:"PARTIAL",     src:"GitHub TML-4PM", lodge:false, audit:false, gen:false, blocker:"Snapshot Lambda needed", description:"Repository archive export" },
  { key:"W4-008", wave:4, group:"Architecture", title:"Supabase Schema Export", status:"GENERATABLE", src:"information_schema", lodge:false, audit:false, gen:true,  blocker:"", description:"All 2,384 tables with column definitions" },
  { key:"W4-009", wave:4, group:"Architecture", title:"System Architecture Summary", status:"GENERATABLE", src:"maat_systems", lodge:false, audit:false, gen:true,  blocker:"", description:"MAAT + Basiq system registry with layer and purpose" },
  { key:"W4-010", wave:4, group:"Architecture", title:"Integrity Stack Lifecycle Docs", status:"PARTIAL",     src:"autonomy_pattern_registry", lodge:false, audit:false, gen:false, blocker:"Narrative layer needed", description:"Autonomy control plane lifecycle documentation" },
  { key:"W4-011", wave:4, group:"Project Docs", title:"ConsentX Governance Docs", status:"PARTIAL",     src:"maat_rd_projects", lodge:false, audit:false, gen:false, blocker:"Doc not built", description:"R06 project spec exists — governance doc pending" },
  { key:"W4-012", wave:4, group:"Project Docs", title:"MyNeuralSignal Research Logs", status:"PARTIAL",     src:"research_asset_register", lodge:false, audit:false, gen:false, blocker:"Formatted log not built", description:"Assets registered — formatted log not generated" },

  // ══ WAVE 5 ══════════════════════════════════════════════════════════════
  { key:"W5-001", wave:5, group:"Research", title:"Annual Research Summary Report", status:"GENERATABLE", src:"maat_rd_projects", lodge:false, audit:false, gen:true,  blocker:"", description:"35 projects across 4 FYs with costs and ATO defensibility" },
  { key:"W5-002", wave:5, group:"Research", title:"R&D Summary by FY", status:"GENERATABLE", src:"maat_rd_summary", lodge:false, audit:false, gen:true,  blocker:"", description:"15 summary records — spend and rd_claimed by FY" },
  { key:"W5-003", wave:5, group:"Roadmap", title:"Technology Roadmap", status:"PARTIAL",     src:"maat_rd_projects", lodge:false, audit:false, gen:false, blocker:"Narrative not built", description:"Project list exists — roadmap narrative pending" },
  { key:"W5-004", wave:5, group:"Roadmap", title:"Innovation Thesis", status:"PARTIAL",     src:"research_asset_register", lodge:false, audit:false, gen:false, blocker:"Narrative not built", description:"810 assets — thesis synthesis pending" },
  { key:"W5-005", wave:5, group:"Commercial", title:"IP Commercialisation Strategy", status:"PARTIAL",     src:"t4h_sku", lodge:false, audit:false, gen:false, blocker:"Doc not built", description:"249 SKUs catalogued — strategy doc pending" },
  { key:"W5-006", wave:5, group:"Commercial", title:"Revenue Model Mapping", status:"PARTIAL",     src:"t4h_business_canonical", lodge:false, audit:false, gen:false, blocker:"Formal model not built", description:"28 businesses catalogued — model pending" },
  { key:"W5-007", wave:5, group:"Grants & Investors", title:"Grant Application Copies", status:"MISSING",     src:"N/A", lodge:false, audit:false, gen:false, blocker:"None filed", description:"N/A" },
  { key:"W5-008", wave:5, group:"Grants & Investors", title:"Investor Updates", status:"MISSING",     src:"N/A", lodge:false, audit:false, gen:false, blocker:"Pre-investor stage", description:"N/A" },
];

// ─── SQL per report key ──────────────────────────────────────────────────────
const REPORT_SQL: Record<string, string> = {
  "W0-001": "SELECT project_code,project_name,financial_year,research_domain,technical_uncertainty,ato_defensibility,total_rnd_cost FROM maat_rd_projects ORDER BY financial_year,project_code",
  "W0-002": "SELECT project_code,project_name,financial_year,hypothesis_1,hypothesis_2,experiment_1,experiment_2,why_not_routine FROM maat_rd_projects ORDER BY financial_year,project_code",
  "W0-003": "SELECT project_code,project_name,financial_year,technical_uncertainty,knowledge_gap,still_unknown FROM maat_rd_projects ORDER BY financial_year,project_code",
  "W0-004": "SELECT project_code,project_name,financial_year,experiment_1,experiment_2,experiment_3,iteration_evidence FROM maat_rd_projects ORDER BY financial_year,project_code",
  "W0-007": "SELECT project_code,project_name,financial_year,new_knowledge_summary,what_changed,ato_defensibility,total_score FROM maat_rd_projects ORDER BY financial_year,project_code",
  "W0-008": "SELECT project_code,project_name,financial_year,total_rnd_cost,ato_defensibility,ausindustry_strength FROM maat_rd_projects ORDER BY financial_year,project_code",
  "W0-010": "SELECT fy,labour,bank_rd,total_eligible,rdti_refund FROM v_rdti_by_fy ORDER BY fy",
  "W0-011": "SELECT project_code,project_name,financial_year,labour_pct,compute_pct,external_pct,mixed_use_notes FROM maat_rd_projects ORDER BY financial_year,project_code",
  "W0-012": "SELECT fy,labour,bank_rd,total_eligible,rdti_refund FROM v_rdti_by_fy ORDER BY fy",
  "W0-014": "SELECT * FROM maat_rd_allocation ORDER BY project_code LIMIT 440",
  "W0-015": "SELECT * FROM maat_supplementary_costs ORDER BY created_at",
  "W0-016": "SELECT * FROM maat_evidence_spine ORDER BY created_at",
  "W0-017": "SELECT financial_year,staff_name,work_date,hours_worked,activity_description,source FROM maat_timesheets ORDER BY financial_year,work_date",
  "W0-018": "SELECT * FROM v_maat_labour_coverage ORDER BY fy",
  "W0-019": "SELECT fy,invoice_count,total_hours,total_ex_gst,total_gst,total_inc_gst FROM v_invoice_summary_by_fy ORDER BY fy",
  "W0-020": "SELECT period_label,period_start,period_end,status,label_1a_gst_collected,label_1b_gst_paid,gst_payable,total_payable FROM maat_bas_periods ORDER BY period_start",
  "W0-021": "SELECT period_label,period_start,period_end,g1_total_sales,g11_non_capital_purchases,label_1a_gst_collected,label_1b_gst_paid,gst_payable FROM maat_bas_periods ORDER BY period_start",
  "W0-025": "SELECT fy_ending,total_credits_to_dl,total_debits_from_dl,net_balance,journal_count FROM v_maat_api_director_loan ORDER BY fy_ending",
  "W0-026": "SELECT fy,loan_balance,benchmark_rate,interest_component,min_yearly_repayment,source FROM maat_div7a_rates ORDER BY fy",
  "W0-027": "SELECT * FROM maat_tax_summary ORDER BY created_at",
  "W0-028": "SELECT * FROM maat_personal_tax ORDER BY created_at",
  "W1-001": "SELECT source,status,reality,journals,lines,debits,credits FROM v_maat_api_ledger ORDER BY debits DESC",
  "W1-002": "SELECT source,status,reality,journals,lines,debits,credits FROM v_maat_api_ledger ORDER BY source",
  "W1-003": "SELECT fy,category,pl_section,coa_code,total,txn_count FROM v_pl_t4h_by_fy ORDER BY fy DESC,display_order",
  "W1-004": "SELECT * FROM maat_monthly_pl ORDER BY period DESC LIMIT 48",
  "W1-007": "SELECT fy,pl_section,SUM(total) as section_total,COUNT(*) as line_items FROM v_pl_t4h_by_fy GROUP BY fy,pl_section ORDER BY fy DESC,pl_section",
  "W1-008": "SELECT * FROM maat_monthly_spending ORDER BY period DESC LIMIT 48",
  "W1-009": "SELECT fy,category,pl_section,coa_code,total,txn_count FROM v_pl_t4h_by_fy ORDER BY fy DESC,total DESC",
  "W1-010": "SELECT * FROM maat_fixed_asset_register ORDER BY acquisition_date",
  "W1-011": "SELECT fy,labour,bank_rd,total_eligible,rdti_refund FROM v_rdti_by_fy ORDER BY fy",
  "W1-012": "SELECT fy,category,total FROM v_pl_t4h_by_fy WHERE pl_section='Personal' ORDER BY fy DESC,total DESC",
  "W1-013": "SELECT * FROM maat_deductions_summary ORDER BY created_at",
  "W1-014": "SELECT * FROM maat_personal_deductions ORDER BY created_at",
  "W1-015": "SELECT * FROM maat_paye_deductions ORDER BY created_at",
  "W1-017": "SELECT period_label,period_start,label_1a_gst_collected,label_1b_gst_paid,gst_payable FROM maat_bas_periods ORDER BY period_start",
  "W1-018": "SELECT * FROM maat_accounting_treatments ORDER BY created_at",
  "W1-019": "SELECT fy_ending,total_credits_to_dl,total_debits_from_dl,net_balance FROM v_maat_api_director_loan ORDER BY fy_ending",
  "W1-020": "SELECT * FROM maat_fixed_asset_register ORDER BY acquisition_date",
  "W1-021": "SELECT * FROM v_maat_depreciation_schedule ORDER BY asset_name",
  "W1-024": "SELECT * FROM v_maat_cashflow_calendar ORDER BY period",
  "W1-025": "SELECT * FROM v_maat_cash_runway_90d",
  "W1-026": "SELECT * FROM maat_unpaid_bills_summary ORDER BY due_date LIMIT 40",
  "W1-027": "SELECT code,name,account_type FROM maat_chart_of_accounts ORDER BY code",
  "W2-001": "SELECT transaction_date,description,amount,category,subcategory FROM maat_transactions WHERE is_estimate=false ORDER BY transaction_date DESC LIMIT 500",
  "W2-002": "SELECT transaction_date,description,amount,category,subcategory,coa_code FROM maat_transactions WHERE is_estimate=false ORDER BY transaction_date DESC LIMIT 500",
  "W2-003": "SELECT transaction_date,description,amount,category FROM maat_transactions WHERE category IN ('Cloud/Infrastructure','AI/LLM Services','Development Tools') AND is_estimate=false ORDER BY transaction_date DESC LIMIT 300",
  "W2-004": "SELECT transaction_date,description,amount FROM maat_transactions WHERE (category IS NULL OR category='') AND is_estimate=false ORDER BY ABS(amount) DESC LIMIT 200",
  "W2-005": "SELECT business_key,business_name,group_id,status FROM t4h_business_canonical ORDER BY group_id,business_key LIMIT 50",
  "W2-006": "SELECT code,name,account_type FROM maat_chart_of_accounts ORDER BY code",
  "W2-007": "SELECT rule_name,vendor_match,category,subcategory,rd_eligible,is_active FROM maat_classification_rules ORDER BY category,rule_name LIMIT 184",
  "W2-008": "SELECT rule_name,vendor_match,category,subcategory,rd_eligible FROM maat_classification_rules WHERE is_active=true ORDER BY category,rule_name",
  "W2-009": "SELECT * FROM maat_evidence_spine ORDER BY created_at",
  "W2-010": "SELECT * FROM v_maat_rd_cost_surface ORDER BY project_code",
  "W2-011": "SELECT * FROM maat_rd_summary ORDER BY fy_ending",
  "W2-012": "SELECT COALESCE(reality,'UNCLASSIFIED') as reality,COUNT(*) as txn_count,SUM(ABS(amount)) as total_value FROM maat_transactions WHERE is_estimate=false GROUP BY reality ORDER BY total_value DESC",
  "W2-013": "SELECT period_label,period_start,period_end,status,label_1a_gst_collected,label_1b_gst_paid,gst_payable FROM maat_bas_periods ORDER BY period_start",
  "W2-016": "SELECT table_name,COUNT(*) as columns FROM information_schema.columns WHERE table_schema='public' GROUP BY table_name ORDER BY table_name LIMIT 200",
  "W2-017": "SELECT transaction_date,description,amount,category FROM maat_transactions WHERE category IS NULL AND is_estimate=false ORDER BY transaction_date DESC LIMIT 100",
  "W2-019": "SELECT * FROM v_maat_rd_cost_surface ORDER BY project_code",
  "W2-020": "SELECT * FROM maat_rd_allocation ORDER BY project_code LIMIT 440",
  "W3-003": "SELECT 'Tech 4 Humanity Pty Ltd' as entity,'61 605 746 618' as abn,'Troy Latter' as sole_director,now()::date as resolution_date,'RDTI Claim FY2024-25' as resolution_subject",
  "W3-004": "SELECT 'Troy Latter' as shareholder,'100%' as shareholding,'Ordinary' as share_class,'Sole Shareholder & Director' as role",
  "W3-008": "SELECT fy,loan_balance,benchmark_rate,interest_component,min_yearly_repayment,source FROM maat_div7a_rates ORDER BY fy",
  "W4-001": "SELECT title,status,asset_type,fy FROM research_asset_register ORDER BY status,asset_type LIMIT 300",
  "W4-002": "SELECT * FROM maat_ip_asset ORDER BY created_at DESC LIMIT 200",
  "W4-003": "SELECT * FROM maat_artifacts ORDER BY created_at DESC LIMIT 200",
  "W4-004": "SELECT * FROM maat_claim ORDER BY created_at DESC LIMIT 200",
  "W4-005": "SELECT * FROM t4h_sku ORDER BY sku_code LIMIT 249",
  "W4-008": "SELECT table_name,COUNT(*) as columns FROM information_schema.columns WHERE table_schema='public' GROUP BY table_name ORDER BY table_name LIMIT 300",
  "W4-009": "SELECT name,type,layer,status,purpose,aliases FROM maat_systems ORDER BY layer",
  "W5-001": "SELECT financial_year,project_code,project_name,research_domain,total_rnd_cost,ato_defensibility,ausindustry_strength FROM maat_rd_projects ORDER BY financial_year DESC,project_code",
  "W5-002": "SELECT * FROM maat_rd_summary ORDER BY fy_ending",
};

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
      const rows = await sql(`SELECT id,email,display_name,role,is_active FROM public.maat_portal_users WHERE email='${email.toLowerCase().trim()}' AND password_hash='${hash}' AND is_active=true`);
      if (!rows.length) { setErr("Invalid credentials."); setLoading(false); return; }
      await sql(`UPDATE public.maat_portal_users SET last_login=now() WHERE email='${email.toLowerCase().trim()}'`).catch(()=>{});
      onAuth(rows[0] as AuthUser);
    } catch { setErr("Connection error. Try again."); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#06090f",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:380,padding:"40px 36px",background:"#0d1320",border:"1px solid #1e2d47",borderRadius:12}}>
        <div style={{marginBottom:28}}>
          <div style={{fontSize:11,letterSpacing:"0.16em",color:"#00c2ff",marginBottom:8,textTransform:"uppercase",fontFamily:"monospace"}}>MAAT — 121 Document Spine</div>
          <div style={{fontSize:22,fontWeight:700,color:"#e8edf5"}}>Accountant Portal</div>
          <div style={{fontSize:12,color:"#6b7fa0",marginTop:4,fontFamily:"monospace"}}>Tech 4 Humanity Pty Ltd · ABN 61 605 746 618</div>
        </div>
        <form onSubmit={login}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:"#6b7fa0",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"monospace"}}>Email</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:"100%",padding:"10px 12px",background:"#141c2e",border:"1px solid #1e2d47",borderRadius:6,color:"#e8edf5",fontSize:13,outline:"none",boxSizing:"border-box"}}
              placeholder="your@email.com.au" />
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,color:"#6b7fa0",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"monospace"}}>Password</div>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} required
              style={{width:"100%",padding:"10px 12px",background:"#141c2e",border:"1px solid #1e2d47",borderRadius:6,color:"#e8edf5",fontSize:13,outline:"none",boxSizing:"border-box"}} />
          </div>
          {err && <div style={{color:"#f87171",fontSize:12,marginBottom:14}}>⚠ {err}</div>}
          <button type="submit" disabled={loading}
            style={{width:"100%",padding:"11px",background:loading?"#253552":"#00c2ff",border:"none",borderRadius:6,color:"#000",fontWeight:700,fontSize:13,cursor:loading?"not-allowed":"pointer"}}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>
        <div style={{marginTop:20,fontSize:11,color:"#6b7fa0",borderTop:"1px solid #1e2d47",paddingTop:16}}>
          Contact troy@tech4humanity.com.au for access
        </div>
      </div>
    </div>
  );
}

// ─── Report Viewer ──────────────────────────────────────────────────────────
function ReportViewer({ report, onClose }: { report: ReportDef; onClose: () => void }) {
  const [data, setData] = useState<{ rows: any[]; cols: string[]; ts: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const query = REPORT_SQL[report.key];

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    sql(query).then(rows => {
      setData({ rows, cols: rows.length ? Object.keys(rows[0]) : [], ts: new Date().toISOString() });
      setLoading(false);
    }).catch(() => { setErr("Failed to load."); setLoading(false); });
  }, [report.key]);

  const exportCSV = () => {
    if (!data?.rows.length) return;
    const csv = [data.cols.join(","), ...data.rows.map(r => data.cols.map(c => `"${String(r[c]??"").replace(/"/g,'""')}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `MAAT_${report.key}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const wc = WAVES[report.wave]?.color ?? "#00c2ff";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"32px 16px",overflowY:"auto"}}>
      <div style={{width:"100%",maxWidth:1100,background:"#0d1320",border:"1px solid #1e2d47",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"18px 24px",background:"#06090f",borderBottom:"1px solid #1e2d47",display:"flex",alignItems:"center",gap:14}}>
          <div style={{padding:"3px 10px",background:wc+"18",border:`1px solid ${wc}44`,borderRadius:6,fontSize:11,color:wc,fontFamily:"monospace"}}>{report.key}</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"#e8edf5"}}>{report.title}</div>
            <div style={{fontSize:11,color:"#6b7fa0",fontFamily:"monospace"}}>{report.description}</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            {data?.rows.length ? <button onClick={exportCSV} style={{padding:"6px 14px",background:"#1e2d47",border:"1px solid #253552",borderRadius:6,color:"#e8edf5",fontSize:12,cursor:"pointer"}}>↓ Export CSV</button> : null}
            <button onClick={onClose} style={{padding:"6px 14px",background:"transparent",border:"1px solid #1e2d47",borderRadius:6,color:"#6b7fa0",fontSize:12,cursor:"pointer"}}>✕ Close</button>
          </div>
        </div>
        <div style={{padding:20}}>
          {loading && <div style={{textAlign:"center",color:"#6b7fa0",padding:"60px 0",fontFamily:"monospace",fontSize:12}}>Loading from MAAT…</div>}
          {err && <div style={{color:"#f87171",padding:"40px 0",textAlign:"center"}}>{err}</div>}
          {!query && !loading && <div style={{textAlign:"center",padding:"60px 0",color:"#6b7fa0",fontFamily:"monospace"}}>⚠ {report.blocker || "Requires manual input"}</div>}
          {data && (
            <>
              <div style={{marginBottom:10,fontSize:11,color:"#6b7fa0",fontFamily:"monospace",display:"flex",gap:16}}>
                <span style={{color:"#22c55e"}}>✓ {data.rows.length} rows</span>
                <span>Generated: {new Date(data.ts).toLocaleString("en-AU")}</span>
                <span>Source: {report.src}</span>
              </div>
              <div style={{overflowX:"auto",border:"1px solid #1e2d47",borderRadius:8}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"monospace"}}>
                  <thead>
                    <tr>{data.cols.map(c=><th key={c} style={{padding:"7px 12px",background:"#06090f",color:"#6b7fa0",textAlign:"left",borderBottom:"1px solid #1e2d47",whiteSpace:"nowrap",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.rows.slice(0,200).map((r,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid #141c2e",background:i%2?"#0d1320":"transparent"}}>
                        {data.cols.map(c=><td key={c} style={{padding:"6px 12px",color:"#b0bed4",maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={String(r[c]??"")}>{String(r[c]??"—")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.rows.length > 200 && <div style={{padding:"8px 16px",background:"#06090f",color:"#6b7fa0",fontSize:11,borderTop:"1px solid #1e2d47",fontFamily:"monospace"}}>Showing 200/{data.rows.length} rows — export CSV for full dataset</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat Panel ───────────────────────────────────────────────────────────
function ChatPanel({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([{
    role: "assistant",
    content: `Hello ${user.display_name.split("—")[0].trim()} — I have direct access to MAAT data for Tech 4 Humanity Pty Ltd (ABN 61 605 746 618). I can answer questions about the P&L, RDTI figures, BAS statements, director loan, R&D projects, transactions, or any other financial data. What would you like to know?`,
    ts: new Date()
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const ask = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(m => [...m, { role: "user", content: userMsg, ts: new Date() }]);
    setLoading(true);

    try {
      // Pull fresh context data
      const [rdti, bas, pl, dl, projects] = await Promise.all([
        sql("SELECT fy,labour,bank_rd,total_eligible,rdti_refund FROM v_rdti_by_fy ORDER BY fy"),
        sql("SELECT period_label,status,gst_payable,total_payable FROM maat_bas_periods ORDER BY period_start"),
        sql("SELECT fy,pl_section,SUM(total) as total FROM v_pl_t4h_by_fy GROUP BY fy,pl_section ORDER BY fy DESC,pl_section"),
        sql("SELECT fy_ending,net_balance FROM v_maat_api_director_loan ORDER BY fy_ending"),
        sql("SELECT project_code,project_name,financial_year,total_rnd_cost,ato_defensibility FROM maat_rd_projects ORDER BY financial_year DESC LIMIT 20"),
      ]);

      const context = `
MAAT LIVE DATA — Tech 4 Humanity Pty Ltd (ABN 61 605 746 618) — ${new Date().toLocaleDateString("en-AU")}

RDTI by FY:
${rdti.map(r=>`  ${r.fy}: Labour=$${Number(r.labour).toLocaleString()} BankRD=$${Number(r.bank_rd).toLocaleString()} TotalEligible=$${Number(r.total_eligible).toLocaleString()} RDTIRefund=$${Number(r.rdti_refund).toLocaleString()}`).join("\n")}

BAS Statements:
${bas.map(r=>`  ${r.period_label}: Status=${r.status} GSTPayable=$${r.gst_payable}`).join("\n")}

P&L Summary by Section:
${pl.map(r=>`  ${r.fy} ${r.pl_section}: $${Number(r.total).toLocaleString()}`).join("\n")}

Director Loan by FY:
${dl.map(r=>`  FY${r.fy_ending}: Net Balance=$${Number(r.net_balance).toLocaleString()}`).join("\n")}

R&D Projects (recent):
${projects.map(r=>`  ${r.financial_year} ${r.project_code} - ${r.project_name}: Cost=$${r.total_rnd_cost} Defensibility=${r.ato_defensibility}`).join("\n")}

KEY FACTS:
- Entity type: Pre-revenue R&D company, director-only
- Contractors recategorised as non-research (excluded from RDTI)
- FY22-23 timesheets: 865.2 hrs at $350/hr reconstructed
- FY24-25 RDTI refund (revised): $773,882 (contractors excluded)
- Div7A loan balance: $371,699.08, FY26 MYR $72,299 due 30 Jun 2026
- BAS total refundable: $22,797.72 (all 4 FY24-25 quarters pending lodgement)
- AusIndustry RDTI registration deadline: 30 April 2026
`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are an AI financial assistant for Tech 4 Humanity Pty Ltd's MAAT accounting system. You are speaking with ${user.display_name}, an accountant at Hales Redden. Answer questions accurately using the live data provided. Be concise and precise. Format numbers in Australian style ($X,XXX). Flag any material issues or risks clearly. Do not speculate beyond the data provided.`,
          messages: [
            ...msgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: `${context}\n\nQuestion: ${userMsg}` }
          ],
        }),
      });
      const d = await response.json();
      const reply = d.content?.[0]?.text ?? "Unable to get a response. Please try again.";
      setMsgs(m => [...m, { role: "assistant", content: reply, ts: new Date() }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: "Connection error — please try again.", ts: new Date() }]);
    }
    setLoading(false);
  };

  const suggestions = [
    "What is the total RDTI refund across all years?",
    "What BAS quarters are outstanding?",
    "Summarise the P&L for FY2024-25",
    "What is the current Div7A position?",
    "Which R&D projects have the highest ATO defensibility?",
    "What are the 5 biggest expenses in FY2024-25?",
  ];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 16px"}}>
      <div style={{width:"100%",maxWidth:720,height:"80vh",background:"#0d1320",border:"1px solid #1e2d47",borderRadius:12,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"16px 20px",background:"#06090f",borderBottom:"1px solid #1e2d47",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:8,background:"rgba(0,194,255,0.15)",border:"1px solid rgba(0,194,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤖</div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#e8edf5"}}>MAAT AI Assistant</div>
            <div style={{fontSize:11,color:"#6b7fa0",fontFamily:"monospace"}}>Live access to MAAT data · Tech 4 Humanity</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e"}} />
            <span style={{fontSize:10,color:"#22c55e",fontFamily:"monospace"}}>LIVE</span>
          </div>
          <button onClick={onClose} style={{marginLeft:12,padding:"5px 12px",background:"transparent",border:"1px solid #1e2d47",borderRadius:6,color:"#6b7fa0",fontSize:12,cursor:"pointer"}}>✕</button>
        </div>
        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}}>
          {msgs.map((m,i) => (
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row"}}>
              <div style={{width:28,height:28,borderRadius:6,background:m.role==="user"?"rgba(0,194,255,0.15)":"rgba(34,197,94,0.12)",border:`1px solid ${m.role==="user"?"rgba(0,194,255,0.3)":"rgba(34,197,94,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>
                {m.role==="user"?"👤":"🤖"}
              </div>
              <div style={{maxWidth:"80%",padding:"10px 14px",background:m.role==="user"?"rgba(0,194,255,0.08)":"rgba(34,197,94,0.05)",border:`1px solid ${m.role==="user"?"rgba(0,194,255,0.15)":"rgba(34,197,94,0.1)"}`,borderRadius:8}}>
                <div style={{fontSize:13,color:"#e8edf5",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.content}</div>
                <div style={{fontSize:10,color:"#6b7fa0",fontFamily:"monospace",marginTop:4}}>{m.ts.toLocaleTimeString("en-AU",{hour:"2-digit",minute:"2-digit"})}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{width:28,height:28,borderRadius:6,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>🤖</div>
              <div style={{padding:"10px 14px",background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.1)",borderRadius:8}}>
                <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",opacity:0.6,animation:`pulse 1.2s ${i*0.2}s infinite`}} />)}</div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {/* Suggestions */}
        {msgs.length <= 1 && (
          <div style={{padding:"0 20px 12px",display:"flex",gap:6,flexWrap:"wrap"}}>
            {suggestions.map(s=>(
              <button key={s} onClick={()=>{ setInput(s); }}
                style={{padding:"4px 10px",background:"rgba(0,194,255,0.06)",border:"1px solid rgba(0,194,255,0.15)",borderRadius:100,fontSize:11,color:"#00c2ff",cursor:"pointer",fontFamily:"monospace",whiteSpace:"nowrap"}}>
                {s}
              </button>
            ))}
          </div>
        )}
        {/* Input */}
        <div style={{padding:"12px 20px",borderTop:"1px solid #1e2d47",display:"flex",gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&ask()}
            placeholder="Ask anything about the MAAT data…"
            style={{flex:1,padding:"10px 14px",background:"#141c2e",border:"1px solid #1e2d47",borderRadius:8,color:"#e8edf5",fontSize:13,outline:"none",fontFamily:"monospace"}} />
          <button onClick={ask} disabled={loading||!input.trim()}
            style={{padding:"10px 20px",background:loading||!input.trim()?"#1e2d47":"#00c2ff",border:"none",borderRadius:8,color:loading||!input.trim()?"#6b7fa0":"#000",fontWeight:700,fontSize:13,cursor:loading||!input.trim()?"not-allowed":"pointer"}}>
            {loading ? "…" : "Ask →"}
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function Maat121Spine() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeWave, setActiveWave] = useState<number | "all">("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openReport, setOpenReport] = useState<ReportDef | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const s = sessionStorage.getItem("maat_spine_user");
    if (s) { try { setUser(JSON.parse(s)); } catch {} }
  }, []);

  const handleAuth = (u: AuthUser) => { setUser(u); sessionStorage.setItem("maat_spine_user", JSON.stringify(u)); };
  const handleLogout = () => { setUser(null); sessionStorage.removeItem("maat_spine_user"); };

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  const filtered = REPORTS.filter(r => {
    const wm = activeWave === "all" || r.wave === activeWave;
    const sm = activeStatus === "all" || r.status === activeStatus;
    const q = search.toLowerCase();
    const qm = !q || r.title.toLowerCase().includes(q) || r.key.toLowerCase().includes(q) || r.group.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    return wm && sm && qm;
  });

  const wavesToShow = activeWave === "all" ? WAVES.map(w => w.id) : [activeWave as number];
  const totalGen = REPORTS.filter(r => r.gen).length;
  const totalPart = REPORTS.filter(r => r.status === "PARTIAL").length;
  const totalMiss = REPORTS.filter(r => r.status === "MISSING").length;
  const s = (s: string) => s === "GENERATABLE" ? "#22c55e" : s === "PARTIAL" ? "#f97316" : "#f87171";
  const sb = (s: string) => s === "GENERATABLE" ? "rgba(34,197,94,0.12)" : s === "PARTIAL" ? "rgba(249,115,22,0.12)" : "rgba(239,68,68,0.08)";
  const sl = (s: string) => s === "GENERATABLE" ? "✓ Ready" : s === "PARTIAL" ? "◐ Partial" : "✗ Missing";

  return (
    <div style={{minHeight:"100vh",background:"#06090f",color:"#e8edf5",fontFamily:"sans-serif"}}>
      {openReport && <ReportViewer report={openReport} onClose={() => setOpenReport(null)} />}
      {showChat && user && <ChatPanel user={user} onClose={() => setShowChat(false)} />}

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(6,9,15,0.96)",backdropFilter:"blur(8px)",borderBottom:"1px solid #1e2d47",padding:"0 24px",height:52,display:"flex",alignItems:"center",gap:16}}>
        <div style={{fontWeight:800,fontSize:16,color:"#00c2ff"}}>MAAT</div>
        <div style={{color:"#253552"}}>/</div>
        <div style={{fontSize:14,color:"#e8edf5",fontWeight:600}}>121 Spine</div>
        <div style={{fontSize:10,color:"#6b7fa0",fontFamily:"monospace",letterSpacing:"0.1em"}}>COMPLIANCE DOCUMENT MATRIX</div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:11,color:"#22c55e",fontFamily:"monospace",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:100,padding:"3px 10px"}}>● {totalGen} ready</div>
          <div style={{fontSize:11,color:"#f97316",fontFamily:"monospace",background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.2)",borderRadius:100,padding:"3px 10px"}}>◐ {totalPart} partial</div>
          <div style={{fontSize:11,color:"#f87171",fontFamily:"monospace",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:100,padding:"3px 10px"}}>○ {totalMiss} missing</div>
          {/* AI Chat Button */}
          <button onClick={() => setShowChat(true)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"5px 14px",background:"rgba(0,194,255,0.1)",border:"1px solid rgba(0,194,255,0.3)",borderRadius:8,color:"#00c2ff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            🤖 Ask MAAT AI
          </button>
          <div style={{borderLeft:"1px solid #1e2d47",paddingLeft:10,fontSize:11,color:"#6b7fa0"}}>{user.display_name.split("—")[0].trim()}</div>
          <button onClick={handleLogout} style={{fontSize:11,color:"#6b7fa0",background:"transparent",border:"1px solid #1e2d47",borderRadius:4,padding:"3px 8px",cursor:"pointer"}}>Sign out</button>
        </div>
      </div>

      {/* Hero */}
      <div style={{padding:"28px 24px 20px",borderBottom:"1px solid #1e2d47",background:"linear-gradient(180deg,rgba(0,194,255,0.04) 0%,transparent 100%)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-10,top:-40,fontSize:180,fontWeight:900,color:"rgba(0,194,255,0.025)",pointerEvents:"none",lineHeight:1}}>121</div>
        <div style={{fontSize:10,letterSpacing:"0.18em",color:"#00c2ff",textTransform:"uppercase",marginBottom:6,fontFamily:"monospace"}}>Tech 4 Humanity Pty Ltd · ABN 61 605 746 618 · FY2024–25</div>
        <div style={{fontSize:26,fontWeight:800,color:"#e8edf5",marginBottom:6}}>MAAT — <span style={{color:"#00c2ff"}}>121</span> Document Spine</div>
        <div style={{color:"#6b7fa0",fontSize:13,marginBottom:18}}>Live compliance document matrix. Click any ready document to generate data. Use AI assistant to ask questions.</div>
        <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
          {[{n:String(REPORTS.length),l:"Mapped docs",c:"#e8edf5"},{n:String(totalGen),l:"Ready now",c:"#22c55e"},{n:String(totalPart),l:"Partial",c:"#f97316"},{n:String(totalMiss),l:"Missing/N/A",c:"#f87171"},{n:"14/28",l:"Wave 0 ready",c:"#00c2ff"},{n:"30 Apr",l:"AusIndustry",c:"#f5c842"}].map(stat=>(
            <div key={stat.l}><div style={{fontSize:22,fontWeight:700,color:stat.c,lineHeight:1}}>{stat.n}</div><div style={{fontSize:10,color:"#6b7fa0",textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"monospace",marginTop:2}}>{stat.l}</div></div>
          ))}
          {/* Inline AI chat teaser */}
          <div style={{marginLeft:"auto",alignSelf:"center"}}>
            <button onClick={() => setShowChat(true)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",background:"rgba(0,194,255,0.08)",border:"1px solid rgba(0,194,255,0.25)",borderRadius:10,color:"#00c2ff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              <span style={{fontSize:18}}>🤖</span>
              <div style={{textAlign:"left"}}>
                <div>Ask MAAT AI</div>
                <div style={{fontSize:10,color:"#6b7fa0",fontWeight:400}}>Live answers from MAAT data</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{padding:"10px 24px",borderBottom:"1px solid #1e2d47",background:"#0d1320",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {[{id:"all",label:"All Waves",color:"#00c2ff"},...WAVES.map(w=>({id:w.id,label:`W${w.id} ${w.label}`,color:w.color}))].map(f => {
            const active = activeWave === f.id;
            return <button key={String(f.id)} onClick={() => setActiveWave(f.id as any)}
              style={{padding:"4px 10px",border:`1px solid ${active?f.color:"#1e2d47"}`,borderRadius:6,background:active?f.color+"22":"transparent",color:active?f.color:"#6b7fa0",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>
              {f.label}
            </button>;
          })}
        </div>
        <div style={{width:1,height:20,background:"#1e2d47",margin:"0 4px"}} />
        <div style={{display:"flex",gap:4}}>
          {[{id:"all",label:"All",c:"#6b7fa0"},{id:"GENERATABLE",label:"✓ Ready",c:"#22c55e"},{id:"PARTIAL",label:"◐ Partial",c:"#f97316"},{id:"MISSING",label:"✗ Missing",c:"#f87171"}].map(f => {
            const active = activeStatus === f.id;
            return <button key={f.id} onClick={() => setActiveStatus(f.id)}
              style={{padding:"4px 10px",border:`1px solid ${active?f.c:"#1e2d47"}`,borderRadius:6,background:active?f.c+"22":"transparent",color:active?f.c:"#6b7fa0",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>
              {f.label}
            </button>;
          })}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…"
          style={{marginLeft:"auto",padding:"5px 12px",background:"#141c2e",border:"1px solid #1e2d47",borderRadius:6,color:"#e8edf5",fontSize:12,outline:"none",width:220,fontFamily:"monospace"}} />
      </div>

      {/* Content */}
      <div style={{padding:"20px 24px",maxWidth:1200,margin:"0 auto"}}>
        {wavesToShow.map(wid => {
          const wave = WAVES[wid];
          const wdocs = filtered.filter(r => r.wave === wid);
          if (!wdocs.length) return null;
          const genC = REPORTS.filter(r => r.wave === wid && r.gen).length;
          const totC = REPORTS.filter(r => r.wave === wid).length;
          const pct = Math.round(genC / totC * 100);
          const groups: Record<string, ReportDef[]> = {};
          wdocs.forEach(d => { if (!groups[d.group]) groups[d.group] = []; groups[d.group].push(d); });

          return (
            <div key={wid} style={{marginBottom:32}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,paddingBottom:10,borderBottom:"1px solid #1e2d47"}}>
                <div style={{width:26,height:26,borderRadius:6,background:wave.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#000",flexShrink:0}}>{wid}</div>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:"#e8edf5"}}>Wave {wid} — {wave.label}</div>
                  <div style={{fontSize:10,color:"#6b7fa0",fontFamily:"monospace"}}>{wave.sub}</div>
                </div>
                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:"#6b7fa0",fontFamily:"monospace"}}>{genC}/{totC} ready</span>
                  <div style={{width:72,height:4,background:"#1e2d47",borderRadius:2,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:wave.color,borderRadius:2}} /></div>
                </div>
              </div>
              {Object.entries(groups).map(([gname, gdocs]) => (
                <div key={gname} style={{background:"#0d1320",border:"1px solid #1e2d47",borderRadius:10,marginBottom:8,overflow:"hidden"}}>
                  <div style={{padding:"9px 16px",background:"#141c2e",borderBottom:"1px solid #1e2d47",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#e8edf5"}}>{gname}</span>
                    <span style={{fontSize:10,color:"#6b7fa0",fontFamily:"monospace"}}>{gdocs.length}</span>
                    <span style={{fontSize:10,color:"#22c55e",fontFamily:"monospace",marginLeft:4}}>{gdocs.filter(d=>d.gen).length} ready</span>
                  </div>
                  {gdocs.map((doc, i) => (
                    <div key={doc.key}
                      onClick={doc.gen ? () => setOpenReport(doc) : undefined}
                      style={{padding:"9px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:i<gdocs.length-1?"1px solid #141c2e":"none",cursor:doc.gen?"pointer":"default",transition:"background 0.1s"}}
                      onMouseEnter={e => { if(doc.gen)(e.currentTarget as HTMLElement).style.background="#141c2e"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="transparent"; }}>
                      <span style={{fontFamily:"monospace",fontSize:10,color:"#6b7fa0",width:56,flexShrink:0}}>{doc.key}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,color:doc.status==="MISSING"?"#6b7fa0":"#e8edf5"}}>{doc.title}</div>
                        <div style={{fontSize:11,color:"#6b7fa0",fontFamily:"monospace",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.description}</div>
                      </div>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                        <span style={{padding:"2px 7px",borderRadius:4,background:sb(doc.status),color:s(doc.status),fontSize:10,fontFamily:"monospace",border:`1px solid ${s(doc.status)}33`}}>{sl(doc.status)}</span>
                        {doc.lodge && <span style={{padding:"2px 6px",borderRadius:4,background:"rgba(0,194,255,0.08)",color:"#00c2ff",fontSize:9,fontFamily:"monospace",border:"1px solid rgba(0,194,255,0.15)"}}>LODGE</span>}
                        {doc.audit && <span style={{padding:"2px 6px",borderRadius:4,background:"rgba(245,200,66,0.08)",color:"#f5c842",fontSize:9,fontFamily:"monospace",border:"1px solid rgba(245,200,66,0.15)"}}>AUDIT</span>}
                        {doc.gen && <span style={{fontSize:11,color:"#6b7fa0"}}>→</span>}
                        {doc.blocker && !doc.gen && <span style={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:10,color:"#f87171",fontFamily:"monospace"}} title={doc.blocker}>⚠ {doc.blocker.substring(0,40)}{doc.blocker.length>40?"…":""}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{textAlign:"center",padding:"80px 0",color:"#6b7fa0",fontFamily:"monospace"}}>No documents match your filter.</div>}
      </div>

      {/* Footer */}
      <div style={{borderTop:"1px solid #1e2d47",padding:"14px 24px",display:"flex",gap:10,color:"#6b7fa0",fontSize:11,fontFamily:"monospace"}}>
        <span style={{color:"#00c2ff"}}>MAAT</span><span>—</span><span>Multi-domain Agentic Accounting & Tax</span>
        <span>·</span><span>Tech 4 Humanity Pty Ltd</span><span>·</span><span>Live from Supabase</span>
        <span style={{marginLeft:"auto"}}>ABN 61 605 746 618</span>
      </div>
    </div>
  );
}
