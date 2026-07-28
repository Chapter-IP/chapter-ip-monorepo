<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation'
  import { getHeightTotalInches, getNormalizedWeight, likenessStore } from './stores/likeness-store'
  import UploadStepHeader from './components/UploadStepHeader.svelte'
  import UploadLikenessStep from './components/UploadLikenessStep.svelte'
  import UploadLicensingStep from './components/UploadLicensingStep.svelte'
  import ConfirmLikenessStep from './components/ConfirmLikenessStep.svelte'
  import { authStore } from '$lib'
  import UploadService from '$lib/upload/upload.service'
  import { createUploadSessionController, startUploadingPhase } from '$lib/upload/upload-session'
  import TransactionService from '$lib/upload/transaction.service'
  import BlockchainService from '$lib/upload/blockchain.service'
  import UploadProgressPanel from '$lib/components/UploadProgressPanel.svelte'
  import { notify, ToastType } from '@repo/ui-components'
  import { modals, type ModalProps } from 'svelte-modals'
  import { ConfirmModal, type TConfirmModalProps } from '@repo/ui-components'
  import { onDestroy } from 'svelte'
  import { openMarketplaceAndGoToDashboard } from '$lib/helpers/marketplace'
  import {
    createLikenessFileNames,
    LIKENESS_FILE_BUCKETS,
    type MultipleFileKey,
  } from '$lib/constants/likenessFileBuckets'

  let currentStep = $state(1)
  const blockchainService = new BlockchainService(authStore.state.accessToken!)
  const transactionService = new TransactionService(blockchainService)
  const uploadService = new UploadService(transactionService)
  const uploadSessions = createUploadSessionController(likenessStore)

  beforeNavigate(() => likenessStore.setLoading(true))
  afterNavigate(() => likenessStore.setLoading(false))

  onDestroy(() => {
    uploadSessions.invalidate()
    likenessStore.reset()
  })

  const buildLikenessPayload = () => {
    const uploadsByBucket = LIKENESS_FILE_BUCKETS.reduce(
      (acc, bucket) => {
        const files = $likenessStore.files[bucket]
        const basenames = createLikenessFileNames(bucket, files.length)
        acc[bucket] = files.map((file, index) => {
          const basename = basenames[index]
          const ext = file.name.split('.').pop() || ''
          return ext ? `${basename}.${ext}` : basename
        })
        return acc
      },
      {} as Record<MultipleFileKey, string[]>,
    )
    const uploads = LIKENESS_FILE_BUCKETS.flatMap((bucket) => {
      const files = $likenessStore.files[bucket]
      const basenames = createLikenessFileNames(bucket, files.length)
      return files.map((file, index) => ({
        file,
        name: basenames[index],
      }))
    })
    const heightTotalInches = getHeightTotalInches($likenessStore.profile.attributes)
    const weight = getNormalizedWeight($likenessStore.profile.attributes.weight)
    const metadata = {
      profile: {
        ...$likenessStore.profile,
        attributes: {
          ...$likenessStore.profile.attributes,
          weight,
          ...(heightTotalInches !== undefined && { heightTotalInches }),
        },
      },
      licensing: $likenessStore.licensing,
      uploadsByBucket,
      type: 'likeness',
    }

    return { uploadsByBucket, uploads, metadata }
  }

  const onSaveDraftClick = async () => {
    const uploadSession = uploadSessions.begin()
    try {
      likenessStore.setLoading(true)
      const trpcClient = uploadService.createTrpcClient()
      const { uploads, metadata } = buildLikenessPayload()

      startUploadingPhase(uploadSession.setProgress, uploads.length)

      await uploadService.saveDraftContent({
        trpcClient,
        uploads,
        metadata,
        onUploadProgress: uploadSession.setProgress,
      })
      notify('Draft saved', ToastType.SUCCESS)
      await goto('/authed/files')
      likenessStore.reset()
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
      likenessStore.setLoading(true)
      const trpcClient = uploadService.createTrpcClient()
      const { uploads, metadata } = buildLikenessPayload()

      startUploadingPhase(uploadSession.setProgress, uploads.length)

      const { contentId, keys } = await uploadService.saveDraftContent({
        trpcClient,
        uploads,
        metadata,
        onUploadProgress: uploadSession.setProgress,
      })

      uploadSession.setProgress({ phase: 'minting', overallProgress: 1 })
      const tokenId = await uploadService.mintContent({
        oneTimePrice: $likenessStore.licensing.licenseTypes['single-use']
          ? Number($likenessStore.licensing.licensePrices['single-use'])
          : 0,
        lifetimePrice: $likenessStore.licensing.licenseTypes.perpetual
          ? Number($likenessStore.licensing.licensePrices.perpetual)
          : 0,
      })
      uploadSession.setProgress({ phase: 'finalizing', overallProgress: 1 })
      await uploadService.finalizeContent({ trpcClient, contentId, metadata, tokenId })

      uploadSession.setProgress({ phase: 'saving-metadata', overallProgress: 1 })
      const stagename = $likenessStore.profile.stageName
      await uploadService.saveMetadata({
        tokenId,
        keys,
        title: `${$likenessStore.profile.fullLegalName} ${stagename ? `(${stagename})` : ''}`,
        description: $likenessStore.profile.bio,
        trpcClient,
      })

      modals.open<ModalProps & TConfirmModalProps>(ConfirmModal, {
        title: 'Congratulations!',
        description:
          "Your likeness has been added to Chapter IP. By completing this step, you've transformed your likeness into a secure, licensable digital asset that can be discovered, verified, and managed for future opportunities.",
        submitText: 'Go to Dashboard',
        secondaryText: 'Go to Marketplace',
        onSubmit: async () => {
          await goto(`/authed/files`)
          likenessStore.reset()
        },
        onSecondary: () => openMarketplaceAndGoToDashboard(goto, likenessStore.reset),
        onClose: async () => {
          await goto(`/authed/files`)
          likenessStore.reset()
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
    <UploadLikenessStep bind:currentStep onSaveDraft={onSaveDraftClick} />
  {:else if currentStep === 2}
    <UploadLicensingStep bind:currentStep onSaveDraft={onSaveDraftClick} />
  {:else}
    <ConfirmLikenessStep bind:currentStep onFormSubmit={onSubmitClick} onSaveDraft={onSaveDraftClick} />
  {/if}

  {#if $likenessStore.ui.uploadProgress}
    <div class="mt-6">
      <UploadProgressPanel progress={$likenessStore.ui.uploadProgress} />
    </div>
  {/if}
</div>
