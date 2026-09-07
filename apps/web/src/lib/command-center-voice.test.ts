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
    assets: [doors, visitor],
    intel: [badge, vendorNote],
    panel: 'decision',
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
    expect(result.reply).toMatch(/did not catch/i);
    expect(result.reply).toMatch(/help/i);
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
});
