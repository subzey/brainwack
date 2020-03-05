import type * as Ast from './ast.ts';

export function optimize(ast: Ast.Program): void {
	optimizationPass(ast);
	removeLeadingDeadCode(ast);
	removeTrailingDeadCode(ast);
}

function optimizationPass(astContainer: Ast.Container): void {
	const body = astContainer.body;
	for (let i = body.length; i-- > 0;) {
		const astNode = body[i];

		if ('body' in astNode) {
			optimizationPass(astNode);
		}

		const nextNode = body[i + 1] || null;

		if (nextCanBeRemoved(astNode, nextNode)) {
			// Remove next node
			body.splice(i + 1, 1);
			// We've changed the body: backtrack and repeat
			i++;
			continue;
		}

		if (canBeMerged(astNode, nextNode)) {
			astNode.value += nextNode.value;
			astNode.tokens.push(...nextNode.tokens);
			body.splice(i + 1, 1);
			i++;
			continue;
		}

		if (currentCanBeRemoved(astNode, nextNode)) {
			// Remove this node
			body.splice(i, 1);
			continue;
		}


		if (isZeroSettingLoop(astNode)) {
			body.splice(i, 1, {
				type: 'set',
				value: 0,
				tokens: [
					...astNode.tokens.slice(0, 1),
					...astNode.body[0].tokens,
					...astNode.tokens.slice(1),
				],
			});
			// We've changed the body. Backtrack and try again
			i++;
			continue;
		}
	}
}

/** Detect common pattern: [-] or [+] */
function isZeroSettingLoop(instruction: Ast.Instruction): instruction is Ast.LoopInstruction & { body: [ Ast.IncrementValueInstruction ] } {
	if (instruction.type !== 'loop') {
		return false;
	}
	if (instruction.body.length !== 1) {
		return false;
	}
	const child = instruction.body[0];
	if (child.type !== 'incr') {
		return false;
	}
	if (child.value === 0) {
		// You cannot set a zero value incrementing 0
		return false;
	}
	return true;
}

function currentCanBeRemoved(currentNode: Ast.Instruction, nextNode: Ast.Instruction | null): boolean {
	if (currentNode.type === 'incr' || currentNode.type === 'advptr') {
		// After some merges total incr or advptr is zero
		// Ex.: +-+- or <<>>
		if (currentNode.value === 0) {
			return true;
		}
	}

	if (currentNode.type === 'set' || currentNode.type === 'incr') {
		// Set follows the set or incr. This instruction is useless
		// Ex: +[-]
		if (nextNode !== null && nextNode.type === 'set') {
			return true;
		}
	}

	return false;
}

function nextCanBeRemoved(currentNode: Ast.Instruction, nextNode: Ast.Instruction | null): boolean {
	if (nextNode === null) {
		// There's no next node
		return false;
	}
	if (currentNode.type === 'loop' && nextNode.type === 'loop') {
		// Loops exists with cell value 0. The next loop won't start.
		return true;
	}
	if (currentNode.type === 'set' && currentNode.value === 0 && nextNode.type === 'loop') {
		// This way or another we know the cell value is 0. The next loop won't start.
		return true;
	}
	return false;
}

function canBeMerged(currentNode: Ast.Instruction, nextNode: Ast.Instruction | null): boolean {
	if (nextNode === null) {
		// Cannot merge null with anything
		return false;
	}

	if (currentNode.type === 'set' || currentNode.type === 'incr') {
		if (nextNode.type === 'incr') {
			return true;
		}
	}

	if (currentNode.type === 'advptr') {
		if (nextNode.type === 'advptr') {
			return true;
		}
	}

	return false;
}

/**
 * At the very start of the program each cell is zero.
 * Setting zero values again is useless.
 */
function removeLeadingDeadCode(astContainer: Ast.Container): void {
	let replacementAdvPtr: Ast.AdvancePointerInstruction = {
		type: 'advptr',
		value: 0,
		tokens: [],
	};

	let body = astContainer.body;
	for (let i = 0; i < body.length; i++) {
		const astNode = body[i];

		if (astNode.type === 'advptr') {
			// Leave it, but keep cleaning up.
			replacementAdvPtr.value += astNode.value;
			replacementAdvPtr.tokens.push(...astNode.tokens);
			body.splice(i, 1);
			i--;
			continue;
		}

		if (astNode.type === 'loop' || astNode.type === 'set' && astNode.value === 0) {
			// These loops cannot be entered
			body.splice(i, 1);
			i--;
			continue;
		}

		break;
	}

	if (replacementAdvPtr.value !== 0) {
		body.unshift(replacementAdvPtr);
	}
}


function hasOutput(astNode: Ast.Instruction): boolean {
	if ('body' in astNode) {
		return astNode.body.some(hasOutput);
	}
	return (astNode.type === 'output');
}

function removeTrailingDeadCode(astContainer: Ast.Container): void {
	let body = astContainer.body;
	for (let i = body.length; i--> 0;) {
		if (hasOutput(body[i])) {
			break;
		}
		body.splice(i, 1);
	}
}