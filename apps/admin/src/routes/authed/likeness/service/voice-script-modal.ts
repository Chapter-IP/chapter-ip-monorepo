import { modals, type ModalProps } from 'svelte-modals'
import VoiceScriptModal from '../components/VoiceScriptModal.svelte'
import type { TVoiceScriptModalProps } from '../types/voice-script.types'

export function openVoiceScriptModal() {
  void modals.open<ModalProps & TVoiceScriptModalProps>(VoiceScriptModal, {})
}
