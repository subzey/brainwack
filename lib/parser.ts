import type { Ast, Token } from './interfaces.ts';

export function parse(tokens: Iterable<Token>): Ast.Program {
	const program: Ast.Program = {type: 'program', body: []};
	const containerStack: (Ast.Program | Ast.Instruction & Ast.Container)[] = [program];

	for (const token of tokens) {
		const container = containerStack[containerStack.length - 1];

		switch (token[0]) {
			case '+':
			case '-':
				container.body.push({
					type: 'incr',
					value: token[0] === '+' ? 1 : -1,
					tokens: [token],
				});
				break;
			case '<':
			case '>':
				container.body.push({
					type: 'advptr',
					value: token[0] === '>' ? 1 : -1,
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
				const loop = {
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
					throw new SyntaxError(`']' with no corresponding '[' at line ${ token[1] ?? '(unknown)' }, column ${ token[2] ?? '(unknown)' }`);
				}
				break;
			default:
				throw new Error('unreachable');
		}
	}

	return program;
}