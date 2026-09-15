export type SkillType = 'skill-md'

export interface SkillIndexEntry {
  name: string
  type: SkillType
  description: string
  url: string
}

export interface SkillMetadata {
  uri: string
  name: string
  description: string
  mimeType: 'text/markdown'
  _meta: {
    'io.modelcontextprotocol.skills/license': string
    'io.modelcontextprotocol.skills/compatibility': string
    'io.modelcontextprotocol.skills/version': string
    'io.modelcontextprotocol.skills/author': string
  }
}

export interface MockSkill {
  entry: SkillIndexEntry
  metadata: SkillMetadata
  body: string
}

const gitWorkflow = `---
name: git-workflow
description: Follow this team's Git conventions for branching, commits, and pull requests.
license: Apache-2.0
compatibility: Requires git CLI and write access to the working tree.
metadata:
  author: acme-platform
  version: "1.2.0"
---

# Git workflow

Use this skill whenever you create branches, commit, or open a pull request.

## Branch names

- Feature work: \`cursor/<short-slug>-<id>\`
- Fixes: \`fix/<issue>-<short-slug>\`
- Never commit directly to \`main\`

## Commits

Write the subject in the imperative mood, under 72 characters.

\`\`\`
Add skills catalog panel to MCP playground
\`\`\`

Group related file edits. Do not mix formatting-only changes with behavior.

## Pull requests

1. Rebase onto latest \`main\` before opening.
2. Title the PR after the user-facing change, not the branch name.
3. In the body, cite the triggering bookmark or issue.
4. Note that Cloudflare preview is optional; a local run is enough.

## When not to use

Skip this skill for throwaway local experiments that will not be pushed.
`

const prReview = `---
name: pr-review
description: Review a pull request for correctness, regressions, and missing tests before merge.
license: MIT
compatibility: Works with any git remote; GitHub MCP tools optional.
metadata:
  author: acme-devtools
  version: "0.9.4"
---

# Pull request review

Load this skill when asked to review a PR, leave review comments, or decide merge readiness.

## Progressive disclosure

Start from the PR title, description, and file list. Only open a file if it can change the review outcome.

## Review order

1. **Intent** — Restate what the PR claims to do in one sentence.
2. **Scope** — Flag unrelated files or drive-by refactors.
3. **Correctness** — Trace the main path and one failure path.
4. **Regressions** — Check shared state, routing, and existing tests.
5. **Docs** — README / run instructions should still be true.

## Comment style

- Point at the line, not the author.
- Prefer a concrete fix over a vague "consider".
- Separate blocking issues from nits.

## Output

Return: summary, blocking findings, nits, and a merge recommendation.
`

const incidentResponse = `---
name: incident-response
description: Triage a production incident, page the right owner, and write a tight status update.
license: Apache-2.0
compatibility: Pager and status-page tools are optional; the runbook works from logs alone.
metadata:
  author: acme-sre
  version: "2.0.1"
---

# Incident response

Use this skill for sevs, error-budget burns, or "the site looks down" reports.

## Severity

| Sev | Signal | Action |
| --- | --- | --- |
| 1 | Total outage or data loss | Page primary + secondary now |
| 2 | Major feature broken | Page primary, update status page |
| 3 | Degraded or regional | Work the ticket, no broadcast yet |

## First five minutes

1. Confirm the blast radius from one user-visible symptom and one metric.
2. Open a dedicated incident channel. Do not debate in the alert thread.
3. Name a commander. Everyone else is optional until asked.
4. Write a 3-line status: impact, since when, next check-in time.

## During

Mitigate first, root-cause second. Roll back if the last deploy is a plausible cause.

## After

File a review within one business day. The skill's job ends at the written timeline, not the permanent fix.
`

const expensePolicy = `---
name: expense-policy
description: Apply Acme finance rules for travel, meals, and software reimbursements.
license: Apache-2.0
compatibility: Needs the claim amount, category, and employee location.
metadata:
  author: acme-finance
  version: "2026.09"
---

# Expense policy

Load this skill when classifying a receipt, answering a policy question, or drafting a denial.

## Hard limits

- Domestic airfare: economy only
- Hotel: \`$220\` / night in-policy cities, \`$320\` elsewhere
- Meals: \`$75\` / person / day. Alcohol is not reimbursable
- SaaS tools: manager + security review above \`$50\` / month

## Receipts

Submit within 14 days. Missing itemization on meals over \`$25\` is an automatic bounce.

## International travel

Per-diem overrides meal receipts. Currency convert on the transaction date, not the submit date.

## Agent behavior

Quote the matching rule before approving or rejecting. If the category is ambiguous, ask one clarifying question instead of guessing.
`

function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.trim().length / 4))
}

export const MOCK_SKILLS: MockSkill[] = [
  {
    entry: {
      name: 'git-workflow',
      type: 'skill-md',
      description:
        "Follow this team's Git conventions for branching, commits, and pull requests.",
      url: 'skill://git-workflow/SKILL.md',
    },
    metadata: {
      uri: 'skill://git-workflow/SKILL.md',
      name: 'git-workflow',
      description:
        "Follow this team's Git conventions for branching, commits, and pull requests.",
      mimeType: 'text/markdown',
      _meta: {
        'io.modelcontextprotocol.skills/license': 'Apache-2.0',
        'io.modelcontextprotocol.skills/compatibility':
          'Requires git CLI and write access to the working tree.',
        'io.modelcontextprotocol.skills/version': '1.2.0',
        'io.modelcontextprotocol.skills/author': 'acme-platform',
      },
    },
    body: gitWorkflow,
  },
  {
    entry: {
      name: 'pr-review',
      type: 'skill-md',
      description:
        'Review a pull request for correctness, regressions, and missing tests before merge.',
      url: 'skill://pr-review/SKILL.md',
    },
    metadata: {
      uri: 'skill://pr-review/SKILL.md',
      name: 'pr-review',
      description:
        'Review a pull request for correctness, regressions, and missing tests before merge.',
      mimeType: 'text/markdown',
      _meta: {
        'io.modelcontextprotocol.skills/license': 'MIT',
        'io.modelcontextprotocol.skills/compatibility':
          'Works with any git remote; GitHub MCP tools optional.',
        'io.modelcontextprotocol.skills/version': '0.9.4',
        'io.modelcontextprotocol.skills/author': 'acme-devtools',
      },
    },
    body: prReview,
  },
  {
    entry: {
      name: 'incident-response',
      type: 'skill-md',
      description:
        'Triage a production incident, page the right owner, and write a tight status update.',
      url: 'skill://incident-response/SKILL.md',
    },
    metadata: {
      uri: 'skill://incident-response/SKILL.md',
      name: 'incident-response',
      description:
        'Triage a production incident, page the right owner, and write a tight status update.',
      mimeType: 'text/markdown',
      _meta: {
        'io.modelcontextprotocol.skills/license': 'Apache-2.0',
        'io.modelcontextprotocol.skills/compatibility':
          'Pager and status-page tools are optional; the runbook works from logs alone.',
        'io.modelcontextprotocol.skills/version': '2.0.1',
        'io.modelcontextprotocol.skills/author': 'acme-sre',
      },
    },
    body: incidentResponse,
  },
  {
    entry: {
      name: 'expense-policy',
      type: 'skill-md',
      description:
        'Apply Acme finance rules for travel, meals, and software reimbursements.',
      url: 'skill://acme/finance/expense-policy/SKILL.md',
    },
    metadata: {
      uri: 'skill://acme/finance/expense-policy/SKILL.md',
      name: 'expense-policy',
      description:
        'Apply Acme finance rules for travel, meals, and software reimbursements.',
      mimeType: 'text/markdown',
      _meta: {
        'io.modelcontextprotocol.skills/license': 'Apache-2.0',
        'io.modelcontextprotocol.skills/compatibility':
          'Needs the claim amount, category, and employee location.',
        'io.modelcontextprotocol.skills/version': '2026.09',
        'io.modelcontextprotocol.skills/author': 'acme-finance',
      },
    },
    body: expensePolicy,
  },
]

export const SKILL_INDEX = {
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  skills: MOCK_SKILLS.map((skill) => skill.entry),
}

export const SERVER_INFO = {
  name: 'acme-ops-mcp',
  version: '0.4.1',
  protocolVersion: '2025-06-18',
  capabilities: {
    extensions: ['io.modelcontextprotocol/skills'],
    resources: { subscribe: false, listChanged: false },
  },
}

export function tokensForCatalog(): number {
  return estimateTokens(JSON.stringify(SKILL_INDEX))
}

export function tokensForSkill(skill: MockSkill): number {
  return estimateTokens(skill.body)
}

export function findSkill(name: string): MockSkill | undefined {
  return MOCK_SKILLS.find((skill) => skill.entry.name === name)
}
