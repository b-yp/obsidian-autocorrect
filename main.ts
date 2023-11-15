import { MarkdownView, Plugin } from 'obsidian';
import init, { format } from 'autocorrect-wasm'
import { v4 as uuidv4 } from 'uuid'

// @ts-ignore
import autocorrectWasm from './pkg/autocorrect_wasm_bg.wasm'

export default class AutocorrectPlugin extends Plugin {
	async onload() {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!markdownView) {
			return;
		}

		await init(autocorrectWasm)

		this.addCommand({
			id: 'format-content',
			name: 'Format content',
			callback: () => {
				const editor = markdownView.editor;
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

				let formattedContent = format(content)

				tags?.forEach(i => {
					formattedContent = formattedContent.replace(i.uuid, i.tag)
				})

				linkRefs?.forEach(i => {
					formattedContent = formattedContent.replace(i.uuid, i.linkRef)
				})

				editor.setValue(formattedContent)
			},
		})
	}

	onunload() { }
}
