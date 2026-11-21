---
name: paper-reading-notes
description: Use when the user shares or uploads a research paper (PDF or pasted text) and asks for a summary, reading notes, or help understanding/retaining it — produces a structured reading note with research question, methods, key results with page citations, limitations, and relevance to the user's own research.
---

# Paper Reading Notes

## Overview
Turns a research paper into a structured reading note the user can scan later instead of re-reading the whole paper. The core rule: every claim must come from the paper itself, and every result must be traceable to a page number. No invented content, no filled-in gaps.

## When to use this
Use when:
- The user shares a paper (PDF or text) and asks for a summary, notes, or "what are the key points"
- The user says things like "I read this last week and forgot what it said"
- The user wants a reading log entry for a paper they're tracking across a research project

Don't use when:
- The user wants a line-by-line translation or full re-statement of the paper (this produces a condensed note, not a paraphrase)
- No actual paper content is provided — don't generate notes from a title or abstract alone; ask for the PDF or full text first

## How to produce the note

1. **Read the full paper, not just the abstract.** Results and limitations are often buried in the discussion or appendix, not the abstract.

2. **Fill in the note using this fixed structure:**

```
# [Paper Title] — Reading Note

**Citation:** Author(s), Year, Venue/Journal

## Research Question
What problem is this paper trying to solve? (1–2 sentences)

## Methods
How did they study it? (dataset, method, experimental setup — 2–4 sentences)

## Key Results
- Result 1 (p. X)
- Result 2 (p. X)
- Result 3 (p. X)

## Limitations
What the authors themselves acknowledge as limitations, or gaps you notice in scope/method (cite page if the authors state it explicitly)

## Relevance to My Research
How this might connect to the user's own work — only fill this in if the user has described their research elsewhere in the conversation; otherwise leave this section as a prompt: "(Tell me about your research focus and I can fill this in.)"
```

3. **Every entry under "Key Results" must have a page number.** If you can't find the page, say so — do not guess a page number. Write `(page not found — check manually)` instead of fabricating one.

4. **Do not add any claim, interpretation, or result that isn't stated in the paper.** If the paper doesn't discuss limitations explicitly, say "Not explicitly discussed by the authors" rather than inventing plausible-sounding limitations.

5. **If a section can't be filled from the paper's content** (e.g., the PDF is incomplete, a section is missing, OCR failed on some pages), say so directly in that section instead of leaving it blank or guessing: "(Not available — this section of the PDF appears to be missing/unreadable.)"

## Before finishing, check
- Does every bullet under Key Results have a page citation?
- Is there anything in the note that isn't actually stated in the paper? Remove it.
- Did you read the full document, or just skim the abstract and conclusion?
- Is the Research Question answerable from this note alone, without re-reading the paper?

## Common mistakes
| Mistake | Fix |
|---|---|
| Result listed without page number | Go back to the paper and find the exact page; if truly unfindable, mark it explicitly rather than omitting or guessing |
| Limitations section filled with generic boilerplate ("more research needed") | Only include what the paper actually says, or mark as not discussed |
| Note reads like the abstract reworded | Re-read methods/results/discussion sections — the note should surface what the abstract leaves out |
| Relevance section invents a connection to the user's work | Only fill in if the user has actually described their research; otherwise prompt them |