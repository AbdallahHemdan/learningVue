<template>
  <div class="counter-info">Counter : {{ counter }}</div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "CounterInfo",
  data() {
    return {};
  },
  methods: {},
  computed: {
    ...mapGetters(["counter"])
  },
  props: []
};
</script>

<style lang="scss" scoped>
.counter-info {
  font-size: 25px;
  color: #f00;
}
</style>
