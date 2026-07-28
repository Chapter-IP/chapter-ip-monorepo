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
    currentFileLabel: '',
  })
  let isModalOpen = $state(false)
  let isFallbackModalOpen = $state(false)
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
      currentFileLabel: '',
    }
  }

  async function* fileStreamGenerator(
    files: DownloadableContentFile[],
    tracker: { failed: number },
    onProgress: (update: Partial<DownloadProgressState>) => void,
  ) {
    onProgress({ phase: 'downloading', completedFiles: 0, totalFiles: files.length, currentFileLabel: '' })

    let completedFiles = 0
    for (const file of files) {
      onProgress({ currentFileLabel: file.label })
      try {
        const response = await fetch(file.url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        if (!response.body) throw new Error('No response body')

        const safeLabel = file.label.replace(/[/\\]/g, '_')
        if (safeLabel.includes('.')) {
          yield {
            name: `${safeLabel}`,
            input: response.body,
          }
        } else {
          yield {
            name: `${safeLabel}.${mime.getExtension(file.mimetype) ?? 'bin'}`,
            input: response.body,
          }
        }
      } catch (error) {
        tracker.failed++
        console.error(`Skipping ${file.label}:`, error)
      } finally {
        completedFiles++
        onProgress({ completedFiles, currentFileLabel: '' })
      }
    }

    onProgress({ phase: 'zipping', completedFiles: files.length, currentFileLabel: '' })
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
      isDownloading = false
      isDownloadBusy = false
    }
  }

  function closeModal() {
    isModalOpen = false
  }

  function closeFallbackModal() {
    isFallbackModalOpen = false
    fallbackFiles = []
  }

  function handleKeydown(event: KeyboardEvent) {
    if (isModalOpen && event.key === 'Escape') closeModal()
    if (isFallbackModalOpen && event.key === 'Escape') closeFallbackModal()
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
