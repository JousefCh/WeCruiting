import { useRef, useEffect, useState, useCallback } from 'react';
import { getTemplate } from './templates/index';

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// Breathing room (px) kept free at the bottom of a page and the top of the
// next page around every logical break point.
// White space reserved at the bottom of every page (before the break) and
// added as a top margin on pages 2+ in the preview display.
const PAGE_PADDING = 50;
// Minimum content height (px) that must sit on a page — prevents nearly-empty pages.
const MIN_PAGE_CONTENT = 500;

/**
 * Same logical-break algorithm used in pdfExport.js, but runs on the
 * measurement div (unscaled, 794 px wide) inside the preview panel.
 *
 * IMPORTANT: uses getBoundingClientRect() for position measurement because
 * the measurement div is position:fixed, which causes offsetParent to return
 * null for all descendants — making offsetTop traversal unreliable.
 *
 * Two levels of granularity:
 *  1. Prefer breaking between [data-cv-item] entries (whole job / edu blocks).
 *  2. When an entry spans the full page, break between [data-cv-line] elements
 *     (individual bullet points / paragraphs) instead of cutting mid-line.
 */
function computeLogicalBreaks(element, pageHeight) {
  const totalHeight = element.scrollHeight;
  if (totalHeight <= pageHeight) return [];

  const containerRect = element.getBoundingClientRect();
  const containerTop = containerRect.top;
  const measure = (selector) =>
    Array.from(element.querySelectorAll(selector)).map(el => {
      const rect = el.getBoundingClientRect();
      const top = rect.top - containerTop;
      return { top, bottom: top + rect.height };
    });

  const items = measure('[data-cv-item]');
  const lines = measure('[data-cv-line]');


  const breaks = [];
  let pageStart = 0;

  while (true) {
    const pageEnd = pageStart + pageHeight;
    if (pageEnd >= totalHeight) break;

    const crossingItem = items.find(
      item => item.top < pageEnd && item.bottom > pageEnd
    );

    let splitAt;

    if (!crossingItem) {
      // No entry crosses — split at raw boundary (natural whitespace follows)
      splitAt = pageEnd;
    } else {
      // Find the last item that ends completely before the crossing item starts.
      // Breaking there ensures no item is ever split across pages.
      const prevItems = items.filter(
        item => item.bottom <= crossingItem.top && item.bottom > pageStart && item.bottom <= pageEnd - PAGE_PADDING
      );
      const lastPrev = prevItems.length > 0
        ? prevItems.reduce((a, b) => (a.bottom > b.bottom ? a : b))
        : null;

      // Line-level break: find the bullet/line that crosses the page boundary.
      // Computed here so we can compare it against the item-level option.
      const crossingLine = lines.find(
        line => line.top >= pageStart && line.top < pageEnd && line.bottom > pageEnd
      );
      const lineBreakAt = crossingLine && crossingLine.top - PAGE_PADDING > pageStart
        ? crossingLine.top - PAGE_PADDING
        : null;

      if (lastPrev && lastPrev.bottom >= pageStart + MIN_PAGE_CONTENT) {
        // Item-level break is available. Prefer line-level whenever it yields
        // more than one PAGE_PADDING of extra content — this prevents the large
        // empty gap that appears when a short entry is followed by a long one
        // that starts well before the page boundary.
        if (lineBreakAt && lineBreakAt > lastPrev.bottom + PAGE_PADDING) {
          splitAt = lineBreakAt;
        } else {
          splitAt = lastPrev.bottom;
        }
      } else if (lineBreakAt) {
        // No item-level break available — fall back to line-level.
        splitAt = lineBreakAt;
      } else {
        splitAt = pageEnd;
      }
    }

    breaks.push(splitAt);
    pageStart = splitAt;
  }

  // Orphan prevention (post-processing): if the last page segment is tiny,
  // absorb it into the previous page — but ONLY when the merged content fits
  // within one A4 page height (otherwise we'd clip content).
  if (breaks.length >= 1) {
    const lastBreak = breaks[breaks.length - 1];
    const prevBreak = breaks.length >= 2 ? breaks[breaks.length - 2] : 0;
    const orphanSize = totalHeight - lastBreak;
    const mergedSize  = totalHeight - prevBreak;
    if (orphanSize < PAGE_PADDING * 4 && mergedSize <= pageHeight) {
      breaks.pop();
    }
  }

  return breaks;
}

export default function CVPreviewPanel({ cvData, style = {}, id }) {
  const containerRef = useRef(null); // outer flex container — used for width/scale
  const measureRef = useRef(null);   // hidden full-render — used for height & break measurement

  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT);
  const [logicalBreaks, setLogicalBreaks] = useState([]);

  const { design = {} } = cvData;
  const { template = 'Modern', primaryColor = '#005542', fontFamily = 'Inter, sans-serif' } = design;
  const TemplateComponent = getTemplate(template).component;

  // Track container width → compute scale
  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      const w = containerRef.current?.offsetWidth || A4_WIDTH;
      setScale(w / A4_WIDTH);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Track measure container height + compute logical breaks
  const recompute = useCallback(() => {
    if (!measureRef.current) return;
    const h = measureRef.current.scrollHeight;
    setContentHeight(h);
    // Use the full A4_HEIGHT as the page boundary.  The PAGE_PADDING breathing
    // room is already enforced inside computeLogicalBreaks via the
    // (pageEnd - PAGE_PADDING) filter, so items still never straddle the fold.
    // Using A4_HEIGHT here means a second page is only created when content
    // genuinely overflows beyond 1123 px — the measureRef's minHeight is also
    // A4_HEIGHT, so scrollHeight === A4_HEIGHT when content fits on one page,
    // which satisfies the (totalHeight <= pageHeight) early-return and avoids
    // a blank second page.
    setLogicalBreaks(computeLogicalBreaks(measureRef.current, A4_HEIGHT));
  }, []);

  useEffect(() => {
    if (!measureRef.current) return;
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(measureRef.current);
    return () => ro.disconnect();
  }, [recompute, cvData, template]);

  // Build pages from breaks: [{startY, endY}, ...]
  const boundaries = [0, ...logicalBreaks, contentHeight];
  const pages = boundaries.slice(0, -1).map((startY, i) => ({
    startY,
    endY: boundaries[i + 1],
  }));

  return (
    <>
      {/* Hidden measurement container — full size, never visible to user */}
      <div
        ref={measureRef}
        style={{
          position: 'fixed',
          top: 0,
          left: -9999,
          width: A4_WIDTH,
          minHeight: A4_HEIGHT,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        {/* pageCount=1 keeps measurement stable — prevents circular resize loop */}
        <TemplateComponent data={cvData} primaryColor={primaryColor} fontFamily={fontFamily} pageCount={1} />
      </div>

      {/* Visible paged preview */}
      <div
        ref={containerRef}
        style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', ...style }}
      >
        {pages.map((page, idx) => (
            <div
              key={idx}
              style={{
                width: '100%',
                height: A4_HEIGHT * scale,   // always full A4 height (white space fills bottom)
                position: 'relative',
                boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
                background: '#fff',
                overflow: 'hidden',
              }}
            >
              {/* Page number badge */}
              {pages.length > 1 && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  zIndex: 20,
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 10,
                  pointerEvents: 'none',
                }}>
                  Seite {idx + 1}
                </div>
              )}

              {/* Background layer: design-only render fills the full A4 height (sidebar, accent bar, background colour) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -page.startY * scale,
                    left: 0,
                    width: A4_WIDTH,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <TemplateComponent
                    data={cvData}
                    primaryColor={primaryColor}
                    fontFamily={fontFamily}
                    pageCount={pages.length}
                    backgroundOnly={true}
                  />
                </div>
              </div>

              {/*
                Content layer: clips the full-render to this page's logical slice so text
                never bleeds across pages. On pages 2+ it is pushed down by PAGE_PADDING so
                content starts with breathing room at the top (design background shows through
                above it). The design background also shows through below the clip at the
                bottom of page 1.
              */}
              <div
                style={{
                  position: 'absolute',
                  top: idx > 0 ? PAGE_PADDING * scale : 0,
                  left: 0,
                  right: 0,
                  // Clip exactly at the page slice end so no content from the
                  // next page bleeds through. bottom = distance from the clip's
                  // bottom edge to the page-frame's bottom edge.
                  bottom: (A4_HEIGHT - (idx > 0 ? PAGE_PADDING : 0) - (page.endY - page.startY)) * scale,
                  overflow: 'hidden',
                }}
              >
                <div
                  id={idx === 0 ? id : undefined}
                  style={{
                    position: 'absolute',
                    top: -page.startY * scale,
                    left: 0,
                    width: A4_WIDTH,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <TemplateComponent
                    data={cvData}
                    primaryColor={primaryColor}
                    fontFamily={fontFamily}
                    pageCount={pages.length}
                  />
                </div>
              </div>
            </div>
          ))}

      </div>
    </>
  );
}

/** Full-size (unscaled) version used exclusively for PDF capture. */
export function CVExportTarget({ cvData, id = 'cv-export-target' }) {
  const { design = {} } = cvData;
  const { template = 'Modern', primaryColor = '#005542', fontFamily = 'Inter, sans-serif' } = design;
  const TemplateComponent = getTemplate(template).component;

  return (
    <div
      id={id}
      style={{
        position: 'fixed',
        top: 0,
        left: -9999,
        width: A4_WIDTH,
        minHeight: A4_HEIGHT,
        background: '#fff',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <TemplateComponent
        data={cvData}
        primaryColor={primaryColor}
        fontFamily={fontFamily}
      />
    </div>
  );
}
