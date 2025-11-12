import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { GITIGNORE_TEMPLATE } from './config.js';
import { debugUtils } from './debug.js';

// 全局工作目录变量
let globalWorkingDirectory = null;

/**
 * 获取用户的实际工作目录
 * 优先级：手动设置 > 环境变量 > 从客户端传递的目录 > 当前目录
 */
function getUserWorkingDirectory() {
  // 1. 检查是否手动设置了工作目录
  if (globalWorkingDirectory) {
    return globalWorkingDirectory;
  }
  
  // 2. 检查环境变量
  if (process.env.MCP_WORKING_DIR) {
    return process.env.MCP_WORKING_DIR;
  }
  
  // 3. 检查是否有传递的工作目录参数
  const cwdArg = process.argv.find(arg => arg.startsWith('--cwd='));
  if (cwdArg) {
    return cwdArg.split('=')[1];
  }
  
  // 4. 尝试从 PWD 环境变量获取（更准确的当前目录）
  if (process.env.PWD && process.env.PWD !== '/') {
    return process.env.PWD;
  }
  
  // 5. 最后使用 process.cwd()
  return process.cwd();
}

/**
 * 设置工作目录
 */
function setWorkingDirectory(path) {
  if (!fs.existsSync(path)) {
    throw new Error(`目录不存在: ${path}`);
  }
  
  const stats = fs.statSync(path);
  if (!stats.isDirectory()) {
    throw new Error(`路径不是目录: ${path}`);
  }
  
  globalWorkingDirectory = path;
  debugUtils.info(`工作目录已设置为: ${path}`);
  
  return `✅ 工作目录已设置为: ${path}`;
}

/**
 * 执行 git 命令的通用函数
 */
function execGitCommand(command, options = {}) {
  const workingDir = getUserWorkingDirectory();
  
  debugUtils.debug(`Executing git command: ${command}`, {
    workingDir,
    originalCwd: process.cwd(),
    pwd: process.env.PWD
  });
  
  return execSync(command, {
    cwd: workingDir,
    encoding: 'utf-8',
    ...options,
  });
}

/**
 * 创建响应的通用函数
 */
function createResponse(text, isError = false) {
  return {
    content: [{ type: 'text', text }],
    ...(isError && { isError: true }),
  };
}

/**
 * 错误处理包装器
 */
function withErrorHandling(handler) {
  return async (args) => {
    try {
      return await handler(args);
    } catch (error) {
      return createResponse(`❌ 操作失败：\n${error.message}\n${error.stderr || ''}`, true);
    }
  };
}

/**
 * 工具处理器映射
 */
export const toolHandlers = {
  git_init: withErrorHandling(async (args) => {
    const remoteUrl = args?.remote_url;
    const branch = args?.branch || 'main';
    
    let result = '';
    
    // 初始化 git 仓库
    const initResult = execGitCommand('git init');
    result += `✅ Git 仓库初始化成功\n${initResult}\n`;
    
    // 设置默认分支名称
    try {
      execGitCommand(`git branch -M ${branch}`);
      result += `✅ 默认分支设置为: ${branch}\n`;
    } catch (e) {
      result += `ℹ️  默认分支将在首次提交后设置为: ${branch}\n`;
    }
    
    // 如果提供了远程仓库地址,添加 remote
    if (remoteUrl) {
      try {
        execGitCommand(`git remote add origin ${remoteUrl}`);
        result += `✅ 远程仓库已添加: ${remoteUrl}\n`;
      } catch (e) {
        result += `⚠️  添加远程仓库失败: ${e.message}\n`;
      }
    }
    
    // 检测并创建 .gitignore 文件
    const workingDir = getUserWorkingDirectory();
    const gitignorePath = path.join(workingDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, GITIGNORE_TEMPLATE, 'utf-8');
      result += `✅ 已创建 .gitignore 文件\n`;
    } else {
      result += `ℹ️  .gitignore 文件已存在，跳过创建\n`;
    }
    
    return createResponse(result);
  }),

  git_status: withErrorHandling(async () => {
    const result = execGitCommand('git status');
    return createResponse(result);
  }),

  git_diff: withErrorHandling(async () => {
    // 获取未暂存的改动
    let unstagedDiff = '';
    try {
      unstagedDiff = execGitCommand('git diff');
    } catch (e) {
      // 可能没有未暂存的改动
    }

    // 获取已暂存的改动
    let stagedDiff = '';
    try {
      stagedDiff = execGitCommand('git diff --cached');
    } catch (e) {
      // 可能没有已暂存的改动
    }

    // 获取状态信息
    const statusResult = execGitCommand('git status --short');

    let result = '📊 Git 改动概览：\n\n';
    result += `${statusResult}\n`;
    
    if (stagedDiff) {
      result += '\n📝 已暂存的改动 (git diff --cached)：\n';
      result += '```diff\n' + stagedDiff + '\n```\n';
    }
    
    if (unstagedDiff) {
      result += '\n📝 未暂存的改动 (git diff)：\n';
      result += '```diff\n' + unstagedDiff + '\n```\n';
    }

    if (!stagedDiff && !unstagedDiff) {
      result += '\n✅ 没有检测到改动';
    }

    return createResponse(result);
  }),

  git_add: withErrorHandling(async (args) => {
    const files = args?.files || '.';
    execGitCommand(`git add ${files}`);
    
    // 获取添加后的状态
    const statusResult = execGitCommand('git status --short');
    
    const result = `✅ 文件已添加到暂存区: ${files}\n\n📊 当前状态：\n${statusResult}`;
    return createResponse(result);
  }),

  git_smart_commit: withErrorHandling(async (args) => {
    const message = args?.message;
    if (!message) {
      throw new Error('请提供 commit 信息');
    }

    // 执行 git add .
    execGitCommand('git add .');

    // 执行 git commit
    const commitResult = execGitCommand(`git commit -m "${message}"`);

    // 执行 git push，如果失败则尝试设置上游分支
    let pushResult = '';
    try {
      pushResult = execGitCommand('git push');
    } catch (pushError) {
      // 检查是否是因为没有设置上游分支
      if (pushError.message.includes('no upstream branch')) {
        // 获取当前分支名
        const currentBranch = execGitCommand('git branch --show-current').trim();
        
        // 设置上游分支并推送
        pushResult = execGitCommand(`git push --set-upstream origin ${currentBranch}`);
        pushResult = `✅ 已自动设置上游分支: origin/${currentBranch}\n${pushResult}`;
      } else {
        // 其他推送错误，直接抛出
        throw pushError;
      }
    }

    const result = `✅ 智能提交成功！\n\n📝 Commit: ${message}\n\n${commitResult}\n${pushResult}`;
    return createResponse(result);
  }),

  debug_info: withErrorHandling(async (args) => {
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
    
    return createResponse(debugInfo);
  }),

  debug_clear_logs: withErrorHandling(async () => {
    debugUtils.clearLogs();
    return createResponse('✅ 调试日志已清理');
  }),

  debug_working_dir: withErrorHandling(async () => {
    const workingDir = getUserWorkingDirectory();
    
    let result = `📁 **工作目录信息**\n\n`;
    result += `**当前工作目录**: ${workingDir}\n`;
    result += `**process.cwd()**: ${process.cwd()}\n`;
    result += `**PWD 环境变量**: ${process.env.PWD || '未设置'}\n`;
    result += `**MCP_WORKING_DIR**: ${process.env.MCP_WORKING_DIR || '未设置'}\n\n`;
    
    // 检查目录是否存在
    try {
      const stats = fs.statSync(workingDir);
      result += `**目录状态**: ${stats.isDirectory() ? '✅ 有效目录' : '❌ 不是目录'}\n`;
    } catch (error) {
      result += `**目录状态**: ❌ 目录不存在 (${error.message})\n`;
    }
    
    // 检查是否是 Git 仓库
    try {
      execGitCommand('git rev-parse --git-dir');
      result += `**Git 仓库**: ✅ 是 Git 仓库\n`;
      
      try {
        const branch = execGitCommand('git branch --show-current').trim();
        result += `**当前分支**: ${branch || '未知'}\n`;
      } catch (e) {
        result += `**当前分支**: 无法获取\n`;
      }
    } catch (error) {
      result += `**Git 仓库**: ❌ 不是 Git 仓库\n`;
    }
    
    return createResponse(result);
  }),

  set_working_dir: withErrorHandling(async (args) => {
    const dirPath = args?.path;
    if (!dirPath) {
      throw new Error('请提供工作目录路径');
    }
    
    if (!fs.existsSync(dirPath)) {
      throw new Error(`目录不存在: ${dirPath}`);
    }
    
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      throw new Error(`路径不是目录: ${dirPath}`);
    }
    
    globalWorkingDirectory = dirPath;
    debugUtils.info(`工作目录已设置为: ${dirPath}`);
    
    return createResponse(`✅ 工作目录已设置为: ${dirPath}`);
  }),
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
