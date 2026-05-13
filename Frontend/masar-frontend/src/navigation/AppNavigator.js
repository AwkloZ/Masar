import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/Main/HomeScreen';
import TrackDetailsScreen from '../screens/Main/TrackDetailsScreen';
import AddTrackScreen from '../screens/Main/AddTrackScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import EditProfileScreen from '../screens/Main/EditProfileScreen';
import ChallengesScreen from '../screens/Main/ChallengesScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminReportsScreen from '../screens/Admin/AdminReportsScreen';
import AdminEntityReviewScreen from '../screens/Admin/AdminEntityReviewScreen';
import EditTrackScreen from '../screens/Main/EditTrackScreen';
import AdminEditsScreen from '../screens/Admin/AdminEditsScreen';

import Toast from 'react-native-toast-message';

const Stack = createNativeStackNavigator();

const SplashScreen = ({ navigation }) => {
    useEffect(() => {
        const checkUserSession = async () => {
            try {
                const savedUser = await AsyncStorage.getItem('userSession');
                if (savedUser !== null) {
                    navigation.replace('Main', { user: JSON.parse(savedUser) });
                } else {
                    navigation.replace('Login');
                }
            } catch (error) {
                navigation.replace('Login');
            }
        };
        checkUserSession();
    }, []);

    return (
        <View style={styles.splashContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
        </View>
    );
};

const AppNavigator = () => {
    return (

        <View style={{ flex: 1 }}>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Splash"
                    screenOptions={{ headerShown: false }}
                >
                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="Main" component={HomeScreen} />
                    <Stack.Screen name="TrackDetails" component={TrackDetailsScreen} />
                    <Stack.Screen name="AddTrack" component={AddTrackScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="Challenges" component={ChallengesScreen} />
                    <Stack.Screen name="EditTrack" component={EditTrackScreen} />
                    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                    <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
                    <Stack.Screen name="AdminEntityReview" component={AdminEntityReviewScreen} options={{ presentation: 'modal' }} />
                    <Stack.Screen name="AdminEdits" component={AdminEditsScreen} />
                </Stack.Navigator>
            </NavigationContainer>
            
            {/* 👑 TOAST IS BACK IN THE BUILDING */}
            <Toast />
        </View>
    );
};

const styles = StyleSheet.create({
    splashContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    }
});

export default AppNavigator;