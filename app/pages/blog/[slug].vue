<script setup lang="ts">
import { languages, post } from '~/utils/content'

const { lang } = usePageLang()
const route = useRoute()

const slug = String(route.params.slug)
const article = computed(() => post(slug, lang))

if (!article.value && import.meta.server) throw createError({ statusCode: 404, fatal: true })

const translations = languages.filter((language) => post(slug, language.code))
const setI18nParams = useSetI18nParams()
if (translations.length) {
  setI18nParams(Object.fromEntries(translations.map((language) => [language.code, { slug }])))
}

usePageSeo(() => ({ title: article.value?.title, summary: article.value?.excerpt }))
</script>

<template>
  <main class="edge headroom pb-32">
    <NotFound v-if="!article" />

    <article v-else class="column stagger">
      <h1 v-if="article.title && !article.opensWithTitle" class="big">{{ article.title }}</h1>
      <div class="post small mt-8" v-html="article.html" />

      <p v-if="article.date" class="small mt-16">
        {{ new Date(article.date).toLocaleDateString(lang) }}
      </p>
    </article>
  </main>
</template>
