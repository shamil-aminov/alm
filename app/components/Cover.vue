<script setup lang="ts">
defineProps<{ src?: string, alt: string, ratio: string }>()

const img = useTemplateRef<HTMLImageElement>('img')
const waiting = ref(false)

// Ожидание включается только после оживления и только если картинка ещё не пришла:
// на сервере снимок отдаётся видимым, поэтому без JS ничего не пропадает, а
// пришедшая из кэша не моргает.
onMounted(() => { waiting.value = !!img.value && !img.value.complete })
</script>

<template>
  <div class="cover overflow-hidden rounded" :style="{ aspectRatio: ratio }">
    <img v-if="src" ref="img" :src="src" :alt="alt" loading="lazy"
         class="size-full object-cover" :class="{ waiting }" @load="waiting = false">
  </div>
</template>
