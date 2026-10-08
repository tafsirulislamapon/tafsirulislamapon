// Builds the whole profile as one designed page: off-white canvas with soft blue contour curves, holding the
// header, about, skills and selected work. Text is converted to outlines so it looks identical everywhere.
// Also writes a PNG copy (for LinkedIn, CVs, etc.).
// Usage: npm install && npm run build   (writes to ../../assets)
// Font: Google Sans (SIL Open Font License).
import opentype from "opentype.js";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const HERE = new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const OUT = process.argv[2] ?? `${HERE}out`;
const font = (w) => opentype.parse(readFileSync(`${HERE}fonts/google-sans_latin-${w}-normal.ttf`).buffer);
const F = { regular: font(400), medium: font(500) };

// ---------- content ----------
const NAME = "Md. Tafsirul Islam";
const ROLES = ["Automation Engineer", "Software Engineer", "Systems Designer & Analyst"];
const LINKS = ["github.com/tafsirulislamapon", "linkedin.com/in/tafsirul-islam"];
const NOW = "Currently learning game development";
const ABOUT = [
  [{ s: "I'm " }, { s: "Tafsir", strong: true }, { s: ", an automation engineer and software developer." }],
  "I design and build the systems businesses run on: CRM pipelines, integrations and automated workflows, along with the web and mobile software around them. I approach every project as a systems designer and analyst, starting with the process and the data before writing any code.",
];
const SKILLS = [
  {
    title: "Automation Engineering",
    cols: [
      ["GoHighLevel", "Zapier", "Workflow automation", "Webhooks", "REST API integrations"],
      ["OAuth 2.0", "CRM pipelines", "SMS & A2P compliance", "AI / LLM integrations", "Postman"],
    ],
  },
  {
    title: "Systems Design & Analysis",
    cols: [
      ["System architecture", "Requirements analysis", "Data modeling", "Process mapping"],
      ["Integration design", "API design", "Security reviews", "Performance & scale"],
    ],
  },
  {
    title: "Software Engineering",
    full: true,
    heads: ["Languages", "Web", "Mobile", "Backend", "Data & platform"],
    cols: [
      ["TypeScript", "JavaScript", "Python", "Java", "C / C++ / C#", "HTML & CSS"],
      ["React", "Next.js", "Tailwind CSS", "shadcn/ui", "GSAP"],
      ["React Native", "Expo", "NativeWind"],
      ["Node.js", "NestJS", "Express"],
      ["Supabase", "PostgreSQL", "Drizzle ORM", "Stripe", "Clerk", "Vercel", "Git & GitHub"],
    ],
  },
  {
    title: "Game Development",
    note: "Currently learning",
    full: true,
    cols: [["Game loops"], ["Physics & collisions"], ["Gameplay systems"], ["Level design"]],
  },
];
const WORK = [
  ["RAX", "Operations dashboard for GoHighLevel sub-accounts: pipelines, lead sources, SMS deliverability, calendars and setup changes in one place.", "Next.js, TypeScript, Supabase, Drizzle"],
  ["ReferIn", "Referral marketplace.", "Next.js, Supabase, Clerk, Stripe"],
  ["Risus", "Social app with AI reposts and tokens.", "React Native, Expo"],
  ["VectorX", "SaaS data visualization.", "Next.js, Supabase"],
  ["Natgrove", "Eco-awareness reward app.", "Expo, Supabase"],
  ["Coffee App", "Coffee ordering app.", "React Native, Tailwind"],
];

// ---------- palette: cool off-white page, navy ink, one calm blue ----------
const C = {
  page: "#F8F9FB", border: "#E3E8F0", ink: "#14233C", text: "#475467", muted: "#667085",
  accent: "#2F5FA7", rule: "#E3E8F0", sep: "#C5CEDB", curve: "#8FB0DD", wash: "#EAF1FA",
};
// WCAG: every text colour must reach 4.5:1 on the page.
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
for (const k of ["ink", "text", "muted", "accent"]) {
  const r = (Math.max(lum(C[k]), lum(C.page)) + 0.05) / (Math.min(lum(C[k]), lum(C.page)) + 0.05);
  if (r < 4.5) throw new Error(`${k} contrast ${r.toFixed(2)} < 4.5`);
}

// ---------- text as outlines ----------
const kern = (f, a, b) => {
  const k = f.getKerningValue(a, b);
  return Number.isFinite(k) ? k : 0;
};
const r1 = (v) => (Math.round(v * 10) / 10).toString();
function glyphD(g, x, y, scale) {
  let d = "";
  const X = (v) => r1(x + v * scale);
  const Y = (v) => r1(y - v * scale);
  for (const c of g.path.commands) {
    if (c.type === "M") d += `M${X(c.x)} ${Y(c.y)}`;
    else if (c.type === "L") d += `L${X(c.x)} ${Y(c.y)}`;
    else if (c.type === "Q") d += `Q${X(c.x1)} ${Y(c.y1)} ${X(c.x)} ${Y(c.y)}`;
    else if (c.type === "C") d += `C${X(c.x1)} ${Y(c.y1)} ${X(c.x2)} ${Y(c.y2)} ${X(c.x)} ${Y(c.y)}`;
    else if (c.type === "Z") d += "Z";
  }
  return d;
}
function measure(f, str, size, ls = 0) {
  const gs = [...str].map((c) => f.charToGlyph(c));
  const s = size / f.unitsPerEm;
  return gs.reduce((w, g, i) => w + g.advanceWidth * s + (gs[i + 1] ? kern(f, g, gs[i + 1]) * s + ls : 0), 0);
}
function text(str, { f, size, x, y, fill, ls = 0, anchor = "start" }) {
  const w = measure(f, str, size, ls);
  let cx = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
  const gs = [...str].map((c) => f.charToGlyph(c));
  const s = size / f.unitsPerEm;
  let d = "";
  gs.forEach((g, i) => {
    d += glyphD(g, cx, y, s);
    cx += g.advanceWidth * s + (gs[i + 1] ? kern(f, g, gs[i + 1]) * s + ls : 0);
  });
  return { svg: `<path d="${d}" fill="${fill}"/>`, w };
}
function runs(parts, x, y) {
  let cx = x, svg = "";
  for (const p of parts) {
    const t = text(p.s, { ...p, x: cx, y });
    svg += t.svg;
    cx += t.w;
  }
  return { svg, w: cx - x };
}
function wrap(str, f, size, maxW) {
  const lines = [];
  let cur = "";
  for (const word of str.split(" ")) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && measure(f, next, size) > maxW) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// ---------- soft contour curves ----------
function contours({ x0, y0, w, n, gap, amp, flip = false }) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const y = y0 + i * gap;
    const a = amp * (1 + i * 0.06);
    const s = flip ? -1 : 1;
    const d = `M${x0},${y} C${x0 + w * 0.28},${y - s * a} ${x0 + w * 0.62},${y + s * a * 0.9} ${x0 + w},${y - s * a * 0.35}`;
    const op = (0.62 - (i / n) * 0.38).toFixed(2);
    out += `<path d="${d}" fill="none" stroke="${C.curve}" stroke-width="1.3" stroke-opacity="${op}"/>`;
  }
  return out;
}

// ---------- page ----------
function page() {
  const W = 1200, L = 88, R = W - 88, CW = R - L;
  let body = "";
  let y = 0;

  // Header
  body += `<rect x="${L}" y="92" width="56" height="5" rx="2.5" fill="${C.accent}"/>`;
  body += text(NAME, { f: F.medium, size: 88, x: L - 3, y: 196, fill: C.ink, ls: -2 }).svg;
  const sep = { s: "   /   ", f: F.regular, size: 28, fill: C.sep };
  body += runs(ROLES.flatMap((r, i) => [...(i ? [sep] : []), { s: r, f: F.regular, size: 28, fill: C.text }]), L, 250).svg;
  body += `<line x1="${L}" y1="294" x2="${R}" y2="294" stroke="${C.rule}" stroke-width="2"/>`;
  body += runs(LINKS.flatMap((l, i) => [...(i ? [{ s: "     ·     ", f: F.regular, size: 20, fill: C.sep }] : []), { s: l, f: F.regular, size: 20, fill: C.muted }]), L, 336).svg;
  const now = text(NOW, { f: F.regular, size: 20, x: R, y: 336, fill: C.muted, anchor: "end" });
  body += `<circle cx="${R - now.w - 15}" cy="329" r="4.5" fill="${C.accent}"/>` + now.svg;
  y = 336;

  const section = (title) => {
    y += 96;
    body += text(title, { f: F.medium, size: 32, x: L, y, fill: C.ink, ls: -0.4 }).svg;
    y += 26;
  };

  // About
  section("About");
  y += 16;
  for (const p of ABOUT) {
    if (Array.isArray(p)) {
      y += 18;
      body += runs(p.map((r) => ({ s: r.s, f: r.strong ? F.medium : F.regular, size: 21, fill: r.strong ? C.ink : C.text })), L, y).svg;
      y += 22;
    } else {
      for (const line of wrap(p, F.regular, 21, CW - 60)) {
        y += 34;
        body += text(line, { f: F.regular, size: 21, x: L, y, fill: C.text }).svg;
      }
      y += 6;
    }
  }

  // Skills
  section("Skills");
  y += 26;
  const LINE = 35;
  const block = (b, x, w, top) => {
    let out = `<rect x="${x}" y="${top}" width="${w}" height="2" fill="${C.accent}"/>`;
    const tt = text(b.title, { f: F.medium, size: 24, x, y: top + 46, fill: C.ink, ls: -0.3 });
    out += tt.svg;
    if (b.note) out += text(b.note, { f: F.regular, size: 18, x: x + tt.w + 14, y: top + 46, fill: C.muted }).svg;
    const n = b.cols.length, colGap = 20;
    const cw = (w - colGap * (n - 1)) / n;
    let rows = 0;
    b.cols.forEach((items, i) => {
      const cx = x + i * (cw + colGap);
      let cy = top + 90;
      if (b.heads) {
        out += text(b.heads[i], { f: F.medium, size: 16, x: cx, y: cy, fill: C.accent }).svg;
        cy += LINE;
      }
      items.forEach((it, j) => (out += text(it, { f: F.regular, size: 19, x: cx, y: cy + j * LINE, fill: C.text }).svg));
      rows = Math.max(rows, items.length + (b.heads ? 1 : 0));
    });
    return { svg: out, h: 90 + (rows - 1) * LINE + 10 };
  };
  const gap = 48, half = (CW - gap) / 2;
  for (let i = 0; i < SKILLS.length; ) {
    if (SKILLS[i].full) {
      const r = block(SKILLS[i], L, CW, y);
      body += r.svg;
      y += r.h + gap;
      i += 1;
    } else {
      const a = block(SKILLS[i], L, half, y);
      const c = block(SKILLS[i + 1], L + half + gap, half, y);
      body += a.svg + c.svg;
      y += Math.max(a.h, c.h) + gap;
      i += 2;
    }
  }
  y -= gap;

  // Selected work
  section("Selected work");
  y += 20;
  const cols = [L, L + 190, L + 770];
  const widths = [170, 550, R - (L + 770)];
  ["Project", "Description", "Stack"].forEach((h, i) => (body += text(h, { f: F.medium, size: 16, x: cols[i], y: y + 18, fill: C.accent }).svg));
  y += 36;
  for (const [name, desc, stack] of WORK) {
    body += `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke="${C.rule}" stroke-width="1.5"/>`;
    const dl = wrap(desc, F.regular, 19, widths[1]);
    const sl = wrap(stack, F.regular, 18, widths[2]);
    const lines = Math.max(dl.length, sl.length, 1);
    const base = y + 38;
    body += text(name, { f: F.medium, size: 20, x: cols[0], y: base, fill: C.ink }).svg;
    dl.forEach((l, i) => (body += text(l, { f: F.regular, size: 19, x: cols[1], y: base + i * 30, fill: C.text }).svg));
    sl.forEach((l, i) => (body += text(l, { f: F.regular, size: 18, x: cols[2], y: base + i * 30, fill: C.muted }).svg));
    y = base + (lines - 1) * 30 + 22;
  }
  body += `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke="${C.rule}" stroke-width="1.5"/>`;

  const H = y + 230;
  const label = `${NAME}: ${ROLES.join(", ")}. ${ABOUT[1]}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<title>${esc(NAME)}</title>
<defs>
  <clipPath id="page"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28"/></clipPath>
  <linearGradient id="fadeR" x1="0" x2="1"><stop offset="0.42" stop-color="#fff" stop-opacity="0"/><stop offset="0.85" stop-color="#fff" stop-opacity="1"/></linearGradient>
  <linearGradient id="fadeL" x1="0" x2="1"><stop offset="0.2" stop-color="#fff" stop-opacity="1"/><stop offset="0.8" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="mR"><rect width="${W}" height="${H}" fill="url(#fadeR)"/></mask>
  <mask id="mL"><rect width="${W}" height="${H}" fill="url(#fadeL)"/></mask>
</defs>
<g clip-path="url(#page)">
  <rect width="${W}" height="${H}" fill="${C.page}"/>
  <path d="M${W * 0.55},0 C${W * 0.7},${70} ${W * 0.82},${10} ${W},${120} L${W},0 Z" fill="${C.wash}" opacity="0.8"/>
  <g mask="url(#mR)">${contours({ x0: 430, y0: 36, w: 840, n: 18, gap: 13, amp: 58 })}</g>
  <path d="M0,${H - 120} C${W * 0.2},${H - 50} ${W * 0.35},${H - 140} ${W * 0.55},${H} L0,${H} Z" fill="${C.wash}" opacity="0.8"/>
  <g mask="url(#mL)">${contours({ x0: -80, y0: H - 150, w: 900, n: 14, gap: 12, amp: 50, flip: true })}</g>
</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="none" stroke="${C.border}" stroke-width="2"/>
${body}
</svg>`;
}

mkdirSync(`${OUT}/png`, { recursive: true });
const svg = page();
writeFileSync(`${OUT}/profile.svg`, svg);
writeFileSync(`${OUT}/png/profile.png`, new Resvg(svg, { fitTo: { mode: "width", value: 2400 } }).render().asPng());
console.log("built");
