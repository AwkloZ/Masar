import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, Modal, TextInput, ScrollView,
    Platform,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location'; 
import ChallengeController from '../../controllers/ChallengeController';
import ChallengeModel from '../../models/ChallengeModel';
import AuthController from '../../controllers/AuthController';
import ReportController from '../../controllers/ReportController';
import { showSuccess, showError, showInfo } from '../../utils/ToastHelper'; 
import Toast from 'react-native-toast-message';
const TYPE_COLORS = {
    speed: { bg: '#FFF3E0', icon: '#FF9800', ic: 'speed' },
    distance: { bg: '#E3F2FD', icon: '#2196F3', ic: 'straighten' },
    endurance: { bg: '#FCE4EC', icon: '#E91E63', ic: 'fitness-center' },
};

const GENDER_CONFIG = {
    any: { label: 'All Genders', icon: 'people', color: '#2196F3', bg: '#E3F2FD' },
    male: { label: 'Male Only', icon: 'man', color: '#1565C0', bg: '#E8EAF6' },
    female: { label: 'Female Only', icon: 'woman', color: '#AD1457', bg: '#FCE4EC' },
};

const formatDateTime = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return (
        d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
        ' · ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );
};

const ChallengeCard = ({ item, user, myChallengeIds, onJoin, onUnjoin, onDelete, onReport, onViewTrack }) => {
    const tc = TYPE_COLORS[item.Type] || TYPE_COLORS.speed;
    const gc = GENDER_CONFIG[item.GenderPreference] || GENDER_CONFIG.any;
    const isCreator = item.CreatorID == user?.UserID;
    const alreadyJoined = myChallengeIds.includes(item.ChallengeID);
    const dateStr = formatDateTime(item.ScheduledAt);

    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={[styles.typeIcon, { backgroundColor: tc.bg }]}>
                    <Icon name={tc.ic} size={24} color={tc.icon} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardField} numberOfLines={2}>{item.Field}</Text>
                    <Text style={styles.cardMeta}>
                        📍 {item.City || 'Unknown City'}
                    </Text>
                    <Text style={styles.cardMeta}>
                        {item.TrackName || 'Track'}
                        {item.SportName ? ` · ${item.SportName}` : ''}
                        {` · ${item.Type}`}
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={[styles.genderBadge, { backgroundColor: gc.bg }]}>
                        <Icon name={gc.icon} size={13} color={gc.color} />
                        <Text style={[styles.genderBadgeText, { color: gc.color }]}>{gc.label}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        {!isCreator && (
                            <TouchableOpacity onPress={() => onReport(item.ChallengeID)}>
                                <Icon name="flag" size={18} color="#D32F2F" />
                            </TouchableOpacity>
                        )}
                        {isCreator && (
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.ChallengeID)}>
                                <Icon name="delete-outline" size={18} color="#E53935" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {dateStr && (
                <View style={styles.dateRow}>
                    <Icon name="event" size={14} color="#888" />
                    <Text style={styles.dateText}>{dateStr}</Text>
                </View>
            )}

            <View style={styles.cardStats}>
                <View style={styles.cardStat}>
                    <Icon name="people" size={15} color="#888" />
                    <Text style={styles.cardStatText}>{item.ParticipantCount || 0} joined</Text>
                </View>
                <View style={styles.cardStat}>
                    <Icon name="person" size={15} color="#888" />
                    <Text style={styles.cardStatText}>by {item.CreatorName || 'Unknown'}</Text>
                </View>
            </View>

            <View style={styles.cardActionRow}>

                <TouchableOpacity style={styles.viewTrackBtn} onPress={() => onViewTrack(item.TrackID)}>
                    <Icon name="map" size={18} color="#2E7D32" />
                    <Text style={styles.viewTrackBtnText}>View Track</Text>
                </TouchableOpacity>

                <View>
                    {isCreator ? (
                        <View style={styles.creatorBadge}>
                            <Icon name="star" size={16} color="#FF9800" />
                            <Text style={styles.creatorBadgeText} numberOfLines={1}>Your Challenge</Text>
                        </View>
                    ) : alreadyJoined ? (
                        <View style={styles.joinedRow}>
                            <View style={styles.joinedBadge}>
                                <Icon name="check-circle" size={16} color="#4CAF50" />
                                <Text style={styles.joinedText}>Joined</Text>
                            </View>
                            <TouchableOpacity style={styles.unjoinBtn} onPress={() => onUnjoin(item.ChallengeID)}>
                                <Text style={styles.unjoinBtnText}>Leave</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.joinBtn} onPress={() => onJoin(item.ChallengeID)}>
                            <Icon name="add" size={18} color="#fff" />
                            <Text style={styles.joinBtnText}>Join</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const ChallengesScreen = ({ navigation, route }) => {
    const initialTab = route.params?.initialTab || 'all';
    const [user, setUser] = useState(route.params?.user || null);

    const [userCity, setUserCity] = useState(null);

    const [challenges, setChallenges] = useState([]);
    const [myChallenges, setMyChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(initialTab);

    const [sportTypes, setSportTypes] = useState([]);
    const [sportTypesLoading, setSportTypesLoading] = useState(false);

    const [createVisible, setCreateVisible] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [challengeField, setChallengeField] = useState('');
    const [challengeType, setChallengeType] = useState('speed');
    const [genderPref, setGenderPref] = useState('any');
    const [selectedSportType, setSelectedSportType] = useState(null);
    const [scheduledAt, setScheduledAt] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('date');
    const [creating, setCreating] = useState(false);

    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportItem, setReportItem] = useState({ type: '', id: null });
    const [reportCategory, setReportCategory] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

    useEffect(() => {
        if (route.params?.openCreate && route.params?.trackId) {
            setSelectedTrack(route.params.trackId);
            setCreateVisible(true);
            navigation.setParams({ openCreate: undefined });
        }
    }, [route.params?.openCreate, route.params?.trackId]);

    useFocusEffect(
        useCallback(() => {
            if (route.params?.initialTab === 'mine') setTab('mine');
            loadData();
        }, [route.params?.initialTab])
    );

    const loadSportTypes = async () => {
        setSportTypesLoading(true);
        try {
            const res = await ChallengeModel.getSportTypes();
            const data = res.data?.data || [];
            if (data.length > 0) {
                setSportTypes(data);
            } else {
                setSportTypes([
                    { SportTypeID: 1, SportName: 'Cycling' }, { SportTypeID: 2, SportName: 'Skating' },
                    { SportTypeID: 3, SportName: 'Running' }, { SportTypeID: 4, SportName: 'Walking' },
                    { SportTypeID: 5, SportName: 'Skateboarding' }, { SportTypeID: 6, SportName: 'Mountain Biking' },
                ]);
            }
        } catch (e) {
            console.warn('Sport types fetch failed, using fallback:', e.message);
            setSportTypes([
                { SportTypeID: 1, SportName: 'Cycling' }, { SportTypeID: 2, SportName: 'Skating' },
                { SportTypeID: 3, SportName: 'Running' }, { SportTypeID: 4, SportName: 'Walking' },
                { SportTypeID: 5, SportName: 'Skateboarding' }, { SportTypeID: 6, SportName: 'Mountain Biking' },
            ]);
        } finally {
            setSportTypesLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            let currentCity = 'Unknown';

            if (status === 'granted') {
                try {
                    let location = await Location.getLastKnownPositionAsync({});

                    if (!location) {
                        location = await Location.getCurrentPositionAsync({
                            accuracy: Location.Accuracy.Lowest 
                        });
                    }

                    const lat = location.coords.latitude;
                    const lon = location.coords.longitude;

                    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                    const place = await response.json();

                    if (place) {
                        currentCity = place.city || place.locality || place.principalSubdivision || 'Unknown';
                    }
                } catch (geoError) {
                    console.log("Geocode failed, but the app won't crash:", geoError);
                    currentCity = 'Unknown';
                }
            }
            setUserCity(currentCity);

            let u = user;
            if (!u) {
                u = await AuthController.getStoredUser();
                setUser(u);
            }
            const [all, mine] = await Promise.all([
                ChallengeController.fetchAll(u?.UserID),
                u ? ChallengeController.fetchUserChallenges(u.UserID) : [],
            ]);

            const filterByLocalCity = (list) => {
                return list.filter(c => c.City && c.City.toLowerCase() === currentCity.toLowerCase());
            };

            setChallenges(filterByLocalCity(all));
            setMyChallenges(filterByLocalCity(mine));

        } catch (error) {
            console.error("Data load failed:", error);
        } finally {
            setLoading(false);
            loadSportTypes();
        }
    };

    const myChallengeIds = myChallenges.map(c => c.ChallengeID);

    const handleJoin = async (challengeId) => {
        if (!user) { ('Login Required', 'Please log in to join challenges.'); return; }
        try {
            const result = await ChallengeController.joinChallenge(challengeId, user.UserID);
            if (result.success) {
                showSuccess('Joined!', 'You have joined the challenge.');
                loadData();
            } else {
                showError('Cannot Join', result.message || 'Could not join this challenge.');
            }
        } catch (e) {
            showError('Error', 'Failed to join challenge.');
        }
    };

    const handleUnjoin = (challengeId) => {
        Alert.alert('Leave Challenge', 'Are you sure you want to leave this challenge?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Leave',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const result = await ChallengeController.unjoinChallenge(challengeId, user.UserID);

                        if (result.success) {
                            showSuccess('Challenge Left', 'You have successfully left the challenge.');
                            loadData(); 
                        } else {
                            showError('Error', result.message || 'Could not leave challenge.');
                        }
                    } catch (error) {
                       
                        showError('System Error', 'Something went wrong. Please check your connection.');
                    }
                },
            },
        ]);
    };

    const handleDelete = (challengeId) => {
        Alert.alert(
            'Delete Challenge',
            'Are you sure you want to delete this challenge? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        const result = await ChallengeController.deleteChallenge(challengeId, user.UserID);
                        if (result.success) { showSuccess('Deleted', 'Challenge has been deleted.'); loadData(); }
                        else showError('Error', result.message || 'Could not delete challenge.');
                    },
                },
            ]
        );
    };

    const resetCreateForm = () => {
        setChallengeField('');
        setSelectedTrack(null);
        setScheduledAt(null);
        setGenderPref('any');
        setSelectedSportType(null);
        setChallengeType('speed');
    };

    const handleCreate = async () => {
        if (!selectedTrack) { showError('Select Track', 'Please select a track for the challenge.'); return; }
        if (!challengeField.trim()) { showError('Missing Info', 'Please enter a challenge description.'); return; }
        if (!scheduledAt) { showError('Date Required', 'Please set a date and time for the challenge.'); return; }

        setCreating(true);
        try {
            const result = await ChallengeController.createChallenge(
                user.UserID,
                selectedTrack,
                challengeField.trim(),
                challengeType,
                scheduledAt.toISOString(),
                genderPref,
                selectedSportType
            );
            if (result.success) {
                showSuccess('Created!', 'Your challenge has been created.');
                setCreateVisible(false);
                resetCreateForm();
                loadData();
            } else {
                showError('Error', result.message || 'Failed to create challenge.');
            }
        } catch (e) {
            showError('Error', 'Could not connect to server.');
        } finally {
            setCreating(false);
        }
    };

    const onDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (event.type === 'dismissed') return;
            if (pickerMode === 'date') {
                const base = selectedDate || scheduledAt || new Date();
                setScheduledAt(base);
                setPickerMode('time');
                setShowDatePicker(true);
            } else {
                if (selectedDate) setScheduledAt(selectedDate);
                setPickerMode('date');
            }
        } else {
            if (selectedDate) setScheduledAt(selectedDate);
        }
    };

    const openPicker = () => { setPickerMode('date'); setShowDatePicker(true); };
    const getReportCategories = () => ['Spam', 'Inappropriate Content', 'Fake Challenge', 'Other'];

    const openReportModal = (challengeId) => {
        if (!user) {
            Alert.alert("User Access Only", "Create an account to report content and keep the community safe! ✨");
            return;
        }
        setReportItem({ type: 'challenge', id: challengeId });
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
                showError("Error", result?.message || "The server rejected the report.");
            }
        } catch (e) {
            showError("Network Error", "Could not reach the server.");
        } finally {
            setSubmittingReport(false);
        }
    };

    const userGender = user?.Gender;
    const allowedGenderPrefs = ['any'];
    if (userGender === 'male') allowedGenderPrefs.push('male');
    if (userGender === 'female') allowedGenderPrefs.push('female');

    const displayList = tab === 'all' ? challenges : myChallenges;

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Challenges</Text>
                    {/* 📍 NEW: Show the detected city in the header! */}
                    {userCity && <Text style={styles.headerCity}>in {userCity}</Text>}
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}>
                    <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>All Local</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, tab === 'mine' && styles.tabActive]} onPress={() => setTab('mine')}>
                    <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>
                        My Challenges{myChallenges.length > 0 ? ` (${myChallenges.length})` : ''}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                    <Text style={{ marginTop: 10, color: '#666' }}>Finding challenges near {userCity || 'you'}...</Text>
                </View>
            ) : (
                <FlatList
                    data={displayList}
                    keyExtractor={item => item.ChallengeID.toString()}
                    renderItem={({ item }) => (
                        <ChallengeCard
                            item={item}
                            user={user}
                            myChallengeIds={myChallengeIds}
                            onJoin={handleJoin}
                            onUnjoin={handleUnjoin}
                            onDelete={handleDelete}
                            onReport={openReportModal}
                            onViewTrack={(trackId) => navigation.navigate('TrackDetails', { trackId: item.TrackID, user: user })}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Icon name="emoji-events" size={48} color="#ddd" />
                            <Text style={styles.emptyText}>
                                {tab === 'all' ? `No active challenges in ${userCity || 'your area'}` : "You haven't joined any local challenges"}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* ── Create Challenge Modal ── */}
            <Modal visible={createVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create Challenge</Text>
                            <TouchableOpacity onPress={() => { setCreateVisible(false); resetCreateForm(); }}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                            <Text style={styles.modalLabel}>Selected Track</Text>
                            <View style={styles.lockedInput}>
                                <Icon name="place" size={20} color="#2E7D32" style={{ marginRight: 8 }} />
                                <Text style={styles.lockedInputText}>{route.params?.trackName || 'Unknown Track'}</Text>
                            </View>

                            <Text style={styles.modalLabel}>Sport Type <Text style={styles.optionalLabel}>(optional)</Text></Text>
                            {sportTypesLoading ? (
                                <ActivityIndicator size="small" color="#FF9800" style={{ marginBottom: 8 }} />
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                                    {sportTypes.length === 0 ? (
                                        <Text style={{ color: '#aaa', fontSize: 13, paddingVertical: 8 }}>No sport types available</Text>
                                    ) : (
                                        sportTypes.map(s => (
                                            <TouchableOpacity
                                                key={s.SportTypeID.toString()}
                                                style={[styles.sportChip, selectedSportType === s.SportTypeID && styles.sportChipActive]}
                                                onPress={() => setSelectedSportType(selectedSportType === s.SportTypeID ? null : s.SportTypeID)}
                                            >
                                                <Text style={[styles.sportChipText, selectedSportType === s.SportTypeID && { color: '#fff' }]}>
                                                    {s.SportName}
                                                </Text>
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </ScrollView>
                            )}

                            <Text style={styles.modalLabel}>Challenge Type</Text>
                            <View style={styles.chipRow}>
                                {['speed', 'distance', 'endurance'].map(type => {
                                    const tc = TYPE_COLORS[type];
                                    return (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.typeChip, challengeType === type && { backgroundColor: tc.icon, borderColor: tc.icon }]}
                                            onPress={() => setChallengeType(type)}
                                        >
                                            <Icon name={tc.ic} size={15} color={challengeType === type ? '#fff' : tc.icon} />
                                            <Text style={[styles.typeChipText, challengeType === type && { color: '#fff' }]}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={styles.modalLabel}>Gender Preference</Text>
                            <View style={styles.chipRow}>
                                {allowedGenderPrefs.map(g => {
                                    const gc = GENDER_CONFIG[g];
                                    return (
                                        <TouchableOpacity
                                            key={g}
                                            style={[styles.genderChip, genderPref === g && { backgroundColor: gc.color, borderColor: gc.color }]}
                                            onPress={() => setGenderPref(g)}
                                        >
                                            <Icon name={gc.icon} size={15} color={genderPref === g ? '#fff' : gc.color} />
                                            <Text style={[styles.genderChipText, genderPref === g && { color: '#fff' }]}>{gc.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {!userGender && (
                                <Text style={styles.genderHint}>Set your gender in Edit Profile to unlock gender-specific challenges.</Text>
                            )}

                            <Text style={styles.modalLabel}>
                                Date & Time <Text style={styles.required}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={[styles.datePickerBtn, !scheduledAt && styles.datePickerBtnEmpty]}
                                onPress={openPicker}
                            >
                                <Icon name="event" size={20} color={scheduledAt ? '#2E7D32' : '#aaa'} />
                                <Text style={[styles.datePickerText, !scheduledAt && { color: '#aaa' }]}>
                                    {scheduledAt ? formatDateTime(scheduledAt.toISOString()) : 'Tap to set date & time (required)'}
                                </Text>
                                {scheduledAt && (
                                    <TouchableOpacity onPress={() => setScheduledAt(null)}>
                                        <Icon name="close" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={scheduledAt || new Date()}
                                    mode={pickerMode}
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                    minimumDate={new Date()}
                                    onChange={onDateChange}
                                />
                            )}

                            <Text style={styles.modalLabel}>Description <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="e.g. Complete the track in under 30 minutes"
                                placeholderTextColor="#aaa"
                                value={challengeField}
                                onChangeText={setChallengeField}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />

                            <TouchableOpacity style={styles.createChallengeBtn} onPress={handleCreate} disabled={creating}>
                                {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createChallengeBtnText}>Create Challenge</Text>}
                            </TouchableOpacity>

                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </View>
                </View>
                <Toast />
            </Modal>

            {/* ── Report Modal ── */}
            <Modal visible={reportModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Report Challenge</Text>
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
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
    headerCity: { fontSize: 12, color: '#888', fontWeight: '500', marginTop: 2 },
    tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: '#E8F5E9' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#999', includeFontPadding: false, paddingRight: 4 },
    tabTextActive: { color: '#2E7D32', includeFontPadding: false, paddingRight: 4 },
    listContent: { padding: 16, paddingBottom: 40 },
    emptyText: { fontSize: 15, color: '#999', marginTop: 12, textAlign: 'center' },

    card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
    typeIcon: { width: 46, height: 46, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardInfo: { flex: 1 },
    cardField: { fontSize: 15, fontWeight: '700', color: '#222' },
    cardMeta: { fontSize: 12, color: '#888', marginTop: 3 },
    genderBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, gap: 3 },
    genderBadgeText: { fontSize: 10, fontWeight: '700' },
    deleteBtn: { padding: 4 },
    dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 5 },
    dateText: { fontSize: 12, color: '#555', fontWeight: '500' },
    cardStats: { flexDirection: 'row', marginTop: 10, gap: 16 },
    cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardStatText: { fontSize: 12, color: '#888' },

    cardActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: '#f0f0f0' },
    viewTrackBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1FBF4', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#C8E6C9', gap: 6 },
    viewTrackBtnText: { color: '#2E7D32', fontSize: 13, fontWeight: '700' },

    joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, gap: 6 },
    joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    joinedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    joinedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    joinedText: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },
    unjoinBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: '#E53935' },
    unjoinBtnText: { fontSize: 12, color: '#E53935', fontWeight: '600' },
    creatorBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4},
    creatorBadgeText: { fontSize: 12, color: '#FF9800', fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '92%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#222' },
    modalBody: { padding: 20 },
    modalLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 14 },
    required: { color: '#E53935' },
    optionalLabel: { fontSize: 12, color: '#aaa', fontWeight: '400' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    lockedInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#A5D6A7' },
    lockedInputText: { fontSize: 16, color: '#2E7D32', fontWeight: '600' },
    sportChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#f5f5f5', marginRight: 8, borderWidth: 1, borderColor: '#eee' },
    sportChipActive: { backgroundColor: '#FF9800', borderColor: '#FF9800' },
    sportChipText: { fontSize: 13, fontWeight: '600', color: '#555', marginLeft: 5, includeFontPadding: false, paddingRight: 4 },
    typeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee', gap: 5 },
    typeChipText: { fontSize: 13, fontWeight: '600', color: '#555', marginLeft: 5, includeFontPadding: false, paddingRight: 4 },
    genderChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee', gap: 5 },
    genderChipText: { fontSize: 13, fontWeight: '600', color: '#555', marginLeft: 5, includeFontPadding: false, paddingRight: 4 },
    genderHint: { fontSize: 11, color: '#aaa', marginTop: 4 },
    datePickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#2E7D32', borderRadius: 10, padding: 13, gap: 8, backgroundColor: '#F1F8E9' },
    datePickerBtnEmpty: { borderColor: '#ddd', backgroundColor: '#fafafa' },
    datePickerText: { flex: 1, fontSize: 14, color: '#333' },
    modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 13, fontSize: 15, backgroundColor: '#fafafa', color: '#222', minHeight: 80 },
    createChallengeBtn: { backgroundColor: '#2E7D32', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    createChallengeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    reportChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
    reportChipActive: { backgroundColor: '#E53935', borderColor: '#E53935' },
    reportChipText: { fontSize: 12, fontWeight: '600', color: '#555', paddingRight: 4 },
    reportInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, backgroundColor: '#fafafa', color: '#222', minHeight: 100 },
    submitReportBtn: { backgroundColor: '#E53935', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    submitReportBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default ChallengesScreen;