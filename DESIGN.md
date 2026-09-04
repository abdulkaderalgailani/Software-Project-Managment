# Design Reference — Internship Tracker UI

Target look for the redesign. `@`-mention this file in every redesign prompt so all pages match.
Aesthetic: **Reset HR Consulting** — deep navy + orange on white, clean, professional, generous whitespace.

---

## Core rule

**Orange is a single accent, never a fill.** On each screen, orange marks exactly one kind of thing:
the active nav item, the primary button, an "in progress" marker, the user's own chat bubble.
Everything else is navy (structure) + neutrals (text/surfaces). No third color except tiny status pills.

---

## Color tokens

Every color is a token with a light and dark value — nothing hardcoded (this is what makes the
light/dark toggle work).

```
                        LIGHT              DARK
--brand (orange)        #F26722            #F26722   (accent, both modes)
--brand-tint            #FDEEE6            #3A1F12   (orange wash: active nav, own bubble)
--navy (structure)      #0F1E46            #0F1E46   (sidebar, headers)
--page-bg               #F7F8FA            #0A1230
--surface (cards)       #FFFFFF            #111C40
--border                #E6E8EE            #1C2B52
--text                  #0F1E46            #F0F3FA   (headings/primary)
--text-body             #374151            #CDD5E6
--text-muted            #6B7280            #94A0BD
--text-faint            #9AA2B1            #7C88A6
status success (pill)   bg #E1F5EE / text #0F6E56    (dark: bg #0C342B / text #34D399)
```

## Typography

- **Headings:** Poppins (500). **Body:** Inter or system sans (400). Load from Google Fonts.
- Two weights only: 400 body, 500 headings/labels. Sentence case everywhere.
- Scale: page title ~22px, section ~16px, body ~14px, labels/muted ~12–13px, big stat numbers ~22–26px.

## Components

- **Cards:** white surface, 0.5px border, 11–12px radius, ~14–16px padding.
- **Sidebar:** navy background, full height. Active item = orange tile/icon; inactive = muted blue-gray.
- **Header bar:** navy, page title left, dark/light toggle (moon/sun icon) right.
- **Primary button:** orange bg, white text, 8px radius. Only one primary per screen; others are outline.
- **List rows:** white card with a **3px left orange border** on the most recent/active row (navy/neutral border otherwise).
- **Status pills:** small, rounded, tinted — green "done", orange-tint "in progress", neutral otherwise.
- **Avatars:** initials circle — navy bg / white text, or orange-tint bg / orange text.
- **Focus rings:** visible in both modes (orange ring), never removed.

---

## Per-page patterns

- **Sign in / Sign up** — centered white card on page-bg, wordmark ("reset tracker" — orange "reset"),
  labeled fields, "Forgot password?" link (orange), full-width orange Sign in button.
- **Dashboard** — header + row of stat cards (Interns / Submitted / Open tasks) + "Recent activity"
  list with the orange left-border on the newest row. (Role-aware content stays as built.)
- **Daily Progress / Weekly Report / Diary** — a single form card (summary, learnings, hours, etc.) with
  an orange "Save" button, and a list of past entries below. (Reports/Diary reuse this pattern.)
- **Tasks** — three columns (To do / In progress / Done); cards with title + meta; orange left-border on
  the in-progress card; "Assign task" primary button (supervisors/admin only).
- **Messages** — chat list (left) + thread (right); own bubbles orange, others white; active chat has
  orange-tint background in the list.
- **Team** — grid of member cards: initials avatar + name + role. (Supervisor sees their interns; admin
  sees everyone.)
- **Activity Log** — full-page version of the dashboard's "Recent activity" list.

---

## Build discipline

- Do it on the `ui-redesign` branch. **Design-system-first:** tokens + fonts + dark toggle + one screen,
  confirm, then roll out **one page per prompt**.
- **Visual only** — never change data, queries, hooks, or RLS while restyling.
- **Test both modes on every screen.** Dark mode is where bugs hide: unreadable low-contrast text, a card
  that stayed white, a vanished border or focus ring. Read every element in dark before moving on.
