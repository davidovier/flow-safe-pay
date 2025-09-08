import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../src/contexts/AuthContext';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'AU', name: 'Australia' },
  { code: 'OTHER', name: 'Other' },
];

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'CREATOR' | 'BRAND' | 'AGENCY'>('CREATOR');
  const [country, setCountry] = useState('US');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, role, country);
      // Navigation is handled by AuthContext after successful registration
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'An error occurred during registration. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-6 py-8">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="bg-blue-100 rounded-full p-4 mb-4">
                <Text className="text-3xl">🚀</Text>
              </View>
              <Text className="text-gray-900 text-2xl font-bold mb-2">
                Join FlowPay
              </Text>
              <Text className="text-gray-600 text-center">
                Create your account to get started
              </Text>
            </View>

            {/* Role Selection */}
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-3">I am a...</Text>
              <View className="space-y-3">
                {/* First row - Creator and Brand */}
                <View className="flex-row space-x-4">
                  <TouchableOpacity
                    onPress={() => setRole('CREATOR')}
                    className={`flex-1 p-4 rounded-xl border-2 ${
                      role === 'CREATOR'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    disabled={loading}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        role === 'CREATOR' ? 'text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      🎨 Creator
                    </Text>
                    <Text
                      className={`text-center text-sm mt-1 ${
                        role === 'CREATOR' ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      Content creator
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setRole('BRAND')}
                    className={`flex-1 p-4 rounded-xl border-2 ${
                      role === 'BRAND'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    disabled={loading}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        role === 'BRAND' ? 'text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      🏢 Brand
                    </Text>
                    <Text
                      className={`text-center text-sm mt-1 ${
                        role === 'BRAND' ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      Business owner
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Second row - Agency */}
                <TouchableOpacity
                  onPress={() => setRole('AGENCY')}
                  className={`p-4 rounded-xl border-2 ${
                    role === 'AGENCY'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  disabled={loading}
                >
                  <Text
                    className={`text-center font-semibold ${
                      role === 'AGENCY' ? 'text-purple-700' : 'text-gray-700'
                    }`}
                  >
                    🏛️ Agency
                  </Text>
                  <Text
                    className={`text-center text-sm mt-1 ${
                      role === 'AGENCY' ? 'text-purple-600' : 'text-gray-500'
                    }`}
                  >
                    Manage multiple creators
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form */}
            <View className="space-y-4">
              <View>
                <Text className="text-gray-700 font-medium mb-2">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
                  editable={!loading}
                />
              </View>

              <View>
                <Text className="text-gray-700 font-medium mb-2">Country</Text>
                <View className="bg-white border border-gray-200 rounded-xl">
                  <Picker
                    selectedValue={country}
                    onValueChange={setCountry}
                    enabled={!loading}
                  >
                    {COUNTRIES.map((c) => (
                      <Picker.Item
                        key={c.code}
                        label={c.name}
                        value={c.code}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View>
                <Text className="text-gray-700 font-medium mb-2">Password</Text>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    className="bg-white border border-gray-200 rounded-xl px-4 py-4 pr-12 text-gray-900"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4"
                    disabled={loading}
                  >
                    <Text className="text-blue-600 text-sm">
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-gray-500 text-xs mt-1">
                  Must be at least 8 characters
                </Text>
              </View>

              <View>
                <Text className="text-gray-700 font-medium mb-2">
                  Confirm Password
                </Text>
                <View className="relative">
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    className="bg-white border border-gray-200 rounded-xl px-4 py-4 pr-12 text-gray-900"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-4"
                    disabled={loading}
                  >
                    <Text className="text-blue-600 text-sm">
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className={`mt-6 py-4 px-6 rounded-xl ${
                loading ? 'bg-gray-300' : 'bg-blue-600'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <Text className="text-gray-500 text-xs text-center mt-4 leading-relaxed">
              By creating an account, you agree to our{' '}
              <Text className="text-blue-600">Terms of Service</Text> and{' '}
              <Text className="text-blue-600">Privacy Policy</Text>
            </Text>

            {/* Footer */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-gray-600">Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/login')}
                disabled={loading}
              >
                <Text className="text-blue-600 font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Back to Welcome */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-4 py-2"
              disabled={loading}
            >
              <Text className="text-gray-500 text-center">
                Back to Welcome
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}