import fs from "fs";
import {
  createResponse,
  withErrorHandling,
  setGlobalWorkingDirectory,
} from "../utils.js";

/**
 * 设置工作目录工具定义
 */
export const definition = {
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
};

/**
 * 设置工作目录工具处理器
 */
export const handler = withErrorHandling(async (args) => {
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
});
