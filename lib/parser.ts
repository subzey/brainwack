import type { Ast, Token } from './interfaces.ts';

export function parse(tokens: Iterable<Token>): Ast.Program {
	const program: Ast.Program = {type: 'program', body: []};
	const containerStack: (Ast.Program | Ast.Instruction & Ast.Container)[] = [program];

	for (const token of tokens) {
		const container = containerStack[containerStack.length - 1];

		switch (token.literal) {
			case '+':
			case '-':
				container.body.push({
					type: 'incr',
					value: token.literal === '+' ? 1 : -1,
					tokens: [token],
				});
				break;
			case '<':
			case '>':
				container.body.push({
					type: 'advptr',
					value: token.literal === '>' ? 1 : -1,
					tokens: [token],
				});
				break;
			case ',':
				container.body.push({
					type: 'input',
					tokens: [token],
				});
				break;
			case '.':
				container.body.push({
					type: 'output',
					tokens: [token],
				});
				break;
			case '[':
				const loop: Ast.LoopInstruction = {
					type: 'loop',
					body: [],
					tokens: [token],
				};
				container.body.push(loop);
				containerStack.push(loop);
				break;
			case ']':
				if (container.type === 'loop') {
					containerStack.pop();
					container.tokens.push(token);
				} else {
					// Tokenizer returned a zero-based location.
					// We need to convert it into a human-readable one-based.
					const lineno = token.sourceLine !== undefined ? token.sourceLine + 1 : '(unknown)';
					const colno = token.sourceCol !== undefined ? token.sourceCol + 1 : '(unknown)';
					throw new SyntaxError(`']' with no corresponding '[' at line ${ lineno }, column ${ colno }`);
				}
				break;
			default:
				throw new Error('unreachable');
		}
	}

	return program;
}