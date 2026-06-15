<style scoped>
.toast-stack {
  /* 顶部居中容器，避开移动端刘海 */
  top: max(env(safe-area-inset-top, 0px), 12px);
}

/* 进入：从顶部下滑 + 透明 + 略微缩放 */
.toast-enter-active {
  transition:
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 180ms ease-out;
  will-change: transform, opacity;
}

/* 离开：上滑收起，时长更短 */
.toast-leave-active {
  transition:
    transform 160ms cubic-bezier(0.4, 0, 1, 1),
    opacity 140ms ease-in;
  will-change: transform, opacity;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.96);
}

.toast-enter-to,
.toast-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.98);
}

.toast-move {
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
</style>

<template>
  <Teleport to="body">
    <div
      class="toast-stack pointer-events-none fixed inset-x-0 z-[90] flex flex-col items-center gap-2 px-3"
      role="region"
      aria-label="通知"
    >
      <TransitionGroup name="toast" tag="div" class="flex flex-col items-center gap-2">
        <div
          v-for="item in items"
          :key="item.id"
          class="pointer-events-auto max-w-md w-full inline-flex items-center gap-3 border rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm"
          :class="toneClass(item.tone)"
          role="alert"
          aria-live="assertive"
        >
          <span
            class="h-4 w-4 shrink-0"
            :class="toneIconClass(item.tone)"
            aria-hidden="true"
          />
          <p class="min-w-0 flex-1 break-words text-sm leading-relaxed">
            {{ item.message }}
          </p>
          <button
            type="button"
            class="h-6 w-6 inline-flex shrink-0 cursor-pointer appearance-none items-center justify-center rounded-md border-none bg-transparent text-inherit opacity-70 transition -mr-1 hover:opacity-100"
            aria-label="关闭"
            @click="dismiss(item.id)"
          >
            <span class="i-lucide-x h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ToastTone } from '../composables/useToast'
import { useToast } from '../composables/useToast'

const { items, dismiss } = useToast()

function toneClass(tone: ToastTone): string {
  switch (tone) {
    case 'error':
      return 'border-rose-500/40 bg-rose-950/85 text-rose-100'
    default:
      return 'border-zinc-700 bg-zinc-900/85 text-zinc-100'
  }
}

function toneIconClass(tone: ToastTone): string {
  switch (tone) {
    case 'error':
      return 'i-lucide-circle-alert text-rose-300'
    default:
      return 'i-lucide-info text-zinc-300'
  }
}
</script>
