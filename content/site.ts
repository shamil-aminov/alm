import type { Site } from '../shared/content'

export default {
  name: 'ALM',
  tagline: {
    ru: 'Личный сайт: плакат, блог, проекты',
    en: 'A personal site: poster, blog, projects',
  },

  // Signs canonical, hreflang and the links in the feed. The build fails without it.
  url: 'https://example.com',
  ogImage: '/og.png',

  // The first language lives without a prefix in the URL.
  languages: [
    { code: 'ru', tag: 'ru-RU', label: 'РУ' },
    { code: 'en', tag: 'en-US', label: 'EN' },
  ],

  // This order is the header, and it also decides which way a section transition travels.
  sections: [
    { to: '/',         label: { ru: 'Главная', en: 'Home' } },
    { to: '/blog',     label: { ru: 'Блог',    en: 'Blog' } },
    { to: '/projects', label: { ru: 'Проекты', en: 'Projects' } },
    { to: '/favorite', label: { ru: 'Любимое', en: 'Favorite' } },
  ],

  favorite: [
    { kind: 'film',  label: { ru: 'Фильмы', en: 'Films' }, ratio: '2/3' },
    { kind: 'music', label: { ru: 'Музыка', en: 'Music' }, ratio: '1/1' },
    { kind: 'game',  label: { ru: 'Игры',   en: 'Games' }, ratio: '2/3' },
    { kind: 'book',  label: { ru: 'Книги',  en: 'Books' }, ratio: '2/3' },
  ],
} satisfies Site
