#!/usr/bin/env node
// 测试模块导入是否正常

console.log('测试模块导入...\n');

try {
  console.log('✓ 导入 config.js');
  await import('./src/config.js');
  
  console.log('✓ 导入 git-commands.js');
  await import('./src/git-commands.js');
  
  console.log('✓ 导入 tool-definitions.js');
  await import('./src/tool-definitions.js');
  
  console.log('✓ 导入 tool-handlers.js');
  await import('./src/tool-handlers.js');
  
  console.log('✓ 导入 server.js');
  await import('./src/server.js');
  
  console.log('✓ 导入 index.js');
  await import('./src/index.js');
  
  console.log('\n✅ 所有模块导入成功！');
} catch (error) {
  console.error('\n❌ 模块导入失败:', error.message);
  process.exit(1);
}
