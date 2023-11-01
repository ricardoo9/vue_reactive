// src/rollup.config.js
import babel from 'rollup-plugin-babel'

// 导出 rollup 配置对象
export default {
  // 打包入口
  input: './src/index.js',   
  // 打包出口：可定义为数组，输出多种构件
  output: {                
    // 打包输出文件
    file: 'dist/vue.js',   
    // 打包格式（可选项）：iife（立即执行函数）、esm（ES6 模块）、cjs（Node 规范）、umd（支持 		amd + cjs）
    format: 'umd',         
    // 使用 umd 打包需要指定导出的模块名，Vue 模块将会绑定到 window 上；
    name: 'Vue',          
    // 开启 sourcemap 源码映射，打包时会生成 .map 文件；作用：浏览器调试ES5代码时，可定位到			ES6源代码所在行；
    sourcemap: true,      
  },
  // 使用 Rollup 插件转译代码
  plugins: [
    babel({
      // 忽略 node_modules 目录下所有文件（**：所有文件夹下的所有文件）
      exclude: 'node_modules/**'
    })
  ]
}