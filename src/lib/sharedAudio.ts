import { computed, ref } from 'vue'

let audioElement: HTMLAudioElement | null = null
let listenersBound = false

const src = ref('')
const title = ref('YYDS Render')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

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

export function useSharedAudio() {
  const progress = computed(() => {
    if (!duration.value) {
      return 0
    }
    return (currentTime.value / duration.value) * 100
  })

  const canPlay = computed(() => Boolean(src.value))

  async function load(
    nextSrc: string,
    options: { autoPlay?: boolean, title?: string } = {}
  ): Promise<void> {
    const audio = getAudio()
    if (!audio) {
      return
    }

    pause()
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0

    if (!nextSrc) {
      src.value = ''
      audio.removeAttribute('src')
      audio.load()
      return
    }

    if (options.title) {
      title.value = options.title
    }

    src.value = nextSrc
    audio.src = nextSrc
    audio.load()

    await new Promise<void>((resolve) => {
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
        duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
        resolve()
        return
      }
      audio.addEventListener('loadedmetadata', () => resolve(), { once: true })
    })

    if (options.autoPlay) {
      await play()
    }
  }

  function stop(): void {
    pause()
    const audio = getAudio()
    if (audio) {
      audio.removeAttribute('src')
      audio.load()
    }
    src.value = ''
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
  }

  async function play(): Promise<void> {
    const audio = getAudio()
    if (!audio || !src.value) {
      return
    }
    await audio.play()
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
    seekByProgress,
    download
  }
}
