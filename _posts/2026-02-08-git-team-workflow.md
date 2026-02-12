---
title: "Professional Git Workflow for Teams"
date: 2026-02-08
categories: Software-Engineering
tags: [Git, Best-Practices, Quick-Reference]
---

This article lays out a practical, production-grade Git workflow for teams. The goal is to reduce merge conflicts, keep history understandable, and make pull requests (PRs) predictable and fast to review.

The key to getting Git “right” on a team is to treat different branches differently, and to be explicit about whether you’re **integrating history** (merge) or **rewriting history** (rebase).



## Bottom Line Up Front

If you internalize only these rules, you’ll avoid most Git problems:

- **Rebase solo feature branches** onto the latest `main` frequently.
- **Fast-forward local `main` only** so it mirrors `origin/main` exactly.
- **Merge (don’t rebase) heavily shared branches** to avoid rewriting commits other people depend on.
- **Never develop directly on `main`** on serious teams.
- **Sync early and often** to keep conflicts small and fresh in your head.



## The mental model that keeps you out of trouble

Every sync operation should answer:

> **Am I integrating history, or rewriting it?**

- **Merge integrates history**: it preserves the exact commit graph and is friendly to collaboration.
- **Rebase rewrites history**: it changes commit hashes by replaying commits onto a new base, which is clean and useful—**but only safe when those commits are still “yours”**.

Most Git pain is caused by treating rebase and merge as interchangeable.



## Treat branch types differently

### `origin/main` is the source of truth

In most team setups, `origin/main` (or `origin/master`) is the authoritative history.

### Local `main` is a mirror, not a workspace

Your local `main` should behave like a read-only cache of the remote. That keeps your starting point reliable and makes it obvious when something is wrong.

### Feature branches are where work happens

Feature branches are the right place for iteration, experiments, and incremental commits. The shorter-lived they are, the less conflict you accumulate.



## The Golden Daily Workflow

This pattern is simple, repeatable, and scales to fast-moving repos:

```bash
git checkout main
git pull --ff-only

git checkout feature-x
git fetch origin
git rebase origin/main
```

**Why this works**

- You never start work from stale `main`.
- You reduce divergence early so conflicts stay small.
- Your PR stays focused on your change, not incidental merges.

**Handling uncommitted work**

If you have uncommitted changes when switching branches, stash them first:

```bash
git stash
git checkout main
# ... do your work ...
git checkout feature-x
git stash pop
```

Or configure Git to auto-stash during rebase: `git config --global rebase.autoStash true`



## The correct processes for "retrieving changes"

### 1) Bring changes from `main` into your feature branch (most common)

**Use fetch + rebase** when your branch is not shared heavily:

```bash
git checkout feature-x
git fetch origin
git rebase origin/main
```

**Why this is the default on strong teams**

- Rebasing keeps your work “stacked” on top of current reality. Reviewers see only your feature commits on top of the latest baseline.
- It prevents “merge bubbles” like `Merge main into feature-x` that don’t add meaningful information.
- Conflicts tend to be smaller and easier to resolve when you rebase frequently.

**Important safety note**

After rebasing a branch you’ve already pushed, your local history changed, so pushing requires rewriting the remote branch too:

```bash
git push --force-with-lease
```

Use `--force-with-lease` (not `--force`) because it refuses to overwrite remote commits you haven’t seen—this is a critical safety rail.



### 2) Update local `main` from remote `main`

**Use fast-forward-only pulls**:

```bash
git checkout main
git pull --ff-only
```

**Why fast-forward-only is ideal**

- It guarantees local `main` does not silently diverge.
- It prevents accidental merge commits on `main`.
- If it fails, you’ve learned something important: your local `main` is not a clean mirror and needs investigation.

A helpful global guardrail:

```bash
git config --global pull.ff only
```

This causes Git to refuse non-fast-forward pulls everywhere, which prevents a surprising number of “how did my history get like this?” incidents.



### 3) Pull changes into your branch that someone else contributed

This depends on whether the branch is truly shared.

#### If collaboration is light (occasional contributions)

You can keep history clean using:

```bash
git pull --rebase
```

**Reasoning**: it avoids “self-merges” of the branch into itself that add noise with no benefit. It also keeps the PR easier to read.

#### If the branch is heavily shared (multiple people committing daily)

Prefer merge:

```bash
git pull
```

**Reasoning**: rebasing would rewrite commits your teammates may have already based work on. That can force them into painful repair work (or worse, accidental loss of commits). In high-collaboration branches, history fidelity and safety matter more than aesthetics.



## End-to-end workflow: from branch creation to pull request and merge

This is the highest-signal workflow for teams because it minimizes conflicts, keeps history readable, and makes reviews faster. Think of it as a lifecycle rather than isolated Git commands.



### 1. Start from a clean, current `main`

Always begin new work from an updated baseline:

```bash
git checkout main
git pull --ff-only
```

**Why this matters**  
Branching from stale code is one of the most common sources of future merge conflicts. Updating first ensures your work is aligned with the latest dependencies, refactors, and schema changes before you write a single line of code.



### 2. Create a focused feature branch

```bash
git checkout -b feature-descriptive-name
```

**Modern alternative:** Git 2.23+ introduced `git switch -c feature-descriptive-name`. The `switch` command does one thing (change branches), while `checkout` is overloaded with multiple behaviors (switch branches, restore files, detach HEAD). Using `switch` reduces the chance of accidental file overwrites and makes intent clearer.

Use branches that represent a single logical change. Smaller branches:

- review faster  
- merge safer  
- revert more easily  
- reduce cognitive load for teammates

Avoid “mega branches” that stay open for weeks — they accumulate divergence and dramatically increase integration risk.



### 3. Sync with `main` frequently while developing

As `main` moves, bring those changes into your branch:

```bash
git fetch origin
git rebase origin/main
```

**Reasoning**  
Frequent rebasing keeps conflicts small and manageable. Waiting days or weeks turns integration into archaeology because you no longer remember the assumptions behind your code.

If the branch is shared heavily, merge instead of rebasing to avoid rewriting commits others rely on.



### 4. Keep commits intentional and readable

Before pushing, take a moment to ensure commits communicate *why* the change exists, not just *what* changed.

If necessary, use interactive rebase to:

- squash noisy commits
- rewrite unclear messages
- separate unrelated changes

Clean commits dramatically improve review quality and future debugging.



### 5. Rebase once more before opening the pull request

Right before creating a PR:

```bash
git fetch origin
git rebase origin/main
```

Then push safely:

```bash
git push --force-with-lease
```

**Why this step is critical**  
It ensures your PR sits directly on top of the latest `main`, preventing reviewers from seeing unrelated merge commits and reducing the chance of last-minute conflicts.



### 6. Open a pull request early enough for meaningful review

Avoid opening PRs only when you believe the work is “perfect.” Earlier PRs help teams:

- catch design issues sooner
- prevent duplicated work
- surface dependency conflicts
- share architectural context

Draft PRs are particularly effective for longer efforts.



### 7. Address feedback and keep the branch current

While the PR is open, `main` will continue to evolve. Periodically sync again:

```bash
git fetch origin
git rebase origin/main
```

Resolve conflicts promptly so the branch never drifts too far from reality.

This avoids the high-risk scenario where a large PR becomes unmergeable late in the process.

**Caveat: Rebasing during review has trade-offs**

Force-pushing after rebase can:
- Invalidate existing review comments on some platforms
- Make it harder for reviewers to see what changed since their last review

Some teams prefer `git merge origin/main` during active review to preserve context, then squash on final merge. Choose based on your team's review style.



### 8. Merge through the PR — not locally

Let the repository platform handle the merge so that CI checks, approvals, and policies are enforced.

Choose the merge method intentionally based on team norms:

- **Squash merge** when you want one clean commit representing the feature.
- **Merge commit** when preserving branch structure and integration points is valuable.
- **Rebase + merge** when the branch is private and the team prioritizes linear history.

The correct choice is less about preference and more about how your team debugs production issues and audits changes.



### 9. Clean up immediately after merge

Once merged:

```bash
git checkout main
git pull --ff-only
git branch -d feature-descriptive-name
```

Deleting merged branches keeps the repository navigable and prevents engineers from accidentally building on obsolete work.



### 10. Return to `main` before starting the next task

This resets your baseline and prevents accidental branching from old feature branches — a subtle mistake that can pollute future PRs with unrelated commits.



## Conflict handling: how experienced engineers approach it

### Sync frequently to keep conflicts small

Conflicts aren’t “caused by time.” They’re caused by:

- edits touching the same lines/regions
- how far branches have diverged

Frequent rebases/merges keep the conflict surface area small and—more importantly—keep the change context fresh in your mind.

### Don’t resolve conflicts blindly

Avoid defaulting to “ours” or “theirs.” Conflicts often signal a real semantic change:

- an API contract changed
- a schema evolved
- a function’s responsibilities shifted

Treat conflicts like a design checkpoint, not an annoyance.



## Recommended guardrails for teams

These settings reduce mistakes without changing how you think:

```bash
# Refuse non-fast-forward pulls (prevents accidental merge commits on main)
git config --global pull.ff only

# Auto-stash uncommitted changes before rebase, then reapply
git config --global rebase.autoStash true

# Automatically set up remote tracking when pushing new branches
git config --global push.autoSetupRemote true
```

Optionally, if your team standardizes on rebasing for feature branches:

```bash
git config --global pull.rebase true
```

Be cautious: enabling rebase-by-default is only a net win if engineers understand when rebasing is unsafe (shared branches).

**When `--ff-only` fails**

If `git pull --ff-only` refuses to complete, your local branch has diverged from the remote. Common causes:
- You accidentally committed directly to local `main`
- Someone force-pushed to the remote (rare on protected branches)

To fix: inspect with `git log --oneline main origin/main` to understand the divergence, then either reset your local branch or cherry-pick your commits elsewhere.



## The one-sentence principle

> **Keep `main` pristine, keep feature branches current, and never rewrite history other people rely on.**

If you enforce that principle, your Git workflow will stay stable even as your team and repo scale.

