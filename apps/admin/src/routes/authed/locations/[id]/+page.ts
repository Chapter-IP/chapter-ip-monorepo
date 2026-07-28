import { authStore } from '$lib'
import { createClient } from '@repo/trpc/client'
import { loadExistingFiles } from '../stores/location-store'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ params, parent }) => {
  await parent()
  const trpcClient = createClient({
    trpcUrl: import.meta.env.VITE_TRPC_URL || 'http://localhost:8060/trpc',
    getAccessTokenFn: () => authStore.state.accessToken!,
  })
  const content = await trpcClient.contents.getContentById.query({
    id: params.id,
  })
  const {
    files: existingFiles,
    allFiles: allExistingFiles,
    previewUrl: existingPreviewUrl,
    previewFileIds: existingPreviewFileIds,
  } = await loadExistingFiles(content, trpcClient)

  return { ...content, existingFiles, allExistingFiles, existingPreviewUrl, existingPreviewFileIds }
}
