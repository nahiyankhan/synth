/**
 * IndexedDB Persistence for Design Languages
 *
 * Stores multiple design languages with their metadata and full StyleGraph data
 */

import { ContentData } from '../types/content';

const DB_NAME = 'design-language-agent';
const DB_VERSION = 4;
const LANGUAGES_STORE = 'design-languages';
const DATA_STORE = 'design-system-data';

export interface DesignLanguageMetadata {
  id: string;
  name: string;
  description: string;
  tokenCount: number;
  lastModified: string;
  createdAt: string;
  primaryColor?: string;
  generationMetadata?: {
    prompt?: string;
    generatedAt?: string;
    brandContext?: {
      visualDirection?: {
        summary?: string;
        coreMessage?: string;
        direction?: string;
        name?: string;
        traits?: string[];
        voiceTone?: string;
        visualReferences?: string[];
        designPrinciples?: string[];
        emotionalResonance?: string[];
        aestheticPreferences?: string[];
      };
    };
    tailwindColorSeeds?: {
      primaryHue?: number;
      primaryChroma?: number;
      hasSecondary?: boolean;
      secondaryHue?: number;
      secondaryChroma?: number;
      hasTertiary?: boolean;
      tertiaryHue?: number;
      tertiaryChroma?: number;
      grayWarmth?: number;
      graySaturation?: number;
      reasoning?: string;
    };
    foundationSeeds?: {
      typographyScaleRatio?: string;
      shadowIntensity?: string;
      shadowColorStyle?: string;
      shadowBlurStyle?: string;
      reasoning?: string;
    };
    tailwindColorSystem?: {
      paletteNames?: string[];
      overlaps?: Array<{
        role: string;
        requestedHue: number;
        mappedTo: string;
        conflictedWith: string;
        resolution: string;
      }>;
      roleMapping?: Record<string, string>;
    };
    tailwindCSS?: string;
    componentCSS?: string;
    fullCSS?: string;
  };
}

export interface DesignSystemData {
  id: string;
  styleGraphJSON: string;
  contentData?: ContentData;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB database
 */
export async function initDesignLanguageDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(LANGUAGES_STORE)) {
        const languageStore = db.createObjectStore(LANGUAGES_STORE, { keyPath: 'id' });
        languageStore.createIndex('name', 'name', { unique: false });
        languageStore.createIndex('lastModified', 'lastModified', { unique: false });
      }

      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE, { keyPath: 'id' });
      }
    };
  });
}

async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    await initDesignLanguageDB();
  }
  return dbInstance!;
}

export async function saveDesignLanguage(
  metadata: DesignLanguageMetadata,
  styleGraphJSON: string,
  contentData?: ContentData
): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LANGUAGES_STORE, DATA_STORE], 'readwrite');

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();

    const metadataStore = transaction.objectStore(LANGUAGES_STORE);
    metadataStore.put(metadata);

    const dataStore = transaction.objectStore(DATA_STORE);
    dataStore.put({
      id: metadata.id,
      styleGraphJSON,
      contentData,
    });
  });
}

export async function loadDesignLanguageMetadata(id: string): Promise<DesignLanguageMetadata | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LANGUAGES_STORE], 'readonly');
    const store = transaction.objectStore(LANGUAGES_STORE);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function loadDesignLanguageData(id: string): Promise<string | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DATA_STORE], 'readonly');
    const store = transaction.objectStore(DATA_STORE);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as DesignSystemData | undefined;
      resolve(result?.styleGraphJSON || null);
    };
  });
}

export async function getAllDesignLanguages(): Promise<DesignLanguageMetadata[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LANGUAGES_STORE], 'readonly');
    const store = transaction.objectStore(LANGUAGES_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const languages = request.result as DesignLanguageMetadata[];
      languages.sort((a, b) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
      resolve(languages);
    };
  });
}

export async function deleteDesignLanguage(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LANGUAGES_STORE, DATA_STORE], 'readwrite');

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();

    const metadataStore = transaction.objectStore(LANGUAGES_STORE);
    metadataStore.delete(id);

    const dataStore = transaction.objectStore(DATA_STORE);
    dataStore.delete(id);
  });
}

export async function designLanguageExists(id: string): Promise<boolean> {
  const metadata = await loadDesignLanguageMetadata(id);
  return metadata !== null;
}

export async function updateDesignLanguageMetadata(
  id: string,
  updates: Partial<Omit<DesignLanguageMetadata, 'id'>>
): Promise<void> {
  const db = await getDB();
  const existing = await loadDesignLanguageMetadata(id);

  if (!existing) {
    throw new Error(`Design language ${id} not found`);
  }

  const updated: DesignLanguageMetadata = {
    ...existing,
    ...updates,
    lastModified: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LANGUAGES_STORE], 'readwrite');
    const store = transaction.objectStore(LANGUAGES_STORE);
    const request = store.put(updated);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getDesignLanguage(id: string): Promise<any | null> {
  const metadata = await loadDesignLanguageMetadata(id);
  if (!metadata) {
    return null;
  }

  const dataJSON = await loadDesignLanguageData(id);
  if (!dataJSON) {
    return null;
  }

  try {
    const designSystem = JSON.parse(dataJSON);
    return {
      ...metadata,
      designSystem,
    };
  } catch (error) {
    console.error('Failed to parse design system data:', error);
    return null;
  }
}

export async function loadContentData(id: string): Promise<ContentData | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DATA_STORE], 'readonly');
    const store = transaction.objectStore(DATA_STORE);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as DesignSystemData | undefined;
      resolve(result?.contentData || null);
    };
  });
}

export async function saveContentData(id: string, contentData: ContentData): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DATA_STORE], 'readwrite');
    const store = transaction.objectStore(DATA_STORE);
    const getRequest = store.get(id);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const existing = getRequest.result as DesignSystemData | undefined;
      if (!existing) {
        reject(new Error(`Design language ${id} not found`));
        return;
      }

      const updated: DesignSystemData = {
        ...existing,
        contentData,
      };

      const putRequest = store.put(updated);
      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    };
  });
}
