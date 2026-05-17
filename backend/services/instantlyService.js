const BASE = 'https://api.instantly.ai/api/v2';

function headers() {
  return {
    'Authorization': `Bearer ${process.env.INSTANTLY_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instantly API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instantly API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// Returns array of { id, name, status, ... }
async function listCampaigns() {
  const data = await apiGet('/campaigns?limit=100');
  return Array.isArray(data) ? data : (data.items || data.campaigns || []);
}

// Build email sequence: initial mail + 2 follow-ups
// attachmentFiles: [{ filename, url }]
function buildSequences(subject, body, attachmentFiles = []) {
  const attachment_json = attachmentFiles.length ? {
    files: attachmentFiles.map(f => ({
      filename: f.filename,
      size: f.size || 0,
      type: 'application/pdf',
      url: f.url,
      error: null,
    })),
  } : null;

  const withAttachment = variants =>
    variants.map(v => attachment_json ? { ...v, attachment_json } : v);

  return [
    {
      type: 'email',
      delay: 0,
      delay_unit: 'days',
      variants: withAttachment([{ subject, body, v_disabled: false }]),
    },
    {
      type: 'email',
      delay: 3,
      delay_unit: 'days',
      variants: [{
        subject: `Re: ${subject}`,
        body: `Guten Tag,\n\nich erlaube mir kurz nachzufassen — haben Sie Gelegenheit gehabt, das beigefügte Profil zu sichten?\n\nFür Rückfragen stehe ich jederzeit gerne zur Verfügung.\n\nMit freundlichen Grüßen\nIhr WeCruiting-Team`,
        v_disabled: false,
      }],
    },
    {
      type: 'email',
      delay: 5,
      delay_unit: 'days',
      variants: [{
        subject: `Re: ${subject}`,
        body: `Guten Tag,\n\nda ich bisher keine Rückmeldung erhalten habe, möchte ich diese Nachricht als letzte in dieser Sache senden.\n\nSollte zu einem späteren Zeitpunkt Interesse bestehen, freue ich mich über eine Kontaktaufnahme.\n\nMit freundlichen Grüßen\nIhr WeCruiting-Team`,
        v_disabled: false,
      }],
    },
  ];
}

// Create a new campaign with sequences
async function createCampaign({ name, sequences, dailyLimit = 50 }) {
  return apiPost('/campaigns', {
    name,
    campaign_schedule: {
      schedules: [{
        name: 'Werktags',
        timing: { from: '08:00', to: '17:00' },
        days: { '1': true, '2': true, '3': true, '4': true, '5': true },
        timezone: 'Europe/Berlin',
      }],
    },
    sequences,
    daily_limit: dailyLimit,
    stop_on_reply: true,
    open_tracking: true,
    link_tracking: true,
  });
}

// Activate (launch) a campaign
async function activateCampaign(campaignId) {
  return apiPost(`/campaign/${campaignId}/activate`, {});
}

// Add leads to a campaign
// leads: [{ email, first_name, last_name, company_name, custom_variables }]
async function addLeads(campaignId, leads) {
  return apiPost('/leads/bulk-add', {
    campaign_id: campaignId,
    leads,
    skip_if_in_workspace: false,
    skip_if_in_campaign: true,
  });
}

module.exports = { listCampaigns, buildSequences, createCampaign, activateCampaign, addLeads };
