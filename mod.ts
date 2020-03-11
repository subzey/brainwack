import { tokenize } from './lib/tokenizer.ts';
import { parse } from './lib/parser.ts';
import { optimize } from './lib/optimizer.ts';
import { resolveDependencies } from './lib/depresolver.ts';
import { distributeMemory } from './lib/memlayout.ts';
import { generateCode } from './lib/codegen.ts';
import { generateSourceMap } from './lib/sourcemap.ts';

export function compile(source: string, filename='brainfuck-source.bf'): { result: string, sourceMap: string } {
	const tokens = tokenize(source);
	const astProgram = parse(tokens);
	optimize(astProgram);
	resolveDependencies(astProgram);
	distributeMemory(astProgram);
	const {result, rawMapping } = generateCode(astProgram);
	return ({
		result,
		sourceMap: generateSourceMap(rawMapping, source, filename),
	});
}