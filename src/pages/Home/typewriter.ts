/** Where the hero's typing placeholder is: which example, how much of it shows, and which way it is going. */
export type TypeStep = { word: number; shown: number; deleting: boolean };

const HOLD_MS = 1500;
const PAUSE_MS = 350;
const DELETE_MS = 22;
const TYPE_MS = 55;
const TYPE_JITTER_MS = 40;

/**
 * The placeholder's next step and how long to wait before taking it: it types an example, holds
 * it, deletes it, and goes on to the next one.
 */
export function nextTypeStep(
	step: TypeStep,
	words: readonly string[],
	random: () => number = Math.random
): { step: TypeStep; wait: number } {
	const word = words[step.word % words.length];

	if (!step.deleting) {
		const shown = step.shown + 1;
		const finished = shown >= word.length;
		return {
			step: { word: step.word % words.length, shown, deleting: finished },
			wait: finished ? HOLD_MS : TYPE_MS + random() * TYPE_JITTER_MS,
		};
	}

	const shown = step.shown - 1;
	if (shown > 0) return { step: { ...step, shown }, wait: DELETE_MS };
	return { step: { word: (step.word + 1) % words.length, shown: 0, deleting: false }, wait: PAUSE_MS };
}
