import { useState } from 'react';
import { Message } from '../../data/api/olagonClient';
import { askWaterTankAgent } from '../agents/waterTankAgent';

export const useChatAgent = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Halo! Saya asisten Smart Water Tank Anda. Ada yang bisa saya bantu hari ini?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Tambahkan pesan user ke state
    const userMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    try {
      // 2. Kirim riwayat percakapan ke Logic Layer (Agent)
      const reply = await askWaterTankAgent(updatedMessages);

      // 3. Tambahkan balasan asisten ke state
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menghubungi AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, error, sendMessage };
};
