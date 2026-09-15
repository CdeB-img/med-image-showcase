import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
export const live = resolve('validation/protocol-designer-v1-multi-session-live-evidence-acquisition-01r');
export const mission = resolve('validation/protocol-designer-v1-multi-scenario-live-causal-repair-01');
export const baseline = JSON.parse(readFileSync(resolve(live, 'baseline.json'), 'utf8'));
export const rows = JSON.parse(readFileSync(resolve(live, 'waterfall.json'), 'utf8'));
export const findings = JSON.parse(readFileSync(resolve(live, 'findings.json'), 'utf8'));
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const recorded = (call: number) => {
  const row = rows[call - 1];
  const digest = row.raw_output_ref.split(':').at(-1);
  const file = readdirSync(resolve(baseline.evidenceRoot, 'raw')).find(name => name.endsWith(`-${digest}.json`));
  if (!file) throw new Error(`MISSING_RECORDED_RESPONSE:${call}`);
  const record = JSON.parse(readFileSync(resolve(baseline.evidenceRoot, 'raw', file), 'utf8'));
  const exchange = record.payload;
  if (hash(exchange.response.body) !== row.response_sha256) throw new Error('HISTORICAL_RESPONSE_DRIFT');
  const request = JSON.parse(exchange.request.body);
  const response = JSON.parse(exchange.response.body);
  const text = row.provider === 'OPENAI'
    ? response.output.flatMap((item: { content?: {text?: string}[] }) => item.content ?? []).map((c: {text?: string}) => c.text ?? '').join('')
    : response.candidates.flatMap((item: {content: {parts: {text?: string}[]}}) => item.content.parts).map((c: {text?: string}) => c.text ?? '').join('');
  return { row, exchange, request, response, text };
};
