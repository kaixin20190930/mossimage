import { spawnSync } from 'node:child_process';

function git(...args) {
  const result = spawnSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim();
    throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
  return result.stdout.trim();
}

try {
  if (git('status', '--porcelain')) {
    throw new Error('the working tree is not clean; commit and push every production change first');
  }

  const upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}');
  git('fetch', '--quiet', upstream.split('/')[0]);

  const head = git('rev-parse', 'HEAD');
  const remoteHead = git('rev-parse', '@{upstream}');
  if (head !== remoteHead) {
    throw new Error(`local HEAD ${head.slice(0, 12)} does not match ${upstream} ${remoteHead.slice(0, 12)}; push first and deploy that exact commit`);
  }

  process.stdout.write(`Production deploy gate passed: ${upstream} contains ${head.slice(0, 12)}.\n`);
} catch (error) {
  process.stderr.write(`Production deploy blocked: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
