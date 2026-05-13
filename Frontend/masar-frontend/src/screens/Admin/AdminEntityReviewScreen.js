import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView, Platform, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AdminController from '../../controllers/AdminController';
import React, { useState, useEffect } from 'react';
import { showSuccess, showError, showInfo } from '../../utils/ToastHelper';

import { useVideoPlayer, VideoView } from 'expo-video';

const BASE_IMAGE_URL = 'http://100.73.77.3/masar-backend/public/';//change IP to your own


const AdminVideoPlayer = ({ url, isFullscreen, shouldPlay }) => {
    const player = useVideoPlayer(url, p => {
        p.loop = true;
        p.muted = !isFullscreen;
        if (shouldPlay) p.play();
    });

    useEffect(() => {
        if (shouldPlay) player.play();
        else player.pause();
    }, [shouldPlay, player]);

    return (
        <VideoView
            player={player}
            style={isFullscreen ? styles.fullScreenMedia : [StyleSheet.absoluteFill, { borderRadius: 8 }]}
            nativeControls={isFullscreen}
            contentFit={isFullscreen ? "contain" : "cover"}
        />
    );
};

const AdminEntityReviewScreen = ({ navigation, route }) => {
    const { user, report } = route.params;
    const [entityData, setEntityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [fullscreenVisible, setFullscreenVisible] = useState(false);

    useEffect(() => {
        loadEntityDetails();
    }, []);

    const loadEntityDetails = async () => {
        try {
            const result = await AdminController.getReportedItem(user.UserID, report.ItemType, report.ItemID);
            if (result.success && result.data) {
                setEntityData(result.data);
            } else {
                showError("Notice", "This item may have already been deleted.");
            }
        } catch (error) {
            showError("Error", "Could not load evidence.");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (action) => {
        const actionText = action === 'delete' ? 'Nuke Entity' : 'Dismiss Report';

        Alert.alert(
            actionText,
            `Are you sure you want to ${action === 'delete' ? 'permanently delete this item' : 'dismiss this report'}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: action === 'delete' ? "Delete" : "Dismiss",
                    style: action === 'delete' ? "destructive" : "default",
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            const result = await AdminController.moderateItem(user.UserID, report.ReportID, action, report.ItemType, report.ItemID);

                            if (result.success) {
                                const successMsg = action === 'delete' ? 'Target successfully removed from the database.' : 'Report dismissed. 🧹';
                                showSuccess("Action Recorded", successMsg);

                                setTimeout(() => {
                                    navigation.goBack();
                                }, 300);

                            } else {
                                showError("Action Failed", result.message);
                            }
                        } catch (error) {
                            showError("System Error", "Something went wrong. Try again.");
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderEvidence = () => {
        if (!entityData) return <Text style={styles.errorText}>No evidence found.</Text>;

        switch (report.ItemType) {
            case 'media':
                const fullImageUrl = `${BASE_IMAGE_URL}${entityData.FilePath}`;
                const isVideo = entityData.MediaType === 'video' || fullImageUrl.toLowerCase().endsWith('.mp4') || fullImageUrl.toLowerCase().endsWith('.mov');

                return (
                    <View style={styles.evidenceBox}>
                        <TouchableOpacity activeOpacity={0.8} onPress={() => setFullscreenVisible(true)}>
                            {isVideo ? (
                                <View style={styles.mediaImage}>
                                    <AdminVideoPlayer url={fullImageUrl} isFullscreen={false} shouldPlay={false} />
                                    <View style={styles.playOverlay}>
                                        <Icon name="play-circle-outline" size={50} color="#fff" />
                                    </View>
                                </View>
                            ) : (
                                <Image source={{ uri: fullImageUrl }} style={styles.mediaImage} resizeMode="cover" />
                            )}
                        </TouchableOpacity>
                        <Text style={styles.infoText}>Uploaded by: {entityData.FirstName} {entityData.LastName}</Text>
                        <Text style={styles.infoText}>Track: {entityData.TrackName}</Text>
                    </View>
                );
            case 'rating':
                return (
                    <View style={styles.evidenceBox}>
                        <Text style={styles.ratingStars}>⭐ {entityData.RatingValue} / 5</Text>
                        <Text style={styles.reviewText}>"{entityData.ReviewText}"</Text>
                        <Text style={styles.infoText}>By: {entityData.FirstName} {entityData.LastName}</Text>
                        <Text style={styles.infoText}>Track: {entityData.TrackName}</Text>
                    </View>
                );
            case 'track':
                return (
                    <View style={styles.evidenceBox}>
                        <Text style={styles.titleText}>{entityData.TrackName}</Text>
                        <Text style={styles.infoText}>Length: {entityData.Length_km} km</Text>
                        <Text style={styles.descText}>{entityData.Description || "No description provided."}</Text>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginTop: 16, justifyContent: 'center' }}
                            onPress={() => navigation.navigate('TrackDetails', { trackId: report.ItemID, user })}
                        >
                            <Icon name="map" size={18} color="#2E7D32" />
                            <Text style={{ color: '#2E7D32', fontWeight: '700', marginLeft: 8 }}>View Track</Text>
                        </TouchableOpacity>

                    </View>
                );
            case 'challenge':
                return (
                    <View style={styles.evidenceBox}>
                        <Text style={styles.titleText}>{entityData.Field}</Text>
                        <Text style={styles.infoText}>Type: {entityData.Type}</Text>
                        <Text style={styles.infoText}>Track: {entityData.TrackName}</Text>
                        <Text style={styles.infoText}>Host: {entityData.FirstName} {entityData.LastName}</Text>
                    </View>
                );
            default:
                return <Text>Unknown item type.</Text>;
        }
    };

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Evidence Room</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.body}>
                <View style={styles.reportContextBox}>
                    <Text style={styles.sectionTitle}>Report Context</Text>
                    <Text style={styles.reasonText}>"{report.Reason}"</Text>
                    <Text style={styles.reporterText}>Reported by: {report.FirstName} {report.LastName}</Text>
                </View>

                <Text style={styles.sectionTitle}>The Evidence ({report.ItemType.toUpperCase()})</Text>

                {loading ? <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 20 }} /> : renderEvidence()}

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.dismissBtn]}
                        onPress={() => handleAction('dismiss')}
                        disabled={actionLoading}
                    >
                        <Icon name="visibility-off" size={20} color="#555" />
                        <Text style={styles.dismissText}>Dismiss Report</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleAction('delete')}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : (
                            <>
                                <Icon name="delete-forever" size={20} color="#fff" />
                                <Text style={styles.deleteText}>Nuke Entity</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={fullscreenVisible} transparent={true} animationType="fade">
                <View style={styles.fullScreenContainer}>
                    <TouchableOpacity style={styles.fullScreenCloseBtn} onPress={() => setFullscreenVisible(false)}>
                        <Icon name="close" size={32} color="#fff" />
                    </TouchableOpacity>

                    {entityData && report.ItemType === 'media' && (
                        (entityData.MediaType === 'video' || entityData.FilePath.toLowerCase().endsWith('.mp4') || entityData.FilePath.toLowerCase().endsWith('.mov')) ? (
                            <AdminVideoPlayer url={`${BASE_IMAGE_URL}${entityData.FilePath}`} isFullscreen={true} shouldPlay={true} />
                        ) : (
                            <Image
                                source={{ uri: `${BASE_IMAGE_URL}${entityData.FilePath}` }}
                                style={styles.fullScreenMedia}
                                resizeMode="contain"
                            />
                        )
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 16, backgroundColor: '#222' },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFD700' },
    body: { padding: 20 },
    reportContextBox: { backgroundColor: '#FFEBEE', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FFCDD2' },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#555', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 },
    reasonText: { fontSize: 18, fontWeight: '600', color: '#D32F2F', marginBottom: 8, fontStyle: 'italic' },
    reporterText: { fontSize: 13, color: '#888' },
    evidenceBox: { backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, marginBottom: 30 },
    mediaImage: { width: '100%', height: 250, borderRadius: 8, marginBottom: 12 },
    ratingStars: { fontSize: 20, fontWeight: '800', color: '#FFB300', marginBottom: 8 },
    reviewText: { fontSize: 16, color: '#333', fontStyle: 'italic', marginBottom: 12 },
    titleText: { fontSize: 20, fontWeight: '800', color: '#222', marginBottom: 8 },
    descText: { fontSize: 15, color: '#666', marginTop: 8, lineHeight: 22 },
    infoText: { fontSize: 14, color: '#555', marginBottom: 4, fontWeight: '500' },
    actionRow: { flexDirection: 'column', gap: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
    dismissBtn: { backgroundColor: '#eee', borderWidth: 1, borderColor: '#ddd' },
    dismissText: { color: '#555', fontWeight: '800', fontSize: 16, marginLeft: 8 },
    deleteBtn: { backgroundColor: '#D32F2F' },
    deleteText: { color: '#fff', fontWeight: '800', fontSize: 16, marginLeft: 8 },
    playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8 },
    fullScreenContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    fullScreenCloseBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    fullScreenMedia: { width: '100%', height: '100%' }
});

export default AdminEntityReviewScreen;