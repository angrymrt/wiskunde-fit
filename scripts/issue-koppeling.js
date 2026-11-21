// Elke pull request en elke commit hoort bij een issue (#208). Dit bestand heeft de regels daarvoor, en
// de check `issue` van de workflow (.github/workflows/issue.yml) gebruikt ze. Ook de hook die de
// tokens op het bord zet (scripts/tokens-hook.js) en de hook voor `git commit` van Claude Code
// (scripts/commit-hook.js) halen de issues eruit met deze regels, zodat er één regel is.
//
//   node scripts/issue-koppeling.js     leest PR_TITLE, PR_BODY, PR_NUMBER, GITHUB_REPOSITORY en GH_TOKEN
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// De issues die de titel en de tekst van een pull request noemen: `(#N` in de titel, en `Refs #N`,
// `Fixes #N` of `Closes #N` aan het begin van een regel in de tekst. Een los nummer in de tekst kan een
// eerdere pull request zijn en telt dus niet.
export function genoemdeIssues(titel = '', tekst = '') {
  const nummers = new Set();
  for (const m of titel.matchAll(/\(#(\d+)/g)) nummers.add(Number(m[1]));
  for (const m of tekst.matchAll(/^(?:Refs|Fixes|Closes)\s+#(\d+)/gim)) nummers.add(Number(m[1]));
  return [...nummers].sort((a, b) => a - b);
}

// De titel van een commit staat tussen haakjes op het eind met het issue: `Titel (#188)`.
export const commitIssue = (titel) => Number(titel.match(/\(#(\d+)/)?.[1]) || null;

// Een bestaand issue, en geen pull request: de API van issues geeft ook pull requests terug.
export function isIssue(nummer, repo, gh = ghApi) {
  try {
    const r = JSON.parse(gh(`repos/${repo}/issues/${nummer}`));
    return !r.pull_request;
  } catch {
    return false;
  }
}
const ghApi = (pad) => execFileSync('gh', ['api', pad], { encoding: 'utf8' });

export function controleer({ titel, tekst, nummer, repo, gh }) {
  const genoemd = genoemdeIssues(titel, tekst).filter((n) => n !== Number(nummer));
  if (!genoemd.length) {
    return {
      ok: false,
      melding:
        'Deze pull request noemt geen issue. Zet `(#N)` aan het eind van de titel, of `Fixes #N` of `Refs #N` aan het begin van een regel in de tekst.',
    };
  }
  const echt = genoemd.filter((n) => isIssue(n, repo, gh));
  if (!echt.length) {
    return {
      ok: false,
      melding: `${genoemd.map((n) => `#${n}`).join(', ')} is geen bestaand issue (misschien een pull request). Noem het issue waar dit werk bij hoort.`,
    };
  }
  return { ok: true, melding: `Hoort bij ${echt.map((n) => `#${n}`).join(', ')}.` };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { PR_TITLE, PR_BODY, PR_NUMBER, GITHUB_REPOSITORY } = process.env;
  const r = controleer({
    titel: PR_TITLE,
    tekst: PR_BODY,
    nummer: PR_NUMBER,
    repo: GITHUB_REPOSITORY,
  });
  if (r.ok) console.log(r.melding);
  else {
    console.log(`::error title=Geen issue::${r.melding}`);
    process.exit(1);
  }
}
