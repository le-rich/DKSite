# Managing job listings

`careers.html` reads `jobs.json` from the repo root at page load. **That file does not exist yet.** Without it the page shows "No open roles right now." When you are ready to publish, create it and commit to `master`. GitHub Pages redeploys within a minute or two.

Keep unpublished drafts outside the repo. The repo is public, so anything committed is visible on GitHub even if the site never links to it.

## Creating jobs.json

```json
{
  "applyForm": {
    "baseUrl": "https://docs.google.com/forms/d/e/FORM_ID/viewform",
    "positionEntryId": "entry.123456789"
  },
  "jobs": [
    {
      "id": "example-role",
      "open": true,
      "title": "Example Role",
      "team": "Art",
      "location": "Vancouver, BC",
      "workplace": "Hybrid",
      "type": "Contract",
      "posted": "2026-10-01",
      "pay": { "currency": "CAD", "hourlyMin": 30, "hourlyMax": 45 },
      "description": ["One or more paragraphs."],
      "responsibilities": ["Bullet."],
      "requirements": ["Bullet."],
      "niceToHave": ["Bullet."],
      "externalLinks": [{ "label": "LinkedIn", "url": "https://..." }]
    }
  ]
}
```

See `docs/application-form.md` for where the two `applyForm` values come from. Until they are set, Apply buttons fall back to a mailto link.

## Close a role

Set `"open": false`, or delete the entry. Delete `jobs.json` entirely to return to the empty state.

## Field reference

| Field | Required | What it does |
|-------|----------|--------------|
| `id` | Yes | URL slug, lowercase with hyphens. Deep link is `careers.html#<id>`. Must be unique. |
| `open` | Yes | `true` shows the role, `false` hides it. |
| `title` | Yes | Shown as the heading and sent to the application form as the Position. |
| `team` | Yes | Powers the team filter. Use consistent names (Engineering, Art, Design, Production). |
| `location` | No | e.g. "Vancouver, BC". |
| `workplace` | No | On-site / Hybrid / Remote. |
| `type` | No | Full-time / Contract / Internship. |
| `posted` | No | `YYYY-MM-DD`. |
| `pay` | No | `{ "currency": "CAD", "hourlyMin": 30, "hourlyMax": 45 }` shows "CAD $62,400 – $93,600 / year" on the card; the hourly range appears in the expanded detail. Omit `hourlyMax` for a single figure. Yearly is hourly × 2080; set `hoursPerYear` to override. |
| `description` | No | Array of paragraphs. |
| `responsibilities` | No | Array of bullets under "What you'll do". |
| `requirements` | No | Array of bullets under "What we're looking for". |
| `niceToHave` | No | Array of bullets under "Nice to have". |
| `applyUrl` | No | Overrides the shared form for this role only. Leave empty (`""`) to use the shared form. |
| `externalLinks` | No | Array of `{ "label": "LinkedIn", "url": "..." }`. Shown as secondary buttons under Apply. |

Empty arrays and missing optional fields are fine; their sections simply don't render.

## Top-level settings

- `applyForm.baseUrl` and `applyForm.positionEntryId`: the shared Google Form. See `docs/application-form.md` for how to get these. Until set, Apply buttons fall back to a mailto link.

## Previewing locally

`fetch()` won't load `jobs.json` from a `file://` URL, so run a local server from the repo root:

```
python -m http.server 8000
```

then open http://localhost:8000/careers.html.
