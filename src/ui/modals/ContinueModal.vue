<script setup lang="ts">
import { computed, ref } from 'vue'
import { continueWithAd, continueWithTips, declineContinue } from '@/app/flow'
import { CONTINUE_COST } from '@/config/economy'
import { fmt, tr } from '@/i18n/tr'
import { useAppStore } from '@/stores/app'
import { useEconomyStore } from '@/stores/economy'
import { useSessionStore } from '@/stores/session'
import GameButton from '@/ui/components/GameButton.vue'
import Modal from '@/ui/components/Modal.vue'

const session = useSessionStore()
const econ = useEconomyStore()
const app = useAppStore()
const busy = ref(false)
const canPay = computed(() => econ.tips >= CONTINUE_COST)
const adOk = computed(() => !!session.continueOffer?.adAvailable)

async function watch() {
  busy.value = true
  await continueWithAd()
  busy.value = false
}

function goShop() {
  session.pendingShop = true
  declineContinue()
  app.showToast(tr.msg.shopAfterShift)
}
</script>

<template>
  <Modal :title="tr.continue.title" :closable="false">
    <p class="msg">{{ tr.continue.body }}</p>
    <div class="col">
      <GameButton variant="accent" icon="icon_ad" :disabled="!adOk || busy" @click="watch">
        {{ adOk ? tr.continue.watchAd : tr.common.adUnavailable }}
      </GameButton>
      <GameButton variant="metal" icon="icon_coin" :disabled="!canPay || busy" @click="continueWithTips">
        {{ fmt(tr.continue.payTips, { n: CONTINUE_COST }) }}
      </GameButton>
      <button v-if="!canPay" class="link" type="button" @click="goShop">{{ tr.common.goToShop }}</button>
      <GameButton :disabled="busy" @click="declineContinue">{{ tr.continue.decline }}</GameButton>
    </div>
  </Modal>
</template>

<style scoped>
.msg {
  margin: 0 0 14px;
  text-align: center;
  font-weight: 700;
  font-size: 17px;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.link {
  background: none;
  border: 0;
  color: var(--c-primary);
  font-weight: 800;
  text-decoration: underline;
  font-size: 15px;
  padding: 2px;
}
</style>
