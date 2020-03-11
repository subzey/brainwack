import type { Ast, Dependencies } from './interfaces.ts';

export interface Options {
	unsafeMemory: boolean;
}

export function resolveDependencies(program: Ast.Program, options: Partial<Options> = {}): void {
	const deps = {
		runtimeMem: false,
		getChar: false,
		putChar: false,
		fdRead: false,
		fdWrite: false,
		memErrMsg: false,
		procExit: false,
	}
	fillDeps(program.body, deps);

	if (deps.runtimeMem && !options.unsafeMemory) {
		deps.memErrMsg = true;
	}

	if (deps.memErrMsg) {
		deps.procExit = true;
	}

	if (deps.getChar) {
		deps.fdRead = true;
	}

	if (deps.putChar) {
		deps.fdWrite = true;
	}

	program.deps = deps;
}

function fillDeps(instructions: Ast.Instruction[], deps: Dependencies): void {
	for (const instr of instructions) {
		if (instr.type !== 'advptr') {
			deps.runtimeMem = true;
		}
		if (instr.type === 'input') {
			deps.getChar = true;
		} else if (instr.type === 'output') {
			deps.putChar = true;
		}

		if ('body' in instr) {
			fillDeps(instr.body, deps);
		}
	}
}