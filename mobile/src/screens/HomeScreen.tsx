import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import { COLORS, getThemeColors } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { MapPin, Calendar, User, Settings, Edit3, ChevronDown, Users, UserPlus } from 'lucide-react-native';
import ProfileDropdown from '../components/ProfileDropdown';
import ThemeToggle from '../components/ThemeToggle';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { actualTheme } = useTheme();
  const [showDropdown, setShowDropdown] = React.useState(false);
  
  const colors = getThemeColors(actualTheme === 'dark');

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const handleCreateRoom = () => {
    Alert.alert('Info', 'Create Room functionality will be implemented soon.');
  };

  const handleJoinRoom = () => {
    Alert.alert('Info', 'Join Room functionality will be implemented soon.');
  };

  const getAvatarDisplay = () => {
    if (user?.profile.profilePicture?.type === 'upload' && user.profile.profilePicture.url) {
      return { type: 'image', source: { uri: user.profile.profilePicture.url } };
    } else if (user?.profile.profilePicture?.type === 'avatar') {
      const avatarUrl = `https://api.dicebear.com/7.x/${user.profile.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${user.profile.profilePicture.seed || user?.mobileNumber}`;
      return { type: 'image', source: { uri: avatarUrl } };
    }
    return { type: 'emoji', emoji: '🎭' };
  };

  const avatarDisplay = getAvatarDisplay();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Welcome Home!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your profile is complete and ready to go.</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Navigation Menu */}
          <View style={styles.navMenu}>
            <TouchableOpacity 
              style={[styles.navButton, { borderColor: colors.primary }]}
              onPress={handleCreateRoom}
            >
              <Users size={16} color={colors.primary} />
              <Text style={[styles.navButtonText, { color: colors.primary }]}>Create Room</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.navButton, { borderColor: colors.primary }]}
              onPress={handleJoinRoom}
            >
              <UserPlus size={16} color={colors.primary} />
              <Text style={[styles.navButtonText, { color: colors.primary }]}>Join Room</Text>
            </TouchableOpacity>
            <ThemeToggle />
          </View>
          {/* Profile Button */}
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setShowDropdown(true)}
          >
            <View style={styles.headerAvatar}>
              {avatarDisplay.type === 'image' ? (
                <Image 
                  source={avatarDisplay.source} 
                  style={styles.headerAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.headerAvatarImage}>
                  <Text style={styles.headerAvatarEmoji}>{avatarDisplay.emoji}</Text>
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.headerUsername, { color: colors.text }]}>@{user?.username}</Text>
              <Text style={[styles.headerMobileNumber, { color: colors.textSecondary }]}>{user?.mobileNumber}</Text>
            </View>
            <ChevronDown size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Summary Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Profile Summary</Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>Your complete profile information</Text>
        
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {avatarDisplay.type === 'image' ? (
              <Image 
                source={avatarDisplay.source} 
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarImage}>
                <Text style={styles.avatarEmoji}>{avatarDisplay.emoji}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>@{user?.username}</Text>
              </View>
              <View style={[styles.badge, styles.badgeSecondary, { backgroundColor: colors.surface }]}>
                <Text style={[styles.badgeTextSecondary, { color: colors.textSecondary }]}>{user?.profile.gender}</Text>
              </View>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Calendar size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>Age: {user?.profile.age} years</Text>
              </View>
              
              {user?.profile.location.address && (
                <View style={[styles.infoItem, styles.infoItemFull]}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>{user.profile.location.address}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Action Cards */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.actionIcon}>
            <Edit3 size={24} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Edit Profile</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>Update your personal information</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.actionIcon}>
            <MapPin size={24} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Update Location</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>Share your current location</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.actionIcon}>
            <Settings size={24} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Settings</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>Manage your account settings</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Welcome Message */}
      <View style={[styles.welcomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>🎉 Congratulations!</Text>
        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
          Your profile is complete and you're all set to use our platform. 
          You can now access all features and connect with others.
        </Text>
      </View>

      {/* Profile Dropdown Modal */}
      {user && (
        <ProfileDropdown
          user={user}
          navigation={navigation as any}
          onLogout={handleLogout}
          visible={showDropdown}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navMenu: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
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
  navButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 4,
    borderRadius: 20,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  headerMobileNumber: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  headerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarEmoji: {
    fontSize: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextSecondary: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  infoGrid: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoItemFull: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  welcomeCard: {
    backgroundColor: '#f0f9ff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
