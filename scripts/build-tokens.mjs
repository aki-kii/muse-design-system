#!/usr/bin/env node
// tokens/tokens.json から tokens/tokens.css を作る。依存パッケージなし。
//   node scripts/build-tokens.mjs          … tokens.css を書き出す
//   node scripts/build-tokens.mjs --check  … tokens.css が tokens.json と一致しているかだけ確かめる
// CSS に出すのは semantic 層と、文字サイズのスケールだけ。primitive は直接使わせない。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = join(root, 'tokens/tokens.json');
const cssPath = join(root, 'tokens/tokens.css');
const tokens = JSON.parse(readFileSync(jsonPath, 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const get = (path) => {
  const node = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), tokens);
  if (!node || !('$value' in node)) throw new Error(`参照先が見つからない: {${path}}`);
  return node.$value;
};
const resolve = (v) => {
  if (typeof v === 'string') {
    const m = v.match(/^\{(.+)\}$/);
    return m ? resolve(get(m[1])) : v;
  }
  if (Array.isArray(v)) return v.map((f) => (/[\s]/.test(f) ? `"${f}"` : f)).join(', ');
  return String(v);
};

// semantic のグループ → CSS 変数名の付け方
const groups = [
  ['color', (k) => `--${k}`],
  ['shadow', (k) => `--shadow-${k}`],
  ['radius', (k) => `--radius-${k}`],
  ['space', (k) => `--space-${k}`],
  ['size', (k) => `--size-${k}`],
];
const light = [];
const dark = [];
for (const [group, name] of groups) {
  for (const [key, t] of Object.entries(tokens.semantic[group])) {
    if (key.startsWith('$')) continue;
    light.push([name(key), resolve(t.$value), t.$description]);
    const d = t.$extensions?.['com.muse.modes']?.dark;
    if (d) dark.push([name(key), resolve(d)]);
  }
}
light.push(['--font-sans', resolve(tokens.semantic.font.family.sans.$value)]);
light.push(['--font-mono', resolve(tokens.semantic.font.family.mono.$value)]);
const size = tokens.primitive.font.size;
const lh = tokens.primitive.font['line-height'];
for (const k of Object.keys(size).filter((k) => !k.startsWith('$'))) {
  light.push([`--text-${k}`, size[k].$value]);
  light.push([`--text-${k}--line-height`, lh[k].$value]);
}

const decl = (rows, indent) =>
  rows.map(([n, v, c]) => `${indent}${n}: ${v};${c ? ` /* ${c} */` : ''}`).join('\n');
const darkDecl = (indent) => decl(dark, indent);

const css = `/* Muse DS v${pkg.version} — tokens/tokens.json から生成。直接編集しない。
   作り直し: node scripts/build-tokens.mjs */

:root {
  color-scheme: light dark;
${decl(light, '  ')}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${darkDecl('    ')}
  }
}

:root[data-theme="dark"] {
${darkDecl('  ')}
}
`;

if (process.argv.includes('--check')) {
  const current = readFileSync(cssPath, 'utf8');
  if (current !== css) {
    console.error('tokens.css が tokens.json と一致していない。node scripts/build-tokens.mjs で作り直す。');
    process.exit(1);
  }
  console.log('tokens.css は tokens.json と一致している。');
} else {
  writeFileSync(cssPath, css);
  console.log(`書き出した: ${cssPath}`);
}
