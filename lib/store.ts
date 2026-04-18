import fs from 'fs';
import path from 'path';

export interface App {
  id: string;
  name: string;
  description: string;
  image: string;
  downloadLink: string;
  category: string;
  version: string;
  size: string;
  downloads: number;
  createdAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'apps.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

export function getApps(): App[] {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

export function getApp(id: string): App | undefined {
  return getApps().find(a => a.id === id);
}

export function saveApp(app: App): void {
  ensureDataFile();
  const apps = getApps();
  const idx = apps.findIndex(a => a.id === app.id);
  if (idx >= 0) apps[idx] = app;
  else apps.unshift(app);
  fs.writeFileSync(DATA_FILE, JSON.stringify(apps, null, 2));
}

export function deleteApp(id: string): void {
  ensureDataFile();
  const apps = getApps().filter(a => a.id !== id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(apps, null, 2));
}

export function incrementDownloads(id: string): void {
  const apps = getApps();
  const app = apps.find(a => a.id === id);
  if (app) { app.downloads = (app.downloads || 0) + 1; }
  fs.writeFileSync(DATA_FILE, JSON.stringify(apps, null, 2));
}
