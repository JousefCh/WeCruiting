import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const A4_HEIGHT_PX = 1123; // 794 × 1123 px at 96 dpi

/**
 * Finds Y positions (in the element's own unscaled pixel space) where the
 * page can be split without cutting through any [data-cv-item] element.
 *
 * Strategy: for each A4 page boundary, if a cv-item crosses it, move the
 * split point up to just before that item (so the item moves intact to the
 * next page). If an item is taller than a full page, we're forced to cut
 * through it (unavoidable fallback).
 */
function computeLogicalBreaks(element, pageHeight) {
  const totalHeight = element.scrollHeight;
  if (totalHeight <= pageHeight) return [];

  // Collect all cv-item bounding boxes (offsetTop relative to the element root)
  const items = Array.from(element.querySelectorAll('[data-cv-item]')).map(el => {
    // Walk up to find cumulative offsetTop relative to `element`
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

    // Find the first item that crosses this page boundary
    const crossingItem = items.find(
      item => item.top < pageEnd && item.bottom > pageEnd
    );

    let splitAt;
    if (!crossingItem) {
      // No item crosses — split at the raw boundary
      splitAt = pageEnd;
    } else if (crossingItem.top <= pageStart) {
      // Item started on (or before) previous page start — it's taller than a page,
      // forced to cut at the raw boundary
      splitAt = pageEnd;
    } else {
      // Split just before the crossing item
      splitAt = crossingItem.top;
    }

    breaks.push(splitAt);
    pageStart = splitAt;
  }

  return breaks;
}

/**
 * Exports the element with the given ID as an A4 PDF.
 * Page breaks fall between [data-cv-item] elements, never mid-content.
 */
export async function exportCVToPDF(elementId, filename = 'Lebenslauf', fullName = '') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Export-Element nicht gefunden.');

  // Bring element to viewport so the browser renders its full height.
  // Browsers skip GPU compositing for elements at large negative offsets.
  const savedTop = element.style.top;
  const savedLeft = element.style.left;
  const savedZIndex = element.style.zIndex;
  element.style.top = '0px';
  element.style.left = '0px';
  element.style.zIndex = '9999';

  // Two animation frames to ensure the browser re-renders before capture.
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));

  // Compute logical page breaks before taking the screenshot
  const logicalBreaks = computeLogicalBreaks(element, A4_HEIGHT_PX);
  const pageCount = logicalBreaks.length + 1;

  // Force the template to fill all pages so sidebars / backgrounds extend
  // to the bottom of the last page (not just to the last content item).
  const requiredHeight = pageCount * A4_HEIGHT_PX;
  const savedMinHeight = element.style.minHeight;
  if (element.scrollHeight < requiredHeight) {
    element.style.minHeight = `${requiredHeight}px`;
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));
  }

  const totalHeight = element.scrollHeight;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    width: 794,
    windowWidth: 794,
    logging: false,
  });

  // Restore original off-screen position and height
  element.style.top = savedTop;
  element.style.left = savedLeft;
  element.style.zIndex = savedZIndex;
  element.style.minHeight = savedMinHeight;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = 210;   // mm
  const pdfHeight = 297;  // mm
  const scale = 2;        // html2canvas scale
  const a4CanvasHeight = A4_HEIGHT_PX * scale; // canvas pixels per A4 page

  if (logicalBreaks.length === 0) {
    // Single page — same as before
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgHeight = (canvas.height / canvas.width) * pdfWidth;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));
  } else {
    // Multi-page
    const boundaries = [0, ...logicalBreaks, totalHeight];

    for (let i = 0; i < boundaries.length - 1; i++) {
      const startPx = boundaries[i] * scale;
      const endPx = boundaries[i + 1] * scale;
      const sliceHeightPx = Math.round(endPx - startPx);

      // Build a full-A4 canvas for this page (white-padded at bottom)
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = a4CanvasHeight;
      const ctx = pageCanvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      // Draw the content slice (may be shorter than a full page — that's fine)
      ctx.drawImage(
        canvas,
        0, Math.round(startPx), canvas.width, Math.min(sliceHeightPx, a4CanvasHeight),
        0, 0, canvas.width, Math.min(sliceHeightPx, a4CanvasHeight)
      );

      const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage();

        // Thin continuation header: "Name · Seite N" + separator line
        pdf.setFontSize(8);
        pdf.setTextColor(160, 160, 160);
        if (fullName) {
          pdf.text(fullName, 15, 6.5);
        }
        pdf.text(`Seite ${i + 1}`, 195, 6.5, { align: 'right' });
        pdf.setDrawColor(220, 220, 220);
        pdf.line(15, 8.5, 195, 8.5);
        pdf.setTextColor(0, 0, 0);

        // Content starts below the header
        pdf.addImage(pageImg, 'JPEG', 0, 12, pdfWidth, pdfHeight - 12);
      } else {
        pdf.addImage(pageImg, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
    }
  }

  pdf.save(`${filename}.pdf`);
}

/**
 * Exports plain text as a simple A4 PDF (for cover letters).
 */
export function exportTextToPDF(text, filename = 'Anschreiben') {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 25;
  const maxWidth = 210 - margin * 2;
  const lineHeight = 6;

  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(11);

  const lines = pdf.splitTextToSize(text, maxWidth);
  let y = margin;

  lines.forEach(line => {
    if (y > 270) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += lineHeight;
  });

  pdf.save(`${filename}.pdf`);
}
