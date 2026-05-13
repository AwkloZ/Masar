import UserModel from '../models/UserModel';

const UserController = {
  fetchProfile: async (userId) => {
    try {
      const res = await UserModel.getProfile(userId);
      return res.data?.data || null;
    } catch (e) {
      console.error('fetchProfile error:', e);
      return null;
    }
  },

  updateProfile: async (userId, firstName, lastName, gender = null) => {
    try {
      const payload = { firstName, lastName };
      if (gender) payload.gender = gender;
      const res = await UserModel.updateProfile(userId, payload);
      return res.data;
    } catch (e) {
      console.error('updateProfile error:', e);
      return { success: false, message: 'Network error.' };
    }
  },

    changePassword: async (userId, currentPassword, newPassword) => {
        try {
            const res = await UserModel.changePassword(userId, { currentPassword, newPassword });
            return res.data;
        } catch (e) {

            if (e.response && e.response.status === 401) {
                return { success: false, message: 'Your current password is incorrect.' };
            }

            const serverMessage = e.response?.data?.message || 'Network error. Could not reach server.';

            return { success: false, message: serverMessage };
        }
    },
};

export default UserController;
