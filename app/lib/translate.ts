// What happens when a sign is recognised — pure, so it is unit-tested apart from React.
import { sentenceText, type Sign, type Token } from './profiles';

export type Effect =
  | { kind: 'say'; text: string; urgent: boolean }
  | { kind: 'scan'; direction: 1 | -1 }
  | { kind: 'select' };

export interface Decision {
  tokens: Token[];
  effects: Effect[];
  /** Start the auto-speak countdown (sentence is still being built). */
  armAutoSpeak: boolean;
}

export function decide(sign: Sign, tokens: Token[]): Decision {
  switch (sign.action) {
    case 'speak': {
      const text = sentenceText(tokens);
      return { tokens: [], effects: text ? [{ kind: 'say', text, urgent: false }] : [], armAutoSpeak: false };
    }
    case 'delete':
      return { tokens: tokens.slice(0, -1), effects: [], armAutoSpeak: false };
    case 'clear':
      return { tokens: [], effects: [], armAutoSpeak: false };
    case 'help':
      return { tokens, effects: [{ kind: 'say', text: sign.output, urgent: true }], armAutoSpeak: false };
    case 'next':
      return { tokens, effects: [{ kind: 'scan', direction: 1 }], armAutoSpeak: false };
    case 'select':
      return { tokens, effects: [{ kind: 'select' }], armAutoSpeak: false };
    case 'say':
      if (sign.instant) return { tokens, effects: [{ kind: 'say', text: sign.output, urgent: sign.urgent }], armAutoSpeak: false };
      return { tokens: [...tokens, { text: sign.output, signId: sign.id }], effects: [], armAutoSpeak: true };
  }
}

/** Learn only from ordinary word signs: control signs vary more and mislearning them is costly. */
export function shouldLearn(sign: Sign, confidence: number, enabled: boolean, minConfidence = 0.55): boolean {
  return enabled && sign.action === 'say' && !sign.urgent && confidence >= minConfidence;
}
