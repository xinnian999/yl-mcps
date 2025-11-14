import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 自动加载所有工具
 */
async function loadTools() {
  const tools = [];
  const handlers = {};
  
  // 读取当前目录下的所有 .js 文件（排除 index.js）
  const files = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
  
  // 动态导入每个工具文件
  for (const file of files) {
    const modulePath = path.join(__dirname, file);
    const module = await import(modulePath);
    
    if (module.definition && module.handler) {
      tools.push(module.definition);
      handlers[module.definition.name] = module.handler;
    }
  }
  
  return { tools, handlers };
}

// 导出加载函数
export { loadTools };
