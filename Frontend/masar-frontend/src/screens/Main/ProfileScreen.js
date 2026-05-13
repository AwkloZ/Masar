import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    FlatList,
    Platform
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { showSuccess, showError, showInfo } from '../../utils/ToastHelper'; 

import UserController from '../../controllers/UserController';
import FavouriteController from '../../controllers/FavouriteController';
import AuthController from '../../controllers/AuthController'; 


const GENDER_LABELS = { male: 'Male', female: 'Female' };

const ProfileScreen = ({ navigation, route }) => {
    const [user, setUser] = useState(route.params?.user || null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [favouriteTracks, setFavouriteTracks] = useState([]);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        setLoading(true);
        let u = user;
        if (!u) {
            u = await AuthController.getStoredUser();
            setUser(u);
        }
        if (u?.UserID) {
            const data = await UserController.fetchProfile(u.UserID);
            if (data) setProfile(data);

            const favs = await FavouriteController.fetchUserFavourites(u.UserID);
            setFavouriteTracks(favs);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await AuthController.handleLogout();

                    showInfo('Logged Out', 'See you next time on Masar! 👋');

                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                },
            },
        ]);
    };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2E7D32" /></View>;
  }

  const displayUser = profile || user || {};
  const initials    = `${displayUser.FirstName?.[0] || ''}${displayUser.LastName?.[0] || ''}`.toUpperCase();
  const memberSince = displayUser.DateRegistered
    ? new Date(displayUser.DateRegistered).getFullYear()
    : new Date().getFullYear();
  const tracks      = profile?.tracks || [];
  const genderLabel = GENDER_LABELS[displayUser.Gender] || null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Icon name="logout" size={22} color="#E53935" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{displayUser.FirstName} {displayUser.LastName}</Text>

         
        </View>

        <View style={styles.actionsSection}>


            {user && user.Role == 1 && (
                <TouchableOpacity
                          style={styles.adminButton}
                          activeOpacity={0.8}
                          onPress={() => navigation.navigate('AdminDashboard', { user })}
                      >
                          <View style={styles.adminIconWrapper}>
                              <Icon name="admin-panel-settings" size={24} color="#FFD700" />
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={styles.adminButtonTitle}>Admin Dashboard</Text>
                              <Text style={styles.adminButtonSub}>Review flagged content & reports</Text>
                          </View>
                          <Icon name="chevron-right" size={24} color="#FFD700" />
                 </TouchableOpacity>
                  )}


          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('EditProfile', { user: displayUser })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="edit" size={20} color="#2E7D32" />
            </View>
            <Text style={styles.actionText}>Edit Profile</Text>
            <Icon name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>


              


          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Challenges', { user: displayUser, initialTab: 'mine' })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="emoji-events" size={20} color="#FF9800" />
            </View>
            <Text style={styles.actionText}>My Challenges</Text>
            <Icon name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>
        </View>

       
              <View style={styles.tracksSection}>
                  <Text style={styles.sectionTitle}>My Favourites ({favouriteTracks.length})</Text>
                  {favouriteTracks.length === 0 ? (
                      <View style={styles.emptyBox}>
                          <Icon name="favorite-border" size={40} color="#ccc" />
                          <Text style={styles.emptyText}>You haven't favorited any tracks yet</Text>
                      </View>
                  ) : (
                      favouriteTracks.map(t => (
                          <TouchableOpacity
                              key={t.TrackID}
                              style={styles.trackCard}
                              onPress={() => navigation.navigate('TrackDetails', { trackId: t.TrackID, user: displayUser })}
                          >
                              <View style={styles.trackIcon}>
                                  <Icon name="favorite" size={24} color="#E53935" />
                              </View>
                              <View style={styles.trackInfo}>
                                  <Text style={styles.trackName} numberOfLines={1}>{t.TrackName}</Text>
                                  <Text style={styles.trackMeta}>
                                      {t.City || 'Unknown'}{t.Length_km ? ` · ${t.Length_km} km` : ''}
                                  </Text>
                              </View>
                              <Icon name="chevron-right" size={22} color="#ccc" />
                          </TouchableOpacity>
                      ))
                  )}
              </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: '#f8f9fa' },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: '#222' },
  logoutBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center' },
  profileSection: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 30, paddingHorizontal: 20 },
  avatar:         { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  avatarText:     { color: '#fff', fontSize: 28, fontWeight: '800' },
  name:           { fontSize: 22, fontWeight: '800', color: '#222' },
  genderPill:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  genderPillText: { fontSize: 12, color: '#555', fontWeight: '600', marginLeft: 5, includeFontPadding: false, paddingRight: 4   },
  statsRow:       { flexDirection: 'row', marginTop: 20, backgroundColor: '#f8f9fa', borderRadius: 14, padding: 16, width: '100%' },
  statBox:        { flex: 1, alignItems: 'center' },
  statValue:      { fontSize: 18, fontWeight: '800', color: '#222' },
  statLabel:      { fontSize: 11, color: '#999', marginTop: 2 },
  statDivider:    { width: 1, backgroundColor: '#ddd' },
  actionsSection: { backgroundColor: '#fff', marginTop: 10, paddingVertical: 4 },
  actionRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  actionIcon:     { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actionText:     { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  tracksSection:  { backgroundColor: '#fff', marginTop: 10, padding: 20 },
  sectionTitle:   { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 14 },
  emptyBox:       { alignItems: 'center', paddingVertical: 30 },
  emptyText:      { fontSize: 14, color: '#999', marginTop: 10 },
  trackCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, marginBottom: 10 },
  trackIcon:      { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  trackInfo:      { flex: 1 },
  trackName:      { fontSize: 15, fontWeight: '600', color: '#222' },
  trackMeta:      { fontSize: 12, color: '#888', marginTop: 2 },
  adminButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', padding: 16, borderRadius: 14, marginTop: 20, marginHorizontal: 20,borderWidth: 1, borderColor: '#FFD700' },
  adminIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
  adminButtonTitle: { fontSize: 16, fontWeight: '800', color: '#FFD700' },
  adminButtonSub: { fontSize: 12, color: '#aaa', marginTop: 2 },
});

export default ProfileScreen;
