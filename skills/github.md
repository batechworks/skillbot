---
name: github
description: Interact with GitHub using the gh CLI for repos, issues, PRs, CI runs, releases, and API queries.
---

# GitHub

Use the `gh` CLI to interact with GitHub repositories. Requires `gh auth login` first.

## When to use

Use this skill when the user asks about GitHub repos, issues, pull requests, CI/CD status, workflow runs, releases, or any GitHub API query.

## Setup

```bash
brew install gh
gh auth login
```

## Pull Requests

List open PRs:

```bash
gh pr list --repo owner/repo
```

Check CI status on a PR:

```bash
gh pr checks 55 --repo owner/repo
```

View PR details:

```bash
gh pr view 55 --repo owner/repo
```

Create a PR:

```bash
gh pr create --repo owner/repo --title "feat: ..." --body "Description..." --base main
```

Merge a PR:

```bash
gh pr merge 55 --repo owner/repo --squash
```

## Workflow Runs (CI/CD)

List recent runs:

```bash
gh run list --repo owner/repo --limit 10
```

View a specific run:

```bash
gh run view <run-id> --repo owner/repo
```

View logs for failed steps only:

```bash
gh run view <run-id> --repo owner/repo --log-failed
```

Re-run failed jobs:

```bash
gh run rerun <run-id> --repo owner/repo --failed
```

## Issues

List open issues:

```bash
gh issue list --repo owner/repo --state open
```

Create an issue:

```bash
gh issue create --repo owner/repo --title "Bug: ..." --body "Description..."
```

Close an issue:

```bash
gh issue close 42 --repo owner/repo
```

## Releases

List releases:

```bash
gh release list --repo owner/repo
```

Create a release:

```bash
gh release create v1.0.0 --repo owner/repo --title "v1.0.0" --notes "Release notes"
```

## Advanced API Queries

Get PR with specific fields:

```bash
gh api repos/owner/repo/pulls/55 --jq '.title, .state, .user.login'
```

Search issues across repos:

```bash
gh api search/issues --method GET -f q='is:issue is:open label:bug org:myorg' --jq '.items[].title'
```

## JSON Output

Most commands support `--json` for structured output with `--jq` filtering:

```bash
gh pr list --repo owner/repo --json number,title,state --jq '.[] | "\(.number): \(.title) [\(.state)]"'
```

## Tips

- Always specify `--repo owner/repo` when not inside a git directory.
- Use `--json` + `--jq` for scriptable output.
- `gh auth status` to check login state.
- `gh repo clone owner/repo` to clone a repo.
