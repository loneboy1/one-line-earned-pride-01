// Pride-line writer for "One Line of Earned Pride" (make.fun).
// Writes one line, 1 to 240 characters, to $MAKEFUN_OUTPUT_DIR/entry.txt.
// Deterministic: no clock, no randomness, no network, no unordered
// iteration. Node 22, zero dependencies, erasable TypeScript only.
//
// The judge (a reader of very short fiction moved by quiet, earned
// pride) weighs, most important first:
//   1. the line makes the judge feel genuinely proud: a quiet, earned
//      moment of pride for someone in a scene, a small person doing
//      something hard or a long effort finally landing; a line off that
//      subject loses to any entry on the subject;
//   2. a concrete scene with a real person in it, specific enough that
//      the moment is seen happening rather than summarised;
//   3. the pride is earned inside the line, by effort or difficulty the
//      reader can feel, never asserted, congratulated or explained;
//   4. it lands in one read: the pride arrives by the last word, with no
//      setup the reader has to assemble;
//   5. freshness: an image, detail or turn not seen a hundred times, not
//      the stock trophy, podium or graduation.
//
// The scorer below mirrors that brief in the same order. Each candidate
// carries its rubric sub-scores (fit /20, scene /20, earned /20,
// one-read /20, fresh /20), scored by hand against the brief; the
// program picks the winner by deterministic argmax: highest score, then
// shortest, then lexicographic.
//
// Flooded angles left out entirely: the trophy, the podium, the
// graduation stage, the marathon finish line, the first-steps baby, the
// championship goal, "she did it" with no scene, and any line that
// congratulates its subject ("we're so proud") instead of showing the
// effort. Also left out: the veteran's medal, the promotion speech, and
// the "after all these years" line with no task in it — pride needs a
// thing done, not a span of time asserted. The strongest lines share one shape: years of unglamorous
// effort, a small concrete task, and the payoff arriving in the final
// clause with nobody applauding.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface Rubric {
  fit: number; // /20 — quiet, earned pride for someone in a scene
  scene: number; // /20 — concrete scene, real person, seen happening
  earned: number; // /20 — pride earned by felt effort, never asserted
  oneRead: number; // /20 — lands in one read, pride by the last word
  fresh: number; // /20 — image not seen a hundred times
}

interface Scored {
  text: string;
  rubric: Rubric;
}

const CANDIDATES: Scored[] = [
  // Reading at sixty-two: the effort is a lifetime of not reading, the
  // payoff is one card read aloud without stopping. The pride arrives
  // on the last three words, and nobody in the line congratulates him.
  {
    text: "He taught himself to read at sixty-two so he could read his granddaughter's birthday card aloud, without stopping once.",
    rubric: { fit: 20, scene: 19, earned: 20, oneRead: 19, fresh: 17 },
  },
  // The tap: years of carrying water, then one turn and the whole
  // village hears it. Collective, concrete, and the sound does the
  // congratulating.
  {
    text: "After years of carrying water up the hill, she turned the new tap, and the whole village heard it run.",
    rubric: { fit: 19, scene: 19, earned: 19, oneRead: 18, fresh: 19 },
  },
  // The mason's nod: a first wall standing straight, and the only praise
  // is a nod and a trowel changing hands.
  {
    text: "The apprentice's first wall stood straight at sunset, and the old mason just nodded once and handed him the trowel.",
    rubric: { fit: 19, scene: 20, earned: 19, oneRead: 18, fresh: 18 },
  },
  // The knot: a thousand kitchen rehearsals, one mountain, a daughter's
  // weight held.
  {
    text: "He had practised the knot a thousand times in his kitchen; tonight, on the mountain, it held his daughter's weight.",
    rubric: { fit: 19, scene: 19, earned: 19, oneRead: 18, fresh: 18 },
  },
  // The schoolbag: six months of carrying, reversed in one morning, and
  // the father lets it happen.
  {
    text: "For six months he carried his daughter's schoolbag up the hill; today she carried his, and he let her.",
    rubric: { fit: 19, scene: 18, earned: 19, oneRead: 18, fresh: 18 },
  },
  // The welder: the final seam, the mask lifted, the bridge holding
  // traffic.
  {
    text: "The welder held the torch steady through the final seam, lifted his mask, and saw his bridge holding the morning traffic.",
    rubric: { fit: 19, scene: 19, earned: 18, oneRead: 18, fresh: 17 },
  },
  // The cake: twenty years icing other people's weddings, then the first
  // slice of her own.
  {
    text: "For twenty years she had iced other people's wedding cakes; today she cut the first slice of her own.",
    rubric: { fit: 18, scene: 18, earned: 18, oneRead: 18, fresh: 19 },
  },
  // The lamps: one joint by torchlight, one switch, a whole street lit.
  {
    text: "She soldered the last joint by torchlight, flipped the switch, and the whole street's lamps came on at once.",
    rubric: { fit: 18, scene: 18, earned: 18, oneRead: 18, fresh: 18 },
  },
  // The ribbon: a decade sweeping the platform, then the ribbon is hers
  // to cut.
  {
    text: "After a decade of sweeping the same platform, she was the one they asked to cut the ribbon when the new station opened.",
    rubric: { fit: 18, scene: 18, earned: 18, oneRead: 18, fresh: 18 },
  },
  // The page: a stutter, a breath, a whole page read without looking down.
  {
    text: "The boy who had stuttered through every reading stood up, took a breath, and read the whole page without once looking down.",
    rubric: { fit: 19, scene: 18, earned: 19, oneRead: 18, fresh: 16 },
  },
  // The needle: eighty-one, first try, a button back on a dead man's coat.
  {
    text: "She finally threaded the needle on her first try, at eighty-one, and sewed the button back on the coat her husband had worn.",
    rubric: { fit: 18, scene: 18, earned: 18, oneRead: 17, fresh: 18 },
  },
  // The engine: parts nobody wanted, one key turn, the harvest carried in.
  {
    text: "He rebuilt the engine from parts nobody wanted, turned the key, and the old truck coughed, caught, and carried the harvest in.",
    rubric: { fit: 18, scene: 19, earned: 18, oneRead: 17, fresh: 17 },
  },
  // The shoes: forty years mending for others, his own name stitched in.
  {
    text: "After forty years of mending other people's shoes, he finally stitched his own name into the pair he wore home.",
    rubric: { fit: 18, scene: 18, earned: 18, oneRead: 17, fresh: 18 },
  },
  // The last brick: a school started as a boy, finished as a man, and
  // the children run in before the mortar sets.
  {
    text: "He laid the last brick of the school he had started as a boy, and the children ran in before the mortar had even set.",
    rubric: { fit: 18, scene: 18, earned: 18, oneRead: 18, fresh: 17 },
  },
  // The sunrise: eleven years of night shifts, a porch, coffee, and
  // nowhere to hurry to.
  {
    text: "After eleven years of night shifts, Mara finally watched the sunrise from her own porch, coffee in hand, and did not hurry inside.",
    rubric: { fit: 18, scene: 19, earned: 17, oneRead: 18, fresh: 16 },
  },
  // The lamp: relit by hand after the storm, and the first ship turns
  // home by it.
  {
    text: "The lighthouse keeper relit the lamp with his own hands after the storm took it, and the first ship turned home by its light.",
    rubric: { fit: 18, scene: 18, earned: 17, oneRead: 18, fresh: 16 },
  },
  // The boat: never steered alone, now home through the fog with his
  // father's hands on his shoulders.
  {
    text: "The fisherman's son, who had never once steered alone, brought the boat home through the fog with his father's hands on his shoulders.",
    rubric: { fit: 17, scene: 18, earned: 17, oneRead: 17, fresh: 17 },
  },
  // The orchard: a mother's talk, a daughter's planting, a blossom on a
  // birthday.
  {
    text: "She planted the orchard her mother had only ever talked about, and this spring the first blossom opened on her mother's birthday.",
    rubric: { fit: 17, scene: 18, earned: 16, oneRead: 17, fresh: 18 },
  },
  // The bus: thirty years without a missed stop, one last park, streets
  // known by heart.
  {
    text: "The bus driver who never missed a stop in thirty years parked his bus for the last time and walked home through streets he knew by heart.",
    rubric: { fit: 17, scene: 18, earned: 16, oneRead: 17, fresh: 17 },
  },
  // The keys: a last patrol, a hook, a salute from the dawn shift.
  {
    text: "The night guard finished his last patrol, hung his keys on the hook, and the dawn shift saluted him as he left.",
    rubric: { fit: 17, scene: 17, earned: 16, oneRead: 17, fresh: 16 },
  },
  // The net: mended one last time, cast at dawn, pulled back full.
  {
    text: "The old fisherman mended his father's net one last time, cast it at dawn, and pulled it back full.",
    rubric: { fit: 17, scene: 18, earned: 16, oneRead: 17, fresh: 16 },
  },
  // The speech: a month in the mirror, a room on its feet, belief
  // arriving last.
  {
    text: "She had practised the speech in the mirror for a month; when the room stood up, she finally believed every word of it.",
    rubric: { fit: 17, scene: 16, earned: 16, oneRead: 17, fresh: 15 },
  },
  // The fifth test: four failures, two words from the examiner, tears
  // on the bus home.
  {
    text: "She had failed the test four times; on the fifth, the examiner simply said, 'Welcome aboard,' and she cried on the bus home.",
    rubric: { fit: 17, scene: 16, earned: 17, oneRead: 16, fresh: 15 },
  },
  // The letter: a last round, an old man asleep, a son's letter finally
  // sent. Tender, but the pride in it is the letter's, not the nurse's.
  {
    text: "The night-shift nurse, on her last round, found the old man asleep holding the letter his son had finally sent.",
    rubric: { fit: 15, scene: 18, earned: 14, oneRead: 17, fresh: 16 },
  },
  // The piano: three flights, every practice, a hall standing to listen.
  {
    text: "He had carried the piano up three flights alone for every practice; tonight the hall stood and listened to his daughter play it.",
    rubric: { fit: 16, scene: 17, earned: 16, oneRead: 16, fresh: 16 },
  },
];

function total(r: Rubric): number {
  return r.fit + r.scene + r.earned + r.oneRead + r.fresh;
}

function validate(text: string): void {
  if (text.length < 1 || text.length > 240) {
    throw new Error(`entry must be 1-240 characters, got ${text.length}`);
  }
  if (text.trim() !== text || text.includes("\n")) {
    throw new Error("entry must be a single line with no padding");
  }
}

const scored = CANDIDATES.map((c) => ({ ...c, score: total(c.rubric) }));
for (const c of scored) validate(c.text);

const winner = scored.sort(
  (a, b) => b.score - a.score || a.text.length - b.text.length || (a.text < b.text ? -1 : 1),
)[0];

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.txt"), winner.text, "utf8");
console.log(`winner (${winner.text.length} chars, score ${winner.score}): ${winner.text}`);
