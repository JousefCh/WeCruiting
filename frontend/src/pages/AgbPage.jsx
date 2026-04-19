import { Link } from 'react-router-dom';

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function AgbPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/login" className="text-brand text-sm hover:underline">&larr; Zurück</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-gray-500 text-sm">Stand: April 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">

          <Section title="§ 1 Geltungsbereich">
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen der
              WeCruiting Consulting GmbH, Ruhrstraße 4a, 63452 Hanau (nachfolgend „Anbieter") und
              den Nutzern der Plattform WeCruiting (nachfolgend „Nutzer").
            </p>
          </Section>

          <Section title="§ 2 Leistungsbeschreibung">
            <p>
              WeCruiting ist ein Online-Tool zur Erstellung professioneller Lebensläufe.
              Nutzer können Lebensläufe anhand von Vorlagen erstellen, bearbeiten und als PDF herunterladen.
              Der Anbieter stellt die Plattform im Rahmen der technischen und betrieblichen Möglichkeiten
              zur Verfügung.
            </p>
          </Section>

          <Section title="§ 3 Registrierung und Nutzerkonto">
            <p>
              Die Nutzung von WeCruiting setzt eine kostenlose Registrierung voraus. Der Nutzer ist
              verpflichtet, wahrheitsgemäße Angaben zu machen und seine Zugangsdaten vertraulich
              zu behandeln. Eine Weitergabe der Zugangsdaten an Dritte ist nicht gestattet.
            </p>
          </Section>

          <Section title="§ 4 Pflichten des Nutzers">
            <p>
              Der Nutzer verpflichtet sich, die Plattform nicht missbräuchlich zu nutzen und keine
              rechtswidrigen Inhalte einzustellen. Insbesondere ist es untersagt, Inhalte Dritter
              ohne deren Einwilligung zu verwenden.
            </p>
          </Section>

          <Section title="§ 5 Haftungsbeschränkung">
            <p>
              Der Anbieter haftet nicht für die Richtigkeit und Vollständigkeit der vom Nutzer
              eingegebenen Daten. Die Haftung für mittelbare Schäden, entgangenen Gewinn sowie
              Datenverlust ist ausgeschlossen, sofern kein grob fahrlässiges oder vorsätzliches
              Handeln des Anbieters vorliegt.
            </p>
          </Section>

          <Section title="§ 6 Verfügbarkeit">
            <p>
              Der Anbieter bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit der
              Plattform, kann diese jedoch nicht garantieren. Wartungsarbeiten werden nach Möglichkeit
              außerhalb der Hauptnutzungszeiten durchgeführt.
            </p>
          </Section>

          <Section title="§ 7 Kündigung">
            <p>
              Nutzer können ihr Konto jederzeit ohne Angabe von Gründen löschen. Mit der Löschung
              werden alle gespeicherten Daten innerhalb von 30 Tagen unwiderruflich entfernt.
              Der Anbieter behält sich das Recht vor, Konten bei schwerwiegenden Verstößen gegen
              diese AGB zu sperren oder zu löschen.
            </p>
          </Section>

          <Section title="§ 8 Änderungen der AGB">
            <p>
              Der Anbieter behält sich vor, diese AGB mit angemessener Ankündigungsfrist zu ändern.
              Nutzer werden über wesentliche Änderungen per E-Mail informiert. Die fortgesetzte
              Nutzung der Plattform nach Inkrafttreten der Änderungen gilt als Zustimmung.
            </p>
          </Section>

          <Section title="§ 9 Anwendbares Recht und Gerichtsstand">
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Hanau,
              sofern der Nutzer Kaufmann ist oder keinen allgemeinen Gerichtsstand in Deutschland hat.
            </p>
          </Section>

          <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 flex flex-wrap gap-3 items-center justify-between">
            <span>WeCruiting Consulting GmbH &mdash; Ruhrstraße 4a, 63452 Hanau &mdash; Stand: April 2026</span>
            <div className="flex gap-4">
              <Link to="/impressum" className="hover:text-brand transition-colors">Impressum</Link>
              <Link to="/datenschutz" className="hover:text-brand transition-colors">Datenschutz</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
