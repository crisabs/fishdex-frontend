<script setup>
import { computed } from "vue";

const props = defineProps({
  value: {
    type: [Object, Array, String, Number, Boolean],
    default: null
  }
});

const formattedValue = computed(() => JSON.stringify(props.value, null, 2));
</script>

<template>
  <pre v-if="value !== null" class="json-viewer">{{ formattedValue }}</pre>
</template>
