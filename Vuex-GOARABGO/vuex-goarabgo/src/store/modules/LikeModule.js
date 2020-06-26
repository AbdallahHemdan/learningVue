const likeModule = {
  state: {
    isLiked: false,
    noOfLikes: 10
  },

  mutations: {
    toggleLikeState: state => {
      state.isLiked ^= 1;
    },
    increaseNoOfLikes: state => {
      state.noOfLikes++;
    },
    decreaseNoOfLikes: state => {
      state.noOfLikes--;
    }
  },

  actions: {
    toggleLikeState: ({ commit, state }) => {
      setTimeout(() => {
        commit("toggleLikeState");
        if (state.isLiked) {
          commit("increaseNoOfLikes");
        } else {
          commit("decreaseNoOfLikes");
        }
      }, 500);
    }
  },

  getters: {
    getNoOfLikes: (state, getters, rootState) => {
      console.log(rootState);
      return state.noOfLikes;
    },
    getLikeState: (state, getters, rootState) => {
      console.log(rootState);
      return state.isLiked;
    }
  }
};

export default likeModule;
