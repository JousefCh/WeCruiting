import ModernTemplate from './ModernTemplate';
import KlassischTemplate from './KlassischTemplate';
import KreativTemplate from './KreativTemplate';
import ElegantTemplate from './ElegantTemplate';
import MinimalTemplate from './MinimalTemplate';

export const TEMPLATES = [
  {
    id: 'Modern',
    name: 'Modern',
    description: 'Zweispaltig mit farbiger Sidebar',
    component: ModernTemplate,
  },
  {
    id: 'Klassisch',
    name: 'Klassisch',
    description: 'Traditionelles deutsches Format',
    component: KlassischTemplate,
  },
  {
    id: 'Kreativ',
    name: 'Kreativ',
    description: 'Modernes asymmetrisches Layout',
    component: KreativTemplate,
  },
  {
    id: 'Elegant',
    name: 'Elegant',
    description: 'Serifenschrift, viel Weißraum',
    component: ElegantTemplate,
  },
  {
    id: 'Minimal',
    name: 'Minimal',
    description: 'Typografie-getrieben, klar',
    component: MinimalTemplate,
  },
];

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
}

export const FONT_OPTIONS = [
  { id: 'Inter, sans-serif', name: 'Inter (Modern)' },
  { id: "'Montserrat', sans-serif", name: 'Montserrat (Kreativ)' },
  { id: "'Source Sans 3', sans-serif", name: 'Source Sans (Klar)' },
  { id: "'Playfair Display', serif", name: 'Playfair (Elegant)' },
  { id: "Georgia, serif", name: 'Georgia (Klassisch)' },
];

export const COLOR_PRESETS = [
  '#005542', // WeCruiting green
  '#1e40af', // blue
  '#7c3aed', // purple
  '#dc2626', // red
  '#d97706', // amber
  '#111827', // charcoal
  '#0f766e', // teal
  '#be185d', // pink
];
