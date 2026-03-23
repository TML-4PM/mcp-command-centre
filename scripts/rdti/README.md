# RDTI FY2024-25 Substantiation Pack — Generation Scripts

**Registration:** PYV4R3VPW  
**Submitted:** 20 March 2026  
**Deadline:** 30 April 2026  
**Estimated Refund:** $929,504 (43.5% × $2,136,791)  
**S3 Pack:** `s3://troylatter-sydney-downloads/rdti/fy2425-substantiation-pack/`

## Pack Status

| Metric | Value |
|--------|-------|
| Total docs | 134 |
| Complete | 133 (99%) |
| Waves covered | W0–W10 |
| Generation scripts | 4 |

## Wave Coverage

| Wave | Label | Status |
|------|-------|--------|
| W0 | Lodgement Critical | 21/22 ✓ (1 bank statement = manual) |
| W1 | Financial Working Papers | 17/17 ✓ |
| W2 | MAAT Transaction Data | 18/18 ✓ |
| W3 | Corporate & IP | 10/10 ✓ |
| W4 | Technical Architecture | 11/11 ✓ |
| W5 | Research Evidence | 7/7 ✓ |
| W6 | AusIndustry + Activation | 16/16 ✓ |
| W7 | Research Methodology | 8/8 ✓ |
| W8 | IP & Commercialisation | 8/8 ✓ |
| W9 | Compliance & Audit | 7/7 ✓ |
| W10 | Board-Grade Lodgement Pack | 10/10 ✓ |

## Scripts

| Script | Docs Generated | Wave Focus |
|--------|---------------|------------|
| `gen_rdti_docs.js` | 5 docs | W0-W1: Timeline, Failure Logs, Assets, Payables, Receivables |
| `gen_rdti_docs2.js` | 5 docs | W0-W1: Justification Memo, Research Plan, Working Papers, Cap/Expense, Non-Deductible |
| `gen_rdti_w6_w10.js` | 13 docs | W6-W10: All AusIndustry, methodology, IP, compliance, board-grade docs |
| `gen_rdti_gaps.js` | 11 docs | W0/W3/W4/W7/W10: Board resolution, TU statements, trademarks, architecture, revenue |

## Regeneration

```bash
# Prerequisites
npm install -g docx

# Run all generation scripts
node scripts/rdti/gen_rdti_docs.js
node scripts/rdti/gen_rdti_docs2.js
node scripts/rdti/gen_rdti_w6_w10.js
node scripts/rdti/gen_rdti_gaps.js

# Upload to S3
aws s3 sync /path/to/output/ s3://troylatter-sydney-downloads/rdti/fy2425-substantiation-pack/ \
  --content-type "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
```

## Data Sources

All scripts pull live data from Supabase (lzfgigiyqpuuxslsygjt):
- `maat_rd_projects` — 13 R&D project records
- `maat_timesheets` — 299 timesheet entries
- `maat_transactions` — 6,038 transactions
- `ip_assets` — 251 IP assets
- `maat_fixed_asset_register` — 4 fixed assets
- `maat_div7a_rates` — Div7A benchmark rates
- `rdti_evidence_register` — 65 evidence items
- `research_publication_register` — 645 publications

## DocMatrix

Track completion: `maat_doc_matrix` table in Supabase.  
CC page: `rd` → queries `rdti_docmatrix_wave_status`, `rdti_docmatrix_s3_registry`, `rdti_docmatrix_missing`  
Accountant page: `accountant` → queries `rdti_pack_summary`, `rdti_pack_s3_accountant`

## Last Generated

2026-03-23 by Claude (Sonnet 4.6) via T4H Autonomous OS bridge.
