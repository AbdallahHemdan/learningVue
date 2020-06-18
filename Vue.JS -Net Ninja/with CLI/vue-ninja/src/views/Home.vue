<template>
  <div class="home">
    <h1>Hello, {{ name }}</h1>
    <p>{{ title }}</p>
    <p>{{ greeting() }}</p>
  </div>
</template>

<script>
export default {
  name: "Home",
  data: function() {
    return {
      name: "Hemdan",
      title: "my name is Abdallah ahmed hemdan"
    };
  },
  methods: {
    greeting: function() {
      return `hey, ${this.name}`;
    }
  },
  components: {}
};
</script>
