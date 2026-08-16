# SWAP-THIS — everything in this repo that is still your friend's

This is the checklist for turning `tanqinghua.` into *your* site. Every item below is
a place where his name, his links, his accounts, his writing, his drawings or his
legal filings are still baked into the code.

> **⚠️ About the line numbers below — read this first.**
>
> This checklist was written against the `annotated` branch, a commented copy of the
> code that was lost and never pushed to GitHub. The code you have now is clean `main`,
> which is **179 lines shorter in `js/main.js`** and shorter in the HTML files too.
>
> **Every line number below is therefore offset.** Don't delete by line number. Search
> for the quoted code instead — the quoted snippets in this document are all still
> accurate, only their positions moved.
>
> Verified corrections for the clean `main` branch:
>
> | Item | Doc says | Actually at |
> |---|---|---|
> | `beianRow` block, `js/main.js` | 446–465 | **267–286** |
> | `data-tally-open`, `index.html` | 34 | **30** |
> | Tally script (commented out), `index.html` | 52 | **46–47** |
> | `.note-bubble` block, `index.html` | 33–40 | **29–36** |
> | `.contact-email`, `contact.html` | 29 | **28** |
> | `.social-row`, `contact.html` | 33–39 | **30–38** |
> | doodle images, `contact.html` | 46 | **55–57** |
> | first `.app-card`, `works.html` | 28 | **27** |
> | about-page self description, `about.html` | 28–37 | **26–35** |
> | `idbetter.run` strikethrough, `about.html` | 36 | **34** |
> | `data-degree-trigger`, `about.html` | 75 | **72** |
> | degree modal block, `about.html` | 84–93 | **79–88** |
> | the two `@font-face` rules, `css/style.css` | 8–17 | **7–16** |
> | `--font-hand`, `css/style.css` | 22 | **19** |
>
> `package.json` lines 2, 14, 21 and 23 were checked and are **still correct**.

Work top to bottom. The first three sections are the ones that actually matter —
sections 4 and 5 are "must delete or you will have a problem", and section 6 is
optional polish.

A quick way to check your progress at any point:

```bash
cd tanqinghuadot
grep -rn "tanqinghua\|idbetterrun\|woxiantao" --include=*.html --include=*.js --include=*.json --include=*.css --include=*.webmanifest .
```

When that returns nothing but hits inside `WALKTHROUGH.md` and this file, you're done
with the renaming half of the job.

---

## 1. The site name — "tanqinghua."

This string is his name, and it appears in eight separate places. Miss one and it'll
resurface in a browser tab or a footer at the worst moment.

| Where | Line | What it is |
|---|---|---|
| `partials/nav.html` | 2 | The big handwritten name in the top-left of every page |
| `index.html` | 6 | `<title>tanqinghua.</title>` |
| `about.html` | 6 | `<title>about — tanqinghua.</title>` |
| `works.html` | 6 | `<title>works — tanqinghua.</title>` |
| `talks.html` | 6 | `<title>talks — tanqinghua.</title>` |
| `contact.html` | 6 | `<title>contact — tanqinghua.</title>` |
| `works/notiee.html` | 6 | `<title>` |
| `works/artista.html` | 6 | `<title>` |
| `works/dreamland.html` | 6 | `<title>` |
| `works/tomanotes.html` | 6 | `<title>` |
| `talks/detail.html` | 6 | `<title>` — this one is a placeholder, see the next row |
| `js/talks.js` | 309 | `document.title = ... + " — tanqinghua.";` — blog posts set their own title at runtime, so the HTML one above is overwritten. Change **both**. |
| `js/main.js` | 443 | `copy.textContent = "Copyright © 2026 tanqinghua. All Rights Reserved.";` — the footer, generated in JavaScript, not written in any HTML file |
| `js/i18n.js` | 58 | `"footer": "© 2026 tanqinghua. 保留所有权利。"` — the Chinese translation of that same footer |
| `assets/favicon/site.webmanifest` | 2–3 | `name` and `short_name`. These are what show up if someone adds your site to their phone home screen. |

Note the pattern worth understanding: the footer text exists **twice**, once as English
in `main.js` and once as Chinese in `i18n.js`. That's how the whole bilingual system
works — English lives in the code as real content, and the dictionary only holds
Chinese. There is more on this in `WALKTHROUGH.md`.

---

## 2. Contact details and social accounts

All in `contact.html`.

- **Line 29** — `<a class="contact-email" href="mailto:woxiantao@icloud.com">woxiantao@icloud.com</a>`.
  His personal email, in the `href` *and* in the visible text. Change both halves.
- **Lines 33–39** — the `.social-row`. Seven links, all his:

  | Line | Service | Account |
  |---|---|---|
  | 33 | Instagram | `idbetterrun` |
  | 34 | LinkedIn | his real profile (URL-encoded Chinese name) |
  | 35 | rednote / 小红书 | `xhslink.com/m/xy3yXF6OmK` |
  | 36 | douyin | `v.douyin.com/9Ga_apWjjQg` |
  | 37 | GitHub | `idbetterrun` |
  | 38 | reddit | `No-Town-2478` |
  | 39 | bonjour.bio | `idbetterrun` |

  Delete the rows you don't use rather than leaving dead links. Each one is a
  self-contained `<a class="social-chip">` — the row is a flex container, so removing
  any number of them reflows cleanly with no CSS changes.

  If you add a service, copy an existing line and keep `target="_blank" rel="noopener"`.
  That `rel` is a real security measure, explained in the comment above the block.

---

## 3. His work, his writing, his drawings

This is the content that makes the site *his* rather than a template. None of it can
stay.

### The four apps (`works.html` and `works/*.html`)

`works.html` lines 28–43 hold four `.app-card` blocks: **notiee**, **artista**,
**dreamland**, **tomanotes**. Each links to a detail page of the same name in `works/`.

Each card also carries `data-theme="notiee"` (etc.), which is the hook for the
whole-page colour system. If you rename a project you must rename it in **four** places
or the colour will silently stop working:

1. `data-theme="..."` on the card in `works.html`
2. `data-theme="..."` on the `<body>` of the detail page in `works/`
3. the `body[data-theme="..."]` rule in `css/style.css`
4. the folder name under `assets/works/`

Simplest path: keep the four slots, rename them one at a time, and pick your own
colours in the CSS.

**`works/tomanotes.html` needs extra attention** — lines 52–53 are real, live links to
his GitHub releases and repository:

```html
<a class="detail-download" href="https://github.com/idbetterrun/TomaNotes/releases" ...>↓ Download</a>
<a href="https://github.com/idbetterrun/TomaNotes" ...>GitHub</a>
```

Leaving these up on your own site would be presenting his shipped app as your own.
Replace or delete.

The other three detail pages have "coming soon" placeholder buttons rather than real
links, so they are safer, but the descriptive copy on all four is his and needs
rewriting. That copy lives in the HTML as English, with Chinese counterparts under the
`d.notiee.*`, `d.artista.*`, `d.dreamland.*` and `d.tomanotes.*` keys in `js/i18n.js`.

### The screenshots and icons (`assets/works/`)

```
assets/works/notiee/    01.webp 02.webp 03.webp icon.webp
assets/works/artista/   icon.webp
assets/works/dreamland/ icon.webp
assets/works/tomanotes/ 01.webp 02.webp 03.webp icon.webp
```

Screenshots of his apps. Replace them with your own or delete them.

Deleting is safe and requires no code changes: every `<img>` in a `.shot` carries
`onerror="this.closest('.shot').remove()"`, so a missing image removes its own figure
from the page instead of showing a broken-image icon. And `hideEmptyShots()` in
`js/main.js` then hides the container if nothing is left. This is a genuinely nice bit
of engineering by your friend — take advantage of it.

### The three blog posts (`talks/`)

```
talks/posts.json                                  ← the index
talks/2026-07-03-whats-up-lately.{en,zh}.md
talks/2026-06-29-notiee-1-0-5-changelog.{en,zh}.md
talks/2026-06-28-what-is-talks.{en,zh}.md
```

His personal writing, including a post about receiving a job offer. Delete all six
markdown files and empty `posts.json` down to `[]`. The list page handles an empty
array without complaining.

To publish your own: two markdown files plus one entry in `posts.json`. There's a
worked example in `WALKTHROUGH.md`.

**One catch:** if you have already deployed and someone has liked a post, the like
counts live in Upstash Redis under `likes:<slug>` and are not in this repo at all.
Deleting the posts orphans those keys; harmless, but they'll sit there.

### The about page (`about.html`)

Lines 28–37 are ten lines of his own writing about himself, and lines 43–68 are his
real education and internship history — a university, a polytechnic, and a named
employer in Changsha.

Line 36 is worth a special look:

```html
<p><s data-i18n="about.l9">honestly should've grabbed idbetter.run back when i had the chance</s> <span data-i18n="about.l9b">(update: finally got it! :)</span></p>
```

That's a joke about a domain he owns. It won't make sense on your site.

Also: the pen easter egg. Clicking the notebook doodle opens a modal asking *"you're
not gonna judge me for my degree, right?"*, and answering "nope, never" reveals a
second, hidden education entry. It's a lovely piece of personality, but it is *his*
personality and it's about *his* degree. Either write your own version or remove the
`data-degree-trigger` attribute on line 75 and the modal block at lines 84–93.

Every line here has a Chinese counterpart in `js/i18n.js` under `about.*` and
`resume.*`. Change both or the language toggle will show his life story in Chinese.

### The doodles (`assets/doodles/`)

Sixteen PNGs — the sleeping person, the floating z's, the coffee steam, the walking
cat, the clinking cups. **These are his own drawings**, and `contact.html` line 46
credits rednote@绒.Velour✨ as the inspiration for them.

He told you to take everything, so you're fine. But they are the single most
recognisable thing about the site — anyone who has seen his will recognise yours. If
you want your site to read as your own, this is the thing to replace, not the colours.

If you replace them, keep the credit unless you also drop the visual style.

---

## 4. Delete this unless you are hosting in mainland China

**`js/main.js`, lines 446–465** — the `beianRow` block:

```js
beian.textContent = "湘ICP备2026027627号-1";
gabeian.textContent = "京公网安备 11010802049439 号";
```

These are Chinese government ICP and Public Security filing numbers. They are
**licences issued to him personally**, tied to his identity and his domain. Displaying
someone else's filing number on your own site is misrepresenting your site's legal
registration to the Chinese authorities.

Delete lines 446–465 entirely — from `var beianRow = ...` through
`f.appendChild(beianRow);`. Keep the `page.appendChild(f);` line after it. The footer
will then contain just the copyright line, which is exactly what you want outside
China.

This is the one item on this page that is a genuine "must", not a "should".

---

## 5. Third-party services wired to his accounts

### Vercel Analytics — 10 files

```html
<script defer src="/_vercel/insights/script.js"></script>
```

| File | Line |
|---|---|
| `index.html` | 22 |
| `about.html` | 19 |
| `works.html` | 19 |
| `talks.html` | 20 |
| `contact.html` | 19 |
| `works/notiee.html` | 19 |
| `works/artista.html` | 19 |
| `works/dreamland.html` | 19 |
| `works/tomanotes.html` | 19 |
| `talks/detail.html` | 21 |

This one is actually harmless to leave in place: it's a relative path, so it resolves
against whatever Vercel project *you* deploy to and reports to *your* dashboard, not
his. But if you host anywhere other than Vercel it's a 404 on every page load, so
delete it in that case.

### Tally form — `index.html`

- **Line 34** — `data-tally-open="rjq96p"` on the floating chat bubble. `rjq96p` is
  **his** form ID; submissions would land in his Tally account.
- **Line 52** — the Tally script, currently commented out, which is why the bubble
  does nothing today.

Either create your own Tally form and swap the ID, or delete the whole `<button
class="note-bubble">` block (lines 33–40) plus the commented script. If you delete the
button, also remove `setupNoteBubble()` from the entry point at the bottom of
`js/main.js`.

### Upstash Redis — `api/likes.js`

No secrets are committed (good — they're read from `process.env`), but the likes
counter won't work until *you* create your own Upstash store and connect it. See the
deployment section of `WALKTHROUGH.md`. Until then the heart shows 0, which is a soft
failure, not a crash.

---

## 6. Repo metadata, fonts, and the leftovers

### `package.json`

Lines 14, 21 and 23 point at his GitHub repo:

```json
"url": "git+https://github.com/idbetterrun/tanqinghuadot.git"
"bugs": { "url": "https://github.com/idbetterrun/tanqinghuadot/issues" }
"homepage": "https://github.com/idbetterrun/tanqinghuadot#readme"
```

Also `"name": "mypersonalwebsite"` on line 2. None of this affects the site, but if
you push to your own GitHub these will be wrong and confusing. Note the one line you
must **not** delete: `"@upstash/redis"` under `dependencies`, which the likes function
needs, and `"type": "commonjs"`, which is why `api/likes.js` uses `require()`.

### `README.md`

Bilingual, written by him, links to his live site at `https://tanqinghua.asia`. Rewrite
or delete.

### `docs/tanqinghua-website-spec.md`

His original design spec — the document he wrote to brief Claude. Worth reading once
before you delete it; it explains a lot of the "why" behind the design decisions.

### The two fonts — read this before you keep them

`css/style.css` lines 8–17:

```css
@font-face { font-family: "tanqinghua"; src: url("/assets/fonts/tanqinghuafont.woff2") ... }
@font-face { font-family: "chillzhuo";  src: url("/assets/fonts/ChillZhuo.woff2") ... }
```

- **`tanqinghuafont.woff2`** is, as far as I can tell from the name and the design
  brief, **his own handwriting turned into a typeface**. It is the site's signature —
  the site name, the nav, and every app title are set in it. He said take everything,
  so this is his to give. But it is quite literally his handwriting on your site.
  Consider whether you want that, and if you do, consider asking him again
  specifically about the font, since it's the sort of thing people don't think of when
  they say "take everything".

- **`ChillZhuo.woff2`** is **寒蝉手拙体**, a third-party typeface by
  [github@Warren2060](https://github.com/Warren2060). It is the Chinese fallback in
  `--font-hand`. It is *not* his to license to you — check its terms directly with the
  author's repo before deploying. If you keep it, **you must keep the credit** in
  `contact.html` line 50.

If you drop both, change `--font-hand` on line 22 of `css/style.css` to a system font
stack and the site still works — it just loses most of its character. A middle path is
to pick a free handwriting face from Google Fonts and point `--font-hand` at it.

If you go English-only you can drop `ChillZhuo` and keep only the Latin font. The
recipe for going English-only is in `WALKTHROUGH.md`.

### Favicons — `assets/favicon/`

Seven files, all generated from his mark. Regenerate the set from your own image
(realfavicongenerator.net produces exactly this file list) and drop them in. The
`<link>` tags in the `<head>` of all ten pages won't need to change if you keep the
filenames.

---

## The order I'd actually do this in

1. **Delete the beian block** (`js/main.js` 446–465). Two minutes, and it's the only
   item with legal weight.
2. **Rip out the content**: the three blog posts, the about-page copy, the resume, the
   four apps and their screenshots. This leaves you with a working, empty shell.
3. **Rename**: the fifteen "tanqinghua." occurrences in section 1, then the contact
   details in section 2.
4. **Get it running and deployed** with your own name and empty pages. Confirm the
   nav, the language toggle and the theme colours all still work before you write a
   single word of your own content. Fixing a broken shell is much easier than fixing a
   broken shell *and* wondering whether your new content caused it.
5. **Then** fill it in, and decide about the fonts and doodles last.

One last thing: you're on the `annotated` branch, and `main` holds the pristine
original. If you break something badly, `git diff main` will show you exactly what you
changed. Make a new branch before you start editing content — `git switch -c mine` —
so `annotated` stays as a clean reference copy with all the explanations intact.
