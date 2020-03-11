#!/usr/bin env deno
import { readFileStr } from 'https://deno.land/std/fs/mod.ts';
import { basename } from 'https://deno.land/std/path/mod.ts';
import { parse } from 'https://deno.land/std/flags/mod.ts';
import { compile } from './mod.ts';

const args = parse(Deno.args, {
	boolean: ['help'],
	string: ['output', 'sourcemap'],
});

if (args.help || args._.length !== 1) {
	console.log('BrainWAck - a Brainfuck to WebAssembly compiler.');
	console.log('Usage:');
	console.log('\tdeno index.ts FILE [OPTIONS]');
	console.log('Options:');
	console.log('\t--output    WAT output filename. If omitted, the result is written to stdout.');
	console.log('\t--sourcemap Source map output filename. Ignored if omitted.');
	Deno.exit(1);
}

async function main() {
	const { result, sourceMap } = compile(await readFileStr(args._[0]), basename(args._[0]) || undefined);

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