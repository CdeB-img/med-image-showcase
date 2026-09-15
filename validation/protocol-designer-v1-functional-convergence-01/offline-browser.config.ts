import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import base from '../protocol-designer-v1-autonomous-adversarial-stabilization-01/offline-browser.config';

// Test evidence only. The frozen provider transport and product remain unchanged.
const observationReceipt: Plugin = {
  name: 'functional-convergence-browser-observation-receipt',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (request.url !== '/__functional_validation/receipt' || request.method !== 'POST') return next();
      try {
        const chunks: Buffer[] = [];
        let bytes = 0;
        for await (const chunk of request) {
          bytes += Buffer.byteLength(chunk);
          if (bytes > 2_000_000) throw new Error('OBSERVATION_TOO_LARGE');
          chunks.push(Buffer.from(chunk));
        }
        const payload = new URLSearchParams(Buffer.concat(chunks).toString('utf8')).get('observation');
        if (!payload) throw new Error('OBSERVATION_REQUIRED');
        const observation = JSON.parse(payload);
        if (!/^(A01|A02|A04|B01|F01)$/.test(observation.scenario)
          || !/^(T(?:0[1-9]|1[0-5])|REOPEN)$/.test(observation.turn)
          || observation.provenance !== 'CUA_VISIBLE_DOM_OBSERVATION'
          || typeof observation.dom !== 'string') throw new Error('OBSERVATION_SCOPE_INVALID');
        const directory = resolve('validation/protocol-designer-v1-functional-convergence-01/final-browser-evidence/observations');
        await mkdir(directory, { recursive: true, mode: 0o700 });
        await writeFile(resolve(directory, `${observation.scenario}-${observation.turn}.json`),
          JSON.stringify({ ...observation, receivedAt: new Date().toISOString() }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
        response.setHeader('content-type', 'text/html; charset=utf-8');
        response.end(`<p>Reçu enregistré : ${observation.scenario}-${observation.turn}</p>`);
      } catch (error) {
        response.statusCode = 400;
        response.end(String(error));
      }
    });
  },
};

export default defineConfig({ ...base, plugins: [observationReceipt, ...(base.plugins ?? [])] });
