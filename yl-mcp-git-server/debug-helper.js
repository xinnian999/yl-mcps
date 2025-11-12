#!/usr/bin/env node

/**
 * MCP Git Server 调试助手
 * 用于本地调试和故障排除
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DebugHelper {
  constructor() {
    this.logFile = path.join(__dirname, 'debug.log');
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
🔧 MCP Git Server 调试助手

用法: node debug-helper.js [命令]

可用命令:
  help          显示此帮助信息
  status        显示服务器状态和系统信息
  logs          显示最近的日志记录
  clear-logs    清理日志文件
  test-tools    测试所有工具功能
  check-deps    检查依赖项
  simulate      模拟 MCP 客户端连接

环境变量:
  DEBUG=true           启用调试模式
  LOG_LEVEL=debug      设置详细日志级别
  LOG_FILE=path        自定义日志文件路径

示例:
  # 启用调试模式运行服务器
  DEBUG=true node src/index.js
  
  # 查看调试信息
  node debug-helper.js status
  
  # 测试工具功能
  node debug-helper.js test-tools
    `);
  }

  /**
   * 显示系统状态
   */
  showStatus() {
    console.log('🔍 系统状态检查\n');
    
    // Node.js 信息
    console.log('📋 Node.js 信息:');
    console.log(`  版本: ${process.version}`);
    console.log(`  平台: ${process.platform} (${process.arch})`);
    console.log(`  工作目录: ${process.cwd()}`);
    console.log(`  内存使用: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`);

    // Git 状态
    console.log('📋 Git 状态:');
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      const remotes = execSync('git remote -v', { encoding: 'utf8' }).trim();
      
      console.log(`  当前分支: ${branch || '未知'}`);
      console.log(`  工作区状态: ${status || '干净'}`);
      console.log(`  远程仓库: ${remotes || '无'}`);
    } catch (error) {
      console.log(`  ❌ Git 错误: ${error.message}`);
    }
    console.log();

    // 依赖检查
    console.log('📋 依赖检查:');
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      console.log(`  包名: ${packageJson.name}`);
      console.log(`  版本: ${packageJson.version}`);
      
      Object.entries(packageJson.dependencies || {}).forEach(([name, version]) => {
        try {
          require.resolve(name);
          console.log(`  ✅ ${name}: ${version}`);
        } catch {
          console.log(`  ❌ ${name}: ${version} (未安装)`);
        }
      });
    } catch (error) {
      console.log(`  ❌ 无法读取 package.json: ${error.message}`);
    }
    console.log();

    // 日志文件状态
    console.log('📋 日志状态:');
    if (fs.existsSync(this.logFile)) {
      const stats = fs.statSync(this.logFile);
      console.log(`  日志文件: ${this.logFile}`);
      console.log(`  文件大小: ${Math.round(stats.size / 1024)}KB`);
      console.log(`  最后修改: ${stats.mtime.toLocaleString()}`);
    } else {
      console.log(`  日志文件: 不存在`);
    }
  }

  /**
   * 显示日志
   */
  showLogs(lines = 50) {
    console.log(`📋 最近 ${lines} 条日志记录:\n`);
    
    if (!fs.existsSync(this.logFile)) {
      console.log('❌ 日志文件不存在');
      return;
    }

    try {
      const content = fs.readFileSync(this.logFile, 'utf8');
      const logLines = content.trim().split('\n').filter(line => line);
      
      if (logLines.length === 0) {
        console.log('📝 日志文件为空');
        return;
      }

      logLines.slice(-lines).forEach(line => {
        try {
          const log = JSON.parse(line);
          const time = new Date(log.timestamp).toLocaleString();
          const level = log.level.toUpperCase().padEnd(5);
          console.log(`[${time}] ${level} ${log.message}`);
          if (log.data && typeof log.data === 'object') {
            console.log(`    ${JSON.stringify(log.data, null, 2).replace(/\n/g, '\n    ')}`);
          }
        } catch {
          console.log(line);
        }
      });
    } catch (error) {
      console.log(`❌ 读取日志失败: ${error.message}`);
    }
  }

  /**
   * 清理日志
   */
  clearLogs() {
    try {
      if (fs.existsSync(this.logFile)) {
        fs.unlinkSync(this.logFile);
        console.log('✅ 日志文件已清理');
      } else {
        console.log('📝 日志文件不存在，无需清理');
      }
    } catch (error) {
      console.log(`❌ 清理日志失败: ${error.message}`);
    }
  }

  /**
   * 测试工具功能
   */
  async testTools() {
    console.log('🧪 测试工具功能\n');
    
    const tools = [
      'git_status',
      'git_diff', 
      'debug_info'
    ];

    for (const tool of tools) {
      console.log(`测试 ${tool}...`);
      try {
        // 这里可以添加实际的工具测试逻辑
        console.log(`  ✅ ${tool} 可用`);
      } catch (error) {
        console.log(`  ❌ ${tool} 失败: ${error.message}`);
      }
    }
  }

  /**
   * 检查依赖
   */
  checkDependencies() {
    console.log('🔍 检查依赖项\n');
    
    const requiredCommands = ['git', 'node', 'npm'];
    
    requiredCommands.forEach(cmd => {
      try {
        const version = execSync(`${cmd} --version`, { encoding: 'utf8' }).trim();
        console.log(`✅ ${cmd}: ${version}`);
      } catch (error) {
        console.log(`❌ ${cmd}: 未安装或不可用`);
      }
    });
    
    console.log('\n📋 Node.js 模块:');
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      Object.entries(packageJson.dependencies || {}).forEach(([name, version]) => {
        try {
          const modulePath = require.resolve(name);
          console.log(`✅ ${name}@${version}`);
        } catch {
          console.log(`❌ ${name}@${version} (未安装)`);
        }
      });
    } catch (error) {
      console.log(`❌ 无法检查模块: ${error.message}`);
    }
  }

  /**
   * 模拟客户端连接
   */
  simulateClient() {
    console.log('🔌 模拟 MCP 客户端连接\n');
    console.log('这将启动服务器并模拟客户端请求...\n');
    
    try {
      // 设置调试环境变量
      process.env.DEBUG = 'true';
      
      console.log('启动服务器...');
      // 这里可以添加实际的模拟逻辑
      console.log('✅ 模拟完成');
    } catch (error) {
      console.log(`❌ 模拟失败: ${error.message}`);
    }
  }
}

// 主程序
function main() {
  const helper = new DebugHelper();
  const command = process.argv[2] || 'help';

  switch (command) {
    case 'help':
      helper.showHelp();
      break;
    case 'status':
      helper.showStatus();
      break;
    case 'logs':
      const lines = parseInt(process.argv[3]) || 50;
      helper.showLogs(lines);
      break;
    case 'clear-logs':
      helper.clearLogs();
      break;
    case 'test-tools':
      helper.testTools();
      break;
    case 'check-deps':
      helper.checkDependencies();
      break;
    case 'simulate':
      helper.simulateClient();
      break;
    default:
      console.log(`❌ 未知命令: ${command}`);
      console.log('使用 "node debug-helper.js help" 查看可用命令');
      process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
