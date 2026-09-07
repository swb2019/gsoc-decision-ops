# Two-way audio: hearing and responding

The existing scenario voice interaction is presented as **Two-way audio**. It uses the device's microphone for a spoken response and its speakers or selected audio output for spoken updates. It does not require a headset.

- **Hear spoken updates** controls playback of scenario updates and decision prompts.
- **Speak a response** controls voice input. A spoken response becomes editable response text; it is recorded with the decision when the player commits it.
- Setup remains optional, with the existing disclosed local model download and cancellation. Enabling setup does not request microphone permission or start recording.
- Readiness distinguishes playback from voice-input availability. A playback-only fallback does not claim that voice responses are ready.

This correction changes the existing scenario voice panel, header/mobile controls, field guide, status messages and response-button wording. It replaces equipment framing with the intended interaction. Recognition, playback and decision semantics are preserved. Glasshouse's separate handover playback is still a distinct feature; this wording correction does not claim that a new conversational engine was added there.

The refreshed static artifact is `a0e4fdde82205a9088483b54`. Production build and TypeScript checks pass. The full Chrome regression suite and the two-way setup/cancellation journey in Firefox and WebKit verify the change. Microphone capture and recognition quality are not established by those setup tests; manual speech quality remains part of human qualification.

The earlier full Android and art/audio evidence remains pinned to `93781ed04a3f81597bbfbd90`. Preserve that provenance rather than relabeling earlier captures as tests of this refreshed artifact. The delivery manifest records the source revision and the new verification scope.
