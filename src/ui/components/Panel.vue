<script setup lang="ts">
/** Cartoon kâğıt panel: krem zemin, kalın koyu kenar, üstte parlama, altta kalın gölge. */
</script>

<template>
  <div class="ppanel">
    <div class="ppanel__inner"><slot /></div>
  </div>
</template>

<style scoped>
.ppanel {
  width: 100%;
  display: flex;
  min-height: 0;
  position: relative;
  background: linear-gradient(180deg, #fffaf0 0%, #fff3dc 60%, #f6e3c0 100%);
  border: 4px solid var(--c-dark);
  border-radius: 28px;
  box-shadow:
    0 8px 0 rgba(42, 20, 8, 0.85),
    0 14px 26px rgba(20, 8, 2, 0.35),
    inset 0 -6px 0 rgba(160, 110, 60, 0.18),
    inset 0 3px 0 rgba(255, 255, 255, 0.9);
  padding: 18px 18px 20px;
}
.ppanel::before {
  content: '';
  position: absolute;
  left: 18px;
  right: 40%;
  top: 9px;
  height: 9px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.85);
  pointer-events: none;
}
.ppanel__inner {
  width: 100%;
  overflow: auto;
  max-height: calc(100dvh - 120px - var(--safe-top) - var(--safe-bottom));
  color: var(--c-ink);
  -webkit-overflow-scrolling: touch;
}
</style>
