import { Editor, MarkdownView, Plugin, Notice } from 'obsidian';
// @ts-ignore
import * as autocorrectBg from '@huacnlee/autocorrect/autocorrect_bg.js'
import { v4 as uuidv4 } from 'uuid'

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
			name: 'Format content',
			hotkeys: [{ modifiers: ["Mod", "Alt"], key: "f" }],
			editorCallback: editor => {
				this.formatEditorContent(editor);
			},
		});

		// 2. 注册侧边栏快捷按钮 (Ribbon Icon)
		this.addRibbonIcon('align-left', 'Format active note', (evt: MouseEvent) => {
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView) {
				this.formatEditorContent(markdownView.editor);
			} else {
				new Notice('No active note to format');
			}
		});

		// 3. 注册编辑器右键菜单项 (Editor Context Menu)
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item
						.setTitle("Format note")
						.setIcon("align-left")
						.onClick(async () => {
							this.formatEditorContent(editor);
						});
				});
			})
		);
	}

	formatEditorContent(editor: Editor) {
		let content = editor.getValue();

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

		tags?.forEach(i => {
			content = content.replace(i.tag, i.uuid)
		})

		linkRefs?.forEach(i => {
			content = content.replace(i.linkRef, i.uuid)
		})

		const formatted = autocorrectBg.formatFor(content, 'md')
		
		if (formatted.error) {
			return new Notice(formatted.error)
		}
		
		new Notice('Format successful 🎉')

		let formattedContent = formatted.out

		tags?.forEach(i => {
			formattedContent = formattedContent.replace(i.uuid, i.tag)
		})

		linkRefs?.forEach(i => {
			formattedContent = formattedContent.replace(i.uuid, i.linkRef)
		})

		editor.setValue(formattedContent)
	}

	onunload() { }
}
