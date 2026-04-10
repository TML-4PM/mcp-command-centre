begin;

insert into ops.system_registry (
  object_key,
  object_name,
  object_domain,
  object_type,
  biz_key,
  lifecycle_state,
  evidence_status,
  is_canonical,
  source_of_truth,
  notes
)
values
  ('supabase-control-spine', 'Supabase Control Spine', 'REGISTRY', 'platform', 'T4H', 'active', 'PARTIAL', true, 'supabase', 'Canonical operational spine'),
  ('reality-ledger', 'Reality Ledger', 'EVIDENCE', 'governance_system', 'T4H', 'active', 'PARTIAL', true, 'supabase', 'REAL vs PARTIAL vs PRETEND'),
  ('command-centre', 'Command Centre', 'UI', 'ops_surface', 'T4H', 'active', 'PARTIAL', true, 'supabase', 'Operational truth surface'),
  ('build-closure-system', 'Build Closure System', 'CLOSURE', 'closure_system', 'T4H', 'active', 'PARTIAL', true, 'supabase', 'Build closure and lock discipline'),
  ('runtime-work-queue', 'Runtime Work Queue', 'RUNTIME', 'queue', 'T4H', 'active', 'PARTIAL', true, 'supabase', 'Queue for autonomous work'),
  ('ui-snippet-registry', 'UI Snippet Registry', 'UI', 'snippet_store', 'T4H', 'active', 'PARTIAL', true, 'supabase', 'Canonical widget/snippet source'),
  ('integration-registry', 'Integration Registry', 'INTEGRATION', 'registry', 'T4H', 'active', 'PARTIAL', true, 'supabase', 'External integration control plane'),
  ('offer-registry', 'Offer Registry', 'COMMERCIAL', 'pricing_registry', 'T4H', 'active', 'PARTIAL', true, 'supabase', 'Commercial offer metadata')
on conflict (object_key) do update
set object_name = excluded.object_name,
    object_domain = excluded.object_domain,
    object_type = excluded.object_type,
    lifecycle_state = excluded.lifecycle_state,
    evidence_status = excluded.evidence_status,
    is_canonical = excluded.is_canonical,
    source_of_truth = excluded.source_of_truth,
    notes = excluded.notes,
    updated_at = now();

insert into public.t4h_ui_snippet (
  slug,
  version,
  is_active,
  content,
  metadata
)
values
  (
    'command-centre-default-layout',
    '1.0',
    true,
    '{"layout":[{"widget":"missing-evidence-board","zone":"top-left"},{"widget":"todays-action-queue","zone":"top-right"},{"widget":"registry-drift","zone":"bottom-left"},{"widget":"builds-ready-to-lock","zone":"bottom-right"}]}',
    jsonb_build_object('surface','command-centre','type','layout','owner','ops')
  )
on conflict (slug, version) do update
set is_active = excluded.is_active,
    content = excluded.content,
    metadata = excluded.metadata,
    updated_at = now();

commit;
