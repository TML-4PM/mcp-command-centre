# Migadu + Cal.com Domain Rollout Plan
Maturity baseline: Level 35 / Wave 10

## Objective
Bring all listed non-Tech4Humanity domains onto a governed communications and scheduling spine:
- inbound/outbound mail standardised on Migadu
- scheduling standardised on Cal.com
- routing, ownership, automation, and evidence wired through bridge-ready manifests
- non-destructive migration with legacy preservation and launch gates

## Explicit exclusions
- techforhumanity.com.au
- techforhumanity.net

## Domain list
- all-chemist.org
- apexpredatorinsurance.com
- augmentedhumanity.coach
- enteraustralia.tech
- far-cage.org
- gcbat.org
- globaltyres.org
- holo-org.com
- innovateme.link
- innovateme.systems
- mcp-native.com
- workfamilyai.org

## Wave 10 rules
1. No domain is LIVE until required inboxes exist, are owned, routed, authenticated, and tested.
2. No mailbox cutover is destructive. Legacy routing is retained until evidence passes.
3. Every domain must have owner + backup owner.
4. All financial mail is routed to FACTORS ingestion.
5. All customer and lead mail is routed to the Supabase-native CRM.
6. All booking flows are routed through Cal.com with webhook evidence and support fallback.

## Required mailbox set per domain
- hello@
- support@
- sales@
- noreply@
- billing@
- ops@

## Required alias examples
- info@ -> hello@
- accounts@ -> billing@
- admin@ -> ops@
- bookings@ -> support@ or sales@ depending on business motion

## Rollout sequence
### Lane 1: Discovery and audit
- confirm registrar and DNS authority
- confirm existing MX/SPF/DKIM/DMARC
- enumerate existing mailboxes, aliases, forwarders, shared inboxes
- identify mailbox owners and backup owners
- capture live automations, forms, Stripe notifications, CRM hooks, or booking integrations
- inspect mailbox data volume and classify migration complexity
- produce intended state vs actual state report

### Lane 2: Migadu standardisation
- create domain in Migadu
- create required mailboxes
- create alias map
- create forwarding rules
- define sender identities
- define retention and shared access policy
- enable DKIM and confirm SPF + DMARC alignment
- test inbound, outbound, reply-to, and forwarding behavior

### Lane 3: Cal.com standardisation
- create Cal.com organization/team structure by brand
- create event types by domain/business motion
- map branded booking URLs
- map notification sender identity
- connect calendars
- enable routing forms where needed
- enable payments where needed
- define webhook destinations for bridge ingestion

### Lane 4: Bridge wiring
- mailbox audit results -> Supabase domain_mailbox_audit
- mailbox events -> finance and CRM ingestion
- Cal.com webhooks -> scheduling_event_log
- cutover evidence -> reality ledger classification
- board closure records -> build_closure_register

### Lane 5: Validation and support
- send/receive tests from external domains
- booking created/rescheduled/cancelled test path
- finance invoice ingestion test
- CRM lead creation test
- support escalation test
- weekly digest confirmation
- board pack and post-launch support activation

## Legacy handling
Use 99_LEGACY logic:
- do not delete old folders or routing on first pass
- mirror and test before redirecting
- retain evidence of prior config
- archive after validation only
