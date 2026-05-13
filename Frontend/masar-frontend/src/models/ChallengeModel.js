import API from '../api/config';

const ChallengeModel = {
    getAll: (userId) =>
        API.get('/challenges', { params: userId ? { userID: userId } : {} }),

    getById: (id) =>
        API.get(`/challenges/${id}`),

    create: (payload) =>
        API.post('/challenges', payload),

    delete: (challengeId, userId) =>
        API.delete(`/challenges/${challengeId}`, {
            data: { userID: userId },
        }),

    join: (challengeId, userId) =>
        API.post(`/challenges/${challengeId}/join`, { userID: userId }),

    unjoin: (challengeId, userId) =>
        API.delete(`/challenges/${challengeId}/join`, {
            data: { userID: userId },
        }),

    getUserChallenges: (userId) =>
        API.get(`/users/${userId}/challenges`),

    getSportTypes: () =>
        API.get('/sport-types'),
};

export default ChallengeModel;
