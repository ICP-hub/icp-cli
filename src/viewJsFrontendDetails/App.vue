<script setup>
import { ref } from 'vue';
let greeting = ref('');

async function handleSubmit(e) {
  e.preventDefault();
  const target = e.target;
  const name = target.querySelector('#name').value;
  greeting.value = name;
}
</script>

<template>
  <main>
    <img src="/logo2.svg" alt="DFINITY logo" />
    <br />
    <br />
    <form action="#" @submit="handleSubmit">
      <label for="name">Enter your name: &nbsp;</label>
      <input id="name" alt="Name" type="text" />
      <button type="submit">Click Me!</button>
    </form>
    <section id="greeting" v-if="greeting">
      Hello {{ greeting }}
    </section>
  </main>
</template>
