#!/usr/bin env deno
import { readFileStr } from 'https://deno.land/std/fs/mod.ts';
import { parse } from 'https://deno.land/std/flags/mod.ts';
import { compile } from './mod.ts';

const args = parse(Deno.args, {
	boolean: ['help'],
	string: ['output', 'sourcemap'],
});

if (args.help || args._.length !== 1) {
	console.log('Help.');
	Deno.exit(1);
}

async function main() {
	const { result, sourceMap } = compile(await readFileStr(args._[0]));

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