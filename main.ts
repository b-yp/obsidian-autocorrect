import { Editor, MarkdownView, Plugin, Notice } from 'obsidian';
import init, { formatFor } from 'autocorrect-wasm'
import { v4 as uuidv4 } from 'uuid'

// @ts-ignore
import autocorrectWasm from './pkg/autocorrect_wasm_bg.wasm'

export default class AutocorrectPlugin extends Plugin {
	async onload() {
		await init(autocorrectWasm)

		this.addCommand({
			id: 'format-content',
			name: 'Format content',
			editorCallback: editor => {
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

				const formatted = formatFor(content, 'md')
				
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
			},
		})
	}

	onunload() { }
}
