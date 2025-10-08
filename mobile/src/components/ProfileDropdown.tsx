import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { User } from '../types';
import { COLORS } from '../constants';
import { Edit3, Settings, Trash2, LogOut, X } from 'lucide-react-native';

interface Props {
  user: User;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onLogout: () => void;
  visible: boolean;
  onClose: () => void;
}

export default function ProfileDropdown({ 
  user, 
  navigation, 
  onLogout, 
  visible, 
  onClose 
}: Props) {
  const handleEditProfile = () => {
    onClose();
    navigation.navigate('Profile');
  };

  const handleSettings = () => {
    onClose();
    navigation.navigate('Profile');
  };

  const handleDeleteAccount = () => {
    onClose();
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete account functionality
            Alert.alert('Info', 'Delete account functionality will be implemented soon.');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.dropdown}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Text style={styles.username}>@{user.username}</Text>
              <Text style={styles.mobileNumber}>{user.mobileNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <Edit3 size={20} color={COLORS.text} />
            <Text style={styles.menuText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <Settings size={20} color={COLORS.text} />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <Trash2 size={20} color={COLORS.error} />
            <Text style={[styles.menuText, styles.dangerText]}>Delete Account</Text>
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <LogOut size={20} color={COLORS.text} />
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for home indicator
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  mobileNumber: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  closeButton: {
    padding: 4,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  dangerText: {
    color: COLORS.error,
  },
});
