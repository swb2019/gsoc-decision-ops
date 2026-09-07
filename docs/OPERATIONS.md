# Static release operation

Shannon Brown owns promotion, capacity review and rollback. The current qualification record holds public deployment. Development and review introduce no paid inference, server, analytics or recurring service.

## Reproducible capacity arithmetic

Every build writes `qa-output/release-budget.json` using `scripts/measure-release-budget.mjs`. It counts the complete static site, HTML and referenced entry assets, and the verified offline pack. The default planning example is 10,000 new sessions; `HOURGLASS_PLANNED_NEW_SESSIONS` changes the assumption. Each planned session conservatively includes both a fresh entry load and an entire offline download, plus 25% headroom. This is arithmetic, not measured traffic or a forecast. Legacy use, retries and neighboring portfolio traffic are additional.

Rechecked 6 September 2026: GitHub documents a 1 GB published-site limit and a 100 GB/month soft bandwidth limit. Pages is unsuitable for hosting a commercial SaaS operation. [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

The script emits an owner-review warning at 70% of either known limit and calculates a conservative session count before review. Reliable traffic telemetry has not been connected. Until separately approved telemetry exists, the owner reviews the estimate before every promotion and whenever expected use rises. No scheduled alert or background monitoring is claimed. If uncertainty would consume the remaining margin, hold promotion, reduce transfer or plan suitable hosting before expansion.

## Promotion and rollback

1. Keep the previous known-good static artifact and its checksum outside the new artifact. Preserve its matching source revision and offline manifest.
2. Complete semantic, browser, accessibility and content qualification against one built artifact at `/gsoc-decision-ops/`. Record the reviewed source revision and evidence in `release/qualification.json`; do not mark human gates passed to bypass the hold.
3. Rehearse restoring the prior artifact in staging within 15 minutes. Check root, all eight scenario routes, assets, local legacy review, new journal restore and full reports. Preserve every original recovery file.
4. Retire the faulty Glasshouse offline pack from Display & local data. This removes only namespaced pack caches/workers; it does not delete the journal. Verify neighboring portfolio data before and after rollback.
5. Promote that same tested static artifact. A later source change requires renewed affected checks and qualification of the new revision. The deployment workflow rejects executable changes after the recorded review revision.

The staged exercise remains pending. A successful local build or offline test does not stand in for that rehearsal.

## Maintenance

Each month, the owner reviews the lockfile advisories, font/asset licenses, route smoke checks and the synthetic mission. Each quarter, review scenario/rubric interpretation and capability wording. Material rule or actor-knowledge changes require pinned versions and an interpretation note for older records. Reviewer time, participant compensation and specialist art are separately approved project costs. Any later recurring spend requires an approved cap and a disable path.
