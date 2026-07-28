<script lang="ts">
  import {
    createLikenessFileNames,
    LIKENESS_FILE_BUCKETS,
    type MultipleFileKey,
  } from '$lib/constants/likenessFileBuckets'
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation'
  import { getHeightTotalInches, getNormalizedWeight, isPreviewBucket, likenessStore } from '../stores/likeness-store'
  import UploadStepHeader from '../components/UploadStepHeader.svelte'
  import UploadLikenessStep from '../components/UploadLikenessStep.svelte'
  import UploadLicensingStep from '../components/UploadLicensingStep.svelte'
  import ConfirmLikenessStep from '../components/ConfirmLikenessStep.svelte'

  import { authStore } from '$lib'
  import UploadService, { type NamedUpload } from '$lib/upload/upload.service'
  import { createUploadSessionController, startUploadingPhase, type UploadSession } from '$lib/upload/upload-session'
  import TransactionService from '$lib/upload/transaction.service'
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
    bucket?: string
  }

  let currentStep = $state(1)
  const blockchainService = new BlockchainService(authStore.state.accessToken!)
  const transactionService = new TransactionService(blockchainService)
  const uploadService = new UploadService(transactionService)
  const uploadSessions = createUploadSessionController(likenessStore)

  onMount(() => likenessStore.hydrateFromContent(data, data.existingFiles))
  onDestroy(() => {
    uploadSessions.invalidate()
    likenessStore.reset()
  })

  beforeNavigate(() => likenessStore.setLoading(true))
  afterNavigate(() => likenessStore.setLoading(false))

  const buildLikenessMetadata = (uploadsByBucket: Record<MultipleFileKey, string[]>) => {
    const heightTotalInches = getHeightTotalInches($likenessStore.profile.attributes)
    const weight = getNormalizedWeight($likenessStore.profile.attributes.weight)

    return {
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
  }

  const buildUploadsByBucket = () =>
    Object.fromEntries(
      LIKENESS_FILE_BUCKETS.map((bucket) => {
        const existingNames = $likenessStore.existingFiles[bucket].map((file) => file.name)
        const newBasenames = createLikenessFileNames(bucket, $likenessStore.files[bucket].length, existingNames)
        const newNamesWithExt = $likenessStore.files[bucket].map((file, index) => {
          const basename = newBasenames[index]
          const ext = file.name.split('.').pop() || ''
          return ext ? `${basename}.${ext}` : basename
        })

        return [bucket, [...existingNames, ...newNamesWithExt]]
      }),
    ) as Record<MultipleFileKey, string[]>

  const buildNamedUploads = (): NamedUpload[] =>
    LIKENESS_FILE_BUCKETS.flatMap((bucket) => {
      const existingNames = $likenessStore.existingFiles[bucket].map((file) => file.name)
      const newBasenames = createLikenessFileNames(bucket, $likenessStore.files[bucket].length, existingNames)

      return $likenessStore.files[bucket].map((file, index) => ({
        file,
        name: newBasenames[index],
      }))
    })

  const getKeptFileIds = () =>
    new Set(LIKENESS_FILE_BUCKETS.flatMap((bucket) => $likenessStore.existingFiles[bucket].map((file) => file.id)))

  const getCurrentFiles = () =>
    ((data.files ?? []) as ExistingContentFile[]).filter((file) => !file.bucket || !isPreviewBucket(file.bucket))

  const buildLikenessPayload = () => {
    const uploadsByBucket = buildUploadsByBucket()

    return {
      keptFileIds: getKeptFileIds(),
      metadata: buildLikenessMetadata(uploadsByBucket),
      uploads: buildNamedUploads(),
    }
  }

  const getLicensePrices = () => ({
    oneTimePrice: $likenessStore.licensing.licenseTypes['single-use']
      ? Number($likenessStore.licensing.licensePrices['single-use'])
      : 0,
    lifetimePrice: $likenessStore.licensing.licenseTypes.perpetual
      ? Number($likenessStore.licensing.licensePrices.perpetual)
      : 0,
  })

  const buildTokenMetadata = (keys: string[]) => {
    const stagename = $likenessStore.profile.stageName

    return {
      keys,
      title: `${$likenessStore.profile.fullLegalName} ${stagename ? `(${stagename})` : ''}`,
      description: $likenessStore.profile.bio,
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
    const { keptFileIds, metadata, uploads } = buildLikenessPayload()

    startUploadingPhase(uploadSession.setProgress, uploads, false)

    const { keys } = await uploadService.updateContentFiles({
      contentId,
      currentFiles: getCurrentFiles(),
      keptFileIds,
      uploads,
      trpcClient,
      includePreviews: true,
      onUploadProgress: uploadSession.setProgress,
    })

    await uploadService.updateContentMetadata({
      contentId,
      trpcClient,
      metadata,
      tokenId,
      status,
    })

    return { contentId, keys, metadata, trpcClient }
  }

  const goToFiles = async () => {
    await goto('/authed/files')
    likenessStore.reset()
  }

  const withLikenessLoading = async (
    action: (uploadSession: UploadSession) => Promise<void>,
    logMessage: string,
    userMessage: string,
  ) => {
    const uploadSession = uploadSessions.begin()
    try {
      likenessStore.setLoading(true)
      await action(uploadSession)
    } catch (error) {
      console.error(logMessage, error)
      notify(userMessage, ToastType.FAIL)
    } finally {
      uploadSession.end()
    }
  }

  const onSaveDraftClick = async () => {
    await withLikenessLoading(
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
    { contentId, metadata, trpcClient }: Awaited<ReturnType<typeof saveCurrentContent>>,
  ) => {
    uploadSession.setProgress({ phase: 'minting', overallProgress: 1 })
    const tokenId = await uploadService.mintContent(getLicensePrices())

    uploadSession.setProgress({ phase: 'finalizing', overallProgress: 1 })
    await uploadService.finalizeContent({
      contentId,
      metadata,
      tokenId,
      trpcClient,
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
        "Your likeness has been added to Chapter IP. By completing this step, you've transformed your likeness into a secure, licensable digital asset that can be discovered, verified, and managed for future opportunities.",
      submitText: 'Go to Dashboard',
      secondaryText: 'Go to Marketplace',
      onSubmit: async () => {
        await goToFiles()
      },
      onSecondary: () => openMarketplaceAndGoToDashboard(goto, likenessStore.reset),
      onClose: async () => {
        await goToFiles()
      },
      withBackButton: false,
    })
  }

  const onSubmitClick = async () => {
    await withLikenessLoading(
      async (uploadSession) => {
        const savedContent = await saveCurrentContent(uploadSession)
        const tokenId = data.tokenId ?? (await activateContent(uploadSession, savedContent))

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
    <UploadLikenessStep bind:currentStep onSaveDraft={!data.tokenId ? onSaveDraftClick : undefined} />
  {:else if currentStep === 2}
    <UploadLicensingStep bind:currentStep onSaveDraft={!data.tokenId ? onSaveDraftClick : undefined} />
  {:else}
    <ConfirmLikenessStep
      bind:currentStep
      onFormSubmit={onSubmitClick}
      onSaveDraft={!data.tokenId ? onSaveDraftClick : undefined}
    />
  {/if}
</div>

{#if $likenessStore.ui.uploadProgress}
  <UploadProgressModal progress={$likenessStore.ui.uploadProgress} />
{/if}
