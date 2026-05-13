import FavouriteModel from '../models/FavouriteModel';

const FavouriteController = {
    toggleFavourite: async (userId, trackId, isCurrentlyFavourite) => {
        try {
            if (isCurrentlyFavourite) {
                await FavouriteModel.remove(userId, trackId);
                return false; 
            } else {
                await FavouriteModel.add(userId, trackId);
                return true; 
            }
        } catch (error) {
            console.error('Toggle favorite error:', error);
            return isCurrentlyFavourite;
        }
    },

    checkIfFavourite: async (userId, trackId) => {
        try {
            const res = await FavouriteModel.check(userId, trackId);
            return res.data.isFavourite;
        } catch (error) {
            return false;
        }
    },

    fetchUserFavourites: async (userId) => {
        try {
            const res = await FavouriteModel.getUserFavourites(userId);
            return res.data.data || [];
        } catch (error) {
            console.error('Fetch favourites error:', error);
            return [];
        }
    }
};

export default FavouriteController;