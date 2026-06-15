<style scoped>
.popover {
  /* 弹出层宽度由最长选项撑起，但不小于触发按钮 */
  width: max-content;
  min-width: 100%;
  transform-origin: top left;
  will-change: transform, opacity;
}
</style>

<template>
  <div
    ref="rootRef"
    class="relative inline-flex"
    :class="block ? 'w-full' : ''"
  >
    <button
      type="button"
      class="h-9 inline-flex items-center justify-between gap-2 border border-zinc-700 rounded-lg bg-zinc-800 px-2 text-xs text-zinc-100 outline-none transition-colors duration-150 disabled:cursor-not-allowed focus:border-emerald-400 disabled:opacity-70"
      :class="[block ? 'w-full' : '', { 'border-emerald-400/60': open }]"
      :style="triggerStyle"
      :disabled="disabled || loading"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="min-w-0 flex-1 truncate text-left">{{ displayLabel }}</span>
      <span class="relative h-3.5 w-3.5 shrink-0">
        <span
          class="i-eos-icons-loading absolute inset-0 h-3.5 w-3.5 animate-spin text-zinc-400 transition-opacity duration-150"
          :class="loading ? 'opacity-100' : 'opacity-0'"
          aria-hidden="true"
        />
        <span
          class="i-lucide-chevron-down absolute inset-0 h-3.5 w-3.5 text-zinc-400 transition-all duration-150"
          :class="[
            loading ? 'opacity-0' : 'opacity-100',
            open ? 'rotate-180' : ''
          ]"
          aria-hidden="true"
        />
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      leave-active-class="transition duration-100 ease-in"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="open"
        class="popover absolute left-0 top-[calc(100%+4px)] z-30 border border-zinc-700 rounded-lg bg-zinc-900 shadow-xl ring-1 ring-black/20"
      >
        <ScrollArea class="max-h-64 py-1" role="listbox">
          <button
            v-for="item in options"
            :key="String(item.value)"
            type="button"
            class="block w-full cursor-pointer appearance-none whitespace-nowrap border-none bg-transparent px-3 py-1.5 text-left text-xs text-zinc-200 transition-colors duration-100 hover:bg-zinc-800"
            :class="item.value === modelValue ? 'bg-zinc-800 text-emerald-300' : ''"
            role="option"
            :aria-selected="item.value === modelValue"
            @click="select(item.value)"
          >
            {{ item.label }}
          </button>
          <div v-if="!options.length" class="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">
            暂无可选项
          </div>
        </ScrollArea>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number">
export interface SelectOption<V extends string | number = string> {
  value: V
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: T | ''
    options: SelectOption<T>[]
    placeholder?: string
    /** 加载中专用文案；不传则回退为 placeholder */
    loadingText?: string
    disabled?: boolean
    loading?: boolean
    block?: boolean
    /** 触发按钮的固定宽度（CSS 长度），默认 9rem */
    triggerWidth?: string
  }>(),
  {
    placeholder: '请选择',
    loadingText: '',
    disabled: false,
    loading: false,
    block: false,
    triggerWidth: '9rem'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)

const displayLabel = computed(() => {
  // 加载中优先展示 loadingText（未设则回退 placeholder）
  if (props.loading) {
    return props.loadingText || props.placeholder
  }
  const matched = props.options.find(item => item.value === props.modelValue)
  return matched?.label ?? props.placeholder
})

const triggerStyle = computed(() => (props.block ? {} : { width: props.triggerWidth }))

function toggle(): void {
  if (props.disabled || props.loading) {
    return
  }
  open.value = !open.value
}

function close(): void {
  open.value = false
}

function select(value: T): void {
  emit('update:modelValue', value)
  close()
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!open.value || !rootRef.value) {
    return
  }
  if (!rootRef.value.contains(event.target as Node)) {
    close()
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (open.value && event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

watch(
  [() => props.disabled, () => props.loading],
  ([disabled, loading]) => {
    if (disabled || loading) {
      close()
    }
  }
)

function bindGlobalListeners(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.addEventListener('pointerdown', onDocumentPointerDown)
  window.addEventListener('keydown', onKeydown)
}

function unbindGlobalListeners(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('keydown', onKeydown)
}

watch(open, (next) => {
  if (next) {
    bindGlobalListeners()
  }
  else {
    unbindGlobalListeners()
  }
})

onBeforeUnmount(() => {
  unbindGlobalListeners()
})
</script>
