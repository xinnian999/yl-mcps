import fs from "fs";
import path from "path";
import { execSync } from "child_process";
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
  
  get_chrome_cookies: withErrorHandling(async (args) => {
    const domain = args?.domain;
    const profile = args?.profile || "Default";
    
    if (!domain) {
      throw new Error("请提供要获取 cookies 的域名");
    }
    
    // 获取 Chrome cookie 文件路径（MacOS路径）
    const cookieDbPath = path.join(
      process.env.HOME || process.env.USERPROFILE,
      'Library',
      'Application Support',
      'Google',
      'Chrome',
      profile,
      'Cookies'
    );
    
    // 检查 cookie 文件是否存在
    if (!fs.existsSync(cookieDbPath)) {
      return createResponse(`⚠️ Chrome cookie 数据库文件不存在: ${cookieDbPath}\n请确保 Chrome 已安装并使用此配置文件登录过网站。`);
    }
    
    // 简化查询逻辑，避免SQL注入风险
    const safeDomain = domain.replace(/'/g, "''"); // 转义单引号
    
    try {
      // 使用绝对路径调用sqlite3并使用简化查询
      const sqlite3Path = '/usr/local/bin/sqlite3';
      let command;
      
      // 检查sqlite3是否存在，使用备选路径
      if (fs.existsSync(sqlite3Path)) {
        command = `${sqlite3Path} "${cookieDbPath}" ".headers on" ".mode column" "SELECT host_key, name, value, path FROM cookies WHERE host_key LIKE '%${safeDomain}%' LIMIT 50"`;
      } else {
        command = `sqlite3 "${cookieDbPath}" ".headers on" ".mode column" "SELECT host_key, name, value, path FROM cookies WHERE host_key LIKE '%${safeDomain}%' LIMIT 50"`;
      }
      
      // 执行查询
      const cookiesData = execSync(command, { 
        encoding: 'utf-8',
        timeout: 5000 // 5秒超时
      });
      
      // 返回结果
      if (cookiesData.trim()) {
        return createResponse(`🍪 Chrome Cookies 获取成功\n\n域名: ${domain}\n配置文件: ${profile}\n\n查询结果:\n${cookiesData.trim()}`);
      } else {
        return createResponse(`🍪 未找到与域名 "${domain}" 相关的 cookies\n请确保已访问过该网站并保存了cookies。`);
      }
    } catch (error) {
      // 详细的错误处理
      if (error.code === 'ENOENT') {
        return createResponse('❌ 未找到 sqlite3 命令行工具\n请先安装: brew install sqlite3');
      }
      if (error.killed) {
        return createResponse('❌ 查询超时\n可能是cookie数据库过大或查询复杂，请尝试更精确的域名。');
      }
      return createResponse(`❌ 获取Chrome Cookies失败\n错误信息: ${error.message}\n\n提示: 可能是Chrome正在运行锁定了数据库，请尝试关闭Chrome后重试。`);
    }
  }),
};
