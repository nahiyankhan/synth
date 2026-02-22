/**
 * Filesystem Adapter Interface
 *
 * Abstraction layer for filesystem operations that supports multiple backends:
 * - VirtualFileSystem (current): In-memory representation of design tokens
 * - RealFilesystemAdapter (future): bash-tool sandbox for real file operations
 * - HybridFilesystemAdapter (future): Combines both for optimistic updates
 *
 * Architecture inspired by Vercel's bash-tool approach:
 * https://github.com/vercel-labs/bash-tool
 *
 * Migration Path:
 * Phase 1: VirtualFileSystem (current) - In-memory, instant
 * Phase 2: HybridFilesystem - VFS for reads, real for writes
 * Phase 3: RealFilesystem - Full bash-tool sandbox
 */

export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

/**
 * Abstract interface for filesystem operations
 * Implemented by VirtualFileSystem and future RealFilesystemAdapter
 */
export interface FilesystemAdapter {
  /**
   * Execute a Unix-style command
   * Supported: cat, grep, find, ls, tree, wc, jq, echo >, rm, mkdir
   *
   * @param command - Unix command string (e.g., "cat tokens/base/color/primary.json")
   * @returns Command result with stdout, stderr, and exit code
   */
  execute(command: string): Promise<CommandResult>;

  /**
   * Sync changes to persistent storage
   * For VirtualFileSystem: Triggers IndexedDB persistence
   * For RealFilesystemAdapter: Flushes to disk
   */
  sync(): Promise<void>;

  /**
   * Get the root path of the project in this filesystem
   * For VirtualFileSystem: Returns "/"
   * For RealFilesystemAdapter: Returns sandbox path
   */
  getProjectRoot(): string;

  /**
   * Check if the filesystem is ready for operations
   */
  isReady(): boolean;
}

/**
 * Configuration for real filesystem adapter (future bash-tool integration)
 */
export interface RealFilesystemConfig {
  /**
   * Project ID for sandbox isolation
   */
  projectId: string;

  /**
   * Base path for project files
   * Default: ~/.design-language/projects/{projectId}
   */
  basePath?: string;

  /**
   * Command timeout in milliseconds
   * Default: 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Sandbox type
   * - 'just-bash': Lightweight local sandbox (recommended)
   * - 'vercel-sandbox': Full VM isolation (requires Vercel infrastructure)
   */
  sandboxType?: 'just-bash' | 'vercel-sandbox';
}

/**
 * Factory function to create appropriate filesystem adapter
 * Currently returns VirtualFileSystem, will support RealFilesystem in future
 *
 * @param type - 'virtual' (current) or 'real' (future) or 'hybrid' (future)
 * @param config - Configuration options
 */
export function createFilesystemAdapter(
  type: 'virtual' | 'real' | 'hybrid' = 'virtual',
  config?: RealFilesystemConfig
): FilesystemAdapter {
  if (type === 'real') {
    throw new Error(
      'RealFilesystemAdapter not yet implemented. ' +
        'Waiting for bash-tool SDK integration. ' +
        'Use type="virtual" for now.'
    );
  }

  if (type === 'hybrid') {
    throw new Error(
      'HybridFilesystemAdapter not yet implemented. ' +
        'Will combine VirtualFileSystem with RealFilesystemAdapter. ' +
        'Use type="virtual" for now.'
    );
  }

  // For 'virtual', caller should create VirtualFileSystem directly
  // since it requires StyleGraph instance
  throw new Error(
    'Use VirtualFileSystem constructor directly for virtual filesystem. ' +
      'This factory is for future real/hybrid filesystem support.'
  );
}

/**
 * Placeholder for future RealFilesystemAdapter
 *
 * Will integrate with bash-tool SDK:
 * ```typescript
 * import { createBashTool } from 'bash-tool';
 *
 * export class RealFilesystemAdapter implements FilesystemAdapter {
 *   private bashTool: BashTool;
 *
 *   constructor(config: RealFilesystemConfig) {
 *     this.bashTool = createBashTool({
 *       sandbox: config.sandboxType || 'just-bash',
 *       cwd: config.basePath || `~/.design-language/projects/${config.projectId}`,
 *       timeout: config.timeout || 30000,
 *     });
 *   }
 *
 *   async execute(command: string): Promise<CommandResult> {
 *     const result = await this.bashTool.bash(command);
 *     return {
 *       stdout: result.stdout,
 *       stderr: result.stderr,
 *       exitCode: result.exitCode,
 *     };
 *   }
 *
 *   async sync(): Promise<void> {
 *     // No-op for real filesystem - changes are immediately persisted
 *   }
 *
 *   getProjectRoot(): string {
 *     return this.bashTool.getCwd();
 *   }
 *
 *   isReady(): boolean {
 *     return this.bashTool.isReady();
 *   }
 * }
 * ```
 */

/**
 * Placeholder for future HybridFilesystemAdapter
 *
 * Combines VirtualFileSystem (fast reads) with RealFilesystemAdapter (validated writes)
 *
 * ```typescript
 * export class HybridFilesystemAdapter implements FilesystemAdapter {
 *   constructor(
 *     private virtual: VirtualFileSystem,
 *     private real: RealFilesystemAdapter
 *   ) {}
 *
 *   async execute(command: string): Promise<CommandResult> {
 *     // Execute on virtual first for instant response (optimistic update)
 *     const result = await this.virtual.execute(command);
 *
 *     // If write command, sync to real filesystem asynchronously
 *     if (this.isWriteCommand(command)) {
 *       // Fire and forget - real filesystem sync happens in background
 *       this.syncToReal(command).catch(console.error);
 *     }
 *
 *     return result;
 *   }
 *
 *   private isWriteCommand(command: string): boolean {
 *     const cmd = command.trim().split(/\s+/)[0];
 *     return ['echo', 'rm', 'mkdir'].includes(cmd);
 *   }
 *
 *   private async syncToReal(command: string): Promise<void> {
 *     await this.real.execute(command);
 *   }
 * }
 * ```
 */
