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
    <button @click="deleteNinja">Delete Ninja</button>
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
    deleteNinja: function() {
      this.ninjas.pop();
    }
  },
  props: {
    ninjas: {
      type: Array,
      required: true
    }
  },
  beforeCreate: function() {
    alert("before Ninja component is created");
  },
  created: function() {
    // good for fetching the data
    alert("after creation of Ninja component");
  },
  beforeMount: function() {
    alert("before Ninja component mounted");
  },
  mounted: function() {
    // good for manipulating the dom
    alert("after Ninja component has mounted");
  },
  beforeUpdate: function() {
    alert("before Ninja component update");
  },
  updated: function() {
    alert("after Ninja component updated");
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