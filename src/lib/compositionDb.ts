import type { Table } from 'dexie'
import Dexie from 'dexie'

const DB_NAME = 'yyds-studio'

export interface Composition {
  id: string
  name: string
  source: string
  createdAt: number
  updatedAt: number
}

export interface SaveCompositionInput {
  id?: string
  name: string
  source: string
}

class YydsStudioDb extends Dexie {
  compositions!: Table<Composition, string>

  constructor() {
    super(DB_NAME)
    // v1：与原生 IndexedDB 实现保持兼容，主键 id，索引 updatedAt
    this.version(1).stores({
      compositions: 'id, updatedAt'
    })
  }
}

const db = new YydsStudioDb()

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export async function listCompositions(): Promise<Composition[]> {
  // 利用 updatedAt 索引按时间倒序
  return db.compositions.orderBy('updatedAt').reverse().toArray()
}

export async function getComposition(id: string): Promise<Composition | null> {
  return (await db.compositions.get(id)) ?? null
}

export async function saveComposition(input: SaveCompositionInput): Promise<Composition> {
  const now = Date.now()
  return db.transaction('rw', db.compositions, async () => {
    const existing = input.id ? await db.compositions.get(input.id) : undefined
    const item: Composition = {
      id: input.id ?? existing?.id ?? generateId(),
      name: input.name,
      source: input.source,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    }
    await db.compositions.put(item)
    return item
  })
}

export async function deleteComposition(id: string): Promise<void> {
  await db.compositions.delete(id)
}
