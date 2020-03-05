export type Token = [
	'+' | '-' | '<' | '>' | ',' | '.' | '[' | ']',
	number?,
	number?
];

export function* tokenize(source: string): IterableIterator<Token> {
	let lineno = 1;
	let colno = 0;

	for (const ch of source) {
		colno++;
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
	}
}