import { expect, test, vi } from 'vitest'
import { get } from 'svelte/store'
import { getHeightTotalInches, getNormalizedWeight, likenessStore, loadExistingFiles } from './likeness-store'

type LoadExistingFilesContent = Parameters<typeof loadExistingFiles>[0]
type LoadExistingFilesClient = Parameters<typeof loadExistingFiles>[1]
type GetContentAllFilesLinkQuery = LoadExistingFilesClient['contents']['getContentAllFilesLink']['query']
type GetContentAllFilesLinkInput = Parameters<GetContentAllFilesLinkQuery>[0]

test('calculates total height inches from feet and inches metadata fields', () => {
  expect(getHeightTotalInches({ heightFt: '5', heightIn: '10' })).toBe(70)
  expect(getHeightTotalInches({ heightFt: ' 6 ', heightIn: '0' })).toBe(72)
})

test('omits heightTotalInches when height parts are incomplete or invalid', () => {
  expect(getHeightTotalInches({ heightFt: '', heightIn: '10' })).toBeUndefined()
  expect(getHeightTotalInches({ heightFt: '5', heightIn: '' })).toBeUndefined()
  expect(getHeightTotalInches({ heightFt: '5', heightIn: '12' })).toBeUndefined()
  expect(getHeightTotalInches({ heightFt: 'abc', heightIn: '10' })).toBeUndefined()
  expect(getHeightTotalInches({ heightFt: '5', heightIn: '-1' })).toBeUndefined()
})

test('normalizes weight metadata to positive numbers or null', () => {
  expect(getNormalizedWeight(165)).toBe(165)
  expect(getNormalizedWeight('165')).toBe(165)
  expect(getNormalizedWeight('')).toBeNull()
  expect(getNormalizedWeight(null)).toBeNull()
  expect(getNormalizedWeight(0)).toBeNull()
  expect(getNormalizedWeight('abc')).toBeNull()
})

test('loads existing likeness file URLs through the all files link endpoint', async () => {
  const queryInputs: GetContentAllFilesLinkInput[] = []
  const query = vi.fn(async (input: GetContentAllFilesLinkInput) => {
    queryInputs.push(input)
    return {
      files: [
        { id: 'file-headshot', label: 'headshot_1', url: 'https://r2.example/headshot' },
        { id: 'file-voice', label: 'voice_sample_1', url: 'https://r2.example/voice' },
      ],
    }
  })
  const trpcClient = {
    contents: {
      getContentAllFilesLink: { query },
    },
  } as unknown as LoadExistingFilesClient
  const content: LoadExistingFilesContent = {
    id: 'content-1',
    metadata: {
      uploadsByBucket: {
        headshots: ['headshot_1'],
        voiceSamples: ['voice_sample_1'],
      },
    },
  }

  await expect(loadExistingFiles(content, trpcClient)).resolves.toEqual({
    headshots: [{ id: 'file-headshot', name: 'headshot_1', url: 'https://r2.example/headshot' }],
    bodyShots: [],
    voiceSamples: [{ id: 'file-voice', name: 'voice_sample_1', url: 'https://r2.example/voice' }],
    videoReels: [],
  })
  expect(query).toHaveBeenCalledTimes(1)
  expect(queryInputs).toEqual([{ contentId: 'content-1' }])
})

test('resolves files when uploads metadata stores names with extensions', async () => {
  const query = vi.fn(async () => ({
    files: [
      {
        id: 'file-headshot',
        label: 'headshot_1.jpg',
        url: 'https://r2.example/headshot.jpg',
        bucket: 'chapter-ip-content-test',
      },
      {
        id: 'file-voice',
        label: 'voice_sample_1.mp3',
        url: 'https://r2.example/voice.mp3',
        bucket: 'chapter-ip-content-test',
      },
    ],
  }))
  const trpcClient = {
    contents: {
      getContentAllFilesLink: { query },
    },
  } as unknown as LoadExistingFilesClient
  const content: LoadExistingFilesContent = {
    id: 'content-1',
    metadata: {
      uploadsByBucket: {
        headshots: ['headshot_1.jpg'],
        voiceSamples: ['voice_sample_1.mp3'],
      },
    },
  }

  await expect(loadExistingFiles(content, trpcClient)).resolves.toEqual({
    headshots: [{ id: 'file-headshot', name: 'headshot_1.jpg', url: 'https://r2.example/headshot.jpg' }],
    bodyShots: [],
    voiceSamples: [{ id: 'file-voice', name: 'voice_sample_1.mp3', url: 'https://r2.example/voice.mp3' }],
    videoReels: [],
  })
})

test('resolves files when uploads metadata stores names without extensions', async () => {
  const query = vi.fn(async () => ({
    files: [
      {
        id: 'file-headshot',
        label: 'headshot_1.jpg',
        url: 'https://r2.example/headshot.jpg',
        bucket: 'chapter-ip-content-test',
      },
      {
        id: 'file-voice',
        label: 'voice_sample_1.mp3',
        url: 'https://r2.example/voice.mp3',
        bucket: 'chapter-ip-content-test',
      },
    ],
  }))
  const trpcClient = {
    contents: {
      getContentAllFilesLink: { query },
    },
  } as unknown as LoadExistingFilesClient
  const content: LoadExistingFilesContent = {
    id: 'content-1',
    metadata: {
      uploadsByBucket: {
        headshots: ['headshot_1'],
        voiceSamples: ['voice_sample_1'],
      },
    },
  }

  await expect(loadExistingFiles(content, trpcClient)).resolves.toEqual({
    headshots: [{ id: 'file-headshot', name: 'headshot_1.jpg', url: 'https://r2.example/headshot.jpg' }],
    bodyShots: [],
    voiceSamples: [{ id: 'file-voice', name: 'voice_sample_1.mp3', url: 'https://r2.example/voice.mp3' }],
    videoReels: [],
  })
})

test('skips preview-bucket files when loading existing likeness files', async () => {
  const query = vi.fn(async () => ({
    files: [
      {
        id: 'file-headshot',
        label: 'headshot_1',
        url: 'https://r2.example/headshot',
        bucket: 'chapter-ip-content-test',
      },
      {
        id: 'file-preview',
        label: 'headshot_1_preview',
        url: 'https://r2.example/preview',
        bucket: 'chapter-ip-preview-test',
      },
    ],
  }))
  const trpcClient = {
    contents: {
      getContentAllFilesLink: { query },
    },
  } as unknown as LoadExistingFilesClient
  const content: LoadExistingFilesContent = {
    id: 'content-1',
    metadata: {
      uploadsByBucket: {
        headshots: ['headshot_1'],
      },
    },
  }

  await expect(loadExistingFiles(content, trpcClient)).resolves.toEqual({
    headshots: [{ id: 'file-headshot', name: 'headshot_1', url: 'https://r2.example/headshot' }],
    bodyShots: [],
    voiceSamples: [],
    videoReels: [],
  })
})

test('treats a missing files response as an empty existing files list', async () => {
  const query = vi.fn(async () => ({}))
  const trpcClient = {
    contents: {
      getContentAllFilesLink: { query },
    },
  } as unknown as LoadExistingFilesClient
  const content: LoadExistingFilesContent = {
    id: 'content-1',
    metadata: {
      uploadsByBucket: {
        headshots: ['headshot_1'],
      },
    },
  }

  await expect(loadExistingFiles(content, trpcClient)).resolves.toEqual({
    headshots: [],
    bodyShots: [],
    voiceSamples: [],
    videoReels: [],
  })
})

test('treats a null files response as an empty existing files list', async () => {
  const query = vi.fn(async () => ({ files: null }))
  const trpcClient = {
    contents: {
      getContentAllFilesLink: { query },
    },
  } as unknown as LoadExistingFilesClient
  const content: LoadExistingFilesContent = {
    id: 'content-1',
    metadata: {
      uploadsByBucket: {
        headshots: ['headshot_1'],
      },
    },
  }

  await expect(loadExistingFiles(content, trpcClient)).resolves.toEqual({
    headshots: [],
    bodyShots: [],
    voiceSamples: [],
    videoReels: [],
  })
})

test('skips loading links when content id is missing', async () => {
  const query = vi.fn()
  const trpcClient = {
    contents: {
      getContentAllFilesLink: { query },
    },
  } as unknown as LoadExistingFilesClient
  const content: LoadExistingFilesContent = {
    id: '',
  }

  await expect(loadExistingFiles(content, trpcClient)).resolves.toEqual({
    headshots: [],
    bodyShots: [],
    voiceSamples: [],
    videoReels: [],
  })
  expect(query).not.toHaveBeenCalled()
})

test('skips returned file links that are not tracked in uploads metadata', async () => {
  const query = vi.fn(async () => ({
    files: [
      { id: 'file-headshot', label: 'headshot_1', url: 'https://r2.example/headshot' },
      { id: 'file-untracked', label: 'untracked_file', url: 'https://r2.example/untracked' },
    ],
  }))
  const trpcClient = {
    contents: {
      getContentAllFilesLink: { query },
    },
  } as unknown as LoadExistingFilesClient
  const content: LoadExistingFilesContent = {
    id: 'content-1',
    metadata: {
      uploadsByBucket: {
        headshots: ['headshot_1'],
      },
    },
  }

  await expect(loadExistingFiles(content, trpcClient)).resolves.toEqual({
    headshots: [{ id: 'file-headshot', name: 'headshot_1', url: 'https://r2.example/headshot' }],
    bodyShots: [],
    voiceSamples: [],
    videoReels: [],
  })
  expect(query).toHaveBeenCalledTimes(1)
})

test('keeps only the first decimal point when setting license prices', () => {
  likenessStore.reset()

  likenessStore.setLicenseTypePrice('single-use', '1.2.3')

  expect(get(likenessStore).licensing.licensePrices['single-use']).toBe('1.23')
})
