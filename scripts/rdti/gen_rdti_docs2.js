const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
        Header, Footer, PageNumber, LevelFormat } = require('docx');
const fs = require('fs');

const ENTITY = "Tech 4 Humanity Pty Ltd (ABN 61 605 746 618)";
const DIRECTOR = "Troy Latter";
const GENERATED = "20 March 2026";
const BLUE = "1F497D"; const LIGHT_BLUE = "DCE6F1"; const GREY = "F2F2F2";
const W = 9360;

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function hdr(t, lv = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: lv, children: [new TextRun({ text: t, font: "Arial", bold: true, color: lv === HeadingLevel.HEADING_1 ? BLUE : "000000", size: lv === HeadingLevel.HEADING_1 ? 28 : 22 })] });
}
function para(t, opts = {}) { return new Paragraph({ children: [new TextRun({ text: t || "", font: "Arial", size: 20, ...opts })] }); }
function blank() { return new Paragraph({ children: [new TextRun("")] }); }
function cell(t, w, shade, bold) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: String(t ?? ""), font: "Arial", size: 18, bold: !!bold })] })]
  });
}
function hrow(cols, ws) { return new TableRow({ children: cols.map((c, i) => cell(c, ws[i], LIGHT_BLUE, true)) }); }
function pageHdr(title) {
  return new Header({ children: [new Paragraph({ children: [new TextRun({ text: `${ENTITY}  |  ${title}`, font: "Arial", size: 18, color: "666666" })] })] });
}
function pageFtr() {
  return new Footer({ children: [new Paragraph({ children: [
    new TextRun({ text: `Generated: ${GENERATED}  |  RDTI Substantiation Pack — CONFIDENTIAL  |  Page `, font: "Arial", size: 16, color: "888888" }),
    new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "888888" })
  ]})] });
}
function style() {
  return {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
    ]
  };
}
function section(title, opts = {}) {
  return { properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    headers: { default: pageHdr(title) }, footers: { default: pageFtr() }, ...opts };
}
function signBlock() {
  return [blank(),
    para("Signed as a true and accurate document:"),
    blank(),
    para("Signature: ___________________________"),
    para(`Name: ${DIRECTOR}  |  Director, ${ENTITY}`),
    para("Date: ___________________________")
  ];
}

// ──────────────────────────────────────────────────────────────────────────────
// PROJECTS DATA
// ──────────────────────────────────────────────────────────────────────────────
const PROJECTS = [
  { code:"R01", name:"AI Sweet Spots Model", cost:272144, hrs:2299.88, ato:"High", aus:"Core",
    uncertainty:"Whether cognitive architecture determines optimal AI assistance intensity — unknown prior to study",
    knowledge:"ADHD +44% productivity at 48% AI (d=1.77). NT +9% at 25% AI. Quadratic dose-response confirmed. Chatter Index metric created. First standardised assessment for neurodivergent AI interaction patterns (n=11,241).",
    routine:"No standard methodology existed. Outcome unpredictable — demonstrated by 9 distinct cognitive profile clusters with non-linear response curves.",
    experiment:"21-site longitudinal study, 6 continents, 24-month follow-up, EEG subsample (n=990). Iterative calibration across 32 gamified challenge modules.",
    hypothesis:"ADHD workers with moderate AI scaffolding achieve greater productivity gains than neurotypical workers.",
    domain:"AI Productivity + Neuro-aligned Performance Research", artefact:"GitHub: TML-4PM/ai-sweet-spots, 631 LinkedIn articles, research_publication_register" },
  { code:"R02", name:"Neural Ennead 729-Agent Architecture", cost:204108, hrs:144.25, ato:"High", aus:"Core",
    uncertainty:"Whether 729 autonomous agents can be coordinated in a 9x9x9 hierarchy without exponential latency degradation",
    knowledge:"Architecture operational at 729-agent scale. Named-agent framework with persistent personality traits. Routing sub-500ms at 81-agent tier. Failure mode at >27 concurrent agents resolved via tier-level constraint caching (novel finding).",
    routine:"No prior framework for hierarchical multi-agent coordination at this scale. Technical failure at 81-agent tier (Mar 2025) confirms uncertainty was genuine.",
    experiment:"Iterative architecture builds at 9/81/729 scales. A/B routing algorithm testing. Latency profiling. Personality persistence validation.",
    hypothesis:"9x9x9 agent architecture maintains coherence and sub-second routing across 729 agents without exponential latency degradation.",
    domain:"Multi-Agent Orchestration Architecture", artefact:"GitHub: TML-4PM/t4h-orchestrator (67 files), Supabase: autonomy_execution_run" },
  { code:"R03", name:"MCP Bridge Ecosystem", cost:272144, hrs:165.5, ato:"High", aus:"Core",
    uncertainty:"Whether a single API gateway can orchestrate cross-LLM tool execution with consistent auth and error handling across Claude/GPT/Gemini",
    knowledge:"Bridge operational. 189 Lambda functions. Cross-LLM orchestration confirmed. Novel auth pattern: x-api-key header standardisation. troy-sql-executor inline execution (zero extra hop). Bridge v4.0 with DDL-safe exec_sql.",
    routine:"No public implementation of cross-LLM tool-routing at this scale existed. Auth failure events (Mar 2026) confirm ongoing technical uncertainty.",
    experiment:"Cross-provider orchestration patterns tested. Latency/reliability/integrity testing across providers. Lambda-based bridge with SQL executor backend. 194+ automated operations monitored.",
    hypothesis:"Cross-LLM orchestration bridge maintains state consistency and tool routing across heterogeneous AI providers without vendor lock-in or data leakage.",
    domain:"Cross-LLM Orchestration & MCP Governance Infrastructure", artefact:"AWS: 189 Lambda ARNs, bridge endpoint m5oqj21chd.execute-api.ap-southeast-2" },
  { code:"R04", name:"Biometric Insurance System", cost:204108, hrs:57.5, ato:"High", aus:"Core",
    uncertainty:"Whether multi-modal biometric fusion from consumer wearables can predict driving risk 15-60 minutes ahead with insurance-grade accuracy",
    knowledge:"Complete technical specification. 4 patent applications (82 claims total). Predictive risk trajectory model designed. Actuarial validation methodology established.",
    routine:"No consumer-wearable biometric fusion model existed for predictive insurance risk. Patent applications confirm novelty.",
    experiment:"Synthetic biometric stream modelling. Multi-modal sensor fusion algorithm development. Predictive risk modelling at 15/30/60-minute horizons.",
    hypothesis:"Multi-modal biometric fusion from consumer wearables predicts driving risk 15-60 minutes ahead with sufficient accuracy for dynamic insurance pricing.",
    domain:"Biometric Risk Modelling & Insurance Mechanism Design", artefact:"ip_prosecution_timeline: Patent Family B, ip_assets: 82 patent claims" },
  { code:"R05", name:"Signal Economy Framework", cost:136072, hrs:80.0, ato:"High", aus:"Core",
    uncertainty:"Whether BCI signal processing can be standardised across heterogeneous consumer hardware vendors for AI authentication purposes",
    knowledge:"BCI Standards Framework active. 2,847 supplier database compiled. 89 patent claims identified. Signal Economy framework designed. BRS (Bioreadiness Score) methodology developed.",
    routine:"No open standard for cross-vendor BCI signal normalisation existed. 2,847-supplier database required original compilation.",
    experiment:"BCI signal acquisition from EEG and fNIRS hardware. Signal processing pipeline development. Consent verification protocol design. Standards alignment with SA BCI committee.",
    hypothesis:"Brain-computer interface signals can be authenticated and routed to AI agents while preserving fidelity across heterogeneous BCI hardware.",
    domain:"BCI Signal Processing + Consent Sovereignty", artefact:"ip_assets: Signal Economy class, sa_bci_committee correspondence" },
  { code:"R06", name:"HoloOrg 10,000-Agent Platform", cost:108857, hrs:25.0, ato:"High", aus:"Core",
    uncertainty:"Whether enterprise-scale 10,000-agent orchestration maintains coherence across organisational hierarchies without exponential coordination overhead",
    knowledge:"Architecture specification complete. Supabase integration operational. 102 SKUs, 350 prices across 4 tiers. CRM/checkout/webhook wired.",
    routine:"No enterprise-grade 10K-agent platform existed. Coherence metrics required original development.",
    experiment:"Progressive scaling from 729 to 10,000 agents. Org structure mapping algorithms. Coherence metrics development. Enterprise pilot framework.",
    hypothesis:"Enterprise-scale 10,000-agent platform maintains organisational coherence while simulating human org structures without exponential coordination overhead.",
    domain:"Enterprise Agent Orchestration", artefact:"Supabase: holo_org_* tables, Stripe: prod_U9tK* product series" },
  { code:"R07", name:"ConsentX Lifecycle Management", cost:54429, hrs:25.0, ato:"High", aus:"Supporting",
    uncertainty:"Whether consent lifecycle management can be automated across multiple jurisdictions while preserving individual data sovereignty",
    knowledge:"Consent Registry deployed (5,200 records). Lifecycle event tracking operational. 47 regulatory requirements automated.",
    routine:"No multi-jurisdiction consent automation framework existed combining GDPR/APPs/emerging AI acts.",
    experiment:"Multi-jurisdictional regulatory analysis. Consent state machine design. Automated compliance checking against 47 requirements.",
    hypothesis:"Consent lifecycle management automated across multiple jurisdictions while preserving data sovereignty and meeting GDPR/APPs/AI regulations simultaneously.",
    domain:"Consent + Multi-Jurisdiction Regulatory Compliance", artefact:"Supabase: consent_registry, GitHub: TML-4PM/consentx" },
  { code:"R08", name:"WorkFamilyAI Governance Architecture", cost:40822, hrs:20.0, ato:"High", aus:"Supporting",
    uncertainty:"Whether a comprehensive AI governance framework can be operationalised as machine-executable compliance rules across diverse organisational contexts",
    knowledge:"GC-BAT published: 665,000 words, 32 vignettes, deployed at gcbat.org. Machine-executable rule engine prototype operational.",
    routine:"No framework for converting natural language governance policy into machine-executable compliance rules at this scale existed.",
    experiment:"Natural language policy parsing of 665K words. Compliance validation engine development. Human-in-the-loop override mechanism. ISO/IEC cross-referencing.",
    hypothesis:"Governance framework codified in 665K words of policy operationalised as machine-executable compliance rules while preserving human oversight.",
    domain:"AI Governance + Workforce Augmentation", artefact:"gcbat.org, GitHub: TML-4PM/gcbat-vignettes-main, 665K policy corpus" },
  { code:"R09", name:"Assessment Tool Development (GAIN)", cost:40822, hrs:80.0, ato:"High", aus:"Supporting",
    uncertainty:"Whether a scalable self-service assessment tool can reliably determine individual AI sweet spots across diverse cognitive profiles",
    knowledge:"First standardised AI-readiness assessment calibrated to cognitive profile. Chatter Index metric for human-AI collaboration quality. 9 cognitive profiling dimensions validated.",
    routine:"No standardised assessment existed for AI integration intensity by cognitive profile.",
    experiment:"GAIN platform development with 9 profiling dimensions. Iterative calibration against ASS-2 validation data (n=11,241).",
    hypothesis:"Standardised AI-readiness assessment predicts optimal AI integration level for individual cognitive profiles within 3 sessions.",
    domain:"AI Readiness Assessment Tooling", artefact:"GitHub: TML-4PM/discover-aiss, research_participant_registry" },
  { code:"R10", name:"NEUROPAK BCI Framework", cost:27214, hrs:60.0, ato:"High", aus:"Supporting",
    uncertainty:"Whether BCI signal processing can be standardised across consumer-grade hardware while maintaining authentication-grade signal integrity",
    knowledge:"BCI Standards Framework. 2,847 supplier database. 89 patent claims. Signal Economy framework. BRS scoring methodology.",
    routine:"No consumer BCI authentication standard existed.",
    experiment:"BCI signal acquisition pipeline for heterogeneous hardware. Signal processing standardisation across vendors.",
    hypothesis:"Brain-computer interface signal processing standardised across heterogeneous consumer-grade hardware vendors.",
    domain:"BCI Intent Gateway + NEUROPAK", artefact:"ip_assets: NEUROPAK class, patent_applications: BCI claims" },
  { code:"R11", name:"Far Cage Trust & Governance Framework", cost:45000, hrs:50.0, ato:"High", aus:"Core",
    uncertainty:"Whether cage-based containment semantics can be encoded as enforceable agent constraints without breaking agent utility",
    knowledge:"Novel finding: constraint caching at tier level (not per-agent) prevents exponential latency without sacrificing utility. Published: Far Cage Technical Note FN-001. Governance constraints encodable as verifiable pre-conditions.",
    routine:"No standard existed for cryptographic boundary enforcement in multi-agent systems. 3 of 5 initial test scenarios failed — confirms genuine uncertainty.",
    experiment:"Prototype Far Cage boundary enforcement with MCP Bridge agents. A/B testing of per-agent vs tier-level constraint encoding.",
    hypothesis:"Cryptographic boundary constraints can reduce AI agent boundary violations by >80% without utility degradation.",
    domain:"AI Safety + Boundary Enforcement", artefact:"GitHub: Far Cage Technical Note FN-001, bridge boundary constraints implementation" },
  { code:"R12", name:"RATPAK Robotic Automation & Drone Systems", cost:38000, hrs:40.0, ato:"High", aus:"Supporting",
    uncertainty:"Whether LLM-directed motor control can achieve reliable task completion rates in unstructured physical environments",
    knowledge:"Novel finding: LLM task decomposition requires an intermediate spatial reasoning layer. Geometric constraint validator between LLM output and motor command generation reduces spatial reasoning errors by 78%. Filed: RATPAK Technical Report TR-003.",
    routine:"No open framework existed for AI-directed robotic task pack deployment in variable terrain. Novel spatial reasoning layer approach not documented in existing literature.",
    experiment:"Prototype RATPAK command interface on standard robotics SDK. Task decomposition testing across variable terrain scenarios.",
    hypothesis:"LLM task decomposition can direct robotic pack operations with <5% error rate.",
    domain:"Autonomous Robotics + Drone Systems", artefact:"RATPAK Technical Report TR-003, GitHub: TML-4PM/ratpak" },
  { code:"R13", name:"Infrastructure Moat & Artefact Pack Schema", cost:22000, hrs:37.5, ato:"High", aus:"Supporting",
    uncertainty:"Whether artefact pack schemas can satisfy both technical reproducibility standards and legal IP documentation requirements simultaneously",
    knowledge:"Novel finding: existing standards (RO-Crate, FAIR, DataCite) lack IP substantiation fields. Tri-layer schema: technical reproducibility + legal provenance + regulatory compliance. Published: Schema Design Note SDN-002.",
    routine:"No schema existed combining reproducibility, chain-of-custody, and ATO/AusIndustry regulatory compliance fields.",
    experiment:"Multi-standards analysis. Tri-layer schema design. Compliance validation against ATO/AusIndustry field requirements.",
    hypothesis:"Artefact pack schema satisfies both technical reproducibility standards and legal IP documentation requirements simultaneously.",
    domain:"AI Infrastructure + IP Packaging", artefact:"Schema Design Note SDN-002, Supabase: research_asset_register (44-column v2 schema)" },
];

const totalCost = PROJECTS.reduce((s,p)=>s+p.cost,0);
const totalHrs  = PROJECTS.reduce((s,p)=>s+p.hrs,0);

// ──────────────────────────────────────────────────────────────────────────────
// DOC 1: INTERNAL R&D CLAIM JUSTIFICATION MEMO
// ──────────────────────────────────────────────────────────────────────────────
const doc1 = new Document({
  styles: style(),
  sections: [{
    ...section("Internal R&D Claim Justification Memo"),
    children: [
      hdr("Internal R&D Claim Justification Memo"),
      para(`DOCUMENT REFERENCE: RDTI-MEMO-FY2425-v1.0`, { bold: true }),
      para(`Entity: ${ENTITY}`),
      para(`Director: ${DIRECTOR}  |  ABN: 61 605 746 618`),
      para(`Financial Year: FY2024-25 (1 July 2024 — 30 June 2025)`),
      para(`Prepared for: AusIndustry R&D Tax Incentive registration — 30 April 2026 deadline`),
      para(`Generated: ${GENERATED}`),
      blank(),
      hdr("1. Purpose", HeadingLevel.HEADING_2),
      para("This memo records the internal classification decision for R&D activities conducted by Tech 4 Humanity Pty Ltd in FY2024-25. It confirms that the 13 registered projects satisfy the eligible R&D activity criteria under section 355-25 of the Income Tax Assessment Act 1997 (ITAA 1997) as interpreted by ATO Taxation Ruling TR 2021/1."),
      blank(),
      hdr("2. Eligibility Framework Applied", HeadingLevel.HEADING_2),
      para("Each project was assessed against the four TR 2021/1 criteria:"),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [400, 2200, 6760],
        rows: [
          hrow(["#", "Criterion", "Description"], [400, 2200, 6760]),
          ...[
            ["(a)", "Technical Uncertainty", "The outcome could not be determined in advance using available knowledge, even by a competent professional in the field."],
            ["(b)", "Systematic Progression", "Activities followed a logical progression of work that could reasonably be expected to produce new knowledge or information."],
            ["(c)", "Purpose: New Knowledge", "The dominant purpose of the activity was to generate new knowledge or information, not simply apply existing knowledge."],
            ["(d)", "Not Routine", "The activities were not the adaptation, modification or minor variation of existing products, processes or knowledge."],
          ].map(([n,c,d]) => new TableRow({ children: [cell(n,400), cell(c,2200), cell(d,6760)] }))
        ]
      }),
      blank(),
      hdr("3. Project Justifications", HeadingLevel.HEADING_2),
      blank(),
      ...PROJECTS.flatMap(p => [
        hdr(`${p.code}: ${p.name}`, HeadingLevel.HEADING_2),
        new Table({
          width: { size: W, type: WidthType.DXA }, columnWidths: [2200, 7160],
          rows: [
            hrow(["Attribute", "Detail"], [2200, 7160]),
            new TableRow({ children: [cell("R&D Cost (FY24-25)", 2200, GREY, true), cell(`AUD $${p.cost.toLocaleString()}`, 7160)] }),
            new TableRow({ children: [cell("Hours Logged", 2200, GREY, true), cell(`${p.hrs.toLocaleString()} hours`, 7160)] }),
            new TableRow({ children: [cell("Domain", 2200, GREY, true), cell(p.domain, 7160)] }),
            new TableRow({ children: [cell("Hypothesis", 2200, GREY, true), cell(p.hypothesis, 7160)] }),
            new TableRow({ children: [cell("Technical Uncertainty", 2200, GREY, true), cell(p.uncertainty, 7160)] }),
            new TableRow({ children: [cell("Experiment", 2200, GREY, true), cell(p.experiment, 7160)] }),
            new TableRow({ children: [cell("Why Not Routine", 2200, GREY, true), cell(p.routine, 7160)] }),
            new TableRow({ children: [cell("New Knowledge Generated", 2200, GREY, true), cell(p.knowledge, 7160)] }),
            new TableRow({ children: [cell("Evidence Artefacts", 2200, GREY, true), cell(p.artefact, 7160)] }),
            new TableRow({ children: [cell("ATO Defensibility", 2200, GREY, true), cell(p.ato, 7160)] }),
            new TableRow({ children: [cell("AusIndustry Strength", 2200, GREY, true), cell(p.aus, 7160)] }),
          ]
        }),
        blank(),
      ]),
      hdr("4. Summary", HeadingLevel.HEADING_2),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [500, 3200, 1500, 1200, 1500, 2460],
        rows: [
          hrow(["Code", "Project Name", "Cost (AUD)", "Hours", "ATO", "AusIndustry"], [500, 3200, 1500, 1200, 1500, 2460]),
          ...PROJECTS.map(p => new TableRow({ children: [
            cell(p.code,500), cell(p.name,3200), cell(`$${p.cost.toLocaleString()}`,1500),
            cell(p.hrs.toLocaleString(),1200), cell(p.ato,1500), cell(p.aus,2460)
          ]})),
          new TableRow({ children: [
            cell("",500,LIGHT_BLUE), cell("TOTAL — 13 Projects",3200,LIGHT_BLUE,true),
            cell(`$${totalCost.toLocaleString()}`,1500,LIGHT_BLUE,true),
            cell(totalHrs.toFixed(1),1200,LIGHT_BLUE,true), cell("",1500,LIGHT_BLUE), cell("",2460,LIGHT_BLUE)
          ]})
        ]
      }),
      blank(),
      hdr("5. Director Classification Decision", HeadingLevel.HEADING_2),
      blank(),
      para("I, Troy Latter, as sole director of Tech 4 Humanity Pty Ltd, have reviewed each project above and confirm:"),
      blank(),
      para("(a) Each project satisfies the eligibility criteria for core R&D activities under section 355-25 ITAA 1997."),
      para("(b) The technical uncertainty in each project was genuine — the outcome was not determinable from existing knowledge at commencement."),
      para("(c) The R&D activities involved systematic investigation and experimentation, not routine adaptation."),
      para("(d) Each project generated or sought to generate new knowledge or information."),
      para("(e) The costs attributed to each project have been recorded in the MAAT financial system and are supported by timesheet and transaction evidence."),
      para("(f) I understand that making a false or misleading statement in connection with an R&D tax offset claim may attract significant penalties under sections 8K and 8N of the Taxation Administration Act 1953."),
      blank(),
      ...signBlock(),
    ]
  }]
});

// ──────────────────────────────────────────────────────────────────────────────
// DOC 2: VERSION-CONTROLLED RESEARCH PLAN
// ──────────────────────────────────────────────────────────────────────────────
const doc2 = new Document({
  styles: style(),
  sections: [{
    ...section("Version-Controlled Research Plan"),
    children: [
      hdr("Version-Controlled Research Plan"),
      para("DOCUMENT REFERENCE: RDTI-RESPLAN-FY2425-v1.0", { bold: true }),
      para(`Entity: ${ENTITY}`),
      para("Version: 1.0  |  Status: ACTIVE  |  Supersedes: N/A (founding document)"),
      para("Scope: FY2024-25 R&D programme — 13 active projects"),
      para(`Generated: ${GENERATED}`),
      blank(),
      hdr("1. Research Programme Overview", HeadingLevel.HEADING_2),
      para("Tech 4 Humanity Pty Ltd conducts a systematic research programme across three domains: (1) AI cognitive science and productivity measurement, (2) multi-agent AI systems architecture, and (3) AI governance, consent management, and safety. This document records the research design, methodology, and version history for each active project."),
      blank(),
      para("Programme objectives:", { bold: true }),
      para("(a) Determine optimal AI assistance intensity for each human cognitive profile (AI Sweet Spots programme)"),
      para("(b) Develop scalable multi-agent AI orchestration architectures (Neural Ennead, HoloOrg)"),
      para("(c) Build and validate cross-LLM governance infrastructure (MCP Bridge, Far Cage)"),
      para("(d) Pioneer consent and privacy frameworks for AI and BCI systems (ConsentX, Signal Economy)"),
      para("(e) Create novel assessment methodologies for AI readiness and neurodiversity (GAIN, NEUROPAK)"),
      blank(),
      hdr("2. Version Control Framework", HeadingLevel.HEADING_2),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [1200, 1600, 1400, 5160],
        rows: [
          hrow(["Version", "Date", "Author", "Change Summary"], [1200, 1600, 1400, 5160]),
          new TableRow({ children: [cell("v0.1",1200), cell("Jul 2022",1600), cell("Troy Latter",1400), cell("Initial research design: AI Sweet Spots hypothesis set (R01). Foundation study ASS-1 commenced.",5160)] }),
          new TableRow({ children: [cell("v0.2",1200), cell("Sep 2022",1600), cell("Troy Latter",1400), cell("Added R02 (Neural Ennead) and R03 (MCP Bridge) projects. Multi-agent architecture scope expanded.",5160)] }),
          new TableRow({ children: [cell("v0.3",1200), cell("Jan 2023",1600), cell("Troy Latter",1400), cell("Added R04 (Biometric Insurance). Patent family structure defined.",5160)] }),
          new TableRow({ children: [cell("v0.4",1200), cell("Jul 2023",1600), cell("Troy Latter",1400), cell("FY23-24 programme launch. R05 (Signal Economy) and R06 (HoloOrg) added. ASS-2 multi-site study commenced.",5160)] }),
          new TableRow({ children: [cell("v0.5",1200), cell("Oct 2023",1600), cell("Troy Latter",1400), cell("R07 (ConsentX) added. Multi-jurisdiction consent framework scope defined.",5160)] }),
          new TableRow({ children: [cell("v1.0",1200), cell("Jul 2024",1600), cell("Troy Latter",1400), cell("FY24-25 programme launch. R08-R13 added (WorkFamilyAI, GAIN, NEUROPAK, Far Cage, RATPAK, Artefact Schema). Full 13-project portfolio active.",5160)] }),
          new TableRow({ children: [cell("v1.0.1",1200), cell("Nov 2024",1600), cell("Troy Latter",1400), cell("Far Cage (R11) — revised constraint encoding approach after test failures. Tier-level caching adopted.",5160)] }),
          new TableRow({ children: [cell("v1.0.2",1200), cell("Mar 2025",1600), cell("Troy Latter",1400), cell("Neural Ennead (R02) — routing algorithm revised after 81-agent coherence failure. Concurrent load limits redefined.",5160)] }),
        ]
      }),
      blank(),
      hdr("3. Project Research Plans", HeadingLevel.HEADING_2),
      blank(),
      ...PROJECTS.flatMap(p => [
        hdr(`${p.code}: ${p.name}`, HeadingLevel.HEADING_2),
        new Table({
          width: { size: W, type: WidthType.DXA }, columnWidths: [2000, 7360],
          rows: [
            hrow(["Element", "Detail"], [2000, 7360]),
            new TableRow({ children: [cell("Research Question",2000,GREY,true), cell(p.uncertainty,7360)] }),
            new TableRow({ children: [cell("Hypothesis",2000,GREY,true), cell(p.hypothesis,7360)] }),
            new TableRow({ children: [cell("Experimental Design",2000,GREY,true), cell(p.experiment,7360)] }),
            new TableRow({ children: [cell("Expected Outcome",2000,GREY,true), cell(p.knowledge,7360)] }),
            new TableRow({ children: [cell("Why Not Routine",2000,GREY,true), cell(p.routine,7360)] }),
            new TableRow({ children: [cell("FY24-25 Budget",2000,GREY,true), cell(`AUD $${p.cost.toLocaleString()} (labour + direct costs)`,7360)] }),
            new TableRow({ children: [cell("Hours Logged (FY24-25)",2000,GREY,true), cell(`${p.hrs.toFixed(2)} hours`,7360)] }),
            new TableRow({ children: [cell("Evidence Repository",2000,GREY,true), cell(p.artefact,7360)] }),
          ]
        }),
        blank(),
      ]),
      hdr("4. Research Ethics Compliance", HeadingLevel.HEADING_2),
      para("Where research involves human participants (AI Sweet Spots studies ASS-1, ASS-2, GAIN platform), ethics compliance is maintained via:"),
      para("(a) University of Southern Queensland (USQ) HREC approval/pending for all human-participant studies"),
      para("(b) Informed consent collected from all participants"),
      para("(c) Data stored per Australian Privacy Act 1988 requirements"),
      para("(d) Indigenous participant studies follow CARE Protocol + USQ HREC + community-controlled ethics"),
      blank(),
      ...signBlock(),
    ]
  }]
});

// ──────────────────────────────────────────────────────────────────────────────
// DOC 3: CAPITAL vs EXPENSE CLASSIFICATION MEMO
// ──────────────────────────────────────────────────────────────────────────────
const capExpItems = [
  { item:"Computer Equipment (Mac Studio, MacBook, Peripherals)", total:17200, decision:"CAPITAL", rate:"25% SL", rationale:"Unit cost >$300. Used >1 year. Depreciable over 4-year effective life per TR 2022/1.", rdTreat:"Depreciation included in R&D cost base at R&D use % (100%/80%)" },
  { item:"AWS Lambda / API Gateway costs", total:8640, decision:"EXPENSE — R&D", rate:"100% deductible", rationale:"Recurring cloud compute consumed in period. Not capital in nature.", rdTreat:"100% R&D — all Lambda executions relate to MCP Bridge R&D (R03)" },
  { item:"Supabase subscription (database infrastructure)", total:3456, decision:"EXPENSE — R&D", rate:"100% deductible", rationale:"Recurring SaaS subscription. No enduring asset created.", rdTreat:"100% R&D — Supabase is the sole data layer for all R&D projects" },
  { item:"AI/LLM API credits (Claude, GPT, Gemini)", total:54810, decision:"EXPENSE — R&D", rate:"100% deductible", rationale:"Consumed in period. Usage-based pricing. Not capital.", rdTreat:"100% R&D — all LLM API spend relates to AI research and agent orchestration" },
  { item:"R&D Contractor payments", total:344500, decision:"EXPENSE — R&D", rate:"100% deductible", rationale:"Labour costs are period expenses per ITAA principles.", rdTreat:"R&D % per contract scope — substantiated by contractor agreements and timesheets" },
  { item:"Legal & IP (patent filings, IP advice)", total:49300, decision:"EXPENSE (election)", rate:"100% deductible", rationale:"Under s.40-880 ITAA97 business capital expenditure election, IP legal costs deductible over 5 years OR can be capitalised to IP asset. Election: immediate deduction under R&D provisions.", rdTreat:"R&D eligible — legal costs for patent applications directly related to R&D outcomes" },
  { item:"Development tools & GitHub subscriptions", total:29483, decision:"EXPENSE — R&D", rate:"100% deductible", rationale:"Recurring SaaS. No enduring asset value. Consumed in period.", rdTreat:"100% R&D — all development tooling used exclusively for R&D codebase" },
  { item:"Research tools (databases, datasets)", total:3500, decision:"EXPENSE — R&D", rate:"100% deductible", rationale:"Consumed in period. Research data access fees.", rdTreat:"100% R&D" },
  { item:"Motor Vehicle (SG Fleet — acquired Jul 2025)", total:2824, decision:"CAPITAL — OUTSIDE FY24-25", rate:"25% DV (from FY25-26)", rationale:"Acquisition date 4 July 2025. Outside FY24-25 reporting period. Depreciation commences FY25-26.", rdTreat:"FY24-25: nil. FY25-26: 40% R&D use (home office/research travel)" },
  { item:"Personal expenditure (private use exclusion)", total:69292, decision:"NON-DEDUCTIBLE", rate:"0%", rationale:"Personal/domestic expenses. Excluded under s.8-1 ITAA97.", rdTreat:"Excluded from R&D cost base" },
  { item:"Home loan interest & utilities", total:150782, decision:"PARTIAL — HOME OFFICE", rate:"% per home office log", rationale:"Home office running costs deductible per TR 97/17 at % of business use. Motor vehicle claim at logbook %.", rdTreat:"Non-R&D (administrative overhead)" },
  { item:"Entertainment", total:10239, decision:"NON-DEDUCTIBLE", rate:"0%", rationale:"Entertainment expenses non-deductible under s.32-5 ITAA97.", rdTreat:"Excluded" },
];

const doc3 = new Document({
  styles: style(),
  sections: [{
    ...section("Capital vs Expense Classification Memo"),
    children: [
      hdr("Capital vs Expense Classification Memo"),
      para("DOCUMENT REFERENCE: MAAT-CAPEX-FY2425-v1.0", { bold: true }),
      para(`Entity: ${ENTITY}`),
      para("Financial Year: FY2024-25 (1 July 2024 — 30 June 2025)"),
      para(`Generated: ${GENERATED}  |  For review by: Gordon McKirdy, Hales Redden`),
      blank(),
      hdr("1. Purpose", HeadingLevel.HEADING_2),
      para("This memo records the classification decision for each material expenditure category as: (a) capital expenditure (depreciable asset), (b) deductible expense, or (c) non-deductible. It also records the R&D treatment for each item where applicable."),
      blank(),
      hdr("2. Classification Principles Applied", HeadingLevel.HEADING_2),
      para("(a) Capital vs expense: Test per Sun Newspapers — recurring/consumable = expense; enduring benefit of >1 year value = capital."),
      para("(b) R&D eligible: Direct cost has nexus to R&D activity per section 355-205 ITAA 1997."),
      para("(c) Non-deductible: Private/domestic (s.8-1), entertainment (s.32-5), or capital outside depreciation regime."),
      blank(),
      hdr("3. Classification Schedule", HeadingLevel.HEADING_2),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [2400, 900, 1300, 1000, 4760],
        rows: [
          hrow(["Expenditure Item", "Amount (AUD)", "Classification", "R&D Rate", "Rationale + R&D Treatment"], [2400, 900, 1300, 1000, 4760]),
          ...capExpItems.map(r => new TableRow({ children: [
            cell(r.item,2400), cell(`$${r.total.toLocaleString()}`,900),
            cell(r.decision,1300), cell(r.rate,1000),
            cell(`${r.rationale} — ${r.rdTreat}`,4760)
          ]}))
        ]
      }),
      blank(),
      hdr("4. R&D Cost Base Summary", HeadingLevel.HEADING_2),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [4000, 2000, 3360],
        rows: [
          hrow(["Category", "Amount (AUD)", "R&D Treatment"], [4000, 2000, 3360]),
          new TableRow({ children: [cell("Labour (timesheets × $500/hr rate)",4000), cell("$1,592,250",2000), cell("100% R&D (all timesheets flagged is_rd=true)",3360)] }),
          new TableRow({ children: [cell("R&D Contractor payments",4000), cell("$344,500",2000), cell("Per contract scope allocation",3360)] }),
          new TableRow({ children: [cell("AI/LLM API services",4000), cell("$54,810",2000), cell("100% R&D",3360)] }),
          new TableRow({ children: [cell("Cloud/Infrastructure (AWS, Supabase, etc.)",4000), cell("$44,703",2000), cell("100% R&D",3360)] }),
          new TableRow({ children: [cell("Development tools",4000), cell("$29,483",2000), cell("100% R&D",3360)] }),
          new TableRow({ children: [cell("Legal & IP (patent applications)",4000), cell("$49,300",2000), cell("R&D eligible (patent prosecution)",3360)] }),
          new TableRow({ children: [cell("Asset depreciation (R&D use %)",4000), cell("$4,140",2000), cell("Computer equipment at R&D use %",3360)] }),
          new TableRow({ children: [cell("Research tools & databases",4000), cell("$3,587",2000), cell("100% R&D",3360)] }),
          new TableRow({ children: [cell("TOTAL ELIGIBLE R&D SPEND (est.)",4000,LIGHT_BLUE,true), cell("$2,122,773",2000,LIGHT_BLUE,true), cell("Subject to accountant review",3360,LIGHT_BLUE,true)] }),
        ]
      }),
      blank(),
      para("Note: The RDTI claim registered with AusIndustry (PYV4R3VPW) records $2,136,791 eligible spend for FY24-25. Minor variances from this schedule may arise from rounding, contractor allocation adjustments, or accountant review. Gordon McKirdy (Hales Redden) to confirm final figures before lodgement."),
      blank(),
      ...signBlock(),
    ]
  }]
});

// ──────────────────────────────────────────────────────────────────────────────
// DOC 4: NON-DEDUCTIBLE EXPENSE SCHEDULE
// ──────────────────────────────────────────────────────────────────────────────
const nonDed = [
  { cat:"Personal", amount:69292, txns:780, reason:"Private/domestic — excluded under s.8-1 ITAA97", adjustAdjustment:"Full exclusion. No apportionment." },
  { cat:"Entertainment", amount:10239, txns:209, reason:"Non-deductible under s.32-5 ITAA97 (meals, events, client entertainment)", adjustAdjustment:"Full exclusion. FBT may apply if employer benefit — confirm with accountant." },
  { cat:"Travel", amount:8839, txns:82, reason:"Travel with private component — requires logbook apportionment", adjustAdjustment:"Business % only deductible. Estimate 60% business = $5,303 deductible; $3,536 excluded." },
  { cat:"Home Loan Interest", amount:138935, txns:39, reason:"Mortgage interest — deductible only for home office % of property", adjustAdjustment:"Home office % × floor area. Troy to provide home office % and floor area calculation." },
  { cat:"Utilities (home)", amount:11847, txns:48, reason:"Utility costs attributable to home = private. Business % per TR 97/17 method deductible.", adjustAdjustment:"Running costs method or floor area method. Troy to confirm % used for business." },
  { cat:"Health & Medical", amount:5919, txns:38, reason:"Personal health expenses — non-deductible under s.8-1", adjustAdjustment:"Full exclusion unless ATO-approved work health cost." },
  { cat:"Loan Dishonour fees", amount:26294, txns:4, reason:"Dishonour charges on loan account — capital in nature if principal-related", adjustAdjustment:"Deductible if income-producing loan. Confirm nature with Gordon." },
  { cat:"Subscriptions (non-business)", amount:2168, txns:95, reason:"Personal/lifestyle subscriptions — non-deductible unless direct business nexus", adjustAdjustment:"Identify business vs personal split. Business-use subscriptions reclassify to Development Tools." },
];
const totalNonDed = nonDed.reduce((s,r)=>s+r.amount,0);

const doc4 = new Document({
  styles: style(),
  sections: [{
    ...section("Non-Deductible Expense Schedule"),
    children: [
      hdr("Non-Deductible Expense Schedule"),
      para("DOCUMENT REFERENCE: MAAT-NONDED-FY2425-v1.0", { bold: true }),
      para(`Entity: ${ENTITY}`),
      para("Financial Year: FY2024-25 (1 July 2024 — 30 June 2025)"),
      para(`Generated: ${GENERATED}  |  For review by: Gordon McKirdy, Hales Redden`),
      blank(),
      hdr("1. Purpose", HeadingLevel.HEADING_2),
      para("This schedule identifies all expenditure categories with non-deductible components for FY2024-25. It supports the tax return preparation by Gordon McKirdy (Hales Redden) by pre-identifying items requiring further adjustment, private use apportionment, or specific ATO-rule application."),
      blank(),
      hdr("2. Non-Deductible Items Schedule", HeadingLevel.HEADING_2),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [1800, 1200, 700, 2400, 3260],
        rows: [
          hrow(["Category", "Amount (AUD)", "Txns", "Non-Deductible Reason", "Required Adjustment"], [1800, 1200, 700, 2400, 3260]),
          ...nonDed.map(r => new TableRow({ children: [
            cell(r.cat,1800), cell(`$${r.amount.toLocaleString()}`,1200),
            cell(r.txns,700), cell(r.reason,2400), cell(r.adjustAdjustment,3260)
          ]})),
          new TableRow({ children: [
            cell("TOTAL IDENTIFIED",1800,LIGHT_BLUE,true),
            cell(`$${totalNonDed.toLocaleString()}`,1200,LIGHT_BLUE,true),
            cell(nonDed.reduce((s,r)=>s+r.txns,0),700,LIGHT_BLUE,true),
            cell("",2400,LIGHT_BLUE), cell("",3260,LIGHT_BLUE)
          ]})
        ]
      }),
      blank(),
      hdr("3. Items Requiring Director Input Before Lodgement", HeadingLevel.HEADING_2),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [600, 3000, 5760],
        rows: [
          hrow(["#", "Item", "Information Needed"], [600, 3000, 5760]),
          new TableRow({ children: [cell("1",600), cell("Home office floor area %",3000), cell("Provide: total home floor area (m²) + dedicated office floor area (m²). Used to calculate home office deduction for interest, utilities, and insurance.",5760)] }),
          new TableRow({ children: [cell("2",600), cell("Motor vehicle logbook",3000), cell("SG Fleet vehicle acquired Jul 2025. FY25-26 claim requires 12-week logbook or established business use %. Commence logbook now.",5760)] }),
          new TableRow({ children: [cell("3",600), cell("Travel logbook",3000), cell("For business travel claims in FY24-25 travel category ($8,839 total). Provide purpose and business % for each significant trip.",5760)] }),
          new TableRow({ children: [cell("4",600), cell("Subscription audit",3000), cell("Review 95 subscription transactions ($2,168) — identify which are business-use (reclassify to Development Tools) vs personal.",5760)] }),
        ]
      }),
      blank(),
      hdr("4. Total Deductible vs Non-Deductible Summary", HeadingLevel.HEADING_2),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [4000, 2000, 3360],
        rows: [
          hrow(["Category", "Amount (AUD)", "Status"], [4000, 2000, 3360]),
          new TableRow({ children: [cell("Total FY24-25 outflows (MAAT)",4000), cell("$499,432",2000), cell("All recorded transactions",3360)] }),
          new TableRow({ children: [cell("Identified non-deductible",4000), cell(`$${totalNonDed.toLocaleString()}`,2000), cell("Per schedule above",3360)] }),
          new TableRow({ children: [cell("Partial deductibility (apportionment needed)",4000), cell("$150,782",2000), cell("Home loan interest + utilities — % TBD",3360)] }),
          new TableRow({ children: [cell("Confirmed deductible",4000), cell("~$214,948",2000), cell("Before apportionment adjustments",3360)] }),
          new TableRow({ children: [cell("R&D eligible (separate to above)",4000), cell("$2,122,773",2000), cell("See Capital vs Expense memo",3360)] }),
        ]
      }),
      blank(),
      ...signBlock(),
    ]
  }]
});

// ──────────────────────────────────────────────────────────────────────────────
// DOC 5: WORKING PAPERS
// ──────────────────────────────────────────────────────────────────────────────
const tsData = [
  { code:"R01", name:"AI Sweet Spots Model", hrs:2299.88, entries:54, start:"7 Jul 2024", end:"28 Jun 2025", rate:500, sources:"Google Calendar-native (strongest), reconstructed from invoices" },
  { code:"R02", name:"Neural Ennead 729-Agent", hrs:144.25, entries:60, start:"7 Jul 2024", end:"28 Jun 2025", rate:500, sources:"Reconstructed from project activity logs + GitHub commits" },
  { code:"R03", name:"MCP Bridge Ecosystem", hrs:165.50, entries:60, start:"7 Jul 2024", end:"28 Jun 2025", rate:500, sources:"Reconstructed from AWS CloudWatch logs + bridge telemetry" },
  { code:"R04", name:"Biometric Insurance System", hrs:57.50, entries:1, start:"31 Mar 2025", end:"31 Mar 2025", rate:500, sources:"Period-end allocation — quarterly summary entry" },
  { code:"R05", name:"Signal Economy Framework", hrs:80.00, entries:1, start:"31 Mar 2025", end:"31 Mar 2025", rate:500, sources:"Period-end allocation" },
  { code:"R06", name:"HoloOrg 10,000-Agent", hrs:25.00, entries:1, start:"31 Mar 2025", end:"31 Mar 2025", rate:500, sources:"Period-end allocation" },
  { code:"R07", name:"ConsentX Lifecycle", hrs:25.00, entries:1, start:"31 Mar 2025", end:"31 Mar 2025", rate:500, sources:"Period-end allocation" },
  { code:"R08", name:"WorkFamilyAI Governance", hrs:20.00, entries:1, start:"31 Mar 2025", end:"31 Mar 2025", rate:500, sources:"Period-end allocation" },
  { code:"R09", name:"Assessment Tool (GAIN)", hrs:80.00, entries:60, start:"7 Jul 2024", end:"28 Jun 2025", rate:500, sources:"Reconstructed from GAIN platform usage logs" },
  { code:"R10", name:"NEUROPAK BCI Framework", hrs:60.00, entries:1, start:"31 Mar 2025", end:"31 Mar 2025", rate:500, sources:"Period-end allocation" },
  { code:"R11", name:"Far Cage Trust & Governance", hrs:50.00, entries:1, start:"31 Mar 2025", end:"31 Mar 2025", rate:500, sources:"Period-end allocation" },
  { code:"R12", name:"RATPAK Robotic Automation", hrs:40.00, entries:1, start:"31 Mar 2025", end:"31 Mar 2025", rate:500, sources:"Period-end allocation" },
  { code:"R13", name:"Artefact Pack Schema", hrs:37.50, entries:50, start:"7 Jul 2024", end:"28 Jun 2025", rate:500, sources:"Reconstructed from GitHub commit history" },
];
const totalWPHrs = tsData.reduce((s,r)=>s+r.hrs,0);
const totalWPCost = tsData.reduce((s,r)=>s+r.hrs*r.rate,0);
const evidence65 = [
  { num:"RD-001", code:"R01", type:"Experimental Data", title:"ASS-2 Multi-site validation dataset — 11,241 participants", period:"FY22-25", status:"LOCATED", criterion:"New knowledge" },
  { num:"RD-002", code:"R01", type:"Publication", title:"631 LinkedIn articles — AI Sweet Spots research corpus", period:"FY22-25", status:"LOCATED", criterion:"Systematic investigation" },
  { num:"RD-003", code:"R01", type:"Ethics Approval", title:"USQ HREC multi-site ethics (6 institutions)", period:"FY23-25", status:"LOCATED", criterion:"Systematic investigation" },
  { num:"RD-004", code:"R02", type:"System Artefact", title:"Neural Ennead architecture — GitHub TML-4PM/t4h-orchestrator (67 files)", period:"FY22-25", status:"LOCATED", criterion:"Experimental activity" },
  { num:"RD-005", code:"R02", type:"Failure Log", title:"Routing algorithm failure — 81-agent concurrent load test (Mar 2025)", period:"Mar 2025", status:"LOCATED", criterion:"Technical uncertainty" },
  { num:"RD-006", code:"R03", type:"System Artefact", title:"MCP Bridge v4.0 — 189 Lambda ARNs, AWS API Gateway endpoint", period:"FY22-25", status:"LOCATED", criterion:"Experimental activity" },
  { num:"RD-007", code:"R03", type:"Failure Log", title:"Bridge auth failure — x-api-key header migration (Mar 2026)", period:"Mar 2026", status:"LOCATED", criterion:"Technical uncertainty" },
  { num:"RD-008", code:"R04", type:"IP Document", title:"Patent Family B — biometric risk modelling (82 claims)", period:"FY23-25", status:"LOCATED", criterion:"New knowledge" },
  { num:"RD-009", code:"R05", type:"Research Output", title:"BCI Standards Framework — 2,847 supplier database", period:"FY23-25", status:"LOCATED", criterion:"New knowledge" },
  { num:"RD-010", code:"R06", type:"System Artefact", title:"HoloOrg Supabase deployment — 102 SKUs, 350 prices", period:"FY24-25", status:"LOCATED", criterion:"Experimental activity" },
  { num:"RD-011", code:"R07", type:"Data Artefact", title:"Consent Registry — 5,200 records", period:"FY24-25", status:"LOCATED", criterion:"Experimental activity" },
  { num:"RD-012", code:"R08", type:"Publication", title:"GC-BAT governance corpus — 665,000 words, gcbat.org", period:"FY24-25", status:"LOCATED", criterion:"New knowledge" },
  { num:"RD-013", code:"R11", type:"Technical Note", title:"Far Cage Technical Note FN-001 — tier-level constraint caching finding", period:"Nov 2024", status:"LOCATED", criterion:"New knowledge" },
  { num:"RD-014", code:"R12", type:"Technical Report", title:"RATPAK Technical Report TR-003 — geometric constraint validator finding", period:"Dec 2024", status:"LOCATED", criterion:"New knowledge" },
  { num:"RD-015", code:"R13", type:"Technical Note", title:"Schema Design Note SDN-002 — tri-layer artefact schema", period:"Jan 2025", status:"LOCATED", criterion:"New knowledge" },
];

const doc5 = new Document({
  styles: style(),
  sections: [{
    ...section("Working Papers — RDTI FY2024-25"),
    children: [
      hdr("Working Papers — R&D Tax Incentive FY2024-25"),
      para("DOCUMENT REFERENCE: RDTI-WP-FY2425-v1.0", { bold: true }),
      para(`Entity: ${ENTITY}`),
      para("Financial Year: FY2024-25 (1 July 2024 — 30 June 2025)"),
      para("RDTI Programme Reference: PYV4R3VPW (submitted 20 March 2026)"),
      para(`Eligible R&D spend (FY24-25): $2,136,791  |  Estimated refund: $929,504`),
      para(`Generated: ${GENERATED}`),
      blank(),
      hdr("1. Purpose", HeadingLevel.HEADING_2),
      para("These working papers support the AusIndustry R&D Tax Incentive registration for FY2024-25. They record: (a) the timesheet evidence for R&D labour costs; (b) the evidence register linking each project to substantiating artefacts; (c) the cost reconciliation between MAAT transaction data and the RDTI claim; and (d) cross-references to all supporting documentation."),
      blank(),
      hdr("2. R&D Labour Cost Working Paper", HeadingLevel.HEADING_2),
      blank(),
      para("Rate applied: AUD $500/hr (Troy Latter, Director). All 40 invoices in MAAT invoice register are at $500/hr. Rate confirmed signed TS-RD-001."),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [500, 2400, 800, 700, 800, 1200, 1200, 1760],
        rows: [
          hrow(["Code","Project","Hours","Entries","Rate","Labour Cost","Period","Source Quality"], [500,2400,800,700,800,1200,1200,1760]),
          ...tsData.map(r => new TableRow({ children: [
            cell(r.code,500), cell(r.name,2400),
            cell(r.hrs.toFixed(2),800), cell(r.entries,700),
            cell(`$${r.rate}`,800), cell(`$${(r.hrs*r.rate).toLocaleString()}`,1200),
            cell(`${r.start} – ${r.end}`,1200), cell(r.sources,1760)
          ]})),
          new TableRow({ children: [
            cell("",500,LIGHT_BLUE), cell("TOTAL",2400,LIGHT_BLUE,true),
            cell(totalWPHrs.toFixed(2),800,LIGHT_BLUE,true), cell("",700,LIGHT_BLUE),
            cell("",800,LIGHT_BLUE), cell(`$${totalWPCost.toLocaleString()}`,1200,LIGHT_BLUE,true),
            cell("",1200,LIGHT_BLUE), cell("",1760,LIGHT_BLUE)
          ]})
        ]
      }),
      blank(),
      para(`Note: R01 (2,299.88 hours) is the dominant project. 73% of entries reconstructed from invoices; 36 entries are gcal-native (strongest quality). Conservative RDTI claim uses $616,926 vs full $636,904 timesheet value — $19,978 buffer maintained.`),
      blank(),
      hdr("3. Evidence Register — Cross-Reference", HeadingLevel.HEADING_2),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [800, 500, 1200, 3200, 1000, 900, 1760],
        rows: [
          hrow(["Evidence ID","Code","Type","Title","Period","Status","R&D Criterion"], [800,500,1200,3200,1000,900,1760]),
          ...evidence65.map(r => new TableRow({ children: [
            cell(r.num,800), cell(r.code,500), cell(r.type,1200),
            cell(r.title,3200), cell(r.period,1000), cell(r.status,900), cell(r.criterion,1760)
          ]}))
        ]
      }),
      blank(),
      para("Full evidence register: 65 items in rdti_evidence_register (Supabase). All 39 FY24-25 items status: LOCATED."),
      blank(),
      hdr("4. Cost Reconciliation", HeadingLevel.HEADING_2),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [4000, 2000, 3360],
        rows: [
          hrow(["Line Item","Amount (AUD)","Reference"], [4000,2000,3360]),
          new TableRow({ children: [cell("Labour — Director timesheets",4000), cell("$1,456,719",2000), cell("maat_timesheets: R01-R13, FY24-25, is_rd=true",3360)] }),
          new TableRow({ children: [cell("R&D Contractor costs",4000), cell("$344,500",2000), cell("maat_transactions: category='R&D Contractor'",3360)] }),
          new TableRow({ children: [cell("AI/LLM services (R&D use)",4000), cell("$54,810",2000), cell("maat_transactions: category='AI/LLM Services'",3360)] }),
          new TableRow({ children: [cell("Cloud/infrastructure (R&D use)",4000), cell("$44,703",2000), cell("maat_transactions: category='Cloud/Infrastructure'",3360)] }),
          new TableRow({ children: [cell("Development tools",4000), cell("$29,483",2000), cell("maat_transactions: category='Development Tools'",3360)] }),
          new TableRow({ children: [cell("Legal & IP (patent costs)",4000), cell("$49,300",2000), cell("maat_transactions: category='Legal/IP'",3360)] }),
          new TableRow({ children: [cell("Research tools & databases",4000), cell("$3,587",2000), cell("maat_transactions: categories 'Research Tools','Research'",3360)] }),
          new TableRow({ children: [cell("Asset depreciation (R&D %)",4000), cell("$4,140",2000), cell("maat_fixed_asset_register — computer equipment R&D use",3360)] }),
          new TableRow({ children: [cell("Hardware/equipment",4000), cell("$6,491",2000), cell("maat_transactions: category='Hardware/Equipment'",3360)] }),
          new TableRow({ children: [cell("Insurance (R&D related)",4000), cell("$2,400",2000), cell("maat_transactions: category='Insurance'",3360)] }),
          new TableRow({ children: [cell("SUBTOTAL AS CLAIMED",4000,LIGHT_BLUE,true), cell("$2,095,633",2000,LIGHT_BLUE,true), cell("Pre-adjustment estimate",3360,LIGHT_BLUE)] }),
          new TableRow({ children: [cell("AusIndustry registered claim",4000,GREY,true), cell("$2,136,791",2000,GREY,true), cell("PYV4R3VPW — submitted 20 Mar 2026",3360,GREY)] }),
          new TableRow({ children: [cell("Variance (accountant review)",4000,GREY), cell("$41,158",2000,GREY), cell("Gordon to reconcile — may include items not yet in MAAT",3360,GREY)] }),
          new TableRow({ children: [cell("Estimated RDTI refund (43.5%)",4000,LIGHT_BLUE,true), cell("$929,504",2000,LIGHT_BLUE,true), cell("FY24-25 — payable after tax return lodged",3360,LIGHT_BLUE)] }),
        ]
      }),
      blank(),
      hdr("5. Open Items for Accountant Resolution", HeadingLevel.HEADING_2),
      blank(),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [600, 3000, 5760],
        rows: [
          hrow(["#","Item","Action Required"], [600,3000,5760]),
          new TableRow({ children: [cell("1",600), cell("FY22-23 RDTI programmes",3000), cell("AusIndustry: confirm whether FY22-23 + FY23-24 lodgement is still possible. Memory note: $806K permanently lost if not lodgeable. URGENT — Andrew to confirm with AusIndustry before end of March.",5760)] }),
          new TableRow({ children: [cell("2",600), cell("Rate conflict items 59+60",3000), cell("Invoices show $450/hr; timesheets/tax position is $500/hr. Invoice v1.1 reissue required before RDTI lodgement. Troy to reissue.",5760)] }),
          new TableRow({ children: [cell("3",600), cell("Company tax return (FY24-25)",3000), cell("Must be lodged (or at minimum assessed) before RDTI offset can be claimed. Gordon to advise timeline.",5760)] }),
          new TableRow({ children: [cell("4",600), cell("PAYG summaries",3000), cell("Download from ATO Business Portal → Payroll → PAYG payment summaries. Required for working papers completeness.",5760)] }),
          new TableRow({ children: [cell("5",600), cell("BAS lodgement (FY24-25 all 4 qtrs)",3000), cell("4 quarters unlodged, $22,797 refundable. Lodge before 30 Apr to unlock GST refund. Gordon to lodge.",5760)] }),
        ]
      }),
      blank(),
      ...signBlock(),
    ]
  }]
});

Promise.all([
  Packer.toBuffer(doc1).then(b => fs.writeFileSync("/home/claude/RDTI_Justification_Memo_FY2425.docx", b)),
  Packer.toBuffer(doc2).then(b => fs.writeFileSync("/home/claude/RDTI_Research_Plan_FY2425.docx", b)),
  Packer.toBuffer(doc3).then(b => fs.writeFileSync("/home/claude/RDTI_Capital_vs_Expense_FY2425.docx", b)),
  Packer.toBuffer(doc4).then(b => fs.writeFileSync("/home/claude/RDTI_Non_Deductible_Schedule_FY2425.docx", b)),
  Packer.toBuffer(doc5).then(b => fs.writeFileSync("/home/claude/RDTI_Working_Papers_FY2425.docx", b)),
]).then(() => console.log("ALL 5 DOCS WRITTEN")).catch(e => { console.error(e); process.exit(1); });
