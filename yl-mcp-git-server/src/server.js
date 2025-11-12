import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SERVER_CONFIG } from './config.js';
import { TOOL_DEFINITIONS } from './tool-definitions.js';
import { handleToolCall } from './tool-handlers.js';
import { debugUtils } from './debug.js';

/**
 * Git MCP 服务器类
 */
export class GitMCPServer {
  constructor() {
    // 记录系统信息
    debugUtils.logSystemInfo();
    debugUtils.info('Initializing Git MCP Server');

    this.server = new Server(
      {
        name: SERVER_CONFIG.name,
        version: SERVER_CONFIG.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
    
    debugUtils.info('Git MCP Server initialized successfully');
  }

  /**
   * 设置工具处理器
   */
  setupToolHandlers() {
    // 列出所有工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOL_DEFINITIONS,
    }));

    // 调用工具
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();
      
      debugUtils.info(`Tool call started: ${name}`, { arguments: args });
      
      try {
        const result = await handleToolCall(name, args);
        const duration = Date.now() - startTime;
        
        debugUtils.logToolCall(name, args, result);
        debugUtils.info(`Tool call completed: ${name} (${duration}ms)`);
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        debugUtils.logToolCall(name, args, null, error);
        debugUtils.error(`Tool call failed: ${name} (${duration}ms)`, { 
          error: error.message,
          stack: error.stack 
        });
        
        throw error;
      }
    });
  }

  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    this.server.onerror = (error) => {
      debugUtils.error('MCP Server Error', { 
        error: error.message,
        stack: error.stack 
      });
      console.error('[MCP Error]', error);
    };
    
    process.on('SIGINT', async () => {
      debugUtils.info('Received SIGINT, shutting down server');
      await this.server.close();
      debugUtils.info('Server closed successfully');
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      debugUtils.error('Uncaught Exception', { 
        error: error.message,
        stack: error.stack 
      });
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      debugUtils.error('Unhandled Rejection', { 
        reason: reason,
        promise: promise 
      });
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }

  /**
   * 启动服务器
   */
  async run() {
    try {
      debugUtils.info('Starting MCP server transport');
      const transport = new StdioServerTransport();
      
      await this.server.connect(transport);
      
      debugUtils.info('MCP server connected successfully', {
        transport: 'stdio',
        cwd: process.cwd(),
        debugMode: debugUtils.debugMode
      });
      
      console.log('success: Git MCP server running on stdio');
      console.log('root: ', process.cwd());
      
      if (debugUtils.debugMode) {
        console.log('DEBUG MODE ENABLED - Detailed logging active');
        console.log(`Log file: ${debugUtils.logFile}`);
      }
    } catch (error) {
      debugUtils.error('Failed to start MCP server', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
