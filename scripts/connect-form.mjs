// Connects a Google Form to the site. Usage:
//   node scripts/connect-form.mjs order    "<pre-filled link>"
//   node scripts/connect-form.mjs feedback "<pre-filled link>"
// The pre-filled link comes from the form's three-dot menu > "Get pre-filled link", with EVERY question answered.
// Entry IDs are matched to fields by the order of the questions, so the form must keep the order in SETUP below.
import { readFileSync, writeFileSync } from 'node:fs';

const SETUP = {
  order: { cfg: 'ORDER_FORM', fields: ['mode', 'name', 'contact', 'drink', 'quantity', 'channel', 'location', 'slot', 'gcash', 'notes'] },
  feedback: { cfg: 'FEEDBACK_FORM', fields: ['rating', 'nextFlavor', 'comment', 'name'] },
};
const [, , kind, link] = process.argv;
if (!SETUP[kind] || !link) { console.error('Usage: node scripts/connect-form.mjs <order|feedback> "<pre-filled link>"'); process.exit(1); }

const u = new URL(link);
const m = u.pathname.match(/^\/forms\/d\/e\/([^/]+)\/viewform/);
if (!m) { console.error('That is not a Google Forms pre-filled link (it should contain /forms/d/e/.../viewform).'); process.exit(1); }
const ids = [...u.searchParams.keys()].filter((k) => /^entry\.\d+$/.test(k));
const { cfg, fields } = SETUP[kind];
if (ids.length !== fields.length) {
  console.error(`Expected ${fields.length} answered questions (${fields.join(', ')}), found ${ids.length}. Answer every question before copying the link.`);
  process.exit(1);
}
const entry = Object.fromEntries(fields.map((f, i) => [f, ids[i]]));
const action = `https://docs.google.com/forms/d/e/${m[1]}/formResponse`;
const view = `https://docs.google.com/forms/d/e/${m[1]}/viewform`;

let src = readFileSync('src/config.js', 'utf8');
const block = new RegExp(`(${cfg}: \\{\\s*\\n)([\\s\\S]*?)(\\n  \\},)`);
if (!block.test(src)) { console.error(`Could not find ${cfg} in src/config.js`); process.exit(1); }
src = src.replace(block, (_, a, body, c) => {
  body = body
    .replace(/ACTION: '[^']*'/, `ACTION: '${action}'`)
    .replace(/VIEW_URL: '[^']*'/, `VIEW_URL: '${view}'`)
    .replace(/ENTRY: \{[^}]*\}/, `ENTRY: { ${fields.map((f) => `${f}: '${entry[f]}'`).join(', ')} }`);
  return a + body + c;
});
writeFileSync('src/config.js', src);
console.log(`${cfg} connected:`);
for (const f of fields) console.log(`  ${f.padEnd(10)} ${entry[f]}`);
console.log('Now run: npm run build, then commit and push to redeploy.');
