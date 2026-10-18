export interface ChefSkin {
  id: string;
  name: string;
  cost: number;
  hat: string;
  shirt: string;
  apron: string;
}

export const SKINS: ChefSkin[] = [
  { id: 'classic', name: 'Classico', cost: 0, hat: '#ffffff', shirt: '#f4f4f8', apron: '#d93a3a' },
  { id: 'rosso', name: 'Pomodoro', cost: 300, hat: '#e53935', shirt: '#e53935', apron: '#ffffff' },
  { id: 'nero', name: 'Chef Nero', cost: 600, hat: '#2b2b35', shirt: '#2b2b35', apron: '#9aa0a6' },
  { id: 'oro', name: 'Oro', cost: 1000, hat: '#ffd24a', shirt: '#ffe082', apron: '#b8860b' },
  { id: 'neon', name: 'Neon', cost: 1800, hat: '#b388ff', shirt: '#4cc9f0', apron: '#ff3d81' },
];
