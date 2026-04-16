/**
 * Returns a scaled-down font size when the name is too long to fit at the base size.
 */
export function calcNameFontSize(name, baseSize) {
  if (!name) return baseSize;
  const len = name.length;
  if (len <= 20) return baseSize;
  if (len <= 26) return Math.round(baseSize * 0.85);
  if (len <= 32) return Math.round(baseSize * 0.72);
  return Math.round(baseSize * 0.62);
}

/**
 * Renders a description text that may contain bullet points (lines starting with "• ")
 * Returns an array of React-compatible style objects and text.
 */
export function renderDescription(text, style = {}) {
  if (!text) return null;
  const lines = text.split('\n').filter(l => l.trim() !== '');
  if (lines.length === 0) return null;

  return lines.map((line, i) => {
    const isBullet = line.startsWith('• ') || line.startsWith('- ');
    const content = isBullet ? line.slice(2) : line;
    return { key: i, isBullet, content };
  });
}
