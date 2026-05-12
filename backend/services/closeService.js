const CLOSE_BASE = 'https://api.close.com/api/v1';

function authHeader() {
  const encoded = Buffer.from(`${process.env.CLOSE_API_KEY}:`).toString('base64');
  return `Basic ${encoded}`;
}

async function searchLead(firstName, lastName, email) {
  const headers = { Authorization: authHeader(), 'Content-Type': 'application/json' };
  const name = `${firstName || ''} ${lastName || ''}`.trim();

  // Search by name first
  if (name) {
    const res = await fetch(
      `${CLOSE_BASE}/lead/?query=${encodeURIComponent(`"${name}"`)}`,
      { headers }
    );
    const data = await res.json();
    if (data.data && data.data.length > 0) return data.data[0];
  }

  // Fall back to email
  if (email) {
    const res = await fetch(
      `${CLOSE_BASE}/lead/?query=${encodeURIComponent(`email_address:"${email}"`)}`,
      { headers }
    );
    const data = await res.json();
    if (data.data && data.data.length > 0) return data.data[0];
  }

  return null;
}

async function attachFileToLead(leadId, pdfBuffer, filename) {
  const formData = new FormData();
  formData.append('lead_id', leadId);
  formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);

  const res = await fetch(`${CLOSE_BASE}/attachment/`, {
    method: 'POST',
    headers: { Authorization: authHeader() },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Close CRM Anhang fehlgeschlagen: ${err}`);
  }
  return res.json();
}

module.exports = { searchLead, attachFileToLead };
