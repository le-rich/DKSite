# Job application form (Google Forms MVP)

One form serves every role. The careers page opens it with the **Position** field prefilled, so all applications land in a single response Sheet you can filter by role.

## Question set

Order matters: short and required first, long and optional last.

| # | Question | Type | Required | Notes |
|---|----------|------|----------|-------|
| 1 | Position you're applying for | Short answer | Yes | **Must be short answer, not dropdown.** The careers page prefills this with the job title. A dropdown would need updating every time `jobs.json` changes. |
| 2 | Full name | Short answer | Yes | |
| 3 | Email | Short answer | Yes | Turn on response validation: Text → Email address. |
| 4 | Where are you based? | Short answer | Yes | City and country. Enough to know time zone and relocation needs. |
| 5 | Are you legally able to work in Canada? | Multiple choice | Yes | Yes / No / Would need sponsorship |
| 6 | Portfolio, reel, or GitHub | Short answer | Yes | One primary link. Validation: Text → URL. |
| 7 | LinkedIn or other profile | Short answer | No | Validation: Text → URL. |
| 8 | Resume / CV | File upload | Yes | PDF only, 10 MB max. Requires the form to be owned by your Google Workspace account; uploads go to a Drive folder. |
| 9 | Tell us about something you built that you're proud of, and your part in it. | Paragraph | Yes | The single best signal question. Cap at 2,000 chars via validation if you want to keep reviews fast. |
| 10 | Why Dirk? | Paragraph | No | Optional on purpose. Strong candidates answer it anyway. |
| 11 | Earliest start date | Short answer | No | |
| 12 | Salary or rate expectation (CAD) | Short answer | No | Optional keeps it from being a filter on the candidate's side. |
| 13 | How did you hear about this role? | Multiple choice | No | Dirk website / LinkedIn / Work With Indies / Referral / Other. Tells you which external boards are worth paying for. |
| 14 | Anything else? | Paragraph | No | Accessibility needs, availability constraints, etc. |

Skip demographic or EEO questions for now. They add friction and you can't act on them at this size.

## Form settings

- **Responses → Collect email addresses: Verified.** Free duplicate-of-Q3 and stops junk.
- **Responses → Limit to 1 response: Off.** People apply to multiple roles.
- **Presentation → Confirmation message:** "Thanks. We read every application and reply within two weeks."
- **Responses → Link to Sheets.** This Sheet is your review queue. Add columns: `Status` (New / Screen / Interview / Offer / Pass), `Reviewer`, `Notes`.
- **Responses → Get email notifications for new responses: On.**

## Wiring it to the careers page

1. In the form editor, click the three-dot menu (top right) → **Get pre-filled link**.
2. Type anything into the Position field, click **Get link**, copy it.
3. The URL looks like `https://docs.google.com/forms/d/e/1FAIpQL.../viewform?usp=pp_url&entry.123456789=anything`.
4. In `jobs.json`, set:
   - `applyForm.baseUrl` to everything before the `?`
   - `applyForm.positionEntryId` to the `entry.123456789` part
5. Commit. Every "Apply" button now opens the form with the role filled in.

Until both values are set, the page falls back to a mailto link so nothing is broken in the meantime.

## When Forms gets limiting

Signs: you want candidates to see status, you want per-role forms without duplicating the form, you want reviewers who don't have Google access, or file uploads are painful.

Cheapest steps up, in order:

1. **Tally** (free tier). Same prefill trick, nicer file uploads, embeds in the page. Swap `applyForm.baseUrl` and the entry id and nothing else changes.
2. **Airtable form + base.** Review queue with a real kanban, still no code.
3. **Cloudflare Worker + R2 + a Sheet or Airtable API.** Your own form on `careers.html`, resumes in R2, a row per application. ~100 lines, costs cents. Only worth it once volume justifies owning the pipeline.
