import { describe, expect, it } from 'vitest';
import { SpokenDecisionDialogue, type SpokenControl } from './spoken-decision';
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
      category: 'MITIGATE',
    },
    { id: 'vendor', label: 'Vendor support', category: 'TRANSFER' },
  ] as SpokenControl[],
  risks: [
    { id: 'gap', label: 'Medium temporary coverage gap', aliases: ['medium', 'coverage gap'] },
    { id: 'delay', label: 'Medium response time increased', aliases: ['medium', 'response delay'] },
    { id: 'low', label: 'Low manual workaround', aliases: ['low'] },
  ],
};
describe('spoken decision dialogue', () => {
  it('executes a fully conveyed decision without manual selection or confirmation', () => {
    const d = new SpokenDecisionDialogue();
    expect(
      d.receive(
        'Use manual verification for physical access control, medium temporary coverage gap.',
        'a',
        choices
      ).decision
    ).toMatchObject({ assetId: 'doors', control: 'manual', category: 'MITIGATE', risk: 'gap' });
  });
  it('asks spoken follow-ups and executes on the final answer', () => {
    const d = new SpokenDecisionDialogue();
    expect(d.receive('Manual verification', 'a', choices).reply).toContain('Which asset');
    expect(d.receive('first one', 'a', choices).reply).toContain('Which residual risk');
    expect(d.receive('medium', 'a', choices).decision).toBeUndefined();
    expect(d.receive('second one', 'a', choices).decision).toMatchObject({
      assetId: 'doors',
      control: 'manual',
      risk: 'delay',
    });
  });
  it('does not execute negated, hypothetical, unknown, or cancelled decisions', () => {
    const d = new SpokenDecisionDialogue();
    for (const text of [
      'Do not use manual verification for physical access control low',
      'What if we use vendor support',
      'Maybe manual verification',
      'unrelated speech',
      'cancel',
    ])
      expect(d.receive(text, 'a', choices).decision).toBeUndefined();
  });
  it('cannot carry a partial decision into a different incident', () => {
    const d = new SpokenDecisionDialogue();
    d.receive('Manual verification for physical access control', 'a', choices);
    expect(d.receive('Low', 'b', choices).decision).toBeUndefined();
    expect(d.receive('Low', 'b', choices).reply).toContain('Which asset');
  });
  it('does not silently choose the longer of two requested controls', () => {
    const d = new SpokenDecisionDialogue();
    const result = d.receive(
      'Manual verification and vendor support for physical access control low',
      'a',
      choices
    );
    expect(result.decision).toBeUndefined();
    expect(result.reply).toContain('multiple actions');
  });
});
