import type { Category, Dish } from './types';

export const CATEGORIES: { id: Category; name: string; emoji: string; color: string }[] = [
  { id: 'hamburger', name: 'Hamburger', emoji: '🍔', color: '#c65a3c' },
  { id: 'insalatone', name: 'Insalatone', emoji: '🥗', color: '#6f9a6a' },
  { id: 'focacce', name: 'Focacce', emoji: '🥪', color: '#e3a83a' },
  { id: 'classiche', name: 'Pizze classiche', emoji: '🍕', color: '#b8432f' },
  { id: 'speciali', name: 'Pizze speciali', emoji: '⭐', color: '#4f7f6a' },
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

export const MENU_VERSION = 3;

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
  // Pizze classiche (dal menu stampato)
  d('pz-margherita', 'Margherita', 'classiche', ['pomodoro', 'fior di latte', 'olive']),
  d('pz-diavola', 'Diavola', 'classiche', ['pomodoro', 'fior di latte', 'salamino piccante', 'olive leccine']),
  d('pz-napoli', 'Napoli', 'classiche', ['pomodoro', 'fior di latte', 'acciughe', 'capperi', 'olive leccine']),
  d('pz-bufala', 'Bufala', 'classiche', ['pomodoro', 'Bufala DOP']),
  d('pz-fume', 'Fumè', 'classiche', ['pomodoro', 'fior di latte', 'scamorza affumicata', 'pancetta']),
  d('pz-tonno-cipolla', 'Tonno e cipolla', 'classiche', ['pomodoro', 'fior di latte', 'filetto di tonno', 'cipolla', 'olive leccine']),
  d('pz-pata-wurstel', 'Pata-würstel', 'classiche', ['pomodoro', 'fior di latte', 'patatine fritte', 'würstel']),
  d('pz-cotto-funghi', 'Cotto e funghi', 'classiche', ['pomodoro', 'fior di latte', 'prosciutto cotto', 'funghi']),
  d('pz-caprese', 'Caprese', 'classiche', ['fior di latte', 'pomodorini freschi', 'rucola', 'Grana Padano DOP']),
  d('pz-italiana', 'Italiana', 'classiche', ['pomodoro', 'fior di latte', 'crudo', 'Grana Padano DOP', 'rucola']),
  d('pz-quattro-stagioni', 'Quattro stagioni', 'classiche', ['pomodoro', 'fior di latte', 'prosciutto cotto', 'funghi', 'carciofi']),
  d('pz-vegetariana', 'Vegetariana', 'classiche', ['pomodoro', 'fior di latte', 'melanzane', 'peperoni', 'zucchine']),
  d('pz-salsiccia-friarielli', 'Salsiccia e friarielli', 'classiche', ['pomodoro', 'fior di latte', 'salsiccia', 'friarielli']),
  d('pz-quattro-formaggi', 'Quattro formaggi', 'classiche', ['pomodoro', 'fior di latte', 'Emmenthal', 'Gorgonzola', 'Grana Padano DOP']),
  d('pz-principessa', 'Principessa', 'classiche', ['fior di latte', 'bresaola', 'rucola', 'Grana Padano DOP']),
  d('pz-core-a-core', 'Core a core', 'classiche', ['pomodoro', 'Bufala DOP', 'funghi porcini']),
  // Pizze speciali ("Del mese" cambia ogni mese: non è una ricetta da imparare)
  d('pz-boscaiola', 'Boscaiola', 'speciali', ['fior di latte', 'crema di funghi', 'funghi misti', 'funghi freschi']),
  d('pz-bologna', 'Bologna', 'speciali', ['pomodoro', 'fior di latte', 'stracciatella', 'Mortadella IGP', 'granella di pistacchio']),
  d('pz-alpina', 'Alpina', 'speciali', ['pomodoro', 'fior di latte', 'speck', 'crema al gorgonzola', 'noci']),
  d('pz-panzerottina', 'Panzerottina', 'speciali', ['pomodoro', 'fior di latte', 'burrata', 'spianata piccante', 'panzerotti di patate']),
  d('pz-selvatica', 'Selvatica', 'speciali', ['pomodoro', 'fior di latte', 'capocollo di Martina Franca', 'stracciatella', 'valeriana', 'noci']),
  d('pz-scoglio', 'Scoglio', 'speciali', ['fior di latte', 'gamberetti', 'salmone', 'chips di zucchine impanate']),
  d('pz-autunno', 'Autunno', 'speciali', ['crema di zucca', 'fior di latte', 'salsiccia di Norcia', 'patate al forno', 'provola']),
  d('pz-paesana', 'Paesana', 'speciali', ['fior di latte', 'pomodorini scattarisciati', 'frigitelli piccanti fritti', 'capocollo di Martina Franca', 'basilico']),
  d('pz-romantica', 'Romantica', 'speciali', ['fior di latte', 'crocchette di patate', 'melanzane fritte', 'porchetta di Ariccia', 'peperoncino piccante']),
  d('pz-romana', 'Romana', 'speciali', ['crema cacio e pepe', 'fior di latte', 'guanciale croccante']),
  d('pz-extra-regina', 'Extra Regina', 'speciali', ['San Marzano DOP', 'fior di latte', 'Parmigiano Reggiano', 'olio', 'basilico']),
  d('pz-estate', 'Estate', 'speciali', ['pelato giallo', 'fior di latte', 'capocollo di Martina Franca', 'mandorle', 'burrata', 'basilico']),
  d('pz-re-ciccia', 'Re ciccia', 'speciali', ['pomodoro', 'fior di latte', 'polpette di carne fritte', 'patate al forno', 'provola']),
  d('pz-ciociara', 'Ciociara', 'speciali', ['fior di latte', 'cicoria', 'salsiccia di Norcia', 'funghi porcini', 'provola']),
  d('pz-travolgente', 'Travolgente', 'speciali', ['pomodoro', 'fior di latte', 'funghi porcini panati fritti', 'pancetta coppata', 'radicchio julienne', 'glassa di aceto balsamico']),
  d('pz-principino', 'Principino', 'speciali', ['mozzarella di bufala', 'pesto di basilico', 'mortadella', 'julienne di zucchine fritte', 'scaglie di cacioricotta'], true),
  d('pz-core-roll', 'Core roll', 'speciali', ['mozzarella', 'crema di radicchio e speck', 'speck', 'provola', 'burrata', 'mandorle']),
  d('pz-inaspettata', 'Inaspettata (veg)', 'speciali', ['crema di zucchine', 'spinaci', 'funghi porcini', 'mandorle']),
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

/** ingredienti delle pizze del menu, tenuti anche nella lista ingredienti col filtro Pizze */
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
