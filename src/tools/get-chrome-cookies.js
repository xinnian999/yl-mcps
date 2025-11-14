import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  createResponse,
  withErrorHandling,
} from "../utils.js";

/**
 * 获取 Chrome Cookies 工具定义
 */
export const definition = {
  name: 'get_chrome_cookies',
  description: '获取 Chrome 浏览器中指定网站的所有 cookies',
  inputSchema: {
    type: 'object',
    properties: {
      domain: {
        type: 'string',
        description: '要获取 cookies 的域名，例如：google.com 或 github.com',
      },
      profile: {
        type: 'string',
        description: 'Chrome 用户配置文件名称（可选），默认为 Default',
      },
    },
    required: ['domain'],
  },
};

/**
 * 获取 Chrome Cookies 工具处理器
 */
export const handler = withErrorHandling(async (args) => {
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
});
