import { useState, useEffect } from 'react';

const STORAGE_KEY = 'jode-favorites';
const CHANGE_EVENT = 'jode-favorites-changed';

function readFavorites(): number[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function writeFavorites(ids: number[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(readFavorites);

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggle = (id: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      writeFavorites(next);
      return next;
    });
  };

  const isFavorite = (id: number) => favorites.includes(id);

  return { favorites, toggle, isFavorite, count: favorites.length };
}
