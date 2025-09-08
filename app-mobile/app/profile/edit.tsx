import React, { useState, useEffect } from 'react';
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
import { api } from '../../src/services/api';

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

export default function ProfileEditScreen() {
  const { user, state, dispatch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    country: user?.country || 'US',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    // If changing password, validate password fields
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        Alert.alert('Error', 'Current password is required to change password');
        return false;
      }
      if (formData.newPassword.length < 8) {
        Alert.alert('Error', 'New password must be at least 8 characters long');
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        Alert.alert('Error', 'New passwords do not match');
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updateData: any = {
        email: formData.email.trim().toLowerCase(),
        country: formData.country,
      };

      // Include password change if provided
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      await api.patch(`/users/${user?.id}`, updateData);

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert(
        'Update Failed',
        error.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2"
              disabled={loading}
            >
              <Text className="text-blue-600 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              className="p-2"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Text className="text-blue-600 font-medium">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="p-4 space-y-6">
            {/* Account Information */}
            <View className="bg-white rounded-xl p-4 space-y-4">
              <Text className="text-lg font-semibold text-gray-900">
                Account Information
              </Text>
              
              <View>
                <Text className="text-gray-700 font-medium mb-2">Email</Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  editable={!loading}
                />
              </View>

              <View>
                <Text className="text-gray-700 font-medium mb-2">Country</Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl">
                  <Picker
                    selectedValue={formData.country}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
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
                <Text className="text-gray-700 font-medium mb-2">Role</Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <Text className="text-gray-900 capitalize">
                    {user?.role?.toLowerCase()} {user?.role === 'CREATOR' ? '🎨' : '🏢'}
                  </Text>
                </View>
                <Text className="text-gray-500 text-xs mt-1">
                  Contact support to change your role
                </Text>
              </View>

              <View>
                <Text className="text-gray-700 font-medium mb-2">KYC Status</Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <View className="flex-row items-center">
                    <View className={`w-3 h-3 rounded-full mr-3 ${
                      user?.kycStatus === 'APPROVED' ? 'bg-green-500' :
                      user?.kycStatus === 'PENDING' ? 'bg-yellow-500' :
                      user?.kycStatus === 'REJECTED' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    <Text className="text-gray-900 capitalize">
                      {user?.kycStatus?.toLowerCase().replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Change Password */}
            <View className="bg-white rounded-xl p-4 space-y-4">
              <Text className="text-lg font-semibold text-gray-900">
                Change Password
              </Text>
              <Text className="text-gray-500 text-sm">
                Leave blank to keep your current password
              </Text>

              <View>
                <Text className="text-gray-700 font-medium mb-2">Current Password</Text>
                <View className="relative">
                  <TextInput
                    value={formData.currentPassword}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, currentPassword: text }))}
                    placeholder="Enter current password"
                    secureTextEntry={!showPasswords.current}
                    autoComplete="current-password"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-900"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility('current')}
                    className="absolute right-4 top-3"
                    disabled={loading}
                  >
                    <Text className="text-blue-600 text-sm">
                      {showPasswords.current ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="text-gray-700 font-medium mb-2">New Password</Text>
                <View className="relative">
                  <TextInput
                    value={formData.newPassword}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, newPassword: text }))}
                    placeholder="Enter new password"
                    secureTextEntry={!showPasswords.new}
                    autoComplete="new-password"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-900"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility('new')}
                    className="absolute right-4 top-3"
                    disabled={loading}
                  >
                    <Text className="text-blue-600 text-sm">
                      {showPasswords.new ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-gray-500 text-xs mt-1">
                  Must be at least 8 characters
                </Text>
              </View>

              <View>
                <Text className="text-gray-700 font-medium mb-2">Confirm New Password</Text>
                <View className="relative">
                  <TextInput
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                    placeholder="Confirm new password"
                    secureTextEntry={!showPasswords.confirm}
                    autoComplete="new-password"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-900"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility('confirm')}
                    className="absolute right-4 top-3"
                    disabled={loading}
                  >
                    <Text className="text-blue-600 text-sm">
                      {showPasswords.confirm ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}