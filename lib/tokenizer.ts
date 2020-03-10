export type Token = [
	/** Token literal */
	'+' | '-' | '<' | '>' | ',' | '.' | '[' | ']',
	/** Line number. Zero based! */
	number?,
	/** Column number. Zero based! */
	number?
];

export function* tokenize(source: string): IterableIterator<Token> {
	let lineno = 0;
	let colno = 0;

	for (const ch of source) {
		switch (ch) {
			case '+':
			case '-':
			case '<':
			case '>':
			case ',':
			case '.':
			case '[':
			case ']':
				yield [ch, lineno, colno];
				break;

			case '\n':
				lineno++;
				colno = 0;
		}
		colno++;
	}
}