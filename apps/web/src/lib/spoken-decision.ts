export type SpokenCategory = 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID';
export interface SpokenOption {
  id: string;
  label: string;
  aliases?: readonly string[];
}
export interface SpokenControl extends SpokenOption {
  category: SpokenCategory;
}
export interface SpokenDecision {
  assetId: string;
  category: SpokenCategory;
  control: string;
  risk: string;
  rationale: string;
}
export const speechWords = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const hasPhrase = (text: string, phrase: string): boolean =>
  ` ${speechWords(text)} `.includes(` ${speechWords(phrase)} `);

/** Resolve authored choices only. Ambiguous matches become a spoken question, never a guessed action. */
export function spokenMatches<T extends SpokenOption>(text: string, options: readonly T[]): T[] {
  const scored = options.map((option) => ({
    option,
    score: Math.max(
      0,
      ...[option.label, option.id.replaceAll('-', ' '), ...(option.aliases ?? [])]
        .filter((alias) => hasPhrase(text, alias))
        .map((alias) => speechWords(alias).length)
    ),
  }));
  const best = Math.max(0, ...scored.map((item) => item.score));
  return best ? scored.filter((item) => item.score === best).map((item) => item.option) : [];
}

export class SpokenDecisionDialogue {
  private context = '';
  private draft: Partial<SpokenDecision> = {};
  private awaiting: { field: 'assetId' | 'control' | 'risk'; options: SpokenOption[] } | null =
    null;
  clear(): void {
    this.draft = {};
    this.awaiting = null;
  }
  receive(
    text: string,
    context: string,
    choices: { assets: SpokenOption[]; controls: SpokenControl[]; risks: SpokenOption[] }
  ): { reply: string; decision?: SpokenDecision } {
    if (context !== this.context) {
      this.clear();
      this.context = context;
    }
    const words = speechWords(text);
    if (/^(cancel|never mind|nevermind|no|discard)( (that|decision|plan))?$/.test(words)) {
      this.clear();
      return { reply: 'Draft cancelled. Tell me your next decision.' };
    }
    if (
      /\b(dont|do not|not yet|maybe|perhaps|what if|should we)\b/.test(words) ||
      words.startsWith('if ')
    ) {
      return {
        reply:
          'I have not acted on that. State the action you want, or say cancel to discard the draft.',
      };
    }
    let matched = false;
    const namedControls = choices.controls.filter((option) => spokenMatches(text, [option]).length);
    if (namedControls.length > 1) {
      return { reply: 'I heard multiple actions. Please give one action at a time.' };
    }
    const ordinal =
      /^(?:the )?(first|second|third|fourth|fifth|one|two|three|four|five)(?: (?:one|option))?$/.exec(
        words
      );
    if (ordinal && this.awaiting) {
      const index = (
        {
          first: 0,
          one: 0,
          second: 1,
          two: 1,
          third: 2,
          three: 2,
          fourth: 3,
          four: 3,
          fifth: 4,
          five: 4,
        } as Record<string, number>
      )[ordinal[1]];
      const option = this.awaiting.options[index];
      if (option) {
        this.draft[this.awaiting.field] = option.id;
        matched = true;
      }
    }
    for (const [field, options] of [
      ['assetId', choices.assets],
      ['control', choices.controls],
      ['risk', choices.risks],
    ] as const) {
      const matches = spokenMatches(text, options);
      if (matches.length === 1) {
        this.draft[field] = matches[0].id;
        matched = true;
      } else if (matches.length > 1) {
        this.awaiting = { field, options: matches };
        return {
          reply: `Which ${field === 'assetId' ? 'asset' : field}? ${matches.map((o, i) => `${i + 1}, ${o.label}`).join('. ')}.`,
        };
      }
    }
    const categories = (['ACCEPT', 'MITIGATE', 'TRANSFER', 'AVOID'] as const).filter((category) =>
      hasPhrase(text, category)
    );
    if (categories.length > 1)
      return {
        reply: 'I heard more than one treatment. Choose accept, mitigate, transfer, or avoid.',
      };
    if (categories.length === 1) {
      this.draft.category = categories[0];
      matched = true;
    }
    const control = choices.controls.find((option) => option.id === this.draft.control);
    if (control && categories.length === 0) this.draft.category = control.category;
    if (control && this.draft.category && control.category !== this.draft.category) {
      this.draft.control = undefined;
      return {
        reply: `That control belongs to ${control.category.toLowerCase()}. Tell me a control for ${this.draft.category.toLowerCase()}, or change the treatment.`,
      };
    }
    if (control) this.draft.category = control.category;
    if (!matched)
      return {
        reply: this.awaiting
          ? `Please choose ${this.awaiting.options.map((o) => o.label).join(', ')}. You can say first or second.`
          : 'Tell me the asset, concrete action, and residual risk. For example: manual verification for physical access control, medium temporary coverage gap.',
      };
    const rationale = [this.draft.rationale, text.trim()].filter(Boolean).join(' ');
    if (rationale.length > 2000) {
      this.clear();
      return {
        reply:
          'The spoken draft exceeded 2,000 characters. Nothing was committed. Please restate the decision more briefly.',
      };
    }
    this.draft.rationale = rationale;
    const ask = (
      field: 'assetId' | 'control' | 'risk',
      options: SpokenOption[],
      label: string
    ): { reply: string } => {
      this.awaiting = { field, options };
      return {
        reply: `Which ${label}? ${options.map((o, i) => `${i + 1}, ${o.label}`).join('. ')}.`,
      };
    };
    if (!this.draft.assetId) return ask('assetId', choices.assets, 'asset');
    if (!this.draft.control)
      return ask(
        'control',
        choices.controls.filter((c) => !this.draft.category || c.category === this.draft.category),
        'control'
      );
    if (!this.draft.risk) return ask('risk', choices.risks, 'residual risk');
    const decision = this.draft as SpokenDecision;
    this.clear();
    return {
      decision,
      reply: `Decision recorded. ${choices.assets.find((a) => a.id === decision.assetId)!.label}: ${control!.label}. ${choices.risks.find((r) => r.id === decision.risk)!.label}.`,
    };
  }
}

export const legacyControlAliases: Record<string, string[]> = {
  'accept-monitor': ['enhanced monitoring', 'monitor more closely'],
  'accept-asis': ['accept as is', 'keep the current state'],
  'accept-document': ['document and proceed'],
  'mitigate-isolate': ['network isolation', 'isolate the network'],
  'mitigate-disable': ['disable compromised badges', 'disable compromised accounts'],
  'mitigate-patrol': ['increase patrols', 'increase patrol frequency'],
  'mitigate-backup': ['activate backup', 'use the backup system'],
  'mitigate-manual': ['manual verification', 'verify manually'],
  'transfer-vendor': ['escalate to the vendor', 'vendor support'],
  'transfer-insurance': ['notify insurance'],
  'transfer-le': ['law enforcement'],
  'transfer-third': ['third party responder', 'external responder'],
  'avoid-shutdown': ['shut down', 'shutdown'],
  'avoid-evacuate': ['evacuate', 'secure the area'],
  'avoid-disconnect': ['disconnect from the network'],
  'avoid-cancel': ['postpone the activity', 'cancel the activity'],
};
