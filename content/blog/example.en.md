---
title: A sample post
date: 2026-08-29
---

A sample entry: everything a post can do is here — headings, a list, a quote,
code, a link and a picture. It shares one address with the Russian version, so
the language switch in the top right works.

## What markdown does

The text is plain markdown. **Bold** marks what matters, *italic* carries tone,
and a [link](https://example.com) is underlined and leads outside.

- The first item
- The second one
- And a third, so the rhythm shows

> A quote gets an indent and italics, no vertical rule: size and air hold the
> hierarchy, not lines.

## The picture

It takes the width of the column. A picture is just an address: the demo points
at a file in the repository, real shots live in any open storage.

![A demo shot](/demo.webp)

## Code

Lowercase is left only in the header and the tabs under it, where the words are
navigation. Everything else is set as written — the prose and the code alike.

```ts
export const say = (value: Localized, lang: string) =>
  typeof value === 'object' ? value[lang] ?? value.ru : value
```

Inline code looks like this: `npm run generate`.
