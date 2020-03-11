import type { RawMapping, RawMappingLine } from './interfaces.ts';

type SourceMappingTuple = [
	/** Generated column */
	number,
	/** Source file index */
	number,
	/** Source line */
	number,
	/** Source column */
	number
];

class DeltaEncoder {
	private _state: number[] = [0, 0, 0, 0];
	public encode<T extends number[]>(seq: T): T {
		const deltas = [] as number[] as T;
		for (let i = 0; i < seq.length; i++) {
			deltas[i] = seq[i] - (this._state.length > i ? this._state[i] : 0);
			this._state[i] = seq[i];
		}
		return deltas;
	}
	public resetColumn() {
		this._state[0] = 0;
	}
}

export function generateSourceMap(mapping: RawMapping, sourceCode: string, sourceFilename: string): string {
	const deltaEncoder = new DeltaEncoder();
	return JSON.stringify({
		version : 3,
		sources: [sourceFilename],
		sourcesContent: [sourceCode],
		names: [],
		mappings: mapping.map((v: RawMappingLine) => mappingForLine(deltaEncoder, v)).join(';'),
	});
}

function sortFn(a: SourceMappingTuple, b: SourceMappingTuple) {
	return (a[0] - b[0]) || (a[2] - b[2]) || (a[3] - b[3]);
}

function mappingForLine(deltaEncoder: DeltaEncoder, line: RawMappingLine) {
	deltaEncoder.resetColumn();
	let sourceMappingTuples: SourceMappingTuple[] = [];
	for (const [genCol, token] of line) {
		if (token.sourceLine === undefined) {
			continue;
		}
		if (token.sourceCol === undefined) {
			continue;
		}
		sourceMappingTuples.push([genCol, 0, token.sourceLine, token.sourceCol]);
	}
	sourceMappingTuples.sort(sortFn);
	const filtered = filterConsecutive(sourceMappingTuples);
	const asDeltas = filtered.map(v => deltaEncoder.encode(v));
	return asDeltas.map(vlq).join(',');
}

function filterConsecutive(sourceMappingTuples: SourceMappingTuple[]): SourceMappingTuple[] {
	const rv: SourceMappingTuple[] = [];
	if (sourceMappingTuples.length === 0) {
		return rv;
	}
	rv.push(sourceMappingTuples[0]);
	for (let i = 1; i < sourceMappingTuples.length; i++) {
		const current = sourceMappingTuples[i];
		const prev = sourceMappingTuples[i-1];
		if (current[0] !== prev[0] || current[1] !== prev[1] || current[2] !== prev[2]) {
			rv.push(current);
		}
	}
	return rv;
}

const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function vlq(seq: number[]): string {
	let rv = '';
	for (const v of seq) {
		let signPadded = v >= 0 ? v * 2 : 1 - v * 2;
		while (signPadded >= 32) {
			rv += base64Alphabet[signPadded & 31 | 32];
			signPadded /= 32;
		}
		rv += base64Alphabet[signPadded & 31];
	}
	return rv;
}