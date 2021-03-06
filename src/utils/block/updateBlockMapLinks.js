export function findLastBlockWithNullParent(contentState) {
  const blockMap = contentState.getBlockMap();
  return blockMap
    .reverse()
    .skipUntil(block => !block.parent)
    .take(1);
}
