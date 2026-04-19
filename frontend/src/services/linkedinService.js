import api from './api';

/**
 * Upload a LinkedIn profile PDF and return structured CV data.
 *
 * @param {File}   pdfFile    – The PDF file selected by the user
 * @param {string} [profileUrl] – Optional LinkedIn profile URL
 * @returns {Promise<object>}  – Parsed CV data
 */
export async function importLinkedInProfile(pdfFile, profileUrl = '') {
  const form = new FormData();
  form.append('pdf', pdfFile);
  if (profileUrl) form.append('profileUrl', profileUrl);

  const { data } = await api.post('/ai/linkedin-import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.data;
}
