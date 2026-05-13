import React, { useState, useCallback } from 'react'; import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AdminController from '../../controllers/AdminController';
import { showSuccess, showError, showInfo } from '../../utils/ToastHelper';
const AdminReportsScreen = ({ navigation, route }) => {
    const { user } = route.params;
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); 

    useFocusEffect(
        useCallback(() => {
            loadReports();
        }, [])
    );
    const loadReports = async () => {
        setLoading(true);
        try {
            const data = await AdminController.getPendingReports(user.UserID);
            if (data.success) {
                setReports(data.reports || []);
            } else {
                showError("Error", data.message || "Failed to load reports.");
            }
        } catch (error) {
            showError("Network Error", "Could not reach the server.");
        } finally {
            setLoading(false);
        }
    };


    const renderReport = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: item.ItemType === 'track' ? '#E3F2FD' : '#FCE4EC' }]}>
                    <Text style={[styles.badgeText, { color: item.ItemType === 'track' ? '#1976D2' : '#C2185B' }]}>
                        {item.ItemType.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.ReportedAt).toLocaleDateString()}</Text>
            </View>

            <Text style={styles.reasonTitle}>Reported Reason:</Text>
            <Text style={styles.reasonText}>{item.Reason}</Text>

            <View style={styles.reporterInfo}>
                <Icon name="person" size={16} color="#888" />
                <Text style={styles.reporterText}>Reported by: {item.FirstName} {item.LastName}</Text>
            </View>

            <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => navigation.navigate('AdminEntityReview', { user, report: item })}
            >
                <Icon name="policy" size={18} color="#fff" />
                <Text style={styles.reviewBtnText}>Review Evidence</Text>
                <Icon name="arrow-forward-ios" size={14} color="#fff" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Moderation Queue</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#D32F2F" />
                </View>
            ) : reports.length === 0 ? (
                <View style={styles.center}>
                    <Icon name="check-circle-outline" size={64} color="#4CAF50" />
                    <Text style={styles.emptyText}>All caught up!</Text>
                    <Text style={styles.emptySub}>No pending reports to review.</Text>
                </View>
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={item => item.ReportID.toString()}
                    renderItem={renderReport}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 16,
        backgroundColor: '#222'
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 12 },
    emptySub: { fontSize: 14, color: '#888', marginTop: 8 },
    listContainer: { padding: 16 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    dateText: { fontSize: 12, color: '#aaa', fontWeight: '600' },
    reasonTitle: { fontSize: 13, color: '#888', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    reasonText: { fontSize: 16, color: '#222', fontWeight: '600', marginBottom: 12, lineHeight: 22 },
    reporterInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8, marginBottom: 16 },
    reporterText: { fontSize: 13, color: '#555', marginLeft: 6, fontWeight: '500' },
    actionRow: { flexDirection: 'row', gap: 12 },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 10
    },
    dismissBtn: { backgroundColor: '#eee' },
    dismissText: { color: '#555', fontWeight: '700', fontSize: 14, marginLeft: 6 },
    deleteBtn: { backgroundColor: '#D32F2F' },
    deleteText: { color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 6 },
    reviewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1976D2', padding: 14, borderRadius: 10, marginTop: 12 },
    reviewBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: 8 },
});

export default AdminReportsScreen;