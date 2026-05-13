import API from '../api/config';

const FavouriteModel = {
    add: (userId, trackId) => API.post('/favourites', { userID: userId, trackID: trackId }),
    remove: (userId, trackId) => API.delete('/favourites', { data: { userID: userId, trackID: trackId } }),
    check: (userId, trackId) => API.get('/favourites/check', { params: { userID: userId, trackID: trackId } }),
    getUserFavourites: (userId) => API.get(`/users/${userId}/favourites`),
};

export default FavouriteModel;