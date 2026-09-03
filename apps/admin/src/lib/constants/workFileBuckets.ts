export const WORK_FILE_BUCKETS = ['works'] as const

export type WorkFileKey = (typeof WORK_FILE_BUCKETS)[number]

const WORK_FILE_PREFIXES: Record<WorkFileKey, string> = {
  works: 'work',
}

export const createWorkFileNames = (bucket: WorkFileKey, count: number, existingNames: string[] = []): string[] => {
  const prefix = WORK_FILE_PREFIXES[bucket]
  const pattern = new RegExp(`^${prefix}_(\\d+)(?:\\.[^.]+)?$`)
  let sequence = existingNames.reduce((max, name) => {
    const match = pattern.exec(name)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)

  return Array.from({ length: count }, () => {
    sequence += 1
    return `${prefix}_${sequence}`
  })
}
