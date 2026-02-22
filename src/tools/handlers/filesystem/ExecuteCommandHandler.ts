/**
 * ExecuteCommandHandler
 *
 * Handles the executeCommand tool which allows AI to explore AND MODIFY the design system
 * using Unix-style commands:
 * - Read: grep, cat, jq, find, ls, tree, wc
 * - Write: echo, rm, mkdir
 *
 * This replaces ~15 specialized query tools with a single flexible exploration tool,
 * following Vercel's approach: https://vercel.com/blog/how-to-build-agents-with-filesystems-and-bash
 */

import { ToolHandler } from '@/core/ToolHandler';
import { ToolResponse } from '@/types/toolRegistry';
import { StyleGraph } from '@/core/StyleGraph';
import { StyleNode, StyleChange } from '@/types/styleGraph';
import { VirtualFileSystem, BrandContext, WriteCallbacks } from '@/services/virtualFileSystem';
import { EXECUTE_COMMAND_TOOL } from '@/tools/definitions/filesystem.tools';

export interface ExecuteCommandParams {
  command: string;
}

export interface PersistenceCallbacks {
  onPersist?: () => Promise<void>;
  getBrandContext?: () => Promise<BrandContext | undefined>;
}

// Write commands that modify the design system
const WRITE_COMMANDS = ['echo', 'rm', 'mkdir'];

export class ExecuteCommandHandler extends ToolHandler {
  private vfs: VirtualFileSystem | null = null;
  private persistenceCallbacks?: PersistenceCallbacks;

  constructor(private graph: StyleGraph) {
    super(EXECUTE_COMMAND_TOOL);
  }

  /**
   * Set callbacks for persistence and context loading
   */
  setPersistenceCallbacks(callbacks: PersistenceCallbacks): void {
    this.persistenceCallbacks = callbacks;
  }

  /**
   * Initialize VirtualFileSystem lazily with write callbacks
   */
  private async getVFS(): Promise<VirtualFileSystem> {
    if (!this.vfs) {
      // Load brand context if available
      const brandContext = await this.persistenceCallbacks?.getBrandContext?.();

      // Create write callbacks that connect to StyleGraph
      const writeCallbacks: WriteCallbacks = {
        onWriteToken: (path: string, data: Partial<StyleNode>): StyleChange => {
          return this.handleWriteToken(path, data);
        },
        onDeleteToken: (nodeId: string, force: boolean): { success: boolean; message: string } => {
          return this.handleDeleteToken(nodeId, force);
        },
      };

      this.vfs = new VirtualFileSystem(this.graph, undefined, brandContext, writeCallbacks);

      // Load schemas asynchronously if in browser
      if (typeof window !== 'undefined') {
        await this.vfs.loadSchemas();
      }
    }
    return this.vfs;
  }

  /**
   * Handle token creation/update from echo command
   */
  private handleWriteToken(path: string, data: Partial<StyleNode>): StyleChange {
    // Convert path to node name (e.g., tokens/base/color/primary.json -> base.color.primary)
    const nodeName = path
      .replace(/^tokens\//, '')
      .replace(/\.json$/, '')
      .replace(/\//g, '.');

    // Check if node exists
    const existingNode = this.findNodeByName(nodeName);

    if (existingNode) {
      // Update existing node
      return this.graph.updateNode(existingNode.id, {
        ...data,
        name: nodeName, // Ensure name matches path
      });
    } else {
      // Create new node
      const nodeId = data.id || nodeName.replace(/\./g, '-');
      const nodeData: Omit<StyleNode, 'dependencies' | 'dependents'> = {
        id: nodeId,
        name: nodeName,
        type: data.type || 'color', // Default to color type
        value: data.value ?? null,
        layer: data.layer,
        metadata: data.metadata,
        intent: data.intent,
        tracking: data.tracking,
      };

      return this.graph.createNode(nodeData);
    }
  }

  /**
   * Handle token deletion from rm command
   */
  private handleDeleteToken(nodeId: string, force: boolean): { success: boolean; message: string } {
    // Find the node - nodeId might be the name with dots
    const node = this.graph.nodes.get(nodeId) || this.findNodeByName(nodeId);

    if (!node) {
      return { success: false, message: `Token not found: ${nodeId}` };
    }

    // Check dependents unless force
    if (!force && node.dependents.size > 0) {
      return {
        success: false,
        message: `Token has ${node.dependents.size} dependent(s). Use -f to force delete.`,
      };
    }

    try {
      this.graph.deleteNode(node.id);
      return { success: true, message: `Deleted token: ${node.name}` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Find a node by its name (dotted path)
   */
  private findNodeByName(name: string): StyleNode | undefined {
    for (const [, node] of this.graph.nodes) {
      if (node.name === name) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Check if a command is a write command
   */
  private isWriteCommand(command: string): boolean {
    const cmd = command.trim().split(/\s+/)[0];
    return WRITE_COMMANDS.includes(cmd);
  }

  /**
   * Execute a Unix command on the virtual file system
   */
  async execute(params: ExecuteCommandParams): Promise<ToolResponse> {
    try {
      // Validate command
      if (!params.command || typeof params.command !== 'string') {
        return {
          success: false,
          error: 'Command must be a non-empty string',
        };
      }

      const command = params.command.trim();

      if (command.length === 0) {
        return {
          success: false,
          error: 'Command cannot be empty',
        };
      }

      // Get VFS instance
      const vfs = await this.getVFS();

      // Execute command
      const result = await vfs.execute(command);

      // Handle errors
      if (result.exitCode !== 0 && result.stderr) {
        return {
          success: false,
          error: result.stderr,
          data: {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
          },
        };
      }

      // If write command succeeded, trigger persistence
      if (this.isWriteCommand(command) && result.exitCode === 0) {
        try {
          await this.persistenceCallbacks?.onPersist?.();
        } catch (persistError: any) {
          console.warn('Persistence failed:', persistError.message);
          // Don't fail the command, just warn
        }
      }

      // Success
      return {
        success: true,
        message: `Command executed successfully`,
        data: {
          stdout: result.stdout,
          exitCode: result.exitCode,
          command: command,
          isWriteCommand: this.isWriteCommand(command),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Command execution failed: ${error.message}`,
      };
    }
  }

  /**
   * Validate command parameters
   */
  validate(params: ExecuteCommandParams): { valid: boolean; error?: string } {
    if (!params.command) {
      return { valid: false, error: 'command parameter is required' };
    }

    if (typeof params.command !== 'string') {
      return { valid: false, error: 'command must be a string' };
    }

    return { valid: true };
  }

  /**
   * Refresh the VFS when graph changes
   */
  refresh(): void {
    this.vfs = null; // Will be recreated on next execute
  }
}
