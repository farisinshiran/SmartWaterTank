import { Message, sendToOlagon } from '../../data/api/olagonClient';

const SYSTEM_PROMPT = `Anda adalah asisten AI cerdas untuk aplikasi "Smart Water Tank".
Tugas Anda adalah membantu pengguna memantau tangki air, memberikan rekomendasi seputar penggunaan pompa air otomatis, dan menjawab pertanyaan terkait konservasi air.
Jawablah dengan bahasa Indonesia yang sopan, ramah, ringkas, dan mudah dipahami. Jangan memberikan jawaban yang terlalu panjang kecuali diminta.`;

export const askWaterTankAgent = async (chatHistory: Message[]): Promise<string> => {
  // Sisipkan system prompt di awal riwayat percakapan
  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...chatHistory,
  ];

  return await sendToOlagon(messages);
};
