// Egypt + Islamic + global event calendar for the Social Agent.
// Used by daily-post to decide whether today (or the next few days) calls
// for a holiday/event greeting post.
//
// Dates are stored either as fixed Gregorian (e.g. "MM-DD") or as explicit
// per-year dates for Islamic holidays (which shift by ~11 days each year).
//
// To update Islamic dates each year, edit the ISLAMIC_DATES table below.

const ISLAMIC_DATES = {
  // For Hijri-based events, list { gregorian: "YYYY-MM-DD", name, ... }
  // 2026 dates (approximate — verify each year):
  ramadan_start:        { 2026: '2026-02-17', 2027: '2027-02-07' },
  ramadan_end:          { 2026: '2026-03-19', 2027: '2027-03-09' },
  eid_al_fitr:          { 2026: '2026-03-20', 2027: '2027-03-10' },
  eid_al_adha:          { 2026: '2026-05-27', 2027: '2027-05-17' },
  islamic_new_year:     { 2026: '2026-06-17', 2027: '2027-06-06' },
  ashura:               { 2026: '2026-06-26', 2027: '2027-06-15' },
  mawlid_an_nabi:       { 2026: '2026-08-26', 2027: '2027-08-15' },
  isra_wal_miraj:       { 2026: '2026-01-16', 2027: '2027-01-05' },
};

const FIXED_EVENTS = [
  // Egyptian national days
  { date: '01-07', name_ar: 'عيد الميلاد المجيد',   name_en: 'Coptic Christmas',           type: 'religious-coptic', greeting: true,  motif: '✝️' },
  { date: '01-25', name_ar: 'ثورة 25 يناير',         name_en: 'January 25 Revolution',      type: 'national-eg',      greeting: false, motif: '🇪🇬' },
  { date: '03-21', name_ar: 'عيد الأم',              name_en: "Mother's Day",               type: 'social',           greeting: true,  motif: '🌹' },
  { date: '04-25', name_ar: 'عيد تحرير سيناء',       name_en: 'Sinai Liberation Day',       type: 'national-eg',      greeting: false, motif: '🇪🇬' },
  { date: '05-01', name_ar: 'عيد العمال',            name_en: 'Labor Day',                  type: 'national-eg',      greeting: true,  motif: '⚒️' },
  { date: '07-23', name_ar: 'ثورة 23 يوليو',         name_en: 'July 23 Revolution',         type: 'national-eg',      greeting: false, motif: '🇪🇬' },
  { date: '10-06', name_ar: 'نصر أكتوبر',            name_en: 'October 6 Victory',          type: 'national-eg',      greeting: true,  motif: '🇪🇬' },
  // Gregorian
  { date: '01-01', name_ar: 'رأس السنة الميلادية',   name_en: 'New Year',                   type: 'global',           greeting: true,  motif: '🎉' },
  { date: '12-25', name_ar: 'عيد الميلاد المجيد',    name_en: 'Christmas',                  type: 'religious',        greeting: true,  motif: '🎄' },
  { date: '02-14', name_ar: 'عيد الحب',              name_en: "Valentine's Day",            type: 'social',           greeting: false, motif: '❤️' },
  { date: '03-08', name_ar: 'اليوم العالمي للمرأة',  name_en: "International Women's Day",  type: 'global',           greeting: true,  motif: '💜' },
];

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return { full: `${y}-${m}-${day}`, mmdd: `${m}-${day}`, y };
}

function islamicEventsFor(year) {
  const out = [];
  for (const [key, byYear] of Object.entries(ISLAMIC_DATES)) {
    const date = byYear[year];
    if (!date) continue;

    const meta = ISLAMIC_META[key];
    if (!meta) continue;
    out.push({ date, ...meta });
  }
  return out;
}

const ISLAMIC_META = {
  ramadan_start: {
    name_ar: 'أول رمضان', name_en: 'First of Ramadan',
    type: 'religious-islamic', greeting: true,  motif: '🌙',
  },
  ramadan_end: {
    name_ar: 'وقفة عيد الفطر', name_en: 'Last day of Ramadan',
    type: 'religious-islamic', greeting: false, motif: '🌙',
  },
  eid_al_fitr: {
    name_ar: 'عيد الفطر المبارك', name_en: 'Eid al-Fitr',
    type: 'religious-islamic', greeting: true,  motif: '🌙',
  },
  eid_al_adha: {
    name_ar: 'عيد الأضحى المبارك', name_en: 'Eid al-Adha',
    type: 'religious-islamic', greeting: true,  motif: '🌙',
  },
  islamic_new_year: {
    name_ar: 'رأس السنة الهجرية', name_en: 'Islamic New Year',
    type: 'religious-islamic', greeting: true,  motif: '🌙',
  },
  ashura: {
    name_ar: 'يوم عاشوراء', name_en: 'Day of Ashura',
    type: 'religious-islamic', greeting: false, motif: '🌙',
  },
  mawlid_an_nabi: {
    name_ar: 'المولد النبوي الشريف', name_en: 'Mawlid an-Nabi',
    type: 'religious-islamic', greeting: true,  motif: '🌙',
  },
  isra_wal_miraj: {
    name_ar: 'الإسراء والمعراج', name_en: "Isra' wal Mi'raj",
    type: 'religious-islamic', greeting: true,  motif: '🌙',
  },
};

/**
 * Returns events that fall today or within `daysAhead` days.
 * Each event has a `daysUntil` field (0 = today).
 */
function getUpcomingEvents({ today = new Date(), daysAhead = 5 } = {}) {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const events = [];

  // Fixed (Gregorian) events — current year and next year to catch year wraparound
  for (const ev of FIXED_EVENTS) {
    for (const yearOffset of [0, 1]) {
      const year = t.getFullYear() + yearOffset;
      const [mm, dd] = ev.date.split('-').map((n) => parseInt(n, 10));
      const eventDate = new Date(year, mm - 1, dd);
      const days = Math.round((eventDate - t) / 86400000);
      if (days >= 0 && days <= daysAhead) {
        events.push({ ...ev, gregorian: eventDate.toISOString().slice(0, 10), daysUntil: days });
      }
    }
  }

  // Islamic events — already have explicit Gregorian dates
  for (const yearOffset of [0, 1]) {
    const year = t.getFullYear() + yearOffset;
    for (const ev of islamicEventsFor(year)) {
      const [y, m, d] = ev.date.split('-').map((n) => parseInt(n, 10));
      const eventDate = new Date(y, m - 1, d);
      const days = Math.round((eventDate - t) / 86400000);
      if (days >= 0 && days <= daysAhead) {
        events.push({ ...ev, gregorian: ev.date, daysUntil: days });
      }
    }
  }

  return events.sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Returns the most important upcoming event, or null. */
function getNextEvent(opts) {
  const ev = getUpcomingEvents(opts);
  return ev.length ? ev[0] : null;
}

/** Returns Arabic + English day-of-week + a friendly date string. */
function describeToday(date = new Date()) {
  const arDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const arMonths = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const d = date.getDate();
  const m = arMonths[date.getMonth()];
  const y = date.getFullYear();
  const arDay = arDays[date.getDay()];

  return {
    arabic_full: `${arDay} ${d} ${m} ${y}`,
    arabic_short: `${arDay}`,
    english_full: date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    iso: date.toISOString().slice(0, 10),
    dayOfWeek: date.getDay(),
    isWeekend: date.getDay() === 5 || date.getDay() === 6, // Fri/Sat in Egypt
  };
}

module.exports = { getUpcomingEvents, getNextEvent, describeToday, FIXED_EVENTS };
