import { Link } from 'react-router-dom';

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/login" className="text-brand text-sm hover:underline">&larr; Zurück</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Impressum</h1>
          <p className="text-gray-500 text-sm">Angaben gemäß § 5 TMG</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 text-sm leading-relaxed">

          {/* Unternehmensangaben */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Unternehmensangaben</h2>
            <div className="pl-4 border-l-2 border-brand space-y-0.5 text-gray-800">
              <p className="font-semibold text-base">WeCruiting Consulting GmbH</p>
              <p>Ruhrstraße 4a</p>
              <p>63452 Hanau</p>
              <p>Deutschland</p>
            </div>
          </section>

          {/* Kontakt */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Kontakt</h2>
            <table className="text-sm">
              <tbody>
                <tr>
                  <td className="pr-8 py-0.5 text-gray-500 align-top">E-Mail</td>
                  <td>
                    <a href="mailto:info@wecruiting.de" className="text-brand hover:underline">
                      info@wecruiting.de
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Handelsregister */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Handelsregister</h2>
            <table className="text-sm">
              <tbody>
                <tr>
                  <td className="pr-8 py-0.5 text-gray-500 align-top">Registergericht</td>
                  <td>Amtsgericht Hanau</td>
                </tr>
                <tr>
                  <td className="pr-8 py-0.5 text-gray-500 align-top">Registernummer</td>
                  <td>HRB 99700</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* USt */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Umsatzsteuer-Identifikationsnummer</h2>
            <p>
              Gemäß § 27a Umsatzsteuergesetz:{' '}
              DE319448869
            </p>
          </section>

          {/* Geschäftsführung */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Vertretungsberechtigte Geschäftsführung</h2>
            <p>Jousef Chamseddine</p>
          </section>

          {/* Verantwortlich für Inhalt */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Verantwortlich für den Inhalt gemäß § 18 Abs. 2 MStV
            </h2>
            <div className="space-y-0.5">
              <p>Jousef Chamseddine</p>
              <p>WeCruiting Consulting GmbH</p>
              <p>Ruhrstraße 4a</p>
              <p>63452 Hanau</p>
            </div>
          </section>

          {/* Streitschlichtung */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">EU-Streitschlichtung</h2>
            <p className="mb-3">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          {/* Haftungsausschluss */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Haftungsausschluss</h2>
            <h3 className="font-medium text-gray-900 mb-1">Haftung für Inhalte</h3>
            <p className="mb-4">
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
              nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
              Tätigkeit hinweisen.
            </p>
            <h3 className="font-medium text-gray-900 mb-1">Haftung für Links</h3>
            <p className="mb-4">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
              Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
              Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
              der Seiten verantwortlich.
            </p>
            <h3 className="font-medium text-gray-900 mb-1">Urheberrecht</h3>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
              dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
              der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
              Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 flex flex-wrap gap-3 items-center justify-between">
            <span>WeCruiting Consulting GmbH &mdash; Ruhrstraße 4a, 63452 Hanau &mdash; Stand: April 2026</span>
            <div className="flex gap-4">
              <Link to="/datenschutz" className="hover:text-brand transition-colors">Datenschutz</Link>
              <Link to="/agb" className="hover:text-brand transition-colors">AGB</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
