<template>
  <div class="color-picker-wrap">
    <div class="swatch-btn" :style="{ background: modelValue }" @click="$refs.picker.click()">
      <input ref="picker" type="color" :value="modelValue" @input="e => emit('update:modelValue', e.target.value)" class="hidden-picker" />
    </div>
    <input
      type="text"
      class="hex-field"
      :value="modelValue"
      @change="e => { if(/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) emit('update:modelValue', e.target.value) }"
      maxlength="7"
      spellcheck="false"
      placeholder="#000000"
    />
    <div class="presets">
      <div v-for="c in presets" :key="c" class="preset-dot" :style="{ background: c }" :class="{ active: modelValue === c }" @click="emit('update:modelValue', c)" :title="c"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])
const presets = ['#0b4526','#1f6feb','#7c3aed','#dc2626','#ea580c','#0891b2','#111827','#6b7280']
</script>

<style scoped>
.color-picker-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.swatch-btn { width: 32px; height: 32px; border-radius: 8px; border: 2px solid rgba(255,255,255,.15); cursor: pointer; position: relative; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,.3); transition: transform .15s; }
.swatch-btn:hover { transform: scale(1.1); }
.hidden-picker { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
.hex-field { background: var(--bg3); border: 1.5px solid var(--border); color: var(--text); font-family: monospace; font-size: 13px; padding: 5px 10px; border-radius: 7px; width: 88px; outline: none; transition: border-color .15s; }
.hex-field:focus { border-color: var(--accent); }
.presets { display: flex; gap: 5px; flex-wrap: wrap; }
.preset-dot { width: 18px; height: 18px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all .15s; }
.preset-dot:hover { transform: scale(1.2); }
.preset-dot.active { border-color: white; box-shadow: 0 0 0 2px rgba(255,255,255,.4); }
</style>
