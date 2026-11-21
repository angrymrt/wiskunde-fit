// De hook die na het samenvoegen de tokens op het bord zet (scripts/tokens-hook.js): welke pull request
// en welke issues, zonder gh.
import test from 'node:test';
import assert from 'node:assert/strict';
import { prNummer, issuesVan } from '../scripts/tokens-hook.js';

test('het nummer van de pull request uit gh pr merge', () => {
  assert.equal(prNummer('gh pr merge 205 --squash --delete-branch'), 205);
  assert.equal(prNummer('gh pr merge --squash 205'), 205);
  assert.equal(prNummer('cd x && gh pr merge 7 --squash && gh issue close 188'), 7);
  assert.equal(prNummer('gh pr merge --squash'), null);
  assert.equal(prNummer('gh pr merge --subject "Oud #12" 205 --squash'), 205);
  // Tekst in een commitbericht is geen merge.
  assert.equal(prNummer('git commit -m "Na gh pr merge 201 komt de hook"'), null);
});

test('de issues van een pull request', () => {
  const pr = {
    number: 205,
    title: 'Cijfers in een eigen bestand (#188, stap 4)',
    body: 'Refs #206\n\nFixes #155',
    closingIssuesReferences: [{ number: 155 }],
  };
  assert.deepEqual(issuesVan(pr), [155, 188, 206]);
  // Een los nummer in de tekst kan een eerdere pull request zijn.
  assert.deepEqual(issuesVan({ number: 9, title: 'Iets', body: 'Zie ook #12 en (#13)' }), []);
  // Het nummer van de pull request zelf is geen issue.
  assert.deepEqual(issuesVan({ number: 9, title: 'Iets (#9)', body: '' }), []);
});
