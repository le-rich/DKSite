# Managing job listings

The careers page loads the public jobs.json catalog. Each role has a published Google Forms responder URL in applyUrl. Applications go directly to that form and its existing response Sheet; this website stores no applications.

Edit the catalog, verify locally, then commit and push to master for the existing GitHub Pages deployment. Keep private drafts, editor links, response Sheet links, applicant data, and credentials out of this public repository.

## Fields

- id: unique lowercase slug. Share roles using careers.html#<id>.
- open: false hides a role. Also close its Google Form when intake ends; hiding a listing does not close the form.
- title, team: role name and filter group.
- location, workplace, type, posted: optional facts. Dates use YYYY-MM-DD.
- pay: optional object with currency, hourlyMin and hourlyMax. Displayed hourly, never annualized.
- hours, engagementDates: optional sidebar facts.
- description: array of paragraphs.
- responsibilities, requirements, niceToHave, engagement, application: arrays of section items.
- applyUrl: HTTPS Google Forms responder URL (docs.google.com/forms/.../viewform or forms.gle). Missing or invalid links show Applications opening soon; there is no email fallback.
- externalLinks: optional array of objects with label and HTTPS url.

The original shared-form option remains supported through top-level applyForm.baseUrl and applyForm.positionEntryId (entry.<digits>). A per-role applyUrl takes precedence.

## Source and verification

The four launch descriptions were imported from the studio's published LinkedIn listings. Their body text specifies Remote; the LinkedIn dashboard labels said Hybrid. Update both surfaces together if the arrangement changes.

Serve this directory over HTTP for local previews. Verify four roles, correct form destinations, hourly pay, mobile layout, and deep links. Missing jobs.json shows no openings; malformed JSON or other loading failures show a retry message.
