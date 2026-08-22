# Tailor

A web app that helps you write your own Claude Code Skill
(`.claude/skills/<name>/SKILL.md`) with AI assistance.

[한국어](README.md) | English

It takes care not to strand someone opening Claude Code for the first time,
but it is **not a beginners-only product**. Rather than dropping technical
terms and concrete values to make things "easier", it keeps them and adds a
short gloss the first time each one appears.

## What it does

| Feature | Route | Notes |
|---|---|---|
| Glossary | `/glossary` | 21 concepts — "skill", "agent", "CLI" — explained through plain analogies. No AI calls |
| **Skill generator** | `/create` | Answer a few questions, get a SKILL.md draft. The core feature |
| Gallery | `/gallery` | Browse and download skills worth borrowing from |

## Two paths through the generator

`/create` starts by asking how you want to build.

**Build here** — you answer the questions and the server makes one structured
Claude API call. The reference corpus below goes into that prompt, and the
result screen credits the sources behind the patterns the model reports using.

**Continue in your own Claude** — a `claude://` deep link opens your own Claude
session, and the questions, generation and saving all happen there. Claude can
look at your actual project files while asking, and the cost lands on your own
account — but **the reference corpus and the document skeleton do not fit in a
single link, so they are not carried over.** The result carries no attribution
either. On document structure alone the web path is generally better, and the
app says so on that screen.

The prompt handed to your Claude instructs it to **show a draft and get your
approval, then ask where to save, then confirm once more before writing the
file.** That is an instruction, not code, so it is not enforced.

## Running it yourself

```bash
pnpm install
pnpm dev
```

Opens at `http://localhost:3000`.

**Generation needs a Claude API key.** Create `.env.local` in the repository
root and put your key in it (see `.env.example`):

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

Keys come from [console.anthropic.com](https://console.anthropic.com).
`.env.local` is covered by `.gitignore` so it is never committed, and the key
is read **only on the server** (`src/app/api/generate-skill/route.ts`) — it is
never sent to the browser.

Without a key, **the glossary (`/glossary`) and gallery (`/gallery`) still work
normally** — both are static pages that make no AI calls. Trying to generate
from `/create` without one returns a message saying the API key is not
configured.

### Checks

```bash
pnpm lint            # Biome (lint + format)
npx tsc --noEmit     # type check
pnpm lint:corpus     # corpus authoring rules (148 patterns / 4 skeletons)
pnpm check:parser    # regression test for the response tag parser
```

## The reference corpus

The generation prompt carries "good patterns" distilled ahead of time from
public skills. Source documents are never re-read at runtime, and generation is
a single structured API call.

Currently **9 categories, 148 patterns and 4 document skeletons**, drawn from
**13 public skills**. Only the `baseline` category is injected regardless of
what is being requested.

The rules it follows:

- **Sources fall into two tiers.** From a source whose license is confirmed
  (MIT / Apache-2.0), literal values are carried over. From an unconfirmed one,
  only concepts and methods are carried, restated in our own words — no
  phrasings, lists, tables or templates. **Both tiers are credited.** Omitting
  the credit would make the pattern look like ours on screen, which is the
  wrong signal.
- **Each source's repository and license are checked directly and recorded.**
  License labels from search results are not trusted. When a license cannot be
  established, the field says so — that value is shown to users, so a guess
  there would be showing them something false.
- **The credit says "patterns we distilled", not "we read the original".**
  Only what was actually used in a given generation is listed.
- **Anything credited must be traceable.** If it cannot be pointed to in the
  finished SKILL.md, it does not go into the credits.

The rules themselves live in the header comment of
`src/data/reference-corpus.ts`; the vetting procedure is in
`.claude/rules/corpus-sources.md`. Whether the corpus represents each source
faithfully is recorded per source under `docs/corpus/`, down to file lists,
byte counts and md5 hashes.

> This is not legal advice.

## Layout

```
src/app/                    pages + API routes
  api/generate-skill/       generation API (route.ts / prompt.ts)
  api/eval-ab/              evaluation harness (dev only, 404 in production)
  api/corpus-snapshot/      corpus render dump (dev only, 404 in production)
src/components/create/      wizard, result screen, handoff panel
src/data/
  reference-corpus.ts       reference corpus — patterns + document skeletons
  gallery.ts                gallery data
  glossary.ts               glossary data
  wizard-questions.ts       wizard question definitions
tools/                      corpus lint, render diff, audit coverage, parser regression
docs/corpus/                source audit records
docs/experiments/           generation-quality experiments + raw data
```

Before quoting a conclusion from `docs/experiments/`, **read the correction
note at the top of that document first.** Some conclusions were later
overturned, and rather than editing the body — which would change what the
record says was measured — corrections are appended.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · pnpm · Biome
· GSAP + Framer Motion · Anthropic SDK (Claude Sonnet 5)

## Attribution

The reference corpus distills patterns from public skills other people wrote.
Each source's author and license are recorded in
`src/data/reference-corpus.ts`, the audits in `docs/corpus/`, and the result
screen credits the sources behind the patterns actually used in that
generation.
