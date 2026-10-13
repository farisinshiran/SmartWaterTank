import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useChatAgent } from '../../logic/hooks/useChatAgent';

export const AiAgentScreen = () => {
  const { messages, isLoading, error, sendMessage } = useChatAgent();
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    sendMessage(inputText);
    setInputText('');
  };

  const renderItem = ({ item }: { item: any }) => {
    const isUser = item.role === 'user';

    // Jangan render system message di UI
    if (item.role === 'system') return null;

    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Water Tank AI</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.chatContainer}
      />

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Tanya soal tangki air..."
          editable={!isLoading}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, (isLoading || !inputText.trim()) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isLoading || !inputText.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Kirim</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA'
  },
  header: {
    padding: 16,
    backgroundColor: '#0288D1',
    alignItems: 'center',
    paddingTop: 50
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 20
  },
  messageBubble: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '85%'
  },
  userBubble: {
    backgroundColor: '#0288D1',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22
  },
  userText: {
    color: '#FFFFFF'
  },
  aiText: {
    color: '#333333'
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    marginVertical: 8,
    fontSize: 13,
    paddingHorizontal: 16
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#0288D1',
    borderRadius: 24,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#90CAF9'
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  },
});
