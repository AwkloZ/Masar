
import API from '../api/config';
export default {
    submitReport: async (reporterId, itemType, itemId, reason) => {
        try {
            const response = await API.post('/reports', {
                reporterId,
                itemType,
                itemId,
                reason
            });
            return response.data;
        } catch (error) {
            console.error('🚨 REPORT ERROR:', error.response?.data || error.message);
            throw error;
        }
    }
};