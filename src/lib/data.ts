import type { Category, Dish } from './types';

export const CATEGORIES: { id: Category; name: string; emoji: string; color: string }[] = [
  { id: 'hamburger', name: 'Hamburger', emoji: '🍔', color: '#c65a3c' },
  { id: 'insalatone', name: 'Insalatone', emoji: '🥗', color: '#6f9a6a' },
  { id: 'focacce', name: 'Focacce', emoji: '🥪', color: '#e3a83a' },
  { id: 'dolci', name: 'Pizze dolci', emoji: '🍫', color: '#8a6aa0' },
  { id: 'fritti', name: 'Friggitoria', emoji: '🍟', color: '#5b8db8' },
];

export const catOf = (id: Category) => CATEGORIES.find((c) => c.id === id)!;

const d = (
  id: string,
  name: string,
  category: Category,
  ingredients: string[],
  verify = false,
): Dish => ({ id, name, category, ingredients, ...(verify ? { verify } : {}) });

export const MENU_VERSION = 2;

/** vecchie ricette di default, per aggiornarle nei salvataggi solo se l'utente non le ha modificate */
export const OLD_DEFAULTS: Record<string, string[]> = {
  bueno: ['nutella', 'nutella bianca', 'nocciola'],
  tronky: ['nutella', 'pistacchio', 'tronky'],
};

export const DEFAULT_DISHES: Dish[] = [
  // Hamburger (panini buns, serviti con patatine fritte)
  d('esplosivo', 'Esplosivo', 'hamburger', ['pulled pork', 'stracciatella', 'valeriana', 'pomodori secchi', 'peperoncino']),
  d('senza-fine', 'Senza Fine', 'hamburger', ['hamburger di fassona', 'cheddar', 'bacon', 'insalata', 'pomodoro', 'maionese']),
  d('tenero', 'Tenero', 'hamburger', ['bocconcini di pollo', 'insalata', 'scamorza', 'bacon', 'salsa boscaiola']),
  d('esagerato', 'Esagerato', 'hamburger', ['hamburger di fassona', 'bacon', 'cheddar', 'anelli di cipolla', 'pomodoro', 'valeriana', 'salsa burger']),
  d('esagerato-pollo', 'Esagerato Pollo', 'hamburger', ['cotoletta di pollo', 'bacon', 'cheddar', 'anelli di cipolla', 'pomodoro', 'valeriana', 'salsa BBQ']),
  d('buono-cosi', 'Buono Così', 'hamburger', ['veggie burger', 'insalata', 'frigitelli', 'salsa guacamole']),
  // Insalatone (servite con pane pizza)
  d('rustica', 'Rustica', 'insalatone', ['insalata iceberg', 'pomodorini', 'tonno', 'olive leccine']),
  d('chicken', 'Chicken', 'insalatone', ['insalata iceberg', 'valeriana', 'pomodori', 'pollo fritto', 'grana', 'salsa caesar']),
  d('delicata', 'Delicata', 'insalatone', ['insalata iceberg', 'pomodori', 'bresaola', 'mozzarella']),
  // Focacce (impasto di pizza)
  d('cotoletta-focaccia', 'Cotoletta', 'focacce', ['cotoletta', 'condimenti a scelta']),
  d('kebab', 'Kebab', 'focacce', ['kebab', 'condimenti a scelta']),
  d('hamburger-classico', 'Hamburger Classico', 'focacce', ['hamburger', 'insalata', 'maionese', 'pomodori', 'cheddar'], true),
  d('italiana', 'Italiana', 'focacce', ['crudo', 'fior di latte', 'rucola', 'pomodori', 'grana', 'olio']),
  d('sfiziosa', 'Sfiziosa', 'focacce', ['porchetta di Ariccia', 'pomodori secchi', 'crema di funghi', 'patate saltate', 'valeriana']),
  d('hot-dog', 'Hot Dog', 'focacce', ['würstel', 'cheddar', 'bacon', 'cipolla croccante', 'insalata', 'salsa hamburger']),
  // Pizze dolci
  d('bacio', 'Pizza Bacio', 'dolci', ['nutella']),
  d('bueno', 'Pizza Bueno', 'dolci', ['nutella', 'nutella bianca', 'kinder bueno', 'granella di nocciola']),
  d('tronky', 'Pizza Tronky Green', 'dolci', ['nutella', 'crema di pistacchio', 'tronky', 'scaglie di cioccolato bianco']),
  d('calzone-maxi', 'Calzone maxi', 'dolci', ['nutella']),
  d('pasta-fritta', 'Pasta fritta', 'dolci', ['nutella']),
  // Friggitoria (porzioni)
  d('mista', 'Friggitoria mista (11 pz)', 'fritti', ['2 crocchette', '2 calzoncini', '3 pittule', '4 mini arancini']),
  d('friggitoria-max', 'Friggitoria Max', 'fritti', ['patatine', '3 crocchette', '3/4 pittule', '3/4 calzoncini', '4/5 mini arancini']),
  d('anelli', 'Anelli di cipolla', 'fritti', ['8 pezzi']),
  d('bocconcini', 'Bocconcini pollo', 'fritti', ['10 pezzi']),
  d('pittule', 'Pittule', 'fritti', ['11 pezzi']),
  d('panzerotti', 'Panzerotti', 'fritti', ['11 pezzi']),
];

/** ingredienti delle pizze del menu (le pizze non sono ancora piatti dell'app): compaiono solo nella lista ingredienti */
export const PIZZA_INGREDIENTS: string[] = [
  'pomodoro', 'pelato giallo', 'San Marzano DOP', 'fior di latte', 'mozzarella di bufala', 'Bufala DOP', 'olive', 'olive leccine',
  'salamino piccante', 'acciughe', 'capperi', 'scamorza affumicata', 'pancetta', 'filetto di tonno', 'cipolla', 'patatine fritte',
  'würstel', 'prosciutto cotto', 'funghi', 'funghi porcini', 'funghi misti', 'funghi freschi', 'crema di funghi', 'pomodorini freschi',
  'pomodorini scattarisciati', 'rucola', 'Grana Padano DOP', 'Parmigiano Reggiano', 'crudo', 'carciofi', 'melanzane', 'melanzane fritte',
  'peperoni', 'zucchine', 'salsiccia', 'friarielli', 'Emmenthal', 'Gorgonzola', 'crema al gorgonzola', 'bresaola', 'stracciatella',
  'Mortadella IGP', 'mortadella', 'granella di pistacchio', 'speck', 'noci', 'mandorle', 'burrata', 'spianata piccante',
  'panzerotti di patate', 'capocollo di Martina Franca', 'gamberetti', 'salmone', 'chips di zucchine impanate', 'crema di zucca',
  'salsiccia di Norcia', 'patate al forno', 'provola', 'frigitelli piccanti fritti', 'basilico', 'crocchette di patate',
  'porchetta di Ariccia', 'peperoncino piccante', 'crema cacio e pepe', 'guanciale croccante', 'olio', 'polpette di carne fritte',
  'cicoria', 'pancetta coppata', 'radicchio julienne', 'glassa di aceto balsamico', 'pesto di basilico', 'julienne di zucchine fritte',
  'caglio ricotta', 'crema di radicchio e speck', 'crema di zucchine', 'spinaci', 'valeriana', 'noci',
];
