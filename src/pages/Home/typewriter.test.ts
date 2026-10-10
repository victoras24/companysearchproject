import { describe, expect, it } from "vitest";
import { nextTypeStep, type TypeStep } from "./typewriter";

const words = ["ab", "xyz"];
const start: TypeStep = { word: 0, shown: 0, deleting: false };

/** The texts shown over the next steps. */
function run(from: TypeStep, steps: number) {
	const texts: string[] = [];
	let step = from;
	for (let i = 0; i < steps; i++) {
		step = nextTypeStep(step, words).step;
		texts.push(words[step.word].slice(0, step.shown));
	}
	return texts;
}

describe("nextTypeStep", () => {
	it("types a word a character at a time, deletes it, then moves to the next and comes round again", () => {
		expect(run(start, 12)).toEqual(["a", "ab", "a", "", "x", "xy", "xyz", "xy", "x", "", "a", "ab"]);
	});

	it("holds a finished word, pauses on an empty one, and deletes faster than it types", () => {
		const typing = nextTypeStep(start, words, () => 0);
		const finished = nextTypeStep(typing.step, words, () => 0);
		const deleting = nextTypeStep(finished.step, words, () => 0);
		const emptied = nextTypeStep(deleting.step, words, () => 0);

		expect(typing.wait).toBe(55);
		expect(finished.wait).toBe(1500);
		expect(deleting.wait).toBe(22);
		expect(emptied.wait).toBe(350);
	});

	it("types at an uneven pace, between 55 and 95 milliseconds a character", () => {
		expect(nextTypeStep(start, words, () => 1).wait).toBe(95);
	});
});
