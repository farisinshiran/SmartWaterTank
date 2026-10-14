export const ENV = {
  // TODO: Masukkan API Key Olagon Anda di bawah ini
  OLAGON_API_KEY: 'MASUKKAN_API_KEY_ANDA_DI_SINI',

  // Pilih provider default (anthropic untuk model keluarga Claude, openai untuk gpt/gemini/qwen dll)
  DEFAULT_PROVIDER: 'anthropic' as 'anthropic' | 'openai',

  // Pilih model (pastikan sesuai dengan provider)
  // Contoh Claude: 'claude-3-5-sonnet' (provider: anthropic)
  // Contoh GPT: 'gpt-5.5' (provider: openai)
  // Contoh Gemini: 'gemini-2.5-flash' (provider: openai)
  DEFAULT_MODEL: 'claude-3-5-sonnet',
};
