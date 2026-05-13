import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthController from '../../controllers/AuthController';
import { showSuccess, showError, showInfo } from '../../utils/ToastHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            showError('Missing Info', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            const result = await AuthController.handleLogin(email.trim(), password);

            if (result.success) {
                showSuccess('Welcome Back! ✨');
                await AsyncStorage.setItem('userSession', JSON.stringify(result.user));
                navigation.replace('Main', { user: result.user });
            } else {
                showError('Login Failed', result.message || 'Invalid email or password.');
            }
        } catch (error) {
            if (error.response) {
                if (error.response.status === 401 || error.response.status === 404) {
                    showError('Access Denied 🛑', 'Incorrect email or password.');
                } else {
                    showError('Login Failed', error.response.data?.message || 'Something went wrong on the server.');
                }
            } else {
                showError('Connection Error', 'Could not connect to server. Check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.brandSection}>
          <View style={styles.logoCircle}>
            <Icon name="terrain" size={48} color="#fff" />
          </View>
          <Text style={styles.brandName}>Masar</Text>
          <Text style={styles.brandTagline}>Discover tracks around you</Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Welcome Back</Text>

          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
                    style={styles.guestBtn} 
                      onPress={() => navigation.replace('Main', { user: null })} 
                >
                    <Text style={styles.guestText}>Continue as Guest</Text>
                </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brandSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  brandName: { fontSize: 32, fontWeight: '800', color: '#2E7D32' },
  brandTagline: { fontSize: 14, color: '#777', marginTop: 4 },
  formSection: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  formTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 20, textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    borderRadius: 12, paddingHorizontal: 14, marginBottom: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#333' },
  loginBtn: {
    backgroundColor: '#2E7D32', borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { fontSize: 14, color: '#777' },
  registerBold: { color: '#2E7D32', fontWeight: '700' },
});

export default LoginScreen;
