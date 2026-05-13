import ChallengeModel from '../models/ChallengeModel';

const ChallengeController = {

     fetchAll:async (userID) => {
        try {
            const res = await ChallengeModel.getAll(userID);
            return res.data?.data || [];
        } catch (e) {
            console.error('🚨 fetchAll error:', e);
            return [];
        }
    },

    fetchById: async (id) => {
        try {
            const res = await ChallengeModel.getById(id);
            return res.data?.data || null;
        } catch (e) {
            console.error('fetchById challenge error:', e);
            return null;
        }
    },

    fetchUserChallenges: async (userId) => {
        try {
            const res = await ChallengeModel.getUserChallenges(userId);
            return res.data?.data || [];
        } catch (e) {
            console.error('fetchUserChallenges error:', e);
            return [];
        }
    },

   
    createChallenge: async (userId, trackId, field, type, scheduledAt, genderPreference, sportTypeId = null) => {
        try {
            const payload = {
                userID: userId,
                trackID: trackId,
                field,
                type,
                scheduledAt,
                genderPreference: genderPreference || 'any',
            };
            if (sportTypeId) payload.sportTypeId = sportTypeId;
            const res = await ChallengeModel.create(payload);
            return res.data;
        } catch (e) {
            console.error('createChallenge error:', e);
            return { success: false, message: e.response?.data?.message || 'Network error.' };
        }
    },

    
    deleteChallenge: async (challengeId, userId) => {
        try {
            const res = await ChallengeModel.delete(challengeId, userId);
            return res.data;
        } catch (e) {
            console.error('deleteChallenge error:', e);
            return { success: false, message: e.response?.data?.message || 'Network error.' };
        }
    },

    joinChallenge: async (challengeId, userId) => {
        try {
            const res = await ChallengeModel.join(challengeId, userId);
            return res.data;
        } catch (e) {
            console.error('joinChallenge error:', e);
            return { success: false, message: e.response?.data?.message || 'Network error.' };
        }
    },

    unjoinChallenge: async (challengeId, userId) => {
        try {
            const res = await ChallengeModel.unjoin(challengeId, userId);
            return res.data;
        } catch (e) {
            console.error('unjoinChallenge error:', e);
            return { success: false, message: e.response?.data?.message || 'Network error.' };
        }
    },
};

export default ChallengeController;
