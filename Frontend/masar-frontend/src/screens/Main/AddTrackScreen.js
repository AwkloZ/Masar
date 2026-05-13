import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, Modal,
    SectionList, Platform, Switch
} from 'react-native';
import TrackController from '../../controllers/TrackController';
import AuthController from '../../controllers/AuthController';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import OpenStreetMapView from '../../components/OpenStreetMapView';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { showSuccess, showError } from '../../utils/ToastHelper';
const CATEGORY_COLORS = {
    'Facilities': { bg: '#E8F5E9', border: '#4CAF50', icon: '#4CAF50' },
    'Food & Drink': { bg: '#FFF3E0', border: '#FF9800', icon: '#FF9800' },
    'Safety': { bg: '#FCE4EC', border: '#E91E63', icon: '#E91E63' },
    'Sports': { bg: '#E3F2FD', border: '#2196F3', icon: '#2196F3' },
};
const DEFAULT_COLOR = { bg: '#F3E5F5', border: '#9C27B0', icon: '#9C27B0' };

const AmenityChip = ({ amenity, selected, onToggle }) => {
    const colors = CATEGORY_COLORS[amenity.Category] || DEFAULT_COLOR;
    return (
        <TouchableOpacity
            style={[
                styles.amenityChip,
                selected
                    ? { backgroundColor: colors.border, borderColor: colors.border }
                    : { backgroundColor: '#fff', borderColor: '#ddd' },
            ]}
            onPress={() => onToggle(amenity.AmenityID)}
            activeOpacity={0.75}
        >
            <Icon name={amenity.AmenityIcon} size={18} color={selected ? '#fff' : colors.icon} style={styles.amenityChipIcon} />
            <Text style={[styles.amenityChipText, { color: selected ? '#fff' : '#444' }]} numberOfLines={1}>{amenity.AmenityName}</Text>
            {selected && <Icon name="check" size={14} color="#fff" style={styles.amenityCheckIcon} />}
        </TouchableOpacity>
    );
};

const AmenitiesModal = ({ visible, amenities, selectedIds, onToggle, onDone }) => {
    const sections = Object.entries(
        amenities.reduce((acc, a) => {
            if (!acc[a.Category]) acc[a.Category] = [];
            acc[a.Category].push(a);
            return acc;
        }, {})
    ).map(([title, data]) => ({ title, data }));

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Amenities</Text>
                        <TouchableOpacity onPress={onDone} style={styles.modalDoneBtn}>
                            <Text style={styles.modalDoneText}>Done {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</Text>
                        </TouchableOpacity>
                    </View>
                    <SectionList
                        sections={sections}
                        keyExtractor={(item) => item.AmenityID.toString()}
                        contentContainerStyle={styles.modalList}
                        renderSectionHeader={({ section: { title } }) => {
                            const colors = CATEGORY_COLORS[title] || DEFAULT_COLOR;
                            return (
                                <View style={[styles.sectionHeader, { backgroundColor: colors.bg }]}>
                                    <View style={[styles.sectionDot, { backgroundColor: colors.border }]} />
                                    <Text style={[styles.sectionHeaderText, { color: colors.border }]}>{title}</Text>
                                </View>
                            );
                        }}
                        renderItem={({ item }) => {
                            const isSelected = selectedIds.includes(item.AmenityID);
                            const colors = CATEGORY_COLORS[item.Category] || DEFAULT_COLOR;
                            return (
                                <TouchableOpacity
                                    style={[styles.modalAmenityRow, isSelected && styles.modalAmenityRowSelected]}
                                    onPress={() => onToggle(item.AmenityID)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.modalAmenityLeft}>
                                        <View style={[styles.modalIconCircle, { backgroundColor: isSelected ? colors.border : colors.bg }]}>
                                            <Icon name={item.AmenityIcon} size={20} color={isSelected ? '#fff' : colors.icon} />
                                        </View>
                                        <Text style={styles.modalAmenityName}>{item.AmenityName}</Text>
                                    </View>
                                    <View style={[styles.modalCheckbox, isSelected && styles.modalCheckboxChecked]}>
                                        {isSelected && <Icon name="check" size={14} color="#fff" />}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
};

const AddTrackScreen = ({ navigation, route }) => {
    const [userLocation, setUserLocation] = useState(null);

    const [locationFetched, setLocationFetched] = useState(false);

    const [isScrollEnabled, setIsScrollEnabled] = useState(true);
    const [user, setUser] = useState(route.params?.user || null);
    const [sportTypes, setSportTypes] = useState([]);
    const [availableAmenities, setAvailableAmenities] = useState([]);
    const [surfaceTypes, setSurfaceTypes] = useState([]);
    const [lightingTypes, setLightingTypes] = useState([]);
    const [selectedSurface, setSelectedSurface] = useState(null);
    const [selectedLighting, setSelectedLighting] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedAmenityIds, setSelectedAmenityIds] = useState([]);
    const [trackName, setTrackName] = useState('');
    const [description, setDescription] = useState('');
    const [length, setLength] = useState('');
    const [difficulty, setDifficulty] = useState(null);
    const [hasSeparateLanes, setHasSeparateLanes] = useState(false);
    const [loading, setLoading] = useState(false);
    const [amenitiesModalVisible, setAmenitiesModalVisible] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [mediaList, setMediaList] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    showError('Permission Denied', 'Using default map location.');
                    setLocationFetched(true);
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            } catch (error) {
                console.log("Could not fetch location:", error);
            } finally {
                setLocationFetched(true);
            }
        })();
    }, []);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        if (!user) {
            const stored = await AuthController.getStoredUser();
            if (stored) setUser(stored);
        }
        try {
            const [types, amenitiesResult, surfaces, lightings] = await Promise.all([
                TrackController.fetchSportTypes(),
                TrackController.fetchAmenities(),
                TrackController.fetchSurfaceTypes(),
                TrackController.fetchLightingTypes(),
            ]);
            setSportTypes(Array.isArray(types) ? types : []);
            setAvailableAmenities(amenitiesResult?.data || []);
            setSurfaceTypes(Array.isArray(surfaces) ? surfaces : []);
            setLightingTypes(Array.isArray(lightings) ? lightings : []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const pickMedia = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            quality: 0.8,
            videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
        });
        if (!result.canceled) {
            setMediaList(prev => [...prev, ...result.assets]);
        }
    };

    const toggleCategory = (id) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const toggleAmenity = (id) => setSelectedAmenityIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const selectedAmenities = availableAmenities.filter(a => selectedAmenityIds.includes(a.AmenityID));

    const handleSubmit = async () => {
        if (!trackName.trim()) { showError('Missing Info', 'Please enter a track name'); return; }
        if (!description.trim()) { showError('Missing Info', 'Please enter a description'); return; }
        if (selectedCategories.length === 0) { showError('Missing Info', 'Please select at least one category'); return; }
        if (routeCoordinates.length === 0) { showError('Missing Info', 'Please set a location or draw a route on the map!'); return; }
        if (length && isNaN(length)) {
            showError('Hold up!', 'The track length must be a valid number. 📏');
            return;
        }

        setLoading(true);

        try {
            let dynamicCity = 'Unknown City';
            let dynamicCountry = 'Saudi Arabia';
            let dynamicAddress = '';

            try {
                const lat = routeCoordinates[0].latitude;
                const lon = routeCoordinates[0].longitude;

                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`);
                const place = await response.json();

                if (place && place.address) {
                    dynamicCity = place.address.city || place.address.town || place.address.village || place.address.state || 'Unknown City';
                    dynamicCountry = place.address.country || 'Saudi Arabia';
                    dynamicAddress = place.address.road || place.name || '';
                }
            } catch (geoError) {
                console.log("Could not reverse geocode:", geoError);
            }

            const trackData = {
                userID: user?.UserID || 1,
                trackName,
                description,
                length: parseFloat(length) || null,
                difficulty: difficulty,
                surface: selectedSurface,
                lighting: selectedLighting,
                latitude: routeCoordinates[0].latitude,
                longitude: routeCoordinates[0].longitude,
                city: dynamicCity,
                country: dynamicCountry,
                address: dynamicAddress,
                hasSeparateLanes: hasSeparateLanes ? 1 : 0,
                routePoints: JSON.stringify(routeCoordinates),
                sportTypes: selectedCategories,
                amenity_ids: selectedAmenityIds,
            };

            await TrackController.submitNewTrack(trackData, mediaList);
            Toast.show({
                type: 'success',
                text1: 'Track Submitted! 🏆',
                text2: 'Your new track is now live on the map.',
                visibilityTime: 2000, 
                autoHide: true,
                topOffset: 60,
            });

          
                navigation.goBack();
          
        } catch (error) {
            const realErrorMessage = error.response?.data?.message || error.message;
            Toast.show({
                type: 'error',
                text1: 'Backend Error 🚨',
                text2: realErrorMessage,
                visibilityTime: 4000, 
                autoHide: true,
                topOffset: 60,
            });
            console.log('Full Error Payload:', error.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const calculateTrackLength = (coords) => {
        if (!coords || coords.length < 2) return "";
        const toRad = (value) => (value * Math.PI) / 180;
        let totalDistance = 0;
        const R = 6371;
        for (let i = 0; i < coords.length - 1; i++) {
            const lat1 = coords[i].latitude;
            const lon1 = coords[i].longitude;
            const lat2 = coords[i + 1].latitude;
            const lon2 = coords[i + 1].longitude;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            totalDistance += R * c;
        }
        return totalDistance.toFixed(2);
    };

    useEffect(() => {
        if (routeCoordinates && routeCoordinates.length > 1) {
            setLength(calculateTrackLength(routeCoordinates));
        } else {
            setLength('');
        }
    }, [routeCoordinates]);

    const handleMapPress = (coordinate) => setRouteCoordinates(prev => [...prev, coordinate]);
    const handleClearMap = () => setRouteCoordinates([]);

    return (
        <View style={styles.screen}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false} scrollEnabled={isScrollEnabled}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Icon name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Share a Spot</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Add Photos & Videos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {mediaList.map((media, index) => (
                            <View key={index} style={{ position: 'relative' }}>
                                <Image
                                    source={{ uri: media.uri }}
                                    style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: '#eee' }}
                                />
                                {media.type === 'video' && (
                                    <Icon name="play-circle-outline" size={32} color="#fff" style={{ position: 'absolute', top: 44, left: 44, opacity: 0.8 }} />
                                )}
                                <TouchableOpacity
                                    style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#E53935', borderRadius: 12, padding: 2 }}
                                    onPress={() => setMediaList(prev => prev.filter((_, i) => i !== index))}
                                >
                                    <Icon name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.photoPlaceholder} onPress={pickMedia}>
                            <Icon name="add-a-photo" size={32} color="#999" />
                            <Text style={styles.photoPlaceholderText}>Add Media</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Map Route Section */}
                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Draw Route <Text style={styles.required}>*</Text></Text>
                        {routeCoordinates.length > 0 && (
                            <TouchableOpacity onPress={handleClearMap}>
                                <Text style={{ color: '#E53935', fontWeight: '600', fontSize: 13 }}>Clear Map</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={{ color: '#888', fontSize: 12, marginBottom: 10 }}>Tap the map to drop checkpoints and draw your track.</Text>

                    <View style={{ height: 250, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' }}>
                        {!locationFetched ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
                                <ActivityIndicator size="small" color="#2E7D32" />
                                <Text style={{ marginTop: 10, color: '#666', fontSize: 13 }}>Finding your location...</Text>
                            </View>
                        ) : (
                            <OpenStreetMapView
                                markers={routeCoordinates}
                                setScrollEnabled={setIsScrollEnabled}
                                userLocation={userLocation}
                                onMapPress={handleMapPress}
                            />
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Category <Text style={styles.required}>*</Text></Text>
                    <View style={styles.chipsRow}>
                        {sportTypes.map(sport => (
                            <TouchableOpacity
                                key={sport.SportTypeID}
                                style={[styles.categoryChip, selectedCategories.includes(sport.SportTypeID) && styles.categoryChipActive]}
                                onPress={() => toggleCategory(sport.SportTypeID)}
                            >
                                <Text style={[styles.categoryChipText, selectedCategories.includes(sport.SportTypeID) && styles.categoryChipTextActive]}>
                                    {sport.SportName}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Amenities</Text>
                        {selectedAmenityIds.length > 0 && (
                            <View style={styles.amenityCountBadge}>
                                <Text style={styles.amenityCountText}>{selectedAmenityIds.length} selected</Text>
                            </View>
                        )}
                    </View>
                    {selectedAmenities.length > 0 && (
                        <View style={styles.selectedAmenitiesPreview}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {selectedAmenities.map(amenity => (
                                    <AmenityChip key={amenity.AmenityID} amenity={amenity} selected onToggle={toggleAmenity} />
                                ))}
                            </ScrollView>
                        </View>
                    )}
                    <TouchableOpacity style={styles.amenitiesPickerBtn} onPress={() => setAmenitiesModalVisible(true)}>
                        <Icon name="add-circle-outline" size={20} color="#2E7D32" alignItems="center" />
                        <Text style={styles.amenitiesPickerBtnText}>
                            {selectedAmenityIds.length === 0 ? 'Select Amenities' : 'Edit Amenities'}
                        </Text>
                        <Icon name="chevron-right" size={20} color="#2E7D32" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Spot Name <Text style={styles.required}>*</Text></Text>
                    <TextInput style={styles.input} placeholder="Enter track name" placeholderTextColor="#aaa" value={trackName} onChangeText={setTrackName} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Length (km)</Text>
                    <TextInput style={styles.input} placeholder="e.g. 2.5" placeholderTextColor="#aaa" value={length} onChangeText={setLength} keyboardType="decimal-pad" />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Surface Type</Text>
                    <View style={styles.chipsRow}>
                        {surfaceTypes.map(surface => (
                            <TouchableOpacity
                                key={surface.SurfaceTypeID}
                                style={[styles.categoryChip, selectedSurface === surface.SurfaceTypeID && { backgroundColor: '#2196F3', borderColor: '#2196F3' }]}
                                onPress={() => setSelectedSurface(selectedSurface === surface.SurfaceTypeID ? null : surface.SurfaceTypeID)}
                            >
                                <Text style={[styles.categoryChipText, selectedSurface === surface.SurfaceTypeID && { color: '#fff' }]}>
                                    {surface.SurfaceName}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Lighting</Text>
                    <View style={styles.chipsRow}>
                        {lightingTypes.map(light => (
                            <TouchableOpacity
                                key={light.LightingTypeID}
                                style={[styles.categoryChip, selectedLighting === light.LightingTypeID && { backgroundColor: '#FFC107', borderColor: '#FFC107' }]}
                                onPress={() => setSelectedLighting(selectedLighting === light.LightingTypeID ? null : light.LightingTypeID)}
                            >
                                <Text style={[styles.categoryChipText, selectedLighting === light.LightingTypeID && { color: '#fff' }]}>
                                    {light.LightingName}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Difficulty</Text>
                    <View style={styles.chipsRow}>
                        {[{ v: 1, l: 'Easy', c: '#4CAF50' }, { v: 2, l: 'Moderate', c: '#FF9800' }, { v: 3, l: 'Hard', c: '#F44336' }].map(d => (
                            <TouchableOpacity
                                key={d.v}
                                style={[styles.categoryChip, difficulty === d.v && { backgroundColor: d.c, borderColor: d.c }]}
                                onPress={() => setDifficulty(difficulty === d.v ? null : d.v)}
                            >
                                <Text style={[styles.categoryChipText, difficulty === d.v && { color: '#fff' }]}>{d.l}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <View style={{ flex: 1, paddingRight: 15 }}>
                        <Text style={styles.label}>Separate Lanes</Text>
                        <Text style={{ fontSize: 13, color: '#666' }}>Does this track have dedicated lanes to separate cyclists from pedestrians?</Text>
                    </View>
                    <Switch
                        value={hasSeparateLanes}
                        onValueChange={setHasSeparateLanes}
                        trackColor={{ false: '#ddd', true: '#81C784' }}
                        thumbColor={hasSeparateLanes ? '#2E7D32' : '#f4f3f4'}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Tell us about this track..."
                        placeholderTextColor="#aaa"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Contribution</Text>}
                </TouchableOpacity>

                <View style={{ height: 50 }} />
            </ScrollView>

            <AmenitiesModal
                visible={amenitiesModalVisible}
                amenities={availableAmenities}
                selectedIds={selectedAmenityIds}
                onToggle={toggleAmenity}
                onDone={() => setAmenitiesModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f5f5f5' },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    section: { backgroundColor: '#fff', padding: 20, marginTop: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 14 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    required: { color: '#E53935' },
    photoPlaceholder: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#f8f8f8', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed' },
    photoPlaceholderText: { fontSize: 12, color: '#aaa', marginTop: 8 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1.5, borderColor: '#ddd' },
    categoryChipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
    categoryChipText: { color: '#555', fontSize: 14, fontWeight: '500' },
    categoryChipTextActive: { color: '#fff' },
    amenityCountBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 15, paddingVertical: 4, borderRadius: 12 },
    amenityCountText: { color: '#2E7D32', fontSize: 10, fontWeight: '600', textAlign: 'left' },
    selectedAmenitiesPreview: { marginBottom: 12 },
    amenityChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginRight: 8, marginBottom: 4 },
    amenityChipIcon: { marginRight: 5 },
    amenityChipText: { fontSize: 13, fontWeight: '500', maxWidth: 110 },
    amenityCheckIcon: { marginLeft: 4 },
    amenitiesPickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#2E7D32', borderRadius: 10, paddingVertical: 12, gap: 8, backgroundColor: '#F1FBF4' },
    amenitiesPickerBtnText: { color: '#2E7D32', fontSize: 15, fontWeight: '600', textAlign: 'center' },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 13, fontSize: 15, backgroundColor: '#fafafa', color: '#222' },
    textArea: { height: 110 },
    submitBtn: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 12, margin: 20, alignItems: 'center', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
    submitBtnDisabled: { backgroundColor: '#aaa' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
    modalDoneBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    modalDoneText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    modalList: { paddingBottom: 30 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
    sectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    sectionHeaderText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    modalAmenityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    modalAmenityRowSelected: { backgroundColor: '#F9FFF9' },
    modalAmenityLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    modalIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    modalAmenityName: { fontSize: 15, color: '#333', fontWeight: '500' },
    modalCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    modalCheckboxChecked: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
});

export default AddTrackScreen;