import API from '../api/config';

const TrackModel = {
    getAllTracks: () => API.get('/tracks'),
    getTrackById: (id) => API.get(`/tracks/${id}`),

    createTrack: (data, isImageUpload = false) => API.post('/tracks', data, {
        headers: isImageUpload ? { 'Content-Type': 'multipart/form-data' } : {},
        timeout: 30000
    }),

    getSportTypes: () => API.get('/sport-types'),
    getSurfaceTypes: () => API.get('/surface-types'),
    getLightingTypes: () => API.get('/lighting-types'),
    getAmenities: () => API.get('/amenities'),
    submitRating: (trackId, data) => API.post(`/tracks/${trackId}/ratings`, data),
    deleteRating: (ratingId, userId) => API.post(`/tracks/ratings/${ratingId}/delete`, { userID: userId }),
};

export default TrackModel;