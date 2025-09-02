import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../src/contexts/AuthContext';
import { apiClient } from '../../../src/services/api';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { NavigationHelper } from '../../../src/navigation/NavigationHelper';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  state: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED';
  due_at: string | null;
  deal: {
    id: string;
    state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
    projects: {
      title: string;
      users: {
        first_name: string | null;
        last_name: string | null;
        email: string;
      };
    };
  };
}

export default function SubmitMilestoneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [submissionType, setSubmissionType] = useState<'file' | 'url' | 'text'>('file');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchMilestone();
    }
  }, [id]);

  const fetchMilestone = async () => {
    try {
      const response = await apiClient.get(`/milestones/${id}`);
      const milestoneData = response.data;
      
      // Check permissions
      if (milestoneData.deal.users?.email !== userProfile?.email) {
        Alert.alert(
          'Access Denied',
          'You can only submit deliverables for your own milestones.',
          [{ text: 'OK', onPress: () => NavigationHelper.goBack() }]
        );
        return;
      }

      if (milestoneData.state !== 'PENDING') {
        Alert.alert(
          'Cannot Submit',
          `This milestone is ${milestoneData.state.toLowerCase()} and cannot be submitted to.`,
          [{ text: 'OK', onPress: () => NavigationHelper.goBack() }]
        );
        return;
      }

      if (milestoneData.deal.state !== 'FUNDED') {
        Alert.alert(
          'Cannot Submit',
          'This deal must be funded before you can submit deliverables.',
          [{ text: 'OK', onPress: () => NavigationHelper.goBack() }]
        );
        return;
      }

      setMilestone(milestoneData);
    } catch (error: any) {
      console.error('Error fetching milestone:', error);
      Alert.alert(
        'Error',
        'Failed to load milestone details.',
        [{ text: 'OK', onPress: () => NavigationHelper.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelection = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setSubmissionType('file');
      }
    } catch (error) {
      console.error('File selection error:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const handleImageSelection = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: `image_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
          type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          size: asset.fileSize,
        });
        setSubmissionType('file');
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please provide a description of your deliverable.');
      return;
    }

    if (submissionType === 'url' && !url.trim()) {
      Alert.alert('Missing URL', 'Please provide a valid URL for your deliverable.');
      return;
    }

    if (submissionType === 'file' && !selectedFile) {
      Alert.alert('Missing File', 'Please select a file to upload.');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('submissionType', submissionType);

      if (submissionType === 'url') {
        formData.append('url', url.trim());
      } else if (submissionType === 'file' && selectedFile) {
        formData.append('file', {
          uri: selectedFile.uri,
          type: selectedFile.type || 'application/octet-stream',
          name: selectedFile.name || `file_${Date.now()}`,
        } as any);
        
        if (selectedFile.size) {
          formData.append('fileSize', selectedFile.size.toString());
        }
      }

      const response = await apiClient.post(`/milestones/${id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      });

      Alert.alert(
        'Success! 🎉',
        'Your deliverable has been submitted successfully. The brand will be notified for review.',
        [
          {
            text: 'OK',
            onPress: () => NavigationHelper.navigateToMilestone(id!, { replace: true })
          }
        ]
      );

    } catch (error: any) {
      console.error('Submission error:', error);
      const message = error.response?.data?.message || 'Failed to submit deliverable. Please try again.';
      Alert.alert('Submission Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getBrandName = (milestone: Milestone) => {
    const brand = milestone.deal.projects.users;
    return `${brand.first_name || ''} ${brand.last_name || ''}`.trim() || brand.email;
  };

  const isOverdue = () => {
    if (!milestone?.due_at) return false;
    return new Date(milestone.due_at) < new Date();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!milestone) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Milestone Not Found</Text>
          <Text style={styles.errorText}>The requested milestone could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Submit Deliverable</Text>
          <Text style={styles.subtitle}>{milestone.title}</Text>
        </View>

        {/* Milestone Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestone Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Project</Text>
              <Text style={styles.infoValue}>{milestone.deal.projects.title}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Brand</Text>
              <Text style={styles.infoValue}>{getBrandName(milestone)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount</Text>
              <Text style={[styles.infoValue, { color: '#059669', fontWeight: '700' }]}>
                {formatAmount(milestone.amount, milestone.currency)}
              </Text>
            </View>
            {milestone.due_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={[
                  styles.infoValue, 
                  isOverdue() && { color: '#ef4444' }
                ]}>
                  {formatDate(milestone.due_at)}
                  {isOverdue() && ' (Overdue)'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Submission Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submission Type</Text>
          <View style={styles.typeSelector}>
            {[
              { value: 'file', label: 'Upload File', icon: 'document-outline' },
              { value: 'url', label: 'External URL', icon: 'link-outline' },
              { value: 'text', label: 'Text Only', icon: 'text-outline' },
            ].map((type) => (
              <View
                key={type.value}
                style={[
                  styles.typeOption,
                  submissionType === type.value && styles.typeOptionSelected
                ]}
                onTouchEnd={() => setSubmissionType(type.value as any)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={20} 
                  color={submissionType === type.value ? '#007AFF' : '#6b7280'} 
                />
                <Text style={[
                  styles.typeLabel,
                  submissionType === type.value && styles.typeLabelSelected
                ]}>
                  {type.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* File Selection */}
        {submissionType === 'file' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select File</Text>
            
            <View style={styles.fileSelectionButtons}>
              <View style={styles.fileButton} onTouchEnd={handleFileSelection}>
                <Ionicons name="document-outline" size={24} color="#007AFF" />
                <Text style={styles.fileButtonText}>Choose Document</Text>
              </View>
              
              <View style={styles.fileButton} onTouchEnd={handleImageSelection}>
                <Ionicons name="image-outline" size={24} color="#007AFF" />
                <Text style={styles.fileButtonText}>Choose Image/Video</Text>
              </View>
            </View>

            {selectedFile && (
              <View style={styles.selectedFile}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                {selectedFile.size && (
                  <Text style={styles.selectedFileSize}>
                    ({Math.round(selectedFile.size / 1024)} KB)
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* URL Input */}
        {submissionType === 'url' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deliverable URL</Text>
            <TextInput
              style={styles.urlInput}
              placeholder="https://example.com/my-content"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="done"
            />
            <Text style={styles.inputHint}>
              Provide a link to your social media post, website, or other deliverable content.
            </Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description *</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe your deliverable, what you've created, and any relevant details..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.inputHint}>
            Provide details about your work, any specifications met, and additional context for the brand.
          </Text>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <View
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onTouchEnd={submitting ? undefined : handleSubmit}
          >
            {submitting ? (
              <>
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Submit Deliverable</Text>
              </>
            )}
          </View>
          
          <Text style={styles.submitNote}>
            Once submitted, the brand will review your deliverable and either approve it for payment or request revisions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  typeSelector: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  typeOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f9ff',
  },
  typeLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 12,
    fontWeight: '500',
  },
  typeLabelSelected: {
    color: '#007AFF',
  },
  fileSelectionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  fileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    backgroundColor: '#f0f9ff',
  },
  fileButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  selectedFileName: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
  },
  selectedFileSize: {
    fontSize: 12,
    color: '#6b7280',
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    minHeight: 100,
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 16,
  },
  submitSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  submitNote: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});