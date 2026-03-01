<script setup lang="ts">
import { ref, onMounted } from 'vue';
import WordDisplay from './components/WordDisplay.vue';
import TypeInput from './components/TypeInput.vue';

const currentWord = ref('loading...');
const isSuccess = ref(false);

const fetchNext = async () => {
  isSuccess.value = false;
  const res = await fetch('http://localhost:3000/status');
  const data = await res.json();
  currentWord.value = data.current_word;
};

const handleSuccess = async (word: string) => {
  console.log(word, "正解！Rustに報告します");
  isSuccess.value = true;
  currentWord.value = '';

  await fetch('http://localhost:3000/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, time_taken: 1.0 }) // 簡易的に1秒固定
  });
};

onMounted(fetchNext);
</script>

<template>
  <div class="game-root">
    <WordDisplay :target="currentWord" />
      <div v-if="isSuccess">
        <p class="success-message">Correct!</p>
        <p class="success-sub-message">Click "Next Word" to continue.</p>
      </div>
    <TypeInput :target="currentWord" @success="handleSuccess" />

    <button @click="fetchNext" class="next-button">
      Next Word
    </button>
  </div>
</template>

<style scoped>
.game-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f0f0f0;
}
.success-message {
  color: #42b883;
  font-size: 2rem;
  text-align: center;
}
.success-sub-message {
  text-align: center;
  color: #42b883;
  font-size: 1.5rem;
}
.next-button {
  margin-top: 2rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
