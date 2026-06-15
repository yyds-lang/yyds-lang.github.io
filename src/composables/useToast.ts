import { ref } from 'vue'

export type ToastTone = 'error'

export interface ToastItem {
  id: number
  tone: ToastTone
  message: string
  /** 自动消失时长（毫秒），<= 0 表示不自动消失 */
  duration: number
}

export interface ShowToastOptions {
  duration?: number
}

const DEFAULT_DURATION = 4000

const items = ref<ToastItem[]>([])
const timers = new Map<number, number>()
let seed = 0

function dismiss(id: number): void {
  const timer = timers.get(id)
  if (timer !== undefined) {
    window.clearTimeout(timer)
    timers.delete(id)
  }
  items.value = items.value.filter(item => item.id !== id)
}

function dismissAll(): void {
  timers.forEach(timer => window.clearTimeout(timer))
  timers.clear()
  items.value = []
}

function push(tone: ToastTone, message: string, options: ShowToastOptions = {}): number {
  const id = ++seed
  const duration = options.duration ?? DEFAULT_DURATION
  items.value = [...items.value, { id, tone, message, duration }]
  if (duration > 0 && typeof window !== 'undefined') {
    const timer = window.setTimeout(dismiss, duration, id)
    timers.set(id, timer)
  }
  return id
}

export function useToast() {
  return {
    items,
    error(message: string, options?: ShowToastOptions): number {
      return push('error', message, options)
    },
    dismiss,
    dismissAll
  }
}
