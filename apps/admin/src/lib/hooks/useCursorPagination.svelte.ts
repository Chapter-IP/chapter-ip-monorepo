type CursorPaginationResult<TItem> = {
  items: TItem[]
  totalCount?: number
  cursor: {
    current?: string | null
    next?: string | null
  }
}

type CursorPaginationOptions<TItem> = {
  fetchPage: (cursor?: string) => Promise<CursorPaginationResult<TItem>>
  onError?: (err: unknown) => void
}

export function useCursorPagination<TItem>({ fetchPage, onError }: CursorPaginationOptions<TItem>) {
  let loading = $state(true)
  let items = $state<TItem[]>([])
  let totalCount = $state(0)
  let cursorStack = $state<Array<string | undefined>>([undefined])
  let currentPage = $state(0)
  let hasNext = $state(false)

  let cancelled = false
  let requestId = 0

  const loadPage = async (cursor?: string) => {
    const id = ++requestId
    loading = true
    try {
      const result = await fetchPage(cursor)
      if (cancelled || id !== requestId) return

      items = result.items
      totalCount = result.totalCount ?? 0

      const nextCursor = result.cursor.next
      hasNext = !!nextCursor && nextCursor !== result.cursor.current

      if (hasNext) {
        cursorStack = [...cursorStack.slice(0, currentPage + 1), nextCursor!]
      }
    } catch (err) {
      if (cancelled || id !== requestId) return
      items = []
      onError?.(err)
    } finally {
      if (!cancelled && id === requestId) loading = false
    }
  }

  $effect(() => {
    cancelled = false
    void loadPage()
    return () => {
      cancelled = true
    }
  })

  const nextPage = async () => {
    if (!hasNext || loading) return
    currentPage += 1
    await loadPage(cursorStack[currentPage])
  }

  const prevPage = async () => {
    if (currentPage === 0 || loading) return
    currentPage -= 1
    await loadPage(cursorStack[currentPage])
  }

  const reload = async () => {
    currentPage = 0
    cursorStack = [undefined]
    await loadPage()
  }

  return {
    get loading() {
      return loading
    },
    get items() {
      return items
    },
    get totalCount() {
      return totalCount
    },
    get currentPage() {
      return currentPage
    },
    get hasNext() {
      return hasNext
    },
    setItems(nextItems: TItem[]) {
      items = nextItems
    },
    nextPage,
    prevPage,
    reload,
  }
}
