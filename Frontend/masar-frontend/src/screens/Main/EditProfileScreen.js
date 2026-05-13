import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import UserController from '../../controllers/UserController';
import AuthController from '../../controllers/AuthController';
import { showSuccess, showError, showInfo } from '../../utils/ToastHelper'; 

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male',   icon: 'man',    color: '#1565C0', bg: '#E8EAF6' },
  { value: 'female', label: 'Female', icon: 'woman',  color: '#AD1457', bg: '#FCE4EC' },
];

const EditProfileScreen = ({ navigation, route }) => {
  const { user } = route.params;
  const [firstName, setFirstName]   = useState(user?.FirstName || '');
  const [lastName, setLastName]     = useState(user?.LastName || '');
  const [gender, setGender]         = useState(user?.Gender || null);
  const [saving, setSaving]         = useState(false);


  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword, setNewPassword]             = useState('');
  const [confirmPassword, setConfirmPassword]     = useState('');
  const [showCurrent, setShowCurrent]             = useState(false);
  const [showNew, setShowNew]                     = useState(false);
  const [changingPassword, setChangingPassword]   = useState(false);

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showError('Missing Info', 'First and last name are required.');
      return;
    }
    setSaving(true);
    try {
      const result = await UserController.updateProfile(
        user.UserID,
        firstName.trim(),
        lastName.trim(),
        gender
      );
      if (result.success) {
        await AuthController.updateStoredUser({
          ...user,
          FirstName: firstName.trim(),
          LastName:  lastName.trim(),
          Gender:    gender,
        });
          showSuccess('Saved', 'Your profile has been updated.');
      } else {
        showError('Error', result.message || 'Failed to update profile.');
      }
    } catch (e) {
      showError('Error', 'Could not connect to server.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { showError('Required', 'Enter your current password.'); return; }
    if (newPassword.length < 6) { showError('Too Short', 'New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { showError('Mismatch', 'New passwords do not match.'); return; }

    setChangingPassword(true);
    try {
      const result = await UserController.changePassword(user.UserID, currentPassword, newPassword);
      if (result.success) {
          showSuccess('Success', 'Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showError('Error', result.message || 'Failed to change password.');
          }
      } catch (error) {
          if (error.response && error.response.status === 401) {
              showError('Access Denied 🛑', 'Your current password is incorrect.');
          } else {
              const serverMsg = error.response?.data?.message || 'Could not connect to server.';
              showError('System Error', serverMsg);
          }
      } finally {
          setChangingPassword(false);
      }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor="#aaa"
            placeholder="First name"
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor="#aaa"
            placeholder="Last name"
          />

          <Text style={styles.label}>Email</Text>
          <View style={styles.disabledInput}>
            <Text style={styles.disabledText}>{user?.Email}</Text>
            <Icon name="lock" size={16} color="#ccc" />
          </View>
          <Text style={styles.hint}>Email changes are not available yet.</Text>

          <Text style={styles.label}>Gender</Text>
          <Text style={styles.genderNote}>
            Your gender determines which challenges you can create and join.
          </Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map(opt => {
              const selected = gender === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.genderChip,
                    selected && { backgroundColor: opt.color, borderColor: opt.color },
                  ]}
                  onPress={() => setGender(opt.value)}
                >
                  <Icon name={opt.icon} size={18} color={selected ? '#fff' : opt.color} />
                  <Text style={[styles.genderChipText, selected && { color: '#fff' }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>

          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              placeholder="Enter current password"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              <Icon name={showCurrent ? 'visibility' : 'visibility-off'} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              placeholder="At least 6 characters"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Icon name={showNew ? 'visibility' : 'visibility-off'} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showNew}
              placeholder="Re-enter new password"
              placeholderTextColor="#aaa"
            />
            {confirmPassword.length > 0 && (
              <Icon
                name={newPassword === confirmPassword ? 'check-circle' : 'cancel'}
                size={20}
                color={newPassword === confirmPassword ? '#4CAF50' : '#F44336'}
              />
            )}
          </View>

          <TouchableOpacity style={styles.passwordBtn} onPress={handleChangePassword} disabled={changingPassword}>
            {changingPassword
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Change Password</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: '#f8f9fa' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle:     { fontSize: 18, fontWeight: '700', color: '#222' },
  section:         { backgroundColor: '#fff', marginTop: 10, padding: 20 },
  sectionTitle:    { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 16 },
  label:           { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input:           { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 13, fontSize: 15, backgroundColor: '#fafafa', color: '#222' },
  disabledInput:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 13, backgroundColor: '#f5f5f5' },
  disabledText:    { fontSize: 15, color: '#999' },
  hint:            { fontSize: 11, color: '#bbb', marginTop: 4 },
  genderNote:      { fontSize: 12, color: '#888', marginBottom: 10 },
  genderRow:       { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  genderChip:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f5f5f5', borderWidth: 1.5, borderColor: '#ddd', gap: 6 },
  genderChipText:  { fontSize: 14, fontWeight: '600', color: '#555', marginLeft: 5, includeFontPadding: false, paddingRight: 4   },
  saveBtn:         { backgroundColor: '#2E7D32', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  saveBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  passwordRow:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 13, backgroundColor: '#fafafa' },
  passwordInput:   { flex: 1, fontSize: 15, color: '#222', paddingVertical: 13 },
  passwordBtn:     { backgroundColor: '#FF9800', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
});

export default EditProfileScreen;
