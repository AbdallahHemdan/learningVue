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
    getNoOfLikes: state => state.noOfLikes,
    getLikeState: state => state.isLiked
  }
};

export default likeModule;
