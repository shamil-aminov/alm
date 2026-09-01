<script setup lang="ts">
import { nextLang } from '~~/shared/content'
import { languages, post, say, sections } from '~/utils/content'

const { locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()

type Code = Parameters<typeof switchLocalePath>[0]

function isCurrent(to: string) {
  const path = localePath(to)
  return to === '/' ? route.path === path : route.path.startsWith(path)
}

const otherLanguage = computed(() => {
  const slug = route.path.match(/\/blog\/([^/]+)$/)?.[1]
  const lost = !!slug && !post(slug, locale.value)

  return nextLang(languages, locale.value, (code) => !slug || lost || !!post(slug, code))
})
</script>

<template>
  <Transition name="lang" mode="out-in">
    <header :key="locale" class="small pointer-events-none absolute inset-x-0 top-0 z-10 flex select-none items-baseline justify-between edge gap-4">
      <ChoiceRow as="nav" wheel class="pointer-events-auto grow min-w-0">
        <NuxtLink v-for="section in sections" :key="section.to" :to="localePath(section.to)" :class="{ current: isCurrent(section.to) }">
          {{ say(section.label, locale) }}
        </NuxtLink>
      </ChoiceRow>

      <NuxtLink v-if="otherLanguage" :to="switchLocalePath(otherLanguage.code as Code)"
                :lang="otherLanguage.code" :aria-label="otherLanguage.label"
                class="language pointer-events-auto shrink-0">
        {{ otherLanguage.label }}
      </NuxtLink>
    </header>
  </Transition>
</template>
