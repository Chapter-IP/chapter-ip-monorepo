<script lang="ts">
  import { WORK_FILE_BUCKETS, createWorkFileNames } from '$lib/constants/workFileBuckets'
  import { appendOriginalExtension, uploadPreviewIfNeeded } from '../utils'
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation'
  import { workStore } from '../stores/work-store'
  import UploadStepHeader from '../components/UploadStepHeader.svelte'
  import UploadWorkStep from '../components/UploadWorkStep.svelte'
  import UploadLicensingStep from '../components/UploadLicensingStep.svelte'
  import ConfirmWorkStep from '../components/ConfirmWorkStep.svelte'

  import { authStore } from '$lib'
  import UploadService, { type NamedUpload } from '$lib/upload/upload.service'
  import { createUploadSessionController, startUploadingPhase, type UploadSession } from '$lib/upload/upload-session'
  import BlockchainService from '$lib/upload/blockchain.service'
  import UploadProgressModal from '$lib/components/UploadProgressModal.svelte'
  import { notify, ToastType, ConfirmModal, type TConfirmModalProps } from '@repo/ui-components'
  import { modals, type ModalProps } from 'svelte-modals'
  import { onDestroy, onMount } from 'svelte'
  import { openMarketplaceAndGoToDashboard } from '$lib/helpers/marketplace'
  import { STATUS, type StatusValue } from '../constants/constants'

  let { data } = $props()

  type ExistingContentFile = {
    id: string
    key: string
  }

  let initialPreviewFileIds = $state<string[]>([])

  let currentStep = $state(1)
  const blockchainService = new BlockchainService(authStore.state.accessToken!)
  const uploadService = new UploadService(blockchainService)
  const uploadSessions = createUploadSessionController(workStore)

  onMount(() => {
    initialPreviewFileIds = data.existingPreviewFileIds ?? []
    workStore.hydrateFromContent(data, data.existingFiles, data.existingPreviewUrl)
  })
  onDestroy(() => {
    uploadSessions.invalidate()
    workStore.reset()
  })

  beforeNavigate(() => workStore.setLoading(true))
  afterNavigate(() => workStore.setLoading(false))

  const buildWorkMetadata = (uploadNames: string[]) => {
    const previewImage = $workStore.previewImage
    const previewFileName = previewImage
      ? appendOriginalExtension('preview', previewImage)
      : $workStore.existingPreviewUrl
        ? (data.metadata?.preview_file_name as string | undefined)
        : undefined
    const existingNames = $workStore.existingFiles.works.map((file) => file.name)
    const newNames = $workStore.files.works.map((file, index) => appendOriginalExtension(uploadNames[index], file))
    const filesName = [...existingNames, ...newNames]
    return {
      type: 'works' as const,
      name: $workStore.title,
      contentType: $workStore.contentType,
      description: $workStore.description,
      genre: $workStore.genre,
      authors: $workStore.authors,
      files_name: filesName,
      preview_file_name: previewFileName,
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

  const removeOldPreviewFiles = async (trpcClient: ReturnType<typeof uploadService.createTrpcClient>) => {
    const shouldRemove =
      $workStore.previewImage !== null || ($workStore.existingPreviewUrl === null && initialPreviewFileIds.length > 0)

    if (!shouldRemove) return

    for (const fileId of initialPreviewFileIds) {
      try {
        await trpcClient.contents.removeContentFile.mutate({ fileId })
      } catch (error) {
        console.error(`Failed to remove preview file ${fileId}:`, error)
      }
    }
  }

  const buildWorkPayload = () => {
    const uploadNames = buildUploadNames()

    return {
      keptFileIds: getKeptFileIds(),
      metadata: buildWorkMetadata(uploadNames),
      uploads: buildNamedUploads(uploadNames),
      tags: (data.tags ?? []) as string[],
    }
  }

  const getLicensePrices = () => ({
    oneTimePrice: Number($workStore.licensing.licensePrices['single-use']),
  })

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
    const { keptFileIds, metadata, uploads, tags } = buildWorkPayload()

    startUploadingPhase(uploadSession.setProgress, uploads, false)

    const { keys } = await uploadService.updateContentFiles({
      contentId,
      currentFiles: getCurrentFiles(),
      keptFileIds,
      uploads,
      trpcClient,
      onUploadProgress: uploadSession.setProgress,
    })

    await removeOldPreviewFiles(trpcClient)

    let previewUploadFailed = false
    try {
      await uploadPreviewIfNeeded({
        previewImage: $workStore.previewImage,
        contentId,
        uploadService,
        trpcClient,
      })
    } catch (previewError) {
      previewUploadFailed = true
      console.error('Error uploading preview image:', previewError)
      notify('Preview upload failed.', ToastType.FAIL)
    }

    const metadataToSave =
      previewUploadFailed && $workStore.previewImage
        ? {
            ...metadata,
            preview_file_name: data.metadata?.preview_file_name as string | undefined,
          }
        : metadata

    await uploadService.updateContentMetadata({
      contentId,
      trpcClient,
      metadata: metadataToSave,
      tags,
      tokenId,
      status,
    })

    return { contentId, keys, metadata: metadataToSave, trpcClient, tags }
  }

  const goToFiles = async () => {
    await goto('/authed/files')
    workStore.reset()
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
    const tokenId = await uploadService.mintContent(getLicensePrices())

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

  const openSuccessModal = () => {
    modals.open<ModalProps & TConfirmModalProps>(ConfirmModal, {
      title: 'Congratulations!',
      description:
        "Your creative work has been added to Chapter IP. By completing this step, you've transformed your written work into a secure, licensable digital asset that can be discovered, verified, and managed for future opportunities.",
      submitText: 'Go to Dashboard',
      secondaryText: 'Go to Marketplace',
      onSubmit: async () => {
        await goToFiles()
      },
      onSecondary: () => openMarketplaceAndGoToDashboard(goto, workStore.reset),
      onClose: async () => {
        await goToFiles()
      },
      withBackButton: false,
    })
  }

  const onSubmitClick = async () => {
    await withWorkLoading(
      async (uploadSession) => {
        const savedContent = await saveCurrentContent(uploadSession)
        const tokenId = data.tokenId ?? (await activateContent(uploadSession, savedContent))

        if (data.tokenId) {
          uploadSession.setProgress({ phase: 'updating-prices', overallProgress: 1 })
          await uploadService.updateContentPrices({ tokenId, prices: getLicensePrices() })
        }

        await saveTokenMetadata(uploadSession, { ...savedContent, tokenId })
        uploadSession.end()
        openSuccessModal()
      },
      'Error updating listing:',
      'Failed to update listing.',
    )
  }
</script>

<div class="min-h-xl rounded-3xl p-5 shadow-md md:p-10 bg-[#f8f5f1]">
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

{#if $workStore.ui.uploadProgress}
  <UploadProgressModal progress={$workStore.ui.uploadProgress} />
{/if}
