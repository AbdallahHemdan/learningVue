import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    counter: 0
  },
  mutations: {
    increment: state => {
      state.counter++;
    },
    decrement: state => {
      state.counter--;
    }
  },
  modules: {},
  actions: {
    increment: ({ commit }) => {
      commit("increment");
    },
    decrement: ({ commit }) => {
      commit("decrement");
    },
    incrementAfterSecond: ({ commit }) => {
      setTimeout(() => {
        commit("increment");
        console.log("After one second");
      }, 1000);
    }
  },
  getters: {
    counter: state => {
      return state.counter;
    },
    doubleCounter: state => {
      return state.counter * 2;
    },
    addedCounter: state => (payload1, payload2) => {
      return state.counter + payload1 + payload2;
    }
  }
});
