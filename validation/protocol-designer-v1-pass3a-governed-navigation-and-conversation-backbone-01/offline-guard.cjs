// Mission-only preload. No product configuration or user credential is changed.
const fs = require('node:fs');
const net = require('node:net');
const tls = require('node:tls');
const { syncBuiltinESMExports } = require('node:module');
const secretNames = new Set(['OPENAI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY']);
const originalEnvironment = process.env;
// Only this isolated process receives a sanitized copy; secret values are never read.
process.env = Object.fromEntries(Object.keys(originalEnvironment)
  .filter(key => !secretNames.has(key)).map(key => [key, originalEnvironment[key]]));
const isEnvironmentFile = value => /(?:^|\/)\.env(?:\.[^/]*)?$/.test(String(value))
  && !/(?:^|\/)\.env\.local\.example$/.test(String(value));
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
const deny = () => { throw new Error('PASS3A_OFFLINE_GUARD_NETWORK_FORBIDDEN'); };
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(...args) {
  const options = typeof args[0] === 'object' && !Array.isArray(args[0]) ? args[0] : null;
  // IPC pipes are local process coordination, never a TCP destination.
  if ((options?.path && !options.port) || (typeof args[0] === 'string' && !/^\d+$/.test(args[0]))) {
    return originalConnect.apply(this, args);
  }
  return deny();
};
tls.connect = deny;
globalThis.fetch = async () => deny();
syncBuiltinESMExports();
