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
    // 获取未暂存的更改
    const unstagedDiff = execGitCommand('git diff').trim();
    
    // 获取已暂存的更改
    const stagedDiff = execGitCommand('git diff --cached').trim();
    
    let result = '📊 Git 差异对比：\n\n';
    
    if (stagedDiff) {
      result += '✅ 已暂存的更改（将被提交）：\n';
      result += '=' .repeat(50) + '\n';
      result += stagedDiff + '\n\n';
    }
    
    if (unstagedDiff) {
      result += '⚠️  未暂存的更改（工作区）：\n';
      result += '=' .repeat(50) + '\n';
      result += unstagedDiff + '\n\n';
    }
    
    if (!stagedDiff && !unstagedDiff) {
      result += '✨ 没有任何更改需要显示\n';
    }
    
    return createResponse(result);
  }),

  git_smart_commit: withErrorHandling(async (args) => {
    const message = args?.message;
    
    if (!message) {
      throw new Error('请提供 commit 信息');
    }

    // 获取所有需要处理的文件（包括修改、新增、删除等）
    const allChangedFiles = execGitCommand('git status --porcelain').trim();
    
    // 自动添加所有文件到暂存区
    execGitCommand('git add .');
    
    // 检查暂存区是否有文件
    const stagedFiles = execGitCommand('git diff --cached --name-only').trim();
    
    if (!stagedFiles) {
      throw new Error('❌ 智能提交失败：没有文件需要提交！\n\n工作区中没有任何更改需要提交。');
    }

    // 解析文件状态并显示详细信息
    let fileDetails = '';
    if (allChangedFiles) {
      const lines = allChangedFiles.split('\n');
      fileDetails = lines.map(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        const statusDesc = getStatusDescription(status.trim() || status[0]);
        return `  ${file} (${statusDesc})`;
      }).join('\n');
    } else {
      // 如果没有详细状态，至少显示文件名
      fileDetails = stagedFiles.split('\n').map(file => `  ${file}`).join('\n');
    }
    
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

    const result = `✅ 智能提交成功！\n\n📝 Commit: ${message}\n📁 已处理文件:\n${fileDetails}\n\n${commitResult}\n${pushResult}`;
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
