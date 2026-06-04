<script setup lang="ts">
import { createYydsEditor } from '../editor/monaco'
import { initWasm, renderWav } from '../lib/wasmClient'
import AudioPlayerCard from '../components/AudioPlayerCard.vue'

const instruments = ['piano', 'guitar', 'drums', 'dizi'] as const
type Instrument = (typeof instruments)[number]
const EXAMPLE_STORAGE_KEY = 'yyds.studio.selectedExample'
const INSTRUMENT_STORAGE_KEY = 'yyds.studio.selectedInstrument'
interface ExampleItem {
  file: string
  title: string
}

const editorEl = ref<HTMLElement | null>(null)
const examples = ref<ExampleItem[]>([])
const selectedExample = ref('')
const selectedInstrument = ref<(typeof instruments)[number]>('piano')
const songTitle = ref('YYDS Render')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('loading')
const statusText = ref('正在初始化 WASM...')
const errorText = ref('')
const audioUrl = ref('')
const renderMs = ref(0)
const durationSeconds = ref(0)
const wavSize = ref(0)
const isRendering = computed(() => status.value === 'loading')

let editorHandle: Awaited<ReturnType<typeof createYydsEditor>> | null = null

function isValidInstrument(value: string | null): value is Instrument {
  return value !== null && (instruments as readonly string[]).includes(value)
}

function readPersistedSelection(): { example: string; instrument: Instrument | null } {
  if (typeof window === 'undefined') {
    return { example: '', instrument: null }
  }
  try {
    const example = window.localStorage.getItem(EXAMPLE_STORAGE_KEY) ?? ''
    const instrumentRaw = window.localStorage.getItem(INSTRUMENT_STORAGE_KEY)
    return {
      example,
      instrument: isValidInstrument(instrumentRaw) ? instrumentRaw : null
    }
  } catch {
    return { example: '', instrument: null }
  }
}

function persistSelection(): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    if (selectedExample.value) {
      window.localStorage.setItem(EXAMPLE_STORAGE_KEY, selectedExample.value)
    }
    window.localStorage.setItem(INSTRUMENT_STORAGE_KEY, selectedInstrument.value)
  } catch {
    // Ignore localStorage failures (e.g. private mode restrictions).
  }
}

function toPublicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${path.replace(/^\//, '')}`
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function parseSongTitle(source: string): string {
  return source.match(/^\s*song\s+"([^"]+)"/m)?.[1] ?? 'YYDS Render'
}

function inferInstrumentFromSource(text: string): Instrument | null {
  const pattern = /\btrack\s*\[\s*([a-z]+)\s*\]/gi
  const counts = new Map<Instrument, number>([
    ['piano', 0],
    ['guitar', 0],
    ['drums', 0],
    ['dizi', 0]
  ])
  for (const match of text.matchAll(pattern)) {
    const candidate = match[1]?.toLowerCase()
    if (candidate && counts.has(candidate as Instrument)) {
      counts.set(candidate as Instrument, (counts.get(candidate as Instrument) ?? 0) + 1)
    }
  }
  let best: Instrument | null = null
  let bestCount = 0
  for (const instrument of instruments) {
    const count = counts.get(instrument) ?? 0
    if (count > bestCount) {
      best = instrument
      bestCount = count
    }
  }
  return bestCount > 0 ? best : null
}

function stripTrackInstrumentHints(input: string): string {
  return input.replace(/\btrack\s*\[[^\]\r\n]+\]\s*/g, 'track ')
}

function clearAudio(): void {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = ''
  }
}

async function bootstrap(): Promise<void> {
  status.value = 'loading'
  statusText.value = '正在初始化 WASM...'
  errorText.value = ''
  try {
    await initWasm()
    status.value = 'idle'
    statusText.value = '就绪'
  } catch (error) {
    status.value = 'error'
    statusText.value = '初始化失败'
    errorText.value = toErrorMessage(error)
  }
}

async function loadExamples(
  preferredExample = '',
  preferredInstrument: Instrument | null = null
): Promise<void> {
  try {
    const response = await fetch(toPublicUrl('/examples/manifest.json'))
    if (!response.ok) {
      throw new Error('示例曲目清单加载失败')
    }
    examples.value = (await response.json()) as ExampleItem[]
    const restoredExample = preferredExample && examples.value.some((item) => item.file === preferredExample)
      ? preferredExample
      : ''
    const defaultExample =
      restoredExample ||
      examples.value.find((item) => item.file === 'doubletiger.yyds')?.file ||
      examples.value[0]?.file ||
      ''
    if (defaultExample) {
      await loadExample(defaultExample, preferredInstrument)
    }
  } catch (error) {
    errorText.value = toErrorMessage(error)
  }
}

async function loadExample(file: string, preferredInstrument: Instrument | null = null): Promise<void> {
  if (!editorHandle || !file) {
    return
  }
  status.value = 'loading'
  statusText.value = '加载并格式化曲目...'
  errorText.value = ''
  clearAudio()
  try {
    const response = await fetch(toPublicUrl(`/examples/${file}`))
    if (!response.ok) {
      throw new Error(`${file} 加载失败`)
    }
    const nextSource = await response.text()
    editorHandle.setValue(nextSource)
    const formattedSource = await editorHandle.formatDocument()
    songTitle.value = parseSongTitle(formattedSource)
    const inferredInstrument = inferInstrumentFromSource(formattedSource)
    if (preferredInstrument) {
      selectedInstrument.value = preferredInstrument
    } else if (inferredInstrument) {
      selectedInstrument.value = inferredInstrument
    }
    selectedExample.value = file
    persistSelection()
    status.value = 'success'
    statusText.value = '曲目已加载并格式化'
  } catch (error) {
    status.value = 'error'
    statusText.value = '曲目加载失败'
    errorText.value = toErrorMessage(error)
  }
}

function onExampleChange(event: Event): void {
  const nextFile = (event.target as HTMLSelectElement).value
  void loadExample(nextFile)
}

async function runFormat(): Promise<void> {
  if (isRendering.value || !editorHandle) {
    return
  }
  status.value = 'loading'
  statusText.value = '格式化中...'
  errorText.value = ''
  try {
    await editorHandle.formatDocument()
    songTitle.value = parseSongTitle(editorHandle.getValue())
    status.value = 'success'
    statusText.value = '格式化完成'
  } catch (error) {
    status.value = 'error'
    statusText.value = '格式化失败'
    errorText.value = toErrorMessage(error)
  }
}

async function runRender(): Promise<void> {
  if (isRendering.value || !editorHandle) {
    return
  }
  status.value = 'loading'
  statusText.value = '正在生成并播放...'
  errorText.value = ''
  clearAudio()
  try {
    const startedAt = performance.now()
    const currentSource = editorHandle.getValue()
    songTitle.value = parseSongTitle(currentSource)
    const sourceToRender = stripTrackInstrumentHints(currentSource)
    const result = await renderWav(sourceToRender, selectedInstrument.value)
    renderMs.value = Math.round(performance.now() - startedAt)
    durationSeconds.value = result.durationSeconds
    wavSize.value = result.size
    const wavBlob = new Blob([result.bytes], { type: 'audio/wav' })
    audioUrl.value = URL.createObjectURL(wavBlob)
    status.value = 'success'
    statusText.value = '渲染成功，正在播放'
  } catch (error) {
    status.value = 'error'
    statusText.value = '渲染失败'
    errorText.value = toErrorMessage(error)
  }
}

onMounted(async () => {
  const persisted = readPersistedSelection()
  if (persisted.instrument) {
    selectedInstrument.value = persisted.instrument
  }
  if (editorEl.value) {
    editorHandle = await createYydsEditor(editorEl.value, () => {})
  }
  await bootstrap()
  await loadExamples(persisted.example, persisted.instrument)
})

watch(selectedInstrument, () => {
  persistSelection()
})

onBeforeUnmount(() => {
  editorHandle?.dispose()
  clearAudio()
})
</script>

<template>
  <section class="grid gap-4 lg:grid-cols-[1fr_320px]">
    <div class="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <label class="text-xs text-zinc-300">
          曲目
          <select
            :value="selectedExample"
            class="ml-2 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-emerald-400"
            @change="onExampleChange"
          >
            <option v-for="item in examples" :key="item.file" :value="item.file">
              {{ item.title }}
            </option>
          </select>
        </label>
        <button
          type="button"
          class="cursor-pointer appearance-none border-none rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isRendering"
          @click="runFormat"
        >
          格式化
        </button>
        <button
          type="button"
          class="cursor-pointer appearance-none border-none rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isRendering"
          @click="runRender"
        >
          生成并播放
        </button>
        <StatusBadge :status="status" :text="statusText" />
      </div>
      <div
        ref="editorEl"
        class="h-[65vh] min-h-[420px] overflow-hidden rounded-xl border border-zinc-800"
      />
    </div>

    <aside class="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <h2 class="text-lg font-semibold">渲染面板</h2>
      <label class="block text-sm text-zinc-300">
        乐器
        <select
          v-model="selectedInstrument"
          class="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
        >
          <option v-for="instrument in instruments" :key="instrument" :value="instrument">
            {{ instrument }}
          </option>
        </select>
      </label>
      <div
        class="space-y-1 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300"
      >
        <p>时长: {{ durationSeconds.toFixed(2) }}s</p>
        <p>大小: {{ Math.round(wavSize / 1024) }} KB</p>
        <p>耗时: {{ renderMs }} ms</p>
      </div>
      <AudioPlayerCard :src="audioUrl" :title="songTitle" :auto-play="true" />
      <p
        v-if="errorText"
        class="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
      >
        {{ errorText }}
      </p>
    </aside>
  </section>
</template>
