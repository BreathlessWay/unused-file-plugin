const fs = require("fs-extra");
const fg = require("fast-glob");

const pluginName = "UnusedFileListPlugin";

class UnusedFileListPlugin {
	/**!
	 * 插件初始化参数
	 * @param {object} [options] - 对象参数
	 * @param {string} [options.dir=src] - 所查找的目录，默认 src
	 * @param {boolean} [options.remove=false] - 是否删除未使用的文件，默认 false
	 * @param {string[]} [options.whitelist] - 不需要被标记为无用文件的列表
	 * @param {string[]} [options.whiteExt] - 不需要被标记为无用文件后缀名
	 */
	constructor(options) {
		this.dir = options?.dir ?? "src";
		this.remove = options?.remove ?? false;
		this.allFileList = new Set();
		this.whitelist = options?.whitelist ?? [];
		this.whiteExt = options?.whiteExt ?? [];
	}

	getSourceFileList = (cwd) => {
		const allFileList = fg.sync(`${this.dir}/**/*`, {
			dot: true,
			cwd,
			absolute: true,
		});
		this.allFileList = new Set(allFileList);
	};

	ignoreFile = (filePath) => {
		if (this.whitelist.length && this.whitelist.includes(filePath)) {
			return true;
		}

		if (this.whiteExt.length && filePath?.endsWith(this.whiteExt)) {
			for (let i = 0, len = this.whiteExt.length; i < len; i++) {
				const ext = this.whiteExt[i];
				if (filePath?.endsWith(ext)) {
					return true;
				}
			}
		}

		return false;
	};

	sliceFilePath = (resource) => {
		return resource.replace(/\?.*$/, "");
	};

	removeUnusedFile = (cwd) => {
		const unusedFileList = [];
		this.allFileList.forEach((file) => {
			if (!this.ignoreFile(file)) {
				unusedFileList.push(file);
				if (this.remove) {
					fs.removeSync(file);
				}
			}
		});

		fs.outputJsonSync(
			`${cwd}/unused-plugin-file.json`,
			{
				unused: unusedFileList,
			},
			{
				spaces: "\t",
			}
		);
	};
}

export class WebpackUnusedFileListPlugin extends UnusedFileListPlugin {
	apply(compiler) {
		// compiler.hooks.compilation.tap('RecordUsedFilesPlugin', (compilation) => {
		// 	compilation.hooks.finishModules.tap('RecordUsedFilesPlugin', (modules) => {
		// 		modules.forEach(module => {
		// 			// 获取模块的原始文件路径
		// 			const resource = module.resource;
		// 			if (resource && resource.startsWith(resolve(__dirname, 'src'))) {
		// 				console.log(resource.replace(/\?.*$/, ''));
		// 			}
		// 		});
		// 	});
		// });
		//
		// return

		compiler.hooks.emit.tapAsync(pluginName, (compilation, callback) => {
			this.getSourceFileList(compilation.compiler.context);
			// Explore each chunk (build output):
			compilation.chunks.forEach((chunk) => {
				// Explore each module within the chunk (built inputs):
				chunk.getModules().forEach((module) => {
					// Explore each source file path that was included into the module:
					module.buildInfo &&
					module.buildInfo.fileDependencies &&
					module.buildInfo.fileDependencies.forEach((filepath) => {
						// we've learned a lot about the source structure now...
						filepath = this.sliceFilePath(filepath);
						this.allFileList.has(filepath) &&
						this.allFileList.delete(filepath);
					});
				});
			});
			this.removeUnusedFile(compilation.compiler.context);
			callback();
		});
	}
}

export class ViteUnusedFileListPlugin extends UnusedFileListPlugin {
	init = () => {
		const cwd = process.cwd();
		this.getSourceFileList(cwd);
		const _this = this;

		return {
			name: "unused-file-list-plugin",
			resolveId(source, importPath) {
				const _importPath = _this.sliceFilePath(importPath);
				_this.allFileList.has(_importPath) &&
				_this.allFileList.delete(_importPath);
				return null;
			},
			transform(code, id) {
				const _id = _this.sliceFilePath(id);
				_this.allFileList.has(_id) && _this.allFileList.delete(_id);
				return null;
			},
			buildEnd() {
				_this.removeUnusedFile(cwd);
			},
		};
	};
}
