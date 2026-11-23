# jayagrafikaweb

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on myogin/jayagrafikaweb via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Project

Astro 7 static site + Tailwind v4, deployed to Cloudflare Pages. Commands: `npm run dev`, `npm test`, `npm run check`, `npm run build`.

- Calculation logic in `src/lib/calc/hpp.ts` must stay formula-identical to the reference app `../jayagrafikaCalculator` (`src/lib/hpp.ts`); `hpp.test.ts` guards this.
- UI text is Bahasa Indonesia. Brand tokens live in `src/styles/global.css` (navy `#03253e` + CMYK accents).
