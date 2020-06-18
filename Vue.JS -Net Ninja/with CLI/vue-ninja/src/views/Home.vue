<template>
  <div class="home">
    <app-header :brandName="brandName" />
    <app-content :ninjas="ninjas" />
    <hr />
    <app-content :ninjas="ninjas" />
    <app-footer :brandName="brandName" />
  </div>
</template>

<script>
import Header from "./../components/Header";
import Footer from "./../components/Footer";
import Ninja from "./../components/Ninja";

export default {
  name: "Home",
  components: {
    "app-header": Header,
    "app-content": Ninja,
    "app-footer": Footer
  },
  data: function() {
    return {
      ninjas: [
        { name: "Ryus", speciality: "Vue Components", show: false },
        { name: "Crystal", speciality: "HTML Wizardry", show: false },
        { name: "Hitoshi", speciality: "Click Events", show: false },
        { name: "Tango", speciality: "Conditionals", show: false },
        { name: "Kami", speciality: "Webpack", show: false },
        { name: "Yoshi", speciality: "Data Diggin", show: false }
      ],
      brandName: "Vue ninja"
    };
  }
};
</script>
