import type { VoiceScriptData, VoiceScriptPlaceholderSegment } from '../types/voice-script.types'
import { voiceScript } from './voice-script'

export function getNumberedLines(data: VoiceScriptData) {
  return data.sections.map((section) => {
    let count = 0
    return section.blocks.map((block) =>
      block.lines.map(() => {
        count += 1
        return count
      }),
    )
  })
}

export function buildScriptText(): string {
  const lines: string[] = []
  const numberedLines = getNumberedLines(voiceScript)
  lines.push(voiceScript.title)
  lines.push('')
  for (const paragraph of voiceScript.intro) lines.push(paragraph.map((segment) => segment.text).join(''))
  lines.push('')
  lines.push(`${voiceScript.beforeYouStart.title} — ${voiceScript.beforeYouStart.label}`)
  for (const bullet of voiceScript.beforeYouStart.bullets) lines.push(`• ${bullet}`)
  lines.push('')
  for (const [si, section] of voiceScript.sections.entries()) {
    lines.push(section.title + (section.duration ? ` — ${section.duration}` : ''))
    if (section.instruction) lines.push(section.instruction)
    for (const [bi, block] of section.blocks.entries()) {
      if (block.label) lines.push(block.label)
      const blockLines = block.lines.map((line, li) =>
        section.numbered ? `${numberedLines[si][bi][li]}. ${line}` : line,
      )
      lines.push(blockLines.join(block.paragraphGap ? '\n\n\n' : '\n'))
    }
    if (section.closingInstruction) lines.push(section.closingInstruction)
    lines.push('')
  }
  lines.push(`${voiceScript.coverageChecklist.title} — ${voiceScript.coverageChecklist.label}`)
  for (const item of voiceScript.coverageChecklist.items) lines.push(`• ${item}`)
  return lines.join('\n')
}

export function downloadVoiceScript() {
  const blob = new Blob([buildScriptText()], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'chapter-ip-voice-script.txt'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 0)
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
