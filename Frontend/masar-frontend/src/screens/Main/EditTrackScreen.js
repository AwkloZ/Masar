import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, Modal,
    SectionList, Platform, Switch
} from 'react-native';
import TrackController from '../../controllers/TrackController';
import AuthController from '../../controllers/AuthController';
import Icon from 'react-native-vector-icons/MaterialIcons';
import OpenStreetMapView from '../../components/OpenStreetMapView';

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

const EditTrackScreen = ({ navigation, route }) => {
    const { trackId, user } = route.params;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isScrollEnabled, setIsScrollEnabled] = useState(true);
    const [originalTrack, setOriginalTrack] = useState(null);

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
    const [routeCoordinates, setRouteCoordinates] = useState([]);

    const [amenitiesModalVisible, setAmenitiesModalVisible] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [types, amenitiesResult, surfaces, lightings, trackData] = await Promise.all([
                TrackController.fetchSportTypes(),
                TrackController.fetchAmenities(),
                TrackController.fetchSurfaceTypes(),
                TrackController.fetchLightingTypes(),
                TrackController.fetchTrackById(trackId)
            ]);

            setSportTypes(Array.isArray(types) ? types : []);
            setAvailableAmenities(amenitiesResult?.data || []);
            setSurfaceTypes(Array.isArray(surfaces) ? surfaces : []);
            setLightingTypes(Array.isArray(lightings) ? lightings : []);

            if (trackData) {
                setOriginalTrack(trackData);
                setTrackName(trackData.TrackName || '');
                setDescription(trackData.Description || '');
                setLength(trackData.Length_km ? trackData.Length_km.toString() : '');
                setDifficulty(trackData.Difficulty || null);
                setHasSeparateLanes(trackData.HasSeparateLanes == 1);
                setSelectedSurface(trackData.SurfaceTypeID || null);
                setSelectedLighting(trackData.LightingTypeID || null);
                setSelectedCategories(trackData.sportTypes?.map(s => s.SportTypeID) || []);
                setSelectedAmenityIds(trackData.amenities?.map(a => a.AmenityID) || []);

                let coords = [];
                if (typeof trackData.RoutePoints === 'string') {
                    try { coords = JSON.parse(trackData.RoutePoints); } catch (e) { }
                } else if (Array.isArray(trackData.RoutePoints)) {
                    coords = trackData.RoutePoints;
                }
                setRouteCoordinates(coords);
            } else {
                showError("Error", "Could not load track details.");
                navigation.goBack();
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (id) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const toggleAmenity = (id) => setSelectedAmenityIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const selectedAmenities = availableAmenities.filter(a => selectedAmenityIds.includes(a.AmenityID));

    const calculateChanges = () => {
        const changes = {};

        if (trackName !== originalTrack.TrackName) changes.TrackName = trackName;
        if (description !== originalTrack.Description) changes.Description = description;
        if (parseFloat(length) !== parseFloat(originalTrack.Length_km)) changes.Length_km = parseFloat(length);
        if (difficulty !== originalTrack.Difficulty) changes.Difficulty = difficulty;
        if ((hasSeparateLanes ? 1 : 0) !== originalTrack.HasSeparateLanes) changes.HasSeparateLanes = hasSeparateLanes ? 1 : 0;
        if (selectedSurface !== originalTrack.SurfaceTypeID) changes.SurfaceTypeID = selectedSurface;
        if (selectedLighting !== originalTrack.LightingTypeID) changes.LightingTypeID = selectedLighting;

        const coordsString = JSON.stringify(routeCoordinates);
        const originalCoordsString = typeof originalTrack.RoutePoints === 'string' ? originalTrack.RoutePoints : JSON.stringify(originalTrack.RoutePoints || []);
        if (coordsString !== originalCoordsString) changes.RoutePoints = coordsString;

        const arraysAreDifferent = (arr1, arr2) => {
            if (!arr1) arr1 = [];
            if (!arr2) arr2 = [];
            if (arr1.length !== arr2.length) return true;
            const sorted1 = [...arr1].map(String).sort();
            const sorted2 = [...arr2].map(String).sort();
            return sorted1.join(',') !== sorted2.join(',');
        };

        const originalSportIds = originalTrack.sportTypes?.map(s => s.SportTypeID || s.sportTypeID) || [];
        if (arraysAreDifferent(originalSportIds, selectedCategories)) {
            changes.sportTypes = selectedCategories;
        }

        const originalAmenityIds = originalTrack.amenities?.map(a => a.AmenityID || a.amenityID) || [];
        if (arraysAreDifferent(originalAmenityIds, selectedAmenityIds)) {
            changes.amenity_ids = selectedAmenityIds;
        }

        return changes;
    };

    const handleSubmit = async () => {
        if (!trackName.trim()) { showError('Missing Info', 'Please enter a track name'); return; }
        if (!description.trim()) { showError('Missing Info', 'Please enter a description'); return; }
        if (routeCoordinates.length === 0) { showError('Missing Info', 'Please set a route on the map!'); return; }

        const changes = calculateChanges();

        if (Object.keys(changes).length === 0) {
            showError("No Changes", "You haven't changed anything yet!");
            return;
        }

        setSubmitting(true);

        try {
            const result = await TrackController.submitEditRequest(trackId, user.UserID, changes);

            if (result.success) {
                showSuccess(
                    "Success! ✨",
                    result.message || "Your edit request has been sent."
                );

                setTimeout(() => {
                    navigation.goBack();
                }, 2000);
            } else {
                showError("Update Failed", result.message || "Something went wrong.");
            }
        } catch (error) {
            showError("Connection Error", "Could not reach the server. Please try again.");
            console.error("Submit Error:", error);
        } finally {
            setSubmitting(false);
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

    if (loading) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2E7D32" /></View>;
    }

    const isOwner = originalTrack?.UserID == user.UserID;

    return (
        <View style={styles.screen}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                scrollEnabled={isScrollEnabled}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Icon name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Suggest Edits</Text>
                    <View style={{ width: 40 }} />
                </View>

                {isOwner && (
                    <View style={styles.ownerBadge}>
                        <Icon name="verified-user" size={18} color="#2E7D32" />
                        <Text style={styles.ownerBadgeText}>You are the creator. Your edits will bypass admin review and apply instantly.</Text>
                    </View>
                )}

                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Track Route <Text style={styles.required}>*</Text></Text>
                        {routeCoordinates.length > 0 && (
                            <TouchableOpacity onPress={handleClearMap}>
                                <Text style={{ color: '#E53935', fontWeight: '600', fontSize: 13 }}>Redraw Route</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={{ color: '#888', fontSize: 12, marginBottom: 10 }}>Tap the map to edit the checkpoints.</Text>

                    <View style={{ height: 250, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' }}>
                        <OpenStreetMapView
                            markers={routeCoordinates}
                            setScrollEnabled={setIsScrollEnabled}
                            onMapPress={handleMapPress}
                        />
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
                        <Icon name="add-circle-outline" size={20} color="#2E7D32" />
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

                <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isOwner ? "Update Track Instantly" : "Submit Edit Suggestion"}</Text>}
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
    ownerBadge: { flexDirection: 'row', backgroundColor: '#E8F5E9', padding: 12, margin: 15, borderRadius: 10, borderWidth: 1, borderColor: '#A5D6A7', alignItems: 'center' },
    ownerBadgeText: { fontSize: 13, color: '#2E7D32', fontWeight: '600', marginLeft: 8, flex: 1 },
    section: { backgroundColor: '#fff', padding: 20, marginTop: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 14 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    required: { color: '#E53935' },
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

export default EditTrackScreen;