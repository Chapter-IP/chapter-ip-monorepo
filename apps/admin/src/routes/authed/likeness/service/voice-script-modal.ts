import { modals, type ModalProps } from 'svelte-modals'
import VoiceScriptModal from '../components/VoiceScriptModal.svelte'
import type {
  TVoiceScriptModalProps,
  VoiceScriptData,
  VoiceScriptPlaceholderSegment,
} from '../types/voice-script.types'

export function openVoiceScriptModal() {
  modals.open<ModalProps & TVoiceScriptModalProps>(VoiceScriptModal, {})
}

export function getNumberedLines(data: VoiceScriptData) {
  return data.sections.map((section) => {
    let count = 0
    return section.blocks.map((block) =>
      block.lines.map((line) => {
        count += 1
        return { line, number: count }
      }),
    )
  })
}

export function splitPlaceholders(line: string): VoiceScriptPlaceholderSegment[] {
  return line
    .split(/(\[[^\]]+\])/g)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      dark: part.startsWith('[') && part.endsWith(']'),
    }))
}
