import type { Operation, OperationResultEnvelope, TRPCClientError } from '@trpc/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppRouter } from '../server/server'
import { contentQueryCacheLink } from './content-query-cache-link'
import { createObservable } from './observable'

type TestResult = OperationResultEnvelope<unknown, TRPCClientError<AppRouter>>
type TestObserver = {
  next?: (value: TestResult) => void
  error?: (error: TRPCClientError<AppRouter>) => void
  complete?: () => void
}

function createOperation(path: string, input: unknown, type: Operation['type'] = 'query'): Operation {
  return {
    id: Math.floor(Math.random() * 1_000_000),
    type,
    input,
    path,
    context: {},
    signal: null,
  }
}

function createResult(data: unknown): TestResult {
  return { result: { data } }
}

function createDeferredNext() {
  const observers: TestObserver[] = []
  const next = vi.fn(() =>
    createObservable<TestResult, TRPCClientError<AppRouter>>((observer) => {
      observers.push(observer)
      return undefined
    }),
  )

  return {
    next,
    emit(value: TestResult) {
      for (const observer of observers) {
        observer.next?.(value)
        observer.complete?.()
      }
    },
  }
}

function createImmediateNext(dataFactory: () => unknown) {
  const next = vi.fn(() =>
    createObservable<TestResult, TRPCClientError<AppRouter>>((observer) => {
      observer.next?.(createResult(dataFactory()))
      observer.complete?.()
      return undefined
    }),
  )

  return { next }
}

describe('contentQueryCacheLink', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('caches contents.findContent query results by path and input', () => {
    let responseIndex = 0
    const { next } = createImmediateNext(() => ({ responseIndex: ++responseIndex }))
    const link = contentQueryCacheLink()({})
    const firstNext = vi.fn()
    const secondNext = vi.fn()
    const op = createOperation('contents.findContent', { limit: '100', sort: 'createdAt' })

    link({ op, next }).subscribe({ next: firstNext })
    link({ op, next }).subscribe({ next: secondNext })

    expect(next).toHaveBeenCalledOnce()
    expect(firstNext).toHaveBeenCalledWith(createResult({ responseIndex: 1 }))
    expect(secondNext).toHaveBeenCalledWith(createResult({ responseIndex: 1 }))
  })

  it('caches contents.getContentById query results', () => {
    let responseIndex = 0
    const { next } = createImmediateNext(() => ({ id: 'content-1', responseIndex: ++responseIndex }))
    const link = contentQueryCacheLink()({})
    const firstNext = vi.fn()
    const secondNext = vi.fn()
    const op = createOperation('contents.getContentById', { id: 'content-1' })

    link({ op, next }).subscribe({ next: firstNext })
    link({ op, next }).subscribe({ next: secondNext })

    expect(next).toHaveBeenCalledOnce()
    expect(firstNext).toHaveBeenCalledWith(createResult({ id: 'content-1', responseIndex: 1 }))
    expect(secondNext).toHaveBeenCalledWith(createResult({ id: 'content-1', responseIndex: 1 }))
  })

  it('deduplicates identical pending queries', () => {
    const { next, emit } = createDeferredNext()
    const link = contentQueryCacheLink()({})
    const firstNext = vi.fn()
    const secondNext = vi.fn()
    const op = createOperation('contents.findContent', { test: 'pending-dedupe' })

    link({ op, next }).subscribe({ next: firstNext })
    link({ op, next }).subscribe({ next: secondNext })
    emit(createResult({ ok: true }))

    expect(next).toHaveBeenCalledOnce()
    expect(firstNext).toHaveBeenCalledWith(createResult({ ok: true }))
    expect(secondNext).toHaveBeenCalledWith(createResult({ ok: true }))
  })

  it('invalidates cached content queries after content mutations', () => {
    let responseIndex = 0
    const { next } = createImmediateNext(() => ({ responseIndex: ++responseIndex }))
    const link = contentQueryCacheLink()({})
    const op = createOperation('contents.getContentById', { id: 'content-to-invalidate' })

    link({ op, next }).subscribe({})
    link({
      op: createOperation('contents.updateContentMetadata', { contentId: 'content-to-invalidate' }, 'mutation'),
      next,
    }).subscribe({})
    link({ op, next }).subscribe({})

    expect(next).toHaveBeenCalledTimes(3)
  })

  it('does not cache an in-flight query result after invalidation', () => {
    const { next: deferredNext, emit } = createDeferredNext()
    const { next: refreshedNext } = createImmediateNext(() => ({ fresh: true }))
    const link = contentQueryCacheLink()({})
    const op = createOperation('contents.getContentById', { id: 'race-content' })
    const firstNext = vi.fn()
    const secondNext = vi.fn()

    link({ op, next: deferredNext }).subscribe({ next: firstNext })
    link({
      op: createOperation('contents.removeContentFile', { fileId: 'file-1' }, 'mutation'),
      next: refreshedNext,
    }).subscribe({})
    emit(createResult({ stale: true }))
    link({ op, next: refreshedNext }).subscribe({ next: secondNext })

    expect(firstNext).toHaveBeenCalledWith(createResult({ stale: true }))
    expect(refreshedNext).toHaveBeenCalledTimes(2)
    expect(secondNext).toHaveBeenCalledWith(createResult({ fresh: true }))
  })

  it('invalidates cached content queries after contents.removeContent', () => {
    let responseIndex = 0
    const { next } = createImmediateNext(() => ({ responseIndex: ++responseIndex }))
    const link = contentQueryCacheLink()({})
    const op = createOperation('contents.getContentById', { id: 'content-to-remove' })

    link({ op, next }).subscribe({})
    link({
      op: createOperation('contents.removeContent', { contentId: 'content-to-remove' }, 'mutation'),
      next,
    }).subscribe({})
    link({ op, next }).subscribe({})

    expect(next).toHaveBeenCalledTimes(3)
  })

  it('lazily expires cached entries', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)

    let responseIndex = 0
    const { next } = createImmediateNext(() => ({ responseIndex: ++responseIndex }))
    const link = contentQueryCacheLink()({})
    const op = createOperation('contents.findContent', { test: 'ttl' })

    link({ op, next }).subscribe({})
    vi.setSystemTime(60_001)
    link({ op, next }).subscribe({})

    expect(next).toHaveBeenCalledTimes(2)
  })
})
