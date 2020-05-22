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
  fetchConfig: ({ commit }) => {
    const url = window.location.origin + window.location.pathname.replace(/\/+$/, "");
    axios.get(`${url}/config`).then(({ data }) => {
      commit('SET_CONFIG', data);
    }).catch(error => {
      throw new Error(`Failed to fetch config: ${error}`);
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