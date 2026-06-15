<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="current"
        class="fixed inset-0 z-[80] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="absolute inset-0 cursor-default appearance-none border-none bg-black/60 backdrop-blur-sm"
          aria-label="关闭对话框"
          @click="onCancel"
        />
        <div
          class="relative max-w-sm w-full border border-zinc-800 rounded-2xl bg-zinc-900 p-5 shadow-2xl"
        >
          <h3 class="text-base text-zinc-100 font-semibold">
            {{ current.title }}
          </h3>
          <p v-if="current.message" class="mt-2 text-sm text-zinc-400">
            {{ current.message }}
          </p>
          <input
            v-if="current.type === 'prompt'"
            ref="inputRef"
            v-model="inputValue"
            type="text"
            :placeholder="current.placeholder"
            class="mt-4 w-full border border-zinc-700 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
            @keydown.enter.prevent="onConfirm"
          >
          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="cursor-pointer appearance-none rounded-lg border-none bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700"
              @click="onCancel"
            >
              {{ current.cancelText }}
            </button>
            <button
              type="button"
              class="cursor-pointer appearance-none rounded-lg border-none px-3 py-2 text-sm font-semibold transition"
              :class="confirmButtonClass"
              @click="onConfirm"
            >
              {{ current.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useDialog } from '../composables/useDialog'

const { current } = useDialog()

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref('')

watch(
  current,
  (next) => {
    if (!next) {
      return
    }
    inputValue.value = next.defaultValue
    if (next.type !== 'prompt') {
      return
    }
    nextTick(() => {
      const el = inputRef.value
      if (!el) {
        return
      }
      el.focus()
      el.select()
    })
  },
  { immediate: true }
)

const confirmButtonClass = computed(() => {
  if (current.value?.tone === 'danger') {
    return 'bg-rose-500 text-rose-50 hover:bg-rose-400'
  }
  return 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
})

function onConfirm(): void {
  const dialog = current.value
  if (!dialog) {
    return
  }
  if (dialog.type === 'prompt') {
    dialog.resolve(inputValue.value)
  }
  else {
    dialog.resolve(true)
  }
  current.value = null
}

function onCancel(): void {
  const dialog = current.value
  if (!dialog) {
    return
  }
  if (dialog.type === 'prompt') {
    dialog.resolve(null)
  }
  else {
    dialog.resolve(false)
  }
  current.value = null
}

function onKeydown(event: KeyboardEvent): void {
  if (!current.value) {
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    onCancel()
    return
  }
  if (event.key === 'Enter' && current.value.type === 'confirm') {
    event.preventDefault()
    onConfirm()
  }
}

watch(
  current,
  (next) => {
    if (typeof window === 'undefined') {
      return
    }
    if (next) {
      window.addEventListener('keydown', onKeydown)
    }
    else {
      window.removeEventListener('keydown', onKeydown)
    }
  }
)

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>
