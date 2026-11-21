// De regels die elke pull request en commit aan een issue koppelen (scripts/issue-koppeling.js) en de
// hook voor git commit (scripts/commit-hook.js), zonder GitHub.
import test from 'node:test';
import assert from 'node:assert/strict';
import { genoemdeIssues, commitIssue, controleer } from '../scripts/issue-koppeling.js';
import { titelVan, beoordeel } from '../scripts/commit-hook.js';

test('de issues in de titel en de tekst van een pull request', () => {
  assert.deepEqual(genoemdeIssues('Cijfers apart (#188, stap 4)', ''), [188]);
  assert.deepEqual(genoemdeIssues('Iets', 'Fixes #12\nRefs #7\nCloses #9'), [7, 9, 12]);
  // Een los nummer, of een nummer midden in een regel, kan een pull request zijn.
  assert.deepEqual(genoemdeIssues('Iets', 'Zie ook #12 en (#13). Dit fixes #14'), []);
  assert.deepEqual(genoemdeIssues(undefined, undefined), []);
});

test('de check weigert een pull request zonder echt issue', () => {
  const gh = (pad) =>
    JSON.stringify(pad.endsWith('/issues/5') ? { number: 5, pull_request: {} } : { number: 7 });
  const basis = { repo: 'a/b', gh };
  assert.equal(controleer({ ...basis, titel: 'Zonder', tekst: '', nummer: 9 }).ok, false);
  // Een pull request is geen issue.
  assert.equal(controleer({ ...basis, titel: 'Iets (#5)', tekst: '', nummer: 9 }).ok, false);
  // Het nummer van de pull request zelf telt niet.
  assert.equal(controleer({ ...basis, titel: 'Iets (#9)', tekst: '', nummer: 9 }).ok, false);
  assert.equal(controleer({ ...basis, titel: 'Iets (#7)', tekst: '', nummer: 9 }).ok, true);
  assert.equal(controleer({ ...basis, titel: 'Iets', tekst: 'Refs #7', nummer: 9 }).ok, true);
  // Een issue dat niet bestaat.
  const weg = () => {
    throw new Error('404');
  };
  assert.equal(
    controleer({ repo: 'a/b', gh: weg, titel: 'Iets (#7)', tekst: '', nummer: 9 }).ok,
    false,
  );
});

test('de titel van een commit noemt een issue', () => {
  assert.equal(commitIssue('Cijfers laadt apart (#188)'), 188);
  assert.equal(commitIssue('Zonder issue'), null);
});

test('de hook voor git commit', () => {
  assert.equal(titelVan('git commit -m "Titel (#1)"'), 'Titel (#1)');
  assert.equal(titelVan("git commit -qam 'Titel (#1)'"), 'Titel (#1)');
  assert.equal(titelVan('git add . && git commit -q -m "Titel (#1)" && git push'), 'Titel (#1)');
  const heredoc = 'git commit -q -m "$(cat <<\'EOF\'\nTitel (#1)\n\nTekst\nEOF\n)"';
  assert.equal(titelVan(heredoc), 'Titel (#1)');
  assert.equal(titelVan('git commit -m "Fix \\"x\\" (#1)"'), 'Fix "x" (#1)');
  assert.equal(beoordeel('git commit -m "Fix \\"x\\" (#1)"').ok, true);
  assert.equal(titelVan('git commit-tree abc -m "x"'), undefined);
  // Geen commit, of een bericht dat niet uit het commando te halen is.
  assert.equal(titelVan('git status'), undefined);
  assert.equal(titelVan('echo "git commit -m x"'), undefined);
  assert.equal(titelVan('git commit --amend --no-edit'), null);
  assert.equal(beoordeel('git commit -m "Titel (#1)"').ok, true);
  assert.equal(beoordeel(heredoc).ok, true);
  assert.equal(beoordeel('git commit -m "Zonder issue"').ok, false);
  assert.equal(beoordeel('git commit -m "Review #205: iets"').ok, false);
  assert.equal(beoordeel('git commit --amend --no-edit').ok, true);
  assert.equal(beoordeel('git status').ok, true);
});
