/* tslint:disable */
/* eslint-disable */
/**
* @param {string} config_str
* @returns {any}
*/
export function loadConfig(config_str: string): any;
/**
* Automatically add spaces between Chinese and English words.
*
* This method only work for plain text.
*
* # Example
*
* ```
* extern crate autocorrect;
*
* println!("{}", autocorrect::format("学习如何用 Rust 构建 Application"));
* // => "学习如何用 Rust 构建 Application"
*
* println!("{}", autocorrect::format("于 3 月 10 日开始"));
* // => "于 3 月 10 日开始"
*
* println!("{}", autocorrect::format("既に、世界中の数百という企業が Rust を採用し、高速で低リソースのクロスプラットフォームソリューションを実現しています。"));
* // => "既に、世界中の数百という企業が Rust を採用し、高速で低リソースのクロスプラットフォームソリューションを実現しています。"
* ```
* @param {string} text
* @returns {string}
*/
export function format(text: string): string;
/**
* Format content with filetype, and return a json result.
* @param {string} raw
* @param {string} filename_or_ext
* @returns {any}
*/
export function formatFor(raw: string, filename_or_ext: string): any;
/**
* Lint content with filetype, and return a json result.
* @param {string} raw
* @param {string} filename_or_ext
* @returns {any}
*/
export function lintFor(raw: string, filename_or_ext: string): any;
/**
*/
export class Ignorer {
  free(): void;
/**
* @param {string} work_dir
*/
  constructor(work_dir: string);
/**
* @param {string} path
* @returns {boolean}
*/
  isIgnored(path: string): boolean;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly loadConfig: (a: number, b: number, c: number) => void;
  readonly __wbg_ignorer_free: (a: number) => void;
  readonly ignorer_new: (a: number, b: number) => number;
  readonly ignorer_isIgnored: (a: number, b: number, c: number) => number;
  readonly format: (a: number, b: number, c: number) => void;
  readonly formatFor: (a: number, b: number, c: number, d: number) => number;
  readonly lintFor: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
