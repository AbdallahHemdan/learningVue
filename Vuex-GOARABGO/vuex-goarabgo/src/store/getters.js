const getters = {
  counter: state => {
    return state.counter;
  },
  doubleCounter: state => {
    return state.counter * 2;
  },
  addedCounter: state => (payload1, payload2) => {
    return state.counter + payload1 + payload2;
  },
  getTotal: state => {
    return state.counter;
  }
};

export default getters;
