<script setup lang="ts">
defineProps<{ src?: string, alt: string, ratio: string }>()

const img = useTemplateRef<HTMLImageElement>('img')
const waiting = ref(false)

onMounted(() => { waiting.value = !!img.value && !img.value.complete })
</script>

<template>
  <div class="cover overflow-hidden rounded" :style="{ aspectRatio: ratio }">
    <img v-if="src" ref="img" :src="src" :alt="alt" loading="lazy"
         class="size-full object-cover" :class="{ waiting }" @load="waiting = false">
  </div>
</template>
