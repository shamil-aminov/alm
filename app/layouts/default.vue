<script setup lang="ts">
const direction = useDirection()
const inPlace = useInPlace()
const swipe = useSwipe()

const settled = ref(false)
onMounted(() => requestAnimationFrame(() => requestAnimationFrame(() => { settled.value = true })))

onBeforeUnmount(watchMotion())
</script>

<template>
  <div class="arrive h-dvh relative overflow-hidden bg-black font-sans text-white"
       :class="{ 'in-place': inPlace, settled }" :style="{ '--dir': direction }"
       @touchstart.passive="swipe.down" @touchend.passive="swipe.up" @touchcancel.passive="swipe.off">
    <SiteHeader />

    <div data-scroll="page" class="page dissolve h-full overflow-y-auto overscroll-none">
      <slot />
    </div>
  </div>
</template>
