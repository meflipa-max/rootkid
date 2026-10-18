import type { Category, Dish } from './types';

export const CATEGORIES: { id: Category; name: string; emoji: string; color: string }[] = [
  { id: 'hamburger', name: 'Hamburger', emoji: '🍔', color: '#ff8a3d' },
  { id: 'insalatone', name: 'Insalatone', emoji: '🥗', color: '#2ee59d' },
  { id: 'focacce', name: 'Focacce', emoji: '🥪', color: '#ffd24a' },
  { id: 'dolci', name: 'Pizze dolci', emoji: '🍫', color: '#ff6fb5' },
  { id: 'fritti', name: 'Friggitoria', emoji: '🍟', color: '#4cc9f0' },
];

export const catOf = (id: Category) => CATEGORIES.find((c) => c.id === id)!;

const d = (
  id: string,
  name: string,
  category: Category,
  ingredients: string[],
  verify = false,
): Dish => ({ id, name, category, ingredients, ...(verify ? { verify } : {}) });

export const DEFAULT_DISHES: Dish[] = [
  // Hamburger
  d('esplosivo', 'Esplosivo', 'hamburger', ['pulled', 'stracciatella', 'valeriana', 'pomodori secchi', 'peperoncino'], true),
  d('senza-fine', 'Senza Fine', 'hamburger', ['hamburger', 'cheddar', 'bacon', 'insalata', 'pomodoro', 'maionese']),
  d('tenero', 'Tenero', 'hamburger', ['bocconcini di pollo', 'insalata', 'scamorza', 'bacon', 'salsa boscaiola']),
  d('esagerato', 'Esagerato', 'hamburger', ['hamburger', 'bacon', 'cheddar', 'anelli di cipolla', 'pomodoro', 'valeriana', 'salsa burger']),
  d('esagerato-pollo', 'Esagerato Pollo', 'hamburger', ['cotoletta di pollo', 'bacon', 'cheddar', 'anelli di cipolla', 'pomodoro', 'valeriana', 'salsa BBQ']),
  d('buono-cosi', 'Buono Così', 'hamburger', ['veggie burger', 'insalata', 'frigitelli', 'salsa guacamole']),
  // Insalatone
  d('rustica', 'Rustica', 'insalatone', ['insalata', 'pomodorini', 'tonno', 'olive nere'], true),
  d('chicken', 'Chicken', 'insalatone', ['insalata', 'valeriana', 'pomodorini', 'pollo fritto', 'grana', 'salsa cesar']),
  d('delicata', 'Delicata', 'insalatone', ['insalata', 'pomodori', 'bresaola', 'mozzarella'], true),
  // Focacce
  d('italiana', 'Italiana', 'focacce', ['crudo', 'mozzarella', 'rucola', 'pomodoro', 'grana'], true),
  d('sfiziosa', 'Sfiziosa', 'focacce', ['porchetta', 'pomodori secchi', 'crema di funghi', 'patate al forno', 'valeriana'], true),
  // Pizze dolci
  d('bacio', 'Bacio', 'dolci', ['nutella']),
  d('bueno', 'Bueno', 'dolci', ['nutella', 'nutella bianca', 'nocciola']),
  d('tronky', 'Tronky', 'dolci', ['nutella', 'pistacchio', 'tronky']),
  d('pasta-fritta', 'Pasta fritta', 'dolci', ['nutella']),
  // Friggitoria (porzioni)
  d('mista', 'Friggitoria mista (11 pz)', 'fritti', ['2 crocchette', '2 calzoncini', '3 pittule', '4 mini arancini']),
  d('friggitoria-max', 'Friggitoria Max', 'fritti', ['patatine', '3 crocchette', '3/4 pittule', '3/4 calzoncini', '4/5 mini arancini']),
  d('anelli', 'Anelli di cipolla', 'fritti', ['8 pezzi']),
  d('bocconcini', 'Bocconcini pollo', 'fritti', ['10 pezzi']),
  d('pittule', 'Pittule', 'fritti', ['11 pezzi']),
  d('panzerotti', 'Panzerotti', 'fritti', ['11 pezzi']),
];
