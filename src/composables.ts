import { ref } from 'vue'
import { catalog } from '@/data/repository'
import type { Category } from '@/data/types'

const categories = ref<Category[]>([])
let loading: Promise<void> | null = null

/** Общий кэш категорий для шапки, каталога и хлебных крошек */
export function useCategories() {
  loading ??= catalog.getCategories().then((c) => { categories.value = c })
  return { categories, ready: loading }
}

export function categoryPath(all: Category[], id: string): Category[] {
  const c = all.find((x) => x.id === id)
  return c ? [...(c.parentId ? categoryPath(all, c.parentId) : []), c] : []
}
