<script setup lang="ts">
/**
 * Liderlik: haftalık lig (30 kişilik grup, yükselme/düşme bölgeleri, geri sayım), günün siparişi tablosu,
 * tüm zamanlar. Mock modda "Rakipler simülasyondur." notu görünür.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { now as clockNow } from '@/app/clock'
import { startDaily } from '@/app/flow'
import { leagueState, resolveLeagueWeek } from '@/app/league'
import { DEMOTE_COUNT, GROUP_SIZE, PROMOTE_COUNT, tierDef, type DailyRow } from '@/core/league'
import { duration, fmt, num, pct1, tr } from '@/i18n/tr'
import { LEADERBOARD_MODE, services } from '@/services'
import type { AllTimeRow, WeeklyBoard } from '@/services/leaderboard/LeaderboardService'
import { ThemeService } from '@/services/theme/ThemeService'
import { useAppStore } from '@/stores/app'
import { useDailyStore } from '@/stores/daily'
import { usePlayerStore } from '@/stores/player'
import GameButton from '@/ui/components/GameButton.vue'
import TopBar from '@/ui/components/TopBar.vue'

type Tab = 'weekly' | 'daily' | 'allTime'
const app = useAppStore()
const daily = useDailyStore()
const player = usePlayerStore()
const tab = ref<Tab>('weekly')
const weekly = ref<WeeklyBoard | null>(null)
const dailyRows = ref<DailyRow[] | null>(null)
const allTime = ref<AllTimeRow[] | null>(null)
const tick = ref(clockNow().getTime())
const list = ref<HTMLElement | null>(null)
let timer = 0

const tier = computed(() => tierDef(weekly.value?.tier ?? 'mahalle'))
const msLeft = computed(() => (weekly.value ? Math.max(0, weekly.value.msLeft - (tick.value - loadedAt)) : 0))
let loadedAt = Date.now()

async function load(t: Tab) {
  const at = clockNow()
  if (t === 'weekly') {
    await resolveLeagueWeek()
    weekly.value = await services.leaderboard.weekly(leagueState(), at)
    loadedAt = clockNow().getTime()
  } else if (t === 'daily') {
    const e = daily.todayEntry
    dailyRows.value = e
      ? await services.leaderboard.daily(daily.today, {
          name: player.nickname || tr.leaderboard.you,
          accuracy: e.accuracy,
          timeSec: e.timeSec,
        })
      : null
  } else {
    allTime.value = await services.leaderboard.allTime(leagueState())
  }
  await nextTick()
  list.value?.querySelector('.me')?.scrollIntoView({ block: 'center' })
}

/** Uzun tablolarda ilk 10 + oyuncunun çevresi. */
function compact<T extends { rank: number; isPlayer: boolean }>(rows: T[]): (T | null)[] {
  const me = rows.findIndex((r) => r.isPlayer)
  if (rows.length <= 25 || me < 0) return rows
  const out: (T | null)[] = rows.slice(0, 10)
  const from = Math.max(10, me - 3)
  if (from > 10) out.push(null)
  out.push(...rows.slice(from, Math.min(rows.length, me + 4)))
  if (me + 4 < rows.length) out.push(null)
  return out
}

function zone(rank: number): 'up' | 'down' | '' {
  const i = ['mahalle', 'ilce', 'sehir', 'bolge', 'turkiye'].indexOf(tier.value.id)
  if (rank <= PROMOTE_COUNT && i < 4) return 'up'
  if (rank > GROUP_SIZE - DEMOTE_COUNT && i > 0) return 'down'
  return ''
}

watch(tab, (t) => void load(t))

onMounted(() => {
  void load('weekly')
  timer = window.setInterval(() => (tick.value = clockNow().getTime()), 1000)
  if (!app.noAds) void services.ads.showBanner()
})
onBeforeUnmount(() => {
  clearInterval(timer)
  void services.ads.hideBanner()
})
</script>

<template>
  <div class="lb" :style="{ paddingBottom: `calc(${app.bannerHeight}px)` }">
    <TopBar :title="tr.leaderboard.title" @back="app.go('menu')" />
    <nav class="tabs">
      <button
        v-for="t in ['weekly', 'daily', 'allTime'] as Tab[]"
        :key="t"
        type="button"
        class="tab"
        :class="{ on: tab === t }"
        @click="tab = t"
      >
        {{ tr.leaderboard.tabs[t] }}
      </button>
    </nav>
    <section class="sheet">
      <!-- Haftalık lig -->
      <template v-if="tab === 'weekly'">
        <header v-if="weekly" class="league">
          <img :src="ThemeService.url(tier.badge)" alt="" />
          <div class="league__txt">
            <b>{{ fmt(tr.leaderboard.league, { name: tier.name }) }}</b>
            <small>{{ fmt(tr.leaderboard.endsIn, { time: duration(msLeft) }) }}</small>
            <small class="gap">
              {{ weekly.gapToNext === null ? tr.leaderboard.first : fmt(tr.leaderboard.gap, { n: num(weekly.gapToNext) }) }}
            </small>
          </div>
        </header>
        <div ref="list" class="rows">
          <template v-for="r in weekly?.rows ?? []" :key="r.id">
            <div v-if="r.rank === PROMOTE_COUNT + 1 && zone(PROMOTE_COUNT) === 'up'" class="line up">
              ▲ {{ fmt(tr.leaderboard.promote, { n: PROMOTE_COUNT }) }}
            </div>
            <div v-if="r.rank === GROUP_SIZE - DEMOTE_COUNT + 1 && zone(r.rank) === 'down'" class="line down">
              ▼ {{ fmt(tr.leaderboard.demote, { n: DEMOTE_COUNT }) }}
            </div>
            <div class="row" :class="[zone(r.rank), { me: r.isPlayer }]">
              <span class="rank">{{ r.rank }}</span>
              <span class="name">{{ r.isPlayer ? `${r.name} (${tr.leaderboard.you})` : r.name }}</span>
              <b class="score">{{ num(r.score) }}</b>
            </div>
          </template>
        </div>
      </template>

      <!-- Günün siparişi -->
      <template v-else-if="tab === 'daily'">
        <div v-if="!daily.todayEntry" class="empty">
          <p>{{ tr.leaderboard.noDaily }}</p>
          <GameButton variant="accent" icon="icon_clock" @click="startDaily">{{ tr.menu.daily }}</GameButton>
        </div>
        <div v-else ref="list" class="rows">
          <template v-for="(r, i) in compact(dailyRows ?? [])" :key="r ? `d${r.rank}` : `gap${i}`">
            <div v-if="!r" class="dots">⋯</div>
            <div v-else class="row" :class="{ me: r.isPlayer, gold: r.rank <= 3 }">
              <span class="rank">{{ r.rank }}</span>
              <span class="name">{{ r.isPlayer ? `${r.name} (${tr.leaderboard.you})` : r.name }}</span>
              <small class="time">{{ pct1(r.timeSec) }} sn</small>
              <b class="score">%{{ pct1(r.accuracy) }}</b>
            </div>
          </template>
        </div>
      </template>

      <!-- Tüm zamanlar -->
      <div v-else ref="list" class="rows">
        <template v-for="(r, i) in compact(allTime ?? [])" :key="r ? `a${r.rank}` : `gap${i}`">
          <div v-if="!r" class="dots">⋯</div>
          <div v-else class="row" :class="{ me: r.isPlayer, gold: r.rank <= 3 }">
            <span class="rank">{{ r.rank }}</span>
            <span class="name">{{ r.isPlayer ? `${r.name} (${tr.leaderboard.you})` : r.name }}</span>
            <b class="score">{{ num(r.score) }}</b>
          </div>
        </template>
      </div>
      <p v-if="LEADERBOARD_MODE === 'mock'" class="sim">{{ tr.leaderboard.simulated }}</p>
    </section>
  </div>
</template>

<style scoped>
.lb {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: rgba(24, 12, 4, 0.55);
}
.tabs {
  display: flex;
  gap: 6px;
  padding: 0 14px;
  width: min(100%, 560px);
  align-self: center;
}
.tab {
  flex: 1;
  border: 3px solid var(--c-dark);
  border-bottom: 0;
  border-radius: 14px 14px 0 0;
  background: var(--c-paper-2);
  color: var(--c-ink);
  font-weight: 900;
  font-size: 14px;
  min-height: 44px;
  padding: 8px 4px;
  opacity: 0.8;
}
.tab.on {
  background: var(--c-primary);
  color: var(--c-on-primary, #fff);
  opacity: 1;
}
.sheet {
  flex: 1;
  min-height: 0;
  width: min(calc(100% - 28px), 532px);
  align-self: center;
  margin-bottom: calc(12px + var(--safe-bottom));
  background: var(--c-paper);
  border: 4px solid var(--c-dark);
  border-radius: 0 0 22px 22px;
  box-shadow: 0 6px 0 var(--c-dark);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.league {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 3px dashed rgba(59, 36, 22, 0.25);
}
.league img {
  width: 64px;
  height: 64px;
  animation: pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.league__txt {
  display: flex;
  flex-direction: column;
}
.league__txt b {
  font-family: var(--f-chalk);
  font-size: 26px;
  line-height: 1.05;
}
.league__txt small {
  font-weight: 800;
  opacity: 0.8;
}
.league__txt .gap {
  color: var(--c-warm);
  opacity: 1;
}
.rows {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 10px;
  background: rgba(59, 36, 22, 0.06);
  font-weight: 800;
}
.row.up {
  background: rgba(78, 154, 58, 0.14);
}
.row.down {
  background: rgba(192, 57, 43, 0.12);
}
.row.gold .rank {
  background: var(--c-metal);
  color: var(--c-on-metal, var(--c-ink));
}
.row.me {
  background: var(--c-warm);
  color: var(--c-on-warm, #fff6e6);
  box-shadow: 0 3px 0 var(--c-dark);
  transform: scale(1.02);
}
.rank {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 36, 22, 0.12);
  font-weight: 900;
  font-size: 14px;
}
.me .rank {
  background: rgba(255, 246, 230, 0.25);
}
.name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.time {
  font-weight: 700;
  opacity: 0.7;
}
.score {
  font-weight: 1000;
}
.line {
  font-size: 12px;
  font-weight: 900;
  text-align: center;
  padding: 2px 0;
}
.line.up {
  color: var(--c-good);
}
.line.down {
  color: var(--c-bad);
}
.dots {
  text-align: center;
  font-weight: 900;
  opacity: 0.5;
}
.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  text-align: center;
  font-weight: 800;
}
.sim {
  margin: 0;
  padding: 6px 10px 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  opacity: 0.65;
}
@keyframes pop {
  from {
    transform: scale(0.4);
  }
}
</style>
