import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import init, { format } from 'autocorrect-wasm'

export default class MyPlugin extends Plugin {
	async onload() {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!markdownView) {
			return;
		}

		await init('https://img.ypll.xyz/dev/autocorrect_wasm/pkg/autocorrect_wasm_bg.wasm')

		this.addCommand({
			id: 'formatting-content',
			name: 'Formatting Content',
			callback: () => {
				const editor = markdownView.editor;
				const content = editor.getValue();
				const formattedContent = format(content)
				editor.setValue(formattedContent)
			},
		})
	}

	onunload() { }
}
