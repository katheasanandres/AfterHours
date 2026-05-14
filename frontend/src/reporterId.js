const KEY = 'ah_reporter_id';

/** Generates a random UUID-like string */
function generateId() {
  // crypto.randomUUID() is available in all modern browsers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getReporterId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function rotateReporterId() {
  const newId = generateId();
  localStorage.setItem(KEY, newId);
  return newId;
}

export function clearReporterId() {
  localStorage.removeItem(KEY);
}
