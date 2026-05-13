import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TrackController from '../../controllers/TrackController';
import OpenStreetMapView from '../../components/OpenStreetMapView';
import { showSuccess, showError } from '../../utils/ToastHelper';

const AdminTrackSuggestScreen = ({ navigation }) => {
    const [isScrollEnabled, setIsScrollEnabled] = useState(true);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const [sportTypes, setSportTypes] = useState([]);
    const [amenities, setAmenities] = useState([]);
    const [surfaceTypes, setSurfaceTypes] = useState([]);
    const [lightingTypes, setLightingTypes] = useState([]);

    useEffect(() => {
        loadPendingRequests();
    }, []);

    const loadPendingRequests = async () => {
        setLoading(true);
        try {
            const [types, amens, surfaces, lightings, result] = await Promise.all([
                TrackController.fetchSportTypes(),
                TrackController.fetchAmenities(),
                TrackController.fetchSurfaceTypes(),
                TrackController.fetchLightingTypes(),
                TrackController.getPendingEdits()
            ]);

            setSportTypes(Array.isArray(types) ? types : []);
            setAmenities(amens?.data || []);
            setSurfaceTypes(Array.isArray(surfaces) ? surfaces : []);
            setLightingTypes(Array.isArray(lightings) ? lightings : []);

            if (result && result.success) {
                setRequests(result.data || []);
            } else {
                showError("Error", result?.message || "Could not load pending requests.");
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleReview = async (requestId, action) => {
        setProcessingId(requestId);
        const result = await TrackController.reviewEditRequest(requestId, action);

        if (result.success) {
            showSuccess("Success", result.message);
            setRequests(prev => prev.filter(req => req.RequestID !== requestId));
        } else {
            showError("Error", result.message || "Failed to process request.");
        }
        setProcessingId(null);
    };

    const getSportNames = (ids) => {
        if (!ids || ids.length === 0) return "None";
        return ids.map(id => sportTypes.find(s => s.SportTypeID == id)?.SportName || id).join(', ');
    };

    const getAmenityNames = (ids) => {
        if (!ids || ids.length === 0) return "None";
        return ids.map(id => amenities.find(a => a.AmenityID == id)?.AmenityName || id).join(', ');
    };

    const getSurfaceName = (id) => surfaceTypes.find(s => s.SurfaceTypeID == id)?.SurfaceName || "Unknown";
    const getLightingName = (id) => lightingTypes.find(l => l.LightingTypeID == id)?.LightingName || "Unknown";

    const getDifficultyName = (val) => {
        if (val == 1) return 'Easy';
        if (val == 2) return 'Moderate';
        if (val == 3) return 'Hard';
        return 'Unknown';
    };

    const renderChangesList = (item) => {
        const changesObj = typeof item.ProposedChanges === 'string' ? JSON.parse(item.ProposedChanges) : item.ProposedChanges;
        const originalObj = item.OriginalTrack;

        if (!changesObj || Object.keys(changesObj).length === 0) return <Text style={styles.noChanges}>No changes detected.</Text>;

        return Object.entries(changesObj).map(([key, newValue]) => {
            let oldValue = originalObj ? originalObj[key] : null;
            let displayOld = oldValue;
            let displayNew = newValue;
            let prettyKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();

            const normalizedKey = key.toLowerCase();

            if (normalizedKey.includes('sport')) {
                prettyKey = "Categories";
                displayOld = getSportNames(oldValue);
                displayNew = getSportNames(newValue);
            } else if (normalizedKey.includes('amenit')) {
                prettyKey = "Amenities";
                displayOld = getAmenityNames(oldValue);
                displayNew = getAmenityNames(newValue);
            } else if (normalizedKey.includes('surface')) {
                prettyKey = "Surface";
                displayOld = getSurfaceName(oldValue);
                displayNew = getSurfaceName(newValue);
            } else if (normalizedKey.includes('lighting')) {
                prettyKey = "Lighting";
                displayOld = getLightingName(oldValue);
                displayNew = getLightingName(newValue);
            } else if (normalizedKey.includes('difficult')) {
                prettyKey = "Difficulty";
                displayOld = getDifficultyName(oldValue);
                displayNew = getDifficultyName(newValue);
            } else if (normalizedKey.includes('lane')) {
                prettyKey = "Separate Lanes";
                displayOld = oldValue == 1 ? 'Yes' : 'No';
                displayNew = newValue == 1 ? 'Yes' : 'No';
            } else if (normalizedKey.includes('length')) {
                prettyKey = "Length (km)";
            }

            if (normalizedKey.includes('route')) {
                let parsedNew = [];
                let parsedOld = [];

                try { parsedNew = typeof newValue === 'string' ? JSON.parse(newValue) : newValue; } catch (e) { }
                try { parsedOld = typeof oldValue === 'string' ? JSON.parse(oldValue) : oldValue; } catch (e) { }

                return (
                    <View key={key} style={styles.changeRowBlock}>
                        <Text style={styles.changeKey}>Map Route Change</Text>

                        {parsedOld && parsedOld.length > 0 && (
                            <View style={{ marginBottom: 12 }}>
                                <Text style={styles.mapLabelOld}>OLD ROUTE</Text>
                                <View style={[styles.mapPreviewContainer, { borderColor: '#FFCDD2' }]}>
                                    <OpenStreetMapView
                                        markers={parsedOld}
                                        setScrollEnabled={setIsScrollEnabled}
                                    />
                                </View>
                            </View>
                        )}

                        {parsedNew && parsedNew.length > 0 && (
                            <View>
                                <Text style={styles.mapLabelNew}>NEW SUGGESTED ROUTE</Text>
                                <View style={[styles.mapPreviewContainer, { borderColor: '#C8E6C9' }]}>
                                    <OpenStreetMapView
                                        markers={parsedNew}
                                        setScrollEnabled={setIsScrollEnabled}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                );
            }

            return (
                <View key={key} style={styles.changeRowBlock}>
                    <Text style={styles.changeKey}>{prettyKey}</Text>
                    <View style={styles.diffRow}>
                        <View style={styles.diffPillOld}>
                            <Text style={styles.diffTextOld}>{String(displayOld || 'None')}</Text>
                        </View>
                        <Icon name="arrow-forward" size={18} color="#999" style={{ marginHorizontal: 8 }} />
                        <View style={styles.diffPillNew}>
                            <Text style={styles.diffTextNew}>{String(displayNew || 'None')}</Text>
                        </View>
                    </View>
                </View>
            );
        });
    };

    const renderItem = ({ item }) => {
        const isProcessing = processingId === item.RequestID;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.trackName}>{item.TrackName}</Text>
                        <Text style={styles.userName}>Suggested by: {item.FirstName} {item.LastName}</Text>
                    </View>
                    <Text style={styles.dateText}>
                        {new Date(item.DateRequested).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.changesContainer}>
                    {renderChangesList(item)}
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.btn, styles.rejectBtn]}
                        onPress={() => handleReview(item.RequestID, 'reject')}
                        disabled={isProcessing}
                    >
                        <Icon name="close" size={20} color="#E53935" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.approveBtn]}
                        onPress={() => handleReview(item.RequestID, 'approve')}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Icon name="check" size={20} color="#fff" />
                                <Text style={styles.approveBtnText}>Approve Apply</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Track Edits</Text>
                <TouchableOpacity onPress={loadPendingRequests} style={styles.refreshBtn}>
                    <Icon name="refresh" size={24} color="#2E7D32" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}><ActivityIndicator size="large" color="#2E7D32" /></View>
            ) : requests.length === 0 ? (
                <View style={styles.centered}>
                    <Icon name="verified" size={60} color="#A5D6A7" />
                    <Text style={styles.emptyText}>You are all caught up!</Text>
                    <Text style={styles.emptySubText}>No pending edit requests.</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.RequestID.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={isScrollEnabled}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8f9fa' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
    refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
    listContainer: { padding: 16, paddingBottom: 50 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#eee' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 12, marginBottom: 12 },
    trackName: { fontSize: 18, fontWeight: '700', color: '#2E7D32', marginBottom: 4 },
    userName: { fontSize: 13, color: '#666', fontWeight: '500' },
    dateText: { fontSize: 12, color: '#999', fontWeight: '600' },
    changesContainer: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    noChanges: { color: '#999', fontStyle: 'italic' },

    changeRowBlock: { marginBottom: 14 },
    changeKey: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    diffRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    diffPillOld: { backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FFCDD2' },
    diffTextOld: { color: '#D32F2F', fontSize: 14, textDecorationLine: 'line-through', fontWeight: '500' },
    diffPillNew: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#C8E6C9' },
    diffTextNew: { color: '#2E7D32', fontSize: 14, fontWeight: '600' },

    mapLabelOld: { fontSize: 11, fontWeight: 'bold', color: '#D32F2F', marginBottom: 4 },
    mapLabelNew: { fontSize: 11, fontWeight: 'bold', color: '#2E7D32', marginBottom: 4 },
    mapPreviewContainer: { height: 160, borderRadius: 12, overflow: 'hidden', borderWidth: 2 },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1.5 },
    rejectBtn: { backgroundColor: '#FFF', borderColor: '#E53935' },
    rejectBtnText: { color: '#E53935', fontSize: 15, fontWeight: '700', marginLeft: 6 },
    approveBtn: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
    approveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginLeft: 6 },
    emptyText: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 16 },
    emptySubText: { fontSize: 15, color: '#666', marginTop: 8 },
});

export default AdminTrackSuggestScreen;