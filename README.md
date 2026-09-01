# alm

A static personal site: poster, blog, projects, favorites.
Content is files in the repository; a build is a folder of static files.

No database, no server, no login: the site has nowhere to write anything.
Publishing is `git push`.

```bash
npm install
npm run dev                             # localhost:3000
npm run generate                        # .output/public — what goes to the host
npm run check                           # types and browser tests
```

## Content

Everything is edited as files under `content/`:

```
site.ts            all the setup: name, address, languages, sections, kinds of favorites
home.en.md         the poster; one file per language
blog/*.en.md       posts; the file name is the address, one for every language
favorite.ts        cards: kind, title, author, cover
projects.ts        projects: title, cover, github, address of the post behind it
```

The whole setup lives in `content/site.ts`, and it is code rather than data: a typo
in a section or a language becomes a build error instead of an empty header on a live
site. It holds the site name and address, the languages (the first one has no prefix
in the URL), the sections in the order they appear in the header, and the kinds of
cards in favorites together with the aspect ratio of their covers.

**The address is required.** It signs `canonical`, `hreflang` and the links in the
feed, and in the demo it is a placeholder, `https://example.com`. Set your own before
you deploy.

Type sizes, margins, colors and durations do not move into that file. They are
decisions, not knobs.

A post's address is its file name, and it is one address for every language:
`example.en.md` and `example.ru.md` are one thing said twice. Add as many languages as
you like — one language works too, and the switch in the header disappears on its own.
The switch steps to the next language in the list and comes back round from the last,
skipping any language a post has not been translated into: no translation means no
link.

The build refuses content that would break quietly: a cover naming a file that is not
in `public/`, a post in a language `site.ts` does not list, a date not written
`YYYY-MM-DD`, a card of a kind with no tab. You hear about it at `npm run generate`,
not from a visitor.

A draft is an uncommitted file. There are no visibility flags: what is not in the
build is not on the site.

Images are plain addresses. The demo content points at `/demo.webp` inside the
repository, so a fresh clone shows a working site without a single service. Real
images go into any public bucket and the file holds the direct address.

## The look

`public/icon.svg`, `public/apple-touch-icon.png` (180×180), `public/favicon.ico` and
`public/og.png` (1200×630) ship as placeholders — a white circle on black. Replace the
files, keep the names. The browser bar colour is `theme-color` in `nuxt.config.ts`.

Type sizes, spacing and the two colors live in `app/assets/main.css`; the typeface is
`--font-sans` there, and `@nuxt/fonts` fetches whatever you name.

## Hosting

Any static host. `npm run generate` writes the finished files into `.output/public`
— from there Netlify, Pages, whatever you like. Vercel needs no settings: the
`vercel.json` here points it at `generate`, and Nitro hands it 23 static pages and no
functions at all.

## Where things are

```
content/     the content of the site
app/         pages, styling, transitions
shared/      the rules for reading content
server/      feed, sitemap, robots (all built at build time)
e2e/         browser checks for behaviour
```

`AGENTS.md` describes how the project is put together and how to make it yours.

## License

MIT.
