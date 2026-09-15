// Isolated mission preload. Permits only an explicit loopback server port and local IPC.
// Real provider sockets, TLS and .env reads remain forbidden.
const fs = require('node:fs');
const net = require('node:net');
const tls = require('node:tls');
const { syncBuiltinESMExports } = require('node:module');
const secretNames = new Set(['OPENAI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY']);
const originalEnvironment = process.env;
process.env = Object.fromEntries(Object.keys(originalEnvironment)
  .filter(key => !secretNames.has(key)).map(key => [key, originalEnvironment[key]]));
const allowedPort = Number(process.env.NOXIA_ADVERSARIAL_PORT || 5201);
if (!Number.isInteger(allowedPort) || allowedPort < 1024 || allowedPort > 65535) {
  throw new Error('ADVERSARIAL_OFFLINE_GUARD_PORT_INVALID');
}
const isEnvironmentFile = value => /(?:^|\/)\.env(?:\.[^/]*)?$/.test(String(value));
const empty = options => typeof options === 'string' || options?.encoding ? '' : Buffer.alloc(0);
const readSync = fs.readFileSync;
fs.readFileSync = function(file, options) {
  return isEnvironmentFile(file) ? empty(options) : readSync.apply(this, arguments);
};
const readAsync = fs.readFile;
fs.readFile = function(file, options, callback) {
  if (!isEnvironmentFile(file)) return readAsync.apply(this, arguments);
  const cb = typeof options === 'function' ? options : callback;
  queueMicrotask(() => cb(null, empty(typeof options === 'function' ? undefined : options)));
};
const readPromise = fs.promises.readFile.bind(fs.promises);
fs.promises.readFile = async (file, options) => isEnvironmentFile(file) ? empty(options) : readPromise(file, options);
const deny = () => { throw new Error('ADVERSARIAL_OFFLINE_GUARD_EXTERNAL_NETWORK_FORBIDDEN'); };
const allowed = (host, port) => ['127.0.0.1', '::1', '[::1]', 'localhost'].includes(String(host)) && Number(port) === allowedPort;
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(...args) {
  // Node may pass its internally normalized [options, callback] form.
  const normalized = Array.isArray(args[0]) ? args[0] : args;
  const options = typeof normalized[0] === 'object' ? normalized[0] : null;
  if ((options?.path && !options.port) || (typeof normalized[0] === 'string' && !/^\d+$/.test(normalized[0]))) {
    return originalConnect.apply(this, args);
  }
  const port = options?.port ?? normalized[0];
  const host = options?.host ?? (typeof normalized[1] === 'string' ? normalized[1] : 'localhost');
  if (allowed(host, port)) return originalConnect.apply(this, args);
  return deny();
};
tls.connect = deny;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (resource, init) => {
  const target = new URL(typeof resource === 'object' && resource !== null && 'url' in resource ? resource.url : String(resource));
  if (target.protocol !== 'http:' || !allowed(target.hostname, target.port || 80)) return deny();
  return originalFetch(resource, { ...init, redirect: 'error' });
};
syncBuiltinESMExports();
