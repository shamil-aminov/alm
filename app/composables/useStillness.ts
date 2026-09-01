export function useStillness() {
  const still = ref(false)

  onMounted(() => {
    const asked = matchMedia('(prefers-reduced-motion: reduce)')
    const answer = () => { still.value = asked.matches }

    answer()
    asked.addEventListener('change', answer)
    onBeforeUnmount(() => asked.removeEventListener('change', answer))
  })

  return still
}
