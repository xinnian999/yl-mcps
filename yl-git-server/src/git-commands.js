import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { PROJECT_ROOT, GITIGNORE_TEMPLATE } from './config.js';

/**
 * 执行 git 命令的通用函数
 */
function execGitCommand(command, options = {}) {
  return execSync(command, {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
    ...options,
  });
}

/**
 * 初始化 git 仓库
 */
export function gitInit(remoteUrl, branch = 'main') {
  let result = '';
  
  // 初始化 git 仓库
  const initResult = execGitCommand('git init');
  result += `✅ Git 仓库初始化成功\n${initResult}\n`;
  
  // 设置默认分支名称
  try {
    execGitCommand(`git branch -M ${branch}`);
    result += `✅ 默认分支设置为: ${branch}\n`;
  } catch (e) {
    // 如果没有提交,branch -M 会失败,这是正常的
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
  const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, GITIGNORE_TEMPLATE, 'utf-8');
    result += `✅ 已创建 .gitignore 文件\n`;
  } else {
    result += `ℹ️  .gitignore 文件已存在，跳过创建\n`;
  }
  
  return result;
}

/**
 * 获取 git 状态
 */
export function gitStatus() {
  return execGitCommand('git status');
}

/**
 * 获取 git diff 信息
 */
export function gitDiff() {
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

  return result;
}

/**
 * 添加文件到暂存区
 */
export function gitAdd(files = '.') {
  execGitCommand(`git add ${files}`);
  
  // 获取添加后的状态
  const statusResult = execGitCommand('git status --short');
  
  return `✅ 文件已添加到暂存区: ${files}\n\n📊 当前状态：\n${statusResult}`;
}

/**
 * 智能提交并推送
 */
export function gitSmartCommit(message) {
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

  return `✅ 智能提交成功！\n\n📝 Commit: ${message}\n\n${commitResult}\n${pushResult}`;
}
