<template>
  <div class="ninjas">
    <ul>
      <li
        v-for="(ninja, index) in ninjas"
        :key="index"
        @click="ninja.show ^= 1"
      >
        <h2>{{ ninja.name }}</h2>
        <h3 v-if="ninja.show">{{ ninja.speciality }}</h3>
      </li>
    </ul>
    <button @click="logNinjas">Click me</button>
  </div>
</template>

<script>
export default {
  name: "Ninja",
  data: function() {
    return {};
  },
  methods: {
    toggleNinjaSpeciality: function(ninjaIndex) {
      this.ninjas[ninjaIndex] ^= 1;
    },
    logNinjas: function() {
      console.log(this.ninjas);
    }
  },
  props: {
    ninjas: {
      type: Array,
      required: true
    }
  }
};
</script>

<style scoped>
.ninjas {
  width: 100%;
  max-width: 1200px;
  margin: 100px auto;
  padding: 0 20px;
  box-sizing: border-box;
}

ul {
  display: flex;
  flex-wrap: wrap;
  list-style-type: none;
  padding: 0;
}

li {
  flex-basis: 300px;
  text-align: center;
  padding: 30px;
  border: 1px solid #222;
  margin: 10px;
  cursor: pointer;
  color: #f00;
}
</style>