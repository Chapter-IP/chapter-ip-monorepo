import type { VoiceScriptData } from '../types/voice-script.types'

export const voiceScript: VoiceScriptData = {
  title: 'ChapterIP Voice Profile — 10-Minute Recording Script',
  intro: [
    [
      {
        text: 'A single-session read for actors creating a consented AI voice profile. Covers all 44 English phonemes, consonant clusters, emotional range, prosodic dynamics, and high-frequency functional phrases.',
      },
    ],
    [
      { text: 'Total read time:', semibold: true },
      { text: ' ~10 minutes at a natural recording pace (~130–140 wpm with section pauses).' },
    ],
  ],
  beforeYouStart: {
    label: 'director / engineer notes — not read aloud',
    title: 'Before you start',
    bullets: [
      'Quiet, treated room. Record 10 seconds of room tone before the first line and after the last.',
      'Mic 6–8 inches away, slightly off-axis, pop filter on. Peaks around 12 dB, never clipping.',
      'One take per section is fine; if you stumble, pause two seconds and repeat the whole sentence.',
      'Read at your natural conversational pace unless a direction says otherwise. Do not "announce."',
      'Directions appear in [ bracketed italics ]. Never read them aloud.',
      'Pause ~2 seconds between numbered sections.',
    ],
  },
  sections: [
    {
      title: 'Section 1 — Identity & consent statement',
      duration: '~40 seconds',
      instruction:
        '[ Read plainly and clearly, at natural pace. This anchors the profile to a consenting speaker on a specific date. ]',
      blocks: [
        {
          lines: [
            "My name is [FULL NAME]. Today's date is [DAY, MONTH, YEAR]. I am recording this session of my own free will, and I consent to the creation of a digital voice profile from this recording, under the license terms I have agreed to in writing. This recording is my authentic voice. Any use of the resulting voice model outside those agreed terms is not authorized by me.",
          ],
        },
      ],
    },
    {
      title: 'Section 2 — Natural baseline read',
      duration: '~2 minutes',
      instruction:
        '[ Your everyday storytelling voice. Relaxed, warm, unhurried. This is the foundation of the profile — resist the urge to perform. ]',
      blocks: [
        {
          paragraphGap: true,
          lines: [
            'When the last ferry of the evening pushed away from the pier, the harbor finally went quiet. Gulls wheeled once over the water, then settled along the rail like commuters who had missed their ride. Joan zipped her jacket against the breeze and measured the view: fishing boats, a violet sky, and the slow blink of the lighthouse on the far point. She had grown up believing that every town keeps one perfect hour to itself, and this was theirs.',
            'Her brother Charles thought otherwise. He preferred mornings — the hiss of the espresso machine, the thud of the newspaper on the porch, the crunch of gravel as neighbors backed out of their driveways. "The day belongs to whoever shows up first," he liked to say, usually while jingling his keys and searching for his glasses. They argued about it the way siblings do, with great enthusiasm and no intention of changing.',
            'That August, the two of them drove north through birch woods and yellow fields, past a church, a schoolyard, and a garage with a hand-painted sign that read "Treasure, cheap." They stopped to measure the roof of an old barn their father had built, took photographs of its weathered edges, and gathered a jar of smooth stones from the stream behind it. On the way home, thunder rolled somewhere beyond the ridge, and the first fat drops of rain jumped on the windshield. Joan laughed; Charles turned up the radio. Neither of them said it, but both were thinking the same thing: some hours you keep, and some hours keep you.',
          ],
        },
      ],
    },
    {
      title: 'Section 3 — Phonetic coverage',
      duration: '~2.5 minutes',
      instruction:
        '[ Neutral, clear, evenly paced. Slightly slower than Section 2. Give every word its full shape without over-articulating. ]',
      numbered: true,
      blocks: [
        {
          label: '3a. Vowels',
          lines: [
            'Please believe the team can see the evening breeze. (ee)',
            'The big ship did sit in the middle of the inlet. (ih)',
            'Ten friends spent every penny on fresh bread. (eh)',
            'That black cat sat flat on the grass mat. (a)',
            'My brother won nothing but trouble from the flood. (uh)',
            'Father parked the car in the calm dark barn. (ah)',
            'A lot of hot coffee dropped on the soft cloth. (o)',
            'Paul thought the tall wall was worth all the chalk. (aw)',
            'The good book took a full look at the wooden hook. (oo, short)',
            'Two new blue shoes moved through the smooth room. (oo, long)',
            'Her first word was heard early on Thursday. (er)',
            'About a minute ago, the sofa was again in the corner. (schwa)',
          ],
        },
        {
          label: '3b. Diphthongs',
          lines: [
            'They came late to play the eight great games. (ay)',
            'I tried five times to find the right sign. (eye)',
            "The boy's voice joined the noise with joy. (oy)",
            'How now shall the crowd count the loud sound? (ow)',
            'The old boat rode over the golden road home. (oh)',
            "We're here near the clear pier, my dear. (ear)",
            'Their chairs were there, where the fair air was rare. (air)',
            "The tour was surely pure, I'm sure. (oor)",
          ],
        },
        {
          label: '3c. Consonants & the tricky pairs',
          lines: [
            'Peter poured a proper cup of pepper for the puppet. (p)',
            'Both brothers brought big brown boxes aboard. (b)',
            'Take time to taste the tart before the toast gets cold. (t / d)',
            'Good dogs dig deep during the golden days. (d / g)',
            'Kick the quick black clock back a click. (k)',
            'Five brave friends found fresh fruit for the festival. (f / v)',
            'I think both thirty-three thieves thought thoroughly. (unvoiced th)',
            'This, that, and the other — they gathered them together. (voiced th)',
            'Seven silver spoons slid across the smooth ceramic surface. (s / z)',
            'She surely showed the shiny shell to the shy fishermen. (sh)',
            'The usual treasure gave unusual pleasure — a vision in beige. (zh)',
            'Charlie chose to chat and chew each chunk of cheddar. (ch)',
            'George judged the giant jar of ginger jam gently. (j)',
            'Many mornings, humming men mend the main mill. (m / n)',
            'The young king was singing a long, ringing song. (ng)',
            'Little yellow lilies fell along the level valley. (l)',
            'Robert really wrote rather rare rural rhymes. (r)',
            'We watched the wild wind wake the warm water. (w)',
            'Yesterday, a young yellow yacht sailed beyond the yard. (y)',
            'How high did Henry hold his heavy hat? (h)',
          ],
        },
        {
          label: '3d. Clusters & rapid articulation',
          lines: [
            'Strong strangers stretched three splendid strips of string.',
            "The sixth twisted crisps stuck to the desk's glass lid.",
            'She squeezed through the shrinking, sprawling, scrambled crowd.',
            'Texts, risks, masks, and tasks — he asked for facts, not acts.',
          ],
        },
      ],
    },
    {
      title: 'Section 4 — Emotional range',
      duration: '~3 minutes',
      instruction:
        '[ Each emotion has its own lines, plus one anchor sentence — "I never expected it to happen this way." Say the anchor in that emotion every time. Take a breath and genuinely shift state between emotions; a two-second pause between each block.  ]',
      blocks: [
        {
          label: 'Neutral / matter-of-fact',
          lines: [
            "The meeting starts at three o'clock in the main conference room.",
            'I never expected it to happen this way.',
          ],
        },
        {
          label: 'Joy / delight',
          lines: [
            'We got it! After all these months, we actually got it — I could dance right here in the street!',
            'I never expected it to happen this way!',
          ],
        },
        {
          label: 'Excitement / anticipation',
          lines: [
            "Okay, okay, listen — the doors open in five minutes, and we're first in line. This is really happening!",
            'I never expected it to happen this way!',
          ],
        },
        {
          label: 'Sadness / grief',
          lines: [
            'She kept his letters in a shoebox by the window. I read them all last night.',
            'I never expected it to happen this way.',
          ],
        },
        {
          label: 'Anger / frustration',
          lines: [
            "No. We had a deal, and you broke it — again. Don't tell me to calm down.",
            'I never expected it to happen this way.',
          ],
        },
        {
          label: 'Fear / anxiety',
          lines: [
            "Did you hear that? There's someone downstairs. Stay behind me and don't make a sound.",
            'I never expected it to happen this way.',
          ],
        },
        {
          label: 'Surprise / disbelief',
          lines: [
            "Wait — what? You're kidding. You're actually serious right now?",
            'I never expected it to happen this way.',
          ],
        },
        {
          label: 'Tenderness / warmth',
          lines: [
            "Hey. Come here. It's alright — you're safe now, and I'm not going anywhere.",
            'I never expected it to happen this way.',
          ],
        },
        {
          label: 'Sarcasm / dry wit',
          lines: [
            'Oh, fantastic. Another Monday. Truly, the universe spoils me.',
            'I never expected it to happen this way.',
          ],
        },
        {
          label: 'Determination / resolve',
          lines: [
            "One more try. I don't care how long it takes — we finish what we started.",
            'I never expected it to happen this way.',
          ],
        },
        {
          label: 'Curiosity / wonder',
          lines: [
            "Look at that… I've never seen anything like it. What do you think it is?",
            'I never expected it to happen this way.',
          ],
        },
        {
          label: 'Calm reassurance',
          lines: [
            "Take a slow breath. We've prepared for this, and we know every step.",
            'I never expected it to happen this way.',
          ],
        },
      ],
    },
    {
      title: 'Section 5 — Common phrases & functional speech',
      duration: '~1.5 minutes',
      instruction: '[ Natural conversational delivery, as if speaking to one person. ]',
      blocks: [
        {
          label: 'Greetings & courtesies.',
          lines: [
            "Hello. Hi there. Good morning. Good afternoon. Good evening. Goodbye. See you later. How are you? I'm doing well, thanks — and you? Nice to meet you. Please. Thank you so much. You're welcome. Excuse me. I'm sorry. No problem at all. Congratulations! Take care",
          ],
        },
        {
          label: 'Questions & responses.',
          lines: [
            "Who was that? What time is it? Where are we going? When does it start? Why not? How does this work? Yes. No. Maybe. Absolutely. Of course. I'm not sure. Let me check. Could you repeat that, please?",
          ],
        },
        {
          label: 'Numbers & counting.',
          lines: [
            'Zero, one, two, three, four, five, six, seven, eight, nine, ten. Eleven, twelve, thirteen, twenty, thirty, forty, fifty, sixty, seventy, eighty, ninety, one hundred, one thousand, one million. First, second, third, fourth, fifth.',
          ],
        },
        {
          label: 'Dates, times, amounts.',
          lines: [
            "Today is Tuesday, the fifteenth of July, twenty twenty-six. The train leaves at 9:45 a.m. and arrives at 6:30 p.m. That will be forty-seven dollars and sixty-two cents. My number is five five five, zero one nine eight. It's about 72 degrees outside.",
          ],
        },
        {
          label: 'Spelling alphabet.',
          lines: ['A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z.'],
        },
        {
          label: 'Everyday statements.',
          lines: [
            "I'll call you back in ten minutes. Can you send me that file? Turn left at the second light. The package should arrive tomorrow. Let's grab lunch next week. I completely agree with you. That's a great question. Give me one second. Here's what I'm thinking. Does that make sense?",
          ],
        },
      ],
    },
    {
      title: 'Section 6 — Dynamics & prosody',
      duration: '~1 minute',
      instruction: '[ Same sentence, different deliveries. Reset between each. ]',
      closingInstruction:
        '[ Finally, three natural, non-verbal moments — one each, genuine: a short laugh, a long sigh, a thoughtful "hmm." ]',
      blocks: [
        {
          label: 'Whisper (close and quiet, but fully articulated)',
          lines: ['The garden gate is open, and the moon is already up.'],
        },
        {
          label: 'Soft, intimate (just above a whisper)',
          lines: ['The garden gate is open, and the moon is already up.'],
        },
        {
          label: 'Normal projection',
          lines: ['The garden gate is open, and the moon is already up.'],
        },
        {
          label: 'Loud, projected (calling across a room — do not shout into the mic; lean back)',
          lines: ['The garden gate is open, and the moon is already up!'],
        },
        {
          label: 'Slow and deliberate (half speed, every word weighted)',
          lines: ['The garden gate is open… and the moon… is already up.'],
        },
        {
          label: 'Fast and energetic (hurried, but every word clear)',
          lines: ['The garden gate is open and the moon is already up!'],
        },
        {
          label: 'Rising question',
          lines: ['The garden gate is open, and the moon is already up?'],
        },
        {
          label: 'Trailing off, thoughtful',
          lines: ['The garden gate is open, and the moon is already up…'],
        },
      ],
    },
    {
      title: 'Section 7 — Close',
      duration: '~15 seconds',
      instruction: '[ Plain and natural. ]',
      closingInstruction: '[ Stay silent and record 10 seconds of room tone. End of session. ]',
      blocks: [
        {
          lines: [
            'This concludes my voice profile recording session. Recorded by me, [FULL NAME], on [DATE]. Thank you.',
          ],
        },
      ],
    },
  ],
  coverageChecklist: {
    label: 'engineer reference — not read aloud',
    title: 'Coverage checklist',
    items: [
      'Monophthongs: ee (believe), ih (ship), eh (ten), a (cat), uh (brother), ah (father), o (hot), aw (thought), short-oo (book), long-oo (blue), er (first), schwa (about) — §3a',
      'Diphthongs: ay, eye, oy, ow, oh, ear, air, oor — §3b',
      'Consonants: p b t d k g f v, both th sounds, s z sh zh ch j m n ng l r w y h — §3c',
      'Clusters: str, spl, spr, thr, shr, squ, -sks, -sts, -sps — §3d',
      'Prosody: whisper → projected, half → double speed, rising/falling/trailing intonation — §6',
      'Emotions: 12 states with a constant anchor sentence for cross-emotion comparison — §4',
      'Functional speech: greetings, questions, digits 0–1M, ordinals, dates/times/currency/phone, full alphabet — §5',
      'Non-verbal: laugh, sigh, hmm — §6',
      'Provenance: spoken consent + identity statement at head and tail — §1, §7',
    ],
  },
}
