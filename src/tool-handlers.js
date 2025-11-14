import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { GITIGNORE_TEMPLATE } from "./config.js";

// 全局工作目录变量
let globalWorkingDirectory = null;

/**
 * 获取用户的实际工作目录
 * 必须先通过 set_working_dir 设置工作目录
 */
function getUserWorkingDirectory() {
  if (!globalWorkingDirectory) {
    throw new Error(
      "❌ 尚未设置工作目录！请先调用 set_working_dir 工具设置正确的工作目录。"
    );
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
    encoding: "utf-8",
    ...options,
  });
}

/**
 * 创建响应的通用函数
 */
function createResponse(text, isError = false) {
  return {
    content: [{ type: "text", text }],
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
      return createResponse(
        `❌ 操作失败：\n${error.message}\n${error.stderr || ""}`,
        true
      );
    }
  };
}

/**
 * Git 命令安全配置
 */
const GIT_COMMAND_SECURITY = {
  // 允许的 git 子命令白名单
  allowedCommands: [
    "status",
    "diff",
    "log",
    "show",
    "branch",
    "tag",
    "remote",
    "fetch",
    "pull",
    "push",
    "add",
    "commit",
    "checkout",
    "switch",
    "merge",
    "rebase",
    "reset",
    "stash",
    "clone",
    "init",
    "config",
    "ls-files",
    "ls-remote",
    "describe",
    "reflog",
    "blame",
    "grep",
    "shortlog",
    "cherry-pick",
    "revert",
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
    /tag\s+-d/i,
  ],

  // 只读命令（完全安全）
  readOnlyCommands: [
    "status",
    "diff",
    "log",
    "show",
    "branch",
    "tag",
    "remote",
    "ls-files",
    "ls-remote",
    "describe",
    "reflog",
    "blame",
    "grep",
    "shortlog",
  ],
};

/**
 * 验证 git 命令的安全性
 */
function validateGitCommand(command) {
  // 移除 'git ' 前缀（如果存在）
  const cleanCommand = command.replace(/^git\s+/, "").trim();

  // 提取主命令
  const mainCommand = cleanCommand.split(/\s+/)[0];

  // 检查是否在允许的命令列表中
  if (!GIT_COMMAND_SECURITY.allowedCommands.includes(mainCommand)) {
    throw new Error(`❌ 不允许的 git 命令: ${mainCommand}`);
  }

  // 检查危险模式
  for (const pattern of GIT_COMMAND_SECURITY.dangerousPatterns) {
    if (pattern.test(cleanCommand)) {
      throw new Error(
        `❌ 检测到危险命令模式: ${cleanCommand}\n为了安全起见，此命令被禁止执行。`
      );
    }
  }

  // 检查是否为只读命令
  const isReadOnly =
    GIT_COMMAND_SECURITY.readOnlyCommands.includes(mainCommand);

  return {
    command: cleanCommand,
    mainCommand,
    isReadOnly,
    isAllowed: true,
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
  git_command: withErrorHandling(async (args) => {
    const command = args?.command;

    if (!command) {
      throw new Error("请提供要执行的 git 命令");
    }

    // 验证命令安全性
    const validation = validateGitCommand(command);

    // 执行命令
    const result = execGitCommandSafe(command);

    // 根据命令类型添加不同的前缀
    let prefix = "";
    if (validation.isReadOnly) {
      prefix = "📖 ";
    } else {
      prefix = "✅ ";
    }

    return createResponse(
      `${prefix}Git 命令执行成功：\n\n命令: git ${validation.command}\n\n输出:\n${result}`
    );
  }),
  
  set_working_dir: withErrorHandling(async (args) => {
    const dirPath = args?.path;
    if (!dirPath) {
      throw new Error("请提供工作目录路径");
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
      throw new Error("请提供分支名称");
    }

    // 1. 同步远程
    execGitCommandSafe("fetch");

    // 2. 直接切换分支，Git 会自动处理远程分支跟踪
    const result = execGitCommandSafe(`checkout ${branchName}`);

    return createResponse(`✅ 已切换到分支: ${branchName}\n${result}`);
  }),
};
