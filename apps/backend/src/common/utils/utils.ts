import { isPlainObject, mapValues, snakeCase } from 'es-toolkit'

export function withEnvOverrides<T>(config: T, prefix = ''): T {
  return mapValues(config as Record<string, unknown>, (value, key) => {
    const envKey = (prefix ? `${prefix}_` : '') + snakeCase(key).toUpperCase()

    if (isPlainObject(value)) {
      return withEnvOverrides(value, envKey)
    }

    const envValue = process.env[envKey]
    if (envValue === undefined) return value

    if (Array.isArray(value)) return envValue.split(',').map((v) => v.trim())
    if (typeof value === 'number') return Number(envValue)
    if (typeof value === 'boolean') return envValue === 'true' || envValue === '1'

    return envValue
  }) as T
}
