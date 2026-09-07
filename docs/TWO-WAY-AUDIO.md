# Two-way audio: hearing and responding

The existing scenario voice interaction uses the device's microphone for a spoken response and its speakers or selected audio output for spoken updates. It does not require a headset.

## Sending a spoken response

1. Select the asset, treatment/control and residual-risk choice for the current decision.
2. Tap **Speak a response** and speak normally.
3. A pause of about 1.25 seconds after detected speech ends the turn. The response is transcribed locally and the selected decision is sent automatically, with the recognized words in its record. There is no review-before-send or second commit step.

**Finish and send now** can end a spoken turn explicitly. **Cancel response** remains available while opening the microphone, listening or transcribing. Typed decisions retain their ordinary commit button. The visible sent receipt and debrief retain the recognized response.

## Boundaries and recovery

- No microphone request or recording occurs merely by entering the scenario or enabling model setup. Setup remains optional, with its existing disclosed model download and cancellation.
- Capture uses echo cancellation and stops app speech while listening. Input activity detection is a local audio-level heuristic, not a claim of human speech recognition accuracy. Clear input must last at least 250 ms; brief clicks and silence do not trigger recognition. Twelve seconds without detected speech cancels; one minute without a completed turn cancels rather than sending a partial response.
- A response belongs to the decision and structured choices selected when speaking began. Changing them, leaving the view, hiding the tab, disabling input or cancelling invalidates the pending turn. Delayed permission and transcription results cannot submit to a different decision.
- Microphone tracks stop as soon as capture ends. Interrupted capture, denied permission, failed/empty transcription and over-limit text send nothing. A failed attempt leaves the typed path usable.
- Each completed recognition turn can submit once. A microphone disconnection is not treated as finishing a response. Recognition jobs are serialized; cancelling invalidates their result even if a model computation is already running.
- The model supplies response text, not an inferred action or authority. It cannot choose a treatment or execute an unselected command.

This implements the owner's explicit send-when-finished preference for the existing scenario voice flow. Glasshouse's separate handover playback remains a distinct feature; this change does not claim a new conversational engine there.

## Verification and provenance

The current artifact and exact source revision are recorded in the delivery manifest. Unit tests cover end-of-speech timing, short pauses, silence, clicks and long input. Browser journeys feed synthetic audio through the actual recorder/analyser/decoder with deterministic recognition fixtures, then verify the real decision record, one-shot submission, cancellation, context changes and permission/capture failures. These tests establish the sending mechanism, not recognition quality on human speech. Human speech/noise testing remains part of qualification.

Implementation references: [MediaRecorder stop/event ordering](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/stop), [audio waveform measurement](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatTimeDomainData), and [microphone track release](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop).

The earlier full Android and art/audio evidence remains pinned to `93781ed04a3f81597bbfbd90`. It is not relabeled as validation of this new microphone/send behavior. Public qualification remains on hold.
