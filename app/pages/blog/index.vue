<script setup lang="ts">
import { posts, sectionName } from '~/utils/content'

const { lang, label } = usePageLang()
const localePath = useLocalePath()

const articles = computed(() => posts(lang))

usePageSeo(() => ({ title: sectionName('/blog', lang) }))
</script>

<template>
  <main class="edge headroom pb-32">
    <div class="column">
      <h1 class="sr-only">{{ sectionName('/blog', lang) }}</h1>

      <ul class="stagger space-y-10">
        <li v-for="post in articles" :key="post.slug">
          <NuxtLink :to="localePath(`/blog/${post.slug}`)" class="group block">
            <h2 class="big underline-offset-4 group-hover:underline">{{ post.title }}</h2>
            <p v-if="post.excerpt" class="small fade-out mt-4">{{ post.excerpt }}</p>
          </NuxtLink>
        </li>
      </ul>

      <p v-if="!articles.length" class="small staggered mt-10">{{ label('empty') }}</p>
    </div>
  </main>
</template>
