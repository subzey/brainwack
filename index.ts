#!/usr/bin env deno
import { readFileStr } from 'https://deno.land/std/fs/mod.ts';
import { basename } from 'https://deno.land/std/path/mod.ts';
import { parse } from 'https://deno.land/std/flags/mod.ts';
import { compile } from './mod.ts';

const args = parse(Deno.args, {
	boolean: ['help', 'unsafe-memory'],
	string: ['output', 'sourcemap'],
});

if (args.help || args._.length !== 1) {
	console.log(`
BrainWAck - a Brainfuck to WebAssembly compiler.
Usage:
    deno index.ts FILE [OPTIONS]

Output options:
    --output          WAT output filename.
                      If omitted, the result is written to stdout.

    --sourcemap       Source map output filename. Ignored if omitted.

Compilation options:
    --unsafe-memory   Disable the memory boundaries check.
                      It may make the resulting code smaller and faster.
                      It may blow up everything as well.
	`.trim());

	Deno.exit(1);
}

async function main() {
	const { result, sourceMap } = compile(
		await readFileStr(args._[0]),
		{
			sourceFilename: basename(args._[0]) || undefined,
			unsafeMemory: Boolean(args['unsafe-memory']),
		}
	);

	if (args.sourcemap) {
		Deno.writeFile(args.sourcemap, new TextEncoder().encode(sourceMap));
	}

	if (args.output) {
		Deno.writeFile(args.output, new TextEncoder().encode(result));
	} else {
		Deno.stdout.write(new TextEncoder().encode(result));
	}
}

main();