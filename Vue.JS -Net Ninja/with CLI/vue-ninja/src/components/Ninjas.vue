<template>
  <div class="ninjas">
    <h3>Hello from ninjas component</h3>
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
<style></style>

