import type { DecisionPosture } from '@gsoc-decision-ops/core';
import {
  SpokenDecisionDialogue,
  isHelpSpeech,
  isTentativeSpeech,
  speechWords,
  spokenMatches,
  spokenOrdinalIndex,
  voiceHeardClarify,
  type SpokenCategory,
  type SpokenControl,
  type SpokenDecision,
  type SpokenOption,
} from './spoken-decision';

export type CommandCenterPanel = 'intel' | 'decision' | 'cop';

export interface CommandCenterVoiceAsset {
  id: string;
  name: string;
}

export interface CommandCenterVoiceIntel {
  id: string;
  title: string;
  content: string;
  handled: boolean;
}

export type CommandCenterVoiceMicroTaskType =
  'MULTIPLE_CHOICE' | 'RANKING' | 'TRADEOFF' | 'SCENARIO';

export interface CommandCenterVoiceMicroTask {
  id: string;
  title: string;
  question: string;
  type: CommandCenterVoiceMicroTaskType;
  answered: boolean;
  selectedOptionId: string | null;
  rankingOrder: string[];
  options: SpokenOption[];
}

export interface CommandCenterVoiceSnapshot {
  missionStarted: boolean;
  isRunning: boolean;
  showDebrief: boolean;
  conversationContext: string;
  pendingDecision: { id: string; title: string; content: string } | null;
  selectedAsset: CommandCenterVoiceAsset | null;
  selectedTreatmentCategory: SpokenCategory | null;
  selectedTreatmentOption: string | null;
  selectedResidualRisk: string | null;
  assets: CommandCenterVoiceAsset[];
  intel: CommandCenterVoiceIntel[];
  panel: CommandCenterPanel;
  microTask: CommandCenterVoiceMicroTask | null;
  choices: {
    assets: SpokenOption[];
    controls: SpokenControl[];
    risks: SpokenOption[];
  };
}

export type CommandCenterVoiceAction =
  | { type: 'none' }
  | { type: 'start-mission' }
  | { type: 'pause-sim' }
  | { type: 'resume-sim' }
  | { type: 'open-review' }
  | { type: 'close-review' }
  | { type: 'set-panel'; panel: CommandCenterPanel }
  | { type: 'select-intel'; injectId: string }
  | { type: 'select-asset'; assetId: string }
  | { type: 'brief-owner'; assetId: string }
  | { type: 'select-treatment'; category: SpokenCategory }
  | { type: 'select-control'; controlId: string }
  | { type: 'select-risk'; riskId: string }
  | { type: 'commit-selected' }
  | { type: 'hear-intel' }
  | { type: 'skip-micro-task' }
  | { type: 'select-micro-task-option'; optionId: string }
  | { type: 'submit-micro-task'; answer: string | string[] }
  | { type: 'dismiss-micro-task' }
  | { type: 'hear-micro-task' }
  | { type: 'commit-posture'; posture: DecisionPosture; decision: SpokenDecision };

export interface CommandCenterVoiceResult {
  reply: string;
  action: CommandCenterVoiceAction;
}

const TREATMENT_POSTURE = {
  ACCEPT: 'CONTINUE',
  MITIGATE: 'DEGRADE',
  TRANSFER: 'DEGRADE',
  AVOID: 'PAUSE',
} as const satisfies Record<SpokenCategory, DecisionPosture>;

const PANEL_TREATMENTS = [
  { category: 'ACCEPT', posture: 'CONTINUE' },
  { category: 'MITIGATE', posture: 'DEGRADE' },
  { category: 'TRANSFER', posture: 'DEGRADE' },
  { category: 'AVOID', posture: 'PAUSE' },
] as const;

const none = (reply: string): CommandCenterVoiceResult => ({
  reply,
  action: { type: 'none' },
});

function unhandledIntel(snapshot: CommandCenterVoiceSnapshot): CommandCenterVoiceIntel[] {
  return snapshot.intel.filter((item) => !item.handled);
}

function assetOptions(snapshot: CommandCenterVoiceSnapshot): SpokenOption[] {
  return snapshot.assets.map((asset) => ({
    id: asset.id,
    label: asset.name,
    aliases: [asset.name.replace(/ system$| platform$/i, '')],
  }));
}

function isBareAssetUtterance(words: string, asset: CommandCenterVoiceAsset): boolean {
  const names = [asset.name, asset.name.replace(/ system$| platform$/i, '')].map(speechWords);
  return names.some(
    (name) =>
      words === name ||
      words === `select ${name}` ||
      words === `choose ${name}` ||
      words === `use ${name}`
  );
}

function isBareIntelUtterance(words: string, item: CommandCenterVoiceIntel): boolean {
  const names = [item.title, item.title.replace(/ anomaly$| note$/i, '')].map(speechWords);
  return names.some(
    (name) =>
      words === name ||
      words === `select ${name}` ||
      words === `open ${name}` ||
      words === `show ${name}` ||
      words === `read ${name}`
  );
}

function namedAsset(text: string, snapshot: CommandCenterVoiceSnapshot): CommandCenterVoiceAsset[] {
  return spokenMatches(text, assetOptions(snapshot))
    .map((option) => snapshot.assets.find((asset) => asset.id === option.id))
    .filter((asset): asset is CommandCenterVoiceAsset => Boolean(asset));
}

function commitReply(
  posture: DecisionPosture,
  category: SpokenCategory,
  asset: CommandCenterVoiceAsset
): string {
  return `${category} committed — ${posture} posture for ${asset.name}.`;
}

function commitAction(
  posture: DecisionPosture,
  category: SpokenCategory,
  asset: CommandCenterVoiceAsset,
  text: string,
  extra?: Partial<SpokenDecision>
): CommandCenterVoiceResult {
  return {
    reply: commitReply(posture, category, asset),
    action: {
      type: 'commit-posture',
      posture,
      decision: {
        assetId: asset.id,
        category,
        control: extra?.control ?? '',
        risk: extra?.risk ?? '',
        rationale: extra?.rationale ?? text.trim(),
      },
    },
  };
}

export function commandCenterVoiceHelp(snapshot: CommandCenterVoiceSnapshot): string {
  if (snapshot.showDebrief) {
    return 'Debrief is open. Say close review or return to command. Say stop listening to end voice.';
  }
  const nav =
    'Say show intel, show decision, or show COP to switch panels. Say review to open debrief.';
  if (!snapshot.missionStarted) {
    return `Say start mission to begin. ${nav} Say status anytime. Say stop listening to end voice.`;
  }
  const clock = snapshot.isRunning
    ? 'Say pause mission to pause the clock.'
    : 'Say resume or continue mission to start the clock.';
  if (snapshot.microTask) {
    if (snapshot.microTask.answered) {
      return `${snapshot.microTask.title} is answered. Say continue or next to dismiss it, or say skip. ${clock} ${nav} Say stop listening to end voice.`;
    }
    const letters = snapshot.microTask.options
      .map((option, index) => `${String.fromCharCode(65 + index)} ${option.label}`)
      .join('; ');
    const ranking = snapshot.microTask.type === 'RANKING';
    return `${snapshot.microTask.title} is waiting. ${
      ranking
        ? 'Say the letters in order, such as A D C B, then say submit, or say skip.'
        : `Say option A through D, first through fourth, or the answer text.${letters ? ` ${letters}.` : ''} Say submit after a selection, or skip.`
    } ${clock} ${nav} Say stop listening to end voice.`;
  }
  if (!snapshot.pendingDecision) {
    const waiting = unhandledIntel(snapshot);
    const intelHint = waiting.length
      ? ` Say select first intel, next, or respond to oldest to open an item. ${waiting.length} unhandled.`
      : ' No intel is waiting.';
    return `No decision is waiting. ${clock}${intelHint} ${nav} Say status for the latest update. Say stop listening to end voice.`;
  }
  const asset = snapshot.selectedAsset?.name ?? 'a named asset';
  const commitHint = snapshot.selectedTreatmentCategory
    ? ' Say commit when the treatment, action, and residual risk are selected.'
    : ' Say commit after selecting a treatment, action, and residual risk.';
  return `${snapshot.pendingDecision.title} is waiting. Say continue, degrade, or pause for ${asset} — the same Decision panel postures. You can also say accept, mitigate, transfer, or avoid, or first one through option D.${commitHint} ${clock} Name an asset or say brief owner. ${nav} Say stop listening to end voice.`;
}

function statusReply(snapshot: CommandCenterVoiceSnapshot): string {
  if (snapshot.showDebrief) {
    return 'Debrief is open. Say close review to return to the mission.';
  }
  if (snapshot.microTask) {
    return snapshot.microTask.answered
      ? `${snapshot.microTask.title} is answered. Say continue or next.`
      : `${snapshot.microTask.title}. ${snapshot.microTask.question} Say option A through D, submit, skip, or help.`;
  }
  if (snapshot.pendingDecision) {
    const asset = snapshot.selectedAsset
      ? `Selected asset: ${snapshot.selectedAsset.name}.`
      : 'Name an asset, or say continue to use the default.';
    return `${snapshot.pendingDecision.title}. ${snapshot.pendingDecision.content} ${asset} Say continue, degrade, or pause, or say help.`;
  }
  const latest = [...snapshot.intel].reverse()[0];
  if (latest) {
    return `${latest.title}. ${latest.content} ${snapshot.isRunning ? 'Mission running.' : 'Clock paused.'} Say help to hear commands.`;
  }
  if (!snapshot.missionStarted) {
    return 'Mission has not started. Say start mission to begin.';
  }
  return snapshot.isRunning
    ? 'No decision is waiting. I will read new updates. Say help to hear commands.'
    : 'Clock is paused. Say resume, start mission, or help.';
}

function unknownReply(text: string): CommandCenterVoiceResult {
  return none(voiceHeardClarify(text));
}

function matchSimPause(words: string): boolean {
  return /^(?:please )?(?:pause|paused|paws)(?: the)?(?: mission|simulation|sim|game|clock)$/.test(
    words
  );
}

function matchSimResume(words: string): boolean {
  return (
    /^(?:please )?resume(?: the)?(?: mission|simulation|sim|game|clock)?$/.test(words) ||
    /^(?:please )?continue(?: the)?(?: mission|simulation|sim|game|clock)$/.test(words)
  );
}

function matchStartMission(words: string): boolean {
  return /^(?:(?:please |lets |let us )?(?:begin|start)(?: the)? (?:mission|simulation|game|clock)(?: now)?)$/.test(
    words
  );
}

function matchPanel(words: string): CommandCenterPanel | null {
  if (
    /^(?:(?:please )?(?:show|open|go to|switch to)(?: the)? )?(?:intel(?: feed)?|intel panel)$/.test(
      words
    )
  ) {
    return 'intel';
  }
  if (
    /^(?:(?:please )?(?:show|open|go to|switch to)(?: the)? )?(?:decision(?: panel|console)?)$/.test(
      words
    )
  ) {
    return 'decision';
  }
  if (
    /^(?:(?:please )?(?:show|open|go to|switch to)(?: the)? )?(?:cop|map|situation board|common operating picture)$/.test(
      words
    )
  ) {
    return 'cop';
  }
  return null;
}

function matchIntelSelect(words: string): number | 'next' | 'open' | 'oldest' | null {
  if (
    /^(?:please )?(?:respond to (?:the )?oldest(?: intel| item| card| update)?|oldest(?: intel)?)$/.test(
      words
    )
  ) {
    return 'oldest';
  }
  if (/^(?:select |open |show )?(?:the )?next intel(?: item| card| update)?$/.test(words)) {
    return 'next';
  }
  if (/^(?:please )?(?:next|next one)$/.test(words)) {
    return 'next';
  }
  const ordinal =
    /^(?:select |open |read |show )?(?:the )?(first|second|third|fourth|fifth) intel(?: item| card| update)?$/.exec(
      words
    );
  if (ordinal) {
    return ({ first: 0, second: 1, third: 2, fourth: 3, fifth: 4 } as Record<string, number>)[
      ordinal[1]
    ];
  }
  if (/^(?:select|open)(?: the)?(?: first)? intel$/.test(words)) return 0;
  if (/^(?:open|show)(?: the)? intel(?: feed| panel)?$/.test(words) || /^intel feed$/.test(words)) {
    return 'open';
  }
  return null;
}

function matchSkip(words: string): boolean {
  // speechWords already strips "Skip! Skip!" → "skip skip". Accept repeats plus skip this/task.
  return /^(?:please )?(?:skip(?:ped)?(?: skip(?:ped)?)*)(?: (?:it|this|that))?(?: (?:(?:the )?(?:task|question|challenge|microtask|micro task|card|one)))?$/.test(
    words
  );
}

/** Wait-gap capture stays `:waiting` until the next listen; the overlay can appear on that same turn. */
function isWaitGapListen(turnContext: string): boolean {
  return turnContext === 'waiting' || turnContext.endsWith(':waiting');
}

function microTaskTurnIsCurrent(
  turnContext: string,
  snapshot: CommandCenterVoiceSnapshot
): boolean {
  if (turnContext === snapshot.conversationContext) return true;
  return Boolean(snapshot.microTask) && isWaitGapListen(turnContext);
}

function matchCommit(words: string): boolean {
  return /^(?:please )?(?:commit(?: (?:the )?(?:decision|answer))?|submit(?: (?:the )?answer)?)$/.test(
    words
  );
}

function matchHear(words: string): boolean {
  return /^(?:please )?(?:hear(?: (?:it|this|(?:the )?(?:task|question|challenge|inject)))?|read aloud|read (?:it|this|(?:the )?(?:task|question|inject)) aloud|repeat (?:the )?(?:task|question))$/.test(
    words
  );
}

function matchSelectTreatment(words: string): SpokenCategory | null {
  const match =
    /^(?:please )?(?:select|choose|pick)(?: the)? (accept|mitigate|transfer|avoid|continue|degrade|pause)(?: treatment| posture| category)?$/.exec(
      words
    );
  if (!match) return null;
  const token = match[1];
  if (token === 'accept' || token === 'continue') return 'ACCEPT';
  if (token === 'mitigate' || token === 'degrade') return 'MITIGATE';
  if (token === 'transfer') return 'TRANSFER';
  return 'AVOID';
}

function matchRankOrder(words: string, options: SpokenOption[]): string[] | null {
  const stripped = words.replace(/^(?:please )?(?:rank|order) /, '');
  const tokens = stripped
    .split(' ')
    .filter((token) => token && token !== 'then' && token !== 'and');
  if (tokens.length !== options.length || tokens.length < 2) return null;
  const ids = tokens.map((token) => {
    if (/^[a-e]$/.test(token)) {
      const option = options[token.charCodeAt(0) - 97];
      return option?.id ?? null;
    }
    const named = spokenMatches(token, options);
    return named.length === 1 ? named[0].id : null;
  });
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return null;
  return ids as string[];
}

function namedIntel(text: string, snapshot: CommandCenterVoiceSnapshot): CommandCenterVoiceIntel[] {
  return spokenMatches(
    text,
    snapshot.intel.map((item) => ({
      id: item.id,
      label: item.title,
      aliases: [item.title.replace(/ anomaly$| note$/i, '')],
    }))
  )
    .map((option) => snapshot.intel.find((item) => item.id === option.id))
    .filter((item): item is CommandCenterVoiceIntel => Boolean(item));
}

function matchDirectTreatment(
  words: string,
  preferPosture: boolean
): { posture: DecisionPosture; category: SpokenCategory } | null {
  if (
    /^(?:please )?(?:accept|continue posture|continue(?: the)? (?:risk|treatment))$/.test(words)
  ) {
    return { posture: 'CONTINUE', category: 'ACCEPT' };
  }
  if (
    preferPosture &&
    /^(?:please )?(?:contin|continued|go ahead|keep going|proceed)$/.test(words)
  ) {
    return { posture: 'CONTINUE', category: 'ACCEPT' };
  }
  if (/^(?:please )?(?:mitigate|degrade(?:d)?(?: posture)?|degree(?: posture)?)$/.test(words)) {
    return { posture: 'DEGRADE', category: 'MITIGATE' };
  }
  if (/^(?:please )?transfer(?: (?:the )?risk)?$/.test(words)) {
    return { posture: 'DEGRADE', category: 'TRANSFER' };
  }
  if (/^(?:please )?(?:avoid|pause posture)$/.test(words)) {
    return { posture: 'PAUSE', category: 'AVOID' };
  }
  if (!preferPosture) return null;
  if (/^(?:please )?continue$/.test(words)) return { posture: 'CONTINUE', category: 'ACCEPT' };
  if (/^(?:please )?(?:pause|paused|paws)$/.test(words))
    return { posture: 'PAUSE', category: 'AVOID' };
  return null;
}

function panelLabel(panel: CommandCenterPanel): string {
  return panel === 'cop' ? 'COP' : panel === 'intel' ? 'Intel feed' : 'Decision panel';
}

export class CommandCenterVoice {
  private dialogue = new SpokenDecisionDialogue();

  clear(): void {
    this.dialogue.clear();
  }

  resolve(
    text: string,
    turnContext: string,
    snapshot: CommandCenterVoiceSnapshot
  ): CommandCenterVoiceResult {
    const words = speechWords(text);
    if (!words) {
      return none(voiceHeardClarify(text));
    }
    if (isHelpSpeech(text)) {
      return none(commandCenterVoiceHelp(snapshot));
    }
    if (isTentativeSpeech(text)) {
      return none('I have not acted on that. State the action you want, or say help.');
    }
    if (snapshot.showDebrief) {
      if (/^(?:close (?:the )?(?:review|debrief)|return to command)$/.test(words)) {
        return { reply: 'Command view open.', action: { type: 'close-review' } };
      }
      if (/^(?:status|update|repeat|what happened|whats happening)$/.test(words)) {
        return none(statusReply(snapshot));
      }
      return none(
        'Debrief is open. Say close review or return to command. Say help or stop listening.'
      );
    }
    if (/^(?:review|show (?:the )?(?:review|debrief))$/.test(words)) {
      return {
        reply: 'Debrief open. Say close review to return to the mission.',
        action: { type: 'open-review' },
      };
    }
    if (/^(?:close (?:the )?(?:review|debrief)|return to command)$/.test(words)) {
      return { reply: 'Command view open.', action: { type: 'close-review' } };
    }
    if (matchStartMission(words)) {
      return {
        reply: snapshot.missionStarted
          ? snapshot.isRunning
            ? 'Mission is already running. Say continue, degrade, or pause when a decision is waiting.'
            : 'Mission running.'
          : 'Mission running. I will read new updates. Say help to hear what you can control.',
        action:
          snapshot.missionStarted && snapshot.isRunning
            ? { type: 'none' }
            : { type: 'start-mission' },
      };
    }
    if (matchSimPause(words)) {
      return {
        reply: snapshot.isRunning
          ? 'Simulation paused. Voice remains available.'
          : 'The clock is already paused. Voice remains available.',
        action: snapshot.isRunning ? { type: 'pause-sim' } : { type: 'none' },
      };
    }
    if (matchSimResume(words)) {
      if (!snapshot.missionStarted) {
        return {
          reply: 'Mission running. I will read new updates. Say help to hear what you can control.',
          action: { type: 'start-mission' },
        };
      }
      return {
        reply: snapshot.isRunning ? 'Simulation is already running.' : 'Simulation resumed.',
        action: snapshot.isRunning ? { type: 'none' } : { type: 'resume-sim' },
      };
    }
    const micro = this.resolveMicroTask(text, words, turnContext, snapshot);
    if (micro) return micro;
    const intelSelect = matchIntelSelect(words);
    if (intelSelect !== null) {
      const result = this.selectIntel(intelSelect, snapshot);
      if (result) return result;
    }
    const titledIntel = namedIntel(text, snapshot).filter(
      (item) => !item.handled && isBareIntelUtterance(words, item)
    );
    if (titledIntel.length === 1) {
      const waiting = unhandledIntel(snapshot);
      const index = waiting.findIndex((item) => item.id === titledIntel[0].id);
      if (index >= 0) {
        const result = this.selectIntel(index, snapshot);
        if (result) return result;
      }
    } else if (titledIntel.length > 1) {
      return none(
        `Which intel? ${titledIntel.map((item, index) => `${index + 1}, ${item.title}`).join('. ')}.`
      );
    }
    const panel = matchPanel(words);
    if (panel) {
      return {
        reply: `${panelLabel(panel)} open.`,
        action: { type: 'set-panel', panel },
      };
    }
    if (
      /^(?:read|repeat|status|update|what happened|whats happening|read(?: the)? intel)$/.test(
        words
      )
    ) {
      return none(statusReply(snapshot));
    }
    if (/^brief (?:the )?owner/.test(words)) {
      return this.briefOwner(text, words, snapshot);
    }

    const preferPosture = Boolean(snapshot.pendingDecision);
    if (snapshot.pendingDecision && turnContext !== snapshot.conversationContext) {
      this.dialogue.clear();
      return none(
        `The situation changed while you were speaking. ${snapshot.pendingDecision.title}. Please restate your command for this update.`
      );
    }

    if (snapshot.pendingDecision) {
      this.dialogue.ensureContext(snapshot.conversationContext);
      if (this.dialogue.isAwaiting()) {
        const enrichment = this.enrichDecision(text, snapshot);
        if (enrichment) return enrichment;
      }
      if (matchSkip(words)) {
        return none('There is no skip on this decision. Say continue, degrade, pause, or commit.');
      }
      if (matchHear(words)) {
        return {
          reply: `${snapshot.pendingDecision.title}. ${snapshot.pendingDecision.content}`,
          action: { type: 'hear-intel' },
        };
      }
      const selectedTreatment = matchSelectTreatment(words);
      if (selectedTreatment) {
        return {
          reply: `${selectedTreatment} selected. Choose a specific action, then residual risk, then say commit.`,
          action: { type: 'select-treatment', category: selectedTreatment },
        };
      }
      if (matchCommit(words)) {
        if (
          snapshot.selectedTreatmentCategory &&
          snapshot.selectedTreatmentOption &&
          snapshot.selectedResidualRisk
        ) {
          this.dialogue.clear();
          return {
            reply: `${snapshot.selectedTreatmentCategory} committed — same as Commit Decision.`,
            action: { type: 'commit-selected' },
          };
        }
        return none(
          'Select a treatment, a specific action, and a residual risk, then say commit. Or say continue, degrade, or pause.'
        );
      }
      if (/^(?:please )?(?:select|choose|pick) /.test(words)) {
        const controls = spokenMatches(text, snapshot.choices.controls);
        if (controls.length === 1) {
          return {
            reply: `Selected ${controls[0].label}.`,
            action: { type: 'select-control', controlId: controls[0].id },
          };
        }
        const risks = spokenMatches(text, snapshot.choices.risks);
        if (risks.length === 1) {
          return {
            reply: `Selected ${risks[0].label}.`,
            action: { type: 'select-risk', riskId: risks[0].id },
          };
        }
      }
      const treatment = matchDirectTreatment(words, preferPosture);
      if (treatment) {
        const assets = namedAsset(text, snapshot);
        if (assets.length > 1) {
          return none(
            `Which asset? ${assets.map((asset, index) => `${index + 1}, ${asset.name}`).join('. ')}.`
          );
        }
        const asset = assets[0] ?? snapshot.selectedAsset;
        if (!asset) {
          return none('Name the affected asset, then say continue, degrade, or pause.');
        }
        this.dialogue.clear();
        return commitAction(treatment.posture, treatment.category, asset, text);
      }
      const ordinal = spokenOrdinalIndex(text);
      if (ordinal !== null && !this.dialogue.isAwaiting()) {
        const choice = PANEL_TREATMENTS[ordinal];
        if (!choice) {
          return none('Say first one through option D for accept, mitigate, transfer, or avoid.');
        }
        const asset = snapshot.selectedAsset;
        if (!asset) {
          return none('Name the affected asset, then say continue, degrade, or pause.');
        }
        this.dialogue.clear();
        return commitAction(choice.posture, choice.category, asset, text);
      }
      const named = namedAsset(text, snapshot);
      if (named.length === 1 && isBareAssetUtterance(words, named[0])) {
        return {
          reply: `Selected ${named[0].name}. Say continue, degrade, or pause.`,
          action: { type: 'select-asset', assetId: named[0].id },
        };
      }
      const enrichment = this.enrichDecision(text, snapshot);
      if (enrichment) return enrichment;
      return unknownReply(text);
    }

    if (/^(?:please )?(?:pause|paused|paws)$/.test(words)) {
      return {
        reply: snapshot.isRunning
          ? 'Simulation paused. Voice remains available.'
          : 'The clock is already paused. Voice remains available.',
        action: snapshot.isRunning ? { type: 'pause-sim' } : { type: 'none' },
      };
    }
    if (/^(?:please )?continue$/.test(words)) {
      if (!snapshot.missionStarted) {
        return {
          reply: 'Mission running. I will read new updates. Say help to hear what you can control.',
          action: { type: 'start-mission' },
        };
      }
      return {
        reply: snapshot.isRunning ? 'Simulation is already running.' : 'Simulation resumed.',
        action: snapshot.isRunning ? { type: 'none' } : { type: 'resume-sim' },
      };
    }
    return unknownReply(text);
  }

  private resolveMicroTask(
    text: string,
    words: string,
    turnContext: string,
    snapshot: CommandCenterVoiceSnapshot
  ): CommandCenterVoiceResult | null {
    const task = snapshot.microTask;
    if (!task) {
      if (matchSkip(words) && !snapshot.pendingDecision) {
        return none('No task is waiting to skip. Say help for commands that work now.');
      }
      return null;
    }
    const intelSelect = matchIntelSelect(words);
    const ranked = matchRankOrder(words, task.options);
    const named = spokenMatches(text, task.options);
    const ordinal = spokenOrdinalIndex(text);
    const dismiss =
      task.answered && /^(?:please )?(?:continue|next|dismiss|done|close)$/.test(words);
    const isCommand =
      matchSkip(words) ||
      matchCommit(words) ||
      matchHear(words) ||
      dismiss ||
      ranked !== null ||
      ordinal !== null ||
      named.length > 0 ||
      intelSelect === 'next' ||
      intelSelect === 'oldest';
    if (!isCommand) return null;
    if (!microTaskTurnIsCurrent(turnContext, snapshot)) {
      return none(
        `The situation changed while you were speaking. ${task.title}. Please restate your command for this update.`
      );
    }
    if (matchSkip(words)) {
      return { reply: 'Task skipped.', action: { type: 'skip-micro-task' } };
    }
    if (matchHear(words)) {
      return {
        reply: `${task.title}. ${task.question}`,
        action: { type: 'hear-micro-task' },
      };
    }
    if (task.answered) {
      if (dismiss || matchCommit(words) || intelSelect === 'next' || intelSelect === 'oldest') {
        return { reply: 'Task closed.', action: { type: 'dismiss-micro-task' } };
      }
      return none('That task is already answered. Say continue or next.');
    }
    if (intelSelect === 'next' || intelSelect === 'oldest') {
      return none('A task is waiting. Say option A through D, submit, or skip.');
    }
    if (matchCommit(words)) {
      if (task.type === 'RANKING') {
        const order = task.rankingOrder.length
          ? task.rankingOrder
          : task.options.map((option) => option.id);
        return {
          reply: 'Answer submitted.',
          action: { type: 'submit-micro-task', answer: order },
        };
      }
      if (!task.selectedOptionId) {
        return none('Select an answer first, then say submit. Or say skip.');
      }
      return {
        reply: 'Answer submitted.',
        action: { type: 'submit-micro-task', answer: task.selectedOptionId },
      };
    }
    if (ranked && task.type === 'RANKING') {
      return {
        reply: 'Answer submitted.',
        action: { type: 'submit-micro-task', answer: ranked },
      };
    }
    let optionId: string | null = null;
    if (ordinal !== null) {
      optionId = task.options[ordinal]?.id ?? null;
      if (!optionId) {
        return none('Say option A through D, or say skip.');
      }
    } else if (named.length === 1) {
      optionId = named[0].id;
    } else if (named.length > 1) {
      return none(
        `Which answer? ${named.map((option, index) => `${index + 1}, ${option.label}`).join('. ')}.`
      );
    }
    if (!optionId) return null;
    if (task.type === 'RANKING') {
      return none('Say the letters in order, such as A D C B, then say submit, or say skip.');
    }
    const label = task.options.find((option) => option.id === optionId)?.label ?? optionId;
    return {
      reply: `Selected ${label}. Say submit or skip.`,
      action: { type: 'select-micro-task-option', optionId },
    };
  }

  private selectIntel(
    select: number | 'next' | 'open' | 'oldest',
    snapshot: CommandCenterVoiceSnapshot
  ): CommandCenterVoiceResult | null {
    const waiting = unhandledIntel(snapshot);
    if (select === 'open') {
      if (waiting.length === 1) {
        if (snapshot.pendingDecision?.id === waiting[0].id) {
          return {
            reply: `${waiting[0].title} is already open. Say continue, degrade, or pause.`,
            action: { type: 'set-panel', panel: 'decision' },
          };
        }
        return {
          reply: `Opened ${waiting[0].title}. Say continue, degrade, or pause.`,
          action: { type: 'select-intel', injectId: waiting[0].id },
        };
      }
      return {
        reply: waiting.length
          ? `Intel feed open. ${waiting.length} unhandled. Say select first intel, next, or respond to oldest.`
          : 'Intel feed open. No unhandled intel.',
        action: { type: 'set-panel', panel: 'intel' },
      };
    }
    if (!waiting.length) {
      return none('No unhandled intel is available. Say status or help.');
    }
    if (select === 'oldest') {
      select = 0;
    }
    if (select === 'next') {
      const current = snapshot.pendingDecision
        ? waiting.findIndex((item) => item.id === snapshot.pendingDecision?.id)
        : -1;
      const next = waiting[current + 1];
      if (!next) {
        return none(
          snapshot.pendingDecision
            ? 'That is the last unhandled intel. Say show intel or help.'
            : 'No further unhandled intel. Say show intel or help.'
        );
      }
      return {
        reply: `Opened ${next.title}. Say continue, degrade, or pause.`,
        action: { type: 'select-intel', injectId: next.id },
      };
    }
    const item = waiting[select];
    if (!item) {
      return none(
        `Which intel? ${waiting.map((entry, index) => `${index + 1}, ${entry.title}`).join('. ')}.`
      );
    }
    if (snapshot.pendingDecision?.id === item.id) {
      return {
        reply: `${item.title} is already open. Say continue, degrade, or pause.`,
        action: { type: 'set-panel', panel: 'decision' },
      };
    }
    return {
      reply: `Opened ${item.title}. Say continue, degrade, or pause.`,
      action: { type: 'select-intel', injectId: item.id },
    };
  }

  private briefOwner(
    text: string,
    words: string,
    snapshot: CommandCenterVoiceSnapshot
  ): CommandCenterVoiceResult {
    const matches = namedAsset(text, snapshot);
    const asset =
      matches.length === 1
        ? matches[0]
        : /^brief (?:the )?owner$/.test(words)
          ? snapshot.selectedAsset
          : null;
    if (!asset) {
      return none('Name the asset whose owner you want to brief.');
    }
    return {
      reply: `Owner briefed for ${asset.name}. Tell me your decision.`,
      action: { type: 'brief-owner', assetId: asset.id },
    };
  }

  private enrichDecision(
    text: string,
    snapshot: CommandCenterVoiceSnapshot
  ): CommandCenterVoiceResult | null {
    if (!snapshot.pendingDecision) return null;
    const answer = this.dialogue.receive(text, snapshot.conversationContext, snapshot.choices);
    if (answer.decision) {
      return {
        reply: answer.reply,
        action: {
          type: 'commit-posture',
          posture: TREATMENT_POSTURE[answer.decision.category],
          decision: answer.decision,
        },
      };
    }
    if (answer.understood) return none(answer.reply);
    return null;
  }
}
