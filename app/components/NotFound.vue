<script setup lang="ts">
const { label } = usePageLang()
</script>

<template>
  <div class="column stagger">
    <h1 class="big">404</h1>
    <p class="small mt-8">{{ label('lost') }}</p>
  </div>
</template>
