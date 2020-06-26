<template>
  <div class="like-container">
    <h3>no of likes : {{ getTotal }}</h3>
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
      return this.$store.getters["like/getNoOfLikes"];
    },
    likeState() {
      return this.$store.getters["like/getLikeState"];
    },
    getTotal() {
      return this.$store.getters["like/getTotal"];
    }
  },
  methods: {
    toggleLike() {
      this.$store.dispatch("like/toggleLikeState");
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
