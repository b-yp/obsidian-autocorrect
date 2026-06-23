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
			},
		})
	}

	onunload() { }
}
