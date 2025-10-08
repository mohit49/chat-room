import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import * as avataaars from '@dicebear/avataaars';
import * as bottts from '@dicebear/bottts';
import * as funEmoji from '@dicebear/fun-emoji';
import * as lorelei from '@dicebear/lorelei';
import * as micah from '@dicebear/micah';
import * as openPeeps from '@dicebear/open-peeps';
import * as personas from '@dicebear/personas';
import * as pixelArt from '@dicebear/pixel-art';
import * as shapes from '@dicebear/shapes';
import { COLORS } from '../constants';

interface AvatarUploaderProps {
  currentImage?: string;
  avatarStyle?: string;
  avatarSeed?: string;
  username: string;
  onImageChange: (imageData: string, type: 'upload' | 'avatar', style?: string, seed?: string) => void;
}

const avatarStyles = [
  { name: 'Adventurer', style: adventurer, description: 'Cartoon' },
  { name: 'Avataaars', style: avataaars, description: 'Customizable' },
  { name: 'Bottts', style: bottts, description: 'Robots' },
  { name: 'Fun Emoji', style: funEmoji, description: 'Emojis' },
  { name: 'Lorelei', style: lorelei, description: 'Illustrated' },
  { name: 'Micah', style: micah, description: 'Minimalist' },
  { name: 'Open Peeps', style: openPeeps, description: 'Hand-drawn' },
  { name: 'Personas', style: personas, description: 'Abstract' },
  { name: 'Pixel Art', style: pixelArt, description: '8-bit' },
  { name: 'Shapes', style: shapes, description: 'Geometric' },
];

const avatarStylesMap: any = {
  'Adventurer': adventurer,
  'Avataaars': avataaars,
  'Bottts': bottts,
  'Fun Emoji': funEmoji,
  'Lorelei': lorelei,
  'Micah': micah,
  'Open Peeps': openPeeps,
  'Personas': personas,
  'Pixel Art': pixelArt,
  'Shapes': shapes,
};

export default function AvatarUploader({
  currentImage,
  avatarStyle,
  avatarSeed,
  username,
  onImageChange,
}: AvatarUploaderProps) {
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const getCurrentAvatar = () => {
    if (currentImage) {
      return currentImage;
    }
    if (avatarStyle && avatarSeed) {
      const styleModule = avatarStylesMap[avatarStyle];
      if (styleModule) {
        const avatar = createAvatar(styleModule, {
          seed: avatarSeed,
          size: 300,
        });
        return avatar.toDataUri();
      }
    }
    // Default avatar
    const defaultAvatar = createAvatar(adventurer, {
      seed: username || 'default',
      size: 300,
    });
    return defaultAvatar.toDataUri();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageChange(result.assets[0].uri, 'upload');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageChange(result.assets[0].uri, 'upload');
    }
  };

  const showImageOptions = () => {
    Alert.alert('Upload Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAvatarSelect = (styleName: string) => {
    const styleModule = avatarStylesMap[styleName];
    if (styleModule) {
      const avatar = createAvatar(styleModule, {
        seed: username || 'default',
        size: 300,
      });
      const avatarDataUri = avatar.toDataUri();
      onImageChange(avatarDataUri, 'avatar', styleName, username || 'default');
    }
    setShowAvatarSelector(false);
  };

  const generateAvatar = (styleName: string, styleModule: any) => {
    const avatar = createAvatar(styleModule, {
      seed: username || 'default',
      size: 100,
    });
    return avatar.toDataUri();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={showImageOptions} activeOpacity={0.8}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: getCurrentAvatar() }} style={styles.avatar} />
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraText}>📷</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={showImageOptions}>
          <Text style={styles.buttonText}>📷 Upload Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => setShowAvatarSelector(true)}
        >
          <Text style={styles.buttonTextSecondary}>✨ Choose Avatar</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Selector Modal */}
      <Modal
        visible={showAvatarSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAvatarSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar Style</Text>
              <TouchableOpacity onPress={() => setShowAvatarSelector(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.avatarGrid}>
              <View style={styles.gridContainer}>
                {avatarStyles.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.name}
                    style={styles.avatarOption}
                    onPress={() => handleAvatarSelect(avatar.name)}
                  >
                    <Image
                      source={{ uri: generateAvatar(avatar.name, avatar.style) }}
                      style={styles.avatarPreview}
                    />
                    <Text style={styles.avatarName}>{avatar.name}</Text>
                    <Text style={styles.avatarDescription}>{avatar.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAvatarSelector(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    alignItems: 'center',
  },
  cameraText: {
    fontSize: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  avatarGrid: {
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarOption: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  avatarName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  avatarDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cancelButton: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});


