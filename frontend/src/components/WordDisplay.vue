<script setup lang="ts">
defineProps<{ target: string }>();
</script>

<template>
  <div class="display">
    <h2 class="target-text">{{ target }}</h2>
  </div>
</template>

<style scoped>
.target-text { font-size: 3rem; color: #42b883; letter-spacing: 0.1em; }
</style>
