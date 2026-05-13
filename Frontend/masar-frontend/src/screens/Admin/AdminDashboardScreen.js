import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AdminDashboardScreen = ({ navigation, route }) => {
    const { user } = route.params;

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Command Center</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.body}>

                <View style={styles.welcomeBox}>
                    <Text style={styles.welcomeText}>Welcome back, Admin {user?.FirstName}</Text>
                    <Text style={styles.subText}>With great power comes great responsibility.🕷</Text>
                </View>

                <Text style={styles.sectionTitle}>Trust & Safety</Text>

                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('AdminReports', { user })}
                >
                    <View style={[styles.iconWrapper, { backgroundColor: '#FFEBEE' }]}>
                        <Icon name="flag" size={28} color="#D32F2F" />
                    </View>
                    <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>Moderation Queue</Text>
                        <Text style={styles.cardSub}>Review flagged tracks, ratings, and media.</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#ccc" />
                </TouchableOpacity>



                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('AdminEdits')} 
                >
                    <View style={[styles.iconWrapper, { backgroundColor: '#E8F5E9' }]}>
                        <Icon name="edit-note" size={24} color="#2E7D32" />
                    </View>
                    <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>Review Track Edits</Text>
                        <Text style={styles.cardSub}>Review track edit suggesstions.</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#ccc" />

                </TouchableOpacity>


            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 16,
        backgroundColor: '#222'
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFD700' },
    body: { padding: 20 },
    welcomeBox: { marginBottom: 30 },
    welcomeText: { fontSize: 22, fontWeight: '800', color: '#333' },
    subText: { fontSize: 14, color: '#888', marginTop: 4 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
    },
    iconWrapper: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    cardText: { flex: 1, marginLeft: 16 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
    cardSub: { fontSize: 13, color: '#888', marginTop: 2 },
});

export default AdminDashboardScreen;