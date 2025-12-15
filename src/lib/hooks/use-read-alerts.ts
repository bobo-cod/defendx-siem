// Add this helper hook at the top of alerts page
// src/lib/hooks/use-read-alerts.ts
import { useState, useEffect } from 'react';

export function useReadAlerts() {
  const [readAlerts, setReadAlerts] = useState<string[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('readAlerts') || '[]');
    setReadAlerts(stored);
  }, []);

  const isRead = (alertId: string) => readAlerts.includes(alertId);

  const markAsRead = (alertId: string) => {
    if (!readAlerts.includes(alertId)) {
      const updated = [...readAlerts, alertId];
      setReadAlerts(updated);
      localStorage.setItem('readAlerts', JSON.stringify(updated));
    }
  };

  const markAsUnread = (alertId: string) => {
    const updated = readAlerts.filter(id => id !== alertId);
    setReadAlerts(updated);
    localStorage.setItem('readAlerts', JSON.stringify(updated));
  };

  return { isRead, markAsRead, markAsUnread, readAlerts };
}
