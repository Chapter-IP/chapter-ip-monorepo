<script lang="ts">
  import { LOCATION_FILE_BUCKETS, createLocationFileNames } from '$lib/constants/locationFileBuckets'
  import { appendOriginalExtension, uploadPreviewIfNeeded } from '$lib/helpers/work-upload'
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation'
  import { locationStore } from '../stores/location-store'
  import UploadStepHeader from '../components/UploadStepHeader.svelte'
  import UploadLocationStep from '../components/UploadLocationStep.svelte'
  import UploadLicensingStep from '../components/UploadLicensingStep.svelte'
  import ConfirmLocationStep from '../components/ConfirmLocationStep.svelte'

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
  const uploadSessions = createUploadSessionController(locationStore)

  onMount(() => {
    initialPreviewFileIds = data.existingPreviewFileIds ?? []
    locationStore.hydrateFromContent(data, data.existingFiles, data.existingPreviewUrl)
  })
  onDestroy(() => {
    uploadSessions.invalidate()
    locationStore.reset()
  })

  beforeNavigate(() => locationStore.setLoading(true))
  afterNavigate(() => locationStore.setLoading(false))

  const buildLocationMetadata = (uploadNames: string[]) => {
    const { street, apt, city, state, zip } = $locationStore.address
    const address = street || city || state || zip ? { street, apt, city, state, zip } : undefined
    const previewImage = $locationStore.previewImage
    const previewFileName = previewImage
      ? appendOriginalExtension('preview', previewImage)
      : $locationStore.existingPreviewUrl
        ? (data.metadata?.preview_file_name as string | undefined)
        : undefined
    const existingNames = $locationStore.existingFiles.locations.map((file) => file.name)
    const newNames = $locationStore.files.locations.map((file, index) =>
      appendOriginalExtension(uploadNames[index], file),
    )
    const filesName = [...existingNames, ...newNames]
    return {
      type: 'location' as const,
      name: $locationStore.name,
      description: $locationStore.description,
      files_name: filesName,
      preview_file_name: previewFileName,
      licensing: $locationStore.licensing,
      ...(address && { address }),
    }
  }

  const buildUploadNames = () => {
    const existingNames = $locationStore.existingFiles.locations.map((file) => file.name)
    return createLocationFileNames('locations', $locationStore.files.locations.length, existingNames)
  }

  const buildNamedUploads = (uploadNames: string[]): NamedUpload[] => {
    return $locationStore.files.locations.map((file, index) => ({
      file,
      name: uploadNames[index],
    }))
  }

  const getKeptFileIds = () =>
    new Set(LOCATION_FILE_BUCKETS.flatMap((bucket) => $locationStore.existingFiles[bucket].map((file) => file.id)))

  const getCurrentFiles = () =>
    (data.allExistingFiles?.locations ?? data.existingFiles?.locations ?? data.files ?? []) as ExistingContentFile[]

  const removeOldPreviewFiles = async (trpcClient: ReturnType<typeof uploadService.createTrpcClient>) => {
    const shouldRemove =
      $locationStore.previewImage !== null ||
      ($locationStore.existingPreviewUrl === null && initialPreviewFileIds.length > 0)

    if (!shouldRemove) return

    for (const fileId of initialPreviewFileIds) {
      try {
        await trpcClient.contents.removeContentFile.mutate({ fileId })
      } catch (error) {
        console.error(`Failed to remove preview file ${fileId}:`, error)
      }
    }
  }

  const buildLocationPayload = () => {
    const uploadNames = buildUploadNames()

    return {
      keptFileIds: getKeptFileIds(),
      metadata: buildLocationMetadata(uploadNames),
      uploads: buildNamedUploads(uploadNames),
      tags: $locationStore.tags,
    }
  }

  const getLicensePrices = () => ({
    oneTimePrice: Number($locationStore.licensing.licensePrices['single-use']),
  })

  const buildTokenMetadata = (keys: string[]) => {
    return {
      keys,
      title: $locationStore.name,
      description: $locationStore.description,
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
    const { keptFileIds, metadata, uploads, tags } = buildLocationPayload()

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
        previewImage: $locationStore.previewImage,
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
      previewUploadFailed && $locationStore.previewImage
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
    locationStore.reset()
  }

  const withLocationLoading = async (
    action: (uploadSession: UploadSession) => Promise<void>,
    logMessage: string,
    userMessage: string,
  ) => {
    const uploadSession = uploadSessions.begin()
    try {
      locationStore.setLoading(true)
      await action(uploadSession)
    } catch (error) {
      console.error(logMessage, error)
      notify(userMessage, ToastType.FAIL)
    } finally {
      uploadSession.end()
    }
  }

  const onSaveDraftClick = async () => {
    await withLocationLoading(
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
        "Your location has been added to Chapter IP. By completing this step, you've transformed your location into a secure, licensable digital asset that can be discovered, verified, and managed for future opportunities.",
      submitText: 'Go to Dashboard',
      secondaryText: 'Go to Marketplace',
      onSubmit: async () => {
        await goToFiles()
      },
      onSecondary: () => openMarketplaceAndGoToDashboard(goto, locationStore.reset),
      onClose: async () => {
        await goToFiles()
      },
      withBackButton: false,
    })
  }

  const onSubmitClick = async () => {
    await withLocationLoading(
      async (uploadSession) => {
        const savedContent = await saveCurrentContent(uploadSession)
        const tokenId = data.tokenId ?? (await activateContent(uploadSession, savedContent))

        if (data.tokenId) {
          uploadSession.setProgress({ phase: 'updating-prices', overallProgress: 1 })
          await uploadService.updateContentPrices({ tokenId, prices: getLicensePrices() })
        }

        await saveTokenMetadata(uploadSession, { ...savedContent, tokenId })
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
    <UploadLocationStep bind:currentStep onSaveDraft={!data.tokenId ? onSaveDraftClick : undefined} />
  {:else if currentStep === 2}
    <UploadLicensingStep bind:currentStep onSaveDraft={!data.tokenId ? onSaveDraftClick : undefined} />
  {:else}
    <ConfirmLocationStep
      bind:currentStep
      onFormSubmit={onSubmitClick}
      onSaveDraft={!data.tokenId ? onSaveDraftClick : undefined}
    />
  {/if}
</div>

{#if $locationStore.ui.uploadProgress}
  <UploadProgressModal progress={$locationStore.ui.uploadProgress} />
{/if}
