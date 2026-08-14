import { LICENSE_TYPE_OPTIONS, PERMITTED_USE_OPTIONS } from '@repo/content-types/likeness'
import { openVoiceScriptModal } from '../service/voice-script-modal'

export { ETHNICITY_OPTIONS, EYE_COLOR_OPTIONS, HAIR_COLOR_OPTIONS, UNION_OPTIONS } from '@repo/content-types/likeness'
export { STATUS, type StatusValue } from '@repo/content-types/content'

type LicenseTypeOption = {
  id: string
  label: string
  description: string
}

type PermittedUseOption = {
  id: string
  label: string
  description: string
}

const LICENSE_TYPE_DESCRIPTIONS: Record<string, string> = {
  'single-use':
    'One approved use across a single campaign. Buyer cannot reuse the asset for a separate project, extend the run, or sublicense without purchasing a new license.',
  perpetual:
    'Ongoing partnership for buyers who want long-term association with your digital likeness. Priced as a recurring fee. End the license at any time to stop all future use.',
}

const PERMITTED_USE_DESCRIPTIONS: Record<string, string> = {
  ai: 'Use of your likeness as training data for generative AI models. Every model trained on your data is logged on-chain, and you earn royalties on the outputs it produces.',
  digital: 'Web, social, streaming, in-app, and any other screen-based placement that lives online.',
  commercial: 'Advertising, brand campaigns, sponsorships, and any use tied to the sale of a product or service.',
  'film-tv': 'Scripted, unscripted, and documentary productions for theatrical, broadcast, or streaming release.',
}

export const LICENSE_TYPES: LicenseTypeOption[] = LICENSE_TYPE_OPTIONS.map((option) => ({
  id: option.value,
  label: option.label,
  description: LICENSE_TYPE_DESCRIPTIONS[option.value],
}))

export const PERMITTED_USES: PermittedUseOption[] = PERMITTED_USE_OPTIONS.map((option) => ({
  id: option.value,
  label: option.label,
  description: PERMITTED_USE_DESCRIPTIONS[option.value],
}))

export const TERRITORIES = [
  'Select all',
  'Africa',
  'Asia',
  'Australia',
  'Europe',
  'North America',
  'South America',
  'United States only',
]

type MediaUploadGuideline = {
  label: string
  description: string
  fileKey: 'headshots' | 'bodyShots' | 'voiceSamples' | 'videoReels'
  mediaKind: 'image' | 'audio' | 'video'
  required: boolean
  header: string
  headerLink?: { text: string; onClick: () => void }
}

export const MEDIA_UPLOAD_GUIDELINES: MediaUploadGuideline[] = [
  {
    label: 'Headshots',
    description:
      'Clear, recent photos of your face — front-on and profile, in good lighting. No filters, heavy makeup looks, sunglasses, or other people in frame.',
    fileKey: 'headshots',
    mediaKind: 'image',
    required: true,
    header: 'Uploading Headshots and Body Shots',
  },
  {
    label: 'Full Body Shots',
    description:
      'Full-length shots in normal, everyday clothing that show your natural build and posture. A plain background and a front, side, and back angle work best.',
    fileKey: 'bodyShots',
    mediaKind: 'image',
    required: false,
    header: '',
  },
  {
    label: 'Voice Samples',
    description:
      'Your natural speaking voice, recorded in a quiet room — no music, echo, or other voices. For the best profile, read our 10-minute recording script.',
    fileKey: 'voiceSamples',
    mediaKind: 'audio',
    required: false,
    header: 'Uploading Voice Samples',
    headerLink: { text: 'Open ChapterIP voice script', onClick: openVoiceScriptModal },
  },
  {
    label: 'Video reels',
    description:
      'Short, well-lit clips of you speaking and moving on camera — 30 seconds to a few minutes, with only you in frame. Interviews, self-tapes, and casual phone footage all work.',
    fileKey: 'videoReels',
    mediaKind: 'video',
    required: false,
    header: 'Uploading Video Reels',
  },
]
