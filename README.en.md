<div align="center">

# Tailor

**Write your own Claude Code Skill, with a little help from AI**

[한국어](README.md) · English

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-Sonnet_5-D97757?logo=anthropic&logoColor=white)

</div>

---

Claude Code has a thing called a `SKILL.md` — a file where you write down "when
this comes up, do it like this," and Claude pulls it in on its own. Handy, but
**the moment you sit down to write your first one, it is not obvious what goes
in it or in what order.**

Tailor asks those questions for you. Answer a few and you get a usable draft,
along with an explanation of why it came out the way it did.

It takes care not to strand someone opening Claude Code for the first time, but
it is **not a beginners-only product**. Rather than dropping technical terms and
concrete values to make things "easier", it keeps them and adds a short gloss
the first time each one appears.

## What it does

| | Route | Notes |
|---|---|---|
| **Glossary** | `/glossary` | 21 concepts — "skill", "agent", "CLI" — explained through plain analogies. No AI calls |
| **Skill generator** | `/create` | Answer a few questions, get a `SKILL.md` draft. The core feature |
| **Gallery** | `/gallery` | Browse and download skills worth borrowing from |

## Two paths through the generator

`/create` starts by asking how you want to build. **The two are good at
different things.**

| | Build here | Continue in your own Claude |
|---|---|---|
| Where it runs | Server makes **one** Claude API call | A `claude://` deep link into **your own session** |
| Reference corpus | **Included in the prompt** | **Does not fit in a link** |
| Attribution | Shown on the result screen | Not carried |
| Your project files | Not visible | **Claude can read them while asking** |
| Cost | On the service | **On your Claude account** |

On document structure alone the web path is generally better. The app says so
on that screen, before you choose.

> **How the handoff path is told to save**
> The prompt handed to your Claude instructs it to *show a draft and get your
> approval, then ask where to save, then confirm once more before writing the
> file.* That is an instruction, not code, so it is not enforced.

## Running it yourself

```bash
pnpm install
pnpm dev
```

Opens at `http://localhost:3000`.

> [!IMPORTANT]
> **Generation needs a Claude API key.**
> Create a `.env.local` file in the repository root and put your key in it
> (see `.env.example`).
>
> ```bash
> # .env.local
> ANTHROPIC_API_KEY=sk-ant-...
> ```
>
> Keys come from [console.anthropic.com](https://console.anthropic.com).

`.env.local` is covered by `.gitignore` so it is never committed, and the key is
read **only on the server** (`src/app/api/generate-skill/route.ts`). It never
reaches the browser.

Without a key, **the glossary and gallery still work normally** — both are
static pages that make no AI calls. Trying to generate from `/create` without
one returns a message saying the API key is not configured.

<details>
<summary><b>Checks</b></summary>

```bash
pnpm lint            # Biome (lint + format)
npx tsc --noEmit     # type check
pnpm lint:corpus     # corpus authoring rules (148 patterns / 4 skeletons)
pnpm check:parser    # regression test for the response tag parser
```

</details>

## The reference corpus

The generation prompt carries **"good patterns"** distilled ahead of time from
public skills. Source documents are never re-read at runtime, and generation is
a single structured API call.

<div align="center">

| Categories | Patterns | Skeletons | Source skills |
|:---:|:---:|:---:|:---:|
| **9** | **148** | **4** | **13** |

</div>

Only the `baseline` category is injected regardless of what is being requested.

<details>
<summary><b>The rules for carrying other people's work</b></summary>

- **Sources fall into two tiers.** From a source whose license is confirmed
  (MIT / Apache-2.0), literal values are carried over. From an unconfirmed one,
  only concepts and methods are carried, restated in our own words — no
  phrasings, lists, tables or templates. **Both tiers are credited.** Omitting
  the credit would make the pattern look like ours on screen, which is the wrong
  signal.
- **Each source's repository and license is checked directly and recorded.**
  License labels from search results are not trusted. When a license cannot be
  established, the field says so — that value is shown to users, so a guess
  there would be showing them something false.
- **The credit says "patterns we distilled", not "we read the original".** Only
  what was actually used in a given generation is listed.
- **Anything credited must be traceable.** If it cannot be pointed to in the
  finished `SKILL.md`, it does not go into the credits.

The rules themselves live in the header comment of
`src/data/reference-corpus.ts`; the vetting procedure is in
`.claude/rules/corpus-sources.md`. Whether the corpus represents each source
faithfully is recorded per source under `docs/corpus/`, down to file lists, byte
counts and md5 hashes.

> This is not legal advice.

</details>

## Project layout

<details>
<summary><b>Expand</b></summary>

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

Before quoting a conclusion from `docs/experiments/`, **read the correction note
at the top of that document first.** Some conclusions were later overturned, and
rather than editing the body — which would change what the record says was
measured — corrections are appended.

</details>

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · pnpm · Biome
· GSAP + Framer Motion · Anthropic SDK (Claude Sonnet 5)

## Attribution

The reference corpus distills patterns from **public skills other people
wrote**. Each source's author and license are recorded in
`src/data/reference-corpus.ts`, and the audits in `docs/corpus/`. The result
screen credits the sources behind the patterns actually used in that generation.
