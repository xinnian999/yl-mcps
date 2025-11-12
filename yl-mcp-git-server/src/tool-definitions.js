/**
 * MCP 工具定义
 */
export const TOOL_DEFINITIONS = [
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
  },
  {
    name: 'git_status',
    description: '查看 git 状态',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'git_diff',
    description: '查看当前的改动内容（git diff 和 git diff --cached），用于生成 commit 信息',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'git_add',
    description: '添加文件到暂存区（git add）',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'string',
          description: '要添加的文件路径，使用 "." 添加所有文件，或指定具体文件路径',
          default: '.',
        },
      },
    },
  },
  {
    name: 'git_smart_commit',
    description: '智能提交：先读取改动内容，AI 生成合适的 commit 信息后再提交并推送',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'AI 生成的 commit 信息',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'debug_info',
    description: '获取调试信息和系统状态，用于故障排除',
    inputSchema: {
      type: 'object',
      properties: {
        include_logs: {
          type: 'boolean',
          description: '是否包含最近的日志记录',
          default: true,
        },
        log_lines: {
          type: 'number',
          description: '要包含的日志行数',
          default: 50,
        },
      },
    },
  },
  {
    name: 'debug_clear_logs',
    description: '清理调试日志文件',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'debug_working_dir',
    description: '显示工作目录信息，用于调试目录相关问题',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
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
];
