# PhotoShare UI Design Brief

This brief guides the interface improvement of the React frontend. It changes how the app looks, not how it works.

## Ground rules

- Do not change any API calls, routes, auth logic or data flow. Only markup, CSS and small UI components.
- Keep plain CSS in `src/index.css` with CSS variables. No CSS framework.
- One allowed new dependency: `lucide-react` for icons.
- Every page must still pass the checkpoints in sections 3.1 to 3.6 of the guide.
- Work in the stages below. Stop after each stage so the student can review it in the browser.

## Style: clean light

The photos are the focus. The interface stays quiet around them.

### Design tokens

```css
:root {
  --bg: #f7f8fa;
  --surface: #ffffff;
  --border: #e5e7eb;
  --text: #111827;
  --text-muted: #6b7280;
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-soft: #eff6ff;
  --danger: #dc2626;
  --danger-soft: #fef2f2;
  --success: #16a34a;
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --font: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
}
```

- Font: Inter from Google Fonts, with the system font as fallback.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48 px.
- Base text 15 px. Headings 20 px to 28 px, weight 600.

## Stage 1: Overall look

- **Navbar:** white, sticky, thin bottom border. Logo text "PhotoShare" with a camera icon on the left. Links Feed, Groups and Upload in the centre or right, with the active link highlighted. On the far right, a round avatar with the user's initial and a Logout button.
- **Buttons:** three variants with consistent height (40 px), radius and padding.
  - Primary: solid blue, white text.
  - Secondary: white with a border.
  - Danger: red text, soft red background on hover.
  - All buttons have a hover state, a visible focus ring and a disabled state at 50% opacity.
  - Loading buttons show a small spinner and the action text, for example "Uploading...".
- **Inputs and selects:** 40 px height, 1 px border, blue focus ring, label above each field.
- **Cards:** white surface, `--radius`, `--shadow-sm`, 1 px border.
- **Page layout:** max width 1100 px, centred, 24 px side padding. Each page has a clear title and a short subtitle.
- **Feedback:** error messages in a soft red box with an icon. Success messages in a soft green box.
- **Empty states:** centred icon, one line of text and an action button. For example, "No photos yet" with an "Upload a photo" button.

## Stage 2: Feed and photo cards

- **Grid:** responsive, 3 columns on desktop, 2 on tablet and 1 on phone. Gap 20 px.
- **Photo card:**
  - Image in a fixed 4:3 frame with `object-fit: cover` and rounded top corners.
  - Below: uploader avatar and username, group name as a small pill, caption (two lines maximum), tags as small blue pills, then the date and comment count with a comment icon.
  - Hover: card lifts slightly (translateY(-2px)) and the shadow grows. The image zooms gently.
- **Loading:** skeleton cards (grey animated blocks) while the feed loads, instead of plain text.
- **Search bar:** one tidy card above the grid. Keyword search box full width on top with a search icon. Uploader, tag, dates and sort in one row below. "Clear filters" as a secondary button. On phones the filters stack.
- **Photo detail page:** two columns on desktop. The large image on the left. On the right, the uploader, caption, tags, date and the comment section. On phones, the image goes on top.
- **Comments:** each comment shows the avatar, username, time and text. Edit and Delete appear as small icon buttons. "(edited)" in muted text. The add-comment box is fixed at the bottom of the comment panel.
- **Upload page:** a large dashed drop zone with an upload icon and the text "Click to choose a photo (JPG, PNG or WebP, max 5 MB)". After choosing, show the preview with a "Change photo" button. Group, caption and tags fields below.

## Stage 3: Login and register

- Split screen on desktop. The left half shows the brand: the logo, a short tagline such as "Share photos privately with your friend groups" and a soft blue gradient background. The right half shows the form in a white card.
- On phones, only the form card is shown, with the logo above it.
- A link at the bottom switches between Login and Register.
- Password field with a show/hide eye icon.
- Errors appear in the soft red box above the submit button.

## Stage 4: Mobile layout

- Test at 375 px width (iPhone SE) and 768 px (tablet) in the browser DevTools.
- Navbar on phones: logo on the left and a menu icon on the right that opens the links. Alternatively, a fixed bottom tab bar with Feed, Groups and Upload icons.
- All tap targets at least 44 px high.
- No horizontal scrolling on any page.
- Forms and buttons go full width on phones.

## Done when

- Every page uses the tokens above. No leftover default styles.
- The app looks consistent on desktop, tablet and phone.
- All section 3 checkpoints still pass with two users in two browsers.
