/**
 * Navigation Tools - Landing Page AI Tools
 * 
 * Tools for helping users navigate, select, and manage design languages
 * from the landing page (before a language is loaded).
 */

import { 
  getAllDesignLanguages, 
  getDesignLanguage,
  deleteDesignLanguage,
  DesignLanguageMetadata 
} from '@/services/designLanguageDB';

export interface NavigationToolHandler {
  functionCall: any;
  addLog: (message: string) => void;
  showResult: (result: any) => void;
  navigate: (path: string) => void;
  setSelectedLanguage: (id: string | null) => void;
  sessionPromiseRef: React.MutableRefObject<any> | null;
}

/**
 * Normalize a design language name/ID for fuzzy matching
 * Converts to lowercase and removes spaces, hyphens, underscores
 */
function normalizeId(str: string): string {
  return str.toLowerCase().replace(/[\s\-_]+/g, '');
}

/**
 * Find a design language by ID with fuzzy matching
 * Tries exact match first, then normalized matching
 */
function findDesignSystem(
  languages: DesignLanguageMetadata[],
  searchId: string
): DesignLanguageMetadata | undefined {
  // Try exact match first
  let found = languages.find(lang => lang.id === searchId);
  if (found) return found;

  // Try exact name match
  found = languages.find(lang => lang.name === searchId);
  if (found) return found;

  // Try normalized matching (handles "myapp" vs "my app", "my-app", etc.)
  const normalizedSearch = normalizeId(searchId);
  found = languages.find(lang => 
    normalizeId(lang.id) === normalizedSearch ||
    normalizeId(lang.name) === normalizedSearch
  );

  return found;
}

export const NAVIGATION_TOOLS = [
  // 'list_design_systems', // DELETED - unnecessary
  // 'get_design_system_preview', // DISABLED
  'load_design_system',
  'create_new_design_system',
  'delete_design_system',
  // 'help'
];

export function isNavigationTool(operation: string): boolean {
  return NAVIGATION_TOOLS.includes(operation);
}

/**
 * Handle navigation tool calls from the landing page
 */
export async function handleNavigationTool({
  functionCall,
  addLog,
  showResult,
  navigate,
  setSelectedLanguage,
  sessionPromiseRef,
}: NavigationToolHandler): Promise<void> {
  const operation = functionCall.name === 'execute_operation' 
    ? functionCall.args?.operation 
    : functionCall.name;

  const params = functionCall.name === 'execute_operation'
    ? functionCall.args?.params
    : functionCall.args;

  console.log('🧭 Navigation tool called:', operation, params);

  let result: any = { success: false };

  try {
    switch (operation) {
      // DELETED: list_design_systems - unnecessary
      
      // DISABLED: get_design_system_preview
      // case 'get_design_system_preview': {
      //   const { id } = params;
      //   if (!id) {
      //     result = { success: false, error: 'Design language ID required' };
      //     break;
      //   }

      //   const languages = await getAllDesignLanguages();
      //   const metadata = findDesignSystem(languages, id);
      //   if (!metadata) {
      //     result = { success: false, error: `Design language "${id}" not found. Available: ${languages.map(l => l.name).join(', ')}` };
      //     break;
      //   }

      //   const language = await getDesignLanguage(metadata.id);
      //   const stats = language?.designSystem?.stats || {};

      //   result = {
      //     success: true,
      //     data: {
      //       ...metadata,
      //       stats,
      //       preview: {
      //         totalTokens: stats.totalNodes || metadata.tokenCount,
      //         primitives: stats.primitiveCount || 0,
      //         utilities: stats.utilityCount || 0,
      //         specs: stats.designSpecs || 0,
      //       }
      //     },
      //     message: `Preview loaded for "${metadata.name}"`,
      //   };

      //   showNavigationResult(showResult, 'preview', result.data);
      //   addLog(`👁️ Previewing "${metadata.name}"`);
      //   break;
      // }

      case 'load_design_system': {
        const { id } = params;
        if (!id) {
          result = { success: false, error: 'Design language ID required' };
          break;
        }

        const languages = await getAllDesignLanguages();
        const found = findDesignSystem(languages, id);
        
        if (!found) {
          result = { success: false, error: `Design language "${id}" not found. Available: ${languages.map(l => l.name).join(', ')}` };
          break;
        }

        setSelectedLanguage(found.id);
        navigate('/editor');
        
        result = {
          success: true,
          data: { id: found.id, name: found.name },
          message: `Loading "${found.name}"...`,
        };

        addLog(`🚀 Loading "${found.name}"`);
        break;
      }

      case 'create_new_design_system': {
        navigate('/editor/create');
        
        result = {
          success: true,
          data: {},
          message: 'Starting new design language creation...',
        };

        addLog('✨ Starting new design language creation');
        break;
      }

      case 'delete_design_system': {
        const { id } = params;
        if (!id) {
          result = { success: false, error: 'Design language ID required' };
          break;
        }

        const languages = await getAllDesignLanguages();
        const toDelete = findDesignSystem(languages, id);
        
        if (!toDelete) {
          result = { success: false, error: `Design language "${id}" not found. Available: ${languages.map(l => l.name).join(', ')}` };
          break;
        }

        await deleteDesignLanguage(toDelete.id);
        
        result = {
          success: true,
          data: { id: toDelete.id, name: toDelete.name },
          message: `Deleted "${toDelete.name}"`,
        };

        addLog(`🗑️ Deleted "${toDelete.name}"`);
        break;
      }

      // case 'help': {
      //   result = {
      //     success: true,
      //     data: {
      //       features: [
      //         'Create new design languages from scratch with voice',
      //         'Load existing design languages to edit',
      //         'View color science visualizations (3D, accessibility, etc.)',
      //         'Analyze design language health and redundancies',
      //         'Edit tokens with impact analysis',
      //       ],
      //       nextSteps: [
      //         'Say "list my design languages" to see what you have',
      //         'Say "create a new design language" to start fresh',
      //         'Say "load [name]" to open a language for editing',
      //       ]
      //     },
      //     message: 'Help information displayed',
      //   };

      //   showNavigationResult(showResult, 'help', result.data);
      //   addLog('❓ Showing help');
      //   break;
      // }

      default:
        result = {
          success: false,
          error: `Unknown navigation operation: ${operation}`,
        };
    }
  } catch (error: any) {
    console.error('Navigation tool error:', error);
    result = {
      success: false,
      error: error.message || 'Navigation tool failed',
    };
  }

  // Send response back to AI
  if (sessionPromiseRef?.current) {
    const session = await sessionPromiseRef.current;
    session.sendToolResponse({
      functionResponses: [
        {
          id: functionCall.id,
          name: functionCall.name,
          response: result.data || { success: result.success, error: result.error },
        },
      ],
    });
  }

  // Log errors
  if (!result.success) {
    addLog(`❌ ${result.error}`);
  }
}

/**
 * Show navigation results in the UI overlay
 */
function showNavigationResult(
  showResult: (result: any) => void,
  type: 'list' | 'preview' | 'help',
  data: any
) {
  showResult({
    type: 'navigation',
    timestamp: Date.now(),
    navigationResult: {
      type,
      data,
    },
  });
}

