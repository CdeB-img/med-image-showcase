// Test-only loader: execute exact historical Git sources, not current modules
// relabelled as old. No checkout, deployment, provider or user-data access.
import { execFileSync } from 'node:child_process';
import { posix } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
export const loadHistoricalGuard = async () => {
  const commit = 'd4156da36ff03e4175b91fca97ce8a875ef4e3bf';
  const sources = new Map();
  const read = path => {
    if (!sources.has(path)) sources.set(path, execFileSync('git', ['show', `${commit}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
    return sources.get(path);
  };
  const result = await build({ entryPoints: ['server/protocol-designer-durable-guard.ts'], write: false, bundle: true,
    format: 'esm', platform: 'node', logLevel: 'silent', plugins: [{ name: 'exact-historical-git-source', setup(api) {
      api.onResolve({ filter: /.*/u }, args => {
        if (args.path.startsWith('node:')) return { path: args.path, external: true };
        if (!args.path.startsWith('.') && args.kind !== 'entry-point') return { path: pathToFileURL(require.resolve(args.path)).href, external: true };
        const requested = args.kind === 'entry-point' ? args.path : posix.normalize(posix.join(posix.dirname(args.importer), args.path));
        for (const path of [requested.replace(/\.js$/u, '.ts'), requested]) {
          try { read(path); return { path, namespace: 'git-snapshot' }; } catch { /* Try the exact original extension. */ }
        }
        throw new Error(`HISTORICAL_RUNTIME_SOURCE_MISSING:${requested}`);
      });
      api.onLoad({ filter: /.*/u, namespace: 'git-snapshot' }, args => ({ contents: read(args.path), loader: args.path.endsWith('.ts') ? 'ts' : 'js' }));
    } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
};
