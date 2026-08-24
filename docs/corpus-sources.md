# Vetting Corpus Sources

> 코퍼스에 넣을 원문 소스를 받기 전에 라이선스와 저작자를 확인하는 절차입니다.

The reference corpus (`src/data/reference-corpus.ts`) is built from other
people's skills. Before a source enters it, run the checks below **in order**
and record the result in the audit document under `docs/corpus/`.

The licensing rule itself (policy B — what may be copied from each tier) lives
in the header comment of `src/data/reference-corpus.ts`. This file covers the
*procedure* for establishing which tier a source belongs to.

## Why this exists

On 2026-08-19 two sources failed licensing checks on the same day, each in a
different way, and one of them had **already been in the corpus for a week with
a license string that was never verified**. Both would have passed a casual
"does the repo look open source?" glance.

## Step 1 — Enumerate the files before reading any of them

Query the tree API and list every file in the source directory:

```bash
curl -sS "https://api.github.com/repos/OWNER/REPO/git/trees/main?recursive=1"
```

Never trust a file list written in an earlier document. Existing notes have been
wrong twice: two sources recorded as single-file turned out to have several, and
in one case a sub-file held 66% of the source's total bytes.

Record the pinned commit SHA. Fetch the snapshot at that SHA, not at `main`, so
the audit and the corpus refer to the same bytes.

## Step 2 — Look for a license at the repository root

Check for `LICENSE` / `LICENSE.txt` / `COPYING`, and check what the GitHub API
reports:

```bash
curl -sS "https://api.github.com/repos/OWNER/REPO" | grep -o '"license":[^,]*'
```

A `null` license field means GitHub could not identify one. That is a finding,
not an absence of information.

## Step 3 — Look for a license in the source's own directory

**Some repositories license per folder rather than at the root.** In one repo
18 skill directories carried their own `LICENSE.txt` and the one being audited
did not — while the repository README stated only that "many" of its skills were
open source. A missing root license does not mean the folder is unlicensed, and
a present root license does not mean the folder is covered.

## Step 4 — Check that each file is actually the repository author's work

This is the step that is easiest to skip and it has already caught a real case:
a file making up 43% of one source was a copy of a third party's documentation
vendored into an MIT repository. **A repository's license covers its author's
own work; it cannot relicense someone else's.**

Signals that a file came from elsewhere:

- Links that point *into* another site's documentation as if they were the
  document's own internal navigation, rather than as outside references
- Markup belonging to another publishing system — component tags, code-fence
  attributes, front-matter keys that the surrounding repository does not use
- The source's own text describing the file as another organization's material
- A voice, formatting convention, or heading style that differs from the rest of
  the repository

When a file looks vendored, treat the whole file as unverified. Do not try to
separate "the parts the author wrote" — that judgment is not reliable from the
file alone.

## Step 5 — Record the outcome honestly

- The `license` field on `ReferenceSource` is shown to users. Write only what was
  verified. If it could not be established, write that it could not, and set
  `summaryOnly: true`.
- State which files were excluded and why, and say what share of the source that
  removes. An audit covering 57% of a source is a different document from one
  covering all of it, and the reader needs to know which they have.
- Note that the judgment is not a legal opinion.

## Applies to sources already in the corpus

The checks are not only for new sources. The `license` value of anything already
present may have been assumed rather than verified — that is exactly how the
2026-08-19 case arose. When touching a source for any reason, confirm its
recorded license still matches what the repository actually says.
