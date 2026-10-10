<script setup lang="ts">
/** Tıknaz buton: basınca hafif küçülür, ses ve titreşim verir. */
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'
import { ThemeService } from '@/services/theme/ThemeService'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'go' | 'accent' | 'blue' | 'metal' | 'ghost'
    size?: 'small' | 'normal' | 'big' | 'icon'
    icon?: string
    disabled?: boolean
    silent?: boolean
  }>(),
  { variant: 'default', size: 'normal', icon: undefined, disabled: false, silent: false },
)
const emit = defineEmits<{ click: [] }>()

function down() {
  if (props.disabled || props.silent) return
  AudioService.play('button')
  HapticsService.trigger('button')
}

function click() {
  if (!props.disabled) emit('click')
}
</script>

<template>
  <button
    type="button"
    class="btn"
    :class="[variant !== 'default' && `btn--${variant}`, size !== 'normal' && `btn--${size}`]"
    :disabled="disabled"
    @pointerdown="down"
    @click="click"
  >
    <img v-if="icon" :src="ThemeService.url(icon)" alt="" />
    <slot />
  </button>
</template>
