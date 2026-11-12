// Zet tekst om naar wiskundezetting in HTML. Zie "T-notatie" in AGENTS.md.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* T zet een regel tekst om naar wiskundezetting: losse letters cursief, {a/b} is een breuk, * is een maalpunt. */
function T(s) {
  s = String(s);
  let o = '';
  const re =
    /\{[^{}]*\}|\^[0-9a-zA-Z]+|_[0-9A-Za-z]+|[FZ]-hoek[a-z]*|[A-Za-zÀ-ÿ]+|\d+(?:[.,]\d+)?|\s+|[\s\S]/g;
  let m;
  while ((m = re.exec(s))) {
    const t = m[0],
      i = m.index,
      p = s[i - 1] || '',
      n = s[i + t.length] || '';
    if (t[0] === '{' && t.length > 2) {
      const b = t.slice(1, -1);
      let k;
      if ((k = b.match(/^(-?)(\d+) (\d+)\/(\d+)$/)))
        o += `${k[1] ? '−' : ''}${k[2]}<span class="f"><span>${k[3]}</span><span>${k[4]}</span></span>`;
      else {
        const c = b.lastIndexOf('/');
        o += `<span class="f"><span>${T(b.slice(0, c))}</span><span>${T(b.slice(c + 1))}</span></span>`;
      }
    } else if (t[0] === '^' && t.length > 1) o += `<sup>${T(t.slice(1))}</sup>`;
    else if (t[0] === '_' && t.length > 1) o += `<sub>${T(t.slice(1))}</sub>`;
    else if (/^[FZ]-hoek/.test(t)) o += t;
    else if (/^[A-Za-z]$|^[A-Z]{2,4}$|^[ab]x$/.test(t)) o += `<span class="v">${t}</span>`;
    else if (t === '-') o += /[A-Za-zÀ-ÿ]/.test(p) && /[A-Za-zÀ-ÿ]/.test(n) ? '-' : '−';
    else if (t === '*') o += '·';
    else o += esc(t);
  }
  return o;
}
const vt = (top, bot) =>
  `<table class="vt"><tr>${top.map((c) => `<td>${T(c)}</td>`).join('')}</tr><tr>${bot.map((c) => `<td>${T(c)}</td>`).join('')}</tr></table>`;
// Een tabel met veel kolommen kan op een telefoon opzij schuiven. Geef die een naam (label): dan kun
// je hem ook met het toetsenbord schuiven. De naam is uniek op het scherm.
const dt = (rows, label) =>
  `<div class="scroll"${label ? ` role="region" tabindex="0" aria-label="${esc(label).replace(/"/g, '&quot;')}"` : ''}><table class="dt">${rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td>${T(c)}</td>` : `<th>${T(c)}</th>`)).join('')}</tr>`).join('')}</table></div>`;
const stepsHTML = (st) =>
  `<ul class="steps">${st.map((s) => `<li>${typeof s === 'string' ? T(s) : s.h}</li>`).join('')}</ul>`;

export { esc, T, vt, dt, stepsHTML };
