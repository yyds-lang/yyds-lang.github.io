<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text: string
    gap?: number
    speed?: number
    edgeFade?: number
  }>(),
  {
    gap: 50,
    speed: 48,
    edgeFade: 16
  }
)

const containerRef = ref<HTMLElement | null>(null)
const measureRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const textWidth = ref(0)

const isOverflow = computed(() => textWidth.value > containerWidth.value + 1)
const loopDistance = computed(() => Math.max(0, textWidth.value + props.gap))
const animationDuration = computed(() => Math.max(6, loopDistance.value / props.speed))

const marqueeStyle = computed(() => ({
  '--marquee-gap': `${props.gap}px`,
  '--marquee-distance': `${loopDistance.value}px`,
  '--marquee-duration': `${animationDuration.value}s`,
  '--marquee-edge-fade': `${props.edgeFade}px`
}))

function measure(): void {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
  }
  if (measureRef.value) {
    textWidth.value = measureRef.value.offsetWidth
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  measure()
  resizeObserver = new ResizeObserver(() => {
    measure()
  })
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  if (measureRef.value) {
    resizeObserver.observe(measureRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(
  () => props.text,
  async () => {
    await nextTick()
    measure()
  }
)
</script>

<template>
  <div ref="containerRef" class="overflow-marquee">
    <div v-if="isOverflow" class="overflow-marquee-viewport" :style="marqueeStyle">
      <div class="overflow-marquee-track">
        <span class="overflow-marquee-text">{{ text }}</span>
        <span class="overflow-marquee-text" aria-hidden="true">{{ text }}</span>
      </div>
    </div>

    <span v-else class="overflow-marquee-static">{{ text }}</span>

    <span ref="measureRef" class="overflow-marquee-measure" aria-hidden="true">{{ text }}</span>
  </div>
</template>

<style scoped>
.overflow-marquee {
  position: relative;
  min-width: 0;
}

.overflow-marquee-static {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overflow-marquee-viewport {
  overflow: hidden;
  white-space: nowrap;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    black var(--marquee-edge-fade),
    black calc(100% - var(--marquee-edge-fade)),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    black var(--marquee-edge-fade),
    black calc(100% - var(--marquee-edge-fade)),
    transparent 100%
  );
}

.overflow-marquee-track {
  display: inline-flex;
  width: max-content;
  gap: var(--marquee-gap);
  animation: overflow-marquee-scroll var(--marquee-duration) linear infinite;
  will-change: transform;
}

.overflow-marquee-text {
  flex: 0 0 auto;
  white-space: nowrap;
}

.overflow-marquee-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  white-space: nowrap;
}

@keyframes overflow-marquee-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-1 * var(--marquee-distance)));
  }
}
</style>
