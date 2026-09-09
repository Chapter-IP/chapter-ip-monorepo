<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation'
  import { workStore } from './stores/work-store'
  import UploadStepHeader from './components/UploadStepHeader.svelte'
  import UploadWorkStep from './components/UploadWorkStep.svelte'
  import UploadLicensingStep from './components/UploadLicensingStep.svelte'
  import ConfirmWorkStep from './components/ConfirmWorkStep.svelte'
  import { startUploadingPhase } from '$lib/upload/upload-session'
  import UploadProgressModal from '$lib/components/UploadProgressModal.svelte'
  import { notify, ToastType } from '@repo/ui-components'
  import { createWorkFileNames } from '$lib/constants/workFileBuckets'
  import { appendOriginalExtension } from '$lib/helpers/work-upload'
  import { createWorkUploadServices, getLicensePrices, goToFiles, openSuccessModal } from './service/work.helpers'
  import { onDestroy } from 'svelte'
  import { getWorkSampleSource, syncWorkSample } from './service/work-previews'

  let currentStep = $state(1)
  const { uploadService, uploadSessions } = createWorkUploadServices()

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
    const sampleSource = getWorkSampleSource($workStore)
    const filesName = $workStore.files.works.map((file, index) => appendOriginalExtension(uploadNames[index], file))
    const metadata: Record<string, unknown> = {
      type: 'works' as const,
      name: $workStore.title,
      contentType: $workStore.contentType,
      description: $workStore.description,
      genre: $workStore.genre,
      authors: $workStore.authors,
      sample_text: $workStore.sampleText || undefined,
      files_name: filesName,
      sample_file_name: '',
      preview_files_name: [],
      licensing: $workStore.licensing,
    }

    return { uploads, sampleSource, metadata, tags: [] as string[] }
  }

  const onSaveDraftClick = async () => {
    const uploadSession = uploadSessions.begin()
    try {
      workStore.setLoading(true)
      const trpcClient = uploadService.createTrpcClient()
      const { uploads, sampleSource, metadata, tags } = buildWorkPayload()

      startUploadingPhase(uploadSession.setProgress, uploads)

      const { contentId } = await uploadService.saveDraftContent({
        trpcClient,
        uploads,
        metadata,
        tags,
        withWatermark: false,
        onUploadProgress: uploadSession.setProgress,
      })

      const sampleNames = await syncWorkSample({
        uploadService,
        trpcClient,
        contentId,
        source: sampleSource,
      })
      metadata.sample_file_name = sampleNames[0] ?? ''
      metadata.preview_files_name = sampleNames
      await uploadService.updateContentMetadata({ trpcClient, contentId, metadata, tags })

      notify('Draft saved', ToastType.SUCCESS)
      await goToFiles()
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
      workStore.setLoading(true)
      const trpcClient = uploadService.createTrpcClient()
      const { uploads, sampleSource, metadata, tags } = buildWorkPayload()

      startUploadingPhase(uploadSession.setProgress, uploads)

      const { contentId, keys } = await uploadService.saveDraftContent({
        trpcClient,
        uploads,
        metadata,
        tags,
        withWatermark: false,
        onUploadProgress: uploadSession.setProgress,
      })

      const sampleNames = await syncWorkSample({
        uploadService,
        trpcClient,
        contentId,
        source: sampleSource,
      })
      metadata.sample_file_name = sampleNames[0] ?? ''
      metadata.preview_files_name = sampleNames
      await uploadService.updateContentMetadata({ trpcClient, contentId, metadata, tags })

      uploadSession.setProgress({ phase: 'minting', overallProgress: 1 })
      const tokenId = await uploadService.mintContent(getLicensePrices($workStore.licensing))
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

      openSuccessModal()
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

<div class="min-h-screen rounded-3xl p-5 shadow-md md:p-12.5 bg-[#f8f5f1]">
  <div class="max-w-250">
    <UploadStepHeader {currentStep} />

    {#if currentStep === 1}
      <UploadWorkStep bind:currentStep onSaveDraft={onSaveDraftClick} />
    {:else if currentStep === 2}
      <UploadLicensingStep bind:currentStep onSaveDraft={onSaveDraftClick} />
    {:else}
      <ConfirmWorkStep bind:currentStep onFormSubmit={onSubmitClick} onSaveDraft={onSaveDraftClick} />
    {/if}
  </div>
</div>

{#if $workStore.ui.uploadProgress}
  <UploadProgressModal progress={$workStore.ui.uploadProgress} />
{/if}
