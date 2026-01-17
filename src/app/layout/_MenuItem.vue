<template>
  <router-link class="item" :to="to" active-class="active">
    {{ label }}
  </router-link>
</template>

<script setup>
defineProps({
  to: { type: String, required: true },
  label: { type: String, required: true },
})
</script>

<style scoped>
.item {
  display:block;
  padding: 8px 10px;
  border-radius: 8px;
  color: #333;
  text-decoration: none;
}
.item:hover { background: #f6f6f6; }
.active { background: #eef3ff; }
</style>
