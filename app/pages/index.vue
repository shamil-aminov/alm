<script setup lang="ts">
import { homePage } from '~/utils/content'

const { lang, label } = usePageLang()

const page = computed(() => homePage(lang))

usePageSeo(() => ({ summary: page.value?.excerpt }))
</script>

<template>
  <main class="edge headroom pb-32">
    <article v-if="page" class="post column small stagger" v-html="page.html" />
    <p v-else class="small staggered">{{ label('empty') }}</p>
  </main>
</template>
