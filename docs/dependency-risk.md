# Dependency audit status

Latest result, 21 October 2026: **two high, zero moderate, zero critical**, audit exit 1. The scoped `xcode@3.0.1>uuid: 11.1.1` override remediates the UUID finding; real Expo dependency resolution, Xcode parse/generate/write round-trip and undersized-buffer regression tests pass. Installation and frozen offline reinstall passed without lifecycle scripts. No advisory suppression or forced unrelated upgrade. node-forge 1.4.0 and braces 3.0.3 remain high findings with no published patched versions at inspection. EX-00-S01 remains open. Earlier counts below are historical. See the [completion review](technical-completion-review.md) for exact scope and build limitations.

Checked 16 October 2026 and rechecked with `pnpm audit --json` on 19 October after the contract-foundation tooling was added. Result remains **2 high, 1 moderate, 0 critical**; the new tooling introduces no additional reported advisories. This is a scaffold with local-only entry points, not a production security approval. The normal compile/format checks can pass while the separate audit gate fails.

| Package / installed version | Advisory and affected chain                                                                                               | Disposition                                                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| node-forge 1.4.0 / high     | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv); Expo CLI/code-signing certificates              | Advisory lists no patched version. Track upstream; no signing/publishing workflows are configured. Requires remediation before production use.                                               |
| braces 3.0.3 / high         | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm); Metro/micromatch and Next lint plugin/fast-glob | Advisory lists no patched version. Build tooling exposure must be assessed; no assumption that “development dependency” means safe. Requires upstream-compatible remediation before release. |
| uuid 7.0.3 / moderate       | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq); Expo config plugins → xcode                     | Audit reports patched >=11.1.1. A forced major override is not applied without compatibility validation of the owning dependency. Include in the same remediation ticket.                    |

No advisory is ignored and no major-version override is forced to manufacture a green audit. Dependency lifecycle scripts remain disabled. Loopback-only development entry points and absence of business routes limit current scaffold exposure, but are not proof of unreachability or risk acceptance.

## EX-00-S01 — dependency remediation gate

After the 20 October migration/pool milestone installed pg 8.23.1, node-pg-migrate 9.0.0 and @types/pg 8.23.1 and updated the shared lockfile, `pnpm audit --json` still exited 1 with two high/one moderate/zero critical findings and the same three advisory IDs. No additional reported finding, suppression or major override. See [ADR 0008](adr/0008-migrations-and-pool-transactions.md).

Rechecked 20 October 2026 with `pnpm audit --json`: still **2 high, 1 moderate, 0 critical**; command exited 1. Registry data still reports no published patched version for node-forge/braces and uuid patched at >=11.1.1. The linked advisory pages were also checked. No suppression, major override, dependency update or risk acceptance was applied. This gate remains open; external integration deferral does not close it.

Owner: engineering/security role; assign an actual person before implementation. Due: before CI can be considered fully green and before production release. Dependencies: upstream-compatible fixes or a separately reviewed patch with regression/security evidence.

1. Recheck current advisories and owning Expo/Metro/Next package releases.
2. Upgrade compatible owners where a fix exists; otherwise assess a minimal maintained patch and verify both build compatibility and the vulnerable behavior.
3. Validate uuid/xcode compatibility rather than blindly overriding across major versions.
4. Reinstall frozen lockfile, run peer checks, framework/native build checks and audit.
5. Close only with audit/remediation evidence; no `continue-on-error`, ignore list or severity downgrade.

GitHub CI runs the high-severity audit as a failing gate. Until remediation, its expected status is red even when compilation succeeds. No cloud deployment pipeline exists.
