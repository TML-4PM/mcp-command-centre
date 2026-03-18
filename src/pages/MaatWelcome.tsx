export default function MaatWelcome() {
  return (
    <div style={{ minHeight:"100vh", background:"#06090f", color:"#e8edf5", fontFamily:"'Inter', sans-serif", fontSize:14 }}>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #1e2d47", padding:"0 32px", height:52, display:"flex", alignItems:"center", gap:12, background:"rgba(6,9,15,0.95)" }}>
        <span style={{ fontWeight:800, fontSize:16, color:"#00c2ff", letterSpacing:"0.04em" }}>MAAT</span>
        <span style={{ color:"#253552" }}>/</span>
        <span style={{ fontSize:14, color:"#e8edf5" }}>Welcome</span>
      </div>

      <div style={{ maxWidth:760, margin:"0 auto", padding:"48px 32px 80px" }}>

        {/* Greeting */}
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:11, fontFamily:"monospace", color:"#00c2ff", letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:12 }}>
            Tech 4 Humanity Pty Ltd · ABN 61 605 746 618
          </div>
          <h1 style={{ fontSize:32, fontWeight:800, color:"#e8edf5", lineHeight:1.15, marginBottom:12 }}>
            Hey Andrew 👋
          </h1>
          <p style={{ color:"#8899b8", fontSize:16, lineHeight:1.7 }}>
            This is the MAAT accountant portal — your direct window into the T4H financial and compliance data. Everything here is live from the database, so what you see is current as of right now.
          </p>
        </div>

        <Divider />

        {/* What's here */}
        <Section emoji="📂" title="What's here">
          <p>The portal has two main areas:</p>
          <Cards>
            <Card
              color="#00c2ff"
              label="121 Spine"
              href="/maat-spine"
              desc="The full document map — 85 compliance, RDTI and accounting documents across 6 waves. This is the main thing you'll use."
            />
            <Card
              color="#22c55e"
              label="MAAT System"
              href="/maat"
              desc="The financial dashboard — P&L, BAS periods, RDTI summary, director loan, bank coverage. Numbers view."
            />
          </Cards>
        </Section>

        <Divider />

        {/* The 121 Spine */}
        <Section emoji="🗂️" title="The 121 Spine — start here">
          <p>Go to <A href="/maat-spine">121 Spine</A>. You'll see every document grouped by wave:</p>
          <ul>
            <Li><strong style={{color:"#00c2ff"}}>Wave 0</strong> — the lodgement-critical stuff. BAS, RDTI, cost allocation, contemporaneous records. This is what you need for the ATO.</Li>
            <Li><strong style={{color:"#22c55e"}}>Wave 1</strong> — accounting backbone. P&amp;L, trial balance, GL, depreciation, director loan movement.</Li>
            <Li><strong style={{color:"#f5c842"}}>Wave 2</strong> — MAAT reconciliation. How transactions are categorised, R&amp;D vs non-R&amp;D allocation logic, BAS recon.</Li>
            <Li><strong style={{color:"#f97316"}}>Wave 3</strong> — corporate and legal. Company structure, director resolutions, Div7A loan.</Li>
            <Li><strong style={{color:"#a78bfa"}}>Wave 4 &amp; 5</strong> — IP and strategy. Less urgent for you right now.</Li>
          </ul>
          <p>Each document has a status badge:</p>
          <Badges />
        </Section>

        <Divider />

        {/* How to generate a report */}
        <Section emoji="▶️" title="Generating a report">
          <p>Any document with a green <Badge color="#22c55e">✓ Ready</Badge> badge is live data. Click it and the data loads straight from the database — no waiting, no exports needed on our end.</p>
          <Steps>
            <Step n={1}>Find the document you want — use the wave filters across the top or just search by name</Step>
            <Step n={2}>Click the row — a panel opens with the full data table</Step>
            <Step n={3}>Review it in the panel, or hit <strong>↓ Export CSV</strong> to download it to your machine</Step>
          </Steps>
          <Note>The table shows up to 200 rows on screen. The CSV export always contains the full dataset — use that for anything you're taking into your own workpapers.</Note>
        </Section>

        <Divider />

        {/* Saving files */}
        <Section emoji="💾" title="Saving files">
          <p>Every live report has an <strong>Export CSV</strong> button in the top-right of the data panel. Click it and the file downloads immediately to your browser's default download folder.</p>
          <p>Filename format is: <Code>MAAT_W0-016_2026-03-18.csv</Code> — document key + date. Makes it easy to track which version you pulled and when.</p>
          <p>If you need a specific format (XLSX, formatted PDF) for your workpapers, let Troy know and he can generate it.</p>
        </Section>

        <Divider />

        {/* What to expect */}
        <Section emoji="🔍" title="What to expect from the data">
          <p>A few things worth knowing upfront:</p>
          <ul>
            <Li><strong>Contractors are excluded from RDTI.</strong> Payments to contractors (~$362k in FY24-25) have been recategorised as non-research. The RDTI eligible figures you see already reflect this.</Li>
            <Li><strong>FY22-23 timesheets are reconstructed.</strong> Director labour hours for that year have been rebuilt from calendar and email records at $350/hr (conservative rate). This is noted in the Contemporaneous Records report.</Li>
            <Li><strong>Bank statement gaps exist.</strong> Amex Feb/Mar 2026 and ANZ Dec 2023 are missing. This affects the cash flow statement and the bank recon. Troy is working to upload these.</Li>
            <Li><strong>FY25-26 is partial.</strong> The current financial year is live and building — figures are YTD only.</Li>
          </ul>
        </Section>

        <Divider />

        {/* Asking other questions */}
        <Section emoji="💬" title="Asking other questions of the data">
          <p>The portal runs off a live database with 3,766 transactions, 1,196 journal entries, 35 R&D projects, and all BAS periods. If you need something that isn't already a named report:</p>
          <Steps>
            <Step n={1}>Email Troy at <A href="mailto:troy@tech4humanity.com.au">troy@tech4humanity.com.au</A> with what you need — e.g. "I need all transactions over $5k in FY24-25 categorised as R&D"</Step>
            <Step n={2}>He can generate a custom export and either add it to the portal as a new live report, or send you a one-off CSV</Step>
            <Step n={3}>Turnaround is usually same day — everything is automated</Step>
          </Steps>
          <Note>Common requests Troy can turn around fast: transactions by vendor, by date range, by category, by business entity, by R&D project, or any cross-filter combination.</Note>
        </Section>

        <Divider />

        {/* Key dates */}
        <Section emoji="📅" title="Key dates to keep in mind">
          <Dates>
            <DateRow color="#ef4444" date="30 April 2026" label="AusIndustry RDTI registration" note="Registration must be lodged before this date. Troy to action — the documents in Wave 0 support this." />
            <DateRow color="#f5c842" date="30 June 2026" label="Div7A MYR due" note="FY2026 minimum yearly repayment of $72,299 on the director loan. Benchmark rate 8.37%." />
            <DateRow color="#00c2ff" date="Now" label="BAS lodgement — all 4 FY24-25 quarters" note="$22,797.72 refundable. Ready to go — reports are in Wave 0." />
          </Dates>
        </Section>

        <Divider />

        {/* Footer note */}
        <div style={{ background:"#0d1320", border:"1px solid #1e2d47", borderRadius:10, padding:"20px 24px", marginTop:8 }}>
          <p style={{ margin:0, color:"#6b7fa0", lineHeight:1.8 }}>
            Questions about the portal itself → <A href="mailto:troy@tech4humanity.com.au">troy@tech4humanity.com.au</A><br />
            Questions about the numbers → same, and cc Gordon at Hales Redden as needed<br />
            Something broken → email Troy, it'll be fixed within the hour
          </p>
        </div>

      </div>

      {/* Footer */}
      <div style={{ borderTop:"1px solid #1e2d47", padding:"16px 32px", display:"flex", gap:12, color:"#6b7fa0", fontSize:11, fontFamily:"monospace" }}>
        <span style={{ color:"#00c2ff" }}>MAAT</span>
        <span>—</span>
        <span>Multi-domain Agentic Accounting &amp; Tax</span>
        <span>·</span>
        <span>Tech 4 Humanity Pty Ltd</span>
        <span style={{ marginLeft:"auto" }}>ABN 61 605 746 618</span>
      </div>

    </div>
  );
}

// ─── Small components ────────────────────────────────────────────────────────

function Section({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <span style={{ fontSize:18 }}>{emoji}</span>
        <h2 style={{ fontSize:18, fontWeight:700, color:"#e8edf5", margin:0 }}>{title}</h2>
      </div>
      <div style={{ color:"#8899b8", lineHeight:1.8, display:"flex", flexDirection:"column", gap:10 }}>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop:"1px solid #1e2d47", margin:"32px 0" }} />;
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} style={{ color:"#00c2ff", textDecoration:"none" }}>{children}</a>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <code style={{ fontFamily:"monospace", fontSize:12, background:"#141c2e", border:"1px solid #1e2d47", borderRadius:4, padding:"2px 7px", color:"#b0bed4" }}>{children}</code>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background:"#0d1320", border:"1px solid #1e2d47", borderLeft:"3px solid #00c2ff", borderRadius:"0 6px 6px 0", padding:"12px 16px", fontSize:13, color:"#6b7fa0", lineHeight:1.7 }}>
      {children}
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ marginBottom:6, paddingLeft:4 }}>{children}</li>;
}

function Steps({ children }: { children: React.ReactNode }) {
  return <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{children}</div>;
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
      <div style={{ width:24, height:24, borderRadius:"50%", background:"#1e2d47", border:"1px solid #253552", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontFamily:"monospace", color:"#00c2ff", flexShrink:0, marginTop:1 }}>
        {n}
      </div>
      <div style={{ color:"#8899b8", lineHeight:1.7 }}>{children}</div>
    </div>
  );
}

function Badges() {
  return (
    <div style={{ display:"flex", gap:10, flexWrap:"wrap", margin:"8px 0" }}>
      <span style={{ padding:"4px 12px", borderRadius:5, background:"rgba(34,197,94,0.12)", color:"#22c55e", border:"1px solid rgba(34,197,94,0.2)", fontSize:12, fontFamily:"monospace" }}>✓ Ready — click to generate live data</span>
      <span style={{ padding:"4px 12px", borderRadius:5, background:"rgba(249,115,22,0.12)", color:"#f97316", border:"1px solid rgba(249,115,22,0.2)", fontSize:12, fontFamily:"monospace" }}>◐ Partial — data exists but has gaps</span>
      <span style={{ padding:"4px 12px", borderRadius:5, background:"rgba(239,68,68,0.08)", color:"#f87171", border:"1px solid rgba(239,68,68,0.15)", fontSize:12, fontFamily:"monospace" }}>✗ Missing — external doc or N/A</span>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ padding:"2px 8px", borderRadius:4, background:color+"22", color, border:`1px solid ${color}44`, fontSize:12, fontFamily:"monospace" }}>{children}</span>;
}

function Cards({ children }: { children: React.ReactNode }) {
  return <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, margin:"8px 0" }}>{children}</div>;
}

function Card({ color, label, href, desc }: { color: string; label: string; href: string; desc: string }) {
  return (
    <a href={href} style={{ textDecoration:"none", display:"block", background:"#0d1320", border:`1px solid #1e2d47`, borderRadius:8, padding:"16px 18px", transition:"border-color 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = color + "88")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e2d47")}>
      <div style={{ fontSize:13, fontWeight:700, color, marginBottom:6 }}>{label} →</div>
      <div style={{ fontSize:12, color:"#6b7fa0", lineHeight:1.6 }}>{desc}</div>
    </a>
  );
}

function Dates({ children }: { children: React.ReactNode }) {
  return <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{children}</div>;
}

function DateRow({ color, date, label, note }: { color: string; date: string; label: string; note: string }) {
  return (
    <div style={{ display:"flex", gap:14, alignItems:"flex-start", background:"#0d1320", border:"1px solid #1e2d47", borderRadius:8, padding:"14px 16px" }}>
      <div style={{ flexShrink:0, textAlign:"center", minWidth:80 }}>
        <div style={{ fontSize:12, fontWeight:700, color, fontFamily:"monospace" }}>{date}</div>
      </div>
      <div style={{ width:1, background:"#1e2d47", alignSelf:"stretch" }} />
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:"#e8edf5", marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:12, color:"#6b7fa0", lineHeight:1.6 }}>{note}</div>
      </div>
    </div>
  );
}
