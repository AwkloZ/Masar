import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthModel from '../models/AuthModel';

const USER_KEY = '@masar_user';

const AuthController = {
  handleLogin: async (email, password) => {
    const response = await AuthModel.login(email, password);
    const result = response.data;
    if (result.success && result.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
    }
    return result;
  },

  handleRegister: async (data) => {
    const response = await AuthModel.register(data);
    return response.data;
  },

  getStoredUser: async () => {
    const json = await AsyncStorage.getItem(USER_KEY);
    return json ? JSON.parse(json) : null;
  },

  updateStoredUser: async (userData) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
  },

  handleLogout: async () => {
    await AsyncStorage.removeItem(USER_KEY);
  },
};

export default AuthController;
