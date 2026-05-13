import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthController from '../../controllers/AuthController';
import { showSuccess, showError, showInfo } from '../../utils/ToastHelper';
const GENDERS = [
    { value: 'male', label: 'Male', icon: 'man', color: '#1565C0', bg: '#E8EAF6' },
    { value: 'female', label: 'Female', icon: 'woman', color: '#AD1457', bg: '#FCE4EC' },
];

const RegisterScreen = ({ navigation }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [gender, setGender] = useState(null); 
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
            showError('Missing Info', 'All fields are required.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            showError('Invalid Email ', 'Please enter a valid email address (e.g., name@example.com).');
            return;
        }
        if (!gender) {
            showError('Select Gender', 'Please select your gender to continue.');
            return;
        }
        if (password !== confirmPassword) {
            showError('Mismatch', 'Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            showError('Weak Password', 'Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            const result = await AuthController.handleRegister({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                gender,
            });

            if (result.success) {
                showSuccess('Account Created! 🎉', 'Please sign in to continue.');

                setTimeout(() => {
                    navigation.replace('Login');
                }, 2000);
            } else {
                showError('Registration Failed', result.message || 'Please try again.');
            }
        } catch (error) {

            if (error.response) {
                if (error.response.status === 409) {
                    showError('Email Taken 🛑', 'An account with this email already exists.');
                }
                else if (error.response.status === 400) {
                    showError('Invalid Data', error.response.data?.message || 'Please check your information.');
                }
                else {
                    showError('Server Error', 'Something went wrong on our end.');
                }
            } else {
                showError('Connection Error', 'Could not reach the server. Please try again.');
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
                        <Icon name="terrain" size={40} color="#fff" />
                    </View>
                    <Text style={styles.brandName}>Join Masar</Text>
                </View>

                <View style={styles.formSection}>

                    {/* Name row */}
                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                            <TextInput
                                style={styles.input}
                                placeholder="First Name"
                                placeholderTextColor="#aaa"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Last Name"
                                placeholderTextColor="#aaa"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                    </View>

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

                    <View style={styles.inputContainer}>
                        <Icon name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#aaa"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                        />
                        {confirmPassword.length > 0 && (
                            <Icon
                                name={password === confirmPassword ? 'check-circle' : 'cancel'}
                                size={20}
                                color={password === confirmPassword ? '#4CAF50' : '#F44336'}
                            />
                        )}
                    </View>

                    <Text style={styles.genderLabel}>I am</Text>
                    <View style={styles.genderRow}>
                        {GENDERS.map(g => {
                            const selected = gender === g.value;
                            return (
                                <TouchableOpacity
                                    key={g.value}
                                    style={[
                                        styles.genderBtn,
                                        selected
                                            ? { backgroundColor: g.color, borderColor: g.color }
                                            : { backgroundColor: g.bg, borderColor: g.bg },
                                    ]}
                                    onPress={() => setGender(g.value)}
                                    activeOpacity={0.8}
                                >
                                    <Icon name={g.icon} size={22} color={selected ? '#fff' : g.color} />
                                    <Text style={[styles.genderBtnText, { color: selected ? '#fff' : g.color }]}>
                                        {g.label}
                                    </Text>
                                    {selected && (
                                        <View style={styles.genderCheck}>
                                            <Icon name="check-circle" size={16} color="#fff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.registerBtnText}>Create Account</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
                        <Text style={styles.loginText}>
                            Already have an account? <Text style={styles.loginBold}>Sign In</Text>
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
    brandSection: { alignItems: 'center', marginBottom: 30 },
    logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    brandName: { fontSize: 26, fontWeight: '800', color: '#2E7D32' },
    formSection: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 },
    row: { flexDirection: 'row' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 14, marginBottom: 14, height: 52 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: '#333' },
    genderLabel: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 10, marginTop: 2 },
    genderRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 2, gap: 8, position: 'relative' },
    genderBtnText: { fontSize: 16, fontWeight: '700' },
    genderCheck: { position: 'absolute', top: 6, right: 8 },
    registerBtn: { backgroundColor: '#2E7D32', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 4, elevation: 4 },
    registerBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    loginLink: { marginTop: 20, alignItems: 'center' },
    loginText: { fontSize: 14, color: '#777' },
    loginBold: { color: '#2E7D32', fontWeight: '700' },
});

export default RegisterScreen;
