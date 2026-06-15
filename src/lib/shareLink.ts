export interface SharePayload {
  name: string
  source: string
}

export const SHARE_PARAM = 's'

function bytesToBinary(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return binary
}

function binaryToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function encodeShare(payload: SharePayload): string {
  const json = JSON.stringify({ name: payload.name, source: payload.source })
  const bytes = new TextEncoder().encode(json)
  const base64 = btoa(bytesToBinary(bytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeShare(value: string): SharePayload | null {
  if (!value) {
    return null
  }
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padding = (4 - (normalized.length % 4)) % 4
    const padded = normalized + '='.repeat(padding)
    const binary = atob(padded)
    const bytes = binaryToBytes(binary)
    const json = new TextDecoder().decode(bytes)
    const data = JSON.parse(json) as Partial<SharePayload>
    if (typeof data.name === 'string' && typeof data.source === 'string') {
      return { name: data.name, source: data.source }
    }
    return null
  }
  catch {
    return null
  }
}

export function buildShareUrl(payload: SharePayload, base?: string): string {
  if (typeof window === 'undefined' && !base) {
    throw new Error('无法构建分享链接：缺少基础 URL')
  }
  const url = new URL(base ?? window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set(SHARE_PARAM, encodeShare(payload))
  return url.toString()
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    }
    catch {
      // fall back below
    }
  }
  if (typeof document === 'undefined') {
    return false
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const succeeded = document.execCommand('copy')
    document.body.removeChild(textarea)
    return succeeded
  }
  catch {
    return false
  }
}
