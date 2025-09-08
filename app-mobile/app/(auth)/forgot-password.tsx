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
} from 'react-native';
import { router } from 'expo-router';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      // TODO: Implement password reset API call
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center px-6">
          {/* Success State */}
          <View className="items-center">
            <View className="bg-green-100 rounded-full p-6 mb-6">
              <Text className="text-4xl">📧</Text>
            </View>
            <Text className="text-gray-900 text-2xl font-bold text-center mb-4">
              Check Your Email
            </Text>
            <Text className="text-gray-600 text-center mb-8 leading-relaxed">
              We've sent a password reset link to{'\n'}
              <Text className="font-semibold">{email}</Text>
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/login')}
              className="bg-blue-600 py-4 px-6 rounded-xl w-full"
            >
              <Text className="text-white text-center font-semibold text-lg">
                Back to Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEmailSent(false)}
              className="mt-4 py-2"
            >
              <Text className="text-blue-600 text-center">
                Try a different email
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="bg-orange-100 rounded-full p-4 mb-4">
              <Text className="text-3xl">🔒</Text>
            </View>
            <Text className="text-gray-900 text-2xl font-bold mb-2">
              Forgot Password?
            </Text>
            <Text className="text-gray-600 text-center leading-relaxed">
              No worries! Enter your email and we'll send you a link to reset your password.
            </Text>
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
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={loading}
            className={`mt-6 py-4 px-6 rounded-xl ${
              loading ? 'bg-gray-300' : 'bg-blue-600'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Send Reset Link
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-gray-600">Remember your password? </Text>
            <TouchableOpacity
              onPress={() => router.push('/login')}
              disabled={loading}
            >
              <Text className="text-blue-600 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 py-2"
            disabled={loading}
          >
            <Text className="text-gray-500 text-center">
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}