import { useRef, useEffect, useState, useCallback } from 'react';
import { getTemplate } from './templates/index';

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

/**
 * Same logical-break algorithm used in pdfExport.js, but runs on the
 * measurement div (unscaled, 794px wide) inside the preview panel.
 */
function computeLogicalBreaks(element, pageHeight) {
  const totalHeight = element.scrollHeight;
  if (totalHeight <= pageHeight) return [];

  const items = Array.from(element.querySelectorAll('[data-cv-item]')).map(el => {
    let top = 0;
    let node = el;
    while (node && node !== element) {
      top += node.offsetTop;
      node = node.offsetParent;
    }
    return { top, bottom: top + el.offsetHeight };
  });

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
      splitAt = pageEnd;
    } else if (crossingItem.top <= pageStart) {
      splitAt = pageEnd; // item taller than page — forced cut
    } else {
      splitAt = crossingItem.top;
    }

    breaks.push(splitAt);
    pageStart = splitAt;
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
                height: A4_HEIGHT * scale,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
                background: '#fff',
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

              {/* The template, shifted so the correct page slice is visible */}
              <div
                id={idx === 0 ? id : undefined}
                style={{
                  position: 'absolute',
                  top: -page.startY * scale,
                  left: 0,
                  width: A4_WIDTH,
                  minHeight: A4_HEIGHT,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  background: '#fff',
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
