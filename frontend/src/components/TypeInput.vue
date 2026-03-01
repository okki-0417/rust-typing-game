<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ target: string }>();
const emit = defineEmits(['success']);

const userInput = ref('');

watch(userInput, (newVal) => {
  if (newVal === props.target) {
    emit('success', newVal);
    userInput.value = '';
  }
});
</script>

<template>
  <input
    id="type-input"
    v-model="userInput"
    type="text"
    placeholder="Start typing..."
    class="input-field"
  />
</template>

<style scoped>
.input-field {
  font-size: 1.5rem;
  padding: 0.5rem;
  border: 2px solid #42b883;
  border-radius: 5px;
}
</style>
