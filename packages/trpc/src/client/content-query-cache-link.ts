import type { OperationResultEnvelope, TRPCClientError, TRPCLink } from '@trpc/client'
import type { Observable } from '@trpc/server/observable'
import type { AppRouter } from '../server/server'
import { createStableCacheKey } from './cache-key'
import { createObservable, shareObservable } from './observable'

const CONTENT_QUERY_CACHE_TTL_MS = 60_000
const CACHED_CONTENT_QUERY_PATHS = new Set(['contents.findContent', 'contents.getContentById'])
const CONTENT_QUERY_CACHE_INVALIDATING_MUTATIONS = new Set([
  'contents.registerContent',
  'contents.updateContentMetadata',
  'contents.registerContentFile',
  'contents.removeContentFile',
  'contents.removeContent',
])

type QueryCacheResult = OperationResultEnvelope<unknown, TRPCClientError<AppRouter>>
type QueryCacheObservable = Observable<QueryCacheResult, TRPCClientError<AppRouter>>
type QueryCacheEntry =
  | {
      expiresAt: number
      status: 'pending'
      observable: QueryCacheObservable
    }
  | {
      expiresAt: number
      status: 'resolved'
      value: QueryCacheResult
    }

const contentQueryCache = new Map<string, QueryCacheEntry>()
let contentQueryCacheVersion = 0

function invalidateContentQueryCache(): void {
  contentQueryCacheVersion += 1
  contentQueryCache.clear()
}

function getContentQueryCacheEntry(cacheKey: string, now = Date.now()): QueryCacheEntry | undefined {
  const cached = contentQueryCache.get(cacheKey)

  if (!cached) {
    return undefined
  }

  if (cached.expiresAt <= now) {
    contentQueryCache.delete(cacheKey)
    return undefined
  }

  return cached
}

export function contentQueryCacheLink(): TRPCLink<AppRouter> {
  return () =>
    ({ op, next }) => {
      if (op.type === 'mutation' && CONTENT_QUERY_CACHE_INVALIDATING_MUTATIONS.has(op.path)) {
        return createObservable((observer) =>
          next(op).subscribe({
            next(value) {
              invalidateContentQueryCache()
              observer.next?.(value)
            },
            error(error) {
              observer.error?.(error)
            },
            complete() {
              observer.complete?.()
            },
          }),
        )
      }

      if (op.type !== 'query' || !CACHED_CONTENT_QUERY_PATHS.has(op.path)) {
        return next(op)
      }

      const now = Date.now()
      const cacheKey = createStableCacheKey(op.path, op.input)
      const cached = getContentQueryCacheEntry(cacheKey, now)

      if (cached) {
        if (cached.status === 'pending') {
          return cached.observable
        }

        return createObservable((observer) => {
          observer.next?.(cached.value)
          observer.complete?.()
        })
      }

      const requestCacheVersion = contentQueryCacheVersion
      const observableResult = shareObservable(
        createObservable<QueryCacheResult, TRPCClientError<AppRouter>>((observer) =>
          next(op).subscribe({
            next(value) {
              if (requestCacheVersion === contentQueryCacheVersion) {
                contentQueryCache.set(cacheKey, {
                  expiresAt: Date.now() + CONTENT_QUERY_CACHE_TTL_MS,
                  status: 'resolved',
                  value,
                })
              }
              observer.next?.(value)
            },
            error(error) {
              if (requestCacheVersion === contentQueryCacheVersion) {
                contentQueryCache.delete(cacheKey)
              }
              observer.error?.(error)
            },
            complete() {
              observer.complete?.()
            },
          }),
        ),
      )

      contentQueryCache.set(cacheKey, {
        expiresAt: now + CONTENT_QUERY_CACHE_TTL_MS,
        status: 'pending',
        observable: observableResult,
      })

      return observableResult
    }
}
