import {
  createResponse,
  withErrorHandling,
  validateGitCommand,
  execGitCommandSafe,
} from "../utils.js";

/**
 * Git 命令工具定义
 */
export const definition = {
  name: 'git_command',
  description: '通用 Git 命令执行器：安全地执行各种 git 命令，具有命令白名单和危险命令禁止机制',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: '要执行的 git 命令（不需要包含 "git" 前缀），例如：status, log --oneline -10, branch -a',
      },
    },
    required: ['command'],
  },
};

/**
 * Git 命令工具处理器
 */
export const handler = withErrorHandling(async (args) => {
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
});
