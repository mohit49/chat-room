import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiService } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants';
import { isProfileComplete } from '../utils/profile';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  
  const { login } = useAuth();

  const handleSendOTP = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.sendOTP(mobileNumber);
      if (response.success) {
        setStep('otp');
        if (response.mockOTP) {
          setMockOtp(response.mockOTP);
          Alert.alert(
            'Demo Mode', 
            `Your OTP is: ${response.mockOTP}\n\nThis OTP expires in 5 minutes.\n\nNote: This is a dummy OTP for local development.`,
            [{ text: 'OK', style: 'default' }]
          );
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter OTP');
      return;
    }

    setLoading(true);
    const success = await login(mobileNumber, otp);
    setLoading(false);

    if (success) {
      // The navigation will be handled by AppNavigator based on profile completion
      // No need to navigate here as useAuth will update the user state
    } else {
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          {step === 'mobile'
            ? 'Enter your mobile number to continue'
            : 'Enter the OTP sent to your mobile'}
        </Text>

        {step === 'mobile' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              autoFocus
            />
            {mockOtp && (
              <View style={styles.mockOtpContainer}>
                <Text style={styles.mockOtpLabel}>Generated OTP</Text>
                <Text style={styles.mockOtpText}>OTP: {mockOtp}</Text>
                <Text style={styles.mockOtpExpiry}>Expires in 5 minutes</Text>
                <Text style={styles.mockOtpNote}>This is a dummy OTP for local development</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    // Copy to clipboard functionality would go here
                    Alert.alert('OTP Copied', `OTP ${mockOtp} copied to clipboard`);
                  }}
                >
                  <Text style={styles.copyButtonText}>Copy OTP</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.otpContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              {mockOtp && (
                <TouchableOpacity
                  style={styles.fillButton}
                  onPress={() => setOtp(mockOtp)}
                >
                  <Text style={styles.fillButtonText}>Fill</Text>
                </TouchableOpacity>
              )}
            </View>
            {mockOtp && (
              <View style={styles.mockOtpContainer}>
                <Text style={styles.mockOtpLabel}>Demo Mode - Dummy OTP</Text>
                <Text style={styles.mockOtpText}>OTP: {mockOtp}</Text>
                <Text style={styles.mockOtpExpiry}>Expires in 5 minutes</Text>
                <Text style={styles.mockOtpNote}>This is a dummy OTP for local development</Text>
              </View>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setStep('mobile');
                  setOtp('');
                }}
              >
                <Text style={styles.buttonTextSecondary}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Login</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  otpContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  fillButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fillButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mockOtpContainer: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  mockOtpLabel: {
    color: '#0369a1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  mockOtpText: {
    color: '#0369a1',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  mockOtpExpiry: {
    color: '#0284c7',
    fontSize: 12,
  },
  mockOtpNote: {
    color: '#64748b',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  copyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPrimary: {
    flex: 1,
    marginLeft: 8,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
});


