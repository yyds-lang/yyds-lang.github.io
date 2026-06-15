<template>
  <section
    class="h-full min-h-0 flex flex-col gap-4 pb-[76px] lg:grid lg:grid-cols-[1fr_320px] lg:h-auto lg:pb-0"
  >
    <div class="min-h-0 flex flex-1 flex-col border border-zinc-800 rounded-2xl bg-zinc-900/70 p-2 sm:p-3">
      <div class="mb-3 flex items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
            曲目
            <SelectField
              :model-value="selectedExample"
              :options="trackOptions"
              :loading="examplesLoading || exampleLoading"
              :placeholder="currentName || '自定义'"
              loading-text="加载中"
              trigger-width="12rem"
              @update:model-value="onTrackSelect"
            />
          </label>
          <label class="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
            乐器
            <SelectField
              v-model="selectedInstrument"
              :options="instrumentOptions"
            />
          </label>
          <button
            type="button"
            class="h-9 w-9 inline-flex cursor-pointer appearance-none items-center justify-center rounded-lg border-none bg-emerald-500 text-emerald-950 transition disabled:cursor-not-allowed hover:bg-emerald-400 disabled:opacity-60"
            :disabled="isRendering"
            aria-label="生成并播放"
            title="生成并播放"
            @click="runRender"
          >
            <span class="i-streamline-ai-generate-music-spark h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="h-9 w-9 inline-flex cursor-pointer appearance-none items-center justify-center rounded-lg border-none bg-zinc-800 text-zinc-200 transition hover:bg-zinc-700"
            aria-label="我的作品"
            title="我的作品"
            @click="openLibrary"
          >
            <span class="i-lucide-folder h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="h-9 w-9 inline-flex cursor-pointer appearance-none items-center justify-center rounded-lg border-none bg-zinc-800 text-zinc-200 transition disabled:cursor-not-allowed hover:bg-zinc-700 disabled:opacity-60"
            :disabled="isRendering"
            aria-label="分享"
            title="分享"
            @click="onShare"
          >
            <span class="i-lucide-share-2 h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref="editorEl"
        class="min-h-0 flex-1 overflow-hidden border border-zinc-800 rounded-xl lg:h-[65vh] lg:min-h-[420px] lg:flex-none"
      />
    </div>

    <aside class="hidden border border-zinc-800 rounded-2xl bg-zinc-900/70 p-3 lg:block space-y-4 sm:p-4">
      <h2 class="text-lg font-semibold">
        渲染面板
      </h2>
      <AudioPlayerCard :title="songTitle" />
    </aside>

    <BottomPeekDrawer v-model="playerDrawerOpen">
      <AudioPlayerCard :title="songTitle" />
    </BottomPeekDrawer>

    <SideDrawer v-model="libraryOpen" title="我的作品">
      <div class="flex flex-col gap-2 px-1">
        <p v-if="!compositions.length" class="px-2 py-3 text-sm text-zinc-400">
          暂无本地保存的作品
        </p>
        <button
          v-for="item in compositions"
          :key="item.id"
          type="button"
          class="group flex flex-col cursor-pointer appearance-none gap-1 rounded-lg border-none bg-zinc-800 px-3 py-2 text-left transition hover:bg-zinc-700"
          @click.stop="loadComposition(item.id)"
        >
          <div class="flex items-start justify-between gap-2">
            <span class="line-clamp-1 text-sm text-zinc-100 font-medium">{{ item.name }}</span>
            <span
              role="button"
              tabindex="0"
              class="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1 text-zinc-500 transition hover:bg-zinc-900 hover:text-rose-300"
              :aria-label="`删除 ${item.name}`"
              @click.stop="removeComposition(item.id)"
              @keydown.enter.stop.prevent="removeComposition(item.id)"
              @keydown.space.stop.prevent="removeComposition(item.id)"
            >
              <span class="i-lucide-trash-2 h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <span class="text-[11px] text-zinc-500">
            {{ formatDate(item.updatedAt) }}
          </span>
        </button>
      </div>
    </SideDrawer>
  </section>
</template>

<script setup lang="ts">
import type { Composition } from '../lib/compositionDb'
import AudioPlayerCard from '../components/AudioPlayerCard.vue'
import { useDialog } from '../composables/useDialog'
import { useLargeScreen } from '../composables/useLargeScreen'
import { useToast } from '../composables/useToast'
import { createYydsEditor } from '../editor/monaco'
import {
  deleteComposition,
  listCompositions,
  saveComposition
} from '../lib/compositionDb'
import { useSharedAudio } from '../lib/sharedAudio'
import {
  buildShareUrl,
  copyTextToClipboard,
  decodeShare,
  SHARE_PARAM
} from '../lib/shareLink'
import { toPublicUrl } from '../lib/toPublicUrl'
import { initWasm, renderWav } from '../lib/wasmClient'

const instruments = ['piano', 'guitar', 'drums', 'dizi'] as const
type Instrument = (typeof instruments)[number]
const EXAMPLE_STORAGE_KEY = 'yyds.studio.selectedExample'
const INSTRUMENT_STORAGE_KEY = 'yyds.studio.selectedInstrument'
const DEFAULT_SONG_TITLE = 'YYDS Render'
const COMPOSITION_PREFIX = 'composition:'

type TrackValue
  = | { kind: 'composition', id: string }
    | { kind: 'example', file: string }

function makeCompositionValue(id: string): string {
  return `${COMPOSITION_PREFIX}${id}`
}

function parseTrackValue(value: string): TrackValue | null {
  if (!value) {
    return null
  }
  if (value.startsWith(COMPOSITION_PREFIX)) {
    return { kind: 'composition', id: value.slice(COMPOSITION_PREFIX.length) }
  }
  return { kind: 'example', file: value }
}

interface ExampleItem {
  file: string
  title: string
}

const editorEl = ref<HTMLElement | null>(null)
const examples = ref<ExampleItem[]>([])
const examplesLoading = ref(true)
const exampleLoading = ref(false)
const selectedExample = ref('')
const selectedInstrument = ref<(typeof instruments)[number]>('piano')
const songTitle = ref('')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const playerDrawerOpen = ref(false)
const isRendering = computed(() => status.value === 'loading')

const compositions = ref<Composition[]>([])
const currentCompositionId = ref<string | null>(null)
const currentName = ref('')
const libraryOpen = ref(false)

let editorHandle: Awaited<ReturnType<typeof createYydsEditor>> | null = null
const sharedAudio = useSharedAudio()
const { isLargeScreen } = useLargeScreen()
const dialog = useDialog()
const toast = useToast()

const exampleOptions = computed(() =>
  examples.value.map(item => ({ value: item.file, label: item.title }))
)
const compositionOptions = computed(() =>
  compositions.value.map(item => ({
    value: makeCompositionValue(item.id),
    label: item.name
  }))
)
const trackOptions = computed(() => [
  ...compositionOptions.value,
  ...exampleOptions.value
])
const instrumentOptions = computed(() =>
  instruments.map(item => ({ value: item, label: item }))
)

watch(isLargeScreen, (large) => {
  if (large) {
    playerDrawerOpen.value = false
  }
})

function isValidInstrument(value: string | null): value is Instrument {
  return value !== null && (instruments as readonly string[]).includes(value)
}

function readPersistedSelection(): { example: string, instrument: Instrument | null } {
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
  }
  catch {
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
  }
  catch {
    // Ignore localStorage failures (e.g. private mode restrictions).
  }
}

function clearAudio(): void {
  sharedAudio.stop()
}

function parseSongTitle(source: string): string {
  return source.match(/^\s*song\s+"([^"]+)"/m)?.[1] ?? DEFAULT_SONG_TITLE
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

function formatDate(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleString()
  }
  catch {
    return ''
  }
}

async function bootstrap(): Promise<void> {
  status.value = 'loading'
  try {
    await initWasm()
    status.value = 'idle'
  }
  catch (error) {
    status.value = 'error'
    console.error('[studio] WASM 初始化失败', error)
    toast.error('YYDS 引擎初始化失败，请刷新重试')
  }
}

async function fetchExamplesManifest(): Promise<void> {
  examplesLoading.value = true
  try {
    const response = await fetch(toPublicUrl('/examples/manifest.json'))
    if (!response.ok) {
      throw new Error('示例曲目清单加载失败')
    }
    examples.value = (await response.json()) as ExampleItem[]
  }
  catch (error) {
    console.error('[studio] 示例加载失败', error)
    toast.error('示例曲目加载失败，请检查网络')
  }
  finally {
    examplesLoading.value = false
  }
}

async function loadExamples(
  preferredExample = '',
  preferredInstrument: Instrument | null = null
): Promise<void> {
  await fetchExamplesManifest()
  const restoredExample = preferredExample && examples.value.some(item => item.file === preferredExample)
    ? preferredExample
    : ''
  const defaultExample
    = restoredExample
      || examples.value.find(item => item.file === 'doubletiger.yyds')?.file
      || examples.value[0]?.file
      || ''
  if (defaultExample) {
    await loadExample(defaultExample, preferredInstrument)
  }
}

async function loadExample(file: string, preferredInstrument: Instrument | null = null): Promise<void> {
  if (!editorHandle || !file) {
    return
  }
  exampleLoading.value = true
  status.value = 'loading'
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
    currentName.value = songTitle.value
    currentCompositionId.value = null
    const inferredInstrument = inferInstrumentFromSource(formattedSource)
    if (preferredInstrument) {
      selectedInstrument.value = preferredInstrument
    }
    else if (inferredInstrument) {
      selectedInstrument.value = inferredInstrument
    }
    selectedExample.value = file
    persistSelection()
    status.value = 'success'
  }
  catch (error) {
    status.value = 'error'
    console.error('[studio] 曲目加载失败', error)
    toast.error('曲目加载失败')
  }
  finally {
    exampleLoading.value = false
  }
}

function applySource(name: string, source: string, options: { compositionId?: string | null } = {}): void {
  if (!editorHandle) {
    return
  }
  clearAudio()
  editorHandle.setValue(source)
  const inferred = inferInstrumentFromSource(source)
  if (inferred) {
    selectedInstrument.value = inferred
  }
  songTitle.value = parseSongTitle(source) || name || DEFAULT_SONG_TITLE
  currentName.value = name || songTitle.value
  currentCompositionId.value = options.compositionId ?? null
  selectedExample.value = ''
}

function onTrackSelect(value: string): void {
  const parsed = parseTrackValue(value)
  if (!parsed) {
    return
  }
  if (parsed.kind === 'composition') {
    void loadComposition(parsed.id)
    return
  }
  void loadExample(parsed.file)
}

async function refreshCompositions(): Promise<void> {
  try {
    compositions.value = await listCompositions()
  }
  catch (error) {
    console.error('[studio] 作品列表加载失败', error)
    toast.error('作品列表加载失败')
  }
}

function openLibrary(): void {
  void refreshCompositions()
  libraryOpen.value = true
}

async function loadComposition(id: string): Promise<void> {
  const target = compositions.value.find(item => item.id === id)
  if (!target || !editorHandle) {
    return
  }
  applySource(target.name, target.source, { compositionId: target.id })
  selectedExample.value = makeCompositionValue(target.id)
  libraryOpen.value = false
  status.value = 'success'
}

async function removeComposition(id: string): Promise<void> {
  const target = compositions.value.find(item => item.id === id)
  if (!target) {
    return
  }
  const confirmed = await dialog.confirm({
    title: '删除作品',
    message: `确定删除「${target.name}」？此操作不可恢复。`,
    confirmText: '删除',
    tone: 'danger'
  })
  if (!confirmed) {
    return
  }
  try {
    await deleteComposition(id)
    const wasCurrent = currentCompositionId.value === id
    if (wasCurrent) {
      currentCompositionId.value = null
      selectedExample.value = ''
    }
    await refreshCompositions()
    if (wasCurrent) {
      const fallback = trackOptions.value[0]?.value
      if (fallback) {
        onTrackSelect(fallback)
      }
    }
  }
  catch (error) {
    console.error('[studio] 作品删除失败', error)
    toast.error('作品删除失败')
  }
}

async function onSave(): Promise<void> {
  if (!editorHandle || isRendering.value) {
    return
  }
  status.value = 'loading'
  try {
    const formatted = await editorHandle.formatDocument()
    const parsedTitle = parseSongTitle(formatted)
    const fallbackName = currentName.value || parsedTitle || '未命名作品'
    let name = fallbackName
    if (!currentCompositionId.value) {
      const promptResult = await dialog.prompt({
        title: '保存作品',
        message: '为该作品命名，后续保存将自动覆盖。',
        defaultValue: fallbackName,
        placeholder: '输入作品名称',
        confirmText: '保存'
      })
      if (promptResult === null) {
        status.value = 'idle'
        return
      }
      name = promptResult.trim() || fallbackName
    }
    const saved = await saveComposition({
      id: currentCompositionId.value ?? undefined,
      name,
      source: formatted
    })
    currentCompositionId.value = saved.id
    currentName.value = saved.name
    songTitle.value = saved.name
    selectedExample.value = makeCompositionValue(saved.id)
    await refreshCompositions()
    status.value = 'success'
  }
  catch (error) {
    status.value = 'error'
    console.error('[studio] 保存失败', error)
    toast.error('作品保存失败')
  }
}

async function onShare(): Promise<void> {
  if (!editorHandle) {
    return
  }
  const source = editorHandle.getValue()
  const name = currentName.value || parseSongTitle(source) || DEFAULT_SONG_TITLE
  try {
    const url = buildShareUrl({ name, source })
    await copyTextToClipboard(url)
    status.value = 'success'
  }
  catch (error) {
    status.value = 'error'
    console.error('[studio] 分享链接生成失败', error)
    toast.error('分享链接生成失败')
  }
}

async function tryLoadFromShareLink(): Promise<boolean> {
  if (typeof window === 'undefined' || !editorHandle) {
    return false
  }
  const params = new URLSearchParams(window.location.search)
  const raw = params.get(SHARE_PARAM)
  if (!raw) {
    return false
  }
  const payload = decodeShare(raw)
  // Always strip the share param to avoid re-triggering on refresh.
  params.delete(SHARE_PARAM)
  const nextSearch = params.toString()
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', nextUrl)
  if (!payload) {
    return false
  }
  applySource(payload.name, payload.source)
  try {
    const formatted = await editorHandle.formatDocument()
    songTitle.value = parseSongTitle(formatted) || payload.name || DEFAULT_SONG_TITLE
  }
  catch {
    // formatting failure is non-fatal
  }
  status.value = 'success'
  return true
}

async function runRender(): Promise<void> {
  if (isRendering.value || !editorHandle) {
    return
  }
  status.value = 'loading'
  clearAudio()
  try {
    const currentSource = editorHandle.getValue()
    songTitle.value = parseSongTitle(currentSource)
    const sourceToRender = stripTrackInstrumentHints(currentSource)
    const result = await renderWav(sourceToRender, selectedInstrument.value)
    const wavBlob = new Blob([result.bytes], { type: 'audio/wav' })
    await sharedAudio.load(wavBlob, { autoPlay: true, title: songTitle.value })
    status.value = 'success'
    playerDrawerOpen.value = true
  }
  catch (error) {
    status.value = 'error'
    console.error('[studio] 渲染失败', error)
    toast.error('渲染失败，请检查代码后重试')
    clearAudio()
  }
}

function handleSaveShortcut(event: KeyboardEvent): void {
  const isSaveKey = (event.metaKey || event.ctrlKey) && (event.key === 's' || event.key === 'S')
  if (!isSaveKey) {
    return
  }
  event.preventDefault()
  void onSave()
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
  const loadedFromShare = await tryLoadFromShareLink()
  if (loadedFromShare) {
    void fetchExamplesManifest()
  }
  else {
    await loadExamples(persisted.example, persisted.instrument)
  }
  void refreshCompositions()
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleSaveShortcut)
  }
})

watch(selectedInstrument, () => {
  persistSelection()
})

onBeforeUnmount(() => {
  editorHandle?.dispose()
  clearAudio()
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleSaveShortcut)
  }
})
</script>
