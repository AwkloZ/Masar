import API from '../api/config';

const AuthModel = {
  login: (email, password) => API.post('/auth/login', { email, password }),
  register: (data) => API.post('/auth/register', data),
};

export default AuthModel;
