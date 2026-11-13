// Telt de tokens van een sessie van Claude Code per agent, om te meten wat een issue of een
// hoofdstuk kost (#88).
//
//   node scripts/tokens.js <sessie.jsonl> [nog een sessie.jsonl ...]           tabel per agent
//   node scripts/tokens.js --per-issue <sessie.jsonl> [...]                    tabel per issue en rol
//   node scripts/tokens.js --per-issue --bord <sessie.jsonl> [...]             en zet het op het bord
//
// De logboeken staan in ~/.claude/projects/<map van de repo>/<sessie-id>.jsonl, en die van de agents
// in <sessie-id>/subagents/. Het script neemt die vanzelf mee.
//
// Wat telt, is vooral hoe vaak een agent zijn hele context opnieuw leest: dat gebeurt bij elke stap.
// De kosten zijn dus ongeveer het aantal stappen maal de gemiddelde context. Het gewicht is een
// schatting naar de prijzen van de API, uitgedrukt in invoertokens van Opus. Hoe zwaar een
// abonnement elk model telt, kan anders zijn; vergelijk dus vooral issues en hoofdstukken met elkaar.
//
// Per issue: zet bovenaan de opdracht van elke agent de regels `Issue: #97` en `Rol: bouw` (of
// `Rol: review`). De hoofdsessie is de orkestratie. Die kosten worden verdeeld over de issues van
// de agents in dezelfde sessie, naar verhouding van wat die agents kostten. Met --bord zet het
// script de totalen in de velden Orkestratie, Bouw en Review van het projectbord, in miljoenen.
// Het overschrijft wat er stond, dus geef alle sessies mee die aan de issues hebben gewerkt.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const GEWICHT = { input: 1, cacheWrite: 2, cacheRead: 0.1, output: 5 };
const MODEL = { opus: 1, sonnet: 0.6, haiku: 0.2 };
const ROLLEN = { orkestratie: 'Orkestratie', bouw: 'Bouw', review: 'Review' };
const BORD = { nummer: '1', eigenaar: 'angrymrt', repo: 'angrymrt/wiskunde-fit' };

const args = process.argv.slice(2);
const perIssue = args.includes('--per-issue');
const naarBord = args.includes('--bord');
const sessies = args.filter((a) => !a.startsWith('--'));
if (!sessies.length || (naarBord && !perIssue)) {
  console.error('Gebruik: node scripts/tokens.js [--per-issue [--bord]] <sessie.jsonl> [...]');
  process.exit(1);
}
const ontbreekt = sessies.filter((s) => !existsSync(s));
if (ontbreekt.length) {
  console.error(`Deze sessie bestaat niet: ${ontbreekt.join(', ')}`);
  process.exit(1);
}

function bestanden(sessie) {
  const map = join(dirname(sessie), basename(sessie, '.jsonl'), 'subagents');
  const agents = existsSync(map) ? readdirSync(map).filter((f) => f.endsWith('.jsonl')) : [];
  return [
    { sessie, hoofd: true, pad: sessie },
    ...agents.map((f) => ({ sessie, hoofd: false, pad: join(map, f) })),
  ];
}

function tel({ sessie, hoofd, pad }) {
  const gezien = new Set();
  const t = { sessie, naam: hoofd ? 'hoofdsessie' : null, model: '', stappen: 0 };
  Object.assign(t, { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 });
  t.rol = hoofd ? 'orkestratie' : null;
  t.issue = null;
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
      t.issue = Number(tekst.match(/^Issue:\s*#(\d+)/m)?.[1]) || null;
      t.rol = tekst.match(/^Rol:\s*(\w+)/m)?.[1].toLowerCase() ?? null;
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
const M = (n) => (n / 1e6).toFixed(1).replace('.', ',');

if (!perIssue) {
  const totaal = rijen.reduce((s, t) => s + t.gewogen, 0);
  const k = (n) => `${Math.round(n / 1000)}k`;
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
  process.exit(0);
}

// Per issue en rol. Agents zonder `Issue:` of met een onbekende rol tellen niet mee voor een issue.
const per = new Map();
const los = [];
const voeg = (issue, rol, n) => {
  if (!per.has(issue)) per.set(issue, { orkestratie: 0, bouw: 0, review: 0 });
  per.get(issue)[rol] += n;
};
for (const sessie of sessies) {
  const hier = rijen.filter((t) => t.sessie === sessie);
  const agents = hier.filter((t) => t.rol !== 'orkestratie');
  for (const t of agents) {
    if (t.issue && ROLLEN[t.rol] && t.rol !== 'orkestratie') voeg(t.issue, t.rol, t.gewogen);
    else los.push(t);
  }
  // De orkestratie naar verhouding over de issues van deze sessie.
  const metIssue = agents.filter((t) => t.issue && ROLLEN[t.rol]);
  const somAgents = metIssue.reduce((s, t) => s + t.gewogen, 0);
  for (const hoofd of hier.filter((t) => t.rol === 'orkestratie')) {
    if (!somAgents) {
      los.push(hoofd);
      continue;
    }
    for (const t of metIssue) voeg(t.issue, 'orkestratie', (hoofd.gewogen * t.gewogen) / somAgents);
  }
}

console.log('| Issue | Orkestratie (M) | Bouw (M) | Review (M) | Totaal (M) |');
console.log('| --- | --: | --: | --: | --: |');
for (const [issue, r] of [...per].sort((a, b) => a[0] - b[0])) {
  console.log(
    `| #${issue} | ${M(r.orkestratie)} | ${M(r.bouw)} | ${M(r.review)} | ${M(r.orkestratie + r.bouw + r.review)} |`,
  );
}
if (los.length) {
  console.log(`\nNiet toegewezen: ${los.map((t) => `${t.naam} (${M(t.gewogen)})`).join(', ')}.`);
}

if (naarBord) {
  const gh = (...a) => execFileSync('gh', a, { encoding: 'utf8' });
  const project = JSON.parse(
    gh('project', 'view', BORD.nummer, '--owner', BORD.eigenaar, '--format', 'json'),
  );
  const velden = JSON.parse(
    gh('project', 'field-list', BORD.nummer, '--owner', BORD.eigenaar, '--format', 'json'),
  ).fields;
  const items = JSON.parse(
    gh(
      'project',
      'item-list',
      BORD.nummer,
      '--owner',
      BORD.eigenaar,
      '--limit',
      '500',
      '--format',
      'json',
    ),
  ).items;
  for (const [issue, r] of per) {
    let item = items.find((i) => i.content?.number === issue)?.id;
    if (!item) {
      const url = `https://github.com/${BORD.repo}/issues/${issue}`;
      item = JSON.parse(
        gh(
          'project',
          'item-add',
          BORD.nummer,
          '--owner',
          BORD.eigenaar,
          '--url',
          url,
          '--format',
          'json',
        ),
      ).id;
    }
    for (const [rol, veldnaam] of Object.entries(ROLLEN)) {
      const veld = velden.find((v) => v.name === veldnaam);
      if (!veld) throw new Error(`Het bord heeft geen veld ${veldnaam}.`);
      const waarde = String(Math.round(r[rol] / 1e5) / 10);
      gh(
        'project',
        'item-edit',
        '--id',
        item,
        '--project-id',
        project.id,
        '--field-id',
        veld.id,
        '--number',
        waarde,
      );
    }
    console.log(`#${issue} staat op het bord.`);
  }
}
