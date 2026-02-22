/**
 * Database Debug Utilities
 *
 * Run these commands in the browser console to inspect database contents.
 * Import and attach to window for easy access:
 *
 * import * as dbDebug from './utils/dbDebug';
 * (window as any).dbDebug = dbDebug;
 */

import { getAllSessions, getSessionItems } from "@/services/dbService";
import {
  getAllDesignLanguages,
  loadDesignLanguageData,
  loadDesignLanguageMetadata,
} from "@/services/designLanguageDB";

/**
 * View all voice sessions
 */
export async function viewSessions() {
  const sessions = await getAllSessions();
  console.group("📊 All Voice Sessions");
  console.table(
    sessions.map((s) => ({
      sessionId: s.sessionId,
      name: s.name,
      startTime: new Date(s.startTime).toLocaleString(),
      items: s.itemCount,
    }))
  );
  console.groupEnd();
  return sessions;
}

/**
 * View session details
 */
export async function viewSession(sessionId: string) {
  const items = await getSessionItems(sessionId);
  console.group(`🎤 Session: ${sessionId}`);
  console.log(`Total items: ${items.length}`);
  items.forEach((item, idx) => {
    console.log(`\n--- Item ${idx + 1} ---`);
    console.log("Timestamp:", new Date(item.timestamp).toLocaleString());
    console.log("User Input:", item.userInput);
    console.log("Type:", item.type);
    if (item.data) {
      console.log("Has data:", item.data.substring(0, 50) + "...");
    }
  });
  console.groupEnd();
  return items;
}

/**
 * View all design languages
 */
export async function viewDesignLanguages() {
  const languages = await getAllDesignLanguages();
  console.group("🎨 All Design Languages");
  console.table(
    languages.map((lang) => ({
      id: lang.id,
      name: lang.name,
      description: lang.description,
      tokens: lang.tokenCount,
      lastModified: new Date(lang.lastModified).toLocaleString(),
      created: new Date(lang.createdAt).toLocaleString(),
    }))
  );
  console.groupEnd();
  return languages;
}

/**
 * View a specific design language in detail
 */
export async function viewDesignLanguage(id: string) {
  const metadata = await loadDesignLanguageMetadata(id);
  const data = await loadDesignLanguageData(id);

  console.group(`🎨 Design Language: ${id}`);
  console.log("Metadata:", metadata);

  if (data) {
    const parsed = JSON.parse(data);
    console.log("StyleGraph Keys:", Object.keys(parsed));
    console.log("Full Data:", parsed);
  }
  console.groupEnd();

  return { metadata, data: data ? JSON.parse(data) : null };
}

/**
 * Export all database contents as JSON
 */
export async function exportAllData() {
  const sessions = await getAllSessions();
  const languages = await getAllDesignLanguages();

  const sessionDetails = await Promise.all(
    sessions.map(async (s) => ({
      ...s,
      items: await getSessionItems(s.sessionId),
    }))
  );

  const languageDetails = await Promise.all(
    languages.map(async (lang) => ({
      metadata: lang,
      data: await loadDesignLanguageData(lang.id),
    }))
  );

  const exportData = {
    exportDate: new Date().toISOString(),
    voiceSessions: sessionDetails,
    designLanguages: languageDetails,
  };

  console.log("✅ Export complete");
  return exportData;
}

/**
 * Download database as JSON file
 */
export async function downloadDatabase() {
  const data = await exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `database-export-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log("✅ Database downloaded");
}


/**
 * Get database statistics
 */
export async function getStats() {
  const sessions = await getAllSessions();
  const languages = await getAllDesignLanguages();

  const totalHistoryItems = sessions.reduce((sum, s) => sum + s.itemCount, 0);
  const totalTokens = languages.reduce((sum, lang) => sum + lang.tokenCount, 0);

  const stats = {
    voiceSessions: {
      count: sessions.length,
      totalHistoryItems,
      oldestSession:
        sessions.length > 0
          ? new Date(
              Math.min(...sessions.map((s) => s.startTime))
            ).toLocaleString()
          : "N/A",
      newestSession:
        sessions.length > 0
          ? new Date(
              Math.max(...sessions.map((s) => s.startTime))
            ).toLocaleString()
          : "N/A",
    },
    designLanguages: {
      count: languages.length,
      totalTokens,
      languages: languages.map((l) => l.name),
    },
  };

  console.group("📈 Database Statistics");
  console.log("Voice Sessions:", stats.voiceSessions);
  console.log("Design Languages:", stats.designLanguages);
  console.groupEnd();

  return stats;
}

// Quick reference guide
export function help() {
  console.log(`
🔍 Database Debug Commands:

📊 Voice Sessions:
  - viewSessions()           View all sessions
  - viewSession(sessionId)   View specific session details
  
🎨 Design Languages:
  - viewDesignLanguages()    View all design languages
  - viewDesignLanguage(id)   View specific design language
  
📈 Utilities:
  - getStats()               Get database statistics
  - exportAllData()          Export all data as JSON
  - downloadDatabase()       Download database as JSON file
  - help()                   Show this help

💡 Tip: All functions return data that you can inspect
  `);
}
