<script setup lang="ts">
/** İlk açılış: takma ad. Bir öneriyle gelir ("Çaycı" + 2–3 rakam). */
import { computed, ref } from 'vue'
import { validateNickname } from '@/data/profanity'
import { tr } from '@/i18n/tr'
import { suggestNickname } from '@/services/save/schema'
import { ThemeService } from '@/services/theme/ThemeService'
import { usePlayerStore } from '@/stores/player'
import GameButton from '@/ui/components/GameButton.vue'
import Panel from '@/ui/components/Panel.vue'

const props = withDefaults(defineProps<{ editing?: boolean }>(), { editing: false })
const emit = defineEmits<{ done: [name: string]; cancel: [] }>()
const player = usePlayerStore()
const name = ref(player.nickname || suggestNickname())
const touched = ref(false)

const error = computed(() => {
  const e = validateNickname(name.value)
  if (!e) return ''
  return { short: tr.onboarding.errShort, long: tr.onboarding.errLong, chars: tr.onboarding.errChars, bad: tr.onboarding.errBad }[e]
})

function suggest() {
  name.value = suggestNickname()
  touched.value = false
}

function submit() {
  touched.value = true
  if (error.value) return
  emit('done', name.value.trim())
}
</script>

<template>
  <div class="ob">
    <img class="ob__logo" :src="ThemeService.url('char_riza_happy')" alt="" />
    <Panel>
      <form class="ob__body" @submit.prevent="submit">
        <h1 class="ob__title">{{ props.editing ? tr.settings.nickname : tr.onboarding.title }}</h1>
        <p class="ob__text">{{ tr.onboarding.body }}</p>
        <div class="ob__field">
          <input
            v-model="name"
            class="ob__input"
            maxlength="20"
            autocomplete="off"
            autocapitalize="words"
            spellcheck="false"
            :placeholder="tr.onboarding.placeholder"
            :aria-invalid="!!error && touched"
            @input="touched = true"
          />
          <GameButton size="small" variant="metal" @click="suggest">{{ tr.onboarding.suggest }}</GameButton>
        </div>
        <p class="ob__hint" :class="{ err: error && touched }">{{ error && touched ? error : tr.onboarding.hint }}</p>
        <GameButton variant="primary" size="big" :disabled="!!error" @click="submit">{{
          props.editing ? tr.common.ok : tr.onboarding.start
        }}</GameButton>
        <GameButton v-if="props.editing" @click="emit('cancel')">{{ tr.common.cancel }}</GameButton>
      </form>
    </Panel>
  </div>
</template>

<style scoped>
.ob {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(16px + var(--safe-top)) 16px calc(16px + var(--safe-bottom));
  background: rgba(24, 12, 4, 0.55);
  z-index: 60;
}
.ob__logo {
  width: min(42vw, 200px);
  margin-bottom: -26px;
  z-index: 1;
  filter: drop-shadow(0 6px 0 rgba(30, 14, 4, 0.45));
}
.ob > :deep(.ppanel) {
  width: min(92vw, 420px);
}
.ob__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
}
.ob__title {
  margin: 0;
  text-align: center;
  font-family: var(--f-chalk);
  font-size: 32px;
}
.ob__text {
  margin: 0;
  text-align: center;
  font-weight: 700;
}
.ob__field {
  display: flex;
  gap: 8px;
}
.ob__input {
  flex: 1;
  min-width: 0;
  font-size: 20px;
  font-weight: 800;
  padding: 10px 12px;
  border-radius: 12px;
  border: 3px solid var(--c-dark);
  background: #fffaf0;
  color: var(--c-ink);
  outline: none;
}
.ob__input:focus {
  box-shadow: 0 0 0 3px rgba(30, 154, 168, 0.4);
}
.ob__hint {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  opacity: 0.8;
}
.ob__hint.err {
  color: var(--c-bad);
  opacity: 1;
}
</style>
