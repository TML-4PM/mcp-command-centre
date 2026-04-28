export type OpsState = 'FLOW' | 'DRIFT' | 'BLOCKED' | 'OPPORTUNITY' | 'PROOF_GAP';

export type SlackEvent = {
  channel_key: string;
  event_type: string;
  state: OpsState;
  severity: number;
  title: string;
  body: string;
  source?: string;
  source_url?: string;
  evidence_links?: string[];
};

const channelMap: Record<string, string> = {
  command_centre: 'SLACK_WEBHOOK_COMMAND_CENTRE',
  alerts: 'SLACK_WEBHOOK_ALERTS',
  drift: 'SLACK_WEBHOOK_DRIFT',
  proof_gap: 'SLACK_WEBHOOK_PROOF_GAP',
  execution_log: 'SLACK_WEBHOOK_EXECUTION_LOG',
  opportunities: 'SLACK_WEBHOOK_OPPORTUNITIES'
};

export function selectSlackChannel(event: SlackEvent): string {
  if (event.state === 'BLOCKED' || event.severity >= 4) return 'alerts';
  if (event.state === 'DRIFT') return 'drift';
  if (event.state === 'PROOF_GAP') return 'proof_gap';
  if (event.state === 'OPPORTUNITY') return 'opportunities';
  return event.channel_key || 'command_centre';
}

export function buildSlackMessage(event: SlackEvent): string {
  const evidence = (event.evidence_links || []).join('\n');
  return [
    `*${event.state} / Severity ${event.severity}: ${event.title}*`,
    event.body,
    event.source ? `Source: ${event.source}` : undefined,
    event.source_url ? `Source URL: ${event.source_url}` : undefined,
    evidence ? `Evidence:\n${evidence}` : undefined
  ].filter(Boolean).join('\n');
}

export function routeSlackEvent(event: SlackEvent) {
  const channel = selectSlackChannel(event);
  return {
    routed: true,
    channel,
    webhook_env: channelMap[channel] || channelMap.command_centre,
    message: buildSlackMessage(event),
    reality_status: 'PARTIAL_UNTIL_POSTED'
  };
}
