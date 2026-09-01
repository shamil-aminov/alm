export function usePageLang() {
  const { locale, t } = useI18n()

  const lang = locale.value
  const translated = new Map<string, string>()

  function label(key: string) {
    if (!translated.has(key)) translated.set(key, t(key))
    return translated.get(key)!
  }

  return { lang, label }
}
