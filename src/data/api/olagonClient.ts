import { ENV } from '../../config/env';

// Utility untuk rate limiting (sesuai dokumen Olagon: sleep 100ms - 500ms antar request)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const sendToOlagon = async (
  messages: Message[],
  model = ENV.DEFAULT_MODEL,
  provider = ENV.DEFAULT_PROVIDER
) => {
  // Proteksi Konkurensi: Tunggu 300ms sebelum mengirim request ke Olagon
  await sleep(300);

  const isAnthropic = provider === 'anthropic';
  const endpoint = isAnthropic
    ? 'https://gateway.olagon.site/anthropic/v1/messages'
    : 'https://gateway.olagon.site/v1/chat/completions';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Konfigurasi Header Berdasarkan Provider
  if (isAnthropic) {
    headers['x-api-key'] = ENV.OLAGON_API_KEY;
  } else {
    headers['Authorization'] = `Bearer ${ENV.OLAGON_API_KEY}`;
  }

  let body: any = {};

  if (isAnthropic) {
    // Format Anthropic: Pisahkan System Prompt dari array messages
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const chatMessages = messages.filter(m => m.role !== 'system');

    body = {
      model,
      max_tokens: 1024,
      messages: chatMessages,
    };
    if (systemMessage) {
      body.system = systemMessage;
    }
  } else {
    // Format OpenAI
    body = {
      model,
      messages,
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (isAnthropic) {
      return data.content[0].text;
    } else {
      return data.choices[0].message.content;
    }
  } catch (error: any) {
    console.error('OlagonClient Error:', error);
    throw new Error(error.message || 'Gagal terhubung ke AI Gateway');
  }
};
