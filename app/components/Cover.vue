<script setup lang="ts">
defineProps<{ src?: string, alt: string, ratio: string }>()
</script>

<template>
  <div class="overflow-hidden rounded" :style="{ aspectRatio: ratio }">
    <img v-if="src" :src="src" :alt="alt" loading="lazy" class="size-full object-cover">
  </div>
</template>
