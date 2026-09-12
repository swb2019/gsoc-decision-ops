import { describe, expect, it } from 'vitest';
import { CommandCenterVoice, type CommandCenterVoiceSnapshot } from './command-center-voice';
import type { SpokenControl } from './spoken-decision';

const choices = {
  assets: [
    { id: 'doors', label: 'Physical Access Control System', aliases: ['physical access control'] },
    { id: 'visitor', label: 'Visitor management' },
  ],
  controls: [
    {
      id: 'manual',
      label: 'Manual verification required',
      aliases: ['manual verification'],
      category: 'MITIGATE' as const,
    },
    { id: 'vendor', label: 'Vendor support', category: 'TRANSFER' as const },
  ] as SpokenControl[],
  risks: [
    { id: 'gap', label: 'Medium temporary coverage gap', aliases: ['medium', 'coverage gap'] },
    { id: 'delay', label: 'Medium response time increased', aliases: ['medium', 'response delay'] },
    { id: 'low', label: 'Low manual workaround', aliases: ['low'] },
  ],
};

const doors = { id: 'doors', name: 'Physical Access Control System' };
const visitor = { id: 'visitor', name: 'Visitor management' };
const badge = {
  id: 'dec1',
  title: 'Badge anomaly',
  content: 'A badge reader failed.',
  handled: false,
};
const vendorNote = {
  id: 'dec2',
  title: 'Vendor note',
  content: 'Vendor called.',
  handled: false,
};

function snapshot(partial: Partial<CommandCenterVoiceSnapshot> = {}): CommandCenterVoiceSnapshot {
  return {
    missionStarted: true,
    isRunning: true,
    showDebrief: false,
    conversationContext: 's1:dec1',
    pendingDecision: { id: 'dec1', title: badge.title, content: badge.content },
    selectedAsset: doors,
    selectedTreatmentCategory: null,
    selectedTreatmentOption: null,
    selectedResidualRisk: null,
    assets: [doors, visitor],
    intel: [badge, vendorNote],
    panel: 'decision',
    microTask: null,
    choices,
    ...partial,
  };
}

describe('Command Center voice control plane', () => {
  it('commits CONTINUE from continue when a decision and asset are waiting', () => {
    const voice = new CommandCenterVoice();
    const result = voice.resolve('continue', 's1:dec1', snapshot());
    expect(result.action).toMatchObject({
      type: 'commit-posture',
      posture: 'CONTINUE',
      decision: { assetId: 'doors', category: 'ACCEPT' },
    });
    expect(result.reply).toContain('CONTINUE');
  });

  it('maps Decision panel labels and ordinals onto the same postures as taps', () => {
    const voice = new CommandCenterVoice();
    expect(voice.resolve('accept', 's1:dec1', snapshot()).action).toMatchObject({
      type: 'commit-posture',
      posture: 'CONTINUE',
      decision: { category: 'ACCEPT' },
    });
    expect(voice.resolve('degrade', 's1:dec1', snapshot()).action).toMatchObject({
      type: 'commit-posture',
      posture: 'DEGRADE',
    });
    expect(voice.resolve('mitigate', 's1:dec1', snapshot()).action).toMatchObject({
      type: 'commit-posture',
      posture: 'DEGRADE',
      decision: { category: 'MITIGATE' },
    });
    expect(voice.resolve('transfer', 's1:dec1', snapshot()).action).toMatchObject({
      type: 'commit-posture',
      posture: 'DEGRADE',
      decision: { category: 'TRANSFER' },
    });
    expect(voice.resolve('pause', 's1:dec1', snapshot()).action).toMatchObject({
      type: 'commit-posture',
      posture: 'PAUSE',
    });
    expect(voice.resolve('avoid', 's1:dec1', snapshot()).action).toMatchObject({
      type: 'commit-posture',
      posture: 'PAUSE',
      decision: { category: 'AVOID' },
    });
    expect(voice.resolve('first one', 's1:dec1', snapshot()).action).toMatchObject({
      type: 'commit-posture',
      posture: 'CONTINUE',
    });
    expect(voice.resolve('option B', 's1:dec1', snapshot()).action).toMatchObject({
      type: 'commit-posture',
      posture: 'DEGRADE',
      decision: { category: 'MITIGATE' },
    });
    expect(voice.resolve('option D', 's1:dec1', snapshot()).action).toMatchObject({
      type: 'commit-posture',
      posture: 'PAUSE',
    });
  });

  it('keeps pause mission and resume as clock control while a decision is pending', () => {
    const voice = new CommandCenterVoice();
    expect(voice.resolve('pause mission', 's1:dec1', snapshot()).action).toEqual({
      type: 'pause-sim',
    });
    expect(
      voice.resolve('continue mission', 's1:dec1', snapshot({ isRunning: false })).action
    ).toEqual({
      type: 'resume-sim',
    });
    expect(voice.resolve('resume', 's1:dec1', snapshot({ isRunning: false })).action).toEqual({
      type: 'resume-sim',
    });
  });

  it('uses continue and pause as clock control when no decision is waiting', () => {
    const waiting = snapshot({
      pendingDecision: null,
      conversationContext: 's1:waiting',
      selectedAsset: null,
      isRunning: true,
    });
    const voice = new CommandCenterVoice();
    expect(voice.resolve('pause', 's1:waiting', waiting).action).toEqual({ type: 'pause-sim' });
    expect(
      voice.resolve('continue', 's1:waiting', { ...waiting, isRunning: false }).action
    ).toEqual({ type: 'resume-sim' });
  });

  it('starts the mission and lists live commands on help', () => {
    const idle = snapshot({
      missionStarted: false,
      isRunning: false,
      pendingDecision: null,
      selectedAsset: null,
      conversationContext: 's1:waiting',
      intel: [],
    });
    const voice = new CommandCenterVoice();
    expect(voice.resolve('start mission', 's1:waiting', idle).action).toEqual({
      type: 'start-mission',
    });
    const help = voice.resolve('help', 's1:waiting', idle).reply;
    expect(help).toContain('start mission');
    expect(help).toContain('show intel');
    const pendingHelp = voice.resolve('help', 's1:dec1', snapshot()).reply;
    expect(pendingHelp).toMatch(/continue/i);
    expect(pendingHelp).toMatch(/degrade/i);
    expect(pendingHelp).toMatch(/pause mission/i);
  });

  it('opens intel, COP, and review the way the tabs and debrief controls do', () => {
    const voice = new CommandCenterVoice();
    expect(voice.resolve('show COP', 's1:dec1', snapshot()).action).toEqual({
      type: 'set-panel',
      panel: 'cop',
    });
    expect(voice.resolve('show decision', 's1:dec1', snapshot()).action).toEqual({
      type: 'set-panel',
      panel: 'decision',
    });
    expect(
      voice.resolve('select first intel', 's1:waiting', snapshot({ pendingDecision: null })).action
    ).toEqual({
      type: 'select-intel',
      injectId: 'dec1',
    });
    expect(voice.resolve('next intel', 's1:dec1', snapshot()).action).toEqual({
      type: 'select-intel',
      injectId: 'dec2',
    });
    expect(voice.resolve('review', 's1:dec1', snapshot()).action).toEqual({ type: 'open-review' });
    expect(
      voice.resolve('close review', 's1:dec1', snapshot({ showDebrief: true })).action
    ).toEqual({ type: 'close-review' });
  });

  it('asks a clarifying question instead of silently ignoring unknown speech', () => {
    const voice = new CommandCenterVoice();
    const result = voice.resolve('launch the missiles', 's1:dec1', snapshot());
    expect(result.action).toEqual({ type: 'none' });
    expect(result.reply).toContain('I heard "launch the missiles"');
    expect(result.reply).toMatch(/help/i);
  });

  it('clarifies empty recognition instead of pretending a command ran', () => {
    const voice = new CommandCenterVoice();
    const result = voice.resolve('   ', 's1:dec1', snapshot());
    expect(result.action).toEqual({ type: 'none' });
    expect(result.reply).toMatch(/didn.t catch that/i);
    expect(result.reply).toMatch(/help/i);
  });

  it('commits high-frequency commands despite mild Whisper mishears', () => {
    const voice = new CommandCenterVoice();
    const pending = snapshot();
    for (const spoken of ['contin', 'continued', 'go ahead', 'keep going', 'proceed']) {
      expect(voice.resolve(spoken, 's1:dec1', pending).action).toMatchObject({
        type: 'commit-posture',
        posture: 'CONTINUE',
      });
    }
    for (const spoken of ['degree', 'degraded', 'degrade posture']) {
      expect(voice.resolve(spoken, 's1:dec1', pending).action).toMatchObject({
        type: 'commit-posture',
        posture: 'DEGRADE',
      });
    }
    for (const spoken of ['paused', 'paws']) {
      expect(voice.resolve(spoken, 's1:dec1', pending).action).toMatchObject({
        type: 'commit-posture',
        posture: 'PAUSE',
      });
    }
  });

  it('does not treat continue mishears as sim resume when no decision is waiting', () => {
    const waiting = snapshot({
      pendingDecision: null,
      conversationContext: 's1:waiting',
      selectedAsset: null,
      isRunning: false,
    });
    const voice = new CommandCenterVoice();
    expect(voice.resolve('go ahead', 's1:waiting', waiting).action).toEqual({ type: 'none' });
    expect(voice.resolve('proceed', 's1:waiting', waiting).action).toEqual({ type: 'none' });
    expect(voice.resolve('contin', 's1:waiting', waiting).action).toEqual({ type: 'none' });
    expect(voice.resolve('continue', 's1:waiting', waiting).action).toEqual({ type: 'resume-sim' });
    expect(voice.resolve('paused', 's1:waiting', { ...waiting, isRunning: true }).action).toEqual({
      type: 'pause-sim',
    });
  });

  it('starts the mission from common ASR variants and treats commands as help', () => {
    const idle = snapshot({
      missionStarted: false,
      isRunning: false,
      pendingDecision: null,
      selectedAsset: null,
      conversationContext: 's1:waiting',
      intel: [],
    });
    const voice = new CommandCenterVoice();
    expect(voice.resolve('start the mission', 's1:waiting', idle).action).toEqual({
      type: 'start-mission',
    });
    expect(voice.resolve('begin mission', 's1:waiting', idle).action).toEqual({
      type: 'start-mission',
    });
    expect(voice.resolve('start game', 's1:waiting', idle).action).toEqual({
      type: 'start-mission',
    });
    expect(voice.resolve('commands', 's1:waiting', idle).reply).toContain('start mission');
    expect(voice.resolve('what can I say', 's1:waiting', idle).reply).toContain('start mission');
  });

  it('does not commit tentative speech', () => {
    const voice = new CommandCenterVoice();
    expect(voice.resolve('maybe continue', 's1:dec1', snapshot()).action).toEqual({ type: 'none' });
    expect(voice.resolve('do not pause', 's1:dec1', snapshot()).action).toEqual({ type: 'none' });
  });

  it('still records a fully spoken control-and-risk decision', () => {
    const voice = new CommandCenterVoice();
    const result = voice.resolve(
      'Use manual verification for physical access control, medium temporary coverage gap.',
      's1:dec1',
      snapshot()
    );
    expect(result.action).toMatchObject({
      type: 'commit-posture',
      posture: 'DEGRADE',
      decision: { assetId: 'doors', control: 'manual', category: 'MITIGATE', risk: 'gap' },
    });
  });

  it('keeps optional spoken follow-ups when a control is named without an asset', () => {
    const voice = new CommandCenterVoice();
    const first = voice.resolve('Manual verification', 's1:dec1', snapshot());
    expect(first.action).toEqual({ type: 'none' });
    expect(first.reply).toContain('Which asset');
    const second = voice.resolve('option B', 's1:dec1', snapshot());
    expect(second.reply).toContain('Which residual risk');
    expect(second.action).toEqual({ type: 'none' });
  });

  it('selects a named asset without committing', () => {
    const voice = new CommandCenterVoice();
    expect(voice.resolve('Visitor management', 's1:dec1', snapshot()).action).toEqual({
      type: 'select-asset',
      assetId: 'visitor',
    });
  });

  it('briefs the selected owner', () => {
    const voice = new CommandCenterVoice();
    expect(voice.resolve('brief the owner', 's1:dec1', snapshot()).action).toEqual({
      type: 'brief-owner',
      assetId: 'doors',
    });
  });

  it('does not commit a decision spoken against a stale incident', () => {
    const voice = new CommandCenterVoice();
    const result = voice.resolve('continue', 's1:waiting', snapshot());
    expect(result.action).toEqual({ type: 'none' });
    expect(result.reply).toMatch(/situation changed/i);
  });

  const quiz = {
    id: 'asset-priority-mc',
    title: 'Asset Priority Check',
    question: 'Which asset owner notification takes priority?',
    type: 'MULTIPLE_CHOICE' as const,
    answered: false,
    selectedOptionId: null as string | null,
    rankingOrder: [],
    options: [
      { id: 'a', label: 'Marketing team workspace badge access' },
      { id: 'b', label: 'Executive floor and data center perimeter' },
      { id: 'c', label: 'Cafeteria turnstile systems' },
      { id: 'd', label: 'Visitor lobby badge printers' },
    ],
  };

  function taskSnap(partial: Partial<CommandCenterVoiceSnapshot> = {}): CommandCenterVoiceSnapshot {
    return snapshot({
      pendingDecision: null,
      selectedAsset: null,
      conversationContext: 's1:asset-priority-mc',
      microTask: quiz,
      ...partial,
    });
  }

  it('skips, selects, and submits a micro-task the same as the overlay taps', () => {
    const voice = new CommandCenterVoice();
    const waiting = taskSnap();
    expect(voice.resolve('skip', 's1:asset-priority-mc', waiting).action).toEqual({
      type: 'skip-micro-task',
    });
    expect(voice.resolve('option B', 's1:asset-priority-mc', waiting).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'b',
    });
    expect(voice.resolve('B', 's1:asset-priority-mc', waiting).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'b',
    });
    expect(voice.resolve('second one', 's1:asset-priority-mc', waiting).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'b',
    });
    expect(
      voice.resolve('Executive floor and data center perimeter', 's1:asset-priority-mc', waiting)
        .action
    ).toEqual({
      type: 'select-micro-task-option',
      optionId: 'b',
    });
    expect(voice.resolve('submit', 's1:asset-priority-mc', waiting).reply).toMatch(
      /select an answer/i
    );
    expect(
      voice.resolve(
        'submit',
        's1:asset-priority-mc',
        taskSnap({ microTask: { ...quiz, selectedOptionId: 'b' } })
      ).action
    ).toEqual({
      type: 'submit-micro-task',
      answer: 'b',
    });
    expect(
      voice.resolve(
        'continue',
        's1:asset-priority-mc',
        taskSnap({ microTask: { ...quiz, answered: true, selectedOptionId: 'b' } })
      ).action
    ).toEqual({ type: 'dismiss-micro-task' });
    expect(
      voice.resolve(
        'next',
        's1:asset-priority-mc',
        taskSnap({ microTask: { ...quiz, answered: true, selectedOptionId: 'b' } })
      ).action
    ).toEqual({ type: 'dismiss-micro-task' });
  });

  it('submits a spoken ranking order and still skips ranking tasks', () => {
    const ranking = {
      ...quiz,
      id: 'risk-rank-order',
      title: 'Threat Ranking',
      type: 'RANKING' as const,
      rankingOrder: ['a', 'b', 'c', 'd'],
      options: [
        { id: 'a', label: 'Active credential theft' },
        { id: 'b', label: 'Physical tailgating' },
        { id: 'c', label: 'Insider data exfiltration' },
        { id: 'd', label: 'Social engineering call' },
      ],
    };
    const waiting = taskSnap({
      conversationContext: 's1:risk-rank-order',
      microTask: ranking,
    });
    const voice = new CommandCenterVoice();
    expect(voice.resolve('A D C B', 's1:risk-rank-order', waiting).action).toEqual({
      type: 'submit-micro-task',
      answer: ['a', 'd', 'c', 'b'],
    });
    expect(voice.resolve('skip this', 's1:risk-rank-order', waiting).action).toEqual({
      type: 'skip-micro-task',
    });
    expect(voice.resolve('submit', 's1:risk-rank-order', waiting).action).toEqual({
      type: 'submit-micro-task',
      answer: ['a', 'b', 'c', 'd'],
    });
  });

  it('keeps pause mission as clock control while a micro-task is waiting', () => {
    const voice = new CommandCenterVoice();
    expect(voice.resolve('pause mission', 's1:asset-priority-mc', taskSnap()).action).toEqual({
      type: 'pause-sim',
    });
    expect(voice.resolve('help', 's1:asset-priority-mc', taskSnap()).reply).toMatch(/skip/i);
  });

  const urgency = {
    id: 'time-pressure',
    title: 'Urgency Assessment',
    question: 'You have 3 pending items. Bridge call in 5 minutes. Which do you address NOW?',
    type: 'SCENARIO' as const,
    answered: false,
    selectedOptionId: null as string | null,
    rankingOrder: [],
    options: [
      { id: 'a', label: 'Update the COP with latest facts for the bridge' },
      { id: 'b', label: 'Draft the after-action report outline' },
      { id: 'c', label: "Review yesterday's incident logs" },
      { id: 'd', label: 'Organize your notes from earlier' },
    ],
  };

  function urgencySnap(
    partial: Partial<CommandCenterVoiceSnapshot> = {}
  ): CommandCenterVoiceSnapshot {
    return snapshot({
      pendingDecision: null,
      selectedAsset: null,
      conversationContext: 's1:time-pressure',
      microTask: urgency,
      ...partial,
    });
  }

  it('skips the TRIAGE Urgency Assessment card the same as the Skip tap, including Skip! Skip!', () => {
    const voice = new CommandCenterVoice();
    const showing = urgencySnap();
    for (const spoken of [
      'Skip',
      'skip',
      'skip this',
      'skip task',
      'skip this task',
      'Skip! Skip!',
      'skip skip',
    ]) {
      expect(voice.resolve(spoken, 's1:time-pressure', showing).action).toEqual({
        type: 'skip-micro-task',
      });
      expect(voice.resolve(spoken, 's1:time-pressure', showing).reply).toMatch(/skipped/i);
    }
  });

  it('selects Urgency Assessment A–D, first–fourth, and answer text the same as tapping options', () => {
    const voice = new CommandCenterVoice();
    const showing = urgencySnap();
    expect(voice.resolve('option A', 's1:time-pressure', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'a',
    });
    expect(voice.resolve('A', 's1:time-pressure', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'a',
    });
    expect(voice.resolve('first', 's1:time-pressure', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'a',
    });
    expect(voice.resolve('option B', 's1:time-pressure', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'b',
    });
    expect(voice.resolve('second one', 's1:time-pressure', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'b',
    });
    expect(voice.resolve('option C', 's1:time-pressure', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'c',
    });
    expect(voice.resolve('third', 's1:time-pressure', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'c',
    });
    expect(voice.resolve('option D', 's1:time-pressure', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'd',
    });
    expect(voice.resolve('fourth', 's1:time-pressure', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'd',
    });
    expect(voice.resolve('answer D', 's1:time-pressure', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'd',
    });
    expect(
      voice.resolve('Update the COP with latest facts for the bridge', 's1:time-pressure', showing)
        .action
    ).toEqual({
      type: 'select-micro-task-option',
      optionId: 'a',
    });
    expect(
      voice.resolve('Draft the after-action report outline', 's1:time-pressure', showing).action
    ).toEqual({
      type: 'select-micro-task-option',
      optionId: 'b',
    });
    expect(
      voice.resolve("Review yesterday's incident logs", 's1:time-pressure', showing).action
    ).toEqual({
      type: 'select-micro-task-option',
      optionId: 'c',
    });
    expect(
      voice.resolve('Organize your notes from earlier', 's1:time-pressure', showing).action
    ).toEqual({
      type: 'select-micro-task-option',
      optionId: 'd',
    });
    expect(voice.resolve('help', 's1:time-pressure', showing).reply).toMatch(/Urgency Assessment/);
    expect(voice.resolve('help', 's1:time-pressure', showing).reply).toMatch(/skip/i);
  });

  it('applies Urgency Assessment skip and A–D when listen started in the wait-gap', () => {
    const voice = new CommandCenterVoice();
    const showing = urgencySnap();
    expect(voice.resolve('Skip! Skip!', 's1:waiting', showing).action).toEqual({
      type: 'skip-micro-task',
    });
    expect(voice.resolve('skip this', 's1:waiting', showing).action).toEqual({
      type: 'skip-micro-task',
    });
    expect(voice.resolve('option A', 's1:waiting', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'a',
    });
    expect(voice.resolve('D', 's1:waiting', showing).action).toEqual({
      type: 'select-micro-task-option',
      optionId: 'd',
    });
    expect(voice.resolve('skip', 's1:asset-priority-mc', showing).reply).toMatch(
      /situation changed/i
    );
    expect(voice.resolve('skip', 's1:asset-priority-mc', showing).action).toEqual({
      type: 'none',
    });
  });

  it('still clarifies unknown speech on Urgency Assessment and does not skip a Decision item', () => {
    const voice = new CommandCenterVoice();
    const showing = urgencySnap();
    const unknown = voice.resolve('launch the missiles', 's1:time-pressure', showing);
    expect(unknown.action).toEqual({ type: 'none' });
    expect(unknown.reply).toContain('I heard "launch the missiles"');
    expect(unknown.reply).toMatch(/help/i);
    expect(voice.resolve('Skip! Skip!', 's1:dec1', snapshot()).action).toEqual({ type: 'none' });
    expect(voice.resolve('Skip! Skip!', 's1:dec1', snapshot()).reply).toMatch(/no skip/i);
  });

  it('commits the filled Decision form the same as the Commit Decision tap', () => {
    const voice = new CommandCenterVoice();
    const filled = snapshot({
      selectedTreatmentCategory: 'MITIGATE',
      selectedTreatmentOption: 'mitigate-manual',
      selectedResidualRisk: 'medium-gap',
    });
    expect(voice.resolve('commit', 's1:dec1', filled).action).toEqual({ type: 'commit-selected' });
    expect(voice.resolve('commit decision', 's1:dec1', snapshot()).action).toEqual({
      type: 'none',
    });
    expect(voice.resolve('commit decision', 's1:dec1', snapshot()).reply).toMatch(/treatment/i);
    expect(voice.resolve('select mitigate', 's1:dec1', snapshot()).action).toEqual({
      type: 'select-treatment',
      category: 'MITIGATE',
    });
    expect(voice.resolve('select manual verification', 's1:dec1', snapshot()).action).toEqual({
      type: 'select-control',
      controlId: 'manual',
    });
    expect(
      voice.resolve('select medium temporary coverage gap', 's1:dec1', snapshot()).action
    ).toEqual({
      type: 'select-risk',
      riskId: 'gap',
    });
  });

  it('opens oldest or named intel the same as the feed and Respond to Oldest taps', () => {
    const voice = new CommandCenterVoice();
    const idle = snapshot({
      pendingDecision: null,
      selectedAsset: null,
      conversationContext: 's1:waiting',
    });
    expect(voice.resolve('respond to oldest', 's1:waiting', idle).action).toEqual({
      type: 'select-intel',
      injectId: 'dec1',
    });
    expect(voice.resolve('next', 's1:waiting', idle).action).toEqual({
      type: 'select-intel',
      injectId: 'dec1',
    });
    expect(voice.resolve('Vendor note', 's1:waiting', idle).action).toEqual({
      type: 'select-intel',
      injectId: 'dec2',
    });
    expect(voice.resolve('B', 's1:dec1', snapshot()).action).toMatchObject({
      type: 'commit-posture',
      posture: 'DEGRADE',
      decision: { category: 'MITIGATE' },
    });
    expect(voice.resolve('read aloud', 's1:dec1', snapshot()).action).toEqual({
      type: 'hear-intel',
    });
    expect(voice.resolve('hear', 's1:asset-priority-mc', taskSnap()).action).toEqual({
      type: 'hear-micro-task',
    });
  });

  it('does not skip a Decision panel item and still clarifies unknown skip with no task', () => {
    const voice = new CommandCenterVoice();
    expect(voice.resolve('skip', 's1:dec1', snapshot()).action).toEqual({ type: 'none' });
    expect(voice.resolve('skip', 's1:dec1', snapshot()).reply).toMatch(/no skip/i);
    const idle = snapshot({
      pendingDecision: null,
      selectedAsset: null,
      conversationContext: 's1:waiting',
      intel: [],
    });
    expect(voice.resolve('skip', 's1:waiting', idle).action).toEqual({ type: 'none' });
    expect(voice.resolve('skip', 's1:waiting', idle).reply).toMatch(/no task/i);
  });
});
