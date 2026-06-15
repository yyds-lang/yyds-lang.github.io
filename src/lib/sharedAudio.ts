import { computed, ref } from 'vue'

const METADATA_TIMEOUT_MS = 10_000

let audioElement: HTMLAudioElement | null = null
let listenersBound = false
let ownedObjectUrl: string | null = null

const src = ref('')
const title = ref('')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isScrubbing = ref(false)

const progress = computed(() => {
  if (!duration.value) {
    return 0
  }
  return (currentTime.value / duration.value) * 100
})

const canPlay = computed(() => Boolean(src.value))

function bindListeners(audio: HTMLAudioElement): void {
  if (listenersBound) {
    return
  }
  listenersBound = true
  audio.addEventListener('play', () => {
    isPlaying.value = true
  })
  audio.addEventListener('pause', () => {
    isPlaying.value = false
  })
  audio.addEventListener('ended', () => {
    isPlaying.value = false
  })
  audio.addEventListener('timeupdate', () => {
    if (isScrubbing.value) {
      return
    }
    currentTime.value = audio.currentTime
  })
  audio.addEventListener('loadedmetadata', () => {
    duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
  })
}

function getAudio(): HTMLAudioElement | null {
  if (typeof document === 'undefined') {
    return null
  }
  if (!audioElement) {
    audioElement = new Audio()
    bindListeners(audioElement)
  }
  return audioElement
}

function revokeOwnedUrl(): void {
  if (ownedObjectUrl) {
    URL.revokeObjectURL(ownedObjectUrl)
    ownedObjectUrl = null
  }
}

function resolveSource(source: string | Blob): string {
  if (source instanceof Blob) {
    revokeOwnedUrl()
    ownedObjectUrl = URL.createObjectURL(source)
    return ownedObjectUrl
  }
  revokeOwnedUrl()
  return source
}

function waitForMetadata(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
    duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup()
      reject(new Error('Audio metadata load timeout'))
    }, METADATA_TIMEOUT_MS)

    function cleanup(): void {
      window.clearTimeout(timeoutId)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('error', onError)
    }

    function onLoadedMetadata(): void {
      duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
      cleanup()
      resolve()
    }

    function onError(): void {
      cleanup()
      reject(new Error('Failed to load audio metadata'))
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
    audio.addEventListener('error', onError, { once: true })
  })
}

async function load(
  source: string | Blob,
  options: { autoPlay?: boolean, title?: string } = {}
): Promise<{ played: boolean }> {
  const audio = getAudio()
  if (!audio) {
    return { played: false }
  }

  pause()
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
  isScrubbing.value = false

  if (typeof source === 'string' && !source) {
    revokeOwnedUrl()
    src.value = ''
    audio.removeAttribute('src')
    audio.load()
    return { played: false }
  }

  if (options.title) {
    title.value = options.title
  }

  const nextSrc = resolveSource(source)
  src.value = nextSrc
  audio.src = nextSrc
  audio.load()

  await waitForMetadata(audio)

  if (options.autoPlay) {
    const played = await play()
    return { played }
  }

  return { played: false }
}

function stop(): void {
  pause()
  isScrubbing.value = false
  const audio = getAudio()
  if (audio) {
    audio.removeAttribute('src')
    audio.load()
  }
  revokeOwnedUrl()
  src.value = ''
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
}

async function play(): Promise<boolean> {
  const audio = getAudio()
  if (!audio || !src.value) {
    return false
  }
  try {
    await audio.play()
    return true
  }
  catch {
    isPlaying.value = false
    return false
  }
}

function pause(): void {
  getAudio()?.pause()
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

function beginScrub(): void {
  isScrubbing.value = true
}

function endScrub(): void {
  isScrubbing.value = false
  const audio = getAudio()
  if (audio) {
    currentTime.value = audio.currentTime
  }
}

function seekByProgress(percent: number): void {
  const audio = getAudio()
  if (!audio || !duration.value) {
    return
  }
  audio.currentTime = duration.value * (percent / 100)
  currentTime.value = audio.currentTime
}

function download(): void {
  if (!src.value) {
    return
  }
  const anchor = document.createElement('a')
  anchor.href = src.value
  anchor.download = `${title.value || 'yyds'}.wav`
  anchor.click()
}

export function useSharedAudio() {
  return {
    src,
    title,
    isPlaying,
    currentTime,
    duration,
    progress,
    canPlay,
    load,
    stop,
    play,
    pause,
    togglePlay,
    beginScrub,
    endScrub,
    seekByProgress,
    download
  }
}
