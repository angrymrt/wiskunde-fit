// Telt de tokens van een sessie van Claude Code per agent, om te meten wat een hoofdstuk kost (#88).
//
//   node scripts/tokens.js <sessie.jsonl> [nog een sessie.jsonl ...]
//
// De logboeken staan in ~/.claude/projects/<map van de repo>/<sessie-id>.jsonl, en die van de agents
// in <sessie-id>/subagents/. Het script neemt die vanzelf mee.
//
// Wat telt, is vooral hoe vaak een agent zijn hele context opnieuw leest: dat gebeurt bij elke stap.
// De kosten zijn dus ongeveer het aantal stappen maal de gemiddelde context. Het gewicht is een
// schatting naar de prijzen van de API, uitgedrukt in invoertokens van Opus. Hoe zwaar een
// abonnement elk model telt, kan anders zijn; vergelijk dus vooral hoofdstukken met elkaar.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const GEWICHT = { input: 1, cacheWrite: 2, cacheRead: 0.1, output: 5 };
const MODEL = { opus: 1, sonnet: 0.6, haiku: 0.2 };

const sessies = process.argv.slice(2);
if (!sessies.length) {
  console.error('Gebruik: node scripts/tokens.js <sessie.jsonl> [...]');
  process.exit(1);
}

function bestanden(sessie) {
  const map = join(dirname(sessie), basename(sessie, '.jsonl'), 'subagents');
  const agents = existsSync(map) ? readdirSync(map).filter((f) => f.endsWith('.jsonl')) : [];
  return [
    { naam: 'hoofdsessie', pad: sessie },
    ...agents.map((f) => ({ naam: null, pad: join(map, f) })),
  ];
}

function tel({ naam, pad }) {
  const gezien = new Set();
  const t = { naam, model: '', stappen: 0, input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  for (const regel of readFileSync(pad, 'utf8').split('\n')) {
    if (!regel) continue;
    let j;
    try {
      j = JSON.parse(regel);
    } catch {
      continue;
    }
    if (!t.naam && j.type === 'user') {
      const c = j.message?.content;
      const tekst = typeof c === 'string' ? c : (c?.find?.((x) => x.type === 'text')?.text ?? '');
      // Een opdracht begint vaak met dezelfde uitleg over de repo; de taak zegt meer.
      const taak = tekst.split(/\*\*Jouw taak:\*\*/i)[1] ?? tekst;
      const id = basename(pad, '.jsonl').replace('agent-', '').slice(0, 7);
      t.naam = `${id}: ${taak
        .replace(/[*`\s]+/g, ' ')
        .trim()
        .slice(0, 50)}`;
    }
    const m = j.message;
    // Een antwoord kan in stukken in het logboek staan, met hetzelfde id en hetzelfde gebruik.
    if (!m?.usage || !m.id || gezien.has(m.id)) continue;
    gezien.add(m.id);
    t.model = m.model ?? t.model;
    t.stappen++;
    t.input += m.usage.input_tokens ?? 0;
    t.cacheWrite += m.usage.cache_creation_input_tokens ?? 0;
    t.cacheRead += m.usage.cache_read_input_tokens ?? 0;
    t.output += m.usage.output_tokens ?? 0;
  }
  const factor = Object.entries(MODEL).find(([k]) => t.model.includes(k))?.[1] ?? 1;
  t.gewogen = factor * Object.entries(GEWICHT).reduce((s, [k, w]) => s + t[k] * w, 0);
  return t;
}

const rijen = sessies
  .flatMap(bestanden)
  .map(tel)
  .filter((t) => t.stappen);
const totaal = rijen.reduce((s, t) => s + t.gewogen, 0);
const k = (n) => `${Math.round(n / 1000)}k`;
const M = (n) => (n / 1e6).toFixed(1).replace('.', ',');

console.log('| Agent | Model | Stappen | Gem. context | Output | Gewogen (M) | Aandeel |');
console.log('| --- | --- | --: | --: | --: | --: | --: |');
for (const t of rijen.sort((a, b) => b.gewogen - a.gewogen)) {
  const context = (t.input + t.cacheWrite + t.cacheRead) / t.stappen;
  const aandeel = Math.round((100 * t.gewogen) / totaal);
  const model = t.model.replace('claude-', '');
  console.log(
    `| ${t.naam} | ${model} | ${t.stappen} | ${k(context)} | ${k(t.output)} | ${M(t.gewogen)} | ${aandeel}% |`,
  );
}
console.log(`\nTotaal gewogen: ${M(totaal)} miljoen invoertokens van Opus.`);
