import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { GITIGNORE_TEMPLATE } from './config.js';

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
 * 执行 git 命令的通用函数
 */
function execGitCommand(command, options = {}) {
  const workingDir = getUserWorkingDirectory();
  
  
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
 * 获取 Git 状态描述
 */
function getStatusDescription(status) {
  const descriptions = {
    'M': '已修改',
    'A': '新增',
    'D': '删除',
    'R': '重命名',
    'C': '复制',
    'U': '未合并',
    '?': '未跟踪'
  };
  return descriptions[status] || status;
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

    // 检查暂存区是否有文件
    const stagedFiles = execGitCommand('git diff --cached --name-only').trim();
    
    if (!stagedFiles) {
      // 暂存区为空，提示用户先添加文件
      const statusResult = execGitCommand('git status --short');
      let result = '⚠️  暂存区为空，无法提交！\n\n';
      
      if (statusResult.trim()) {
        result += '📊 当前状态：\n' + statusResult + '\n\n';
        result += '💡 请先使用以下方式添加文件到暂存区：\n';
        result += '- git_add({ files: "具体文件路径" }) - 添加指定文件\n';
        result += '- git_add({ files: "." }) - 添加所有文件\n';
        result += '- 然后再调用 git_smart_commit 提交\n';
      } else {
        result += '✅ 工作区干净，没有需要提交的文件\n';
      }
      
      return createResponse(result);
    }

    // 显示将要提交的文件
    const stagedFilesList = stagedFiles.split('\n').map(file => `  ${file}`).join('\n');
    
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

    const result = `✅ 智能提交成功！\n\n📝 Commit: ${message}\n📁 已提交文件:\n${stagedFilesList}\n\n${commitResult}\n${pushResult}`;
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
    
    return createResponse(`✅ 工作目录已设置为: ${dirPath}`);
  }),

  git_fetch: withErrorHandling(async () => {
    const result = execGitCommand('git fetch');
    return createResponse(`✅ 远程仓库信息同步成功\n${result}`);
  }),

  git_checkout: withErrorHandling(async (args) => {
    const branch = args?.branch;
    if (!branch) {
      throw new Error('请提供分支名称');
    }
    
    const result = execGitCommand(`git checkout ${branch}`);
    return createResponse(`✅ 已切换到分支: ${branch}\n${result}`);
  }),

  git_branch_info: withErrorHandling(async () => {
    const result = execGitCommand('git branch -vv');
    return createResponse(`📊 分支跟踪信息：\n${result}`);
  }),

  git_smart_checkout: withErrorHandling(async (args) => {
    const branchName = args?.branch_number;
    if (!branchName) {
      throw new Error('请提供分支名称');
    }
    
    // 1. 同步远程
    execGitCommand('git fetch');
    
    // 2. 直接切换分支，Git 会自动处理远程分支跟踪
    const result = execGitCommand(`git checkout ${branchName}`);
    
    return createResponse(`✅ 已切换到分支: ${branchName}\n${result}`);
  }),

  git_check_working_tree: withErrorHandling(async () => {
    // 获取详细状态
    const statusResult = execGitCommand('git status --porcelain');
    const stagedFiles = execGitCommand('git diff --cached --name-only').trim();
    const unstagedFiles = execGitCommand('git diff --name-only').trim();
    
    let result = '📊 工作区状态检查：\n\n';
    
    if (!statusResult.trim()) {
      result += '✅ 工作区干净，没有未提交的更改\n';
      return createResponse(result);
    }
    
    // 分析文件状态
    const lines = statusResult.split('\n').filter(line => line.trim());
    const staged = [];
    const unstaged = [];
    const untracked = [];
    
    lines.forEach(line => {
      const status = line.substring(0, 2);
      const file = line.substring(3);
      
      if (status[0] !== ' ' && status[0] !== '?') {
        staged.push(`  ${file} (${getStatusDescription(status[0])})`);
      }
      if (status[1] !== ' ' && status[1] !== '?') {
        unstaged.push(`  ${file} (${getStatusDescription(status[1])})`);
      }
      if (status === '??') {
        untracked.push(`  ${file}`);
      }
    });
    
    if (staged.length > 0) {
      result += '✅ 已暂存的文件（将被提交）：\n';
      result += staged.join('\n') + '\n\n';
    }
    
    if (unstaged.length > 0) {
      result += '⚠️  已修改但未暂存的文件：\n';
      result += unstaged.join('\n') + '\n\n';
    }
    
    if (untracked.length > 0) {
      result += '❓ 未跟踪的文件：\n';
      result += untracked.join('\n') + '\n\n';
    }
    
    result += '💡 提示：\n';
    result += '- 使用 git_add 添加特定文件到暂存区\n';
    result += '- 使用 git_smart_commit 提交（可指定 files 参数）\n';
    
    return createResponse(result);
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
