import axios from 'axios';

const state = () => ({
  configuration: {}
});

const getters = {
  GET_CONFIG: state => state.configuration
};

const mutations = {
  SET_CONFIG: (state, data) => {
    state.configuration = data;
  }
};

const actions = {
  fetchConfig: async ({ commit }) => {
    const url = window.location.origin + window.location.pathname.replace(/\/+$/, "");
    return axios.get(`${url}/config`).then(({ data }) => {
      commit('SET_CONFIG', data);
    });
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};