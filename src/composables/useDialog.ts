import { ref } from 'vue'

export type DialogTone = 'default' | 'danger'

export interface BaseDialogOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  tone?: DialogTone
}

export type ConfirmOptions = BaseDialogOptions

export interface PromptOptions extends BaseDialogOptions {
  defaultValue?: string
  placeholder?: string
}

interface CommonDialogFields {
  title: string
  message: string
  confirmText: string
  cancelText: string
  tone: DialogTone
}

export interface ConfirmDialogState extends CommonDialogFields {
  type: 'confirm'
  defaultValue: ''
  placeholder: ''
  resolve: (value: boolean) => void
}

export interface PromptDialogState extends CommonDialogFields {
  type: 'prompt'
  defaultValue: string
  placeholder: string
  resolve: (value: string | null) => void
}

export type DialogState = ConfirmDialogState | PromptDialogState

const current = ref<DialogState | null>(null)

function dismiss(): void {
  const dialog = current.value
  if (!dialog) {
    return
  }
  current.value = null
  if (dialog.type === 'confirm') {
    dialog.resolve(false)
  }
  else {
    dialog.resolve(null)
  }
}

function showConfirm(options: ConfirmOptions = {}): Promise<boolean> {
  // 已有未关闭对话框时，先按取消处理
  dismiss()
  return new Promise<boolean>((resolve) => {
    current.value = {
      type: 'confirm',
      title: options.title ?? '请确认',
      message: options.message ?? '',
      confirmText: options.confirmText ?? '确定',
      cancelText: options.cancelText ?? '取消',
      tone: options.tone ?? 'default',
      defaultValue: '',
      placeholder: '',
      resolve
    }
  })
}

function showPrompt(options: PromptOptions = {}): Promise<string | null> {
  dismiss()
  return new Promise<string | null>((resolve) => {
    current.value = {
      type: 'prompt',
      title: options.title ?? '请输入',
      message: options.message ?? '',
      confirmText: options.confirmText ?? '确定',
      cancelText: options.cancelText ?? '取消',
      tone: options.tone ?? 'default',
      defaultValue: options.defaultValue ?? '',
      placeholder: options.placeholder ?? '',
      resolve
    }
  })
}

export function useDialog() {
  return {
    current,
    confirm: showConfirm,
    prompt: showPrompt,
    close: dismiss
  }
}
