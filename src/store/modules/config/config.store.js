import axios from 'axios';

const initialState = () => ({
  configuration: {},
});

const getters = {
  GET_CONFIG: (state) => state.configuration,
  GET_AUTHENTICATION: (state) => state.configuration.authentication,
};

const mutations = {
  SET_CONFIG: (state, data) => {
    state.configuration = data;
  },
  SET_AUTHENTICATION: (state, auth) => {
    state.configuration.authentication = auth;
  },
};

const actions = {
  fetchConfig: async ({ commit }) => {
    const url = window.location.origin + window.location.pathname.replace(/\/+$/, '');
    return axios.get(`${url}/config`).then(({ data }) => {
      commit('SET_CONFIG', data);
    });
  },
};

export default {
  namespaced: true,
  state: initialState,
  mutations,
  actions,
  getters,
};
