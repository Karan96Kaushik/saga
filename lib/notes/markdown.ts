export function markdownDocument(title: string, body: string): string {
  const heading = title.trim() || 'Untitled';
  const trimmed = body.trim();
  return trimmed ? `# ${heading}\n\n${trimmed}\n` : `# ${heading}\n`;
}

export function markdownFilename(title: string): string {
  const slug = (title.trim() || 'note')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${slug || 'note'}.md`;
}

export function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
