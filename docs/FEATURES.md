# Feature Requests

Ideas and requests for the Almas Apps landing page
([almasappsllc.github.io](https://almasappsllc.github.io)). The site is a single
static `index.html` with no build step — see [`../README.md`](../README.md).

**To add one:** tell Claude "feature: <description>".

Priority is `P1` (next release-ish) / `P2` (soon) / `P3` (someday).

---

## 📋 Planned

### LP-001 — Google Sheets setup: walkthrough video + photo guide · P2
Requested 2026-08-23. Several Almas apps log to a Google Sheet through an Apps
Script web app, and the setup is the part people get stuck on: most users have
never deployed an Apps Script before, and written steps for something you've
never done once are hard to follow. Put a guide on the landing page.

Two deliverables, same content:

1. **A walkthrough video** of the whole integration, start to finish. AI-generated
   is explicitly fine — it doesn't need to be a real screen recording.
2. **A visual photo guide** — the same steps as captioned screenshots, for people
   who'd rather scan images than sit through a video.

Notes for whoever builds it:

- The flow is shared, not per-app: **Quick Log** (`quicklog/apps-script/`),
  **Tally** (`tally/apps-script/Code.gs`) and **Pulse** (`pulse/apps-script/Code.gs`)
  all use the same "paste the script, deploy as web app, copy the `/exec` URL
  into the app" pattern. Cover it once and note the per-app differences rather
  than making three guides.
- Tally already learned that users paste the wrong URL — the *sheet* URL instead
  of the Apps Script `/exec` URL (see the resolved entry in
  `tally/docs/BUGS.md`). That's the single most important step to make
  unmistakable in both the video and the photo guide.
- The site inlines its assets as base64 data URIs and has no build step, so a
  video needs a hosting decision: an external embed would be the first
  third-party request on a page that currently makes none, which cuts against
  the cookie-free/no-tracking positioning. Worth deciding before recording.

Originally filed as "Q Log" — cross-referenced from `QuickLog/docs/FEATURES.md`
as FR-002.
