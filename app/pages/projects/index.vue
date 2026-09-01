<script setup lang="ts">
import { post, projects, say, sectionName } from '~/utils/content'

const { lang, label } = usePageLang()
const localePath = useLocalePath()

const cards = computed(() => projects.map((project) => ({
  ...project,
  story: project.post && post(project.post, lang) ? localePath(`/blog/${project.post}`) : undefined,
})))

usePageSeo(() => ({ title: sectionName('/projects', lang) }))
</script>

<template>
  <main class="headroom pb-32">
    <h1 class="sr-only">{{ sectionName('/projects', lang) }}</h1>

    <ul class="edge cards" style="--card-min: 11rem; --shape: 16/9; --card-share: 45%">
      <li v-for="card in cards" :key="say(card.title, 'ru')" class="staggered">
        <NuxtLink v-if="card.story" :to="card.story" class="block">
          <Cover :src="card.cover" :alt="say(card.title, lang)" ratio="16/9" />
        </NuxtLink>
        <Cover v-else :src="card.cover" :alt="say(card.title, lang)" ratio="16/9" />

        <p class="fine optical mt-2">
          <NuxtLink v-if="card.story" :to="card.story"
                    class="underline-offset-4 hover:underline">{{ say(card.title, lang) }}</NuxtLink>
          <span v-else>{{ say(card.title, lang) }}</span>
        </p>
        <p v-if="card.github" class="fine optical opacity-60">
          <a :href="card.github" target="_blank" rel="noreferrer"
             class="underline-offset-4 hover:underline">github</a>
        </p>
      </li>
    </ul>

    <p v-if="!cards.length" class="small staggered edge">{{ label('empty') }}</p>
  </main>
</template>
