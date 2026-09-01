<script setup lang="ts">
defineProps<{ error: { statusCode: number } }>()

const { label } = usePageLang()
</script>

<template>
  <NuxtLayout>
    <main class="edge headroom pb-32">
      <div class="column">
        <h1 class="big">{{ error.statusCode }}</h1>
        <p class="small mt-8">{{ label('broken') }}</p>
      </div>
    </main>
  </NuxtLayout>
</template>
