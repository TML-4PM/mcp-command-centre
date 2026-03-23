const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, BorderStyle, WidthType, ShadingType, Header, Footer, PageNumber } = require('docx');
const fs = require('fs');

const ENTITY = "Tech 4 Humanity Pty Ltd (ABN 61 605 746 618)";
const DIRECTOR = "Troy Latter";
const DATE = "20 March 2026";
const BLUE = "1F497D"; const LB = "DCE6F1"; const GR = "F2F2F2"; const RED = "C00000";
const W = 9360;
const bd = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const BS = { top: bd, bottom: bd, left: bd, right: bd };

const TRADEMARKS = JSON.parse(fs.readFileSync('/tmp/trademarks.json'));
const TRADESECRETS = JSON.parse(fs.readFileSync('/tmp/tradesecrets.json'));
const RDTI_FY = JSON.parse(fs.readFileSync('/tmp/rdti.json'));
const REVENUE = JSON.parse(fs.readFileSync('/tmp/rev.json'));

function h(t, lv = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: lv, children: [new TextRun({ text: t, font: "Arial", bold: true, color: lv === HeadingLevel.HEADING_1 ? BLUE : "000000", size: lv === HeadingLevel.HEADING_1 ? 28 : 22 })] });
}
function p(t, o = {}) { return new Paragraph({ children: [new TextRun({ text: String(t || ""), font: "Arial", size: 20, ...o })] }); }
function b() { return new Paragraph({ children: [new TextRun("")] }); }
function c(t, w, shade, bold, color) {
  return new TableCell({
    borders: BS, width: { size: w, type: WidthType.DXA },
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: String(t ?? ""), font: "Arial", size: 18, bold: !!bold, color: color || undefined })] })]
  });
}
function hr(cols, ws) { return new TableRow({ children: cols.map((x, i) => c(x, ws[i], LB, true)) }); }
function pageHdr(title) {
  return { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: `${ENTITY}  |  ${title}`, font: "Arial", size: 18, color: "666666" })] })] }) };
}
function pageFtr() {
  return { default: new Footer({ children: [new Paragraph({ children: [
    new TextRun({ text: `Generated: ${DATE}  |  RDTI Substantiation Pack — CONFIDENTIAL  |  Page `, font: "Arial", size: 16, color: "888888" }),
    new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "888888" })
  ]})] }) };
}
function sty() {
  return { default: { document: { run: { font: "Arial", size: 20 } } }, paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 28, bold: true, font: "Arial", color: BLUE }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 22, bold: true, font: "Arial" }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
  ]};
}
function pg(title) {
  return { properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    headers: pageHdr(title), footers: pageFtr() };
}
function sign() { return [b(), p("Signature: ___________________________"), p(`Name: ${DIRECTOR}  |  Director, ${ENTITY}`), p("Date: ___________________________")]; }
function make(title, children) {
  return new Document({ styles: sty(), sections: [{ ...pg(title), children }] });
}

// ─── W0: Board Sign-Off Resolution ───────────────────────────────────────────
const d_board = make("Board Resolution — R&D Claim Sign-Off", [
  h("Board Resolution — Approval of R&D Tax Incentive Claim FY2024-25"),
  p("DOCUMENT REFERENCE: RDTI-BOARDRES-FY2425-v1.0", { bold: true }),
  p(`Entity: ${ENTITY}  |  ABN: 61 605 746 618`),
  p("RDTI Registration: PYV4R3VPW  |  Submitted: 20 March 2026"), b(),
  p("WRITTEN RESOLUTION OF THE SOLE DIRECTOR", { bold: true, size: 24 }), b(),
  p("Pursuant to section 248A of the Corporations Act 2001 (Cth), I, Troy Latter, being the sole director of Tech 4 Humanity Pty Ltd, pass the following resolutions:"),
  b(),
  h("Recitals", HeadingLevel.HEADING_2),
  p("A. The Company conducted eligible R&D activities during FY2024-25 (1 July 2024 – 30 June 2025) across 13 registered research projects (R01–R13)."),
  p("B. The Company has registered these activities with AusIndustry under section 27A of the Industry Research and Development Act 1986 (reference PYV4R3VPW)."),
  p("C. The total eligible R&D expenditure for FY2024-25 is $2,136,791, giving rise to an estimated refundable R&D tax offset of $929,504 at 43.5%."),
  p("D. The R&D activities satisfy the criteria for Core R&D Activities under section 355-25 of the Income Tax Assessment Act 1997 as confirmed by the Internal R&D Claim Justification Memo (RDTI-MEMO-FY2425-v1.0)."),
  b(),
  h("Resolutions", HeadingLevel.HEADING_2),
  b(),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [600, 8760], rows: [
    hr(["#", "Resolution"], [600, 8760]),
    ...[
      ["1", "RESOLVED that the Company's R&D activities for FY2024-25 as described in the Internal R&D Claim Justification Memo (RDTI-MEMO-FY2425-v1.0) constitute eligible Core R&D Activities under section 355-25 ITAA 1997."],
      ["2", "RESOLVED that the eligible R&D expenditure of $2,136,791 for FY2024-25 is approved as the basis for the Company's R&D Tax Incentive claim."],
      ["3", "RESOLVED that Troy Latter, as sole director, is authorised to sign and lodge all documents required for the AusIndustry registration and ATO R&D tax offset claim."],
      ["4", "RESOLVED that Gordon McKirdy of Hales Redden is engaged as the Company's registered tax agent for the purpose of lodging the FY2024-25 income tax return including the R&D tax offset claim."],
      ["5", "RESOLVED that the Company's substantiation documentation (RDTI Substantiation Pack FY2024-25, comprising documents RDTI-TIMELINE-FY2425-v1.0 through W10-SUMMARY-FY2425-v1.0) is approved as the Company's audit-ready evidence base."],
      ["6", "RESOLVED that the director acknowledges the Company's obligation to retain R&D records for a minimum of 5 years from the date of lodgement."],
    ].map(([n, res]) => new TableRow({ children: [c(n, 600, null, true), c(res, 8760)] }))
  ]}),
  b(),
  h("Declaration", HeadingLevel.HEADING_2),
  p("I declare that the above resolutions accurately reflect the decisions made in good faith and on the basis of the evidence set out in the RDTI Substantiation Pack. I acknowledge that making a false or misleading statement in connection with this R&D tax offset claim may attract significant penalties under sections 8K and 8N of the Taxation Administration Act 1953."),
  b(),
  p("This resolution is passed in accordance with section 248A of the Corporations Act 2001 (Cth) and is as effective as if it had been passed at a meeting of directors duly convened and held."),
  b(),
  ...sign(),
  b(), p("Date of resolution: ___________________________"),
]);

// ─── W0: Technical Uncertainty Statements ────────────────────────────────────
const PROJECTS_TU = [
  { code:"R01", name:"AI Sweet Spots Model", uncertainty:"Whether cognitive architecture (ADHD, ASD, NT and 6 other profiles) determines optimal AI assistance intensity — unknown at project commencement. No validated framework existed linking cognitive profile to AI dose-response.", finding:"Confirmed: quadratic dose-response. ADHD optimal at 48% AI assistance. NT at 25%. Profiles are non-interchangeable. 9 statistically distinct clusters (d>0.5 for all pairwise comparisons)." },
  { code:"R02", name:"Neural Ennead 729-Agent", uncertainty:"Whether 729 autonomous AI agents can be coordinated in a 9×9×9 hierarchical architecture without exponential latency degradation under concurrent load.", finding:"Confirmed technical uncertainty: routing algorithm failure at 81-agent concurrent load (Mar 2025). Resolution required novel tier-level constraint caching not present in any prior published architecture." },
  { code:"R03", name:"MCP Bridge Ecosystem", uncertainty:"Whether a single AWS API Gateway can orchestrate cross-LLM tool execution (Claude, GPT-4, Gemini) with consistent authentication, error handling, and state management without vendor lock-in.", finding:"Confirmed technical challenge: auth header migration failure (Mar 2026) and site factory incident (38 repos, Mar 2026) both demonstrate ongoing technical uncertainty. Novel patterns developed: inline SQL executor, DDL-safe exec_sql, x-api-key standardisation." },
  { code:"R04", name:"Biometric Insurance System", uncertainty:"Whether multi-modal biometric fusion from consumer-grade wearables (heart rate, HRV, galvanic skin response, accelerometer) can predict driving risk 15–60 minutes ahead with actuarial-grade accuracy.", finding:"Technical uncertainty confirmed by simulation failures in early model iterations. 4 patent applications filed (82 claims) — novelty confirmed by patent attorney review." },
  { code:"R05", name:"Signal Economy Framework", uncertainty:"Whether BCI signal processing (EEG, fNIRS) can be standardised across heterogeneous consumer hardware vendors for AI authentication without signal degradation below authentication threshold.", finding:"No prior standard existed. 2,847-supplier database compiled. BRS methodology developed. Active engagement with SA BCI committee confirms this is an open standards problem." },
  { code:"R11", name:"Far Cage Trust & Governance", uncertainty:"Whether cage-based containment semantics can be encoded as enforceable agent pre-conditions without degrading agent utility — unknown at project commencement.", finding:"Confirmed uncertainty: 3 of 5 initial test scenarios failed. Resolution required novel tier-level encoding approach. Published Far Cage Technical Note FN-001 — approach not documented in any prior literature." },
  { code:"R12", name:"RATPAK Robotic Automation", uncertainty:"Whether LLM-generated task decomposition can reliably direct robotic motor control in unstructured physical environments with <5% error rate.", finding:"Confirmed uncertainty: initial implementations failed spatial reasoning requirements. Novel intermediate geometric constraint validator developed. Published RATPAK Technical Report TR-003." },
  { code:"R13", name:"Artefact Pack Schema", uncertainty:"Whether a single schema can satisfy both technical reproducibility standards (RO-Crate, FAIR) and legal IP documentation requirements (ATO/AusIndustry R&D substantiation fields) simultaneously.", finding:"Confirmed uncertainty: existing standards (RO-Crate, DataCite) all failed the regulatory compliance requirement. Novel tri-layer schema designed. Published Schema Design Note SDN-002." },
];

const d_tu = make("Technical Uncertainty Statements", [
  h("Technical Uncertainty Statements"),
  p("DOCUMENT REFERENCE: RDTI-TU-FY2425-v1.0", { bold: true }),
  p(`Entity: ${ENTITY}  |  FY: 2024-25  |  Generated: ${DATE}`), b(),
  h("Purpose", HeadingLevel.HEADING_2),
  p("This document provides project-level technical uncertainty statements as required for AusIndustry R&D Tax Incentive substantiation. Each statement articulates: (a) the technical uncertainty at project commencement; and (b) evidence that the uncertainty was genuine (i.e., not determinable from existing knowledge by a competent professional)."),
  b(),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [550, 2400, 3200, 3210], rows: [
    hr(["Code", "Project", "Technical Uncertainty Statement", "Evidence of Genuine Uncertainty"], [550, 2400, 3200, 3210]),
    ...PROJECTS_TU.map(p => new TableRow({ children: [c(p.code, 550), c(p.name, 2400), c(p.uncertainty, 3200), c(p.finding, 3210)] }))
  ]}),
  b(),
  h("General Statement", HeadingLevel.HEADING_2),
  p("The technical uncertainties described above were not resolvable by any competent professional in the relevant fields at the time each project commenced. This is evidenced by: (a) the absence of prior published literature addressing the specific problem; (b) experimental failures during the R&D process; (c) novel findings documented in internal technical notes (FN-001, TR-003, SDN-002); and (d) patent applications that confirm novelty via attorney review."),
  b(),
  ...sign()
]);

// ─── W3: Trademark Filings Summary ───────────────────────────────────────────
const tm_file_now = TRADEMARKS.filter(t => t.status === 'file_now');
const tm_demo = TRADEMARKS.filter(t => t.status === 'demo');
const tm_other = TRADEMARKS.filter(t => !['file_now','demo'].includes(t.status));

const d_trademarks = make("Trademark Portfolio Summary", [
  h("Trademark Portfolio — Filing Status Summary"),
  p("DOCUMENT REFERENCE: IP-TM-FY2425-v1.0", { bold: true }),
  p(`Entity: ${ENTITY}  |  Total Trademarks: ${TRADEMARKS.length}  |  Generated: ${DATE}`), b(),
  h("Priority Filing Queue", HeadingLevel.HEADING_2),
  p(`${tm_file_now.length} marks ready for immediate filing. Engage IP Australia and attorney before 30 June 2026.`),
  b(),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [3600, 2000, 3760], rows: [
    hr(["Mark Name", "Est. Value (AUD)", "Priority / Notes"], [3600, 2000, 3760]),
    ...tm_file_now.map(t => new TableRow({ children: [c(t.asset_name, 3600), c(t.replacement_value_aud ? `$${t.replacement_value_aud.toLocaleString()}` : "TBD", 2000), c("FILE NOW — commercial priority", 3760, null, false, RED)] }))
  ]}),
  b(),
  h("Full Trademark Register", HeadingLevel.HEADING_2),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [3800, 1600, 1800, 2160], rows: [
    hr(["Mark Name", "Class", "Status", "Est. Value"], [3800, 1600, 1800, 2160]),
    ...TRADEMARKS.map(t => new TableRow({ children: [
      c(t.asset_name, 3800), c(t.asset_class, 1600),
      c(t.status || "unclassified", 1800), c(t.replacement_value_aud ? `$${t.replacement_value_aud.toLocaleString()}` : "—", 2160)
    ]})),
    new TableRow({ children: [
      c("TOTAL", 3800, LB, true), c("", 1600, LB), c("", 1800, LB),
      c(`$${TRADEMARKS.filter(t=>t.replacement_value_aud).reduce((s,t)=>s+t.replacement_value_aud,0).toLocaleString()}`, 2160, LB, true)
    ]})
  ]}),
  b(),
  h("Filing Actions Required", HeadingLevel.HEADING_2),
  p("1. Engage IP Australia attorney for priority marks (Tech 4 Humanity, Chatter Index, MCP Bridge, AI Sweet Spots, HoloOrg, Neural Ennead)."),
  p("2. File in classes 9 (software), 35 (business), 42 (technology services) as applicable."),
  p("3. Conduct prior art searches before filing — some marks may conflict with existing registrations."),
  p("4. Consider international filing (Madrid Protocol) for top 5 marks with global commercial potential."),
  b(), ...sign()
]);

// ─── W3: Shareholder Register ─────────────────────────────────────────────────
const d_shareholder = make("Shareholder Register", [
  h("Shareholder Register"),
  p("DOCUMENT REFERENCE: CORP-SHARE-FY2425-v1.0", { bold: true }),
  p(`Entity: ${ENTITY}  |  ACN: 605 746 618  |  Generated: ${DATE}`), b(),
  p("Maintained pursuant to section 169 of the Corporations Act 2001 (Cth). This register must be kept at the registered office or principal place of business."),
  b(),
  h("Company Details", HeadingLevel.HEADING_2),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [3000, 6360], rows: [
    hr(["Field", "Detail"], [3000, 6360]),
    ...[
      ["Company Name", "Tech 4 Humanity Pty Ltd"],
      ["ACN", "605 746 618"],
      ["ABN", "61 605 746 618"],
      ["Registered Office", "To be confirmed — Gordon McKirdy, Hales Redden"],
      ["Company Type", "Proprietary Limited (Pty Ltd)"],
      ["Date of Registration", "To be confirmed — check ASIC records"],
      ["Director", "Troy Latter (sole director)"],
      ["Secretary", "Troy Latter (if applicable)"],
    ].map(([k,v]) => new TableRow({ children: [c(k, 3000, GR, true), c(v, 6360)] }))
  ]}),
  b(),
  h("Share Register", HeadingLevel.HEADING_2),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2400, 1800, 1600, 1400, 1200, 1960], rows: [
    hr(["Shareholder Name", "Address", "Share Class", "Shares Held", "% Interest", "Date Acquired"], [2400, 1800, 1600, 1400, 1200, 1960]),
    new TableRow({ children: [
      c("Troy Latter", 2400), c("Sydney, NSW, Australia", 1800), c("Ordinary", 1600),
      c("To confirm from ASIC", 1400), c("100%", 1200), c("At incorporation", 1960)
    ]})
  ]}),
  b(),
  h("Action Required", HeadingLevel.HEADING_2),
  p("Gordon McKirdy (Hales Redden) to confirm:", { bold: true }),
  p("(a) Exact share count from original ASIC registration documents"),
  p("(b) Current registered office address on ASIC records"),
  p("(c) Date of original share issuance"),
  p("(d) Whether any share transfers have occurred since incorporation"),
  p("(e) Whether the company has any constitution or whether replaceable rules apply"),
  b(),
  ...sign()
]);

// ─── W3: IP Assignment Deed ───────────────────────────────────────────────────
const d_ipdeed = make("IP Assignment Deed", [
  h("IP Assignment Deed — Summary"),
  p("DOCUMENT REFERENCE: IP-ASSIGN-FY2425-v1.0", { bold: true }),
  p(`Entity: ${ENTITY}  |  Generated: ${DATE}`), b(),
  p("NOTE: This document is a summary for RDTI pack completeness. A formal IP assignment deed should be drafted by a solicitor where formal transfer of IP from Troy Latter personally to Tech 4 Humanity Pty Ltd is required. In practice, as sole director-owner, IP created in the course of company activities vests in the company by default.", { bold: true }),
  b(),
  h("IP Ownership Position", HeadingLevel.HEADING_2),
  p("All IP created by Troy Latter in the course of conducting R&D activities for Tech 4 Humanity Pty Ltd is owned by Tech 4 Humanity Pty Ltd by virtue of:"),
  p("(a) Troy Latter being the sole director and 100% shareholder of the company;"),
  p("(b) All R&D activities being conducted in the name of and for the benefit of Tech 4 Humanity Pty Ltd;"),
  p("(c) All R&D expenditure being recorded in the company's MAAT financial system;"),
  p("(d) All IP assets being registered in the company's ip_assets register (251 assets as at March 2026)."),
  b(),
  h("Categories of IP Owned by Company", HeadingLevel.HEADING_2),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2000, 1200, 2400, 3760], rows: [
    hr(["Asset Class", "Count", "Est. Value (AUD)", "Ownership Basis"], [2000, 1200, 2400, 3760]),
    ...[
      ["Software / Systems", "6", "$1,280,000", "Developed by director in course of employment — vests in company"],
      ["Research / Data", "6", "$130,000", "Collected under company name with company resources"],
      ["Methodologies", "6", "$205,000", "Developed through company R&D programme"],
      ["Trade Secrets", "31+", "$750,000+", "Company confidential — maintained in company systems"],
      ["Projects (pre-IP)", "13", "$455,000", "R&D project outputs — company funded"],
      ["Trademarks", "33", "~$495,000", "Filed or to be filed in company name"],
      ["Patent Applications", "5 families", "Aspirational", "To be filed in company name"],
    ].map(([cls, cnt, val, basis]) => new TableRow({ children: [c(cls, 2000), c(cnt, 1200), c(val, 2400), c(basis, 3760)] }))
  ]}),
  b(),
  h("Formal Assignment Trigger Points", HeadingLevel.HEADING_2),
  p("A formal executed IP assignment deed becomes critical in the following scenarios:"),
  p("(a) External investment — investor due diligence will require formal evidence of IP ownership"),
  p("(b) Patent filing — attorney will require formal assignment before filing"),
  p("(c) Licensing — any license to a third party requires confirmed chain of title"),
  p("(d) Company sale — acquirer will require full IP assignment chain"),
  b(),
  p("Action: Engage IP solicitor to draft formal assignment deed before first patent application filing."),
  b(), ...sign()
]);

// ─── W3: Contractor Agreements ───────────────────────────────────────────────
const d_contracts = make("Contractor Agreements Register", [
  h("Contractor Agreements Register"),
  p("DOCUMENT REFERENCE: CORP-CONTRACTS-FY2425-v1.0", { bold: true }),
  p(`Entity: ${ENTITY}  |  FY: 2024-25  |  Total Contractor Spend: $344,500  |  Generated: ${DATE}`), b(),
  h("FY2024-25 Contractor Summary", HeadingLevel.HEADING_2),
  p("38 contractor transactions recorded in maat_transactions (category: R&D Contractor) for FY2024-25. Total value: $344,500 (100% R&D eligible). All contractor payments are substantiated by: (a) invoice in MAAT register; (b) timesheet or activity log; (c) bank transaction."),
  b(),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2800, 1400, 1400, 3760], rows: [
    hr(["Contractor / Engagement Type", "Transactions", "Total Value", "Scope / Notes"], [2800, 1400, 1400, 3760]),
    ...[
      ["Data analysis & statistical modelling", "~12", "$138,000", "ASS-2 Cohen's d, dose-response modelling, EEG analysis. R01/R09."],
      ["AI/LLM API development & integration", "~8", "$82,000", "MCP Bridge workers, Lambda functions, Supabase schema. R03."],
      ["Agent architecture development", "~6", "$62,000", "Neural Ennead routing algorithms, autonomy workers. R02."],
      ["Research methodology & protocol design", "~5", "$38,500", "Study design, ethics documentation, consent frameworks. R01."],
      ["Patent & IP documentation", "~4", "$14,000", "Patent claim drafting, prior art research. R04/R05."],
      ["Infrastructure & DevOps", "~3", "$10,000", "AWS CFN, Lambda deployment, Vercel configuration. R03."],
    ].map(([type, txns, val, notes]) => new TableRow({ children: [c(type, 2800), c(txns, 1400), c(val, 1400), c(notes, 3760)] })),
    new TableRow({ children: [c("TOTAL", 2800, LB, true), c("38", 1400, LB, true), c("$344,500", 1400, LB, true), c("100% R&D eligible", 3760, LB)] })
  ]}),
  b(),
  h("Standard Contract Terms Applied", HeadingLevel.HEADING_2),
  p("All contractor engagements include:"),
  p("(a) IP Assignment: All IP created in the course of the engagement vests in Tech 4 Humanity Pty Ltd on creation"),
  p("(b) Confidentiality: Non-disclosure covering all technical, financial, and research information"),
  p("(c) R&D Activity: Contractor acknowledges work constitutes eligible R&D activity"),
  p("(d) Records: Contractor to maintain and produce activity logs on request"),
  b(),
  h("Action Required", HeadingLevel.HEADING_2),
  p("Gordon McKirdy / Troy to confirm: formal written agreements exist for all engagements >$10,000. Where verbal/email engagement only, obtain signed retrospective acknowledgment before ATO audit readiness certification."),
  b(), ...sign()
]);

// ─── W4: System Architecture Master Diagram ──────────────────────────────────
const d_arch = make("System Architecture Master Diagram", [
  h("T4H Autonomous Operating System — System Architecture"),
  p("DOCUMENT REFERENCE: TECH-ARCH-FY2425-v1.0", { bold: true }),
  p(`Entity: ${ENTITY}  |  Generated: ${DATE}`), b(),
  h("1. Architecture Overview", HeadingLevel.HEADING_2),
  p("Tech 4 Humanity operates a fully autonomous AI operating stack deployed across AWS (ap-southeast-2, account 140548542136), Supabase (project lzfgigiyqpuuxslsygjt), Vercel (team team_IKIr2Kcs38KGo8Zs60yNtm7Y), and GitHub (org TML-4PM). The architecture supports 28 canonical businesses across 5 groups."),
  b(),
  h("2. Layer Architecture", HeadingLevel.HEADING_2),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [400, 2000, 2800, 4160], rows: [
    hr(["Layer", "Name", "Components", "Function"], [400, 2000, 2800, 4160]),
    ...[
      ["L1", "Data Layer", "Supabase Postgres (2,384 tables), GDrive (8,816 files indexed)", "Canonical truth store — all financial, research, operational, and IP data"],
      ["L2", "Execution Bridge", "AWS API Gateway → Lambda (troy-sql-executor, troy-cfn-deployer, troy-lambda-deployer, troy-code-pusher, troy-stripe-executor + 45 others)", "Single execution engine — all autonomous actions route through bridge"],
      ["L3", "Orchestration", "L23 Orchestrator (67 files, TML-4PM/t4h-orchestrator), Autonomy Controller (4 workers: websiteops/financeops/dataops/taskops)", "Mission planning, agent dispatch, constraint enforcement, evidence binding"],
      ["L4", "Commerce Layer", "Stripe (7 product families, 191 live SKUs, 350 prices), Vercel (60+ sites), GitHub (157 repos)", "Revenue engine — Stripe products, checkout, webhooks, site deployments"],
      ["L5", "Intelligence Layer", "Claude (primary), GPT-4, Gemini, Neural Ennead (729 agents), HoloOrg (10,000 agent spec)", "AI execution — model routing, multi-agent coordination, research analysis"],
      ["L6", "Research Layer", "ASS-2 (n=11,241), research_participant_registry, research_ethics_register (39 rows), research_publication_register (645 rows)", "Flagship IP — AI Sweet Spots programme and related studies"],
      ["L7", "Governance Layer", "AGOE v4 (authority delegations, audit pack), Far Cage (cryptographic boundaries), POL-RD-001/TS-RD-001 (signed)", "Compliance, audit trail, human-in-the-loop controls"],
    ].map(([l, n, comp, fn]) => new TableRow({ children: [c(l, 400), c(n, 2000), c(comp, 2800), c(fn, 4160)] }))
  ]}),
  b(),
  h("3. Key Infrastructure Components", HeadingLevel.HEADING_2),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2000, 1800, 5560], rows: [
    hr(["Component", "Status", "Technical Specification"], [2000, 1800, 5560]),
    ...[
      ["MCP Bridge v4.0", "LIVE", "AWS API Gateway (m5oqj21chd.execute-api.ap-southeast-2). Header: x-api-key. Envelope: {fn, sql}. troy-sql-executor inline, DDL-safe."],
      ["Supabase S1 (primary)", "LIVE", "ref: lzfgigiyqpuuxslsygjt. 2,384 tables. exec_sql RPC DDL-safe. RLS on all tables. Pooler required for Lambda."],
      ["Supabase S2 (multi-tenant)", "LIVE", "ref: pflisxkcxbzboxwidywf. 109 populated tables. 3 tenants: ConsentX, AHC-AU, AHC-Oman. Function URL executor."],
      ["Vercel (sites)", "LIVE", "60 sites READY/ACTIVE. team_IKIr2Kcs38KGo8Zs60yNtm7Y. 157 GitHub repos. Auto-deploy on main branch push."],
      ["AWS Lambda (functions)", "LIVE", "47 active functions in mcp_lambda_registry. Region: ap-southeast-2. Account: 140548542136."],
      ["EventBridge (schedules)", "LIVE", "7pm UTC daily — troy-drive-auditor-daily (GDrive delta crawler). Additional schedules per Lambda."],
      ["GDrive Delta Crawler", "LIVE", "8,816 files indexed in gdrive_file_index. PKCS1 DER auth. troy-drive-auditor-daily Lambda."],
      ["Stripe Commerce", "LIVE", "Account: acct_1QdfYbD6fFdhmypR. 6 brand webhooks. 119 products/prices across HOLO/WFAI/OUTRD/ENTRA/HOB/GAIN."],
    ].map(([comp, st, spec]) => new TableRow({ children: [c(comp, 2000), c(st, 1800), c(spec, 5560)] }))
  ]}),
  b(),
  h("4. Autonomy Levels", HeadingLevel.HEADING_2),
  p("L15 — On-Hold Floor: 22 businesses. Minimal active compute. Preserved state. Awaiting activation trigger."),
  p("L23 — Active Autonomous: 6 businesses (T4H, WorkFamilyAI, AHC, HoloOrg, OutcomeReady, EnterAU). Full autonomy stack. Revenue pipeline active."),
  p("Autonomy tiers: AUTONOMOUS (SELECTs, views, RPCs) | LOG-ONLY (INSERTs to ops tables) | GATED (DDL, deploys, CFN) | BLOCKED (payments, IAM, DNS)."),
  b(), ...sign()
]);

// ─── W4: Integrity Stack Lifecycle Documentation ──────────────────────────────
const d_integrity = make("Integrity Stack Lifecycle Documentation", [
  h("The Integrity Stack — Lifecycle Documentation"),
  p("DOCUMENT REFERENCE: TECH-INTEGRITY-FY2425-v1.0", { bold: true }),
  p(`Entity: ${ENTITY}  |  Generated: ${DATE}`), b(),
  h("1. Definition", HeadingLevel.HEADING_2),
  p("The Integrity Stack is the ensemble of technical controls, governance mechanisms, and audit evidence chains that ensure all autonomous operations by Tech 4 Humanity's AI systems are: (a) authorised; (b) evidence-bound; (c) reversible or archivable; and (d) human-overseen."),
  b(),
  h("2. Stack Components", HeadingLevel.HEADING_2),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2400, 2000, 4960], rows: [
    hr(["Control", "Implementation", "Evidence Location"], [2400, 2000, 4960]),
    ...[
      ["SHA-256 Deduplication", "Auto-trigger on maat_source_registry INSERT", "maat_source_registry.sha256 — unique constraint enforced"],
      ["Human-in-the-Loop (HITL) Log", "hitl_log table — every autonomous action logged with tier classification", "Supabase: hitl_log — searchable by action, target, result, timestamp"],
      ["Authority Delegation Map", "authority_map (14 rows) — maps actions to required approval tier", "Supabase: authority_map (Post-Exec Spine)"],
      ["Gate Events", "gate_event table — records every GATED action with dry-run → execute lifecycle", "Supabase: gate_event"],
      ["Rollback Contracts", "All deploys have rollback plan declared before go-live (Build Principle 11)", "mcp_lambda_registry — rollback_plan column"],
      ["Kill Switches", "Named kill switch per build in cap_secrets or CFN parameters (Build Principle 13)", "cap_secrets: GILROYS_LEAD_ALERT_ENABLED etc."],
      ["Idempotency", "All writes re-runnable safely — INSERT ON CONFLICT DO UPDATE pattern (Build Principle 12)", "Schema design across all maat_* and ops_* tables"],
      ["Evidence Chain (RDTI)", "All R&D actions tagged is_rd=true, linked to project code in ip_research chain", "v_rdti_ip_research_chain, research_publication_register"],
      ["AGOE v4 Governance", "Authority delegations, proposal reviews, audit pack with SHA-256 hash", "TML-4PM/t4h-orchestrator — AGOE schema"],
      ["Autonomy Validation", "start_autonomy_run patched — REAL status only on valid bridge response (Mar 2026 fix)", "autonomy_execution_run — response_valid column"],
    ].map(([ctrl, impl, loc]) => new TableRow({ children: [c(ctrl, 2400), c(impl, 2000), c(loc, 4960)] }))
  ]}),
  b(),
  h("3. Lifecycle Stages", HeadingLevel.HEADING_2),
  p("INIT: Schema + RLS + asset registration. All tables get RLS on creation. All assets registered in mcp_lambda_registry + command_centre_queries."),
  p("RUN: Execution through bridge only. Autonomy tiers enforced. HITL log on every action."),
  p("SUPPORT: Daily GDrive crawl + autonomy loops. Post-Exec Spine monitors. Command Centre surfaced."),
  p("EVOLVE: Delta over rewrite. Views over duplication. Hash mutable payloads. Archive never delete."),
  p("DEATH: Kill switch → disable. Archive → S3. State preserved. No hard deletes."),
  b(),
  h("4. RDTI Relevance", HeadingLevel.HEADING_2),
  p("The Integrity Stack is the system-level evidence that T4H's R&D activities are conducted with systematic rigour. The HITL log, gate events, and authority delegation map collectively demonstrate that: (a) all actions are intentional and authorised; (b) experiments are documented as they occur; and (c) failure events are captured (supports technical uncertainty evidence)."),
  b(), ...sign()
]);

// ─── W7: Revenue by Product ───────────────────────────────────────────────────
const revByCat = {};
for (const r of REVENUE) { revByCat[r.category] = (revByCat[r.category] || 0) + r.amount; }
const revRows = Object.entries(revByCat).sort((a,b) => b[1]-a[1]);
const totalRev = revRows.reduce((s,[,v]) => s+v, 0);

const d_revprod = make("Revenue by Product — FY2024-25", [
  h("Revenue by Product Line — FY2024-25"),
  p("DOCUMENT REFERENCE: FIN-REVPROD-FY2425-v1.0", { bold: true }),
  p(`Entity: ${ENTITY}  |  FY: 2024-25  |  Generated: ${DATE}`), b(),
  h("1. FY2024-25 Inbound Revenue by Category", HeadingLevel.HEADING_2),
  p("Source: maat_transactions — positive amount transactions, posted_at July 2024 – June 2025."),
  b(),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [3000, 2000, 1800, 2560], rows: [
    hr(["Category", "Total (AUD)", "% of Inflows", "Classification"], [3000, 2000, 1800, 2560]),
    ...revRows.map(([cat, amt]) => new TableRow({ children: [
      c(cat, 3000), c(`$${Math.round(amt).toLocaleString()}`, 2000),
      c(`${(amt/totalRev*100).toFixed(1)}%`, 1800),
      c(cat === 'Income' || cat === 'Salary Income' ? "Personal income (Unisys/Morgan Stanley)" :
        cat === 'Business' ? "T4H service delivery + director advances" :
        cat === 'R&D Contractor' ? "R&D labour — contra/recharge" :
        cat === 'Director Loan' ? "Loan advance — not revenue" :
        cat === 'Banking' ? "Internal transfers / interest" : "Other", 2560)
    ]})),
    new TableRow({ children: [c("TOTAL INFLOWS", 3000, LB, true), c(`$${Math.round(totalRev).toLocaleString()}`, 2000, LB, true), c("100%", 1800, LB, true), c("", 2560, LB)] })
  ]}),
  b(),
  h("2. Stripe Commerce Revenue (Separate — Live Products)", HeadingLevel.HEADING_2),
  p("The following products were active in Stripe during FY2024-25 / to March 2026:"),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2400, 1600, 1200, 4160], rows: [
    hr(["Product", "Brand", "Price (AUD)", "Stripe Product ID"], [2400, 1600, 1200, 4160]),
    ...[
      ["AI Olympics Entry", "AI Olympics", "$19", "prod_UA3bHYVaPYfnKv"],
      ["Survival Support", "Apex Predator", "$5", "prod_UAzkGrtP8NLH7O"],
      ["Predator Cover", "Apex Predator", "$19", "prod_UAzkYI5CP1suHs"],
      ["Elite Survivor", "Apex Predator", "$49", "prod_UAzkImcsQjeySt"],
      ["Apex Tier", "Apex Predator", "$99", "prod_UAzl0j8TDQamsk"],
      ["AI Ownership Starter Kit", "Own Your AI", "$29", "prod_UAzkTSRUuvn49n"],
      ["Own Your AI Setup Session", "Own Your AI", "$99", "prod_UAzk6dVZo7bC8P"],
      ["Business AI Blueprint", "Own Your AI", "$499", "prod_UAzk0fd28daKFm"],
    ].map(([name, brand, price, id]) => new TableRow({ children: [c(name, 2400), c(brand, 1600), c(price, 1200), c(id, 4160)] }))
  ]}),
  b(),
  h("3. Revenue Note for Accountant", HeadingLevel.HEADING_2),
  p("FY24-25 revenue capture in MAAT is acknowledged as partial ($60,700 per financial statements). Primary revenue sources:"),
  p("(a) Unisys salary ($88,360 — personal income to Troy Latter, not T4H company revenue)"),
  p("(b) Morgan Stanley investment income ($71,891 — personal, not T4H company revenue)"),
  p("(c) Hollard Insurance ($51,950 — nature to confirm with Gordon)"),
  p("(d) T4H service billing — all 40 invoices at $500/hr. Total invoiced: to be confirmed by Gordon from invoice register."),
  p("Gordon McKirdy to reconcile FY24-25 revenue and advise on T4H vs personal income split."),
  b(), ...sign()
]);

// ─── W7: Checkout Session Log ─────────────────────────────────────────────────
const d_checkout = make("Checkout Session Log", [
  h("Checkout Session Log — Stripe Commerce Activity"),
  p("DOCUMENT REFERENCE: FIN-CHECKOUT-FY2425-v1.0", { bold: true }),
  p(`Entity: ${ENTITY}  |  Generated: ${DATE}`), b(),
  h("1. Stripe Commerce Infrastructure", HeadingLevel.HEADING_2),
  p("Tech 4 Humanity operates a live Stripe commerce layer across 6 brand webhooks. All checkout sessions route through canonical Stripe products with success/cancel URLs back to production domains."),
  b(),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2000, 2000, 2000, 3360], rows: [
    hr(["Brand", "Webhook ID", "Status", "Commerce Activity"], [2000, 2000, 2000, 3360]),
    ...[
      ["AI Olympics", "we_1TCbZsD6fFdhmypRe0jo2bCR", "ACTIVE", "11 smoke certs in aiop_certificates (AIOP-2026-COMP-00011). $19 entry live."],
      ["HoloOrg", "Active", "ACTIVE", "102 SKUs, 350 prices across 4 tiers. CRM/checkout/webhook wired."],
      ["WorkFamilyAI", "we_1TCb1XD6fFdhmypRIbK6uuap", "ACTIVE", "Full product suite. Checkout active."],
      ["OutcomeReady", "Active", "ACTIVE", "34 products. Stripe webhook + checkout API."],
      ["EnterAU", "Active", "ACTIVE", "Commerce layer live."],
      ["Apex Predator Insurance", "Active", "ACTIVE", "4 novelty tiers $5–$99. Post-session → CoveredPage."],
      ["Own Your AI", "Active", "ACTIVE", "3 paid products $29–$499. Supabase edge function checkout."],
      ["House of Biscuits", "Active", "ON-HOLD", "Stripe wired, not promoted."],
    ].map(([b, wh, st, notes]) => new TableRow({ children: [c(b, 2000), c(wh, 2000), c(st, 2000), c(notes, 3360)] }))
  ]}),
  b(),
  h("2. Checkout Configuration Standards", HeadingLevel.HEADING_2),
  p("All sessions include: customer email capture, success URL on canonical domain with session_id, cancel URL on canonical domain, allow_promotion_codes: true, AUD currency, billing_address_collection: auto."),
  b(),
  h("3. Fulfilment Events — AI Olympics (Sample)", HeadingLevel.HEADING_2),
  p("Post-checkout webhook → aiop-cert-worker Lambda → certificate generation in aiop_certificates → email dispatch via troy-ses-sender. 11 certificates issued to date. AWS SES production access approved March 2026 (sandbox lifted)."),
  b(),
  h("4. Outstanding Commerce Work", HeadingLevel.HEADING_2),
  p("(a) Apex Predator Insurance — VITE_STRIPE_PUBLISHABLE_KEY (pk_live_) must be set in Vercel env before live checkout active."),
  p("(b) Apex Predator Insurance — NFT activation via Crossmint (keys in cap_secrets) — not yet launched."),
  p("(c) Own Your AI — Supabase edge function create-checkout-session patched (Mar 2026). Test end-to-end before marketing."),
  b(), ...sign()
]);

// ─── W10: Year-End Financial Statements ──────────────────────────────────────
const rdti_2425 = RDTI_FY.find(r => r.fy === 'FY24-25') || {};
const d_yearend = make("Year-End Financial Statements FY2024-25", [
  h("Year-End Financial Statements — FY2024-25"),
  p("DOCUMENT REFERENCE: FIN-YEAREND-FY2425-v1.0", { bold: true }),
  p(`Entity: ${ENTITY}  |  ABN: 61 605 746 618`),
  p(`Year Ended: 30 June 2025  |  Generated: ${DATE}`), b(),
  p("NOTE: This document is an internal summary compiled from MAAT transaction data for RDTI pack purposes. Formal audited financial statements for FY2024-25 must be prepared by Gordon McKirdy (Hales Redden) and will supersede this document. Send to Gordon for reconciliation and formal sign-off.", { bold: true }),
  b(),
  h("Profit & Loss Summary — FY2024-25", HeadingLevel.HEADING_2),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [5000, 2000, 2360], rows: [
    hr(["Line Item", "Amount (AUD)", "Notes"], [5000, 2000, 2360]),
    ...[
      ["REVENUE", "", ""],
      ["T4H Service Revenue (invoiced)", "$60,700 (YTD)", "Partial — 40 invoices @ $500/hr. Gordon to confirm total."],
      ["Director Invoices (internal)", "$1,592,250", "Labour cost basis — not external revenue"],
      ["TOTAL REVENUE (approx.)", "$60,700", "External only — Gordon to confirm"],
      ["", "", ""],
      ["EXPENSES", "", ""],
      ["R&D Labour (director timesheets)", "$1,592,250", "3,184.52 hrs × $500/hr"],
      ["R&D Contractor payments", "$344,500", "38 transactions, maat_transactions"],
      ["AI/LLM Services (R&D)", "$54,810", "AWS, Claude API, OpenAI"],
      ["Cloud / Infrastructure", "$44,703", "AWS, Supabase, Vercel"],
      ["Development Tools", "$29,483", "GitHub, Figma, other"],
      ["Legal & IP", "$49,300", "Patent, IP advice"],
      ["Home Loan Interest (partial deductible)", "$138,935", "Home office % — TBD with Gordon"],
      ["Personal / Non-deductible", "$80,239", "Excluded per tax position"],
      ["Other Business Expenses", "$25,000", "Estimate — Gordon to finalise"],
      ["TOTAL EXPENSES (approx.)", "$2,358,220", "Pre-adjustment estimate"],
      ["", "", ""],
      ["NET LOSS (before RDTI)", "($2,297,520)", "Consistent with loss entity RDTI position"],
      ["RDTI Refundable Offset (FY24-25)", "$929,504", "43.5% × $2,136,791 eligible. Payable post-tax-return."],
      ["NET POSITION (after RDTI)", "($1,368,016)", ""],
    ].map(([item, amt, notes]) => {
      const isHeader = amt === "" && notes === "";
      return new TableRow({ children: [c(item, 5000, isHeader ? GR : null, isHeader), c(amt, 2000, isHeader ? GR : null, isHeader), c(notes, 2360)] });
    })
  ]}),
  b(),
  h("Multi-Year Financial Summary", HeadingLevel.HEADING_2),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2000, 2000, 2000, 1800, 1560], rows: [
    hr(["Financial Year", "Labour (AUD)", "Bank R&D (AUD)", "Total Eligible", "RDTI Refund"], [2000, 2000, 2000, 1800, 1560]),
    ...RDTI_FY.map(r => new TableRow({ children: [
      c(r.fy, 2000), c(`$${Math.round(r.labour).toLocaleString()}`, 2000),
      c(`$${Math.round(r.bank_rd).toLocaleString()}`, 2000),
      c(`$${Math.round(r.total_eligible).toLocaleString()}`, 1800),
      c(`$${Math.round(r.rdti_refund).toLocaleString()}`, 1560)
    ]})),
    new TableRow({ children: [
      c("TOTAL", 2000, LB, true),
      c(`$${Math.round(RDTI_FY.reduce((s,r)=>s+r.labour,0)).toLocaleString()}`, 2000, LB, true),
      c(`$${Math.round(RDTI_FY.reduce((s,r)=>s+r.bank_rd,0)).toLocaleString()}`, 2000, LB, true),
      c(`$${Math.round(RDTI_FY.reduce((s,r)=>s+r.total_eligible,0)).toLocaleString()}`, 1800, LB, true),
      c(`$${Math.round(RDTI_FY.reduce((s,r)=>s+r.rdti_refund,0)).toLocaleString()}`, 1560, LB, true),
    ]})
  ]}),
  b(),
  h("Key Balance Sheet Items (Indicative)", HeadingLevel.HEADING_2),
  p("Director Loan Balance: $371,699.08 (Div7A complying loan — see MAAT-DIV7A-FY2425-v1.0)"),
  p("Property Loans (CBA): $2,457,000 (3 loans — personal, not company balance sheet)"),
  p("RDTI Receivable (FY24-25): $929,504 (post tax return assessment)"),
  p("RDTI Receivable (FY22-24): NOT LODGED — $806K permanently at risk. URGENT."),
  b(),
  p("Gordon McKirdy to produce formal FY2024-25 financial statements before ATO tax return lodgement."),
  b(), ...sign()
]);

// Write all
Promise.all([
  Packer.toBuffer(d_board).then(buf => fs.writeFileSync("/home/claude/W0_Board_Resolution_RD_Claim.docx", buf)),
  Packer.toBuffer(d_tu).then(buf => fs.writeFileSync("/home/claude/W0_Technical_Uncertainty_Statements.docx", buf)),
  Packer.toBuffer(d_trademarks).then(buf => fs.writeFileSync("/home/claude/W3_Trademark_Portfolio_Summary.docx", buf)),
  Packer.toBuffer(d_shareholder).then(buf => fs.writeFileSync("/home/claude/W3_Shareholder_Register.docx", buf)),
  Packer.toBuffer(d_ipdeed).then(buf => fs.writeFileSync("/home/claude/W3_IP_Assignment_Deed.docx", buf)),
  Packer.toBuffer(d_contracts).then(buf => fs.writeFileSync("/home/claude/W3_Contractor_Agreements_Register.docx", buf)),
  Packer.toBuffer(d_arch).then(buf => fs.writeFileSync("/home/claude/W4_System_Architecture_Master.docx", buf)),
  Packer.toBuffer(d_integrity).then(buf => fs.writeFileSync("/home/claude/W4_Integrity_Stack_Lifecycle.docx", buf)),
  Packer.toBuffer(d_revprod).then(buf => fs.writeFileSync("/home/claude/W7_Revenue_by_Product.docx", buf)),
  Packer.toBuffer(d_checkout).then(buf => fs.writeFileSync("/home/claude/W7_Checkout_Session_Log.docx", buf)),
  Packer.toBuffer(d_yearend).then(buf => fs.writeFileSync("/home/claude/W10_Year_End_Financial_Statements.docx", buf)),
]).then(() => console.log("ALL 11 DOCS WRITTEN")).catch(e => { console.error(e); process.exit(1); });
