import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
// ASSETS is used by production preview. Next serves pages during hot-reload dev.
if (!existsSync('out')) mkdirSync('out');
const children = [
  spawn('node', ['node_modules/wrangler/bin/wrangler.js', 'dev', '--local', '--var', 'LOCAL_DEV:true', '--var', 'APP_ORIGIN:http://127.0.0.1:3007'], { stdio: 'inherit' }),
  spawn('node', ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3007'], { stdio: 'inherit' }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}
for (const child of children) {
  child.on('error', () => stop(1));
  child.on('exit', code => stop(code ?? 0));
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
