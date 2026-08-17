import { expect, test } from 'vitest'
import { buildScriptText } from './voice-script-helpers'
import { voiceScript } from './voice-script'

test('buildScriptText exports the whole script', () => {
  const text = buildScriptText()

  expect(text.startsWith(voiceScript.title)).toBe(true)
  for (const bullet of voiceScript.beforeYouStart.bullets) expect(text).toContain(bullet)
  for (const section of voiceScript.sections) {
    expect(text).toContain(section.title)
    for (const block of section.blocks) {
      for (const line of block.lines) expect(text).toContain(line)
    }
  }
  for (const item of voiceScript.coverageChecklist.items) expect(text).toContain(item)
})

test('buildScriptText numbers a numbered section continuously across its blocks', () => {
  const text = buildScriptText()
  const section = voiceScript.sections.find((candidate) => candidate.numbered)

  expect(section).toBeDefined()

  let number = 0
  for (const block of section!.blocks) {
    for (const line of block.lines) {
      number += 1
      expect(text).toContain(`${number}. ${line}`)
    }
  }
  expect(number).toBeGreaterThan(section!.blocks[0].lines.length)
})

test('buildScriptText leaves non-numbered sections unprefixed', () => {
  const text = buildScriptText()
  const section = voiceScript.sections.find((candidate) => !candidate.numbered)

  expect(section).toBeDefined()
  expect(text.split('\n')).toContain(section!.blocks[0].lines[0])
})
