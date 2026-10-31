import { execFileSync } from 'node:child_process';
import { contentLastModified, contentSourceFiles } from '../lib/content-dates';

function git(args: string[]) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

let commitCount = 0;
try {
  commitCount = Number(git(['rev-list', '--count', 'HEAD']));
} catch {
  // A newly initialized repository has no HEAD yet.
}

if (commitCount < 2) {
  console.log('content-date check skipped: at least two Git commits are required for a source diff.');
  process.exit(0);
}

const changed = new Set(git(['diff', '--name-only', 'HEAD^', 'HEAD']).split('\n').filter(Boolean));
const commitDate = git(['show', '-s', '--format=%cs', 'HEAD']);
const stale: string[] = [];

for (const [route, sources] of Object.entries(contentSourceFiles)) {
  if (sources.some(source => changed.has(source)) && contentLastModified[route] !== commitDate) {
    stale.push(`/${route}: expected ${commitDate}, found ${contentLastModified[route] || 'no explicit date'}`);
  }
}

if (stale.length) {
  console.error(`Content dates are stale:\n${stale.join('\n')}`);
  process.exit(1);
}

console.log(`content-date check passed for commit ${commitDate}.`);
