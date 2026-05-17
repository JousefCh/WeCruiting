import { useState, useEffect, useMemo, useCallback } from 'react';
import useCVStore from '../../store/cvStore';
import { CVExportTarget } from '../preview/CVPreviewPanel';
import CVPreviewPanel from '../preview/CVPreviewPanel';
import { exportCVToPDF, exportCVToPDFBlob } from '../../utils/pdfExport';
import AnonCVEditor from './AnonCVEditor';
import PlacementWizard from '../placement/PlacementWizard';
import RichEmailEditor from '../editor/RichEmailEditor';
import api from '../../services/api';

function shiftYear(str, offset) {
  if (!str) return str;
  return String(str).replace(/\b(19|20)\d{2}\b/, y => String(parseInt(y) + offset));
}

function plainTextToHtml(text) {
  if (!text) return '';
  // Collapse 3+ consecutive blank lines to max 1 blank line
  return text
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => `<p>${line.trim() || '<br>'}</p>`)
    .join('');
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function inferCompanyType(job) {
  const src = `${job.company || ''} ${job.position || ''} ${job.berufsbezeichnung || ''} ${job.description || ''}`.toLowerCase();

  if (/selbst[äa]ndig|freelanc|freiberuf|einzelunternehm/.test(src)) return 'Selbständigkeit';
  if (/start.?up/.test(src)) return 'Start-up';
  if (/kanzlei|rechtsanwalt|notar|steuerber/.test(src)) return 'Kanzlei';
  if (/krankenhaus|klinik|hospital|praxis|medizin(?!isch\s+ger)|pflege|reha/.test(src)) return 'Klinik / Krankenhaus';
  if (/apothek/.test(src)) return 'Apotheke';
  if (/pharma|chemie|labor/.test(src)) return 'Pharmaunternehmen';
  if (/versicherung|assekuranz/.test(src)) return 'Versicherungsunternehmen';
  if (/immobilien|real.?estate|makler|hausverwalt/.test(src)) return 'Immobilienunternehmen';
  if (/agentur|agency|werb|pr\b|marketing|kommunikation/.test(src)) return 'Agentur';
  if (/logistik|transport|spedition|lieferung|kurier|fracht|lager/.test(src)) return 'Logistikunternehmen';
  if (/handel|retail|einzel|super|markt|shop|verkauf/.test(src)) return 'Handelsunternehmen';
  if (/architekt|stadtplaner|landschaft.?plan|entwurf|tragwerk|statik|bauplan|projektsteuerung|generalplan/.test(src)) return 'Planungsbüro (Bau)';
  if (/bauausf[üu]hrung|baustelle|rohbau|tiefbau|hochbau|schlüsselfertig|generalunternehm|bautr[äa]ger|polier|maurer|zimmermann|montage/.test(src)) return 'Bauunternehmen (Ausführung)';
  if (/bau|construction|ingenieurb[üu]ro/.test(src)) return 'Bauunternehmen';
  if (/industrie|fertigung|produktion|maschinenbau|automobil|zulieferer/.test(src)) return 'Industrieunternehmen';
  if (/energie|strom|gas|solar|wind|power|versorger/.test(src)) return 'Energieunternehmen';
  if (/hotel|gastronom|restaurant|catering|tourismus|reise/.test(src)) return 'Gastronomiebetrieb';
  if (/medien|verlag|zeitung|tv\b|rundfunk|film|musik/.test(src)) return 'Medienunternehmen';
  if (/bildung|schule|akademie|weiterbildung|training|coach/.test(src)) return 'Bildungseinrichtung';
  if (/verein|ngo|gemeinn[üu]tz|stiftung|nonprofit/.test(src)) return 'Non-Profit-Organisation';
  if (/beh[öo]rde|amt|ministerium|öffentlich|staatlich|kommunal|bundes|landes/.test(src)) return 'Behörde';
  if (/personalvermittlung|recruiting|headhunter|zeitarbeit|personal/.test(src)) return 'Personaldienstleister';
  if (/gesundheit|wellness|sport|fitness/.test(src)) return 'Gesundheitsunternehmen';
  if (/lebensmittel|food|getränk/.test(src)) return 'Lebensmittelunternehmen';
  if (/mode|textil|fashion|bekleidung/.test(src)) return 'Modeunternehmen';

  // Legal-form fallback: if the source mentions a company suffix, call it a generic company
  if (/\bgmbh\b|\bag\b|\bkg\b|\bohg\b|\bse\b|\bllc\b|\binc\b|\bltd\b/.test(src)) return 'Unternehmen';
  return 'Unternehmen';
}

function inferInstitutionType(edu) {
  const src = `${edu.institution || ''} ${edu.degree || ''} ${edu.field || ''}`.toLowerCase();
  if (/universit|uni\b/.test(src)) return 'Universität';
  if (/fachhochschule|fh\b/.test(src)) return 'Fachhochschule';
  if (/hochschule/.test(src)) return 'Hochschule';
  if (/berufsschule|berufsfachschule|berufskolleg/.test(src)) return 'Berufsschule';
  if (/gymnasium|gesamtschule|realschule|mittelschule|oberschule/.test(src)) return 'Gymnasium';
  if (/schule/.test(src)) return 'Schule';
  if (/akademie/.test(src)) return 'Akademie';
  if (/institut\b/.test(src)) return 'Institut';
  if (/ausbildung/.test(src)) return 'Ausbildungsbetrieb';
  // Degree-based fallback
  if (/bachelor|master|diplom|magister|doktor|phd|mba/.test(src)) return 'Hochschule';
  if (/abitur|matura|abschluss/.test(src)) return 'Gymnasium';
  if (/ausbildung|azubi/.test(src)) return 'Ausbildungsbetrieb';
  return 'Hochschule';
}

export default function Step3Download({ onBack }) {
  const currentCV = useCVStore(s => s.currentCV);
  const updatePersonalInfo = useCVStore(s => s.updatePersonalInfo);
  const updateArrayItem = useCVStore(s => s.updateArrayItem);
  const [exporting, setExporting] = useState(false);

  // Internal profile state
  const [profileNumber, setProfileNumber] = useState(null);
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [anonExporting, setAnonExporting] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeStatus, setCloseStatus] = useState(null); // { ok, message }

  // Email state
  const [gehaltsvorstellung, setGehaltsvorstellung] = useState('');
  const [kuendigungsfrist, setKuendigungsfrist] = useState('');
  const [signature, setSignature] = useState(() => localStorage.getItem('emailSignature') || '');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [refineInput, setRefineInput] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);
  const [showPlacement, setShowPlacement] = useState(false);
  const [companyAnalysis, setCompanyAnalysis] = useState(null);

  // Nearest major city for anonymization
  const [nearestCity, setNearestCity] = useState(null);

  // AI-anonymized job data: company types + cleaned descriptions
  const [anonJobData, setAnonJobData] = useState({});
  const [anonJobsLoading, setAnonJobsLoading] = useState(false);
  const [companyTypeOverrides] = useState({});

  useEffect(() => {
    const jobs = currentCV?.workExperience;
    if (!jobs?.length) return;
    const toProcess = jobs
      .filter(j => j.company)
      .map(j => ({ id: j.id, name: j.company, position: j.position || '', description: j.description || '' }));
    if (!toProcess.length) return;
    setAnonJobsLoading(true);
    api.post('/ai/anonymize-jobs', { jobs: toProcess })
      .then(({ data }) => {
        const map = {};
        data.results.forEach(r => { map[r.id] = { type: r.type, description: r.description }; });
        setAnonJobData(map);
      })
      .catch(() => {})
      .finally(() => setAnonJobsLoading(false));
  }, [currentCV?.workExperience]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const city = currentCV?.personalInfo?.city;
    if (!city) { setNearestCity(''); return; }
    api.get('/ai/nearest-major-city', {
      params: {
        city,
        postalCode: currentCV?.personalInfo?.postalCode || '',
        country: currentCV?.personalInfo?.country || '',
      },
    }).then(({ data }) => setNearestCity(data.city || city))
      .catch(() => setNearestCity(city));
  }, [currentCV?.personalInfo?.city]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tailor-to-company state
  const [tailorUrl, setTailorUrl] = useState('');
  const [tailoring, setTailoring] = useState(false);
  const [tailoredCVData, setTailoredCVData] = useState(null);
  const [tailoredCompany, setTailoredCompany] = useState('');

  const { personalInfo: p = {} } = currentCV;
  const name = [p.firstName, p.lastName].filter(Boolean).join('_') || 'Lebenslauf';
  const cvId = currentCV.id;

  const [profileError, setProfileError] = useState('');
  const [previewMode, setPreviewMode] = useState('normal'); // 'normal' | 'anon'
  const [anonEditData, setAnonEditData] = useState(null);
  const [editingAnon, setEditingAnon] = useState(false);

  // Load or assign profile number on mount
  useEffect(() => {
    if (!cvId) {
      setProfileError('Lebenslauf noch nicht gespeichert.');
      return;
    }
    api.get(`/cvs/${cvId}/profile-number`)
      .then(({ data }) => {
        setProfileNumber(data.profileNumber);
        setProfileDisplayName(data.displayName);
      })
      .catch(err => {
        setProfileError(err.response?.data?.error || err.message || 'Fehler beim Laden der Profilnummer.');
      });
  }, [cvId]);

  // Computed base for anon CV — derived from currentCV + profileDisplayName
  const anonCVData = useMemo(() => {
    if (!profileDisplayName) return null;
    // +1 for even profile numbers, -1 for odd — consistent per candidate
    const yearOffset = profileNumber ? (profileNumber % 2 === 0 ? 1 : -1) : 1;

    return {
      ...currentCV,
      personalInfo: {
        ...currentCV.personalInfo,
        firstName: profileDisplayName,
        lastName: '',
        email: '',
        phone: '',
        address: '',
        postalCode: '',
        photo: null,
        linkedin: '',
        website: '',
        city: nearestCity ?? currentCV.personalInfo?.city,
      },
      // Replace employer names + clean descriptions + shift years
      workExperience: (currentCV.workExperience || []).map(job => {
        const override = companyTypeOverrides[job.id];
        const aiType = anonJobData[job.id]?.type;
        const regexType = inferCompanyType(job);
        const company = override || (aiType && aiType !== 'Unternehmen' ? aiType : (regexType !== 'Unternehmen' ? regexType : (aiType || 'Unternehmen')));
        return { ...job, company, description: anonJobData[job.id]?.description ?? job.description,
        startDate: shiftYear(job.startDate, yearOffset),
        endDate: shiftYear(job.endDate, yearOffset),
        }; }),
      // Replace institution names with generic terms + shift years
      education: (currentCV.education || []).map(edu => ({
        ...edu,
        institution: inferInstitutionType(edu),
        startDate: shiftYear(edu.startDate, yearOffset),
        endDate: shiftYear(edu.endDate, yearOffset),
      })),
      // Only keep German and English
      languages: (currentCV.languages || []).filter(l =>
        /deutsch|german|englisch|english/i.test(l.language)
      ),
      // Remove hobbies
      hobbies: [],
    };
  }, [currentCV, profileDisplayName, nearestCity, anonJobData, companyTypeOverrides, profileNumber]);

  const [anonManuallyEdited, setAnonManuallyEdited] = useState(false);

  // Initial seed
  useEffect(() => {
    if (anonCVData && !anonEditData) {
      setAnonEditData(anonCVData);
    }
  }, [anonCVData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-sync when AI data or manual overrides change, unless user edited via full editor
  useEffect(() => {
    if (anonCVData && !anonManuallyEdited) {
      setAnonEditData(anonCVData);
    }
  }, [anonJobData, companyTypeOverrides]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreviewFieldChange = useCallback((field, value) => {
    if (previewMode === 'normal') {
      if (field === 'summary') {
        updatePersonalInfo('summary', value);
      } else {
        const [section, id, key] = field.split(':');
        updateArrayItem(section === 'work' ? 'workExperience' : 'education', id, { [key]: value });
      }
    } else if (previewMode === 'anon') {
      if (field === 'summary') {
        setAnonEditData(prev => ({ ...prev, personalInfo: { ...(prev?.personalInfo ?? {}), summary: value } }));
      } else {
        const [section, id, key] = field.split(':');
        const sectionKey = section === 'work' ? 'workExperience' : 'education';
        setAnonEditData(prev => ({
          ...prev,
          [sectionKey]: (prev?.[sectionKey] ?? []).map(item => item.id === id ? { ...item, [key]: value } : item),
        }));
      }
      setAnonManuallyEdited(true);
    }
  }, [previewMode, updatePersonalInfo, updateArrayItem]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const displayName = [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (previewMode === 'tailored' && tailoredCVData) {
        await exportCVToPDF('cv-export-target-tailored', `Lebenslauf_${name}_${tailoredCompany}`, displayName);
      } else {
        await exportCVToPDF('cv-export-target', `Lebenslauf_${name}`, displayName);
      }
    } catch {
      alert('PDF-Export fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setExporting(false);
    }
  };

  const handleAnonExport = async () => {
    if (!anonEditData) return;
    setAnonExporting(true);
    try {
      await exportCVToPDF('cv-export-target-anon', profileDisplayName, profileDisplayName);
    } catch {
      alert('Anonymisierter PDF-Export fehlgeschlagen.');
    } finally {
      setAnonExporting(false);
    }
  };

  const handleSendToClose = async () => {
    if (!anonEditData) return;
    setCloseLoading(true);
    setCloseStatus(null);
    try {
      const blob = await exportCVToPDFBlob('cv-export-target-anon', profileDisplayName);
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const { data } = await api.post(`/cvs/${cvId}/send-to-close`, {
        pdfBase64: base64,
        filename: `${profileDisplayName}.pdf`,
      });
      setCloseStatus({ ok: true, message: `Erfolgreich an Lead "${data.leadName}" gesendet.` });
    } catch (err) {
      setCloseStatus({ ok: false, message: err.response?.data?.error || 'Fehler beim Senden.' });
    } finally {
      setCloseLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
    setEmailLoading(true);
    setEmailSubject('');
    setEmailBody('');
    try {
      const { data } = await api.post(`/cvs/${cvId}/generate-email`, {
        gehaltsvorstellung,
        kuendigungsfrist,
        nearestCity: nearestCity || '',
      });
      setEmailSubject(data.subject);
      const sig = signature.trim();
      setEmailBody(
        plainTextToHtml(data.body) +
        (sig ? '<p><br></p><p>--</p>' + plainTextToHtml(sig) : '')
      );
    } catch (err) {
      alert(err.response?.data?.error || 'E-Mail-Generierung fehlgeschlagen.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGenerateAnonEmail = async () => {
    if (!anonEditData) return;
    setEmailLoading(true);
    setEmailSubject('');
    setEmailBody('');
    try {
      const { data } = await api.post(`/cvs/${cvId}/generate-email`, {
        gehaltsvorstellung,
        kuendigungsfrist,
        anon: true,
        nearestCity: nearestCity || '',
      });
      setEmailSubject(data.subject);
      const sig = signature.trim();
      setEmailBody(
        plainTextToHtml(data.body) +
        (sig ? '<p><br></p><p>--</p>' + plainTextToHtml(sig) : '')
      );
    } catch (err) {
      alert(err.response?.data?.error || 'E-Mail-Generierung fehlgeschlagen.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || refineLoading) return;
    setRefineLoading(true);
    try {
      const { data } = await api.post(`/cvs/${cvId}/refine-email`, {
        subject: emailSubject,
        body: emailBody,
        instruction: refineInput.trim(),
      });
      setEmailSubject(data.subject);
      setEmailBody(data.body.includes('<p>') ? data.body : plainTextToHtml(data.body));
      setRefineInput('');
    } catch (err) {
      alert(err.response?.data?.error || 'Anpassung fehlgeschlagen.');
    } finally {
      setRefineLoading(false);
    }
  };

  const handleCopy = async () => {
    const plainText = `Betreff: ${emailSubject}\n\n${stripHtml(emailBody)}`;
    const htmlContent = `<p><b>Betreff: ${emailSubject}</b></p><br>${emailBody}`;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);
    } catch {
      navigator.clipboard.writeText(plainText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTailor = async () => {
    if (!tailorUrl.trim() || tailoring) return;
    setTailoring(true);
    try {
      let url = tailorUrl.trim();
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      const { data } = await api.post(`/cvs/${cvId}/tailor`, {
        companyUrl: url,
        gehaltsvorstellung,
        kuendigungsfrist,
      });
      const base = previewMode === 'anon' && anonEditData ? anonEditData : currentCV;
      setTailoredCVData({ ...base, workExperience: data.workExperience });
      setTailoredCompany(data.companyDomain);
      if (data.email?.subject) setEmailSubject(data.email.subject);
      if (data.email?.body) {
        const sig = signature.trim();
        setEmailBody(
          plainTextToHtml(data.email.body) +
          (sig ? '<p><br></p><p>--</p>' + plainTextToHtml(sig) : '')
        );
      }
      setPreviewMode('tailored');
    } catch (err) {
      alert(err.response?.data?.error || 'Zuschneiden fehlgeschlagen.');
    } finally {
      setTailoring(false);
    }
  };

  if (editingAnon && anonEditData) {
    return (
      <AnonCVEditor
        data={anonEditData}
        onChange={data => { setAnonEditData(data); setAnonManuallyEdited(true); }}
        onClose={() => setEditingAnon(false)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Preview */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {previewMode === 'anon' ? 'Anonymes Profil' : previewMode === 'tailored' ? `Zugeschnitten: ${tailoredCompany}` : 'Ihr Lebenslauf'}
            </h2>
            <div className="flex items-center gap-2">
              {previewMode === 'anon' && anonEditData && (
                <button
                  onClick={() => setEditingAnon(true)}
                  className="px-3 py-1.5 text-xs font-medium text-brand border border-brand rounded-md hover:bg-brand-50 transition-colors"
                >
                  Bearbeiten
                </button>
              )}
              {anonEditData && (
                <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setPreviewMode('normal')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      previewMode === 'normal'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setPreviewMode('anon')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      previewMode === 'anon'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Anonym
                  </button>
                  {tailoredCVData && (
                    <button
                      onClick={() => setPreviewMode('tailored')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        previewMode === 'tailored'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      Zugeschnitten
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-xl overflow-hidden relative">
            <CVPreviewPanel
              cvData={
                previewMode === 'tailored' && tailoredCVData ? tailoredCVData :
                previewMode === 'anon' && anonEditData ? anonEditData :
                currentCV
              }
              editable={previewMode === 'normal' || previewMode === 'anon'}
              onFieldChange={handlePreviewFieldChange}
            />
            {previewMode === 'anon' && anonJobsLoading && (
              <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-3 z-10">
                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-500">Anonymisierung wird verfeinert…</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions sidebar */}
        <div className="lg:w-72 space-y-4">

          {/* ── Exportieren ── */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Exportieren & Herunterladen</h3>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {exporting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Wird erstellt…</>
              ) : (
                <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>PDF herunterladen</>
              )}
            </button>

            <div className="border-t border-gray-100 pt-4">
              <button onClick={onBack} className="text-sm text-gray-500 hover:text-brand flex items-center gap-1">
                ← Zurück zum Bearbeiten
              </button>
            </div>
          </div>

          {/* ── Internes Profil ── */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Internes Profil</h3>
              {profileDisplayName && (
                <span className="text-xs bg-brand-50 text-brand font-mono px-2 py-0.5 rounded">
                  #{profileNumber}
                </span>
              )}
            </div>

            {profileError ? (
              <p className="text-xs text-red-600">{profileError}</p>
            ) : profileDisplayName ? (
              <p className="text-xs text-gray-500 font-mono break-all">{profileDisplayName}</p>
            ) : (
              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            )}

            <button
              onClick={handleAnonExport}
              disabled={anonExporting || !profileDisplayName}
              className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2 text-sm"
            >
              {anonExporting ? (
                <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Wird erstellt…</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>Anon. Profil herunterladen</>
              )}
            </button>

            <button
              onClick={handleSendToClose}
              disabled={closeLoading || !profileDisplayName}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-white bg-[#0A66C2] hover:bg-[#004182] rounded-lg transition-colors disabled:opacity-50"
            >
              {closeLoading ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Wird gesendet…</>
              ) : (
                <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>An Close CRM senden</>
              )}
            </button>

            {closeStatus && (
              <div className={`text-xs rounded-lg px-3 py-2 ${closeStatus.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {closeStatus.message}
              </div>
            )}

            {/* Automated placement */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Automatische Platzierung</h4>
              <p className="text-xs text-gray-400 mb-3">
                Passende Unternehmen finden, E-Mail-Adressen recherchieren und Profil per E-Mail platzieren.
              </p>
              <button
                onClick={() => setShowPlacement(true)}
                disabled={!anonEditData}
                className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Profil automatisch platzieren
              </button>
            </div>
          </div>

          {/* ── Auf Unternehmen zuschneiden ── */}
          <div className="card p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">Auf Unternehmen zuschneiden</h3>
              <p className="text-xs text-gray-400 mt-1">Tätigkeiten im Lebenslauf + E-Mail werden automatisch auf die Website des Unternehmens zugeschnitten.</p>
            </div>
            <div>
              <label className="label">Website des Zielunternehmens</label>
              <input
                type="url"
                className="input-field text-sm"
                placeholder="z.B. https://www.siemens.com"
                value={tailorUrl}
                onChange={e => setTailorUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTailor()}
              />
            </div>
            <button
              onClick={handleTailor}
              disabled={tailoring || !tailorUrl.trim() || !cvId}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {tailoring ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Wird zugeschnitten…</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Zuschneiden</>
              )}
            </button>
            {tailoredCVData && (
              <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-xs text-emerald-700">Zugeschnitten auf <strong>{tailoredCompany}</strong></span>
              </div>
            )}
          </div>

          {/* ── E-Mail-Vorlage ── */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">E-Mail-Vorlage</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Gehaltsvorstellung</label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="z.B. ab 75.000 € p.a. + FW"
                  value={gehaltsvorstellung}
                  onChange={e => setGehaltsvorstellung(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Kündigungsfrist</label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="z.B. 1 Monat"
                  value={kuendigungsfrist}
                  onChange={e => setKuendigungsfrist(e.target.value)}
                />
              </div>
              <div>
                <label className="label">E-Mail-Signatur</label>
                <textarea
                  className="input-field text-sm resize-none"
                  rows={4}
                  placeholder={"z.B.\nMit freundlichen Grüßen\nMax Mustermann\nWeCruiting Consulting GmbH\nTel: +49 123 456789"}
                  value={signature}
                  onChange={e => {
                    setSignature(e.target.value);
                    localStorage.setItem('emailSignature', e.target.value);
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">Wird einmalig gespeichert und automatisch angehängt.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerateEmail}
                disabled={emailLoading}
                className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 text-sm"
              >
                {emailLoading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Wird generiert…</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>E-Mail</>
                )}
              </button>
              <button
                onClick={handleGenerateAnonEmail}
                disabled={emailLoading || !anonEditData}
                title="E-Mail mit anonymem Profil (Profilnummer statt Name)"
                className="btn-secondary flex-1 py-2.5 flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Anon.
              </button>
            </div>

            {emailBody && (
              <div className="space-y-2">
                {/* Email expand modal */}
                {emailExpanded && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setEmailExpanded(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                        <h3 className="font-semibold text-gray-800">E-Mail-Vorlage</h3>
                        <button onClick={() => setEmailExpanded(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1.5">Betreff</p>
                          <input
                            className="input-field text-sm"
                            value={emailSubject}
                            onChange={e => setEmailSubject(e.target.value)}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1.5">E-Mail-Text</p>
                          <RichEmailEditor content={emailBody} onChange={setEmailBody} minHeight={340} />
                        </div>
                      </div>
                      <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
                        <button
                          onClick={handleCopy}
                          className="flex-1 py-2.5 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand-50 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          Kopieren
                        </button>
                        <button onClick={() => setEmailExpanded(false)} className="flex-1 py-2.5 text-sm btn-primary">
                          Übernehmen
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Betreff</p>
                  <p className="text-xs text-gray-800 break-words">{emailSubject}</p>
                </div>
                <div className="relative">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-48 overflow-y-auto">
                    <div
                      className="text-xs text-gray-700 leading-relaxed [&_p]:mb-0 [&_p:has(>br:only-child)]:leading-[0.8] [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-4"
                      dangerouslySetInnerHTML={{ __html: emailBody }}
                    />
                  </div>
                  <button
                    onClick={() => setEmailExpanded(true)}
                    className="absolute top-2 right-2 flex items-center gap-1 text-xs text-brand bg-white border border-brand/30 rounded-md px-2 py-1 hover:bg-brand-50 transition-colors shadow-sm"
                    title="Vollbild bearbeiten"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                    Vergrößern
                  </button>
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full py-2 text-xs font-medium text-brand border border-brand rounded-lg hover:bg-brand-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Kopiert!</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>E-Mail kopieren</>
                  )}
                </button>

                {/* AI refinement chat */}
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    KI-Anpassung
                  </p>
                  <textarea
                    className="input-field resize-none text-xs"
                    rows={2}
                    placeholder={'z.B. "Mache den Ton formeller" oder "Füge die Gehaltsvorstellung prominenter ein"'}
                    value={refineInput}
                    onChange={e => setRefineInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefine(); } }}
                  />
                  <button
                    onClick={handleRefine}
                    disabled={refineLoading || !refineInput.trim()}
                    className="w-full py-2 text-xs font-medium text-white bg-brand rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {refineLoading ? (
                      <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Wird angepasst…</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Anpassen</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Hidden export targets */}
      <CVExportTarget cvData={currentCV} id="cv-export-target" />
      {anonEditData && <CVExportTarget cvData={anonEditData} id="cv-export-target-anon" />}
      {tailoredCVData && <CVExportTarget cvData={tailoredCVData} id="cv-export-target-tailored" />}

      {showPlacement && anonEditData && (
        <PlacementWizard
          anonEditData={anonEditData}
          originalCV={currentCV}
          cachedAnalysis={companyAnalysis}
          onAnalysisDone={setCompanyAnalysis}
          emailSubject={emailSubject}
          emailBody={emailBody}
          profileDisplayName={profileDisplayName}
          anonExportId="cv-export-target-anon"
          cvId={cvId}
          gehaltsvorstellung={gehaltsvorstellung}
          kuendigungsfrist={kuendigungsfrist}
          nearestCity={nearestCity || ''}
          onClose={() => setShowPlacement(false)}
        />
      )}
    </div>
  );
}
