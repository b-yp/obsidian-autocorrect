import { Editor, MarkdownView, Plugin, Notice, Modal, Setting, PluginSettingTab, TFolder, TFile, App } from 'obsidian';
// @ts-ignore
import * as autocorrectBg from '@huacnlee/autocorrect/autocorrect_bg.js'
import { v4 as uuidv4 } from 'uuid'
import { t } from './lang/helpers'

// @ts-ignore
import autocorrectWasmBytes from '@huacnlee/autocorrect/autocorrect_bg.wasm'

export default class AutocorrectPlugin extends Plugin {
	async onload() {
		const importObject = {
			"./autocorrect_bg.js": {
				__wbindgen_json_parse: autocorrectBg.__wbindgen_json_parse,
				__wbindgen_error_new: autocorrectBg.__wbindgen_error_new,
				__wbindgen_throw: autocorrectBg.__wbindgen_throw,
				__wbindgen_init_externref_table: autocorrectBg.__wbindgen_init_externref_table,
			}
		};

		const { instance } = await WebAssembly.instantiate(autocorrectWasmBytes, importObject);
		autocorrectBg.__wbg_set_wasm(instance.exports);

		if (instance.exports.__wbindgen_start) {
			(instance.exports.__wbindgen_start as Function)();
		}

		// 1. 注册快捷键与命令
		this.addCommand({
			id: 'format-content',
			name: t('format-content'),
			hotkeys: [{ modifiers: ["Mod", "Alt"], key: "f" }],
			editorCallback: editor => {
				this.formatEditorContent(editor);
			},
		});

		// 2. 注册侧边栏快捷按钮 (Ribbon Icon)
		this.addRibbonIcon('align-left', t('format-active-note'), (evt: MouseEvent) => {
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView) {
				this.formatEditorContent(markdownView.editor);
			} else {
				new Notice(t('no-active-note'));
			}
		});

		// 3. 注册编辑器右键菜单项 (Editor Context Menu)
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item
						.setTitle(t('format-note'))
						.setIcon("align-left")
						.onClick(async () => {
							this.formatEditorContent(editor);
						});
				});
			})
		);

		// 4. 注册文件夹右键菜单监听 (file-menu)
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFolder) {
					const folder = file as TFolder;
					menu.addItem((item) => {
						item
							.setTitle(t('format-folder'))
							.setIcon("align-left")
							.onClick(() => {
								const mdFiles = this.getMarkdownFilesUnderFolder(folder);
								if (mdFiles.length === 0) {
									new Notice(t('no-md-in-folder'));
									return;
								}
								new BulkFormatModal(this.app, mdFiles, this).open();
							});
					});
				}
			})
		);

		// 5. 注册全局设置面板
		this.addSettingTab(new AutocorrectSettingTab(this.app, this));
	}

	// 递归获取某个文件夹下的所有 md 文件
	getMarkdownFilesUnderFolder(folder: TFolder): TFile[] {
		const files: TFile[] = [];
		const recurse = (item: TFolder) => {
			for (const child of item.children) {
				if (child instanceof TFile && child.extension === 'md') {
					files.push(child);
				} else if (child instanceof TFolder) {
					recurse(child);
				}
			}
		};
		recurse(folder);
		return files;
	}

	// 纯文字的 Markdown 格式化方法，可复用
	formatMarkdownText(content: string): string {
		const tagReg = /#[^\s#]+/g
		const linkRefReg = /\[\[.*?\]\]/g

		const tags = content.match(tagReg)?.map(i => {
			const uuid = uuidv4()
			return { tag: i, uuid }
		})
		const linkRefs = content.match(linkRefReg)?.map(i => {
			const uuid = uuidv4()
			return { linkRef: i, uuid }
		})

		let tempContent = content;
		tags?.forEach(i => {
			tempContent = tempContent.replace(i.tag, i.uuid)
		})

		linkRefs?.forEach(i => {
			tempContent = tempContent.replace(i.linkRef, i.uuid)
		})

		const formatted = autocorrectBg.formatFor(tempContent, 'md')
		
		if (formatted.error) {
			throw new Error(formatted.error);
		}

		let formattedContent = formatted.out

		tags?.forEach(i => {
			formattedContent = formattedContent.replace(i.uuid, i.tag)
		})

		linkRefs?.forEach(i => {
			formattedContent = formattedContent.replace(i.uuid, i.linkRef)
		})

		return formattedContent;
	}

	formatEditorContent(editor: Editor) {
		const original = editor.getValue();
		try {
			const formatted = this.formatMarkdownText(original);
			if (original !== formatted) {
				editor.setValue(formatted);
			}
			new Notice(t('format-success'));
		} catch (e) {
			new Notice(t('format-failed') + (e.message || String(e)));
		}
	}

	onunload() { }
}

interface BulkFormatResult {
	successCount: number;
	failCount: number;
	failures: Array<{ path: string; error: string }>;
}

// 批量格式化进度弹窗
class BulkFormatModal extends Modal {
	files: TFile[];
	plugin: AutocorrectPlugin;
	isCancelled = false;

	constructor(app: App, files: TFile[], plugin: AutocorrectPlugin) {
		super(app);
		this.files = files;
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		this.titleEl.setText(t('bulk-title'));
		
		// 阶段一：备份警告确认界面
		this.renderWarningPhase();
	}

	renderWarningPhase() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('p', {
			text: t('bulk-desc', { count: this.files.length }),
			cls: 'bulk-format-bold'
		});

		const warningBox = contentEl.createEl('div', { cls: 'bulk-format-warning-box' });
		warningBox.createEl('h3', { text: t('bulk-warning-title'), cls: 'bulk-format-warning-title' });
		warningBox.createEl('p', { 
			text: t('bulk-warning-content')
		});

		// 确认备份的 checkbox
		const checkboxContainer = contentEl.createEl('div', { cls: 'bulk-format-checkbox-container' });
		const checkbox = checkboxContainer.createEl('input', { type: 'checkbox' }) as HTMLInputElement;
		checkbox.id = 'bulk-format-backup-confirm';
		const label = checkboxContainer.createEl('label', { 
			text: t('bulk-backup-confirm')
		});
		label.setAttribute('for', checkbox.id);

		// 按钮栏
		const buttonContainer = contentEl.createEl('div', { cls: 'bulk-format-button-container' });
		const cancelBtn = buttonContainer.createEl('button', { text: t('bulk-cancel') });
		const startBtn = buttonContainer.createEl('button', { 
			text: t('bulk-start'), 
			cls: 'mod-warning' 
		}) as HTMLButtonElement;
		startBtn.disabled = true;

		// 监听勾选
		checkbox.addEventListener('change', () => {
			startBtn.disabled = !checkbox.checked;
		});

		cancelBtn.addEventListener('click', () => this.close());
		startBtn.addEventListener('click', () => {
			this.renderProgressPhase();
		});
	}

	async renderProgressPhase() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('p', { text: t('bulk-running') });

		// 进度条
		const progressContainer = contentEl.createEl('div', { cls: 'bulk-format-progress-container' });
		const progressBar = progressContainer.createEl('progress') as HTMLProgressElement;
		progressBar.max = this.files.length;
		progressBar.value = 0;

		const progressText = contentEl.createEl('p', { text: t('bulk-processed', { current: 0, total: this.files.length }) });
		const currentFileText = contentEl.createEl('p', { text: '', cls: 'bulk-format-current-file' });

		// 取消按钮
		const buttonContainer = contentEl.createEl('div', { cls: 'bulk-format-button-container' });
		const stopBtn = buttonContainer.createEl('button', { text: t('bulk-stop'), cls: 'mod-warning' });
		stopBtn.addEventListener('click', () => {
			this.isCancelled = true;
			stopBtn.disabled = true;
			stopBtn.setText(t('bulk-stopping'));
		});

		// 开始循环格式化
		let successCount = 0;
		let failCount = 0;
		const failures: Array<{ path: string; error: string }> = [];

		for (let i = 0; i < this.files.length; i++) {
			if (this.isCancelled) {
				break;
			}

			const file = this.files[i];
			progressBar.value = i + 1;
			progressText.setText(t('bulk-processed', { current: i + 1, total: this.files.length }));
			currentFileText.setText(t('bulk-processing', { path: file.path }));

			try {
				const rawContent = await this.app.vault.read(file);
				const formattedContent = this.plugin.formatMarkdownText(rawContent);

				if (rawContent !== formattedContent) {
					await this.app.vault.modify(file, formattedContent);
				}
				successCount++;
			} catch (e) {
				failCount++;
				failures.push({ path: file.path, error: e.message || String(e) });
			}

			// 异步让出主线程
			await new Promise(resolve => setTimeout(resolve, 5));
		}

		// 渲染完成阶段
		this.renderResultPhase({ successCount, failCount, failures });
	}

	renderResultPhase(result: BulkFormatResult) {
		const { contentEl } = this;
		contentEl.empty();

		const title = this.isCancelled ? t('bulk-stopped-title') : t('bulk-completed-title');
		contentEl.createEl('h3', { text: title });

		contentEl.createEl('p', { text: t('bulk-success-count', { count: result.successCount }) });
		contentEl.createEl('p', { text: t('bulk-fail-count', { count: result.failCount }) });

		if (result.failures.length > 0) {
			contentEl.createEl('h4', { text: t('bulk-fail-list-title') });
			const list = contentEl.createEl('ul', { cls: 'bulk-format-failure-list' });
			const displayLimit = 10;
			const displayFailures = result.failures.slice(0, displayLimit);
			displayFailures.forEach(f => {
				const item = list.createEl('li');
				item.createEl('b', { text: f.path });
				item.createSpan({ text: `: ${f.error}` });
			});

			if (result.failures.length > displayLimit) {
				list.createEl('li', { text: t('bulk-fail-more', { count: result.failures.length - displayLimit }) });
			}
		}

		const buttonContainer = contentEl.createEl('div', { cls: 'bulk-format-button-container' });
		const closeBtn = buttonContainer.createEl('button', { text: t('bulk-close') });
		closeBtn.addEventListener('click', () => this.close());
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// 设置面板 Tab
class AutocorrectSettingTab extends PluginSettingTab {
	plugin: AutocorrectPlugin;

	constructor(app: App, plugin: AutocorrectPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: t('settings-title') });

		new Setting(containerEl)
			.setName(t('settings-bulk-name'))
			.setDesc(t('settings-bulk-desc'))
			.addButton(button => button
				.setButtonText(t('settings-bulk-btn'))
				.setWarning()
				.onClick(() => {
					new BulkFormatModal(this.app, this.app.vault.getMarkdownFiles(), this.plugin).open();
				}));
	}
}
