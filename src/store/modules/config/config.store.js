import axios from 'axios';
import Vue from 'vue';

export default {
  namespaced: true,
  state: {
    configuration: null,
  },
  mutations: {
    setConfig(state, data) {
      Vue.set(state, 'configuration', data);
    },
  },
  actions: {
    async fetchConfig({ commit }) {
      const url = window.location.origin + window.location.pathname.replace(/\/+$/, "");
      const { data } = await axios.get(`${url}/config`);
      commit('setConfig', data);
      return data;
    },
  },
  getters: {
    configuration: state => state.configuration,
  },
};

