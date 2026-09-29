type InlineNode = {
  text?: string;
  content?: InlineNode[] | string;
};

type BlockLike = {
  content?: InlineNode[] | string;
  children?: BlockLike[];
  props?: {
    caption?: string;
    name?: string;
  };
};

function pushText(parts: string[], value: string | undefined) {
  if (!value) return;
  const trimmed = value.trim();
  if (trimmed) parts.push(trimmed);
}

function visitInline(parts: string[], node: InlineNode) {
  pushText(parts, node.text);
  if (typeof node.content === 'string') pushText(parts, node.content);
  else if (Array.isArray(node.content)) node.content.forEach((child) => visitInline(parts, child));
}

function visitBlock(parts: string[], block: BlockLike) {
  if (typeof block.content === 'string') pushText(parts, block.content);
  else if (Array.isArray(block.content)) block.content.forEach((node) => visitInline(parts, node));
  pushText(parts, block.props?.caption);
  block.children?.forEach((child) => visitBlock(parts, child));
}

/** Derived search text. The BlockNote document remains the stored note. */
export function blocksToPlainText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const block of blocks) {
    if (block && typeof block === 'object') visitBlock(parts, block as BlockLike);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 20_000);
}
