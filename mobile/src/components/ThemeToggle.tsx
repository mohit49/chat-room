import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { Moon, Sun, Monitor } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS } from '../constants';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const handleThemeSelect = (selectedTheme: 'light' | 'dark' | 'system') => {
    setTheme(selectedTheme);
    setShowModal(false);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} color={COLORS.primary} />;
      case 'dark':
        return <Moon size={20} color={COLORS.primary} />;
      case 'system':
        return <Monitor size={20} color={COLORS.primary} />;
      default:
        return <Sun size={20} color={COLORS.primary} />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowModal(true)}
      >
        {getThemeIcon()}
        <Text style={styles.toggleText}>{getThemeLabel()}</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Choose Theme</Text>
            
            <TouchableOpacity
              style={[styles.option, theme === 'light' && styles.selectedOption]}
              onPress={() => handleThemeSelect('light')}
            >
              <Sun size={20} color={theme === 'light' ? '#fff' : COLORS.text} />
              <Text style={[styles.optionText, theme === 'light' && styles.selectedText]}>
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, theme === 'dark' && styles.selectedOption]}
              onPress={() => handleThemeSelect('dark')}
            >
              <Moon size={20} color={theme === 'dark' ? '#fff' : COLORS.text} />
              <Text style={[styles.optionText, theme === 'dark' && styles.selectedText]}>
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, theme === 'system' && styles.selectedOption]}
              onPress={() => handleThemeSelect('system')}
            >
              <Monitor size={20} color={theme === 'system' ? '#fff' : COLORS.text} />
              <Text style={[styles.optionText, theme === 'system' && styles.selectedText]}>
                System
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectedText: {
    color: '#fff',
  },
});
