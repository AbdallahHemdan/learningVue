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
  </div>
</template>

<script>
export default {
  name: "Ninja",
  data: function() {
    return {
      ninjas: [
        { name: "Ryu", speciality: "Vue Components", show: false },
        { name: "Crystal", speciality: "HTML Wizardry", show: false },
        { name: "Hitoshi", speciality: "Click Events", show: false },
        { name: "Tango", speciality: "Conditionals", show: false },
        { name: "Kami", speciality: "Webpack", show: false },
        { name: "Yoshi", speciality: "Data Diggin", show: false }
      ]
    };
  },
  methods: {
    toggleNinjaSpeciality: function(ninjaIndex) {
      this.ninjas[ninjaIndex] ^= 1;
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