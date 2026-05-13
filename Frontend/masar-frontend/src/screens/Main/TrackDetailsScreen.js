import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, TextInput, Alert, Platform, Image, Modal, Linking, Dimensions, FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TrackController from '../../controllers/TrackController';
import FavouriteController from '../../controllers/FavouriteController';
import { useFocusEffect } from '@react-navigation/native';
import OpenStreetMapView from '../../components/OpenStreetMapView';
import * as ImagePicker from 'expo-image-picker';
import ReportController from '../../controllers/ReportController';
import { showSuccess, showError, showInfo } from '../../utils/ToastHelper';

import { useVideoPlayer, VideoView } from 'expo-video';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPORT_ICONS = {
    Walking: 'directions-walk', Cycling: 'directions-bike', Skating: 'skateboarding',
    Running: 'directions-run', Hiking: 'hiking',
};

const CATEGORY_COLORS = {
    'Facilities': { bg: '#E8F5E9', icon: '#4CAF50' },
    'Food & Drink': { bg: '#FFF3E0', icon: '#FF9800' },
    'Safety': { bg: '#FCE4EC', icon: '#E91E63' },
    'Sports': { bg: '#E3F2FD', icon: '#2196F3' },
};

const StarRating = ({ rating, size = 16 }) => (
    <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4, 5].map(i => (
            <Icon key={i} name={i <= rating ? 'star' : 'star-border'} size={size} color="#FFC107" />
        ))}
    </View>
);

const StarInput = ({ value, onChange }) => (
    <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4, 5].map(i => (
            <TouchableOpacity key={i} onPress={() => onChange(i)}>
                <Icon name={i <= value ? 'star' : 'star-border'} size={32} color="#FFC107" style={{ marginRight: 4 }} />
            </TouchableOpacity>
        ))}
    </View>
);

const DifficultyLabel = ({ level }) => {
    const labels = { 1: 'Easy', 2: 'Moderate', 3: 'Hard' };
    const colors = { 1: '#4CAF50', 2: '#FF9800', 3: '#F44336' };
    return (
        <View style={[styles.diffBadge, { backgroundColor: colors[level] || '#999' }]}>
            <Text style={styles.diffText}>{labels[level] || 'Unknown'}</Text>
        </View>
    );
};

const BASE_IMAGE_URL = 'http://100.73.77.3/masar-backend/public/';//change IP to your own

const MasarVideoPlayer = ({ url, isFullscreen, shouldPlay }) => {
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
            style={isFullscreen ? styles.fullScreenImage : [StyleSheet.absoluteFill, { borderRadius: 12 }]}
            nativeControls={isFullscreen}
            contentFit={isFullscreen ? "contain" : "cover"}
        />
    );
};

const TrackDetailsScreen = ({ navigation, route }) => {
    const [isScrollEnabled, setIsScrollEnabled] = useState(true);
    const { trackId, user } = route.params;
    const [track, setTrack] = useState(null);
    const [loading, setLoading] = useState(true);
    const [myRating, setMyRating] = useState(0);
    const [myReview, setMyReview] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);
    const [isFavourite, setIsFavourite] = useState(false);

    const [selectedMediaIndex, setSelectedMediaIndex] = useState(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportItem, setReportItem] = useState({ type: '', id: null });
    const [reportCategory, setReportCategory] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

    const getReportCategories = () => {
        return ['Spam', 'Inappropriate', 'Other'];
    };

    const handleAddMedia = async () => {
        if (!user) {
            Alert.alert("User Access Only", "Create an account to add your photos and videos to this track! ✨");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            quality: 0.8,
            videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
        });


        if (!result.canceled && result.assets.length > 0) {
            setUploadingMedia(true);
            try {
                await TrackController.addMediaToTrack(trackId, user.UserID, result.assets);
                showSuccess("Success!", "Your media has been added to the gallery.");
                loadTrack();
            } catch (error) {
                showError("Upload Failed", "There was an issue uploading your files.");
            } finally {
                setUploadingMedia(false);
            }
        }
    };

    const openReportModal = (itemType, itemId) => {
        if (!user) {
            Alert.alert("User Access Only", "Create an account to report content and keep the community safe! ✨");
            return;
        }
        setReportItem({ type: itemType, id: itemId });
        setReportCategory('');
        setReportDetails('');
        setReportModalVisible(true);
    };

    const submitReportForm = async () => {
        if (!reportCategory) {
            showError("Select Reason", "Please select a main reason for your report.");
            return;
        }

        setSubmittingReport(true);
        const fullReason = reportDetails ? `${reportCategory}: ${reportDetails}` : reportCategory;

        try {
            const result = await ReportController.submitReport(user.UserID, reportItem.type, reportItem.id, fullReason);

            if (result && result.success) {
                setReportModalVisible(false);
                showSuccess("Reported", "Thank you! Our team will review this shortly.");
            } else {
                showError("Backend Error", result?.message || "The server rejected the report.");
            }
        } catch (e) {
            showError("Network Error", "Could not reach the server. Check your terminal.");
        } finally {
            setSubmittingReport(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadTrack();
        }, [])
    );

    const loadTrack = async () => {
        setLoading(true);
        const data = await TrackController.fetchTrackById(trackId);
        setTrack(data);
        if (data?.ratings && user) {
            const existing = data.ratings.find(r => r.UserID == user.UserID);
            if (existing) {
                setMyRating(existing.RatingValue);
                setMyReview(existing.ReviewText || '');
            } else {
                setMyRating(0);
                setMyReview('');
            }
        }
        setLoading(false);
    };

    const handleSubmitRating = async () => {
        if (!user) {
            Alert.alert('Login Required', 'Please log in to rate tracks.');
            return;
        }
        if (myRating === 0) {
            showError('Select Rating', 'Please tap the stars to select a rating.');
            return;
        }
        setSubmittingRating(true);
        try {
            await TrackController.submitRating(trackId, user.UserID, myRating, myReview);
            showSuccess('Thank you!', 'Your rating has been submitted.');
            loadTrack();
        } catch (e) {
            showError('Error', 'Failed to submit rating.');
        } finally {
            setSubmittingRating(false);
        }
    };

    const handleDeleteRating = (ratingId) => {
        Alert.alert("Delete Review", "Are you sure you want to delete your review?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await TrackController.deleteRating(ratingId, user.UserID);
                        showSuccess("Deleted", "Your review has been removed.");
                        loadTrack();
                    } catch (e) {
                        showError("Error", "Could not delete review.");
                    }
                }
            }
        ]);
    };

    const handleNavigate = () => {
        if (routeCoords.length > 0) {
            const lat = routeCoords[0].latitude;
            const lng = routeCoords[0].longitude;
            const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

            Linking.openURL(mapUrl).catch(() => {
                showError("Oops", "Could not open Maps. Make sure you have a browser or maps app installed.");
            });
        } else {
            showError("Missing Data", "We don't have the exact GPS coordinates for this track.");
        }
    };

    useEffect(() => {
        const checkFav = async () => {
            if (user && trackId) {
                const favStatus = await FavouriteController.checkIfFavourite(user.UserID, trackId);
                setIsFavourite(favStatus);
            }
        };
        checkFav();
    }, [trackId, user]);

    const handleFavouritePress = async () => {
        if (!user) {
            Alert.alert("User Access Only", "Create an account to save your favorite tracks! ✨");
            return;
        }
        setIsFavourite(!isFavourite);
        const newState = await FavouriteController.toggleFavourite(user.UserID, trackId, isFavourite);
        setIsFavourite(newState);
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#2E7D32" /></View>;
    }
    if (!track) {
        return <View style={styles.centered}><Text>Track not found</Text></View>;
    }

    const sportTypes = track.sportTypes || [];
    const amenities = track.amenities || [];
    const ratings = track.ratings || [];
    const images = track.media || [];

    let routeCoords = [];
    if (track.RoutePoints) {
        try {
            routeCoords = JSON.parse(track.RoutePoints);
        } catch (e) {
            console.error("Failed to parse route points");
        }
    } else if (track.Latitude && track.Longitude) {
        routeCoords = [{ latitude: parseFloat(track.Latitude), longitude: parseFloat(track.Longitude) }];
    }
    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{track.TrackName}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => openReportModal('track', track.TrackID)} style={{ padding: 8 }}>
                        <Icon name="flag" size={24} color="#ccc" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleFavouritePress} style={{ padding: 8 }}>
                        <Icon
                            name={isFavourite ? "favorite" : "favorite-border"}
                            size={28}
                            color={isFavourite ? "#E53935" : "#666"}
                        />
                    </TouchableOpacity>
                    {user && (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => navigation.navigate('EditTrack', { trackId: track.TrackID, user })}
                        >
                            <Icon name="edit" size={20} color="#fff" />
                            <Text style={styles.editButtonText}>Suggest Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={isScrollEnabled}>
                {routeCoords.length > 0 && (
                    <View style={styles.mapSection}>
                        <View style={styles.mapContainer}>
                            <OpenStreetMapView markers={routeCoords} readOnly={true} hidePins={true}
                                setScrollEnabled={setIsScrollEnabled}
                            />
                        </View>

                        <TouchableOpacity style={styles.navigateBtn} activeOpacity={0.8} onPress={handleNavigate}>
                            <Icon name="directions" size={20} color="#fff" />
                            <Text style={styles.navigateBtnText}>Navigate to Start</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 10 }}>
                    <Text style={[styles.sectionTitle, { marginBottom: 0, marginTop: 0 }]}>Gallery</Text>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
                        onPress={handleAddMedia}
                        disabled={uploadingMedia}
                    >
                        {uploadingMedia ? (
                            <ActivityIndicator size="small" color="#2E7D32" />
                        ) : (
                            <>
                                <Icon name="add-a-photo" size={16} color="#2E7D32" style={{ marginRight: 6 }} />
                                <Text style={{ color: '#2E7D32', fontWeight: '700', fontSize: 13 }}>Add Media</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {images.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.galleryContainer}
                    >
                        {images.map((mediaItem, index) => {
                            const fullUrl = `${BASE_IMAGE_URL}${mediaItem.FilePath}`;
                            const isVideo = mediaItem.MediaType === 'video' || fullUrl.toLowerCase().endsWith('.mp4') || fullUrl.toLowerCase().endsWith('.mov');

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.imageWrapper}
                                    activeOpacity={0.8}
                                    onPress={() => setSelectedMediaIndex(index)}
                                >
                                    {isVideo ? (
                                        <View style={styles.trackPhoto} pointerEvents="none">

                                            <MasarVideoPlayer url={fullUrl} isFullscreen={false} shouldPlay={false} />

                                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 }}>
                                                <Icon name="play-circle-outline" size={50} color="#fff" />
                                            </View>
                                        </View>
                                    ) : (
                                        <Image source={{ uri: fullUrl }} style={styles.trackPhoto} resizeMode="cover" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                ) : (
                    <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                        <Text style={{ color: '#888', fontStyle: 'italic' }}>No media yet. Be the first to add some! ✨</Text>
                    </View>
                )}

                <View style={styles.body}>
                    <Text style={styles.trackName}>{track.TrackName}</Text>
                    <View style={styles.metaRow}>
                        <Icon name="place" size={16} color="#888" />
                        <Text style={styles.metaText}>{track.City}{track.Country ? `, ${track.Country}` : ''}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <StarRating rating={track.Rating || 0} />
                        <Text style={styles.ratingCount}> ({ratings.length} review{ratings.length !== 1 ? 's' : ''})</Text>
                    </View>

                    <View style={styles.statsRow}>
                        {track.Length_km && (
                            <View style={styles.statBox}>
                                <Icon name="straighten" size={20} color="#2E7D32" />
                                <Text style={styles.statValue}>{track.Length_km} km</Text>
                                <Text style={styles.statLabel}>Length</Text>
                            </View>
                        )}
                        {track.Difficulty && (
                            <View style={styles.statBox}>
                                <Icon name="signal-cellular-alt" size={20} color="#FF9800" />
                                <DifficultyLabel level={track.Difficulty} />
                                <Text style={styles.statLabel}>Difficulty</Text>
                            </View>
                        )}
                        {track.SurfaceName && (
                            <View style={styles.statBox}>
                                <Icon name="layers" size={20} color="#9C27B0" />
                                <Text style={styles.statValue}>{track.SurfaceName}</Text>
                                <Text style={styles.statLabel}>Surface</Text>
                            </View>
                        )}
                        {track.LightingName && (
                            <View style={styles.statBox}>
                                <Icon name="lightbulb" size={20} color="#FFC107" />
                                <Text style={styles.statValue}>{track.LightingName}</Text>
                                <Text style={styles.statLabel}>Lighting</Text>
                            </View>
                        )}
                        {track.HasSeparateLanes == 1 && (
                            <View style={styles.statBox}>
                                <Icon name="alt-route" size={20} color="#2196F3" />
                                <View style={styles.laneBadge}>
                                    <Text style={styles.laneText}>Dedicated</Text>
                                </View>
                                <Text style={styles.statLabel}>Lanes</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.hostChallengeBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                            if (!user) {
                                Alert.alert("User Access Only", "Create a free account to host challenges and compete with the community! 🏆");
                                return;
                            }
                            navigation.navigate('Challenges', {
                                user, trackId: track.TrackID, trackName: track.TrackName, openCreate: true
                            });
                        }}
                    >
                        <View style={styles.hostChallengeIcon}>
                            <Icon name="emoji-events" size={24} color="#FF9800" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.hostChallengeTitle}>Host a Challenge</Text>
                            <Text style={styles.hostChallengeSub}>Invite the community to compete here!</Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#FF9800" />
                    </TouchableOpacity>

                    {track.Description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About</Text>
                            <Text style={styles.description}>{track.Description}</Text>
                        </View>
                    )}

                    {track.FirstName && (
                        <View style={styles.submittedBy}>
                            <View style={styles.avatarSmall}>
                                <Text style={styles.avatarSmallText}>{track.FirstName[0]}{track.LastName?.[0] || ''}</Text>
                            </View>
                            <Text style={styles.submittedText}>Submitted by {track.FirstName} {track.LastName}</Text>
                        </View>
                    )}

                    {sportTypes.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Sports</Text>
                            <View style={styles.chipsRow}>
                                {sportTypes.map(s => (
                                    <View key={s.SportTypeID} style={styles.sportChip}>
                                        <Icon name={SPORT_ICONS[s.SportName] || 'sports'} size={16} color="#2E7D32" />
                                        <Text style={styles.sportChipText}>{s.SportName}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {amenities.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Amenities</Text>
                            <View style={styles.chipsRow}>
                                {amenities.map(a => {
                                    const c = CATEGORY_COLORS[a.Category] || { bg: '#f5f5f5', icon: '#666' };
                                    return (
                                        <View key={a.AmenityID} style={[styles.amenityChip, { backgroundColor: c.bg }]}>
                                            <Icon name={a.AmenityIcon} size={16} color={c.icon} />
                                            <Text style={[styles.amenityChipText, { color: c.icon }]}>
                                                {a.AmenityName}<Text style={{ fontSize: 2 }}>   {' '}   </Text>
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {user && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Rate this Track</Text>
                            <View style={styles.rateBox}>
                                <StarInput value={myRating} onChange={setMyRating} />
                                <TextInput
                                    style={styles.reviewInput}
                                    placeholder="Write a review (optional)"
                                    placeholderTextColor="#aaa"
                                    value={myReview}
                                    onChangeText={setMyReview}
                                    multiline
                                    numberOfLines={3}
                                />
                                <TouchableOpacity style={styles.submitRatingBtn} onPress={handleSubmitRating} disabled={submittingRating}>
                                    {submittingRating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitRatingText}>Submit Rating</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {ratings.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Reviews ({ratings.length})</Text>
                            {ratings.map(r => (
                                <View key={r.RatingID} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.avatarTiny}>
                                            <Text style={styles.avatarTinyText}>{r.FirstName?.[0]}{r.LastName?.[0]}</Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={styles.reviewerName}>{r.FirstName} {r.LastName}</Text>
                                            <StarRating rating={r.RatingValue} size={12} />
                                        </View>
                                        <Text style={styles.reviewDate}>{new Date(r.DatePosted).toLocaleDateString()}</Text>

                                        {user?.UserID == r.UserID ? (
                                            <TouchableOpacity
                                                style={{ marginLeft: 12, padding: 4 }}
                                                onPress={() => handleDeleteRating(r.RatingID)}
                                            >
                                                <Icon name="delete-outline" size={18} color="#E53935" />
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={{ marginLeft: 12, padding: 4 }}
                                                onPress={() => openReportModal('rating', r.RatingID)}
                                            >
                                                <Icon name="flag" size={18} color="#ccc" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {r.ReviewText && <Text style={styles.reviewText}>{r.ReviewText}</Text>}
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>

            <Modal visible={selectedMediaIndex !== null} transparent={true} animationType="fade">
                <View style={styles.fullScreenContainer}>
                    <View style={styles.fullScreenHeader}>
                        <TouchableOpacity
                            style={styles.fullScreenActionBtn}
                            onPress={() => {
                                if (selectedMediaIndex === null) return;
                                const currentItem = images[selectedMediaIndex];
                                const mediaId = currentItem.MediaID || currentItem.mediaID || currentItem.id;

                                setSelectedMediaIndex(null);
                                setTimeout(() => openReportModal('media', mediaId), 600);
                            }}
                        >
                            <Icon name="flag" size={28} color="#E53935" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.fullScreenActionBtn} onPress={() => setSelectedMediaIndex(null)}>
                            <Icon name="close" size={32} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        initialScrollIndex={selectedMediaIndex}
                        getItemLayout={(data, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                        onMomentumScrollEnd={(e) => {
                            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                            setSelectedMediaIndex(newIndex);
                        }}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item, index }) => {
                            const fullUrl = `${BASE_IMAGE_URL}${item.FilePath}`;
                            const isVideo = item.MediaType === 'video' || fullUrl.toLowerCase().endsWith('.mp4') || fullUrl.toLowerCase().endsWith('.mov');

                            return (
                                <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                                    {isVideo ? (
                                        <MasarVideoPlayer url={fullUrl} isFullscreen={true} shouldPlay={selectedMediaIndex === index} />
                                    ) : (
                                        <Image
                                            source={{ uri: fullUrl }}
                                            style={styles.fullScreenImage}
                                            resizeMode="contain"
                                        />
                                    )}
                                </View>
                            );
                        }}
                    />
                </View>
            </Modal>

            <Modal visible={reportModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Report Content</Text>
                            <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                            <Text style={styles.modalLabel}>What's wrong? <Text style={styles.required}>*</Text></Text>
                            <View style={styles.chipRow}>
                                {getReportCategories().map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.reportChip, reportCategory === cat && styles.reportChipActive]}
                                        onPress={() => setReportCategory(cat)}
                                    >
                                        <Text style={[styles.reportChipText, reportCategory === cat && { color: '#fff' }]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.modalLabel}>Additional Details</Text>
                            <TextInput
                                style={styles.reportInput}
                                placeholder="Tell us exactly what's wrong..."
                                placeholderTextColor="#aaa"
                                value={reportDetails}
                                onChangeText={setReportDetails}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />

                            <TouchableOpacity
                                style={[styles.submitReportBtn, !reportCategory && { backgroundColor: '#ddd' }]}
                                onPress={submitReportForm}
                                disabled={submittingReport || !reportCategory}
                            >
                                {submittingReport ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitReportBtnText}>Submit Report</Text>}
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8f9fa' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#222', textAlign: 'center' },

    mapSection: { paddingBottom: 10 }, mapContainer: { height: 250 },
    navigateBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1976D2', paddingVertical: 14, borderRadius: 12, marginHorizontal: 20, marginTop: -20, shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 6
    },
    navigateBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 8 },
    galleryContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5, gap: 12 },
    imageWrapper: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    trackPhoto: { width: 280, height: 180, borderRadius: 12, backgroundColor: '#eee' },
    body: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },
    trackName: { fontSize: 24, fontWeight: '800', color: '#222', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    metaText: { fontSize: 14, color: '#888', marginLeft: 4 },
    ratingCount: { fontSize: 13, color: '#888' },
    statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 13, fontWeight: '700', color: '#333', marginTop: 4 },
    statLabel: { fontSize: 10, color: '#999', marginTop: 2 },
    diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
    diffText: { fontSize: 11, color: '#fff', fontWeight: '700', includeFontPadding: false, paddingRight: 4 },
    laneBadge: { backgroundColor: '#2196F3', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
    laneText: { fontSize: 9, color: '#fff', fontWeight: '700', includeFontPadding: false, paddingRight: 4 },
    section: { marginTop: 20 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 10 },
    description: { fontSize: 14, color: '#555', lineHeight: 22 },
    submittedBy: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
    avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    avatarSmallText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    submittedText: { fontSize: 14, color: '#555' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
    sportChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, marginBottom: 8 },
    sportChipText: { fontSize: 13, color: '#2E7D32', fontWeight: '600', marginLeft: 5, includeFontPadding: false, paddingRight: 4 },
    amenityChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, marginBottom: 8, flexShrink: 0 },
    amenityChipText: { fontSize: 13, fontWeight: '600', marginLeft: 5, includeFontPadding: false, paddingRight: 4 },
    rateBox: { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center' },
    reviewInput: { width: '100%', backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, marginTop: 12, fontSize: 14, color: '#333', textAlignVertical: 'top', minHeight: 70 },
    submitRatingBtn: { backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, marginTop: 12 },
    submitRatingText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
    reviewHeader: { flexDirection: 'row', alignItems: 'center' },
    avatarTiny: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
    avatarTinyText: { color: '#2E7D32', fontWeight: '700', fontSize: 11 },
    reviewerName: { fontSize: 14, fontWeight: '600', color: '#333' },
    reviewDate: { fontSize: 11, color: '#aaa' },
    reviewText: { fontSize: 13, color: '#555', marginTop: 8, lineHeight: 20 },

    fullScreenContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    fullScreenImage: { width: '100%', height: '100%' },
    fullScreenHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
    fullScreenActionBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },

    hostChallengeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', padding: 16, borderRadius: 14, marginTop: 16, marginBottom: 8, borderWidth: 1, borderColor: '#FFE0B2' },
    hostChallengeIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFE0B2', justifyContent: 'center', alignItems: 'center' },
    hostChallengeTitle: { fontSize: 16, fontWeight: '800', color: '#E65100' },
    hostChallengeSub: { fontSize: 12, color: '#F57C00', marginTop: 2 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#222' },
    modalBody: { padding: 20 },
    modalLabel: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12, marginTop: 10 },
    required: { color: '#E53935' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    reportChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
    reportChipActive: { backgroundColor: '#E53935', borderColor: '#E53935' },
    reportChipText: { fontSize: 12, fontWeight: '600', color: '#555', paddingRight: 4 },
    reportInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, backgroundColor: '#fafafa', color: '#222', minHeight: 100 },
    submitReportBtn: { backgroundColor: '#E53935', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    submitReportBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default TrackDetailsScreen;