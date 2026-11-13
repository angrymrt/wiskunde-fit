// Telt de tokens van een sessie van Claude Code per agent, om te meten wat een issue of een
// hoofdstuk kost (#88).
//
//   node scripts/tokens.js <sessie.jsonl> [nog een sessie.jsonl ...]           tabel per agent
//   node scripts/tokens.js --per-issue <sessie.jsonl> [...]                    tabel per issue en rol
//   node scripts/tokens.js --per-issue --bord <sessie.jsonl> [...]             en zet het op het bord
//   node scripts/tokens.js --per-issue --bord --issue=100 <sessie.jsonl> [...] alleen dat issue op het bord
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
const issueArg = args.find((a) => a.startsWith('--issue='));
const alleen = issueArg ? Number(issueArg.slice(8)) : null;
// Een ongeldig nummer mag nooit betekenen dat alle issues naar het bord gaan.
const slechtIssue = issueArg && (!/^\d+$/.test(issueArg.slice(8)) || alleen < 1);
const sessies = args.filter((a) => !a.startsWith('--'));
const onbekend = args.filter(
  (a) => a.startsWith('--') && !['--per-issue', '--bord'].includes(a) && !a.startsWith('--issue='),
);
if (
  !sessies.length ||
  onbekend.length ||
  (naarBord && !perIssue) ||
  slechtIssue ||
  (issueArg && !naarBord)
) {
  if (onbekend.length) console.error(`Onbekende optie: ${onbekend.join(', ')}`);
  if (slechtIssue) console.error(`Ongeldig issue: ${issueArg}. Schrijf --issue=100.`);
  if (issueArg && !naarBord) console.error('--issue= werkt alleen samen met --per-issue --bord.');
  console.error(
    'Gebruik: node scripts/tokens.js [--per-issue [--bord [--issue=N]]] <sessie.jsonl> [...]',
  );
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
  t.hoofd = hoofd;
  t.rol = hoofd ? 'orkestratie' : null;
  t.issue = null;
  // Per stap het tijdstip en het gewicht, om de orkestratie in de tijd te kunnen verdelen.
  t.beurten = [];
  // Het tijdvak van een agent loopt van zijn eerste tot zijn laatste regel, dus ook vanaf de opdracht.
  const tijden = [];
  for (const regel of readFileSync(pad, 'utf8').split('\n')) {
    if (!regel) continue;
    let j;
    try {
      j = JSON.parse(regel);
    } catch {
      continue;
    }
    const tijd = Date.parse(j.timestamp);
    if (!Number.isNaN(tijd)) tijden.push(tijd);
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
    const stap = {
      input: m.usage.input_tokens ?? 0,
      cacheWrite: m.usage.cache_creation_input_tokens ?? 0,
      cacheRead: m.usage.cache_read_input_tokens ?? 0,
      output: m.usage.output_tokens ?? 0,
    };
    t.beurten.push({ tijd: Date.parse(j.timestamp), gewogen: gewicht(stap, t.model) });
  }
  t.gewogen = t.beurten.reduce((s, b) => s + b.gewogen, 0);
  t.van = Math.min(...tijden);
  t.tot = Math.max(...tijden);
  return t;
}

function gewicht(stap, model) {
  const factor = Object.entries(MODEL).find(([k]) => model.includes(k))?.[1] ?? 1;
  return factor * Object.entries(GEWICHT).reduce((s, [k, w]) => s + stap[k] * w, 0);
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

// Per issue en rol. Een agent heeft de rol bouw of review; zonder `Issue:` of met een andere rol telt
// hij niet mee voor een issue. Alleen de hoofdsessie is orkestratie.
const AGENTROL = (t) => !t.hoofd && t.issue && (t.rol === 'bouw' || t.rol === 'review');
const per = new Map();
const los = [];
const voeg = (issue, rol, n) => {
  if (!per.has(issue)) per.set(issue, { orkestratie: 0, bouw: 0, review: 0 });
  per.get(issue)[rol] += n;
};
for (const sessie of sessies) {
  const hier = rijen.filter((t) => t.sessie === sessie);
  for (const t of hier.filter((x) => !x.hoofd)) {
    if (AGENTROL(t)) voeg(t.issue, t.rol, t.gewogen);
    else los.push(t);
  }
  // De orkestratie in de tijd: een stap van de hoofdsessie telt voor de issues waarvan de agents op
  // dat moment bezig waren, van de start van hun eerste agent tot het einde van hun laatste. Vallen
  // er meer issues samen, dan naar verhouding van wat hun agents kostten. Een stap daarbuiten, zoals
  // werk aan het bord of aan een andere pull request, telt voor geen enkel issue.
  const issues = new Map();
  for (const t of hier.filter(AGENTROL)) {
    const i = issues.get(t.issue) ?? { van: t.van, tot: t.tot, kost: 0 };
    issues.set(t.issue, {
      van: Math.min(i.van, t.van),
      tot: Math.max(i.tot, t.tot),
      kost: i.kost + t.gewogen,
    });
  }
  for (const hoofd of hier.filter((t) => t.hoofd)) {
    let zonder = 0;
    for (const b of hoofd.beurten) {
      const bezig = [...issues].filter(([, i]) => b.tijd >= i.van && b.tijd <= i.tot);
      const som = bezig.reduce((s, [, i]) => s + i.kost, 0);
      if (!som) zonder += b.gewogen;
      for (const [issue, i] of bezig) voeg(issue, 'orkestratie', (b.gewogen * i.kost) / som);
    }
    if (zonder) los.push({ naam: 'hoofdsessie buiten de agents met een issue', gewogen: zonder });
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
    // Met --issue= blijven de andere issues staan, want die hebben vaak sessies die nu niet meedoen.
    if (alleen && issue !== alleen) continue;
    let item = items.find(
      (i) => i.content?.number === issue && i.content?.repository === BORD.repo,
    )?.id;
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
      // Op 0,01 miljoen, zodat een kleine rol niet op 0 uitkomt.
      const waarde = String(Math.round(r[rol] / 1e4) / 100);
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
