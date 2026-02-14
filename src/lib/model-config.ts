export const MODEL_KEYS = ['deepseek', 'grok', 'gpt_5_2', 'gemini', 'opus_4_6'] as const;

export type ModelKey = (typeof MODEL_KEYS)[number];

export type ModelConfig = {
  key: ModelKey;
  label: string;
  provider: 'deepseek' | 'openrouter';
  modelId: string;
  inviteRequired: boolean;
};

const modelConfigList: ModelConfig[] = [
  {
    key: 'deepseek',
    label: 'DeepSeek',
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    inviteRequired: false,
  },
  {
    key: 'grok',
    label: 'Grok',
    provider: 'openrouter',
    modelId: 'x-ai/grok-4',
    inviteRequired: true,
  },
  {
    key: 'gpt_5_2',
    label: 'GPT 5.2',
    provider: 'openrouter',
    modelId: 'openai/gpt-5.2',
    inviteRequired: true,
  },
  {
    key: 'gemini',
    label: 'Gemini',
    provider: 'openrouter',
    modelId: 'google/gemini-2.5-pro',
    inviteRequired: true,
  },
  {
    key: 'opus_4_6',
    label: 'Opus 4.6',
    provider: 'openrouter',
    modelId: 'anthropic/claude-opus-4.6',
    inviteRequired: true,
  },
];

export const MODEL_CONFIG_MAP = Object.fromEntries(
  modelConfigList.map((item) => [item.key, item])
) as Record<ModelKey, ModelConfig>;

export function isModelKey(value: string): value is ModelKey {
  return MODEL_KEYS.includes(value as ModelKey);
}

export function getModelConfig(modelKey: ModelKey): ModelConfig {
  return MODEL_CONFIG_MAP[modelKey];
}

export function isInviteRequired(modelKey: ModelKey): boolean {
  return MODEL_CONFIG_MAP[modelKey].inviteRequired;
}

export const MODEL_OPTIONS_FOR_UI = modelConfigList.map((item) => ({
  key: item.key,
  label: item.label,
  inviteRequired: item.inviteRequired,
}));
