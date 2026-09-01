#!/usr/bin/env node
import fs from 'fs'

// --------------------------
// Config
// --------------------------
const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node remove-duplicate-imports.js <file>')
  process.exit(1)
}

// --------------------------
// Read file
// --------------------------
const code = fs.readFileSync(filePath, 'utf-8')

// --------------------------
// Process imports
// --------------------------
const lines = code.split('\n')
const seenImports = new Set()
const newLines = []

for (const line of lines) {
  const trimmed = line.trim()
  if (trimmed.startsWith('import ')) {
    // Only keep unique import lines
    if (!seenImports.has(trimmed)) {
      seenImports.add(trimmed)
      newLines.push(line)
    } // else skip duplicate
  } else {
    newLines.push(line)
  }
}

// --------------------------
// Write back
// --------------------------
fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8')
console.log(`Removed duplicate imports from ${filePath}`)
