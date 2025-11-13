import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { GITIGNORE_TEMPLATE } from './config.js';

// 全局工作目录变量
let globalWorkingDirectory = null;

/**
 * 获取用户的实际工作目录
 * 必须先通过 set_working_dir 设置工作目录
 */
function getUserWorkingDirectory() {
  if (!globalWorkingDirectory) {
    throw new Error('❌ 尚未设置工作目录！请先调用 set_working_dir 工具设置正确的工作目录。');
  }
  
  return globalWorkingDirectory;
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
 * Git 命令安全配置
 */
const GIT_COMMAND_SECURITY = {
  // 允许的 git 子命令白名单
  allowedCommands: [
    'status', 'diff', 'log', 'show', 'branch', 'tag', 'remote',
    'fetch', 'pull', 'push', 'add', 'commit', 'checkout', 'switch',
    'merge', 'rebase', 'reset', 'stash', 'clone', 'init',
    'config', 'ls-files', 'ls-remote', 'describe', 'reflog',
    'blame', 'grep', 'shortlog', 'cherry-pick', 'revert'
  ],
  
  // 危险命令模式（直接禁止执行）
  dangerousPatterns: [
    /--force/i,
    /--hard/i,
    /rm\s+/i,
    /clean\s+-[df]/i,
    /reset\s+--hard/i,
    /push\s+.*--force/i,
    /rebase\s+.*--interactive/i,
    /filter-branch/i,
    /gc\s+--aggressive/i,
    /branch\s+-D/i,
    /tag\s+-d/i
  ],
  
  // 只读命令（完全安全）
  readOnlyCommands: [
    'status', 'diff', 'log', 'show', 'branch', 'tag', 'remote',
    'ls-files', 'ls-remote', 'describe', 'reflog', 'blame', 'grep', 'shortlog'
  ]
};

/**
 * 验证 git 命令的安全性
 */
function validateGitCommand(command) {
  // 移除 'git ' 前缀（如果存在）
  const cleanCommand = command.replace(/^git\s+/, '').trim();
  
  // 提取主命令
  const mainCommand = cleanCommand.split(/\s+/)[0];
  
  // 检查是否在允许的命令列表中
  if (!GIT_COMMAND_SECURITY.allowedCommands.includes(mainCommand)) {
    throw new Error(`❌ 不允许的 git 命令: ${mainCommand}`);
  }
  
  // 检查危险模式
  for (const pattern of GIT_COMMAND_SECURITY.dangerousPatterns) {
    if (pattern.test(cleanCommand)) {
      throw new Error(`❌ 检测到危险命令模式: ${cleanCommand}\n为了安全起见，此命令被禁止执行。`);
    }
  }
  
  // 检查是否为只读命令
  const isReadOnly = GIT_COMMAND_SECURITY.readOnlyCommands.includes(mainCommand);
  
  return {
    command: cleanCommand,
    mainCommand,
    isReadOnly,
    isAllowed: true
  };
}

/**
 * 安全执行 git 命令
 */
function execGitCommandSafe(command, options = {}) {
  const validation = validateGitCommand(command);
  
  // 构建完整的 git 命令
  const fullCommand = `git ${validation.command}`;
  
  return execGitCommand(fullCommand, options);
}

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


  set_working_dir: withErrorHandling(async (args) => {
    const dirPath = args?.path;
    if (!dirPath) {
      throw new Error('请提供工作目录路径');
    }
    
    // 验证路径是否存在且为目录
    if (!fs.existsSync(dirPath)) {
      throw new Error(`目录不存在: ${dirPath}`);
    }
    
    if (!fs.statSync(dirPath).isDirectory()) {
      throw new Error(`路径不是目录: ${dirPath}`);
    }
    
    // 设置全局工作目录
    globalWorkingDirectory = path.resolve(dirPath);
    
    return createResponse(`✅ 工作目录已设置为: ${globalWorkingDirectory}`);
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

  git_smart_review: withErrorHandling(async (args) => {
    const cardNumber = args?.card_number;
    let targetBranch = args?.target_branch;
    
    if (!cardNumber) {
      throw new Error('请提供卡片代号');
    }
    
    // 如果未提供目标分支，使用当前分支
    if (!targetBranch) {
      targetBranch = execGitCommand('git branch --show-current').trim();
      if (!targetBranch) {
        throw new Error('无法获取当前分支名称，请手动指定目标分支');
      }
    }

    // 1. 检查工作区是否有改动
    const statusResult = execGitCommand('git status --porcelain').trim();
    if (!statusResult) {
      throw new Error('❌ 智能提交评审失败：没有文件需要提交！\n\n工作区中没有任何更改需要提交。');
    }

    // 2. 添加所有文件到暂存区
    execGitCommand('git add .');
    
    // 3. 获取改动的文件信息用于生成commit信息
    const diffResult = execGitCommand('git diff --cached --name-only').trim();
    const changedFiles = diffResult.split('\n').filter(file => file.trim());
    
    // 4. 根据卡片代号和改动文件自动生成commit信息
    let commitMessage = `${cardNumber}`;
    
    // 分析文件类型来生成更具体的commit信息
    const fileTypes = {
      js: 0, ts: 0, vue: 0, jsx: 0, tsx: 0,
      css: 0, scss: 0, less: 0,
      html: 0, json: 0, md: 0,
      other: 0
    };
    
    changedFiles.forEach(file => {
      const ext = file.split('.').pop()?.toLowerCase();
      if (fileTypes.hasOwnProperty(ext)) {
        fileTypes[ext]++;
      } else {
        fileTypes.other++;
      }
    });
    
    // 根据文件类型生成描述
    const descriptions = [];
    if (fileTypes.js + fileTypes.ts + fileTypes.jsx + fileTypes.tsx + fileTypes.vue > 0) {
      descriptions.push('更新业务逻辑');
    }
    if (fileTypes.css + fileTypes.scss + fileTypes.less > 0) {
      descriptions.push('调整样式');
    }
    if (fileTypes.html > 0) {
      descriptions.push('修改页面结构');
    }
    if (fileTypes.json > 0) {
      descriptions.push('更新配置');
    }
    if (fileTypes.md > 0) {
      descriptions.push('更新文档');
    }
    if (descriptions.length === 0) {
      descriptions.push('代码优化');
    }
    
    commitMessage += ` ${descriptions.join('、')}`;
    
    // 5. 执行commit
    const commitResult = execGitCommand(`git commit -m "${commitMessage}"`);
    
    // 6. 推送到评审分支
    const pushCommand = `git push origin HEAD:refs/for/${targetBranch}`;
    const pushResult = execGitCommand(pushCommand);
    
    // 7. 生成详细的文件状态信息
    let fileDetails = '';
    if (statusResult) {
      const lines = statusResult.split('\n');
      fileDetails = lines.map(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        const statusDesc = getStatusDescription(status.trim() || status[0]);
        return `  ${file} (${statusDesc})`;
      }).join('\n');
    }
    
    const branchInfo = args?.target_branch ? targetBranch : `${targetBranch} (当前分支)`;
    const result = `✅ 智能提交评审成功！\n\n` +
                  `🎫 卡片代号: ${cardNumber}\n` +
                  `🌿 目标分支: ${branchInfo}\n` +
                  `📝 Commit: ${commitMessage}\n` +
                  `📁 已处理文件:\n${fileDetails}\n\n` +
                  `${commitResult}\n${pushResult}`;
    
    return createResponse(result);
  }),

  git_command: withErrorHandling(async (args) => {
    const command = args?.command;
    
    if (!command) {
      throw new Error('请提供要执行的 git 命令');
    }
    
    // 验证命令安全性
    const validation = validateGitCommand(command);
    
    // 执行命令
    const result = execGitCommandSafe(command);
    
    // 根据命令类型添加不同的前缀
    let prefix = '';
    if (validation.isReadOnly) {
      prefix = '📖 ';
    } else {
      prefix = '✅ ';
    }
    
    return createResponse(`${prefix}Git 命令执行成功：\n\n命令: git ${validation.command}\n\n输出:\n${result}`);
  })
};

