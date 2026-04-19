import { Link } from 'react-router-dom';

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/login" className="text-brand text-sm hover:underline">&larr; Zurück</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Datenschutzerklärung</h1>
          <p className="text-gray-500 text-sm">Stand: April 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">

          <Section title="1. Verantwortlicher">
            <p>
              Verantwortlicher für die Datenverarbeitung auf dieser Website ist:
            </p>
            <div className="pl-4 border-l-2 border-brand">
              <p className="font-semibold">WeCruiting Consulting GmbH</p>
              <p>Ruhrstraße 4a</p>
              <p>63452 Hanau</p>
              <p>
                E-Mail:{' '}
                <a href="mailto:info@wecruiting.de" className="text-brand hover:underline">
                  info@wecruiting.de
                </a>
              </p>
            </div>
          </Section>

          <Section title="2. Erhobene Daten und Verarbeitungszwecke">
            <p>
              <strong>a) Server-Logfiles</strong><br />
              Beim Aufruf unserer Website werden automatisch Informationen erfasst, die Ihr Browser
              übermittelt (IP-Adresse, Datum/Uhrzeit, aufgerufene Seite, Browsertyp). Diese Daten sind
              technisch erforderlich und werden nicht mit anderen Daten zusammengeführt.
            </p>
            <p>
              <strong>b) Registrierung und Nutzerkonto</strong><br />
              Zur Nutzung von WeCruiting ist eine Registrierung erforderlich. Dabei erheben wir:
              vollständiger Name, E-Mail-Adresse und Passwort (gespeichert als sicherer bcrypt-Hash).
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>
            <p>
              <strong>c) Lebenslaufdaten</strong><br />
              Die von Ihnen erstellten Lebensläufe (persönliche Angaben, Berufserfahrung, Ausbildung,
              Kenntnisse etc.) werden auf unseren Servern gespeichert, um den Dienst bereitzustellen.
              Diese Daten gehören ausschließlich Ihnen und werden nicht an Dritte weitergegeben.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
            </p>
          </Section>

          <Section title="3. Speicherdauer">
            <p>
              Personenbezogene Daten werden gelöscht, sobald sie für den Verarbeitungszweck nicht mehr
              benötigt werden. Kontodaten und zugehörige Lebensläufe werden nach Löschung des Kontos
              innerhalb von 30 Tagen entfernt, sofern keine gesetzlichen Aufbewahrungsfristen
              entgegenstehen.
            </p>
          </Section>

          <Section title="4. Weitergabe von Daten">
            <p>
              Ihre personenbezogenen Daten werden nicht an Dritte weitergegeben, es sei denn, wir sind
              gesetzlich dazu verpflichtet oder Sie haben ausdrücklich eingewilligt. Eine Übermittlung
              in Drittländer außerhalb der EU findet nicht statt.
            </p>
          </Section>

          <Section title="5. Ihre Rechte als betroffene Person">
            <p>Gemäß DSGVO stehen Ihnen folgende Rechte zu:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Auskunft</strong> über gespeicherte Daten (Art. 15 DSGVO)</li>
              <li><strong>Berichtigung</strong> unrichtiger Daten (Art. 16 DSGVO)</li>
              <li><strong>Löschung</strong> Ihrer Daten (Art. 17 DSGVO)</li>
              <li><strong>Einschränkung</strong> der Verarbeitung (Art. 18 DSGVO)</li>
              <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
              <li><strong>Widerspruch</strong> gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p>
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{' '}
              <a href="mailto:info@wecruiting.de" className="text-brand hover:underline">
                info@wecruiting.de
              </a>
            </p>
          </Section>

          <Section title="6. Beschwerderecht">
            <p>
              Sie haben das Recht, sich bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren.
              Die zuständige Behörde richtet sich nach Ihrem Wohnort (in Hessen: Hessischer Beauftragter
              für Datenschutz und Informationsfreiheit).
            </p>
          </Section>

          <Section title="7. Datensicherheit">
            <p>
              Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten vor unbefugtem
              Zugriff zu schützen. Passwörter werden ausschließlich verschlüsselt (bcrypt) gespeichert.
              Die Datenübertragung erfolgt über HTTPS/TLS-Verschlüsselung.
            </p>
          </Section>

          <Section title="8. Cookies und lokaler Speicher">
            <p>
              Diese Website verwendet keine Tracking-Cookies. Zur Authentifizierung wird ein
              JWT-Token im lokalen Speicher Ihres Browsers (localStorage) gespeichert. Dieses Token
              dient ausschließlich der Sitzungsverwaltung und enthält keine sensiblen persönlichen Daten.
              Das Token wird beim Abmelden automatisch gelöscht.
            </p>
          </Section>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 flex flex-wrap gap-3 items-center justify-between">
            <span>WeCruiting Consulting GmbH &mdash; Ruhrstraße 4a, 63452 Hanau &mdash; Stand: April 2026</span>
            <div className="flex gap-4">
              <Link to="/impressum" className="hover:text-brand transition-colors">Impressum</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
