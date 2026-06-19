# GitHub Branch Protection Recommendation

_Tracks CON-93 (TASK-095) : GitHub branch protection recommendation for the AgentCompanies monorepo._

## Context

- The repository is the canonical home of all portfolio companies (see `README.md` and `BIBLE.md` for operating doctrine).  
- Release automation docs (`infrastructure/paperclip/doc/RELEASE-AUTOMATION-SETUP.md`) already spell out the expectations: `master`/`main` should never accept direct pushes, workflow/release scripts must land with review, and Code Owners enforcement is required to trap release-critical files.
- This guidance formalizes what to configure in the GitHub UI so future merges comply with the automated release workflows and the Founder’s least-privilege stance.

## Target branch

- Protect the default branch (`main` in this repo). Configure the rule so it applies to `main` (or `master` if GitHub is still using that legacy default) and covers both pull requests and pushes.

## Recommended rule set

1. **Require pull requests before merging.** No direct pushes or force-pushes allowed; every change must go through a PR.
2. **Require status checks to pass before merging.** Start with the existing `Compliance Lint` workflow (`.github/workflows/compliance-lint.yml`). Add new status checks as new workflows appear (e.g., future unit tests, security scans, release smoke tests). Only check names that GitHub reports as passing for `main`.
3. **Require review from Code Owners.** Branch protection only enforces Code Owner reviews when a `.github/CODEOWNERS` file exists and the option is checked. Create or update that file before toggling this setting.
4. **Dismiss stale pull request approvals when new commits are pushed.** This keeps reviewers in the loop after updates.
5. **Restrict who can push to `main`.** Limit pushes to designated maintainers (CTO / CEO). That prevents accident-prone collaborators from bypassing PR review.
6. **Require linear history and optionally block force pushes.** This keeps `main` readable and makes rollback/rebases safer (enable "Require linear history" and leave "Allow force pushes" off).
7. **Include administrators.** Drop the “Restrict who can push” bypass so even admins abide by the policy unless emergency access is needed.

## Code owners and critical paths

- Create `.github/CODEOWNERS` once the review policy is enabled. Start with the following sections and adjust handles to match the actual GitHub identities (e.g., `@ajantoniou`, `@agentcompanies/cto`, or the founder’s org team):

  ```
  # Release infrastructure
  .github/workflows/      @ajantoniou

  # Portfolio governance docs and shared engineering
  companies/portfolio-hq/** @ajantoniou
  shared/**                 @ajantoniou

  # Company-specific perimeter
  companies/concise/**      @ajantoniou
  companies/healthbrew/** @ajantoniou

  # Optional: add other companies as soon as their maintainers are known
  ```

- The goal is to make sure any change touching release scripts, workflows, or shared infra files cannot merge without the responsible maintainer’s explicit OK. Update the handles if a different persona (CTO, CEO, Paperclip Feedback) becomes responsible.

## Status-check maintenance

- Keep the required check list fresh. When a new workflow is introduced (e.g., release automation, compliance scans for another company), update the branch protection rule to include that workflow name. GitHub shows the exact check name in the merge block UI.
- Remove obsolete checks if the workflow is deleted so the rule does not block merges.

## Verification

1. Save this document to `shared/docs/` and link to it from the issue and any onboarding checklist.
2. After configuring the rule, open a dummy PR that touches a protected path and confirm:
   - The merge button is disabled until `Compliance Lint` (and any other required checks) pass.
   - After merging, confirm a direct push without a PR fails with “branch protection” error.
3. Periodically (quarterly) review the branch protection settings whenever new workflows or directories are added. Record the audit results in this document or in the next `issue` comment for future keepers of the repo.

## References

- `infrastructure/paperclip/doc/RELEASE-AUTOMATION-SETUP.md` §7‑12 (branch protection + CODEOWNERS guidance).  
- Portfolio HQ delegation table (shared tasks) identifies this recommendation as shared governance work (TASK-095).  
- `README.md`, `BIBLE.md`, and `CHIEF_OF_STAFF.md` describe the broader policy boundaries (least privilege, no direct founder action docs, operate autonomously).
