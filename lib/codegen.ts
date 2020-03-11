import type { Ast, Dependencies, MemoryLayout, Token, RawMapping, CodeGenReturn } from './interfaces.ts';

class OutputGenerator {
	private readonly _indentationStr: string;
	private readonly _program: Readonly<Ast.Program>;
	private readonly _mem: Readonly<MemoryLayout>;
	private readonly _deps: Readonly<Dependencies>;
	private _res!: string;
	private _rawMapping!: RawMapping;
	private _lineno!: number;
	private _indentationLevel!: number;

	public constructor(program: Ast.Program, indentationStr='\u0020\u0020') {
		this._indentationStr = indentationStr;
		if (!program.mem) {
			throw new Error('Memory is not laid out');
		}
		if (!program.deps) {
			throw new Error('Dependencies are not resolved');
		}
		this._program = program;
		this._deps = program.deps;
		this._mem = program.mem;
	}

	public generateCode(): CodeGenReturn {
		this._res = '';
		this._rawMapping = [];
		this._lineno = 0;
		this._indentationLevel = 0;

		this._line(`(module`);
		this._indent(+1);
		this._genImports();
		this._genMemory();
		this._genIo();
		this._genStart();
		this._genData();
		this._indent(-1);
		this._line(`)`);

		return {
			result: this._res,
			rawMapping: this._rawMapping
		};
	}

	private _indent(indentationDelta: number): void {
		this._indentationLevel += indentationDelta;
	}

	/**
	 * Add a line to the output and generate a mapping.
	 */
	protected _line(str: string, sourceTokens: Token[] | null = null): void {
		const indentation = this._indentationStr.repeat(this._indentationLevel);

		const lines = str.split('\n').map(s => s.trim()).filter(Boolean);

		if (!lines.length) {
			return;
		}

		if (sourceTokens) {
			for (const sourceToken of sourceTokens) {
				if (!this._rawMapping[this._lineno]) {
					this._rawMapping[this._lineno] = [];
				}
				this._rawMapping[this._lineno].push([indentation.length, sourceToken]);
			}
		}

		for (const line of lines) {
			this._res += `${indentation}${line}\n`;
			this._lineno++;
		}
	}

	protected _genImports(): void {
		if (this._deps.fdRead) {
			this._line(`(func $fd_read (i` + `mport "wasi_unstable" "fd_read") (param i32 i32 i32 i32) (result i32))`);
		}
		if (this._deps.fdWrite) {
			this._line(`(func $fd_write (i` + `mport "wasi_unstable" "fd_write") (param i32 i32 i32 i32) (result i32))`);
		}
		if (this._deps.procExit) {
			this._line(`(func $proc_exit (i` + `mport "wasi_unstable" "proc_exit") (param i32))`);
		}
	}

	protected _genMemory(): void {
		const pages = Math.ceil(this._mem.len / 0x10000);
		this._line(`(memory $mem (export "memory") ${pages})`);
	}

	protected _genIo(): void {
		if (this._deps.putChar) {
			const iovec = '0x' + this._mem.io!.iovec.toString(16);
			const rv = '0x' + this._mem.io!.rv.toString(16);
			this._line(`(func $putChar (param $ptr i32)`);
			this._indent(+1);
			this._line(`
				;; Update pointer in iovec
				(i32.store (i32.const ${iovec}) (local.get $ptr))
				;; Ignore errors
				(drop
			`);
			this._indent(+1);
			this._line(`
				;; Call fd_write with that iovec
				(call $fd_write
			`);
			this._indent(+1);
			this._line(`
				(i32.const 1) ;; fd, 1 = stdout
				(i32.const ${iovec}) (i32.const 1) ;; *iovs, iovs_len
				(i32.const ${rv}) ;; where to write written count
			`);
			this._indent(-1);
			this._line(`)`);
			this._indent(-1);
			this._line(`)`);
			this._indent(-1);
			this._line(`)`);
		}
		if (this._deps.getChar) {
			const iovec = '0x' + this._mem.io!.iovec.toString(16);
			const rv = '0x' + this._mem.io!.rv.toString(16);
			this._line(`(func $getChar (param $ptr i32)`);
			this._indent(+1);
			this._line(`
				;; Default: -1
				(i32.store (local.get $ptr) (i32.const -1))
				;; Update pointer in iovec
				(i32.store (i32.const ${iovec}) (local.get $ptr))
				;; Ignore errors
				(drop
			`);
			this._indent(+1);
			this._line(`
				;; Call fd_read with that iovec
				(call $fd_write
			`);
			this._indent(+1);
			this._line(`
				(i32.const 0) ;; fd, 0 = stdin
				(i32.const ${iovec}) (i32.const 1) ;; *iovs, iovs_len
				(i32.const ${rv}) ;; where to write written count
			`);
			this._indent(-1);
			this._line(`)`);
			this._indent(-1);
			this._line(`)`);
			this._indent(-1);
			this._line(`)`);
		}
	}

	protected _genData() {
		if (this._mem.snapshot.byteLength === 0) {
			return;
		}
		this._line(`(data $mem (i32.const 0x${this._mem.snapshot.byteOffset.toString(16)})`);
		this._indent(+1);
		let min = this._mem.snapshot.byteOffset;
		let max = min + this._mem.snapshot.byteLength;
		for (let hi = min - min % 16; hi < max; hi += 16) {
			const offset = hi.toString(16).padStart(8, '0');
			let leadingPadding = '';
			let trailingPadding = '';
			let contents = '';
			let plaintext = '';
			for (let lo = 0; lo < 16; lo++) {
				const ptr = hi + lo;
				if (ptr < min) {
					leadingPadding += '\u0020\u0020\u0020';
					plaintext += ' ';
				} else if (ptr >= max) {
					trailingPadding += '\u0020\u0020\u0020';
				} else {
					const v = this._mem.snapshot[ptr - min];
					contents += '\\' + v.toString(16).padStart(2, '0');
					if (v > 0x1F && v < 0x7F) {
						plaintext += String.fromCharCode(v);
					} else {
						plaintext += '.';
					}
				}
			}
			this._line(`${leadingPadding}"${contents}"${trailingPadding} ;; ${offset}: ${plaintext}`);
		}
		this._indent(-1);
		this._line(`)`);
	}

	protected _genStart(): void {
		this._line(`(func (export "_start")`);
		this._indent(+1);
		this._line(`(local $ptr i32)`);
		this._genSubtree(this._program.body);
		this._indent(-1);
		this._line(`)`);
	}

	protected _genSubtree(instructions: Ast.Instruction[]): void {
		for (const instr of instructions) {
			switch (instr.type) {
				case 'input':
					this._line(`(call $getChar (local.get $ptr))`, instr.tokens);
					break;
				case 'output':
					this._line(`(call $putChar (local.get $ptr))`, instr.tokens);
					break;
				case 'set':
					this._line(`(i32.store8 (local.get $ptr) (i32.const ${this._lebValue(instr.value)}))`, instr.tokens);
					break;
				case 'incr':
					this._line(`(i32.store8 (local.get $ptr)`, instr.tokens);
					this._indent(+1);
					this._line(`(i32.add (i32.load8_u (local.get $ptr)) (i32.const ${this._lebValue(instr.value)}))`, instr.tokens);
					this._indent(-1);
					this._line(`)`, instr.tokens);
					break;
				case 'advptr':
					this._line(`(local.set $ptr`, instr.tokens);
					this._indent(+1);
					this._line(`(i32.add (local.get $ptr) (i32.const ${instr.value}))`, instr.tokens);
					this._indent(-1);
					this._line(`)`, instr.tokens);
					break;
				case 'loop':
					this._line(`(loop`, instr.tokens.slice(0, -1));
					this._indent(+1);
					this._line(`(if (i32.load8_u (local.get $ptr)) (then`, instr.tokens.slice(0, -1));
					this._indent(+1);
					this._genSubtree(instr.body);
					// Supply the last token, only if it's not the same as the first one
					this._line(`(br 1)`, instr.tokens.slice(-1));
					this._indent(-1);
					this._line(`))`, instr.tokens.slice(0, -1));
					this._indent(-1);
					this._line(`)`, instr.tokens.slice(0, -1));
					break;
				default:
					throw new Error('unreachable');
			}
		}
	}

	protected _lebValue(v: number): string {
		const abs = v & 0xFF;
		if (abs >= 192) {
			// A byte value would be more compact as a negative number
			return String(abs - 256);
		} else {
			// A byte value would be more compact as a positive number
			return String(abs);
		}
	}
}

export function generateCode(program: Ast.Program): CodeGenReturn {
	const gen = new OutputGenerator(program);
	return gen.generateCode();
}
