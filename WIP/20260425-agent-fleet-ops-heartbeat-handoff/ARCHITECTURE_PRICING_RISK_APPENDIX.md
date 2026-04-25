# Architecture Pricing Risk Appendix

Receipt ID: CC-HANDOFF-20260425-AGENT-FLEET-OPS-APPENDIX-001

Lane correction: Symbio is the dev lane. WIP is also a separate working lane/location. This file is lodged under WIP so the work is not hidden under Symbio only.

This note extends the handoff beyond a heartbeat widget. The work must cover modelling, pricing, data ownership, fleet risk, productisation, sales, and architecture for large agent fleets across HoloOrg, Augmented Humanity Coach, AI for Tradies, and future businesses.

## Core Scope

The practical question is not only whether Mac or EC2 is running. The larger operating question is how the organisation manages a possible fleet of thousands of agents operating across Google, Microsoft, AWS, Supabase, GitHub, Vercel, Stripe, browser surfaces, email, and other systems.

The control layer must show where work is running, where data lives, who owns the data, what each activity costs, what product it belongs to, and what risks exist.

## Added Events

| ID | Event | Action Needed |
|---|---|---|
| EVT-012 | Modelling must be correct. | Create operating, cost, data, ownership, product, and risk models. |
| EVT-013 | Pricing is needed at each point. | Track cost and price by agent, execution, connector, storage, support, and tenant. |
| EVT-014 | Risk must be visible. | Build risk register and controls map. |
| EVT-015 | Data location and owner must be known. | Build data inventory and ownership model. |
| EVT-016 | Future fleets may include 10000 agents across Google, Microsoft, and others. | Design a cross-platform agent control model. |
| EVT-017 | Internal governance must stretch across the model. | Add evidence and governance metadata to each agent action. |
| EVT-018 | Architect and CTO team must review. | Assign architecture and CTO pod. |
| EVT-019 | Products need product pod review. | Assign product pod for product definition and roadmap. |
| EVT-020 | Pods need pricing and marketing/sales support. | Attach pricing and GTM ownership to each product pod. |
| EVT-021 | More instructions will be updated via GitHub. | Treat this folder as the active WIP record. |

## Required Models

### Operating Model

Define how agents are created, registered, deployed, run, monitored, billed, suspended, archived, and retired.

Required labels: agent key, business key, brand, tenant, owner pod, executor, connector, data domain, governance requirement, pricing tier, risk tier, lifecycle state, evidence state.

### Cost Model

Track costs for model calls, connector/API use, Supabase, S3, Lambda, EC2, GitHub Actions, Vercel, logging, notifications, support, recovery, escalation, sales acquisition, and partner share.

### Pricing Model

Support pricing per agent, active agent, execution, workflow, connector, seat, tenant, dashboard, evidence record, storage tier, white-label deployment, support tier, and enterprise plan.

### Data Location Model

Every data object needs: system of record, storage location, owner, data class, retention, archive path, export path, evidence path, consent dependency, external platform dependency, and cross-border considerations.

### Ownership Model

Each product or workflow needs a named owner for data, product, technical architecture, runtime, security, commercial, support, and governance.

### Risk Model

Track hidden Mac dependency, silent failure, queue backlog, unpriced compute growth, Supabase overuse, connector lock-in, unclear data ownership, tenant mixing, weak evidence, incomplete consent chain, agent sprawl, model drift, instruction drift, billing mismatch, security exposure, and brand failure.

### Governance Model

Each agent action should log initiator, executor, data accessed, connector used, approval mode, evidence reference, result, cost attribution, and recovery path.

## Pod Assignments

| Pod | Responsibility |
|---|---|
| Architecture / CTO | System model, scaling design, runtime split, data model, platform choices. |
| Product | Product definition, user value, features, packaging, roadmap. |
| Pricing / Finance | Unit economics, cost attribution, margin, Stripe mapping. |
| Marketing / Sales | Positioning, buyer segments, campaign assets, sales story. |
| Operations | Monitoring, support, runbooks, incident response, service levels. |
| Governance | Evidence, risk, consent, audit, Reality Ledger alignment. |
| Data | Data ownership, storage split, retention, export, privacy. |
| Partnerships | Google, Microsoft, AWS, Supabase, GitHub, Vercel, Stripe, and channel map. |

## New Actions

| ID | Priority | Owner | Action | Deliverable |
|---|---:|---|---|---|
| ACT-014 | P0 | Architecture / CTO | Create cross-platform fleet architecture for 10000 agents. | fleet_architecture_model.md |
| ACT-015 | P0 | Data | Build data inventory model. | data_location_ownership_model.md |
| ACT-016 | P0 | Pricing / Finance | Create pricing and unit economics model. | unit_economics_and_pricing_model.md |
| ACT-017 | P0 | Governance | Extend governance metadata across external connectors. | governance_control_model.md |
| ACT-018 | P1 | Product | Define Agent Fleet Management as an internal and external product. | product_definition_agent_fleet_management.md |
| ACT-019 | P1 | Marketing / Sales | Create GTM story and sales materials. | gtm_agent_fleet_management.md |
| ACT-020 | P1 | Operations | Create support model and mobile runbook. | ops_support_model.md |
| ACT-021 | P1 | Partnerships | Map platform dependencies and money chain. | partner_dependency_map.md |

## Design Rule

Do not build this as a one-off widget. Build it as a repeatable fleet-control pattern that can attach to any brand, tenant, customer, connector, agent group, or runtime.

## Updated Definition of Done

The work is done when this folder contains the event/action log, heartbeat model, cross-platform architecture, data ownership model, pricing model, product definition, GTM note, risk register, governance model, runbook, pod assignment table, and GitHub evidence receipt.

## Receipt

Repo: TML-4PM/mcp-command-centre
Path: WIP/20260425-agent-fleet-ops-heartbeat-handoff/ARCHITECTURE_PRICING_RISK_APPENDIX.md
Receipt ID: CC-HANDOFF-20260425-AGENT-FLEET-OPS-APPENDIX-001
