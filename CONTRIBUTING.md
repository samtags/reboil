# Contributing to Reboil

Thank you for helping improve Reboil. This guide explains how to propose a change, verify it locally, and prepare it
for review.

By submitting a contribution, you confirm that you have the right to submit it and agree that it will be licensed
under Reboil's [MIT License](./LICENSE). Reboil does not require a Contributor License Agreement or Developer
Certificate of Origin sign-off.

## Before you start

Search the existing issues and discussions before opening something new.

- Small bug fixes, tests, and documentation corrections may go directly to a pull request.
- New features, breaking changes, persistence changes, and architectural work must first be discussed in an issue or
  discussion. Wait for maintainer agreement before investing in an implementation.
- Usage questions and general troubleshooting belong in GitHub Discussions. See [SUPPORT.md](./SUPPORT.md).
- Do not report security vulnerabilities in a public issue. Follow [SECURITY.md](./SECURITY.md).

Keep changes focused. Unrelated fixes should use separate pull requests.

## Development setup

Reboil uses npm and requires Node.js 20.19 or newer.

```sh
git clone https://github.com/<your-account>/reboil.git
cd reboil
npm ci
npm ci --prefix docs-site
```

Create a short branch named for the change, such as `fix/invalid-path-error` or `docs/persistence-example`.

## Make and verify a change

Follow the existing TypeScript and JavaScript patterns. Prettier and ESLint define the enforced code style.

```sh
npm run format
npm run lint
```

Use the narrowest relevant checks while developing:

| Change                        | Expected coverage                                                            |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Runtime or persistence        | Runtime tests, type tests when typing changes, and relevant docs             |
| CLI initializer               | Initializer tests and generated-output expectations                          |
| React bindings                | Runtime/type tests and at least one React example                            |
| Public API or behavior        | Tests, roadmap contract, human docs, machine-readable docs, and agent skills |
| Documentation or agent skills | Docs typecheck/build and agent-skill synchronization check                   |
| Examples                      | The changed example's build and typecheck, when available                    |

Before opening a pull request, run the complete suite:

```sh
npm run check:all
```

### Public behavior and documentation

The roadmap and agent contracts describe behavior that must remain aligned with the implementation. When public
behavior changes:

1. Update package tests and type tests.
2. Update the relevant pages in `docs-site/docs`, `docs/roadmap.md`, and machine-readable resources in
   `docs-site/static`.
3. Update the canonical agent skills in `skills/reboil` and `.claude/skills/reboil`.
4. Regenerate their website release copies, then verify them:

```sh
node scripts/release-reboil-skill.mjs
npm run check:skills
```

Do not edit package versions or create release notes in a contribution. Maintainers handle versioning and release
notes after changes are merged.

## Open a pull request

Pull requests must:

- Explain the problem and the chosen solution.
- Link the prior issue or discussion when one was required.
- Include or update tests for behavior changes.
- Update documentation for user-visible changes.
- Identify breaking behavior explicitly.
- Pass every required CI check.

Use a Conventional Commit-style pull request title. Branch commits may use any clear, descriptive format because
pull requests are squash merged.

```text
feat(react): add selector subscriptions
fix(cli): preserve existing entry imports
docs: explain persistence exclusions
```

Allowed title types are `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, and `revert`.
Scopes are optional, lowercase, and may contain digits, `.`, `_`, `/`, or `-`. Add `!` before the colon for a
breaking change.

## Review and merge

At least one person other than the pull request author must approve the change. All required checks must pass and
review conversations must be resolved. Maintainers may request changes for correctness, compatibility, scope,
documentation, tests, or maintainability.

Approved pull requests are squash merged into `main`. The pull request title becomes the commit subject, so make it
accurate and user-focused.
