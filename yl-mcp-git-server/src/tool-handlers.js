import {
  gitInit,
  gitStatus,
  gitDiff,
  gitAdd,
  gitSmartCommit,
  getWorkingDirectoryInfo,
  setWorkingDirectory,
} from './git-commands.js';
import { debugUtils } from './debug.js';

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

  debug_info: async (args) => {
    try {
      const includeLogs = args?.include_logs !== false;
      const logLines = args?.log_lines || 50;
      
      const report = debugUtils.createDebugReport();
      
      let debugInfo = `🔍 **调试信息报告**\n\n`;
      debugInfo += `**时间**: ${report.timestamp}\n\n`;
      
      debugInfo += `**系统信息**:\n`;
      debugInfo += `- Node.js 版本: ${report.systemInfo.nodeVersion}\n`;
      debugInfo += `- 平台: ${report.systemInfo.platform} (${report.systemInfo.arch})\n`;
      debugInfo += `- 工作目录: ${report.systemInfo.cwd}\n`;
      debugInfo += `- 内存使用: ${Math.round(report.systemInfo.memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(report.systemInfo.memoryUsage.heapTotal / 1024 / 1024)}MB\n\n`;
      
      if (report.gitStatus) {
        if (report.gitStatus.error) {
          debugInfo += `**Git 状态**: ❌ ${report.gitStatus.error}\n\n`;
        } else {
          debugInfo += `**Git 状态**:\n`;
          debugInfo += `- 当前分支: ${report.gitStatus.branch || '未知'}\n`;
          debugInfo += `- 工作区状态: ${report.gitStatus.status || '干净'}\n`;
          debugInfo += `- 远程仓库: ${report.gitStatus.remotes || '无'}\n\n`;
        }
      }
      
      debugInfo += `**调试模式**: ${debugUtils.debugMode ? '✅ 启用' : '❌ 禁用'}\n`;
      debugInfo += `**日志文件**: ${debugUtils.logFile}\n\n`;
      
      if (includeLogs && report.recentLogs.length > 0) {
        debugInfo += `**最近日志** (最新 ${Math.min(logLines, report.recentLogs.length)} 条):\n`;
        report.recentLogs.slice(-logLines).forEach(log => {
          const time = new Date(log.timestamp).toLocaleTimeString();
          debugInfo += `[${time}] ${log.level.toUpperCase()}: ${log.message}\n`;
        });
      } else {
        debugInfo += `**日志**: 无可用日志记录\n`;
      }
      
      return createSuccessResponse(debugInfo);
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  debug_clear_logs: async () => {
    try {
      debugUtils.clearLogs();
      return createSuccessResponse('✅ 调试日志已清理');
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  debug_working_dir: async () => {
    try {
      const result = getWorkingDirectoryInfo();
      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  set_working_dir: async (args) => {
    try {
      const path = args?.path;
      if (!path) {
        throw new Error('请提供工作目录路径');
      }
      const result = setWorkingDirectory(path);
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
