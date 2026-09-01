<script setup lang="ts">
import { favorites, kinds, say, sectionName } from '~/utils/content'
import { pageTransition } from '~~/shared/motion'

const { lang, label } = usePageLang()

const route = useRoute()
const router = useRouter()
const direction = useDirection()

const cards = favorites

const tabs = computed(() => kinds.filter((kind) => cards.some((card) => card.kind === kind.kind)))
const firstTab = computed(() => tabs.value[0]?.kind ?? '')

const openTab = computed(() => {
  const asked = String(route.query.kind ?? '')
  const known = tabs.value.some((tab) => tab.kind === asked)
  return known ? asked : firstTab.value
})

const shown = computed(() => cards.filter((card) => card.kind === openTab.value))
const coverRatio = (kind: string) => kinds.find((k) => k.kind === kind)?.ratio ?? '1/1'

function open(kind: string) {
  const positionOf = (kind: string) => tabs.value.findIndex((tab) => tab.kind === kind)

  direction.value = Math.sign(positionOf(kind) - positionOf(openTab.value)) || 1
  router.push({ query: kind === firstTab.value ? {} : { kind } })
}

usePageSeo(() => ({ title: sectionName('/favorite', lang) }))
</script>

<template>
  <main class="under-header relative">
    <h1 class="sr-only">{{ sectionName('/favorite', lang) }}</h1>

    <div class="staggered edge absolute inset-x-0 top-0 z-20">
      <ChoiceRow v-if="tabs.length" class="small">
        <button v-for="k in tabs" :key="k.kind" type="button" :class="{ current: openTab === k.kind }"
                @click="open(k.kind)">
          {{ say(k.label, lang) }}
        </button>
      </ChoiceRow>
    </div>

    <Transition v-bind="pageTransition">
      <ul :key="openTab" data-scroll="favorite"
          class="dissolve edge cards h-full overflow-y-auto overscroll-none pb-24"
          :style="{ '--shape': coverRatio(openTab), '--card-share': '22%' }">
        <li v-for="card in shown" :key="say(card.title, 'ru')" class="staggered">
          <Cover :src="card.cover" :alt="say(card.title, lang)" :ratio="coverRatio(card.kind)" />
          <p class="small optical mt-2">{{ say(card.title, lang) }}</p>
          <p v-if="card.author || card.year" class="small optical opacity-60">
            {{ [say(card.author, lang), card.year].filter(Boolean).join(', ') }}
          </p>
        </li>
      </ul>
    </Transition>

    <p v-if="!cards.length" class="small staggered edge">{{ label('empty') }}</p>
  </main>
</template>
