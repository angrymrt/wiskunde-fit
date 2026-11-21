// Hook van Claude Code (zie .claude/settings.json), vóór `git commit`: een commit zonder `(#N)` aan het
// eind van de titel wordt geweigerd (#208). Zo is elke commit te herleiden tot een issue, en weet
// scripts/tokens.js voor welk issue de hoofdsessie bouwde. Het is voor sessies van Claude Code; wat
// voor iedereen geldt, dwingt de check `issue` op de pull request af.
//
// De hook weigert met exit 2 en een tekst op stderr; Claude Code geeft die tekst aan Claude. Een
// commit waarvan de titel niet te lezen is, zoals `--amend --no-edit` of `-F bestand`, laat hij door.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { commitIssue } from './issue-koppeling.js';

// De eerste regel van het bericht na `-m`: `-m "Titel"`, `-m 'Titel'` of `-m "$(cat <<'EOF'` met de
// titel op de volgende regel. Geeft null als het bericht niet uit het commando te halen is.
export function titelVan(commando) {
  if (!/(?:^|[;&|(]\s*|\n\s*)git\s+(?:-C\s+\S+\s+)?commit\b/.test(commando)) return undefined;
  const m = commando.match(/\s(?:-[a-zA-Z]*m|--message)(?:\s+|=)(["']?)(.*)/s);
  if (!m) return null;
  let rest = m[2];
  // Een bericht uit een heredoc begint met `$(cat <<'EOF'` en dan een nieuwe regel.
  const heredoc = rest.match(/^\$\(cat\s+<<-?\s*['"]?\w+['"]?\s*\n(.*)/s);
  if (heredoc) rest = heredoc[1];
  else if (m[1]) rest = rest.split(m[1])[0];
  const titel = rest.split('\n')[0].trim();
  return titel || null;
}

export function beoordeel(commando) {
  const titel = titelVan(commando);
  if (titel === undefined || titel === null) return { ok: true };
  if (commitIssue(titel)) return { ok: true };
  return {
    ok: false,
    melding: `Commit geweigerd: de titel "${titel}" noemt geen issue. Zet \`(#N)\` aan het eind van de titel, bijvoorbeeld "Cijfers laadt apart (#188)". Elk werk hoort bij een issue; bestaat het nog niet, maak het dan eerst aan (AGENTS.md, "Feedback en open punten bewaren").`,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let invoer;
  try {
    invoer = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    process.exit(0);
  }
  const commando = invoer.tool_input?.command;
  if (typeof commando !== 'string') process.exit(0);
  const r = beoordeel(commando);
  if (!r.ok) {
    console.error(r.melding);
    process.exit(2);
  }
}
