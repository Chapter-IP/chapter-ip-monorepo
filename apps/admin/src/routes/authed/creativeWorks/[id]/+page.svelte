<script lang="ts">
  import { WORK_FILE_BUCKETS, createWorkFileNames } from '$lib/constants/workFileBuckets'
  import { appendOriginalExtension } from '$lib/helpers/work-upload'
  import { afterNavigate, beforeNavigate } from '$app/navigation'
  import { workStore } from '../stores/work-store'
  import UploadStepHeader from '../components/UploadStepHeader.svelte'
  import UploadWorkStep from '../components/UploadWorkStep.svelte'
  import UploadLicensingStep from '../components/UploadLicensingStep.svelte'
  import ConfirmWorkStep from '../components/ConfirmWorkStep.svelte'

  import { getWorkSampleSource, syncWorkSample, type ExistingSampleFile } from '../service/work-previews'
  import type { NamedUpload } from '$lib/upload/upload.service'
  import { startUploadingPhase, type UploadSession } from '$lib/upload/upload-session'
  import UploadProgressModal from '$lib/components/UploadProgressModal.svelte'
  import { notify, ToastType } from '@repo/ui-components'
  import { onDestroy, onMount } from 'svelte'
  import { STATUS, type StatusValue } from '../constants/constants'
  import type { ExistingContentFile } from '../types/work-store.types'
  import { createWorkUploadServices, getLicensePrices, goToFiles, openSuccessModal } from '../service/work.helpers'

  let { data } = $props()

  let currentStep = $state(1)
  const { uploadService, uploadSessions } = createWorkUploadServices()

  let initialPreviewFiles: ExistingSampleFile[] = []

  onMount(() => {
    initialPreviewFiles = data.existingFiles?.['preview-files'] ?? []
    workStore.hydrateFromContent(data, data.existingFiles)
  })
  onDestroy(() => {
    uploadSessions.invalidate()
    workStore.reset()
  })

  beforeNavigate(() => workStore.setLoading(true))
  afterNavigate(() => workStore.setLoading(false))

  const buildWorkMetadata = (uploadNames: string[]) => {
    const existingNames = $workStore.existingFiles.works.map((file) => file.name)
    const newNames = $workStore.files.works.map((file, index) => appendOriginalExtension(uploadNames[index], file))
    const filesName = [...existingNames, ...newNames]
    const existingPreviewNames = $workStore.existingFiles['preview-files'].map((file) => file.name)
    return {
      type: 'works' as const,
      name: $workStore.title,
      contentType: $workStore.contentType,
      description: $workStore.description,
      genre: $workStore.genre,
      authors: $workStore.authors,
      sample_text: $workStore.sampleText || undefined,
      files_name: filesName,
      preview_file_name: data.metadata?.preview_file_name as string | undefined,
      sample_file_name: '',
      preview_files_name: existingPreviewNames,
      licensing: $workStore.licensing,
    }
  }

  const buildUploadNames = () => {
    const existingNames = $workStore.existingFiles.works.map((file) => file.name)
    return createWorkFileNames('works', $workStore.files.works.length, existingNames)
  }

  const buildNamedUploads = (uploadNames: string[]): NamedUpload[] => {
    return $workStore.files.works.map((file, index) => ({
      file,
      name: uploadNames[index],
    }))
  }

  const getKeptFileIds = () =>
    new Set(WORK_FILE_BUCKETS.flatMap((bucket) => $workStore.existingFiles[bucket].map((file) => file.id)))

  const getCurrentFiles = () =>
    (data.allExistingFiles?.works ?? data.existingFiles?.works ?? data.files ?? []) as ExistingContentFile[]

  const buildWorkPayload = () => {
    const uploadNames = buildUploadNames()

    return {
      keptFileIds: getKeptFileIds(),
      metadata: buildWorkMetadata(uploadNames),
      uploads: buildNamedUploads(uploadNames),
      sampleSource: getWorkSampleSource($workStore),
      tags: (data.tags ?? []) as string[],
    }
  }

  const buildTokenMetadata = (keys: string[]) => {
    return {
      keys,
      title: $workStore.title,
      description: $workStore.description,
    }
  }

  const saveCurrentContent = async (
    uploadSession: UploadSession,
    {
      status,
      tokenId,
    }: {
      status?: StatusValue
      tokenId?: string
    } = {},
  ) => {
    const trpcClient = uploadService.createTrpcClient()
    const contentId = data.id
    const { keptFileIds, metadata, uploads, sampleSource, tags } = buildWorkPayload()

    startUploadingPhase(uploadSession.setProgress, uploads, false)

    const { keys } = await uploadService.updateContentFiles({
      contentId,
      currentFiles: getCurrentFiles(),
      keptFileIds,
      uploads,
      trpcClient,
      onUploadProgress: uploadSession.setProgress,
    })

    const isKeptSource = sampleSource && !(sampleSource instanceof File)
    const preserveExistingSample = Boolean(
      isKeptSource &&
      ($workStore.contentType === 'Lyrics'
        ? data.metadata?.contentType === 'Lyrics' && sampleSource.id === data.existingFiles.works[0]?.id
        : initialPreviewFiles.some((file) => file.id === sampleSource.id && /^sample\.[^.]+$/.test(file.name))),
    )
    const sampleNames = await syncWorkSample({
      uploadService,
      trpcClient,
      contentId,
      source: sampleSource,
      existingPreviewFiles: initialPreviewFiles,
      preserveExistingSample,
      onRemoved: (fileId) => {
        initialPreviewFiles = initialPreviewFiles.filter((file) => file.id !== fileId)
      },
    })
    metadata.sample_file_name = sampleNames[0] ?? ''
    metadata.preview_files_name = sampleNames

    await uploadService.updateContentMetadata({
      contentId,
      trpcClient,
      metadata,
      tags,
      tokenId,
      status,
    })

    return { contentId, keys, metadata, trpcClient, tags }
  }

  const withWorkLoading = async (
    action: (uploadSession: UploadSession) => Promise<void>,
    logMessage: string,
    userMessage: string,
  ) => {
    const uploadSession = uploadSessions.begin()
    try {
      workStore.setLoading(true)
      await action(uploadSession)
    } catch (error) {
      console.error(logMessage, error)
      notify(userMessage, ToastType.FAIL)
    } finally {
      uploadSession.end()
    }
  }

  const onSaveDraftClick = async () => {
    await withWorkLoading(
      async (uploadSession) => {
        await saveCurrentContent(uploadSession, { status: STATUS.DRAFT })
        notify('Draft saved', ToastType.SUCCESS)
        await goToFiles()
      },
      'Error saving draft:',
      'Failed to save draft.',
    )
  }

  const activateContent = async (
    uploadSession: UploadSession,
    { contentId, metadata, trpcClient, tags }: Awaited<ReturnType<typeof saveCurrentContent>>,
  ) => {
    uploadSession.setProgress({ phase: 'minting', overallProgress: 1 })
    const tokenId = await uploadService.mintContent(getLicensePrices($workStore.licensing))

    uploadSession.setProgress({ phase: 'finalizing', overallProgress: 1 })
    await uploadService.finalizeContent({
      contentId,
      metadata,
      tokenId,
      trpcClient,
      tags,
    })

    return tokenId
  }

  const saveTokenMetadata = async (
    uploadSession: UploadSession,
    {
      tokenId,
      keys,
      trpcClient,
    }: Pick<Awaited<ReturnType<typeof saveCurrentContent>>, 'keys' | 'trpcClient'> & { tokenId: string },
  ) => {
    uploadSession.setProgress({ phase: 'saving-metadata', overallProgress: 1 })
    await uploadService.saveMetadata({
      tokenId,
      trpcClient,
      ...buildTokenMetadata(keys),
    })
  }

  const onSubmitClick = async () => {
    await withWorkLoading(
      async (uploadSession) => {
        const savedContent = await saveCurrentContent(uploadSession)
        const tokenId = data.tokenId ?? (await activateContent(uploadSession, savedContent))

        if (data.tokenId) {
          uploadSession.setProgress({ phase: 'updating-prices', overallProgress: 1 })
          await uploadService.updateContentPrices({
            tokenId,
            prices: getLicensePrices($workStore.licensing),
          })
        }

        await saveTokenMetadata(uploadSession, { ...savedContent, tokenId })
        openSuccessModal()
      },
      'Error updating listing:',
      'Failed to update listing.',
    )
  }
</script>

<div class="min-h-xl rounded-3xl p-5 shadow-md md:p-12.5 bg-[#f8f5f1]">
  <div class="max-w-250">
    <UploadStepHeader {currentStep} />

    {#if currentStep === 1}
      <UploadWorkStep bind:currentStep onSaveDraft={!data.tokenId ? onSaveDraftClick : undefined} />
    {:else if currentStep === 2}
      <UploadLicensingStep bind:currentStep onSaveDraft={!data.tokenId ? onSaveDraftClick : undefined} />
    {:else}
      <ConfirmWorkStep
        bind:currentStep
        onFormSubmit={onSubmitClick}
        onSaveDraft={!data.tokenId ? onSaveDraftClick : undefined}
      />
    {/if}
  </div>
</div>

{#if $workStore.ui.uploadProgress}
  <UploadProgressModal progress={$workStore.ui.uploadProgress} />
{/if}
