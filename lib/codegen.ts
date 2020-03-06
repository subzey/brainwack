import type { Ast, Dependencies, MemoryLayout } from './interfaces.ts';

export function generateCode(program: Ast.Program): string {
	let s = '(module\n';
	s += genImports(program.deps!, '\t');
	s += genMemory(program.mem!, '\t');
	s += genIo(program.deps!, program.mem!, '\t');
	s += genStart(program, program.mem!, '\t');
	s += getData(program.mem!.snapshot, '\t');
	s += ')\n';
	return s;
}

function genImports(deps: Dependencies, indent=''): string {
	let s ='';
	if (deps.fdRead) {
		s += indent + '(func $fd_read (import "wasi_unstable" "fd_read") (param i32 i32 i32 i32) (result i32))\n';
	}
	if (deps.fdWrite) {
		s += indent + '(func $fd_write (import "wasi_unstable" "fd_write") (param i32 i32 i32 i32) (result i32))\n';
	}
	if (deps.procExit) {
		s += indent + '(func $proc_exit (import "wasi_unstable" "proc_exit") (param i32))\n';
	}
	if (s !== '') {
		s += indent + '\n';
	}
	return s;
}

function genMemory(mem: MemoryLayout, indent=''): string {
	const pages = Math.ceil(mem.len / 0x10000);
	return indent + `(memory $mem (export "memory") ${pages})\n\n`;
}

function addIdentation(str: string, indent: string) {
	return str.replace(/^(?=.)/mg, '\t');
}

function genIo(deps: Dependencies, mem: MemoryLayout, indent=''): string {
	let s = '';
	if (deps.putChar) {
		s += addIdentation(`\
(func $putChar (param $ptr i32)
	;; Update pointer in iovec
	(i32.store (i32.const ${mem.io!.iovec}) (local.get $ptr))
	;; Ignore errors
	(drop
		;; Call fd_write with that iovec
		(call $fd_write
			(i32.const 1) ;; fd, 1 = stdout
			(i32.const ${mem.io!.iovec}) (i32.const 1) ;; *iovs, iovs_len
			(i32.const ${mem.io!.rv}) ;; where to write written count
		)
	)
)\n\n`, indent);
	}
	if (deps.getChar) {
		s += addIdentation(`\
(func $getChar (param $ptr i32)
	;; Default: -1
	(i32.store (local.get $ptr) (i32.const -1))
	;; Update pointer in iovec
	(i32.store (i32.const ${mem.io!.iovec}) (local.get $ptr))
	;; Ignore errors
	(drop
		;; Call fd_read with that iovec
		(call $fd_write
			(i32.const 0) ;; fd, 0 = stdin
			(i32.const ${mem.io!.iovec}) (i32.const 1) ;; *iovs, iovs_len
			(i32.const ${mem.io!.rv}) ;; where to write written count
		)
	)
)\n\n`, indent);
	}
	return s;
}


const reNeedsEscape = /[\u0000-\u001f"\\\u007f-\uffff]/g;
function getData(uia: Uint8Array, indent=''): string {
	const serialized = String.fromCharCode(...uia).replace(reNeedsEscape, (ch) => {
		return '\\' + ch.charCodeAt(0).toString(16).padStart(2, '0');
	});

	return addIdentation(`\
(data (i32.const ${uia.byteOffset})
	"${serialized}"
)\n`, indent);
}


function genStart(program: Ast.Program, mem: MemoryLayout, indent=''): string {
	let s ='';
	s += `${indent}(func (export "_start")\n`;
	if (program.body.length) {
		s += `${indent}\t(local $ptr i32)\n`;
		s += getTree(program.body, mem, indent + '\t');
	}
	s += `${indent})\n\n`;
	return s;
}

function getTree(instructions: Ast.Instruction[], mem: MemoryLayout, indent=''): string {
	let s = '';
	for (const instr of instructions) {
		switch (instr.type) {
			case 'input':
				s += `${indent}(call $getChar (local.get $ptr))\n`;
				break;
			case 'output':
				s += `${indent}(call $putChar (local.get $ptr))\n`;
				break;
			case 'set':
				s += `${indent}(i32.store8 (local.get $ptr) (i32.const ${instr.value & 0xFF}))\n`;
				break;
			case 'incr':
				s += `\
${indent}(i32.store8 (local.get $ptr)
${indent}	(i32.add (i32.const ${instr.value & 0xFF}) (i32.load8_u (local.get $ptr)))
${indent})\n`;
				break;
			case 'advptr':
				s += `\
${indent}(local.set $ptr
${indent}	(i32.add (i32.const ${instr.value}) (local.get $ptr))
${indent})\n`;
				break;
			case 'loop':
				s += `\
${indent}(block (loop
${indent}	(br_if 1 (i32.eqz (i32.load8_u (local.get $ptr))))
\n`;
				s += getTree(instr.body, mem, indent + '\t');
				s += `\
${indent}	(br 0)
${indent}))\n`
		}
	}

	return s;
}
