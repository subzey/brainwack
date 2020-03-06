#!/usr/bin env deno
import { readFileStr } from "https://deno.land/std/fs/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";
import { compile } from './mod.ts';

const args = parse(Deno.args, {
	boolean: ['help'],
	string: ['output'],
});

if (args.help || args._.length !== 1) {
	console.log('Help.');
	Deno.exit(1);
}

async function main() {
	console.log(
		compile(await readFileStr(args._[0]))
	);
}

main();