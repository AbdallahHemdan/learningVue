<template>
  <div class="like-container">
    <h3>no of likes : {{ noOfLikes }}</h3>
    <button @click="toggleLike" v-if="likeState">Unlike</button>
    <button @click="toggleLike" v-if="!likeState">Like</button>
  </div>
</template>

<script>
export default {
  name: "Like",
  date() {},
  computed: {
    noOfLikes() {
      return this.$store.getters.getNoOfLikes;
    },
    likeState() {
      return this.$store.getters.getLikeState;
    }
  },
  methods: {
    toggleLike() {
      this.$store.dispatch("toggleLikeState");
    }
  }
};
</script>

<style lang="scss" scoped>
* {
  text-align: center;
  font-size: 30px;
}
</style>
