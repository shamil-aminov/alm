<script setup lang="ts">
import { favorites, kinds, say, sectionName, tabs } from '~/utils/content'
import { pageTransition } from '~~/shared/motion'

const { lang, label } = usePageLang()

const route = useRoute()
const router = useRouter()

const cards = favorites

const firstTab = tabs[0]?.kind ?? ''

const openTab = computed(() => {
  const asked = String(route.query.kind ?? '')
  const known = tabs.some((tab) => tab.kind === asked)
  return known ? asked : firstTab
})

const shown = computed(() => cards.filter((card) => card.kind === openTab.value))
const coverRatio = (kind: string) => kinds.find((k) => k.kind === kind)?.ratio ?? '1/1'

function open(kind: string) {
  router.push({ query: kind === firstTab ? {} : { kind } })
}

usePageSeo(() => ({ title: sectionName('/favorite', lang) }))
</script>

<template>
  <main class="under-header relative">
    <h1 class="sr-only">{{ sectionName('/favorite', lang) }}</h1>

    <div class="staggered edge absolute inset-x-0 top-0 z-20">
      <ChoiceRow v-if="tabs.length" class="small">
        <button v-for="k in tabs" :key="k.kind" type="button" :class="{ current: openTab === k.kind }"
                :aria-current="openTab === k.kind ? 'true' : undefined" @click="open(k.kind)">
          {{ say(k.label, lang) }}
        </button>
      </ChoiceRow>
    </div>

    <Transition v-bind="pageTransition">
      <ul :key="openTab" data-scroll="favorite"
          class="dissolve edge cards h-full overflow-y-auto overscroll-none pb-24"
          :style="{ '--shape': coverRatio(openTab), '--card-min': 'clamp(9rem, 33vw, 14rem)', '--card-share': '24%' }">
        <li v-for="(card, at) in shown" :key="at" class="staggered">
          <Cover :src="card.cover" :alt="say(card.title, lang)" :ratio="coverRatio(card.kind)" />
          <p class="fine optical mt-2">{{ say(card.title, lang) }}</p>
          <p v-if="card.author" class="fine optical opacity-60">{{ say(card.author, lang) }}</p>
        </li>
      </ul>
    </Transition>

    <p v-if="!cards.length" class="small staggered edge">{{ label('empty') }}</p>
  </main>
</template>
