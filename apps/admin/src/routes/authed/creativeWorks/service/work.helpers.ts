import { goto } from '$app/navigation'
import { authStore } from '$lib'
import UploadService from '$lib/upload/upload.service'
import BlockchainService from '$lib/upload/blockchain.service'
import { createUploadSessionController } from '$lib/upload/upload-session'
import { modals, type ModalProps } from 'svelte-modals'
import { ConfirmModal, type TConfirmModalProps } from '@repo/ui-components'
import { openMarketplaceAndGoToDashboard } from '$lib/helpers/marketplace'
import { workStore } from '../stores/work-store'

export const getLicensePrices = (licensePrices: Record<string, string>) => ({
  oneTimePrice: Number(licensePrices['single-use']),
})

export const goToFiles = async () => {
  await goto('/authed/files')
  workStore.reset()
}

export const openSuccessModal = () => {
  void modals.open<ModalProps & TConfirmModalProps>(ConfirmModal, {
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

export const createWorkUploadServices = () => {
  const blockchainService = new BlockchainService(authStore.state.accessToken!)
  const uploadService = new UploadService(blockchainService)
  const uploadSessions = createUploadSessionController(workStore)
  return { uploadService, uploadSessions }
}
