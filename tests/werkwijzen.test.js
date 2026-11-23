// De werkwijzen staan als skills in .claude/skills/ en de review als agent in .claude/agents/.
// Deze test houdt ze heel: elke skill heeft een kop met naam en beschrijving, AGENTS.md noemt
// elke skill, en een verwijzing naar een skill, een agent of een lokaal bestand wijst naar iets
// wat bestaat. Zie #216.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lees = (pad) => readFileSync(join(root, pad), 'utf8');

const skills = readdirSync(join(root, '.claude/skills')).filter((n) =>
  statSync(join(root, '.claude/skills', n)).isDirectory(),
);
const agents = readdirSync(join(root, '.claude/agents')).filter((n) => n.endsWith('.md'));

// De kop (frontmatter) van een bestand als { sleutel: waarde }.
function kop(tekst) {
  const m = tekst.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  return Object.fromEntries(
    m[1].split('\n').map((regel) => {
      const i = regel.indexOf(':');
      return [regel.slice(0, i).trim(), regel.slice(i + 1).trim()];
    }),
  );
}

test('er zijn skills en een review-agent', () => {
  assert.ok(skills.length > 0, 'Geen skills in .claude/skills.');
  assert.ok(agents.includes('review.md'), 'De review-agent ontbreekt in .claude/agents.');
});

test('elke skill heeft SKILL.md met een naam gelijk aan de map en een beschrijving', () => {
  for (const naam of skills) {
    const pad = `.claude/skills/${naam}/SKILL.md`;
    assert.ok(existsSync(join(root, pad)), `${pad} ontbreekt.`);
    const k = kop(lees(pad));
    assert.ok(k, `${pad} heeft geen kop met --- bovenaan.`);
    assert.equal(k.name, naam, `${pad}: de naam in de kop moet gelijk zijn aan de map.`);
    assert.ok(k.description && k.description.length > 20, `${pad} heeft geen beschrijving.`);
  }
});

test('elke agent heeft een kop met naam, beschrijving en model', () => {
  for (const bestand of agents) {
    const pad = `.claude/agents/${bestand}`;
    const k = kop(lees(pad));
    assert.ok(k, `${pad} heeft geen kop met --- bovenaan.`);
    assert.equal(
      k.name,
      bestand.replace(/\.md$/, ''),
      `${pad}: de naam moet gelijk zijn aan het bestand.`,
    );
    assert.ok(k.description, `${pad} heeft geen beschrijving.`);
    assert.ok(k.model, `${pad} heeft geen model.`);
  }
});

test('AGENTS.md noemt elke skill en de review-agent', () => {
  const agentsmd = lees('AGENTS.md');
  for (const naam of skills) {
    assert.ok(
      agentsmd.includes(`\`${naam}\``) || agentsmd.includes(`skills/${naam}/`),
      `AGENTS.md noemt de skill ${naam} niet.`,
    );
  }
  for (const bestand of agents) {
    assert.ok(
      agentsmd.includes(`.claude/agents/${bestand}`),
      `AGENTS.md noemt de agent ${bestand} niet.`,
    );
  }
});

test('elke verwijzing naar een skill of agent wijst naar een bestand dat bestaat', () => {
  const bestanden = ['AGENTS.md', 'README.md', 'CHANGELOG.md', 'BEGRIPPEN.md'];
  for (const naam of skills) bestanden.push(`.claude/skills/${naam}/SKILL.md`);
  for (const bestand of agents) bestanden.push(`.claude/agents/${bestand}`);
  for (const pad of bestanden) {
    const tekst = lees(pad);
    for (const m of tekst.matchAll(/\.claude\/(skills\/[\w-]+\/SKILL\.md|agents\/[\w-]+\.md)/g)) {
      assert.ok(
        existsSync(join(root, m[0])),
        `${pad} verwijst naar ${m[0]}, maar dat bestaat niet.`,
      );
    }
  }
});

test('een skill noemt in de tekst alleen skills die bestaan', () => {
  // "de skill vraag-toevoegen" of "de skill `release-maken`"
  const bestanden = ['AGENTS.md', 'README.md', 'CHANGELOG.md'];
  for (const naam of skills) bestanden.push(`.claude/skills/${naam}/SKILL.md`);
  for (const bestand of agents) bestanden.push(`.claude/agents/${bestand}`);
  for (const pad of bestanden) {
    for (const m of lees(pad).matchAll(/\bskill `?([a-z]+(?:-[a-z]+)+)`?/g)) {
      assert.ok(skills.includes(m[1]), `${pad} noemt de skill ${m[1]}, maar die bestaat niet.`);
    }
  }
});

test('relatieve Markdown-links in een skill of agent wijzen naar een bestand dat bestaat', () => {
  const bestanden = [];
  for (const naam of skills) bestanden.push(`.claude/skills/${naam}/SKILL.md`);
  for (const bestand of agents) bestanden.push(`.claude/agents/${bestand}`);
  for (const pad of bestanden) {
    for (const m of lees(pad).matchAll(/\]\((?!https?:|#|mailto:)([^)#\s]+)(?:#[^)]*)?\)/g)) {
      const doel = resolve(root, dirname(pad), m[1]);
      assert.ok(existsSync(doel), `${pad} heeft een link naar ${m[1]}, maar dat bestaat niet.`);
    }
  }
});

test('een link met een anker naar AGENTS.md wijst naar een kop die bestaat', () => {
  const ankers = new Set(
    [...lees('AGENTS.md').matchAll(/^#{1,6} (.+)$/gm)].map((m) =>
      m[1]
        .toLowerCase()
        .replace(/[^\p{L}\p{N} -]/gu, '')
        .trim()
        .replace(/ /g, '-'),
    ),
  );
  const bestanden = ['README.md'];
  for (const naam of skills) bestanden.push(`.claude/skills/${naam}/SKILL.md`);
  for (const bestand of agents) bestanden.push(`.claude/agents/${bestand}`);
  for (const pad of bestanden) {
    for (const m of lees(pad).matchAll(/\]\([^)#\s]*AGENTS\.md#([^)\s]+)\)/g)) {
      assert.ok(
        ankers.has(m[1]),
        `${pad} verwijst naar AGENTS.md#${m[1]}, maar die kop bestaat niet.`,
      );
    }
  }
});
