/**
 * MCP 工具定义
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'set_working_dir',
    description: '设置 Git 操作的工作目录',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '要设置的工作目录路径',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'git_smart_checkout',
    description: '智能切换分支：自动同步远程并切换到指定分支（自动处理本地分支创建和跟踪）',
    inputSchema: {
      type: 'object',
      properties: {
        branch_number: {
          type: 'string',
          description: '分支名称（完整的分支名称）',
        },
      },
      required: ['branch_number'],
    },
  },
  {
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
  },
  {
    name: 'git_init',
    description: '初始化 git 仓库,可选择性添加远程仓库地址',
    inputSchema: {
      type: 'object',
      properties: {
        remote_url: {
          type: 'string',
          description: '远程仓库地址 (可选),例如: git@github.com:username/repo.git',
        },
        branch: {
          type: 'string',
          description: '默认分支名称 (可选,默认为 main)',
          default: 'main',
        },
      },
    },
  }
];
