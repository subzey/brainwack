import type { Token } from './interfaces.ts';

export function* tokenize(source: string): IterableIterator<Token> {
	let sourceLine = 0;
	let sourceCol = 0;

	for (const literal of source) {
		switch (literal) {
			case '+':
			case '-':
			case '<':
			case '>':
			case ',':
			case '.':
			case '[':
			case ']':
				yield { literal: literal, sourceLine, sourceCol };
				break;
		}

		if (literal === '\n') {
			sourceLine++;
			sourceCol = 0;
		} else {
			sourceCol++;
		}
	}
}