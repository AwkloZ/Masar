import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput,
    ActivityIndicator, Modal, ScrollView, Dimensions, Platform, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import TrackController from '../../controllers/TrackController';
import AuthController from '../../controllers/AuthController';
import * as Location from 'expo-location';
import HomeMapView from '../../components/HomeMapView';
import { showSuccess, showError, showInfo } from '../../utils/ToastHelper'; 

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SPORT_ICONS = {
    Walking: 'directions-walk', Cycling: 'directions-bike', Skating: 'skateboarding',
    Running: 'directions-run', Hiking: 'hiking',
};

const StarRating = ({ rating, size = 14 }) => (
    <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4, 5].map(i => (
            <Icon key={i} name={i <= rating ? 'star' : 'star-border'} size={size} color="#FFC107" />
        ))}
    </View>
);

const TrackCard = ({ track, onPress }) => {
    const sports = track.sportTypes || [];
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>{track.TrackName}</Text>
                    <View style={styles.cardMeta}>
                        <Icon name="place" size={13} color="#888" />
                        <Text style={styles.cardCity}>{track.City || 'Unknown'}</Text>
                        {track.Length_km && (
                            <>
                                <Text style={styles.cardDot}> · </Text>
                                <Text style={styles.cardCity}>{track.Length_km} km</Text>
                            </>
                        )}
                    </View>
                </View>
                <View style={styles.cardRating}>
                    <StarRating rating={track.Rating || 0} />
                </View>
            </View>
            {sports.length > 0 && (
                <View style={styles.cardSports}>
                    {sports.map(s => (
                        <View key={s.SportTypeID} style={styles.sportTag}>
                            <Icon name={SPORT_ICONS[s.SportName] || 'sports'} size={12} color="#2E7D32" />
                            <Text style={styles.sportTagText}>{s.SportName}</Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
};

const HomeScreen = ({ navigation, route }) => {
    const [user, setUser] = useState(route.params?.user || null);
    const [tracks, setTracks] = useState([]);
    const [filteredTracks, setFilteredTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [viewMode, setViewMode] = useState('map'); 

    const [searchQuery, setSearchQuery] = useState('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [sportTypes, setSportTypes] = useState([]);
    const [amenities, setAmenities] = useState([]);

    const [selectedSport, setSelectedSport] = useState(null);
    const [selectedAmenities, setSelectedAmenities] = useState([]);
    const [requireSeparateLanes, setRequireSeparateLanes] = useState(false);
    const [selectedRating, setSelectedRating] = useState(null);
    const [filtersActive, setFiltersActive] = useState(false);

    useEffect(() => {
        loadUser();
        loadFilterData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            setActiveTab('home');
            loadTracks();
        }, [])
    );

    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            }
        })();
    }, []);
    const loadUser = async () => {
        if (!user) {
            const stored = await AuthController.getStoredUser();
            if (stored) setUser(stored);
        }
    };

    const loadFilterData = async () => {
        const [sports, amenRes] = await Promise.all([
            TrackController.fetchSportTypes(),
            TrackController.fetchAmenities(),
        ]);
        setSportTypes(sports);
        setAmenities(amenRes?.data || []);
    };

    const loadTracks = async () => {
        setLoading(true);
        const data = await TrackController.fetchAllTracks();
        setTracks(data);
        setFilteredTracks(data);
        setLoading(false);
    };

    const toggleAmenity = (amenityId) => {
        setSelectedAmenities(prev =>
            prev.includes(amenityId)
                ? prev.filter(id => id !== amenityId)
                : [...prev, amenityId]
        );
    };

  
    const applyFilters = () => {
        setFilterModalVisible(false);

        const hasFilters = searchQuery || selectedSport || selectedAmenities.length > 0 || selectedRating || requireSeparateLanes;
        setFiltersActive(!!hasFilters);

        if (hasFilters) {
            let results = [...tracks]; 

            if (searchQuery) {
                results = results.filter(track => {
                    if (!track.TrackName) return false;
                    return track.TrackName.toLowerCase().includes(searchQuery.toLowerCase());
                });
            }

            if (selectedSport) {
                results = results.filter(track =>
                    track.sportTypes && track.sportTypes.some(s => s.SportTypeID === selectedSport)
                );
            }

            if (requireSeparateLanes) {
                results = results.filter(track => track.HasSeparateLanes == 1);
            }

            if (selectedRating) {
                results = results.filter(track =>
                    track.Rating && track.Rating >= selectedRating
                );
            }

            if (selectedAmenities.length > 0) {
                results = results.filter(track => {
                    if (!track.amenities || track.amenities.length === 0) return false;
                    return selectedAmenities.every(selectedId =>
                        track.amenities.some(trackAmenity => trackAmenity.AmenityID === selectedId)
                    );
                });
            }

            setFilteredTracks(results);
        } else {
            setFilteredTracks(tracks);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setRequireSeparateLanes(false);
        setSelectedSport(null);
        setSelectedAmenities([]);
        setSelectedRating(null);
        setFiltersActive(false);
        setFilteredTracks(tracks);
    };

    const handleTabPress = (tab) => {
        setActiveTab(tab);

        if (tab === 'profile') {
            if (!user) {
                Alert.alert(
                    "User Access Only",
                    "Create an account to view your own profile! ✨",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Sign Up", onPress: () => navigation.navigate('Login') }
                    ]
                );
                return;
            }
            navigation.navigate('Profile', { user });

        } else if (tab === 'add') {
            if (!user) {
                showError(
                    "User Access Only",
                    "Create an account to add your own tracks and share them with the community! ✨",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Sign Up", onPress: () => navigation.navigate('Login') }
                    ]
                );
                return;
            }
            navigation.navigate('AddTrack', { user });

        } else if (tab === 'challenges') {
            navigation.navigate('Challenges', { user });
        }
    };

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {user?.FirstName || 'Explorer'}</Text>
                    <Text style={styles.subtitle}>Find your next track</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.viewToggle}
                        onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                    >
                        <Icon name={viewMode === 'list' ? 'map' : 'view-list'} size={22} color="#2E7D32" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchRow}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search track names..."
                        placeholderTextColor="#aaa"
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                           
                        }}
                        onSubmitEditing={applyFilters}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); if (!selectedSport && selectedAmenities.length === 0 && !selectedRating) { setFilteredTracks(tracks); setFiltersActive(false); } }}>
                            <Icon name="close" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.filterBtn, filtersActive && styles.filterBtnActive]}
                    onPress={() => {
                        if (!user) {
                            Alert.alert(
                                "User Access Only",
                                "Unlock advanced filtering to find your perfect track! Create a free account to get started. ✨",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Sign Up", onPress: () => navigation.navigate('Login') }
                                ]
                            );
                            return;
                        }
                        setFilterModalVisible(true);
                    }}
                >
                    <Icon name="tune" size={22} color={filtersActive ? '#fff' : '#2E7D32'} />
                </TouchableOpacity>
            </View>

            {filtersActive && (
                <View style={styles.activeFiltersRow}>
                    <Text style={styles.activeFiltersText}>Filters active</Text>
                    <TouchableOpacity onPress={clearFilters}>
                        <Text style={styles.clearFiltersText}>Clear all</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <View style={styles.centered}><ActivityIndicator size="large" color="#2E7D32" /></View>
            ) : viewMode === 'list' ? (
                <FlatList
                    data={filteredTracks}
                    keyExtractor={item => item.TrackID.toString()}
                    renderItem={({ item }) => (
                        <TrackCard
                            track={item}
                            onPress={() => navigation.navigate('TrackDetails', { trackId: item.TrackID, user })}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Icon name="search-off" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No tracks found</Text>
                        </View>
                    }
                />
            ) : (
                <View style={styles.mapContainer}>
                    <HomeMapView
                        tracks={filteredTracks}
                                onTrackPress={(trackId) => navigation.navigate('TrackDetails', { trackId, user })}
                                userLocation={userLocation} 
                    />
                </View>
            )}

            <View style={styles.tabBar}>
                <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('home'); }}>
                    <Icon name="home" size={24} color={activeTab === 'home' ? '#2E7D32' : '#999'} />
                    <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('challenges')}>
                    <Icon name="emoji-events" size={24} color={activeTab === 'challenges' ? '#2E7D32' : '#999'} />
                    <Text style={[styles.tabLabel, activeTab === 'challenges' && styles.tabLabelActive]}>Challenges</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItemCenter} onPress={() => handleTabPress('add')}>
                    <View style={styles.addBtn}>
                        <Icon name="add" size={28} color="#fff" />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('profile')}>
                    <Icon name="person" size={24} color={activeTab === 'profile' ? '#2E7D32' : '#999'} />
                    <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('home'); setViewMode(viewMode === 'list' ? 'map' : 'list'); }}>
                    <Icon name={viewMode === 'list' ? 'map' : 'list'} size={24} color="#999" />
                    <Text style={styles.tabLabel}>{viewMode === 'list' ? 'Map' : 'List'}</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={filterModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Tracks</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>

                            <Text style={styles.filterLabel}>Sport Type</Text>
                            <View style={styles.filterChips}>
                                <TouchableOpacity
                                    style={[styles.fChip, !selectedSport && styles.fChipActive]}
                                    onPress={() => setSelectedSport(null)}
                                >
                                    <Text style={[styles.fChipText, !selectedSport && styles.fChipTextActive]}>All</Text>
                                </TouchableOpacity>
                                {sportTypes.map(s => (
                                    <TouchableOpacity
                                        key={s.SportTypeID}
                                        style={[styles.fChip, selectedSport === s.SportTypeID && styles.fChipActive]}
                                        onPress={() => setSelectedSport(selectedSport === s.SportTypeID ? null : s.SportTypeID)}
                                    >
                                        <Icon name={SPORT_ICONS[s.SportName] || 'sports'} size={14} color={selectedSport === s.SportTypeID ? '#fff' : '#555'} />
                                        <Text style={[styles.fChipText, selectedSport === s.SportTypeID && styles.fChipTextActive]}> {s.SportName}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.filterLabel}>Has Amenities (Select Multiple)</Text>
                            <View style={styles.filterChips}>
                                <TouchableOpacity
                                    style={[styles.fChip, selectedAmenities.length === 0 && styles.fChipActive]}
                                    onPress={() => setSelectedAmenities([])}
                                >
                                    <Text style={[styles.fChipText, selectedAmenities.length === 0 && styles.fChipTextActive]}>Any</Text>
                                </TouchableOpacity>
                                {amenities.map(a => {
                                    const isSelected = selectedAmenities.includes(a.AmenityID);
                                    return (
                                        <TouchableOpacity
                                            key={a.AmenityID}
                                            style={[styles.fChip, isSelected && styles.fChipActive]}
                                            onPress={() => toggleAmenity(a.AmenityID)}
                                        >
                                            <Icon name={a.AmenityIcon} size={14} color={isSelected ? '#fff' : '#555'} />
                                            <Text style={[styles.fChipText, isSelected && styles.fChipTextActive]}> {a.AmenityName}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <Text style={styles.filterLabel}>Track Layout</Text>
                            <View style={styles.filterChips}>
                                <TouchableOpacity
                                    style={[styles.fChip, requireSeparateLanes && styles.fChipActive]}
                                    onPress={() => setRequireSeparateLanes(!requireSeparateLanes)}
                                >
                                    <Icon name="alt-route" size={14} color={requireSeparateLanes ? '#fff' : '#555'} />
                                    <Text style={[styles.fChipText, requireSeparateLanes && styles.fChipTextActive]}> Dedicated Lanes Only</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.filterLabel}>Minimum Rating</Text>
                            <View style={styles.filterChips} >
                                <TouchableOpacity
                                    style={[styles.fChip, !selectedRating && styles.fChipActive]}
                                    onPress={() => setSelectedRating(null)}
                                >
                                    <Text style={[styles.fChipText, !selectedRating && styles.fChipTextActive] }>Any</Text>
                                </TouchableOpacity>
                                {[3, 4, 5].map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.fChip, selectedRating === r && styles.fChipActive]}
                                        onPress={() => setSelectedRating(selectedRating === r ? null : r)}

                                    >
                                        <Icon name="star" size={14} color={selectedRating === r ? '#fff' : '#FFC107'} />
                                        <Text style={[styles.fChipText, selectedRating === r && styles.fChipTextActive]}> {r}+</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.clearBtn} onPress={() => { clearFilters(); setFilterModalVisible(false); }}>
                                <Text style={styles.clearBtnText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                                <Text style={styles.applyBtnText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    greeting: { fontSize: 22, fontWeight: '800', color: '#222' },
    subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    viewToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
    searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 12, height: 44 },
    searchInput: { flex: 1, fontSize: 15, color: '#333', marginLeft: 8 },
    filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    filterBtnActive: { backgroundColor: '#2E7D32' },
    activeFiltersRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 6, backgroundColor: '#E8F5E9' },
    activeFiltersText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
    clearFiltersText: { fontSize: 12, color: '#C62828', fontWeight: '600' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    listContent: { padding: 16, paddingBottom: 100 },
    emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
    mapContainer: { flex: 1 },

    card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    cardTop: { flexDirection: 'row', alignItems: 'center' },
    cardIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 16, fontWeight: '700', color: '#222' },
    cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    cardCity: { fontSize: 12, color: '#888' },
    cardDot: { fontSize: 12, color: '#ccc' },
    cardRating: { marginLeft: 8 },
    cardSports: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    sportTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 4 },
    sportTagText: { fontSize: 11, color: '#2E7D32', fontWeight: '600', marginLeft: 5, includeFontPadding: false, paddingRight: 4 },

    tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8 },
    tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tabItemCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -20 },
    addBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 6 },
    tabLabel: { fontSize: 10, color: '#999', marginTop: 2 },
    tabLabelActive: { color: '#2E7D32', fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#222' },
    modalBody: { padding: 20 },
    filterLabel: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10, marginTop: 16 },
    filterChips: { flexDirection: 'row', flexWrap: 'wrap' },
    fChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
    fChipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
    fChipText: { fontSize: 13, color: '#555' },
    fChipTextActive: { color: '#fff', fontWeight: '600' },
    modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
    clearBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    clearBtnText: { fontSize: 15, color: '#666', fontWeight: '600' },
    applyBtn: { flex: 2, height: 48, borderRadius: 12, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center' },
    applyBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

export default HomeScreen;