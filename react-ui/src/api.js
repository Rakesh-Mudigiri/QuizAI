const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function formatErrorMessage(data, status) {
  if (!data || !data.detail) return `Request failed: ${status}`;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map(err => `${err.loc ? err.loc.slice(1).join('.') + ': ' : ''}${err.msg}`).join('; ');
  }
  if (typeof data.detail === 'object') return JSON.stringify(data.detail);
  return String(data.detail);
}

export async function apiGet(url) {
  const res = await fetch(API + url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(formatErrorMessage(data, res.status));
  }
  return res.json();
}

export async function apiPost(url, body) {
  const res = await fetch(API + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(formatErrorMessage(data, res.status));
  }
  return res.json();
}

export async function apiPut(url, body) {
  const res = await fetch(API + url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(formatErrorMessage(data, res.status));
  }
  return res.json();
}

export async function apiForm(url, formData) {
  const res = await fetch(API + url, { method: 'POST', body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(formatErrorMessage(data, res.status));
  }
  return res.json();
}

export async function apiDelete(url) {
  const res = await fetch(API + url, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(formatErrorMessage(data, res.status));
  }
  return res.json();
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

