export * from './socket'
export * from './tx'
export * from './file-text-parser'

const env = import.meta.env.VITE_ENV || 'staging'

export const snowtraceUrl = env === 'prod' ? 'https://snowtrace.io' : 'https://testnet.snowtrace.io'

export const r2BaseConfig =
  env === 'prod'
    ? {
        previewUrl: 'https://preview-files.chapterip.com',
        defaultImageUrl: 'https://preview-files.chapterip.com/chapter_ip.png',
        userFilesUrl: 'https://user-files.chapterip.com',
      }
    : {
        previewUrl: 'https://preview-files-staging.chapterip.com',
        defaultImageUrl: 'https://preview-files-staging.chapterip.com/chapter_ip.png',
        userFilesUrl: 'https://user-files-staging.chapterip.com',
      }
