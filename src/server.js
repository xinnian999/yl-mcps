import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { loadTools } from './tools/index.js';

/**
 * Git MCP 服务器类
 */
export class YLMCPServer {
  constructor() {
    this.tools = [];
    this.handlers = {};

    this.server = new Server(
      {
        name: 'yl-mcp-server',
        version: '1.3.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupErrorHandling();
  }

  /**
   * 初始化工具
   */
  async initialize() {
    const { tools, handlers } = await loadTools();
    this.tools = tools;
    this.handlers = handlers;
    this.setupToolHandlers();
  }

  /**
   * 设置工具处理器
   */
  setupToolHandlers() {
    // 列出所有工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools,
    }));

    // 调用工具
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const handler = this.handlers[name];
        
        if (!handler) {
          throw new Error(`Unknown tool: ${name}`);
        }
        
        const result = await handler(args);
        
        return result;
      } catch (error) {
        
        throw error;
      }
    });
  }

  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
    
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }

  /**
   * 启动服务器
   */
  async run() {
    try {
      // 先初始化工具
      await this.initialize();
      
      const transport = new StdioServerTransport();
      
      await this.server.connect(transport);
      
      
      console.log('success: Git MCP server running on stdio');
      console.log('root: ', process.cwd());
      
    } catch (error) {
      throw error;
    }
  }
}
