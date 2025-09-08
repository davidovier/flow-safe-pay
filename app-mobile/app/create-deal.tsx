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
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/services/api';

interface Project {
  id: string;
  title: string;
  description: string;
}

interface Milestone {
  title: string;
  description: string;
  amount: string;
  dueDate: string;
}

export default function CreateDealScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    projectId: '',
    creatorEmail: '',
    title: '',
    description: '',
    totalAmount: '',
    currency: 'usd',
  });
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: '', description: '', amount: '', dueDate: '' }
  ]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: '', dueDate: '' }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = milestones.map((milestone, i) => 
      i === index ? { ...milestone, [field]: value } : milestone
    );
    setMilestones(updated);
  };

  const validateForm = () => {
    if (!formData.projectId) {
      Alert.alert('Error', 'Please select a project');
      return false;
    }
    if (!formData.creatorEmail.trim()) {
      Alert.alert('Error', 'Please enter creator email');
      return false;
    }
    if (!formData.creatorEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a deal title');
      return false;
    }

    // Validate milestones
    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];
      if (!milestone.title.trim()) {
        Alert.alert('Error', `Please enter title for milestone ${i + 1}`);
        return false;
      }
      if (!milestone.amount.trim()) {
        Alert.alert('Error', `Please enter amount for milestone ${i + 1}`);
        return false;
      }
      if (isNaN(Number(milestone.amount)) || Number(milestone.amount) <= 0) {
        Alert.alert('Error', `Please enter a valid amount for milestone ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleCreateDeal = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const dealData = {
        projectId: formData.projectId,
        creatorEmail: formData.creatorEmail.trim().toLowerCase(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        currency: formData.currency,
        milestones: milestones.map(milestone => ({
          title: milestone.title.trim(),
          description: milestone.description.trim(),
          amount: Math.round(Number(milestone.amount) * 100), // Convert to cents
          dueAt: milestone.dueDate ? new Date(milestone.dueDate).toISOString() : undefined,
        })),
      };

      const response = await api.post('/deals', dealData);
      
      Alert.alert(
        'Success',
        'Deal created successfully! The creator will be notified.',
        [{ text: 'OK', onPress: () => router.replace('/deals') }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create deal. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'BRAND') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-2xl">🚫</Text>
          <Text className="text-xl font-semibold text-gray-900 mt-4 text-center">
            Access Denied
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            Only brands can create deals
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-600 py-3 px-6 rounded-xl mt-6"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
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
            <Text className="text-lg font-semibold">Create Deal</Text>
            <TouchableOpacity
              onPress={handleCreateDeal}
              disabled={loading || loadingProjects}
              className="p-2"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Text className="text-blue-600 font-medium">Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="p-4 space-y-6">
            {/* Deal Information */}
            <View className="bg-white rounded-xl p-4 space-y-4">
              <Text className="text-lg font-semibold text-gray-900">
                Deal Information
              </Text>

              <View>
                <Text className="text-gray-700 font-medium mb-2">Project</Text>
                {loadingProjects ? (
                  <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <ActivityIndicator size="small" color="#6b7280" />
                  </View>
                ) : (
                  <View className="bg-gray-50 border border-gray-200 rounded-xl">
                    {projects.length > 0 ? (
                      <View className="px-4 py-2">
                        {projects.map(project => (
                          <TouchableOpacity
                            key={project.id}
                            onPress={() => setFormData(prev => ({ ...prev, projectId: project.id }))}
                            className={`py-3 border-b border-gray-100 last:border-b-0 ${
                              formData.projectId === project.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <View className="flex-row items-center">
                              <View className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                formData.projectId === project.id 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-gray-300'
                              }`} />
                              <View className="flex-1">
                                <Text className="font-medium text-gray-900">{project.title}</Text>
                                {project.description && (
                                  <Text className="text-gray-500 text-sm">{project.description}</Text>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <View className="px-4 py-3">
                        <Text className="text-gray-500">No projects found</Text>
                        <Text className="text-gray-400 text-sm mt-1">
                          Create a project first to organize your deals
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View>
                <Text className="text-gray-700 font-medium mb-2">Creator Email</Text>
                <TextInput
                  value={formData.creatorEmail}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, creatorEmail: text }))}
                  placeholder="creator@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  editable={!loading}
                />
              </View>

              <View>
                <Text className="text-gray-700 font-medium mb-2">Deal Title</Text>
                <TextInput
                  value={formData.title}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                  placeholder="Instagram post collaboration"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  editable={!loading}
                />
              </View>

              <View>
                <Text className="text-gray-700 font-medium mb-2">Description</Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Describe the work to be done..."
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Milestones */}
            <View className="bg-white rounded-xl p-4 space-y-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-gray-900">
                  Milestones
                </Text>
                <TouchableOpacity
                  onPress={addMilestone}
                  className="bg-blue-600 py-2 px-4 rounded-lg"
                  disabled={loading}
                >
                  <Text className="text-white font-medium">Add</Text>
                </TouchableOpacity>
              </View>

              {milestones.map((milestone, index) => (
                <View key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-medium text-gray-900">
                      Milestone {index + 1}
                    </Text>
                    {milestones.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeMilestone(index)}
                        className="p-1"
                        disabled={loading}
                      >
                        <Text className="text-red-600 text-sm">Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TextInput
                    value={milestone.title}
                    onChangeText={(text) => updateMilestone(index, 'title', text)}
                    placeholder="Milestone title"
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                    editable={!loading}
                  />

                  <TextInput
                    value={milestone.description}
                    onChangeText={(text) => updateMilestone(index, 'description', text)}
                    placeholder="Milestone description"
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                    editable={!loading}
                  />

                  <View className="flex-row space-x-3">
                    <View className="flex-1">
                      <Text className="text-gray-600 text-sm mb-1">Amount (USD)</Text>
                      <TextInput
                        value={milestone.amount}
                        onChangeText={(text) => updateMilestone(index, 'amount', text)}
                        placeholder="500"
                        keyboardType="numeric"
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                        editable={!loading}
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-gray-600 text-sm mb-1">Due Date (optional)</Text>
                      <TextInput
                        value={milestone.dueDate}
                        onChangeText={(text) => updateMilestone(index, 'dueDate', text)}
                        placeholder="2024-12-31"
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                        editable={!loading}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}