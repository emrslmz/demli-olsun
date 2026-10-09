<script setup lang="ts">
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'

defineProps<{ label: string; desc?: string; modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

function flip(v: boolean) {
  AudioService.play('button')
  HapticsService.trigger('button')
  emit('update:modelValue', v)
}
</script>

<template>
  <label class="row">
    <span class="row__txt">
      <b>{{ label }}</b>
      <small v-if="desc">{{ desc }}</small>
    </span>
    <input type="checkbox" class="sr" :checked="modelValue" @change="flip(($event.target as HTMLInputElement).checked)" />
    <span class="sw" :class="{ on: modelValue }" aria-hidden="true"><i /></span>
  </label>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
  min-height: 56px;
  cursor: pointer;
}
.row__txt {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.row__txt b {
  font-weight: 900;
  font-size: 17px;
}
.row__txt small {
  font-weight: 600;
  opacity: 0.75;
}
.sr {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.sw {
  width: 62px;
  height: 36px;
  border-radius: 99px;
  background: #b9a98a;
  border: 3px solid var(--c-dark);
  position: relative;
  transition: background 150ms;
  flex: none;
}
.sw i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fffaf0;
  border: 3px solid var(--c-dark);
  box-sizing: border-box;
  transition: transform 150ms cubic-bezier(0.3, 1.4, 0.5, 1);
}
.sw.on {
  background: var(--c-good);
}
.sw.on i {
  transform: translateX(26px);
}
</style>
