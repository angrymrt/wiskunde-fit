// Hook van Claude Code (zie .claude/settings.json): na `gh pr merge` zet dit de tokens van de issues
// van die pull request op het projectbord, met scripts/tokens.js (#201). De hook krijgt op stdin een
// JSON met het commando en het pad van het logboek van de sessie. Het is een vangnet: het mag nooit
// iets blokkeren, dus elke fout wordt een melding en de hook stopt met 0.
//
// Een issue dat nog open blijft, zoals een stap van een grotere klus, staat daarna ook op het bord. Het
// script overschrijft wat er stond, dus geven we alle sessies uit dezelfde map mee, niet alleen de
// lopende.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hier = dirname(fileURLToPath(import.meta.url));
const melding = (tekst) => {
  console.log(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: tekst },
    }),
  );
  process.exit(0);
};

// Het nummer van de pull request, uit `gh pr merge 205 --squash`.
export function prNummer(commando) {
  // Alleen als gh pr merge zelf het commando is, niet als de tekst ervan in een commitbericht staat.
  const m = commando.match(/(?:^|[;&|]\s*)gh\s+pr\s+merge\b([^\n;&|]*)/);
  return Number(m?.[1].match(/(?:^|\s)#?(\d+)(?=\s|$)/)?.[1]) || null;
}

// De issues van een pull request: wat hij sluit, en wat de titel of tekst noemt als `(#N` of
// `Refs #N`. Het nummer van de pull request zelf telt niet mee.
export function issuesVan(pr) {
  const nummers = new Set((pr.closingIssuesReferences ?? []).map((i) => i.number));
  const tekst = `${pr.title ?? ''}\n${pr.body ?? ''}`;
  for (const m of tekst.matchAll(/(?:\(|\b(?:Refs|Fixes|Closes)\s+)#(\d+)/gi))
    nummers.add(Number(m[1]));
  nummers.delete(pr.number);
  return [...nummers].sort((a, b) => a - b);
}

async function main() {
  let invoer;
  try {
    invoer = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const commando = invoer.tool_input?.command;
  if (typeof commando !== 'string' || !/\bgh\s+pr\s+merge\b/.test(commando)) return;
  const nummer = prNummer(commando);
  const logboek = invoer.transcript_path;
  if (!nummer || !logboek || !existsSync(logboek)) return;

  try {
    const pr = JSON.parse(
      execFileSync(
        'gh',
        ['pr', 'view', String(nummer), '--json', 'number,state,title,body,closingIssuesReferences'],
        {
          encoding: 'utf8',
          cwd: invoer.cwd || undefined,
        },
      ),
    );
    if (pr.state !== 'MERGED') return;
    const issues = issuesVan(pr);
    if (!issues.length)
      return melding(
        `Tokens: pull request #${nummer} noemt geen issue, dus niets op het bord gezet.`,
      );

    const map = dirname(logboek);
    const sessies = readdirSync(map)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => join(map, f));
    const gedaan = [];
    for (const issue of issues) {
      const uit = execFileSync(
        'node',
        [join(hier, 'tokens.js'), '--per-issue', '--bord', `--issue=${issue}`, ...sessies],
        { encoding: 'utf8' },
      );
      if (uit.includes(`#${issue} staat op het bord`)) gedaan.push(`#${issue}`);
    }
    melding(
      gedaan.length
        ? `Tokens van ${gedaan.join(', ')} staan op het projectbord (Bouw is een schatting).`
        : `Tokens: voor ${issues.map((i) => `#${i}`).join(', ')} was niets te vinden in de logboeken.`,
    );
  } catch (e) {
    melding(
      `Tokens op het bord zetten lukte niet: ${String(e.message).split('\n')[0]}. Doe het met de hand, zie AGENTS.md.`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
