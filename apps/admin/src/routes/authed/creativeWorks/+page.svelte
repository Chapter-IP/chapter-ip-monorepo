<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation'
  import { workStore } from './stores/work-store'
  import UploadStepHeader from './components/UploadStepHeader.svelte'
  import UploadWorkStep from './components/UploadWorkStep.svelte'
  import UploadLicensingStep from './components/UploadLicensingStep.svelte'
  import ConfirmWorkStep from './components/ConfirmWorkStep.svelte'
  import { authStore } from '$lib'
  import UploadService from '$lib/upload/upload.service'
  import { createUploadSessionController, startUploadingPhase } from '$lib/upload/upload-session'
  import BlockchainService from '$lib/upload/blockchain.service'
  import UploadProgressModal from '$lib/components/UploadProgressModal.svelte'
  import { notify, ToastType } from '@repo/ui-components'
  import { modals, type ModalProps } from 'svelte-modals'
  import { ConfirmModal, type TConfirmModalProps } from '@repo/ui-components'
  import { createWorkFileNames } from '$lib/constants/workFileBuckets'
  import { openMarketplaceAndGoToDashboard } from '$lib/helpers/marketplace'
  import { appendOriginalExtension, uploadPreviewIfNeeded } from './utils'
  import { onDestroy } from 'svelte'

  let currentStep = $state(1)
  const blockchainService = new BlockchainService(authStore.state.accessToken!)
  const uploadService = new UploadService(blockchainService)
  const uploadSessions = createUploadSessionController(workStore)

  beforeNavigate(() => workStore.setLoading(true))
  afterNavigate(() => workStore.setLoading(false))

  onDestroy(() => {
    uploadSessions.invalidate()
    workStore.reset()
  })

  const buildWorkPayload = () => {
    const uploadNames = createWorkFileNames('works', $workStore.files.works.length)
    const uploads = $workStore.files.works.map((file, index) => ({
      file,
      name: uploadNames[index],
    }))
    const { licenseTypes, licensePrices, agreedToFee } = $workStore.licensing
    const filesName = $workStore.files.works.map((file, index) => appendOriginalExtension(uploadNames[index], file))
    const previewImage = $workStore.previewImage
    const previewFileName = previewImage ? appendOriginalExtension('preview', previewImage) : undefined
    const metadata: Record<string, unknown> = {
      type: 'works' as const,
      title: $workStore.title,
      contentType: $workStore.contentType,
      description: $workStore.description,
      genre: $workStore.genre,
      authors: $workStore.authors,
      files_name: filesName,
      preview_file_name: previewFileName,
      licensing: { licenseTypes, licensePrices, agreedToFee },
    }

    return { uploads, metadata, tags: [] as string[] }
  }

  const onSaveDraftClick = async () => {
    const uploadSession = uploadSessions.begin()
    try {
      workStore.setLoading(true)
      const trpcClient = uploadService.createTrpcClient()
      const { uploads, metadata, tags } = buildWorkPayload()

      startUploadingPhase(uploadSession.setProgress, uploads)

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
          previewImage: $workStore.previewImage,
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
      workStore.reset()
    } catch (error) {
      console.error('Error saving draft:', error)
      notify('Failed to save draft.', ToastType.FAIL)
    } finally {
      uploadSession.end()
    }
  }

  const getLicensePrices = () => ({
    oneTimePrice: Number($workStore.licensing.licensePrices['single-use']),
  })

  const onSubmitClick = async () => {
    const uploadSession = uploadSessions.begin()
    try {
      workStore.setLoading(true)
      const trpcClient = uploadService.createTrpcClient()
      const { uploads, metadata, tags } = buildWorkPayload()

      startUploadingPhase(uploadSession.setProgress, uploads)

      const { contentId, keys } = await uploadService.saveDraftContent({
        trpcClient,
        uploads,
        metadata,
        tags,
        withWatermark: false,
        onUploadProgress: uploadSession.setProgress,
      })

      await uploadPreviewIfNeeded({
        previewImage: $workStore.previewImage,
        contentId,
        uploadService,
        trpcClient,
      })

      uploadSession.setProgress({ phase: 'minting', overallProgress: 1 })
      const tokenId = await uploadService.mintContent(getLicensePrices())
      uploadSession.setProgress({ phase: 'finalizing', overallProgress: 1 })
      await uploadService.finalizeContent({ trpcClient, contentId, metadata, tokenId, tags })

      uploadSession.setProgress({ phase: 'saving-metadata', overallProgress: 1 })
      await uploadService.saveMetadata({
        tokenId,
        keys,
        title: $workStore.title,
        description: $workStore.description,
        trpcClient,
      })

      uploadSession.end()

      modals.open<ModalProps & TConfirmModalProps>(ConfirmModal, {
        title: 'Congratulations!',
        description:
          "Your creative work has been added to Chapter IP. By completing this step, you've transformed your written work into a secure, licensable digital asset that can be discovered, verified, and managed for future opportunities.",
        submitText: 'Go to Dashboard',
        secondaryText: 'Go to Marketplace',
        onSubmit: async () => {
          await goto('/authed/files')
          workStore.reset()
        },
        onSecondary: () => openMarketplaceAndGoToDashboard(goto, workStore.reset),
        onClose: async () => {
          await goto('/authed/files')
          workStore.reset()
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
    <UploadWorkStep bind:currentStep onSaveDraft={onSaveDraftClick} />
  {:else if currentStep === 2}
    <UploadLicensingStep bind:currentStep onSaveDraft={onSaveDraftClick} />
  {:else}
    <ConfirmWorkStep bind:currentStep onFormSubmit={onSubmitClick} onSaveDraft={onSaveDraftClick} />
  {/if}
</div>

{#if $workStore.ui.uploadProgress}
  <UploadProgressModal progress={$workStore.ui.uploadProgress} />
{/if}
