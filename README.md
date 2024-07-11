# 找出 webpack/vite 构建的项目中未被使用的文件的 webpack/vite 插件

https://github.com/BreathlessWay/unused-file-plugin

## Usage

> npm i @breathlessway/unused-file-plugin -D

> webpack 中
```javascript

const { WebpackUnusedFileListPlugin } = require('@breathlessway/unused-file-plugin')

plugins:[
	new WebpackUnusedFileListPlugin({ 
        dir: 'src', // 搜索文件的入口目录，默认 src,
        remove: false, // 是否移除未使用文件，默认 false
        whitelist: [], // 不需要被标记为无用文件的列表，需要是完整的路径 resouve(__dirname, '文件路径')
        whiteExt: [] // 不需要被标记为无用文件的后缀名列表
    })
]

```

> vite 中
```javascript

const { ViteUnusedFileListPlugin } = require('@breathlessway/unused-file-plugin')

plugins: [
	new ViteUnusedFileListPlugin({ 
        dir: 'src', // 搜索文件的入口目录，默认 src,
        remove: false, // 是否移除未使用文件，默认 false
        whitelist: [], // 不需要被标记为无用文件的列表，需要是完整的路径 resouve(__dirname, '文件路径')
        whiteExt: ['.d.ts'], // 不需要被标记为无用文件的后缀名列表
	}).init()
]

```
