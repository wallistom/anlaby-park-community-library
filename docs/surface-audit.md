# Surface audit

Finds places where one surface blends into the one behind it: a card the same
colour as its section, or a band the same colour as the one above it.

This has to run against the **rendered DOM**, not the templates. A static parse
cannot resolve `bg-page` inherited through three transparent wrappers, and it
reports consecutive transparent sections as collisions when they are simply the
same continuous canvas. Both produced false readings when this was first
attempted; the numbers below came from the rendered check.

## Running it

Start the dev server, open the site, and paste the script into the console (or
run it through the Chrome tooling). It navigates the SPA itself and reports one
line per page.

```js
const lum = (r, g, b) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
const cr = (a, b) => {
  const [la, lb] = [lum(...a), lum(...b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
const hx = (c) =>
  '#' +
  c
    .slice(0, 3)
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('');

/** An element's own background, only if it is effectively opaque. */
const own = (el) => {
  const c = parse(getComputedStyle(el).backgroundColor);
  return c.length >= 3 && (c[3] === undefined || c[3] > 0.9) ? c.slice(0, 3) : null;
};

/** Cards that are within 1.06:1 of whatever they sit on. */
const cards = () => {
  const anc = (el) => {
    let n = el.parentElement;
    while (n) {
      const c = own(n);
      if (c) return c;
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  const out = [];
  document
    .querySelectorAll(
      '.card,[class*="rounded-2xl"][class*="border"],[class*="rounded-xl"][class*="border"]',
    )
    .forEach((el) => {
      const bg = own(el);
      if (!bg) return;
      const r = el.getBoundingClientRect();
      if (r.height < 40 || r.width < 80) return;
      const q = cr(bg, anc(el));
      if (q < 1.06) out.push(`${hx(bg)} on ${hx(anc(el))} r=${q.toFixed(3)}`);
    });
  return out;
};

/**
 * The full-width band sequence down the page, with page-coloured gaps filled
 * in — a transparent section is still a band to the eye.
 */
const scan = () => {
  const W = document.documentElement.clientWidth;
  const H = document.documentElement.scrollHeight;
  const PAGE = parse(getComputedStyle(document.body).backgroundColor).slice(0, 3);
  const raw = [...document.querySelectorAll('body *')]
    .map((el) => {
      const c = parse(getComputedStyle(el).backgroundColor);
      if (c.length < 3 || (c[3] !== undefined && c[3] < 0.9)) return null;
      const r = el.getBoundingClientRect();
      if (r.width < W * 0.95 || r.height < 40) return null;
      return {
        top: Math.round(r.top + scrollY),
        bot: Math.round(r.bottom + scrollY),
        rgb: c.slice(0, 3),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.top - b.top || b.bot - a.bot);

  const cov = [];
  for (const b of raw) if (!cov.some((c) => b.top >= c.top && b.bot <= c.bot)) cov.push(b);

  const seq = [];
  let y = 0;
  for (const b of cov) {
    if (b.top > y + 8) seq.push({ top: y, rgb: PAGE });
    seq.push(b);
    y = Math.max(y, b.bot);
  }
  if (H > y + 8) seq.push({ top: y, rgb: PAGE });

  return seq
    .map((b, i) => (i ? +cr(b.rgb, seq[i - 1].rgb).toFixed(3) : null))
    .filter((x) => x !== null);
};

const go = async (p) => {
  const l = [...document.querySelectorAll('a[href]')].find((a) => a.getAttribute('href') === p);
  if (l) l.click();
  await new Promise((r) => setTimeout(r, 800));
};

const PAGES = [
  '/',
  '/whats-on',
  '/activities',
  '/visit',
  '/room-hire',
  '/volunteer',
  '/about',
  '/contact',
  '/support',
  '/privacy',
];
const out = [];
for (const p of PAGES) {
  await go(p);
  await new Promise((r) => setTimeout(r, 450));
  const c = cards();
  out.push(
    `${p.padEnd(12)} blendingCards=${c.length} minBandStep=${Math.min(...scan()).toFixed(3)}` +
      (c.length ? ` :: ${c.join(' | ')}` : ''),
  );
}
console.log(out.join('\n'));
```

## What passing looks like

`blendingCards=0` everywhere, and `minBandStep` at or above 1.09.

Anything flagged is a real collision — a fill sitting on its own neighbour in
the ladder. The fix is in `CLAUDE.md` under the surface-ladder rule; it is
almost always "move the callout to `bg-sunken`" or "put the section carrying a
white card on `bg-sunken`".

## Notes

- Run it at a narrow width too. Chrome on macOS will not resize below ~400px,
  so load the pages in a 390px iframe — media queries follow iframe width.
- The scroll-reveal directive holds elements at `opacity: 0` until they
  intersect. Clear inline `opacity`/`transform` before screenshotting, or the
  capture shows half-faded content.
- The admin area is `bg-sunken` with white cards throughout, a 1.23:1 step, and
  is not covered by the loop above because it sits behind Google sign-in.
