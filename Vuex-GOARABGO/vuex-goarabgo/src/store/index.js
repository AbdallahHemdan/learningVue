import Vue from "vue";
import Vuex from "vuex";
import likeModule from "./modules/LikeModule";
import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    counter: 0
  },
  modules: {
    like: likeModule
  },
  mutations,
  actions,
  getters
});
