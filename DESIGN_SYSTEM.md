# FlowBoard Design System

This guide describes the look and feel of FlowBoard as designed in the Figma file "FlowBoard Designs (JD) – Copy" (page "Base Designs"). It is written in plain language so designers, writers and developers can all use it.

**How the numbers were gathered.** Colors, font sizes, spacing and corner roundness were read directly from the design file. The file has no named color or text styles, so the names used below (like "Brand Blue") are labels I chose for convenience; they are not names from Figma. A few details, such as the exact roundness of the columns and the dark backdrop behind pop-ups, were judged from pictures rather than measured, and they are marked "approximately."

---

## 1. Colors

### Main colors

| Name | Value | Where it is used |
|---|---|---|
| Brand Blue | #0369A1 | Primary buttons (Save, Sign in, Create), the logo tile, text links such as "Forgot password?" |
| Ink | #0A0A0A | Main text: headings, labels, card titles, button text on light backgrounds |
| Muted Grey | #717182 | Secondary text, placeholder text inside fields, small uppercase field labels, dates, the card counts, the "Add card" link |
| White | #FFFFFF | Cards, pop-ups, the top bar, the inside of input fields |
| Soft Grey | #F3F4F6 | The page background, the column panels, and the track behind the Password / Magic link / Sign up switch |

### Supporting colors

| Name | Value | Where it is used |
|---|---|---|
| Border Grey | Black at 10% strength | The thin outline around cards, input fields, board tiles, and the divider lines in the top bars and pop-up footers |
| Danger Red | #D4183D | Destructive actions, such as the "Delete card" link |
| Focus Tint | #E0E7FF (a pale indigo) | The fill of an input field that is being typed in, with its outline removed |
| Avatar Indigo | #6366F1 | The round user avatar in the top bar |
| Backdrop | Black at about 50% (approximately) | The dim layer behind pop-ups |

### Things to watch
- **The "New Board" button is purple (#8A38F5)**, while every other main button is Brand Blue. This looks like an inconsistency in the file. Pick one; Brand Blue would match the rest of the design.
- Muted Grey on Soft Grey is fairly low contrast, so use Ink for anything essential.

---

## 2. Typography

**Typeface:** Inter, used everywhere. Weights used: Regular, Medium and Semi Bold.

Letter spacing is slightly tightened on larger text and slightly widened on the small uppercase labels. Each style below lists its size and the height of its line.

| Style | Size / line height | Weight | Where it is used |
|---|---|---|---|
| Page title | 24 / 32 | Semi Bold | "FlowBoard" on the sign-in screen, "My Boards" heading |
| Board title | 24 / 36 | Medium | The board name in the sub-bar (for example, "new board") |
| Section / pop-up title | 18 / 28 | Medium | Pop-up headings ("Card", "Create board"), board tile titles |
| Body and controls | 16 / 24 | Regular or Medium | Navigation, button labels, text typed into fields |
| Small body | 14 / 20 | Regular or Medium | Field labels such as "Name", secondary text, links, the sign-in toggle labels, column headings |
| Micro label | 12 / 16 | Medium, all capitals, slightly wide spacing | Field labels such as DESCRIPTION, PRIORITY, DUE DATE |
| Tiny | 12 / 16 | Medium | The initial inside the avatar |

Notes:
- Two label styles exist in the pop-up: the first field ("Name") uses the small dark style, while Description, Priority and Due Date use the micro uppercase grey style. They look slightly inconsistent; choose one style for all labels.
- The text size of a card's title was read as the small body size (14), based on the card's height. Treat that as likely rather than confirmed.

---

## 3. Spacing and sizing

The design follows a steady 4-pixel rhythm; most gaps are 8, 12, 16, 24 or 32 pixels.

### Gaps
- **8 px** between a label and its field, and between an icon and its text.
- **12 px** between buttons that sit side by side, and between items in the sub-bar.
- **16 px** between stacked form fields, between columns, between board tiles, and inside a column between its heading and its first card.
- **24 px** pop-up padding, top bar side padding, and the space between a pop-up's heading and its content.
- **32 px** the sign-in card's inner padding, and the side padding of the board area and the sub-bar.

### Corner roundness
- **10 px:** input fields, buttons, task cards, board tiles. This is the signature roundness.
- **16 px:** pop-ups and the sign-in card.
- **8 px:** the segments inside the sign-in toggle.
- **14 px:** the large logo tile on the sign-in screen.
- **Fully round:** the avatar.
- **Columns:** gently rounded, approximately 10 px.

### Shadows
- Pop-ups carry a soft, wide, low shadow that lifts them well above the page.
- The sign-in card has a similar but slightly smaller shadow.
- The active segment of the sign-in toggle has a tiny shadow.
- Cards and columns have no shadow; they rely on their thin border or grey fill.

### Key dimensions
- **Top bar:** 65 px tall, white, with a thin line underneath. A second sub-bar below it is 69 px tall.
- **Buttons and fields:** buttons are 44 px tall; text fields are about 46 px tall; the multi-line description box is 80 px tall. In the file the Priority dropdown (38 px) and Due Date field (42 px) are shorter than the others; they should probably all be 46 px.
- **Card pop-up:** 512 px wide; 24 px padding.
- **Create board pop-up:** 448 px wide.
- **Sign-in card:** 448 px wide with 32 px padding.
- **Board tiles:** 308 px wide by 105 px tall, with 24 px of padding inside.
- **Columns:** about 320 px wide, 16 px apart, 16 px of padding inside.
- **Icons:** 16 px next to text links, 18–20 px in buttons, 24 px in the large logo tile.

---

## 4. Component patterns

### Column ("Status column")
A tall soft-grey panel with rounded corners. The columns in the design are **To Do, In Progress and Done**.

From top to bottom:
1. **Header row.** The column name on the left in dark small text, and on the right a tiny white round badge showing how many cards the column holds, in grey text.
2. **Card area.** The cards stack vertically with a small gap between them.
3. **Empty state.** When a column has no cards, it shows a white box with a dashed grey outline, an upload-arrow icon, and the grey text "Drop a card here or add one below."
4. **"Add card" link.** At the very bottom, a quiet link with a small plus icon and the words "Add card" in grey. It has no background or border.

### Task card
A small white rectangle with a thin Border Grey outline and 10 px rounded corners. It has about 14 px of padding. In the design a card shows **only its title** ("New Task") in dark text. There is no assignee, priority badge or due date visible on the card itself.

### Card pop-up (add and edit)
A white 512 px pop-up with 16 px rounded corners and a large shadow, over the dim backdrop.

From top to bottom:
1. **Header:** the title "Card" on the left and a small close (X) icon on the right.
2. **Name:** a label and a full-width text field with the placeholder "Enter card name…"
3. **Description:** a micro uppercase label and an 80 px multi-line box with the placeholder "Add a description…"
4. **Priority and Due Date:** two fields sitting side by side, each half the width, 16 px apart.
5. **Footer:** separated by a thin line. "Delete card" is on the left in Danger Red. On the right, a plain "Cancel" text button followed by a blue "Save" button.

### Buttons
- **Primary:** Brand Blue fill, white medium text, 44 px tall, 10 px corners, 16 px side padding.
- **Secondary / cancel:** no fill or border, dark medium text.
- **Destructive text link:** Danger Red, small medium text, no fill.
- **Quiet add link:** grey text with a plus icon, no fill (the "Add card" link).

### Form fields
White background, thin Border Grey outline, 10 px corners, 12 px side padding, with grey placeholder text. A field being typed in changes to the pale indigo Focus Tint fill with no outline. Labels sit 8 px above the field.

### Top bar
White, 65 px tall, thin line underneath. On the left: the small blue logo tile (32 px), the word "FlowBoard", and a "Boards" link. On the right: the round indigo avatar with the user's initial, and a "Sign out" link.

### Sub-bar (inside a board)
69 px tall with a thin line underneath. It reads as a trail: "Boards" in grey, a slash, then the board name large and dark, followed by a small grey note such as "3 columns."

### Board tile (on the "My Boards" page)
A white 308 × 105 px tile with a thin outline and 10 px corners. It shows the board title (18 px, dark) and below it the date created in small grey text.

### Sign-in screen
A soft-grey page with the logo tile, the "FlowBoard" title and a grey line ("Sign in to manage your boards") centered above a white card. The card begins with a three-part switch (Password, Magic link, Sign up) on a soft-grey track where the chosen option is a white raised segment. Below it: Email and Password fields, a right-aligned blue "Forgot password?" link, and a full-width blue "Sign in" button.

---

## 5. How the app applies this design

The app was restyled to follow this guide. These are the intentional differences, so nobody mistakes them for mistakes:

- **Four columns, not three.** The production app keeps Backlog, In Progress, In Review and Done. All four use the column pattern above.
- **Cards keep assignee, priority and due date.** The design shows only a title, but production cards need these fields, so they appear under the title in small grey text with a colored priority tag.
- **No Description field, Magic link or multi-board page yet.** These are in the design but are new features, not styling, so they were left out.
- **Muted grey is a touch darker (#6A6A7C instead of #717182).** The design's grey is too faint on the soft-grey columns to meet accessibility contrast (4.5 to 1). The change is barely visible.
- **Form field outlines are a mid grey (#85859A) instead of the 10% black outline.** The faint outline fails the 3 to 1 contrast needed for form controls. Cards, columns and tiles keep the faint outline.
- **Focused fields get both the pale indigo fill and a blue ring.** The ring keeps keyboard focus clearly visible.
- **The "Add card" button is blue like the rest** (the design's purple "New Board" button was treated as an inconsistency).
- **All form labels use the same small dark style.** This resolves the two label styles in the design.
- **Extra pieces added to fit the pattern:** a "Team board" title with a "4 columns" note in the sub-bar, and a "Delete card" link in the edit pop-up (new cards do not show it).
- **A dark theme** is kept for people whose device is set to dark mode; it uses the same shapes and spacing with darker colors. The design file has no dark version.
- **The Inter font** is bundled with the app rather than loaded from the internet.
- **Brand spelling:** the screens say "FlowBoard" as in the design; the page title and search/sharing text still say "Flowboard".

## 6. Open questions for the designer
1. Should the "New Board" button be Brand Blue like the others?
2. Should every form field be the same height?
3. Which label style should the pop-up use throughout?
4. Where do assignee, priority and due date appear on a card, if at all?
