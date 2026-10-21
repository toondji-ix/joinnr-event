// Phase-three review candidates. Not approved production tokens; D-12 remains open.
export const proposedTokens = {
  color: {
    canvas: '#f7f6f2',
    surface: '#ffffff',
    text: '#202126',
    muted: '#555862',
    action: '#353c8d',
    positive: '#21634e',
    danger: '#a02936',
    line: '#d8d8d2',
    focus: '#945500',
  },
  spacing: [0, 4, 8, 12, 16, 24, 32, 48, 64],
  radius: { control: 8, surface: 12 },
  target: { web: 44, ios: 44, android: 48 },
  motion: { feedbackMs: 150, reducedMs: 0 },
} as const;
