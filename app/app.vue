<script setup lang="ts">
import { alignOptically } from '~/utils/optical'
import { pageTransition } from '~~/shared/motion'

const still = useStillness()

const transition = computed(() => ({
  ...pageTransition,
  duration: still.value ? 0 : pageTransition.duration,
  onEnter: () => { restoreScroll(); alignOptically() },
}))

const pageKey = (route: { path: string }) => route.path
</script>

<template>
  <NuxtLayout>
    <NuxtPage :page-key="pageKey" :transition="transition" />
  </NuxtLayout>
</template>
