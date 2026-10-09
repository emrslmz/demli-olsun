<script setup lang="ts">
/** Mesai öncesi güçlendirici seçimi (her birinden en fazla 1). */
import { computed, ref } from 'vue'
import { startShift } from '@/app/flow'
import type { BoosterId } from '@/config/economy'
import { fmt, tr } from '@/i18n/tr'
import { ThemeService } from '@/services/theme/ThemeService'
import { useAppStore } from '@/stores/app'
import { useInventoryStore } from '@/stores/inventory'
import GameButton from '@/ui/components/GameButton.vue'
import Modal from '@/ui/components/Modal.vue'

const inv = useInventoryStore()
const app = useAppStore()
const picked = ref<BoosterId[]>([])
const items = computed(() =>
  (['ustaGozu', 'sabirTasi', 'yedekBardak'] as BoosterId[]).map((id) => ({
    id,
    name: tr.boosters[id],
    desc: tr.boosters[`${id}Desc` as const],
    have: inv.boosters[id] ?? 0,
  })),
)

function toggle(id: BoosterId) {
  const i = picked.value.indexOf(id)
  if (i >= 0) picked.value.splice(i, 1)
  else if ((inv.boosters[id] ?? 0) > 0) picked.value.push(id)
}

const icons: Record<BoosterId, string> = { ustaGozu: 'icon_info', sabirTasi: 'icon_clock', yedekBardak: 'icon_life' }
</script>

<template>
  <Modal :title="tr.boosters.title" @close="app.open(null)">
    <p class="sub">{{ tr.boosters.subtitle }}</p>
    <div class="list">
      <button
        v-for="b in items"
        :key="b.id"
        type="button"
        class="item"
        :class="{ on: picked.includes(b.id), off: b.have === 0 }"
        @click="toggle(b.id)"
      >
        <img :src="ThemeService.url(icons[b.id])" alt="" />
        <span class="txt"
          ><b>{{ b.name }}</b
          ><small>{{ b.desc }}</small></span
        >
        <span class="have">{{ fmt(tr.boosters.have, { n: b.have }) }}</span>
      </button>
    </div>
    <div class="col">
      <GameButton variant="primary" size="big" @click="startShift(picked)">{{
        picked.length ? tr.boosters.start : tr.boosters.none
      }}</GameButton>
    </div>
  </Modal>
</template>

<style scoped>
.sub {
  margin: 0 0 10px;
  text-align: center;
  font-weight: 700;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}
.item {
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  background: rgba(255, 255, 255, 0.55);
  border: 3px solid rgba(59, 36, 22, 0.35);
  border-radius: 14px;
  padding: 8px 10px;
  color: var(--c-ink);
  font-family: var(--f-ui);
  transition: transform 80ms;
}
.item:active {
  transform: scale(0.98);
}
.item.on {
  border-color: var(--c-good);
  background: #e9f7df;
  box-shadow: 0 0 0 3px rgba(78, 154, 58, 0.25);
}
.item.off {
  opacity: 0.55;
}
.item img {
  width: 44px;
  height: 44px;
}
.txt {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.txt small {
  font-weight: 600;
  opacity: 0.85;
}
.have {
  font-weight: 900;
  font-size: 13px;
  white-space: nowrap;
}
.col {
  display: flex;
  flex-direction: column;
}
</style>
