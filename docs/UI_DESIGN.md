# PhotoShare UI Design Brief

This brief guides the interface improvement of the React frontend. It changes how the app looks, not how it works.

## Ground rules

- Do not change any API calls, routes, auth logic or data flow. Only markup, CSS and small UI components.
- Keep plain CSS in `src/index.css` with CSS variables. No CSS framework.
- One allowed new dependency: `lucide-react` for icons.
- Every page must still pass the checkpoints in sections 3.1 to 3.6 of the guide.
- Use original PhotoShare branding and wording. The style is inspired by a reference design, but no names, text or logos are copied from it.
- Work in the stages below. Stop after each stage so the student can review it in the browser.

## Style: frosted glass on a warm gradient

A dark navy background with soft coral and slate-blue glows. A fluted (vertically ribbed) glass texture lies over the glows. Content sits on translucent frosted panels. Headlines are large and light. The single accent is a warm coral, used for the main actions only.

### Design tokens

```css
:root {
  /* Background */
  --bg: #161c33;
  --glow-coral: #f0645a;
  --glow-rose: #c9566e;
  --glow-slate: #3d4f86;

  /* Glass surfaces */
  --glass: rgba(255, 255, 255, 0.08);
  --glass-strong: rgba(255, 255, 255, 0.14);
  --glass-border: rgba(255, 255, 255, 0.16);
  --blur: blur(18px) saturate(140%);

  /* Text */
  --text: #f5f3f0;
  --text-muted: rgba(245, 243, 240, 0.65);
  --text-faint: rgba(245, 243, 240, 0.45);

  /* Accent and states */
  --accent: #f0645a;
  --accent-hover: #ff7a70;
  --accent-soft: rgba(240, 100, 90, 0.18);
  --danger: #ff6b6b;
  --success: #5fd3a0;

  /* Shape */
  --radius-sm: 10px;
  --radius: 16px;
  --radius-lg: 22px;
  --radius-pill: 999px;
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.25);

  /* Type */
  --font: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
}
```

- Font: Inter from Google Fonts (weights 300, 400, 500 and 600).
- Hero headlines: 56 px to 72 px on desktop, weight 400, letter-spacing -0.03em, line-height 1.05.
- Page titles: 32 px, weight 400, letter-spacing -0.02em.
- Body text 15 px. Small labels 12 px to 13 px in `--text-muted`.

### Background (used on every page)

The body gets the gradient glows. A fixed overlay adds the fluted glass ribs.

```css
body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font);
  color: var(--text);
  background:
    radial-gradient(ellipse 45% 55% at 62% 45%, var(--glow-coral) 0%, transparent 70%),
    radial-gradient(ellipse 40% 50% at 30% 30%, var(--glow-slate) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 80% 85%, var(--glow-rose) 0%, transparent 70%),
    var(--bg);
  background-attachment: fixed;
}

/* Fluted glass ribs */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0px,
    rgba(255, 255, 255, 0) 3px,
    rgba(0, 0, 0, 0.06) 6px,
    rgba(255, 255, 255, 0) 9px
  );
  backdrop-filter: blur(6px);
}

#root { position: relative; z-index: 1; }
```

- On the feed and photo pages, reduce the glow strength (for example 60% opacity) so photos stay the focus.
- Respect `prefers-reduced-motion`: no animated glows when it is set.

### Glass panel (reusable class)

```css
.glass {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  box-shadow: var(--shadow);
}
```

## Stage 1: Overall look

- **Background:** apply the gradient and fluted ribs above to every page.
- **Navbar:** transparent, no bar behind it.
  - Left: a small wave or camera icon and the word "PhotoShare" in white, weight 500.
  - Centre: a glass pill holding the links Feed, Groups and Upload. The active link sits in a lighter inner pill with a small coral dot before the text.
  - Right: two round glass buttons. One shows the user's initial (with username and Logout in a small glass dropdown). The other is a menu icon, used on phones only.
- **Buttons:**
  - Primary: coral pill, white text, weight 500, with a small arrow icon (↗) after the text. Hover brightens to `--accent-hover`.
  - Secondary: plain white text link with an arrow, or a glass pill with a border.
  - Danger: glass pill with red text.
  - All buttons: height 42 px, visible focus ring (2 px white at 60% opacity), disabled at 50% opacity, a small spinner while loading.
- **Inputs and selects:** glass background (`--glass`), glass border, pill or `--radius-sm` corners, white text, placeholder in `--text-faint`. On focus the border turns coral.
- **Badges and tags:** small glass pills. Special badges (for example "New" or "3 comments") use a coral pill.
- **Page header:** a large light title and a one-line muted subtitle, left aligned.
- **Feedback:** errors in a glass box with a red left border and an icon. Success in the same style with green.
- **Empty states:** a large thin icon, one light line of text and a coral button.

## Stage 2: Feed and photo cards

- **Search bar:** one wide glass panel above the grid.
  - Top row: the keyword box with a search icon, full width.
  - Second row: uploader, tag, from, to and sort as small glass pills. "Clear filters" as a text link with an x icon.
- **Grid:** 3 columns on desktop, 2 on tablet and 1 on phone. Gap 20 px.
- **Photo card:** a glass panel.
  - Image on top in a 4:3 frame with `object-fit: cover` and rounded top corners.
  - Below: uploader initial in a small round badge with the username, the group name as a faint label, the caption (two lines maximum), tags as glass pills, then the date on the left and a comment icon with the count on the right.
  - Hover: the card lifts by 3 px, the border brightens and the image zooms gently (scale 1.03).
- **Loading:** glass skeleton cards with a soft shimmer.
- **Photo detail page:** two columns on desktop.
  - Left: the large image in a glass frame.
  - Right: a tall glass panel, similar to a booking card. It shows the uploader, date, caption and tags, then the comments.
  - On phones, the image goes on top.
- **Comments:** each comment in a slightly lighter inner glass block (`--glass-strong`) with the initial badge, username, time and text. Edit and Delete as small round icon buttons. "(edited)" in `--text-faint`. The add-comment box at the bottom with a coral send button.
- **Upload page:** a large glass drop zone with a dashed border, an upload icon and the text "Choose a photo (JPG, PNG or WebP, up to 5 MB)". After choosing, show the preview inside the panel with a "Change photo" link. The group, caption and tags fields below, then a coral "Upload" button.
- **Groups page:** the group list as glass cards with the member count as a pill. The selected group has a coral border. The members list and the add-friend form sit in a glass panel on the right.

## Stage 3: Login and register (the landing screen)

This is the first screen in the demo video, so it carries the full hero style.

- Full-screen background with the strongest glows.
- **Left side, bottom aligned:**
  - A huge light headline over two lines, for example "Your moments, shared with your people."
  - A short muted line below it, for example "Private photo sharing for friend groups. Upload, comment and find any photo in seconds."
- **Right side:** a tall glass card holding the login or register form.
  - A small pull-handle line at the top of the card, as a decorative detail.
  - Fields as glass inputs, a password show/hide eye icon, a full-width coral submit pill with an arrow.
  - A text link at the bottom to switch between Login and Register.
- **Feature strip** along the bottom of the screen, separated by a thin line, with a short coral line above the first item. Five items, each a thin icon and two short lines of muted text:
  - "Private friend groups"
  - "Secure photo storage"
  - "Comments in real time"
  - "Search by tag or keyword"
  - "Works on any device"
- On phones: the headline shrinks to about 40 px, the form card goes below it at full width and the feature strip becomes a 2-column grid.

## Stage 4: Mobile layout

- Test at 375 px width (iPhone SE) and 768 px (tablet) in the browser DevTools.
- Navbar on phones: logo on the left and the round menu button on the right. The menu opens a glass sheet with the links and Logout.
- All tap targets at least 44 px high.
- No horizontal scrolling on any page.
- Forms and buttons go full width on phones.
- Check that `backdrop-filter` still looks good on phones. If a device is slow, lower the blur to 10 px.

## Accessibility checks

- Text on glass must stay readable. If contrast is weak over a bright glow, raise the panel opacity to `--glass-strong`.
- Keyboard focus is always visible.
- Every icon-only button has an `aria-label`.

## Done when

- Every page uses the tokens above. No leftover default styles.
- The app looks consistent on desktop, tablet and phone.
- All section 3 checkpoints still pass with two users in two browsers.
