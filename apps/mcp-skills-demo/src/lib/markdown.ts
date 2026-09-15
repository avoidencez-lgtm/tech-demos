function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function inline(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

export function renderMarkdown(source: string): string {
  const withoutFrontmatter = source.replace(/^---[\s\S]*?---\n/, '')
  const lines = withoutFrontmatter.split('\n')
  const html: string[] = []
  let inCode = false
  let inList = false
  let inTable = false

  const closeList = () => {
    if (inList) {
      html.push('</ul>')
      inList = false
    }
  }

  const closeTable = () => {
    if (inTable) {
      html.push('</tbody></table>')
      inTable = false
    }
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      closeList()
      closeTable()
      if (inCode) {
        html.push('</code></pre>')
        inCode = false
      } else {
        html.push('<pre><code>')
        inCode = true
      }
      continue
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`)
      continue
    }

    if (line.startsWith('| ') && line.endsWith(' |')) {
      closeList()
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim())
      if (cells.every((cell) => /^:?-+:?$/.test(cell))) {
        continue
      }
      if (!inTable) {
        html.push('<table><tbody>')
        inTable = true
        html.push(`<tr>${cells.map((cell) => `<th>${inline(cell)}</th>`).join('')}</tr>`)
      } else {
        html.push(`<tr>${cells.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`)
      }
      continue
    }

    closeTable()

    if (line.startsWith('- ')) {
      if (!inList) {
        html.push('<ul>')
        inList = true
      }
      html.push(`<li>${inline(line.slice(2))}</li>`)
      continue
    }

    closeList()

    if (line.startsWith('### ')) {
      html.push(`<h3>${inline(line.slice(4))}</h3>`)
    } else if (line.startsWith('## ')) {
      html.push(`<h2>${inline(line.slice(3))}</h2>`)
    } else if (line.startsWith('# ')) {
      html.push(`<h1>${inline(line.slice(2))}</h1>`)
    } else if (/^\d+\.\s/.test(line)) {
      html.push(`<p>${inline(line)}</p>`)
    } else if (line.trim() === '') {
      html.push('')
    } else {
      html.push(`<p>${inline(line)}</p>`)
    }
  }

  closeList()
  closeTable()
  return html.join('\n')
}
