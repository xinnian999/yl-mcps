import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 调试工具类
 */
export class DebugUtils {
  constructor() {
    this.debugMode = process.env.DEBUG === 'true' || process.argv.includes('--debug');
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE || path.join(__dirname, '../debug.log');
    
    // 创建日志目录
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * 记录调试信息
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      pid: process.pid,
      cwd: process.cwd()
    };

    // 控制台输出
    if (this.debugMode || level === 'error') {
      const colorCode = this.getColorCode(level);
      console.error(`${colorCode}[${timestamp}] [${level.toUpperCase()}] ${message}${this.getResetCode()}`);
      if (data) {
        console.error(JSON.stringify(data, null, 2));
      }
    }

    // 文件输出
    try {
      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * 获取颜色代码
   */
  getColorCode(level) {
    const colors = {
      debug: '\x1b[36m',    // 青色
      info: '\x1b[32m',     // 绿色
      warn: '\x1b[33m',     // 黄色
      error: '\x1b[31m',    // 红色
    };
    return colors[level] || '\x1b[0m';
  }

  /**
   * 重置颜色
   */
  getResetCode() {
    return '\x1b[0m';
  }

  /**
   * 调试级别日志
   */
  debug(message, data = null) {
    this.log('debug', message, data);
  }

  /**
   * 信息级别日志
   */
  info(message, data = null) {
    this.log('info', message, data);
  }

  /**
   * 警告级别日志
   */
  warn(message, data = null) {
    this.log('warn', message, data);
  }

  /**
   * 错误级别日志
   */
  error(message, data = null) {
    this.log('error', message, data);
  }

  /**
   * 记录工具调用
   */
  logToolCall(toolName, args, result = null, error = null) {
    const logData = {
      tool: toolName,
      arguments: args,
      result: result ? (typeof result === 'string' ? result.substring(0, 500) : result) : null,
      error: error ? error.message : null,
      duration: Date.now()
    };

    if (error) {
      this.error(`Tool call failed: ${toolName}`, logData);
    } else {
      this.info(`Tool call: ${toolName}`, logData);
    }
  }

  /**
   * 记录系统信息
   */
  logSystemInfo() {
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      env: {
        DEBUG: process.env.DEBUG,
        LOG_LEVEL: process.env.LOG_LEVEL,
        NODE_ENV: process.env.NODE_ENV
      },
      argv: process.argv,
      memoryUsage: process.memoryUsage()
    };

    this.info('System Information', systemInfo);
  }

  /**
   * 清理日志文件
   */
  clearLogs() {
    try {
      if (fs.existsSync(this.logFile)) {
        fs.unlinkSync(this.logFile);
        this.info('Log file cleared');
      }
    } catch (error) {
      this.error('Failed to clear log file', error);
    }
  }

  /**
   * 获取日志内容
   */
  getLogs(lines = 100) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const logLines = content.trim().split('\n').filter(line => line);
      
      return logLines
        .slice(-lines)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { message: line, timestamp: new Date().toISOString() };
          }
        });
    } catch (error) {
      this.error('Failed to read log file', error);
      return [];
    }
  }

  /**
   * 创建调试报告
   */
  createDebugReport() {
    const report = {
      timestamp: new Date().toISOString(),
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        memoryUsage: process.memoryUsage()
      },
      recentLogs: this.getLogs(50),
      gitStatus: null
    };

    // 尝试获取 Git 状态
    try {
      // 首先检查是否在 Git 仓库中
      execSync('git rev-parse --git-dir', { encoding: 'utf8', stdio: 'pipe' });
      
      report.gitStatus = {
        branch: execSync('git branch --show-current', { encoding: 'utf8' }).trim(),
        status: execSync('git status --porcelain', { encoding: 'utf8' }).trim(),
        remotes: execSync('git remote -v', { encoding: 'utf8' }).trim()
      };
    } catch (error) {
      if (error.message.includes('not a git repository')) {
        report.gitStatus = { 
          error: '当前目录不是 Git 仓库',
          cwd: process.cwd(),
          suggestion: '请在 Git 仓库目录中使用 MCP 服务器'
        };
      } else {
        report.gitStatus = { error: error.message };
      }
    }

    return report;
  }
}

// 创建全局调试实例
export const debugUtils = new DebugUtils();
