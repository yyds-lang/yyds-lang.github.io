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
    <div class="mb-3 flex flex-col items-start gap-1 xs:flex-row xs:items-center xs:justify-between xs:gap-2">
      <div class="min-w-0 w-full text-sm text-zinc-200 xs:flex-1">
        <span
          v-if="!displayTitle"
          class="i-eos-icons-loading inline-block h-4 w-4 animate-spin text-zinc-500"
          aria-hidden="true"
        />
        <OverflowMarquee v-else :text="displayTitle" />
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
          @pointerdown="beginScrub"
          @pointerup="endScrub"
          @pointercancel="endScrub"
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
import { useSharedAudio } from '../lib/sharedAudio'
import OverflowMarquee from './OverflowMarquee.vue'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: ''
  }
)

const {
  title: sharedTitle,
  isPlaying,
  currentTime,
  duration,
  progress,
  canPlay,
  togglePlay,
  beginScrub,
  endScrub,
  seekByProgress,
  download
} = useSharedAudio()

const displayTitle = computed(() => props.title || sharedTitle.value || '')

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

function onProgressInput(event: Event): void {
  const target = event.target as HTMLInputElement
  seekByProgress(Number(target.value))
}
</script>
