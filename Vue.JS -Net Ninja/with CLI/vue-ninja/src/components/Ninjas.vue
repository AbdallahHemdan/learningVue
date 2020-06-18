<template>
  <div class="ninjas">
    <h1>Hello from ninjas component</h1>
    <ul>
      <li v-for="(ninja, index) in ninjas" :key="index">{{ ninja }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "Ninjas",
  data: function() {
    return {
      ninjas: [1, 2, 3, 4, 5, 6]
    };
  }
};
</script>
<style scoped>
h1 {
  color: rgb(255, 0, 0);
}
</style>

