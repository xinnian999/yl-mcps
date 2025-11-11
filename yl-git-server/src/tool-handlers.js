import {
  gitInit,
  gitStatus,
  gitDiff,
  gitAdd,
  gitSmartCommit,
} from './git-commands.js';

/**
 * 创建成功响应
 */
function createSuccessResponse(text) {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

/**
 * 创建错误响应
 */
function createErrorResponse(error) {
  return {
    content: [
      {
        type: 'text',
        text: `❌ 操作失败：\n${error.message}\n${error.stderr || ''}`,
      },
    ],
    isError: true,
  };
}

/**
 * 工具处理器映射
 */
export const toolHandlers = {
  git_init: async (args) => {
    try {
      const remoteUrl = args?.remote_url;
      const branch = args?.branch || 'main';
      const result = gitInit(remoteUrl, branch);
      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  git_status: async () => {
    try {
      const result = gitStatus();
      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  git_diff: async () => {
    try {
      const result = gitDiff();
      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  git_add: async (args) => {
    try {
      const files = args?.files || '.';
      const result = gitAdd(files);
      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  git_smart_commit: async (args) => {
    try {
      const message = args?.message;
      if (!message) {
        throw new Error('请提供 commit 信息');
      }
      const result = gitSmartCommit(message);
      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error);
    }
  },
};

/**
 * 调用工具处理器
 */
export async function handleToolCall(toolName, args) {
  const handler = toolHandlers[toolName];
  
  if (!handler) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  
  return await handler(args);
}
