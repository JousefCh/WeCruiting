import api from './api';

export const generateCoverLetter = (cvData, jobTitle, company, jobDescription) =>
  api.post('/ai/cover-letter', { cvData, jobTitle, company, jobDescription }).then(r => r.data);
