# Versioned git hooks

These hooks are committed to the repo so the whole team shares them.
Git does **not** use them automatically — enable once per clone:

```bash
git config core.hooksPath .githooks
```

## pre-commit

Blocks staging:
- **Secret-pattern files** — `*client_secret*.json`, `service-account*.json`,
  `*.pem/*.p12/*.pfx/*.keystore/*.jks`, `.env*`, `*-token.json`, `*-secrets.json`
  (allows `*.example` and `environment-and-secrets.md`, which is a doc).
- **Files >25MB** — large binaries belong in cloud/LFS, not plain git.

Override intentionally (rare): `git commit --no-verify`.

### Worktree caveat

`core.hooksPath` is resolved relative to the **main** working tree, and worktrees
created by the agent harness may not pick it up automatically. If you work in a
worktree and need the guard, run the `git config` line above from the main
checkout, or invoke `.githooks/pre-commit` manually before a commit. Secrets and
large binaries are also defended by `.gitignore` regardless.
