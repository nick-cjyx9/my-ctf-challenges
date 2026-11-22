const contexts = new Map<string, CanvasRenderingContext2D>()

function context(font: string): CanvasRenderingContext2D | null {
  const cached = contexts.get(font)
  if (cached)
    return cached
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return null
  ctx.font = font
  contexts.set(font, ctx)
  return ctx
}

export function wrapText(text: string, maxWidth: number, font: string): string[] {
  const ctx = context(font)
  const lines: string[] = []
  const paragraphs = text.replace(/\r\n?/g, '\n').split('\n')

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }
    if (!ctx) {
      const perLine = Math.max(1, Math.floor(maxWidth / 9))
      for (let i = 0; i < paragraph.length; i += perLine)
        lines.push(paragraph.slice(i, i + perLine))
      continue
    }
    let line = ''
    for (const ch of paragraph) {
      const candidate = line + ch
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line)
        line = ch
      }
      else {
        line = candidate
      }
    }
    if (line)
      lines.push(line)
  }
  return lines
}

export function pageCount(lines: string[], perPage: number): number {
  return Math.max(1, Math.ceil(lines.length / perPage))
}

export function pageOf(line: number, perPage: number): number {
  return Math.floor(line / perPage) + 1
}
