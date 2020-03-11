import type { Ast, MemoryLayout } from './interfaces.ts';


class MemoryDistributor {
	private _offset = 0;

	public assign(size: number, align=false): number {
		let offset = this._offset;
		if (align) {
			offset = offset + offset % 4;
		}
		this._offset = offset + size;
		return offset;
	}
}

const invalidMemMsgBuf: Readonly<Uint8Array> = Uint8Array.from('Memory access out of bounds\n', ch => ch.charCodeAt(0));
const brainfuckMemorySize = 30000;

export function distributeMemory(program: Ast.Program): void {
	if (!program.deps) {
		throw new Error('Program without resolved dependencies');
	}
	const mem = new MemoryDistributor();

	const layout: MemoryLayout = {
		len: 0,
		snapshot: null as unknown as Uint8Array,
	};

	if (program.deps.runtimeMem) {
		layout.runtimeMem = {
			start: mem.assign(brainfuckMemorySize),
			len: brainfuckMemorySize,
		}
	}

	if (program.deps.memErrMsg) {
		layout.memErrMsg = {
			payload: mem.assign(invalidMemMsgBuf.byteLength),
			iovec: mem.assign(8, true),
			rv: mem.assign(4, true),
		}
	}

	if (program.deps.fdRead || program.deps.fdWrite) {
		layout.io = {
			iovec: mem.assign(8, true),
			rv: mem.assign(4, true),
		}
	}

	layout.len = mem.assign(0);


	// Fill snapshot
	const rawMemorySnapshot = new ArrayBuffer(layout.len);
	const dataView = new DataView(rawMemorySnapshot);

	if (layout.memErrMsg) {
		// Copy message
		for (let i = 0; i < invalidMemMsgBuf.byteLength; i++) {
			dataView.setUint8(layout.memErrMsg.payload + i, invalidMemMsgBuf[i]);
		}
		// Message Iovec: pointer & size
		dataView.setUint32(layout.memErrMsg.iovec, layout.memErrMsg.payload, true);
		dataView.setUint32(layout.memErrMsg.iovec + 4, invalidMemMsgBuf.byteLength, true);
	}

	if (layout.io) {
		// Read/write Iovec: pointer & size
		// dataView.setUint32(layout.io.iovec, 0); // To be overridden in runtime
		dataView.setUint32(layout.io.iovec + 4, 1, true); // Read/write 1 byte
	}

	// Compact snapshot
	let snapshotStart = 0;
	let snapshotEnd = dataView.byteLength;

	for (let i = 0; i <= snapshotEnd; i++) {
		snapshotStart = i;
		if (dataView.getInt8(i) !== 0) {
			break;
		}
	}

	for (let i = snapshotEnd; i > snapshotStart; i--) {
		snapshotEnd = i;
		if (dataView.getInt8(i - 1) !== 0) {
			break;
		}
	}

	layout.snapshot = new Uint8Array(rawMemorySnapshot, snapshotStart, snapshotEnd - snapshotStart);

	program.mem = layout;
}
