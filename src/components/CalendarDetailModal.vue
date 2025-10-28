<template>
  <v-overlay :model-value="modelValue" class="align-center justify-center" scrim="rgba(0,0,0,0.35)" @click:outside="close">
    <div class="calendar-card" @click.stop>
      <div class="calendar-title">캘린더 일정 등록</div>
      <div class="calendar-form">
        <div class="form-row">
          <label class="label">내용</label>
          <v-text-field v-model="form.calendarName" variant="outlined" density="comfortable" hide-details placeholder="캘린더 이름" />
        </div>
        <div class="form-row">
          <label class="label">{{ form.calendarType === 'ToDo' ? '날짜' : '시작일' }}</label>
          <template v-if="form.calendarType === 'ToDo'">
            <v-text-field v-model="form.startedAtDate" type="date" variant="outlined" density="comfortable" hide-details />
          </template>
          <template v-else>
            <v-text-field v-model="form.startedAt" type="datetime-local" variant="outlined" density="comfortable" hide-details />
          </template>
        </div>
        <div class="form-row" v-if="form.calendarType !== 'ToDo'">
          <label class="label">종료일</label>
          <v-text-field v-model="form.endedAt" type="datetime-local" variant="outlined" density="comfortable" hide-details />
        </div>
        <div class="form-row">
          <label class="label">종류</label>
          <v-select v-model="form.calendarType" :items="typeItems" variant="outlined" density="comfortable" hide-details />
        </div>
        <div class="form-row" v-if="form.calendarType === '개인 일정' && form.recurrence !== 'NONE'">
          <label class="label">반복 종료일</label>
          <v-text-field v-model="form.repeatEndAtDate" type="date" variant="outlined" density="comfortable" hide-details />
        </div>
        <div class="form-row" v-if="form.calendarType === '개인 일정'">
          <label class="label">반복</label>
          <v-select
            v-model="form.recurrence"
            :items="recurrenceItems"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </div>
        <div class="form-row" v-if="form.calendarType !== '개인 일정'">
          <label class="label">북마크 여부</label>
          <v-switch v-model="form.bookmark" inset color="#FFE364" hide-details class="switch" />
        </div>
        <div class="form-row" v-if="form.calendarType !== 'ToDo'">
          <label class="label">공유 여부</label>
          <v-switch v-model="form.isShared" inset color="#FFE364" hide-details class="switch" />
        </div>
      </div>
      <div class="calendar-actions">
        <button class="btn outline" @click="close">취소</button>
        <button class="btn" @click="save">등록</button>
      </div>
    </div>
  </v-overlay>
</template>

<script>
export default {
  name: 'CalendarDetailModal',
  props: {
    modelValue: { type: Boolean, default: false },
    details: { type: Object, default: null },
  },
  emits: ['update:modelValue', 'save'],
  data() {
    return {
      form: {
        calendarName: '',
        startedAt: '',
        startedAtDate: '',
        endedAt: '',
        calendarType: '',
        repeatEndAtDate: '',
        recurrence: 'NONE',
        bookmark: false,
        isShared: false,
      },
      typeItems: ['개인 일정', 'ToDo'],
      recurrenceItems: [
        { title: '반복 없음', value: 'NONE' },
        { title: '매일', value: 'DAILY' },
        { title: '매주', value: 'WEEKLY' },
        { title: '매월', value: 'MONTHLY' },
        { title: '매년', value: 'YEARLY' },
      ],
    };
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(v){ if (v) this.hydrateForm(); }
    },
    details: {
      immediate: true,
      handler(){ if (this.modelValue) this.hydrateForm(); }
    }
  },
  methods: {
    close() { this.$emit('update:modelValue', false); },
    toInputDateTime(val){
      if (!val) return '';
      try {
        const d = new Date(val);
        if (isNaN(d)) return '';
        const pad = (n) => String(n).padStart(2,'0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch(_) { return ''; }
    },
    hydrateForm(){
      const d = this.details || {};
      this.form.calendarName = d.calendarName || '';
      this.form.startedAt = this.toInputDateTime(d.startedAt) || '';
      // date-only for ToDo convenience
      try {
        const dt = new Date(d.startedAt);
        if (!isNaN(dt)) {
          const pad = (n) => String(n).padStart(2,'0');
          this.form.startedAtDate = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
        } else {
          this.form.startedAtDate = '';
        }
      } catch(_) { this.form.startedAtDate = ''; }
      this.form.endedAt = this.toInputDateTime(d.endedAt) || '';
      this.form.calendarType = this.mapTypeToUi(d.calendarType);
      this.form.bookmark = Boolean(d.bookmark);
      this.form.isShared = Boolean(d.isShared);
      // recurrence defaulting (개인 일정일 때만 의미 있음)
      if (this.form.calendarType === '개인 일정') {
        const allowed = this.recurrenceItems.map(i => (i && i.value) ? i.value : i);
        const rawRepeat = (d.repeatType !== undefined && d.repeatType !== null) ? d.repeatType : d.recurrence;
        const upper = rawRepeat ? String(rawRepeat).toUpperCase() : '';
        this.form.recurrence = (upper && allowed.includes(upper)) ? upper : 'NONE';
      } else {
        this.form.recurrence = 'NONE';
      }
      // 기본값 설정
      const now = new Date();
      if (this.form.calendarType === 'ToDo') {
        if (!this.form.startedAtDate) {
          const pad = (n) => String(n).padStart(2,'0');
          this.form.startedAtDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
        }
        this.form.startedAt = '';
        this.form.endedAt = '';
      } else {
        if (!this.form.startedAt) {
          const pad = (n) => String(n).padStart(2,'0');
          const s = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
          this.form.startedAt = s;
        }
        if (!this.form.endedAt) {
          const later = new Date(now.getTime() + 60*60*1000);
          const pad = (n) => String(n).padStart(2,'0');
          const e = `${later.getFullYear()}-${pad(later.getMonth()+1)}-${pad(later.getDate())}T${pad(later.getHours())}:${pad(later.getMinutes())}`;
          this.form.endedAt = e;
        }
        // 반복 종료일: 서버 repeatEndAt가 오면 우선 사용, 없으면 endedAt 기준으로 recurrence에 따라 설정
        if (d.repeatEndAt) {
          try {
            const dt = new Date(d.repeatEndAt);
            if (!isNaN(dt)) {
              const pad = (n) => String(n).padStart(2,'0');
              this.form.repeatEndAtDate = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
            }
          } catch(_) { /* noop */ }
        }
        if (!this.form.repeatEndAtDate) {
          const base = this.form.endedAt ? new Date(this.form.endedAt) : (this.form.startedAt ? new Date(this.form.startedAt) : now);
          const next = this.computeNextDate(base, this.form.recurrence);
          const pad = (n) => String(n).padStart(2,'0');
          this.form.repeatEndAtDate = `${next.getFullYear()}-${pad(next.getMonth()+1)}-${pad(next.getDate())}`;
        }
      }
    },
    computeNextDate(baseDate, recurrence){
      const d = new Date(baseDate);
      if (isNaN(d)) return new Date();
      const r = String(recurrence || 'NONE').toUpperCase();
      if (r === 'DAILY') { d.setDate(d.getDate() + 1); return d; }
      if (r === 'WEEKLY') { d.setDate(d.getDate() + 7); return d; }
      if (r === 'MONTHLY') { d.setMonth(d.getMonth() + 1); return d; }
      if (r === 'YEARLY') { d.setFullYear(d.getFullYear() + 1); return d; }
      return d;
    },
    mapTypeToUi(raw){
      const v = (raw || '').toString().toUpperCase();
      if (v === 'SCHEDULE') return '개인 일정';
      if (v === 'TODO') return 'ToDo';
      if (raw === '개인 일정' || raw === 'ToDo') return raw;
      return '개인 일정';
    },
    save(){
      const payload = { ...this.form };
      if (this.form.calendarType === 'ToDo') {
        // prefer date-only value for startedAt
        payload.startedAt = this.form.startedAtDate || this.form.startedAt;
        delete payload.endedAt;
      }
      this.$emit('save', payload);
      this.close();
    }
  }
}
</script>

<style scoped>
.calendar-card{
  width: 420px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  padding: 16px;
  color: #2A2828; /* ensure text visible on light bg */
}
.calendar-title{ font-weight: 700; font-size: 16px; background: #FFE364; color: #1C0F0F; padding: 12px 16px; border-radius: 12px 12px 0 0; margin: -16px -16px 12px -16px; width: calc(100% + 32px); box-sizing: border-box; }
.calendar-form{ display: grid; grid-template-columns: 1fr; row-gap: 10px; }
.form-row{ display: grid; grid-template-columns: 80px 1fr; align-items: center; column-gap: 12px; }
.label{ color: #757575; font-size: 14px; }
.switch{ justify-self: start; }
.calendar-actions{ display: flex; justify-content: flex-end; margin-top: 12px; gap: 8px; }
.calendar-actions .btn{ background: #FFE364; color: #2A2828; border: 0; border-radius: 10px; padding: 6px 12px; cursor: pointer; }
.calendar-actions .btn.outline{ background: #FFFFFF; color: #2A2828; border: 1px solid #E5E5E5; }
/* remove focus ring on action buttons */
.calendar-actions .btn:focus,
.calendar-actions .btn:focus-visible,
.calendar-actions .btn:active{ outline: none !important; box-shadow: none !important; }
.calendar-actions .btn{ -webkit-tap-highlight-color: transparent; }

/* Vuetify input text color overrides within this scoped component */
:deep(.v-field__input),
:deep(.v-input input),
:deep(.v-input textarea){
  color: #2A2828 !important;
}
:deep(.v-field input::placeholder),
:deep(.v-text-field input::placeholder){
  color: #9E9E9E !important;
}
</style>


