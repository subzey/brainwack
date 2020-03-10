export type Token = [
	'+' | '-' | '<' | '>' | ',' | '.' | '[' | ']',
	number?,
	number?
];

export namespace Ast {
	export interface AstNode {
		type: string;
		tokens: Token[];
	}

	export interface Container {
		type: string;
		body: Instruction[];
	}

	export interface AdvancePointerInstruction extends AstNode {
		type: 'advptr';
		value: number;
	}

	export interface IncrementValueInstruction extends AstNode {
		type: 'incr';
		value: number;
	}

	export interface SetValueInstruction extends AstNode {
		type: 'set';
		value: number;
	}

	export interface InputInstruction extends AstNode {
		type: 'input';
	}

	export interface OutputInstruction extends AstNode {
		type: 'output';
	}

	export interface LoopInstruction extends AstNode, Container {
		type: 'loop',
		body: Instruction[];
	}

	export type Instruction = (
		AdvancePointerInstruction | IncrementValueInstruction | SetValueInstruction |
		InputInstruction | OutputInstruction | LoopInstruction
	);

	export interface Program extends Container {
		type: 'program';
		body: Instruction[];
		deps?: Dependencies;
		mem?: MemoryLayout;
	}
}

export interface Dependencies {
	runtimeMem: boolean;
	getChar: boolean;
	putChar: boolean;
	fdRead: boolean;
	fdWrite: boolean;
	procExit: boolean;
	memErrMsg: boolean;
}

export interface MemoryLayout {
	len: number;
	snapshot: Uint8Array;
	runtimeMem?: {
		start: number;
		len: number;
	};
	memErrMsg?: {
		payload: number;
		iovec: number;
		rv: number;
	}
	io?: {
		iovec: number;
		rv: number;
	}
}

export type SourceMappingSegment = [
	/** Generated column */
	number,
	/** Original file index */
	number,
	/** Original line number */
	number,
	/** Original column number */
	number,
];

export type SourceMapping = Record</** Generated lineno */ number, SourceMappingSegment[]>;
