import TrackModel from '../models/TrackModel';
import API from '../api/config'; 
const FALLBACK_AMENITIES = [
  { AmenityID: 1, AmenityKey:'parking', AmenityName:'Free Parking', AmenityIcon:'local-parking', Category:'Facilities' },
  { AmenityID: 2, AmenityKey:'restrooms', AmenityName:'Restrooms', AmenityIcon:'wc', Category:'Facilities' },
  { AmenityID: 3, AmenityKey:'water_fountain', AmenityName:'Water Fountain', AmenityIcon:'water-drop', Category:'Facilities' },
  { AmenityID: 4, AmenityKey:'benches', AmenityName:'Benches', AmenityIcon:'weekend', Category:'Facilities' },
  { AmenityID: 5, AmenityKey:'shelter', AmenityName:'Shelter / Shade', AmenityIcon:'home', Category:'Facilities' },
  { AmenityID: 6, AmenityKey:'lockers', AmenityName:'Lockers', AmenityIcon:'lock', Category:'Facilities' },
  { AmenityID: 7, AmenityKey:'grocery', AmenityName:'Grocery Store', AmenityIcon:'store', Category:'Food & Drink' },
  { AmenityID: 8, AmenityKey:'cafe', AmenityName:'Cafe / Coffee', AmenityIcon:'local-cafe', Category:'Food & Drink' },
  { AmenityID: 9, AmenityKey:'restaurant', AmenityName:'Restaurant', AmenityIcon:'restaurant', Category:'Food & Drink' },
  { AmenityID: 10, AmenityKey:'vending', AmenityName:'Vending Machine', AmenityIcon:'local-drink', Category:'Food & Drink' },
  { AmenityID: 11, AmenityKey:'lighting', AmenityName:'Night Lighting', AmenityIcon:'lightbulb', Category:'Safety' },
  { AmenityID: 12, AmenityKey:'cctv', AmenityName:'CCTV / Security', AmenityIcon:'videocam', Category:'Safety' },
  { AmenityID: 13, AmenityKey:'first_aid', AmenityName:'First Aid', AmenityIcon:'local-hospital', Category:'Safety' },
  { AmenityID: 14, AmenityKey:'wheelchair', AmenityName:'Wheelchair Access', AmenityIcon:'accessible', Category:'Safety' },
  { AmenityID: 15, AmenityKey:'bike_rental', AmenityName:'Bike Rental', AmenityIcon:'directions-bike', Category:'Sports' },
  { AmenityID: 16, AmenityKey:'bike_repair', AmenityName:'Bike Repair', AmenityIcon:'build', Category:'Sports' },
  { AmenityID: 17, AmenityKey:'equipment', AmenityName:'Equipment Rental', AmenityIcon:'fitness-center', Category:'Sports' },
  { AmenityID: 18, AmenityKey:'showers', AmenityName:'Showers', AmenityIcon:'shower', Category:'Sports' },
];

const TrackController = {
  fetchAllTracks: async () => {
    try {
      const res = await TrackModel.getAllTracks();
      return res.data?.data || [];
    } catch (e) {
      console.error('fetchAllTracks error:', e);
      return [];
    }
  },

  fetchTrackById: async (id) => {
    try {
      const res = await TrackModel.getTrackById(id);
      return res.data?.data || null;
    } catch (e) {
      console.error('fetchTrackById error:', e);
      return null;
    }
  },


  fetchSportTypes: async () => {
    try {
      const res = await TrackModel.getSportTypes();
      return res.data?.data || [];
    } catch (e) {
      console.error('fetchSportTypes error:', e);
      return [];
    }
  },

  fetchSurfaceTypes: async () => {
    try {
      const res = await TrackModel.getSurfaceTypes();
      return res.data?.data || [];
    } catch (e) {
      console.error('fetchSurfaceTypes error:', e);
      return [];
    }
  },

  fetchLightingTypes: async () => {
    try {
      const res = await TrackModel.getLightingTypes();
      return res.data?.data || [];
    } catch (e) {
      console.error('fetchLightingTypes error:', e);
      return [];
    }
  },

  fetchAmenities: async () => {
    try {
      const res = await TrackModel.getAmenities();
      return { data: res.data?.data || FALLBACK_AMENITIES };
    } catch (e) {
      console.error('fetchAmenities error:', e);
      return { data: FALLBACK_AMENITIES };
    }
  },



  submitRating: async (trackId, userID, ratingValue, reviewText) => {
    const res = await TrackModel.submitRating(trackId, { userID, ratingValue, reviewText });
    return res.data;
    },
    deleteRating: async (ratingId, userId) => {
        try {
            const res = await TrackModel.deleteRating(ratingId, userId);
            return res.data;
        } catch (error) {
            console.error("Error deleting rating:", error);
            throw error;
        }
    },


    submitNewTrack: async (trackData, mediaList) => {
        try {
            if (mediaList && mediaList.length > 0) {
                const formData = new FormData();
                formData.append('userID', trackData.userID);
                formData.append('trackName', trackData.trackName);
                formData.append('description', trackData.description);
                if (trackData.length) formData.append('length', trackData.length);
                if (trackData.difficulty) formData.append('difficulty', trackData.difficulty);
                if (trackData.surface) formData.append('surface', trackData.surface);
                if (trackData.lighting) formData.append('lighting', trackData.lighting);
                formData.append('latitude', trackData.latitude);
                formData.append('longitude', trackData.longitude);
                formData.append('city', trackData.city);
                formData.append('country', trackData.country);
                if (trackData.routePoints) formData.append('routePoints', trackData.routePoints);
                formData.append('city', trackData.city);
                formData.append('country', trackData.country);
                formData.append('address', trackData.address);
                formData.append('sportTypes', JSON.stringify(trackData.sportTypes));
                formData.append('amenity_ids', JSON.stringify(trackData.amenity_ids));
                formData.append('hasSeparateLanes', trackData.hasSeparateLanes);
                mediaList.forEach((media, index) => {
                    const filename = media.uri.split('/').pop() || `media_${index}.jpg`;
                    const match = /\.(\w+)$/.exec(filename);
                    const ext = match ? match[1] : (media.type === 'video' ? 'mp4' : 'jpg');
                    const mimeType = media.type === 'video' ? `video/${ext}` : `image/${ext}`;

                    formData.append('media[]', {
                        uri: media.uri,
                        name: filename,
                        type: mimeType
                    });
                });

                const res = await TrackModel.createTrack(formData, true);
                return res.data;
            } else {
                const res = await TrackModel.createTrack(trackData, false);
                return res.data;
            }
        } catch (error) {
            console.error('Submit track error:', error);
            throw error;
        }
    },


    addMediaToTrack: async (trackId, userId, mediaList) => {
        try {
            const formData = new FormData();
            formData.append('trackId', trackId);
            formData.append('userId', userId);

            mediaList.forEach((media, index) => {
                const filename = media.uri.split('/').pop() || `media_${index}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const ext = match ? match[1] : (media.type === 'video' ? 'mp4' : 'jpg');
                const mimeType = media.type === 'video' ? `video/${ext}` : `image/${ext}`;

                formData.append('media[]', {
                    uri: media.uri,
                    name: filename,
                    type: mimeType
                });
            });

            const res = await API.post(`/tracks/add-media`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 12000000
            });
            return res.data;
        } catch (error) {
            console.error('Error uploading media:', error);
            throw error;
        }
    },

    submitEditRequest: async (trackId, userId, changes) => {
        try {
            const response = await API.post('/track-edits/submit', { trackId, userId, changes });
            return response.data;
        } catch (error) {
            console.log('Error submitting edit:', error.response?.data);
            return {
                success: false,
                message: error.response?.data?.message || `Network issue: ${error.message}`
            };
        }
    },

    getPendingEdits: async () => {
        try {
            const response = await API.get('/track-edits/pending');
            return response.data;
        } catch (error) {
            console.log('Error fetching pending edits:', error.response?.data);
            return { success: false, data: [] };
        }
    },

    reviewEditRequest: async (requestId, action) => {
        try {
            const response = await API.post('/track-edits/review', { requestId, action });
            return response.data;
        } catch (error) {
            console.log('Error reviewing request:', error.response?.data);
            return { success: false, message: 'Network error submitting review.' };
        }
    },
};


export default TrackController;
