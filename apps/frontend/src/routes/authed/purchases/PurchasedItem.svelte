<script lang="ts">
  import { downloadZip } from 'client-zip'
  import { showSaveFilePicker } from 'native-file-system-adapter'
  import mime from 'mime/lite'

  import DownloadFilesModal from './DownloadFilesModal.svelte'
  import DownloadProgressModal, { type DownloadProgressState } from './DownloadProgressModal.svelte'
  import { BLOCK_GRACE_MS } from './helper'
  import LikenessLicenseModal from './LikenessLicenseModal.svelte'
  import LocationLicenseModal from './LocationLicenseModal.svelte'
  import type {
    ContentFilesLinkClient,
    DownloadableContentFile,
    PurchasedItemView,
    PurchasedContentToken,
  } from './types'

  let {
    purchase,
    item,
    trpcClient,
  }: {
    purchase: PurchasedContentToken
    item: PurchasedItemView
    trpcClient: ContentFilesLinkClient | undefined
  } = $props()

  let isBlocked = $state(purchase.isBlocked)
  let now = $state(Date.now())
  let isDownloadBusy = $state(false)
  let isDownloading = $state(false)
  let downloadProgress = $state<DownloadProgressState>({
    phase: 'preparing',
    completedFiles: 0,
    totalFiles: 0,
    files: [],
  })
  let isModalOpen = $state(false)
  let isFallbackModalOpen = $state(false)
  let isSuccessModalOpen = $state(false)
  let fallbackFiles: DownloadableContentFile[] = $state([])
  let errorMessage = $state('')

  let graceEndsAt = $state<number | null>(purchase.blockedGraceEndsAt)

  const modalTitleId = $derived(`${item.type}-license-${purchase.licenseTokenId}`)
  const canDownload = $derived(!isBlocked && !isDownloadBusy)
  const showGraceCountdown = $derived(graceEndsAt != null && !isBlocked && now < graceEndsAt)
  const graceCountdownText = $derived(showGraceCountdown ? formatGraceCountdown(graceEndsAt! - now) : '')

  function formatGraceCountdown(msRemaining: number): string {
    const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000))
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (days > 0) {
      return `Access ends in ${days}d ${hours}h ${minutes}m`
    }

    return `Access ends in ${hours}h ${minutes}m ${seconds}s`
  }

  $effect(() => {
    if (purchase.isBlocked) isBlocked = true
  })

  $effect(() => {
    const fromProp = purchase.blockedGraceEndsAt
    if (fromProp != null) graceEndsAt = fromProp
  })

  function startOneTimeGraceIfNeeded() {
    if (purchase.licenseType !== '2') return
    if (graceEndsAt != null && Date.now() < graceEndsAt) return
    graceEndsAt = Date.now() + BLOCK_GRACE_MS
  }

  $effect(() => {
    const endsAt = graceEndsAt
    if (endsAt == null || !Number.isFinite(endsAt) || isBlocked) return

    const tick = () => {
      const current = Date.now()
      now = current
      if (current >= endsAt) {
        isBlocked = true
      }
    }

    tick()
    if (isBlocked) return

    const intervalId = setInterval(tick, 60000)
    return () => clearInterval(intervalId)
  })

  function getFilesLinkInput() {
    return {
      contentId: purchase.id,
      ...(purchase.licenseTokenId ? { licenseTokenId: purchase.licenseTokenId } : {}),
    }
  }

  function resetDownloadProgress() {
    downloadProgress = {
      phase: 'preparing',
      completedFiles: 0,
      totalFiles: 0,
      files: [],
    }
  }

  function trackDownloadBody(
    body: ReadableStream<Uint8Array>,
    totalBytes: number | null,
    onPercent: (percent: number) => void,
  ): ReadableStream<Uint8Array> {
    const reader = body.getReader()
    let loaded = 0
    onPercent(0)

    return new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read()
        if (done) {
          onPercent(100)
          controller.close()
          return
        }
        if (totalBytes && totalBytes > 0) {
          loaded += value.byteLength
          onPercent(Math.min(100, Math.round((loaded / totalBytes) * 100)))
        }
        controller.enqueue(value)
      },
    })
  }

  async function* fileStreamGenerator(
    files: DownloadableContentFile[],
    tracker: { failed: number },
    onProgress: (update: Partial<DownloadProgressState>) => void,
  ) {
    const fileProgress = files.map((file) => ({ label: file.label, percent: 0 }))
    onProgress({
      phase: 'downloading',
      completedFiles: 0,
      totalFiles: files.length,
      files: fileProgress,
    })

    let completedFiles = 0
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const response = await fetch(file.url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        if (!response.body) throw new Error('No response body')

        const contentLength = response.headers.get('Content-Length')
        const totalBytes = contentLength ? Number.parseInt(contentLength, 10) : 0
        const hasLength = Number.isFinite(totalBytes) && totalBytes > 0
        const reportFilePercent = (percent: number) => {
          fileProgress[i] = { ...fileProgress[i], percent }
          onProgress({ files: [...fileProgress] })
        }
        const body = trackDownloadBody(response.body, hasLength ? totalBytes : null, reportFilePercent)

        const safeLabel = file.label.replace(/[/\\]/g, '_')
        if (safeLabel.includes('.')) {
          yield {
            name: `${safeLabel}`,
            input: body,
          }
        } else {
          yield {
            name: `${safeLabel}.${mime.getExtension(file.mimetype) ?? 'bin'}`,
            input: body,
          }
        }
      } catch (error) {
        tracker.failed++
        console.error(`Skipping ${file.label}:`, error)
      } finally {
        fileProgress[i] = { ...fileProgress[i], percent: 100 }
        completedFiles++
        onProgress({ completedFiles, files: [...fileProgress] })
      }
    }

    onProgress({ phase: 'zipping', completedFiles: files.length })
  }

  async function downloadAllNativeStreaming(files: DownloadableContentFile[]): Promise<{
    cancelled: boolean
    failed: number
  }> {
    let fileHandle
    try {
      fileHandle = await showSaveFilePicker({
        suggestedName: `${item.downloadName}.zip`,
        types: [
          {
            description: 'ZIP Archive',
            accept: { 'application/zip': ['.zip'] },
          },
        ],
      })
    } catch {
      console.log('User cancelled the save dialog.')
      return { cancelled: true, failed: 0 }
    }

    isDownloading = true
    resetDownloadProgress()

    const tracker = { failed: 0 }
    let writableStream
    try {
      writableStream = await fileHandle.createWritable()
      const onProgress = (update: Partial<DownloadProgressState>) => {
        downloadProgress = { ...downloadProgress, ...update }
      }
      const zipResponse = downloadZip(fileStreamGenerator(files, tracker, onProgress))
      if (!zipResponse.body) throw new Error('Streams are not supported')
      await zipResponse.body.pipeTo(writableStream)
    } catch (err) {
      console.error('Download failed:', err)
      throw err
    } finally {
      await writableStream?.close().catch(() => {})
    }
    return { cancelled: false, failed: tracker.failed }
  }

  async function downloadFiles() {
    if (!canDownload) return

    errorMessage = ''
    isDownloadBusy = true
    let files: DownloadableContentFile[] = []
    let downloadSucceeded = false
    try {
      if (!trpcClient) throw new Error('Missing TRPC client')

      const result = await trpcClient.contents.getContentAllFilesLink.query(getFilesLinkInput())
      files = result.files
      if (!files.length) throw new Error('No content files available')

      startOneTimeGraceIfNeeded()

      if (typeof showSaveFilePicker !== 'function') {
        fallbackFiles = files
        isFallbackModalOpen = true
        return
      }

      const { cancelled, failed } = await downloadAllNativeStreaming(files)
      if (cancelled) return

      isDownloading = false
      if (failed > 0) {
        fallbackFiles = files
        isFallbackModalOpen = true
      } else {
        downloadSucceeded = true
        isSuccessModalOpen = true
      }
    } catch (error) {
      console.error('Error downloading content files:', error)
      isDownloading = false
      if (files.length > 0) {
        fallbackFiles = files
        isFallbackModalOpen = true
      } else {
        errorMessage = 'Download is unavailable right now.'
      }
    } finally {
      if (!downloadSucceeded) {
        isDownloading = false
        isDownloadBusy = false
      }
    }
  }

  function closeModal() {
    isModalOpen = false
  }

  function closeFallbackModal() {
    isFallbackModalOpen = false
    fallbackFiles = []
  }

  function closeSuccessModal() {
    isSuccessModalOpen = false
    isDownloading = false
    isDownloadBusy = false
  }

  function handleKeydown(event: KeyboardEvent) {
    if (isModalOpen && event.key === 'Escape') closeModal()
    if (isFallbackModalOpen && event.key === 'Escape') closeFallbackModal()
    if (isSuccessModalOpen && event.key === 'Escape') closeSuccessModal()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<article
  class="grid gap-4 py-6 md:grid-cols-[160px_minmax(0,1fr)_auto] md:items-center md:gap-6 md:py-8 lg:grid-cols-[168px_minmax(0,1fr)_auto]"
>
  <div class="size-24 overflow-hidden bg-dark md:size-40 lg:size-42">
    <img src={item.image.src} alt={item.image.alt} class="size-full object-cover" />
  </div>

  <div class="min-w-0">
    <p class="text-xs leading-4 font-semibold tracking-[0.14em] text-primary uppercase">{item.categoryLabel}</p>
    <h2 class="mt-1 truncate font-heading text-xl leading-6 font-semibold text-dark">{item.name}</h2>
    {#if item.byline}
      <p class="mt-1 truncate text-sm leading-5 text-[#6d6a73]">{item.byline}</p>
    {/if}
    {#if isBlocked}
      <p class="mt-2 text-sm leading-5 font-medium text-[#9f2f2f]">Already used</p>
    {:else if showGraceCountdown}
      <p class="mt-2 text-sm leading-5 font-medium text-[#9f2f2f]">{graceCountdownText}</p>
    {:else if errorMessage}
      <p class="mt-2 text-sm leading-5 font-medium text-[#9f2f2f]">{errorMessage}</p>
    {/if}
  </div>

  <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
    <button
      type="button"
      class="btn min-h-11 w-full rounded-none border-primary bg-primary px-5 text-sm font-semibold text-white hover:border-[#5427dc] hover:bg-[#5427dc] md:min-h-12.5 md:w-47"
      onclick={() => (isModalOpen = true)}
    >
      View License
    </button>
    <button
      type="button"
      class="btn min-h-11 w-full rounded-none border-primary bg-white px-5 text-sm font-semibold text-primary hover:border-[#5427dc] hover:bg-cream md:min-h-12.5 md:w-47"
      disabled={!canDownload}
      onclick={downloadFiles}
    >
      {#if isDownloadBusy}
        Downloading
      {:else if isBlocked}
        Already used
      {:else}
        Download
      {/if}
    </button>
  </div>
</article>

{#if isModalOpen}
  {#if item.type === 'likeness'}
    <LikenessLicenseModal likeness={item.likeness} byline={item.byline} titleId={modalTitleId} onClose={closeModal} />
  {:else}
    <LocationLicenseModal location={item.location} byline={item.byline} titleId={modalTitleId} onClose={closeModal} />
  {/if}
{/if}

{#if isFallbackModalOpen}
  <DownloadFilesModal files={fallbackFiles} title={item.downloadName} onClose={closeFallbackModal} />
{/if}

{#if isDownloading}
  <DownloadProgressModal progress={downloadProgress} />
{/if}

{#if isSuccessModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
    role="presentation"
    onclick={(event) => {
      if (event.target === event.currentTarget) closeSuccessModal()
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Download complete"
      tabindex="-1"
      class="w-full max-w-lg bg-[#f5f1ec] p-5 shadow-2xl sm:p-8 select-none cursor-default"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs leading-4 font-semibold tracking-[0.14em] text-primary uppercase">Download complete</p>
          <h2 class="mt-1 font-heading text-2xl leading-8 font-semibold text-[#1a1a2e]">
            {item.downloadName}
          </h2>
          <p class="mt-3 text-sm leading-5 text-[#6d6a73]">
            Your files have been downloaded and saved as a ZIP archive.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost min-h-10 rounded-none px-3 text-xl leading-none text-[#1a1a2e]"
          aria-label="Close download confirmation"
          onclick={closeSuccessModal}
        >
          X
        </button>
      </div>
      <button
        type="button"
        class="btn mt-6 min-h-11 w-full rounded-none border-primary bg-primary px-5 text-sm font-semibold text-white hover:border-[#5427dc] hover:bg-[#5427dc]"
        onclick={closeSuccessModal}
      >
        Done
      </button>
    </div>
  </div>
{/if}
