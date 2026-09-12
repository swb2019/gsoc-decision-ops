# Two-way voice: hear, decide, and respond

Hourglass Command Center is the primary play path. Glasshouse remains a secondary authored practice. Both support an ongoing voice conversation through the device microphone and speakers. No headset is required. Voice remains optional; ordinary touch and keyboard controls remain available. Phones prefer an installed local English voice for responsive playback, avoiding a second resident neural model. Devices without that local phone voice retain Kokoro or the existing browser speech fallback.

Voice is an alternate control plane for the same actions taps and hotkeys already perform. It does not invent world evidence or grant extra authority.

## Start once, then speak

1. Open **More options**, choose **Two-way audio**, enable hearing and speech input, and allow the disclosed local models to finish loading.
2. Tap **Start conversation** and allow microphone access if the browser asks.
3. Speak a command or decision. About 1.25 seconds of silence after speech finishes ends the turn and sends it automatically. The game applies the same state change as the equivalent tap, speaks a short receipt or a follow-up question, and resumes listening automatically.

Say **stop listening** to end the conversation. The floating **Stop voice** button remains reachable above phone navigation, including while reviewing the mission. The latest recognized words and reply are available in **Latest voice exchange**. Say **help** at any time to hear what works in the current state. Unknown speech asks a clarifying question instead of doing nothing.

## Hourglass Command Center

Say **start mission** to begin. While a decision is waiting, **continue**, **degrade**, and **pause** commit the same postures as the Decision panel and the C / D / P hotkeys. You can also say the panel labels **accept**, **mitigate**, **transfer**, or **avoid**, or choose by ordinal such as **first one**, **option B**, **answer D**, or **B**.

When a decision is waiting, bare **pause** and **continue** prefer those postures. Say **pause mission** or **pause simulation** to pause the clock, and **resume** or **continue mission** to start it again.

The Decision panel **Commit Decision** button is also speakable: fill treatment, action, and residual risk by tap or by **select mitigate** / **select** plus the action or risk name, then say **commit** or **commit decision**. **Read aloud** reads the open inject.

You can also:

- **status** / **read intel** — hear the current update
- **select first intel** / **next** / **next intel** / **respond to oldest** / **open intel** — open the intel feed or an unhandled item; naming an intel title selects that card
- **show intel**, **show decision**, **show COP** — switch the same panels as the mobile tabs
- **brief owner** (optionally with an asset name)
- name an asset to select it
- **review** / **close review** / **return to command**

When a wait-gap task is on screen — including TRIAGE scenario cards such as **Urgency Assessment** — the overlay controls are speakable too: **option A** through **D**, **first** through **fourth**, or the answer text to select; **submit** / **submit answer** to commit the selection; **skip** / **skip this** / **skip task** (and repeated ASR like **Skip! Skip!**) to skip; **continue** or **next** after the result to dismiss; **hear** or **read aloud** to replay the prompt. Ranking tasks accept an order such as **A D C B**.

Optional enrichment still works: name a concrete control and residual risk, for example **manual verification for physical access control, medium temporary coverage gap**. Missing choices become spoken questions; answer by name or ordinal. That path records the same decision as the posture buttons.

The optional single-turn **Speak a response** path remains available after manually selecting the structured choices. It also sends after speech finishes and retains its explicit finish and cancellation controls.

## Glasshouse

Say **start guided practice**, **start independent practice**, or **start preview**. During a mission, supported authored actions include **verify the entrance**, **investigate the connector**, **activate manual verification**, **isolate the connector**, **pause dispatch**, **monitor**, and **restore the connector**. Spoken actions use the same authority, resource, lifecycle and evidence rules as the visual plan controls. Owner approval requests are described as requests, rather than completed actions.

Say **status**, **next update**, **advance one minute**, **pause**, **resume**, **review**, or **return to command**. **Handoff** asks for a summary, the receiving owner and the next review condition in successive spoken turns. Its reply reports the actual mission outcome, including an early or unresolved handoff. A review does not complete the mission. Existing saved missions are preserved when a start command is repeated.

The recognizer produces text. A bounded command adapter resolves the authored actions; it does not invent world evidence, grant authority or execute arbitrary instructions. Multiple named actions ask for one action at a time. Unknown and explicitly tentative or negated actions do not commit a plan.

## Turn ownership and recovery

- Entering a page or loading models does not activate the microphone. Starting the conversation is explicit.
- Echo cancellation is requested. Capture pauses during app replies and resumes only after playback finishes. Incoming reports wait for an active spoken turn to finish.
- Quiet capture windows rotate automatically after 12 seconds without speech, without requiring another tap. A minute without completing a spoken turn cancels that capture instead of sending a partial response.
- Each recognition result can act once, on its original mission/incident. Stopped conversations and stale, duplicate or hidden-tab results cannot execute commands.
- Hiding the tab pauses capture and playback. Returning resumes the active conversation. Leaving the page or stopping voice releases the microphone. A completed action receipt interrupted by hiding is repeated without executing the action again.
- Empty recognition, lost microphone access and failed capture send nothing. Recoverable recognition failures produce a spoken retry prompt. Disabling either input or playback ends the ongoing mode.

## Verification

The delivery manifest pins the current source, static pack and evidence. Browser journeys exercise native recording, silence detection, decoding and playback with deterministic model fixtures; separate real-model checks use locally synthesized speech. Fixture passes do not establish recognition quality. Final human review still covers accents, room noise, speaker echo, interruption timing, intelligibility, native accessibility and sustained use on the devices.

The backend probe in `qa-output/real-voice/backend-probe.json` compares the same synthetic phrase across actual Whisper settings. The GPU q8 encoder returned empty text, while a full-precision GPU encoder and the quantized WASM path recognized the phrase. The [maintainer's Whisper WebGPU example](https://huggingface.co/spaces/Xenova/whisper-webgpu) and [upstream execution-settings discussion](https://github.com/huggingface/transformers.js/issues/894) provide implementation context; local measurements are the evidence for this correction.

The current voice pack is **3212711aa9d7316215e75406**. Actual model journeys on both phones recognized two decisions and spoken stop, automatically resumed between replies, released every microphone track, preserved a reachable stop control, and stayed within the viewport. The S21 used a GPU full-precision encoder; the A14 used the quantized WASM path. Both used installed device speech for output.

| Observed synthetic check                        | SM-G998U1      | SM-A146U1       |
| ----------------------------------------------- | -------------- | --------------- |
| Setup in the observed cached/network conditions | 9.0 s          | 13.8 s          |
| Opening reply finishes and listening begins     | 16.4 s         | 16.2 s          |
| Short spoken phrase to recorded decision/stop   | 4.5–5.5 s      | 14.7–16.0 s     |
| Final viewport                                  | 384px portrait | 785px landscape |
| Touch stop target                               | At least 44px  | At least 44px   |

These are three synthetic phrases per device, including recording time and silence detection, not a statistical latency or accuracy claim. Recognition on the A14 is noticeably slower. The earlier S21 Kokoro path took 85.4 seconds to begin listening after the opening reply; the local device voice reduced that observed delay to 16.4 seconds. The earlier A14 dual-model attempt lost its browser session during speech generation. The final phone path avoids loading that second model.

Historical Android, art, calibration and rollback results retain their original artifact identifiers. Public qualification remains held for the final human review packet.
