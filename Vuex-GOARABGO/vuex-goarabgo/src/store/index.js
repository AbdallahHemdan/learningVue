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
    increment: context => {
      context.commit("increment");
    },
    decrement: context => {
      context.commit("decrement");
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
