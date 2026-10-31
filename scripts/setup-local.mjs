import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const path = '.dev.vars';
if (!existsSync(path)) {
  const template = readFileSync('.dev.vars.example', 'utf8');
  writeFileSync(path, template.replace('APP_SECRET=""', `APP_SECRET="${randomBytes(32).toString('hex')}"`), { mode: 0o600 });
  console.log('Created .dev.vars with a random APP_SECRET. Generation remains disabled.');
} else {
  console.log('.dev.vars already exists; existing configuration was preserved.');
}
