<style scoped>
.player-track-base {
  background: rgba(161, 161, 170, 0.5);
  transition: background-color 120ms ease;
}

.player-track-fill {
  background: rgba(16, 185, 129, 0.5);
  transition: background-color 120ms ease;
}

.player-track:hover .player-track-base {
  background: rgba(161, 161, 170, 0.8);
}

.player-track:hover .player-track-fill {
  background: rgba(16, 185, 129, 0.8);
}

.player-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: rgba(161, 161, 170, 0.5);
  border: 0;
}

.player-range::-moz-range-thumb {
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: rgba(161, 161, 170, 0.5);
  border: 0;
}

.player-range:hover::-webkit-slider-thumb {
  background: rgba(161, 161, 170, 0.8);
}

.player-range:hover::-moz-range-thumb {
  background: rgba(161, 161, 170, 0.8);
}

@media (max-width: 480px) {
  .player-range::-webkit-slider-thumb {
    width: 12px;
    height: 12px;
  }

  .player-range::-moz-range-thumb {
    width: 12px;
    height: 12px;
  }
}
</style>

<template>
  <div class="border border-zinc-800 rounded-xl bg-zinc-950 p-3">
    <audio
      ref="audioRef"
      :src="src"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
    />

    <div class="mb-3 flex flex-col items-start gap-1 xs:flex-row xs:items-center xs:justify-between xs:gap-2">
      <div class="min-w-0 w-full text-sm text-zinc-200 xs:flex-1">
        <OverflowMarquee :text="title" />
      </div>
      <div class="shrink-0 whitespace-nowrap text-xs text-zinc-500/70 font-mono tabular-nums">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </div>
    </div>

    <div class="mb-3">
      <div class="player-track relative h-6">
        <div class="player-track-base absolute left-0 right-0 top-1/2 h-[2px] rounded -translate-y-1/2" />
        <div
          class="player-track-fill absolute left-0 top-1/2 h-[2px] rounded -translate-y-1/2"
          :style="{ width: `${progress}%` }"
        />
        <input
          class="player-range absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent"
          type="range"
          min="0"
          max="100"
          step="0.1"
          :value="progress"
          :disabled="!canPlay"
          @input="onProgressInput"
        >
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-emerald-500 text-emerald-950 transition disabled:cursor-not-allowed hover:bg-emerald-400 disabled:opacity-50"
        :disabled="!canPlay"
        @click="togglePlay"
      >
        <span v-if="!isPlaying" class="i-lucide-play h-4 w-4" aria-hidden="true" />
        <span v-else class="i-lucide-pause h-4 w-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        class="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 transition disabled:cursor-not-allowed hover:bg-zinc-700 disabled:opacity-50"
        :disabled="!canPlay"
        @click="download"
      >
        <span class="i-lucide-download h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import OverflowMarquee from './OverflowMarquee.vue'

const props = withDefaults(
  defineProps<{
    src: string
    title?: string
    autoPlay?: boolean
  }>(),
  {
    title: 'YYDS Render',
    autoPlay: true
  }
)

const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

const progress = computed(() => {
  if (!duration.value) {
    return 0
  }
  return (currentTime.value / duration.value) * 100
})

const canPlay = computed(() => Boolean(props.src))

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0:00'
  }
  const mins = Math.floor(value / 60)
  const secs = Math.floor(value % 60)
    .toString()
    .padStart(2, '0')
  return `${mins}:${secs}`
}

async function play(): Promise<void> {
  if (!audioRef.value || !props.src) {
    return
  }
  await audioRef.value.play()
}

function pause(): void {
  audioRef.value?.pause()
}

async function togglePlay(): Promise<void> {
  if (!canPlay.value) {
    return
  }
  if (isPlaying.value) {
    pause()
    return
  }
  await play()
}

function onTimeUpdate(): void {
  if (!audioRef.value) {
    return
  }
  currentTime.value = audioRef.value.currentTime
}

function onLoadedMetadata(): void {
  if (!audioRef.value) {
    return
  }
  duration.value = Number.isFinite(audioRef.value.duration) ? audioRef.value.duration : 0
}

function onEnded(): void {
  isPlaying.value = false
}

function onProgressInput(event: Event): void {
  if (!audioRef.value || !duration.value) {
    return
  }
  const target = event.target as HTMLInputElement
  const ratio = Number(target.value) / 100
  audioRef.value.currentTime = duration.value * ratio
  currentTime.value = audioRef.value.currentTime
}

function download(): void {
  if (!props.src) {
    return
  }
  const anchor = document.createElement('a')
  anchor.href = props.src
  anchor.download = `${props.title || 'yyds'}.wav`
  anchor.click()
}

watch(
  () => props.src,
  async (next) => {
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
    if (!next) {
      return
    }
    await nextTick()
    if (props.autoPlay) {
      await play()
    }
  }
)
</script>
