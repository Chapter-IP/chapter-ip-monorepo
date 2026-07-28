<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation'
  import { locationStore } from './stores/location-store'
  import UploadStepHeader from './components/UploadStepHeader.svelte'
  import UploadLocationStep from './components/UploadLocationStep.svelte'
  import UploadLicensingStep from './components/UploadLicensingStep.svelte'
  import ConfirmLocationStep from './components/ConfirmLocationStep.svelte'
  import { authStore } from '$lib'
  import UploadService from '$lib/upload/upload.service'
  import { createUploadSessionController, startUploadingPhase } from '$lib/upload/upload-session'
  import TransactionService from '$lib/upload/transaction.service'
  import BlockchainService from '$lib/upload/blockchain.service'
  import UploadProgressPanel from '$lib/components/UploadProgressPanel.svelte'
  import { notify, ToastType } from '@repo/ui-components'
  import { modals, type ModalProps } from 'svelte-modals'
  import { ConfirmModal, type TConfirmModalProps } from '@repo/ui-components'
  import { createLocationFileNames } from '$lib/constants/locationFileBuckets'
  import { appendOriginalExtension, uploadPreviewIfNeeded } from './utils'
  import { onDestroy } from 'svelte'

  let currentStep = $state(1)
  const blockchainService = new BlockchainService(authStore.state.accessToken!)
  const transactionService = new TransactionService(blockchainService)
  const uploadService = new UploadService(transactionService)
  const uploadSessions = createUploadSessionController(locationStore)

  beforeNavigate(() => locationStore.setLoading(true))
  afterNavigate(() => locationStore.setLoading(false))

  onDestroy(() => {
    uploadSessions.invalidate()
    locationStore.reset()
  })

  const buildLocationPayload = () => {
    const uploadNames = createLocationFileNames('locations', $locationStore.files.locations.length)
    const uploads = $locationStore.files.locations.map((file, index) => ({
      file,
      name: uploadNames[index],
    }))
    const { licenseTypes, licensePrices, agreedToFee } = $locationStore.licensing
    const { street, apt, city, state, zip } = $locationStore.address
    const address = street || city || state || zip ? { street, apt, city, state, zip } : undefined
    const filesName = $locationStore.files.locations.map((file, index) =>
      appendOriginalExtension(uploadNames[index], file),
    )
    const previewImage = $locationStore.previewImage
    const previewFileName = previewImage ? appendOriginalExtension('preview', previewImage) : undefined
    const metadata: Record<string, unknown> = {
      type: 'location' as const,
      name: $locationStore.name,
      description: $locationStore.description,
      files_name: filesName,
      preview_file_name: previewFileName,
      licensing: { licenseTypes, licensePrices, agreedToFee },
      ...(address && { address }),
    }

    return { uploads, metadata, tags: $locationStore.tags }
  }

  const onSaveDraftClick = async () => {
    const uploadSession = uploadSessions.begin()
    try {
      locationStore.setLoading(true)
      const trpcClient = uploadService.createTrpcClient()
      const { uploads, metadata, tags } = buildLocationPayload()

      startUploadingPhase(uploadSession.setProgress, uploads.length)

      const { contentId } = await uploadService.saveDraftContent({
        trpcClient,
        uploads,
        metadata,
        tags,
        withWatermark: false,
        onUploadProgress: uploadSession.setProgress,
      })

      try {
        await uploadPreviewIfNeeded({
          previewImage: $locationStore.previewImage,
          contentId,
          uploadService,
          trpcClient,
        })
      } catch (previewError) {
        console.error('Error uploading preview image:', previewError)
        notify('Draft saved, but preview upload failed.', ToastType.FAIL)
      }

      notify('Draft saved', ToastType.SUCCESS)
      await goto('/authed/files')
      locationStore.reset()
    } catch (error) {
      console.error('Error saving draft:', error)
      notify('Failed to save draft.', ToastType.FAIL)
    } finally {
      uploadSession.end()
    }
  }

  const onSubmitClick = async () => {
    const uploadSession = uploadSessions.begin()
    try {
      locationStore.setLoading(true)
      const trpcClient = uploadService.createTrpcClient()
      const { uploads, metadata, tags } = buildLocationPayload()

      startUploadingPhase(uploadSession.setProgress, uploads.length)

      const { contentId, keys } = await uploadService.saveDraftContent({
        trpcClient,
        uploads,
        metadata,
        tags,
        withWatermark: false,
        onUploadProgress: uploadSession.setProgress,
      })

      try {
        await uploadPreviewIfNeeded({
          previewImage: $locationStore.previewImage,
          contentId,
          uploadService,
          trpcClient,
        })
      } catch (previewError) {
        console.error('Error uploading preview image:', previewError)
        notify('Preview upload failed.', ToastType.FAIL)
      }

      uploadSession.setProgress({ phase: 'minting', overallProgress: 1 })
      const tokenId = await uploadService.mintContent({
        oneTimePrice: Number($locationStore.licensing.licensePrices['single-use']),
      })
      uploadSession.setProgress({ phase: 'finalizing', overallProgress: 1 })
      await uploadService.finalizeContent({ trpcClient, contentId, metadata, tokenId, tags })

      uploadSession.setProgress({ phase: 'saving-metadata', overallProgress: 1 })
      await uploadService.saveMetadata({
        tokenId,
        keys,
        title: $locationStore.name,
        description: $locationStore.description,
        trpcClient,
      })

      modals.open<ModalProps & TConfirmModalProps>(ConfirmModal, {
        title: 'Congratulations!',
        description:
          "Your location has been added to Chapter IP. By completing this step, you've transformed your location into a secure, licensable digital asset that can be discovered, verified, and managed for future opportunities.",
        submitText: 'Go to Dashboard',
        onSubmit: async () => {
          await goto('/authed/files')
          locationStore.reset()
        },
        onClose: async () => {
          await goto('/authed/files')
          locationStore.reset()
        },
        withBackButton: false,
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      let errorMessage = 'Failed to upload file.'
      if (error instanceof Error && error.message.includes('duplicate key error')) {
        errorMessage = errorMessage + ' This file already exists.'
      }
      notify(errorMessage, ToastType.FAIL)
    } finally {
      uploadSession.end()
    }
  }
</script>

<div class="min-h-xl rounded-3xl p-5 shadow-md md:p-10 bg-[#f8f5f1]">
  <UploadStepHeader {currentStep} />

  {#if currentStep === 1}
    <UploadLocationStep bind:currentStep onSaveDraft={onSaveDraftClick} />
  {:else if currentStep === 2}
    <UploadLicensingStep bind:currentStep onSaveDraft={onSaveDraftClick} />
  {:else}
    <ConfirmLocationStep bind:currentStep onFormSubmit={onSubmitClick} onSaveDraft={onSaveDraftClick} />
  {/if}

  {#if $locationStore.ui.uploadProgress}
    <div class="mt-6">
      <UploadProgressPanel progress={$locationStore.ui.uploadProgress} />
    </div>
  {/if}
</div>
