export type VoiceScriptSegment = {
  text: string
  semibold?: boolean
}

export type VoiceScriptBlock = {
  label?: string
  lines: string[]
  paragraphGap?: boolean
}

export type VoiceScriptSection = {
  title: string
  duration?: string
  instruction?: string
  closingInstruction?: string
  numbered?: boolean
  blocks: VoiceScriptBlock[]
}

export type VoiceScriptData = {
  title: string
  intro: VoiceScriptSegment[][]
  beforeYouStart: { label: string; title: string; bullets: string[] }
  sections: VoiceScriptSection[]
  coverageChecklist: { label: string; title: string; items: string[] }
}

export type VoiceScriptPlaceholderSegment = {
  text: string
  dark: boolean
}

export type TVoiceScriptModalProps = {
  close: () => void
  isOpen: boolean
}
