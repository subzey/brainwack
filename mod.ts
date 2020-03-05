import { tokenize } from './lib/tokenizer.ts';
import { parse } from './lib/parser.ts';
import { optimize } from './lib/optimizer.ts';
import { resolveDependencies } from './lib/depresolver.ts';
import { distributeMemory } from './lib/memlayout.ts';
import { generateCode } from './lib/codegen.ts';

export function compile(source: string): string {
	const tokens = tokenize(source);
	const astProgram = parse(tokens);
	optimize(astProgram);
	resolveDependencies(astProgram);
	distributeMemory(astProgram);
	return generateCode(astProgram);
}