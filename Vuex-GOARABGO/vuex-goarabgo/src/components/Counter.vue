<template>
  <div class="counter">
    <h1>Hello, Counter</h1>
    <p>Counter : {{ counter }}</p>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
  </div>
</template>

<script>
import { mapActions } from "vuex";

export default {
  name: "Counter",
  data: function() {
    return {};
  },
  methods: {
    ...mapActions(["increment", "decrement"])
  },
  computed: {
    counter() {
      return this.$store.getters.counter;
    }
  },
  props: []
};
</script>

<style lang="scss" scoped>
.counter {
  background-color: #eee;
  padding: 20px;
  text-align: center;
  h1 {
    color: #f00;
  }
  p {
    font-size: 24px;
  }
  button {
    padding: 10px;
    margin: 10px;
    cursor: pointer;
  }
}
</style>
