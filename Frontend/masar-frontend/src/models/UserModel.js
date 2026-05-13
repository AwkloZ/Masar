import API from '../api/config';

const UserModel = {
  getProfile:     (id)       => API.get(`/users/${id}`),
  updateProfile:  (id, data) => API.put(`/users/${id}`, data),
  changePassword: (id, data) => API.put(`/users/${id}/password`, data),
};

export default UserModel;
