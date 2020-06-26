const actions = {
  increment: ({ commit }) => {
    commit("increment");
  },
  decrement: ({ commit }) => {
    commit("decrement");
  },
  incrementAfterSecond: ({ commit }) => {
    setTimeout(() => {
      commit("increment");
    }, 1000);
  }
};

export default actions;
