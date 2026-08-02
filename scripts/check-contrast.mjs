#!/usr/bin/env node
/**
 * Fails if any colour pairing the UI actually uses drops below WCAG AA.
 *
 * This exists because the palette silently regressed once: secondary text
 * drifted onto a value at 3.54:1 in 34 places while the README claimed AA
 * throughout. A comment asserting good contrast is not a check.
 *
 *   node scripts/check-contrast.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles.css'), 'utf8');

/** Every --color-* declaration, including semantic aliases. */
const raw = Object.fromEntries(
  [...css.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
);

/** Resolves `var(--color-x)` chains down to a hex value. */
function resolve(name, seen = new Set()) {
  if (name === 'white') return '#ffffff';
  if (seen.has(name)) throw new Error(`Circular colour reference at --color-${name}`);
  seen.add(name);

  const value = raw[name];
  if (!value) throw new Error(`Unknown colour token: --color-${name}`);

  const ref = value.match(/^var\(--color-([a-z0-9-]+)\)$/);
  return ref ? resolve(ref[1], seen) : value;
}

const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [la, lb] = [luminance(resolve(a)), luminance(resolve(b))];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * `large` means >=18.66px bold or >=24px regular, where AA allows 3:1.
 * Anything rendered at body size must clear 4.5:1.
 */
const PAIRS = [
  // Text on light surfaces
  ['ink', 'page', 'body text', 'normal'],
  ['ink', 'surface', 'text on cards', 'normal'],
  ['ink-soft', 'page', 'prose', 'normal'],
  ['ink-soft', 'surface', 'card body', 'normal'],
  ['ink-soft', 'sunken', 'text on sunken bands', 'normal'],
  ['ink-muted', 'page', 'eyebrows, hints, counts', 'normal'],
  ['ink-muted', 'surface', 'field hints, placeholders', 'normal'],
  ['ink-muted', 'sunken', 'hints on sunken bands', 'normal'],
  ['forest-950', 'page', 'headings', 'large'],
  ['forest-950', 'surface', 'headings on cards', 'large'],
  ['forest-700', 'surface', 'inline links', 'normal'],
  ['forest-700', 'page', 'inline links on page', 'normal'],
  ['forest-700', 'sunken', 'links on sunken bands', 'normal'],
  ['danger', 'surface', 'form errors', 'normal'],
  ['danger', 'danger-soft', 'error alert text', 'normal'],
  ['success', 'success-soft', 'success chip', 'normal'],

  // Text on dark surfaces
  ['ink-inverse', 'inverse', 'text on green bands', 'normal'],
  ['ink-on-dark', 'inverse', 'body on green bands', 'normal'],
  ['ink-on-dark-muted', 'inverse', 'labels on green bands', 'normal'],
  ['ochre-300', 'inverse', 'figures on green bands', 'large'],

  // Solid fills carrying text
  ['ink-inverse', 'accent', 'Donate button', 'normal'],
  ['ink-inverse', 'accent-hover', 'Donate button, hover', 'normal'],
  ['ink-inverse', 'primary', 'primary button', 'normal'],
  ['ink-inverse', 'primary-hover', 'primary button, hover', 'normal'],
  ['forest-950', 'accent-bright', 'button on dark bands', 'normal'],
  ['ink-inverse', 'forest-800', 'active nav pill', 'normal'],
  ['ochre-900', 'ochre-100', 'accent chip', 'normal'],

  // Footer newsletter sits on the darkest green, not the band colour.
  ['ink-inverse', 'forest-950', 'newsletter input text', 'normal'],
  ['ink-on-dark-muted', 'forest-950', 'newsletter placeholder', 'normal'],
  ['forest-950', 'ochre-500', 'newsletter sign-up button', 'normal'],
  ['ink-on-dark', 'forest-950', 'footer body on darkest green', 'normal'],
];

/** Non-text contrast (borders, focus rings, state dots) needs 3:1. */
const NON_TEXT = [
  ['line-strong', 'surface', 'input borders'],
  ['line-strong', 'page', 'input borders on page'],
  ['ochre-700', 'surface', 'focus ring'],
  ['ochre-700', 'page', 'focus ring on page'],
  ['forest-800', 'page', 'active pill fill'],
];

let failures = 0;
const rows = [];

for (const [fg, bg, where, size] of PAIRS) {
  const ratio = contrast(fg, bg);
  const required = size === 'large' ? 3 : 4.5;
  const pass = ratio >= required;
  if (!pass) failures++;
  rows.push([pass, ratio, required, `${fg} on ${bg}`, where]);
}

for (const [fg, bg, where] of NON_TEXT) {
  const ratio = contrast(fg, bg);
  const pass = ratio >= 3;
  if (!pass) failures++;
  rows.push([pass, ratio, 3, `${fg} on ${bg}`, `${where} (non-text)`]);
}

const width = Math.max(...rows.map((r) => r[3].length));
for (const [pass, ratio, required, pair, where] of rows) {
  const mark = pass ? '  ok ' : 'FAIL ';
  console.log(
    `${mark} ${pair.padEnd(width)}  ${ratio.toFixed(2).padStart(6)} : 1  (needs ${required})  ${where}`,
  );
}

console.log();
if (failures > 0) {
  console.error(`${failures} contrast failure${failures === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log(`All ${rows.length} pairings meet WCAG AA.`);
