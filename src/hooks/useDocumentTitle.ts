import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    if (title) {
      document.title = `StatusHired · ${title}`;
    } else {
      document.title = 'StatusHired - Career Pipeline & Application Manager';
    }
  }, [title]);
}
