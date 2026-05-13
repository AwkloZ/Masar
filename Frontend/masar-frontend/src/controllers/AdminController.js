import API from '../api/config';

export default {
    getPendingReports: async (adminId) => {
        try {
            const response = await API.get(`/admin/reports?adminId=${adminId}`);
            return response.data;
        } catch (error) {
            console.error('🚨 Error fetching reports:', error.response?.data || error.message);
            throw error;
        }
    },
    
    moderateItem: async (adminId, reportId, action, itemType, itemId) => {
        try {
            const response = await API.post('/admin/moderate', {
                adminId,
                reportId,
                action,     
                itemType,   
                itemId
            });
            return response.data;
        } catch (error) {
            console.error('🚨 Error moderating item:', error.response?.data || error.message);
            throw error;
        }
    },




    getReportedItem: async (adminId, itemType, itemId) => {
        try {
            const response = await API.get(`/admin/reports/item?adminId=${adminId}&itemType=${itemType}&itemId=${itemId}`);
            return response.data;
        } catch (error) {
            console.error('🚨 Error fetching reported item:', error.response?.data || error.message);
            throw error;
        }
    },

    getTrackOptions: async (adminId) => {
        try {
            const response = await API.get(`/admin/tracks/options?adminId=${adminId}`);
            return response.data;
        } catch (error) {
            console.error('🚨 Error fetching track options:', error.response?.data || error.message);
            throw error;
        }
    },




};