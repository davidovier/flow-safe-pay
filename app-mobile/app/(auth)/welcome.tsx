import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  Dimensions 
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        className="flex-1"
      >
        <View className="flex-1 justify-between px-6 py-8">
          {/* Header */}
          <View className="items-center mt-16">
            <View className="bg-white/20 rounded-full p-4 mb-6">
              <Text className="text-4xl">💰</Text>
            </View>
            <Text className="text-white text-3xl font-bold text-center mb-4">
              Welcome to FlowPay
            </Text>
            <Text className="text-white/80 text-lg text-center leading-relaxed">
              Secure escrow payments for creators and brands
            </Text>
          </View>

          {/* Features */}
          <View className="space-y-6">
            <View className="flex-row items-center">
              <View className="bg-white/20 rounded-full p-3 mr-4">
                <Text className="text-xl">🔒</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">Secure Escrow</Text>
                <Text className="text-white/80">Funds held safely until work is approved</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="bg-white/20 rounded-full p-3 mr-4">
                <Text className="text-xl">⚡</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">Fast Payments</Text>
                <Text className="text-white/80">Automatic release when milestones are met</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="bg-white/20 rounded-full p-3 mr-4">
                <Text className="text-xl">🤝</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">Trust & Safety</Text>
                <Text className="text-white/80">Built-in dispute resolution system</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="space-y-4">
            <TouchableOpacity
              onPress={() => router.push('/register')}
              className="bg-white rounded-xl py-4 px-6 shadow-lg"
            >
              <Text className="text-center text-gray-900 font-semibold text-lg">
                Get Started
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/login')}
              className="border border-white/30 rounded-xl py-4 px-6"
            >
              <Text className="text-center text-white font-medium text-lg">
                Sign In
              </Text>
            </TouchableOpacity>

            <View className="items-center pt-4">
              <Text className="text-white/60 text-sm">
                Trusted by creators and brands worldwide
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}