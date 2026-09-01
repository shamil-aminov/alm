# AGENTS.md

Instructions for a person or an agent working on this repository.

## What this is

A static personal site built with Nuxt 4. Content is files in `content/`; a build is
a folder of HTML in `.output/public`. There is no database, no server and no login —
the site has nowhere to write anything, and that is the point rather than a stage it
will grow out of.

## Run it

```bash
npm install
npm run dev        # localhost:3000
npm run generate   # .output/public
npm run check      # types + browser tests, the one command that must stay green
```

Node 22.19+, 24.11+ or 26+ — the range Nuxt itself requires, and what
`engines` in `package.json` states.

## Make it yours

1. **`content/site.ts`** — name, tagline, address, languages, sections, kinds of
   favorites. This one file is the whole setup.
2. **Set a real `url`.** The demo ships `https://example.com`. It signs `canonical`,
   `hreflang`, the RSS feed and the sitemap, so deploying without changing it
   publishes a site that points at somebody else's domain.
3. **Replace `content/`** — posts, projects, favorites. The demo content is
   deliberately anonymous ("Project 3", "Film 7") so it reads as a placeholder rather
   than as somebody's material.
4. **Deploy** — any static host. Vercel detects Nuxt on its own; otherwise run
   `npm run generate` and serve `.output/public`.

## How it is built

**Content is read at build time, never in the browser.** A Vite plugin
(`build/content.ts`) turns every `content/**/*.md` into a finished page object:
frontmatter through `gray-matter`, markdown through `marked`, title and excerpt
settled there. The browser is handed the result, not the file and a parser for it.

**`shared/content.ts` must stay free of dependencies.** Pages import it, so anything
that lands in it ships to the reader. Reading files lives next door in
`shared/post.ts`, which only the build plugin and the server call.

**A post's address is its file name**, one address for every language:
`example.en.md` and `example.ru.md` are one thing said twice. No translation means no
link, in the header and in `hreflang` alike.

**Any number of languages.** The first in `site.ts` lives without a prefix; the rest get
one. The switch in the header shows a single code — the next language round the list —
and skips languages a post does not exist in, so nothing is stranded behind a missing
translation. One language is fine too: the switch hides itself.

**Raw HTML inside a post is dropped, not sanitized.** Sanitizing is a guess about
what is safe; dropping is a rule. Link schemes are checked in the same place.

**Prerendering is a correctness check.** `nuxi generate` crawls links with
`failOnError`, so a broken link inside content fails the build instead of reaching
the host.

**Layout is fluid, with no breakpoints.** Sizes and spacing are `clamp()` tokens in
`app/assets/main.css`; grids use `repeat(auto-fill, minmax(...))`. There is not a
single media query for width, and adding one is a step backwards.

```
content/     the content of the site
app/         pages, styling, transitions
shared/      rules for reading content
build/       the Vite plugin that turns markdown into pages
server/      feed, sitemap, robots — all built at build time
e2e/         browser checks for behaviour
```

## Conventions

**No comments in the code.** Explanations belong in documentation, not scattered
beside the lines they describe, where two copies of one explanation drift apart. If a
line needs explaining, the answer is usually to unfold the code — pull a step into a
named function, give a constant a name that explains itself. `content/` is the one
exception: it is the form the reader of this repository fills in, and a short hint
next to a field earns its place there.

**No personal data in the code.** Names, contacts, the text of the poster — all of it
lives in `content/`. Break this once and the template becomes somebody's personal
site, which then takes a week to carve back out.

**No `any`.** Content shapes are declared in `shared/content.ts`.

**One root node per page**, and a comment counts as a node. A second root breaks the
page transition: the old page leaves and the new one never arrives. Nuxt warns about
this (`NUXT_E4004`); read the warning as an error.

**Icons live outside the page.** `favicon.ico`, `icon.svg`, `apple-touch-icon.png` and
`og.png` sit in `public/` as placeholders to be replaced. Inside the page there are no
icons at all — only words and type size. A mark in the header would be the first thing
to break that.

**Two colors and four type sizes.** Black and white, `--big` / `--mid` / `--small` /
`--fine`. Hierarchy is carried by size, case and spacing — there are no rules, no
icons and no accent color. Adding a fifth size or a third color is a design decision,
not a detail.

## Checks

```bash
npm run check
```

`vue-tsc` for types, then Playwright against the generated site — the same files that
go to the host, not the dev server. Two engines, Chromium and WebKit, because the
layout bugs worth catching are the ones one engine has and the other does not. The suite covers navigation direction, scroll
restoration, the header wheel, the rubber band at the edges of a row, fluid layout,
`hreflang`, the feed and the sitemap.

When you fix something a test did not catch, add the test in the same change, then
break the fix on purpose and watch it fail. A check that has never failed has not
been shown to have teeth.
