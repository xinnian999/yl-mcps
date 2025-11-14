import fs from "fs";
import {
  createResponse,
  withErrorHandling,
  validateGitCommand,
  execGitCommandSafe,
  setGlobalWorkingDirectory,
} from "./utils.js";

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
    const resolvedPath = setGlobalWorkingDirectory(dirPath);

    return createResponse(`✅ 工作目录已设置为: ${resolvedPath}`);
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
