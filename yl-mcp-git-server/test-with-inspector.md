# 使用 MCP Inspector 测试

## 安装 MCP Inspector

```bash
npx @modelcontextprotocol/inspector node src/index.js
```

这会启动一个 Web 界面，你可以：
- 查看所有可用的工具
- 测试每个工具的调用
- 查看请求和响应
- 调试工具参数

## 使用步骤

1. 在项目根目录运行：
   ```bash
   npx @modelcontextprotocol/inspector node src/index.js
   ```

2. 浏览器会自动打开 Inspector 界面

3. 在界面中可以：
   - 点击 "Tools" 查看所有工具
   - 选择一个工具进行测试
   - 填写参数
   - 点击 "Call Tool" 执行
   - 查看返回结果
