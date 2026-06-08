// src/admin.jsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var { useEffect, useMemo, useState, useCallback } = React;
var LINE = "1px solid #f0f0f0";
var LINE2 = "1px solid #e5e7eb";
var C = {
  bg: "#ffffff",
  surface: "#ffffff",
  soft: "#f9fafb",
  text: "#111827",
  mid: "#6b7280",
  light: "#9ca3af",
  accent: "#16a34a",
  accentSoft: "#dcfce7",
  accentText: "#14532d",
  warn: "#d97706",
  warnSoft: "#fef9c3",
  warnText: "#78350f",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
  dangerText: "#7f1d1d",
  border: "#f0f0f0",
  borderMid: "#e5e7eb"
};
var JOB_STATUS = {
  waiting_for_review: { label: "\u010Cek\xE1 na kontrolu", dot: C.warn, pill: C.warnSoft, text: C.warnText },
  waiting_for_client_details: { label: "\u010Cek\xE1 na klienta", dot: C.light, pill: "#f3f4f6", text: C.mid },
  ready_to_offer: { label: "P\u0159ipravena", dot: C.accent, pill: C.accentSoft, text: C.accentText },
  offered_to_painter: { label: "Nab\xEDdnuto mal\xED\u0159i", dot: C.warn, pill: C.warnSoft, text: C.warnText },
  painter_accepted: { label: "Mal\xED\u0159 p\u0159ijal", dot: C.accent, pill: C.accentSoft, text: C.accentText },
  confirmed_to_client: { label: "Potvrzeno klientovi", dot: C.accent, pill: C.accentSoft, text: C.accentText },
  in_progress: { label: "Prob\xEDh\xE1", dot: C.accent, pill: C.accentSoft, text: C.accentText },
  completed: { label: "Dokon\u010Deno", dot: C.light, pill: "#f3f4f6", text: C.mid },
  cancelled: { label: "Zru\u0161eno", dot: C.danger, pill: C.dangerSoft, text: C.dangerText }
};
var AVAIL_COLOR = { available: C.accent, limited: C.warn, unavailable: C.danger };
var AVAIL_BG = { available: C.accentSoft, limited: C.warnSoft, unavailable: C.dangerSoft };
var AVAIL_LABEL = { available: "Voln\xFD", limited: "Omezen\xFD", unavailable: "Obsazen\xFD" };
var today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function fmt(v) {
  if (!Number.isFinite(Number(v)) || !Number(v)) return "\u2014";
  return new Intl.NumberFormat("cs-CZ").format(Math.round(Number(v))) + " K\u010D";
}
function commission(price) {
  const p = Number(price);
  if (!p) return "\u2014";
  return fmt(Math.round(p * 0.15)) + " (15 %)";
}
function fmtShort(d) {
  if (!d) return "\u2014";
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short" }).format(/* @__PURE__ */ new Date(d + "T12:00:00Z"));
}
function fmtLong(d) {
  if (!d) return "\u2014";
  return new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(/* @__PURE__ */ new Date(d + "T12:00:00Z"));
}
function ago(v) {
  const m = Math.round(Math.max(0, Date.now() - new Date(v)) / 6e4);
  if (m < 1) return "pr\xE1v\u011B te\u010F";
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h`;
}
function addDays(d, n) {
  const x = /* @__PURE__ */ new Date(d + "T12:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}
function monthOf(d) {
  return d.slice(0, 7) + "-01";
}
function addMonths(d, n) {
  const x = /* @__PURE__ */ new Date(d + "T12:00:00Z");
  x.setUTCDate(1);
  x.setUTCMonth(x.getUTCMonth() + n);
  return x.toISOString().slice(0, 10);
}
function daysInMonth(m) {
  const d = /* @__PURE__ */ new Date(m + "T12:00:00Z");
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}
function firstDow(m) {
  return ((/* @__PURE__ */ new Date(m + "T12:00:00Z")).getUTCDay() + 6) % 7;
}
var btn = (bg, color = "#fff", border = "transparent") => ({
  padding: "8px 16px",
  borderRadius: 8,
  border: `1px solid ${border}`,
  background: bg,
  color,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "'Outfit', sans-serif",
  whiteSpace: "nowrap"
});
var ghostBtn = () => btn("#fff", C.mid, LINE2.replace("1px solid ", ""));
var primaryBtn = () => btn(C.accent);
var inp = (extra = {}) => ({
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: LINE2,
  fontSize: 13,
  fontFamily: "'Outfit', sans-serif",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  color: C.text,
  ...extra
});
function ColHeader({ children }) {
  return /* @__PURE__ */ jsx("div", { style: { padding: "12px 16px", borderBottom: LINE, fontSize: 11, fontWeight: 600, color: C.light, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }, children });
}
function StatusPill({ status }) {
  const s = JOB_STATUS[status] || { label: status, pill: "#f3f4f6", text: C.mid, dot: C.light };
  return /* @__PURE__ */ jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, background: s.pill, color: s.text, borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 500 }, children: [
    /* @__PURE__ */ jsx("span", { style: { width: 5, height: 5, borderRadius: 99, background: s.dot, display: "inline-block" } }),
    s.label
  ] });
}
function Login({ onLogin, loading, error }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#f9fafb" }, children: /* @__PURE__ */ jsxs("div", { style: { width: 360, background: "#fff", border: LINE2, borderRadius: 12, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }, children: "Mal\xED\u0159 Hned \xB7 Admin" }),
    /* @__PURE__ */ jsx("h1", { style: { fontSize: 22, fontWeight: 600, color: C.text, letterSpacing: "-0.02em", margin: "0 0 20px" }, children: "P\u0159ihl\xE1\u0161en\xED" }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: 10 }, children: [
      /* @__PURE__ */ jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), placeholder: "E-mail", style: inp() }),
      /* @__PURE__ */ jsx("input", { type: "password", value: pw, onChange: (e) => setPw(e.target.value), placeholder: "Heslo", style: inp(), onKeyDown: (e) => e.key === "Enter" && onLogin({ email, password: pw }) }),
      error && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.danger }, children: error }),
      /* @__PURE__ */ jsx("button", { onClick: () => onLogin({ email, password: pw }), disabled: loading, style: { ...primaryBtn(), width: "100%", padding: "10px" }, children: loading ? "P\u0159ihla\u0161uji\u2026" : "P\u0159ihl\xE1sit" })
    ] })
  ] }) });
}
function JobList({ jobs, activeJobId, onSelectJob, onSetCalDate }) {
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  async function loadDetail(jobId) {
    if (details[jobId]) return;
    const r = await fetch(`/api/admin/job?id=${encodeURIComponent(jobId)}`);
    const d = await r.json();
    if (!d.job) return;
    setDetails((p) => ({ ...p, [jobId]: d.job }));
    setForm((p) => ({ ...p, [jobId]: {
      confirmedPrice: d.job.confirmed_client_price || d.job.estimated_client_price_max || "",
      painterPayout: d.job.painter_reward || ""
    } }));
  }
  function toggle(id) {
    setExpandedId((p) => p === id ? null : id);
    loadDetail(id);
  }
  const q = search.toLowerCase();
  const allFiltered = jobs.filter((j) => {
    if (filterStatus === "active") return !["completed", "cancelled"].includes(j.status);
    if (filterStatus === "done") return ["completed", "cancelled"].includes(j.status);
    return true;
  }).filter((j) => !q || (j.client_name || "").toLowerCase().includes(q) || (j.client_email || "").toLowerCase().includes(q) || (j.client_phone || "").includes(q)).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const active = filterStatus === "active" ? allFiltered : allFiltered.filter((j) => !["completed", "cancelled"].includes(j.status));
  const closed = filterStatus !== "active" ? allFiltered.filter((j) => ["completed", "cancelled"].includes(j.status)).slice(0, 20) : [];
  function renderJob(job) {
    const exp = expandedId === job.id;
    const detail = details[job.id];
    const f = form[job.id] || {};
    const isActive = activeJobId === job.id;
    const s = JOB_STATUS[job.status] || { dot: C.light, label: job.status, pill: "#f3f4f6", text: C.mid };
    return /* @__PURE__ */ jsxs("div", { style: { borderBottom: LINE }, children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => toggle(job.id), style: {
        width: "100%",
        textAlign: "left",
        border: "none",
        padding: "14px 16px",
        background: isActive ? "#f0fdf4" : "#fff",
        cursor: "pointer",
        fontFamily: "'Outfit', sans-serif",
        borderLeft: `3px solid ${isActive ? C.accent : "transparent"}`
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.2 }, children: job.client_name || "Klient" }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: C.light, flexShrink: 0, marginTop: 1 }, children: ago(job.created_at) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsx(StatusPill, { status: job.status }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600, color: C.text }, children: fmt(job.estimated_client_price_max || job.estimated_price_high) })
        ] }),
        job.preferred_date && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.light, marginTop: 5 }, children: fmtShort(job.preferred_date) })
      ] }),
      exp && /* @__PURE__ */ jsx("div", { style: { padding: "14px 16px 16px", background: C.soft, borderTop: LINE }, children: !detail ? /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.light }, children: "Na\u010D\xEDt\xE1m\u2026" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 12, marginBottom: 12 }, children: [
          ["Tel", detail.client_phone],
          ["Mail", detail.client_email],
          ["Adresa", detail.client_address || detail.locality],
          ["Pr\xE1ce", detail.work_type],
          ["Plocha", detail.custom_area ? detail.custom_area + " m\xB2" : null],
          ["Opravy", detail.repairs]
        ].filter(([, v]) => v).map(([k, v]) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { color: C.light, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }, children: k }),
          /* @__PURE__ */ jsx("div", { style: { color: C.text }, children: v })
        ] }, k)) }),
        detail.booking_note && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.mid, marginBottom: 12, lineHeight: 1.6, padding: "8px 10px", background: "#fff", borderRadius: 8, border: LINE }, children: detail.booking_note }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: C.mid, marginBottom: 12, padding: "7px 10px", background: "#fff", borderRadius: 8, border: LINE }, children: [
          "Provize: ",
          /* @__PURE__ */ jsx("strong", { style: { color: C.accent }, children: commission(detail.confirmed_client_price || detail.estimated_client_price_max) })
        ] }),
        !["completed", "cancelled"].includes(job.status) && /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }, children: [
          /* @__PURE__ */ jsx("input", { value: f.confirmedPrice || "", onChange: (e) => setForm((p) => ({ ...p, [job.id]: { ...p[job.id], confirmedPrice: e.target.value } })), placeholder: "Cena klientovi", style: inp() }),
          /* @__PURE__ */ jsx("input", { value: f.painterPayout || "", onChange: (e) => setForm((p) => ({ ...p, [job.id]: { ...p[job.id], painterPayout: e.target.value } })), placeholder: "Odm\u011Bna mal\xED\u0159i", style: inp() })
        ] }),
        job.preferred_date && !["completed", "cancelled"].includes(job.status) && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              onSelectJob(job.id, f.confirmedPrice, f.painterPayout);
              onSetCalDate(job.preferred_date);
            },
            style: { ...primaryBtn(), width: "100%", padding: "10px", fontSize: 13 },
            children: [
              "Vybrat mal\xED\u0159e na ",
              fmtShort(job.preferred_date),
              " \u2192"
            ]
          }
        )
      ] }) })
    ] }, job.id);
  }
  const totalActive = jobs.filter((j) => !["completed", "cancelled"].includes(j.status)).length;
  return /* @__PURE__ */ jsxs("div", { style: { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxs(ColHeader, { children: [
      "Zak\xE1zky \xB7 ",
      totalActive,
      " aktivn\xEDch"
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { padding: "8px 12px", borderBottom: LINE, display: "flex", flexDirection: "column", gap: 7 }, children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: "Hledat jm\xE9no, e-mail, tel\u2026",
          style: { ...inp(), fontSize: 12, padding: "7px 10px" }
        }
      ),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 4 }, children: [["active", "Aktivn\xED"], ["done", "Uzav\u0159en\xE9"], ["all", "V\u0161e"]].map(([k, l]) => /* @__PURE__ */ jsx("button", { onClick: () => setFilterStatus(k), style: {
        flex: 1,
        padding: "5px 4px",
        borderRadius: 7,
        border: LINE2,
        background: filterStatus === k ? C.text : "#fff",
        color: filterStatus === k ? "#fff" : C.mid,
        fontSize: 11,
        fontWeight: filterStatus === k ? 600 : 400,
        cursor: "pointer",
        fontFamily: "'Outfit',sans-serif"
      }, children: l }, k)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { flex: 1, overflow: "auto" }, children: [
      allFiltered.length === 0 && /* @__PURE__ */ jsx("div", { style: { padding: 32, fontSize: 13, color: C.light, textAlign: "center" }, children: search ? "Nic nenalezeno" : "\u017D\xE1dn\xE9 zak\xE1zky" }),
      allFiltered.map(renderJob)
    ] })
  ] });
}
var STATUS_STYLE = {
  available: { pill: "#dcfce7", text: "#166534", dot: "#22c55e", strike: false },
  limited: { pill: "#fef9c3", text: "#854d0e", dot: "#eab308", strike: false },
  unavailable: { pill: "#fee2e2", text: "#991b1b", dot: "#ef4444", strike: true },
  unknown: { pill: "#f3f4f6", text: "#9ca3af", dot: "#d1d5db", strike: false }
};
function MonthCalendar({ selectedDay, onSelectDay, monthBase, setMonthBase, monthData, painters, activeJob }) {
  const days = daysInMonth(monthBase);
  const leading = firstDow(monthBase);
  const monthLabel = new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric" }).format(/* @__PURE__ */ new Date(monthBase + "T12:00:00Z"));
  const calMap = {};
  (monthData?.months?.[0]?.cal || []).forEach((d) => {
    calMap[d.date] = d;
  });
  const jobDate = activeJob?.preferred_date;
  function getPainterStatuses(info) {
    const avail = info.available_count || 0;
    const limited = info.limited_count || 0;
    const blocked = info.blocked_count || 0;
    return painters.map((_, i) => {
      if (i < avail) return "available";
      if (i < avail + limited) return "limited";
      if (i < avail + limited + blocked) return "unavailable";
      return "unknown";
    });
  }
  const LINE3 = "1px solid #f0f0f0";
  return /* @__PURE__ */ jsxs("div", { style: { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { padding: "12px 20px", borderBottom: LINE3, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }, children: [
      /* @__PURE__ */ jsx("button", { onClick: () => setMonthBase((m) => addMonths(m, -1)), style: { background: "none", border: LINE3, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: C.mid, display: "flex", alignItems: "center", justifyContent: "center" }, children: "\u2039" }),
      /* @__PURE__ */ jsx("span", { style: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: 600, color: C.text, textTransform: "capitalize", letterSpacing: "-0.01em" }, children: monthLabel }),
      /* @__PURE__ */ jsx("button", { onClick: () => setMonthBase((m) => addMonths(m, 1)), style: { background: "none", border: LINE3, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: C.mid, display: "flex", alignItems: "center", justifyContent: "center" }, children: "\u203A" }),
      /* @__PURE__ */ jsx("button", { onClick: () => setMonthBase(monthOf(today)), style: { background: "none", border: LINE3, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: C.mid, fontFamily: "'Outfit',sans-serif", fontWeight: 500 }, children: "Dnes" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { flex: 1, overflow: "auto" }, children: [
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: LINE3 }, children: ["Pond\u011Bl\xED", "\xDAter\xFD", "St\u0159eda", "\u010Ctvrtek", "P\xE1tek", "Sobota", "Ned\u011Ble"].map((d, i) => /* @__PURE__ */ jsx("div", { style: {
        padding: "10px 12px",
        fontSize: 11,
        fontWeight: 600,
        color: i >= 5 ? "#94a3b8" : "#9ca3af",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        borderRight: i < 6 ? LINE3 : "none"
      }, children: d }, d)) }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }, children: [
        Array.from({ length: leading }, (_, i) => /* @__PURE__ */ jsx("div", { style: { borderRight: LINE3, borderBottom: LINE3, minHeight: 120, background: "#fafafa" } }, `l${i}`)),
        Array.from({ length: days }, (_, i) => {
          const num = i + 1;
          const date = `${monthBase.slice(0, 7)}-${String(num).padStart(2, "0")}`;
          const info = calMap[date] || {};
          const isToday = date === today;
          const isSelected = date === selectedDay;
          const isJobDay = date === jobDate;
          const isPast = date < today;
          const colIndex = (leading + i) % 7;
          const isWeekend = colIndex >= 5;
          const isLastCol = colIndex === 6;
          const painterStatuses = getPainterStatuses(info);
          return /* @__PURE__ */ jsxs("button", { onClick: () => onSelectDay(date), style: {
            padding: "8px 10px 10px",
            border: "none",
            borderRight: isLastCol ? "none" : LINE3,
            borderBottom: LINE3,
            background: isSelected ? "#f0faf5" : isJobDay ? "#fffbeb" : isWeekend ? "#fafafa" : "#fff",
            boxShadow: isSelected ? `inset 0 0 0 2px ${C.accent}` : isJobDay ? `inset 0 0 0 1.5px ${C.warn}` : "none",
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
            textAlign: "left",
            opacity: isPast && !isSelected && !isToday ? 0.45 : 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minHeight: 120,
            transition: "background 0.1s"
          }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }, children: [
              /* @__PURE__ */ jsx("span", { style: {
                fontSize: 13,
                fontWeight: isToday ? 700 : 400,
                color: isToday ? "#fff" : isWeekend ? "#94a3b8" : "#374151",
                background: isToday ? C.accent : "transparent",
                borderRadius: 99,
                width: isToday ? 26 : "auto",
                height: isToday ? 26 : "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                lineHeight: 1
              }, children: num }),
              isJobDay && /* @__PURE__ */ jsx("span", { style: { fontSize: 9, color: C.warn, fontWeight: 700, letterSpacing: "0.04em" }, children: "TERM\xCDN" })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 2, width: "100%" }, children: painters.map((p, pi) => {
              const status = painterStatuses[pi];
              const s = STATUS_STYLE[status] || STATUS_STYLE.unknown;
              const firstName = (p.name || p.email || "?").split(" ")[0];
              return /* @__PURE__ */ jsxs("div", { style: {
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: s.pill,
                borderRadius: 4,
                padding: "2px 7px 2px 5px",
                border: "none"
              }, children: [
                /* @__PURE__ */ jsx("span", { style: {
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: s.dot,
                  flexShrink: 0
                } }),
                /* @__PURE__ */ jsx("span", { style: {
                  fontSize: 11,
                  fontWeight: 500,
                  color: s.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                  textDecoration: s.strike ? "line-through" : "none",
                  opacity: s.strike ? 0.55 : 1
                }, children: firstName })
              ] }, pi);
            }) })
          ] }, date);
        }),
        (() => {
          const total = leading + days;
          const remainder = total % 7 === 0 ? 0 : 7 - total % 7;
          return Array.from({ length: remainder }, (_, i) => /* @__PURE__ */ jsx("div", { style: { borderRight: i < remainder - 1 ? LINE3 : "none", borderBottom: LINE3, minHeight: 120, background: "#fafafa" } }, `t${i}`));
        })()
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 16, padding: "10px 16px", alignItems: "center", borderTop: LINE3 }, children: [["available", "Voln\xFD"], ["limited", "Nev\xEDm jist\u011B"], ["unavailable", "Obsazen\xFD"]].map(([k, l]) => {
        const s = STATUS_STYLE[k];
        return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 5 }, children: [
          /* @__PURE__ */ jsx("span", { style: { width: 7, height: 7, borderRadius: 99, background: s.dot, display: "inline-block" } }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#9ca3af", fontWeight: 500 }, children: l })
        ] }, k);
      }) })
    ] })
  ] });
}
function PainterAvail({ selectedDay, dayCache, activeJob, onSelectPainter, selectedPainterId }) {
  const data = dayCache[selectedDay];
  const painters = data?.painters || [];
  if (!selectedDay) return /* @__PURE__ */ jsxs("div", { style: { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsx(ColHeader, { children: "Mal\xED\u0159i" }),
    /* @__PURE__ */ jsx("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }, children: /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: C.light, textAlign: "center" }, children: "\u2190 Klikn\u011Bte na den v kalend\xE1\u0159i" }) })
  ] });
  const jobDate = activeJob?.preferred_date;
  const isMatchDay = selectedDay === jobDate;
  return /* @__PURE__ */ jsxs("div", { style: { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxs(ColHeader, { children: [
      "Mal\xED\u0159i \xB7 ",
      fmtShort(selectedDay)
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }, children: [
      isMatchDay && activeJob && /* @__PURE__ */ jsxs("div", { style: { padding: "10px 16px", background: C.warnSoft, borderBottom: LINE, fontSize: 12, color: C.warnText }, children: [
        "Preferovan\xFD term\xEDn: ",
        /* @__PURE__ */ jsx("strong", { children: activeJob.client_name })
      ] }),
      !data && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.light, padding: "24px 16px", textAlign: "center" }, children: "Na\u010D\xEDt\xE1m\u2026" }),
      painters.map((p, pi) => {
        const ac = AVAIL_COLOR[p.availability_status] || C.light;
        const ab = AVAIL_BG[p.availability_status] || C.soft;
        const isSelected = selectedPainterId === p.id;
        const hasOverlap = p.block_count > 0;
        return /* @__PURE__ */ jsxs("button", { onClick: () => onSelectPainter(p), style: {
          width: "100%",
          textAlign: "left",
          padding: "12px 16px",
          border: "none",
          borderBottom: LINE,
          borderLeft: `3px solid ${isSelected ? C.accent : "transparent"}`,
          background: isSelected ? "#f0fdf4" : "#fff",
          cursor: "pointer",
          fontFamily: "'Outfit', sans-serif"
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }, children: [
            /* @__PURE__ */ jsx("span", { style: { width: 8, height: 8, borderRadius: 99, background: ac, flexShrink: 0, display: "inline-block" } }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }, children: p.name }),
            /* @__PURE__ */ jsx("span", { style: { padding: "2px 8px", borderRadius: 99, background: ab, color: ac, fontSize: 11, fontWeight: 500 }, children: AVAIL_LABEL[p.availability_status] || "\u2014" })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }, children: [
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.light }, children: [
              "Kapacita: ",
              /* @__PURE__ */ jsx("span", { style: { color: C.text }, children: p.remaining_capacity ?? p.capacity ?? "\u2014" }),
              " \xB7 ",
              p.accepts_express ? /* @__PURE__ */ jsx("span", { style: { color: C.accent }, children: "expres \u2713" }) : /* @__PURE__ */ jsx("span", { style: { color: C.light }, children: "bez expresu" }),
              p.reliability_score != null && /* @__PURE__ */ jsxs("span", { style: { color: C.mid }, children: [
                " \xB7 \u2B50 ",
                p.reliability_score
              ] })
            ] }),
            p.service_areas?.length > 0 && /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.mid }, children: [
              "\u{1F4CD} ",
              p.service_areas.join(", ")
            ] }),
            p.work_types?.length > 0 && /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.mid }, children: [
              "\u{1F58C} ",
              p.work_types.join(", ")
            ] }),
            hasOverlap && /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.danger }, children: [
              "\u26A0 ",
              p.block_count,
              " blokace tento den"
            ] }),
            p.job_fit?.locality_match === false && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.warn }, children: "Mimo lokalitu zak\xE1zky" }),
            p.job_fit?.score != null && /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.mid }, children: [
              "Sk\xF3re shody: ",
              p.job_fit.score
            ] }),
            (p.note || p.painter_note) && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.mid, lineHeight: 1.4, fontStyle: "italic" }, children: p.note || p.painter_note })
          ] })
        ] }, p.id);
      })
    ] })
  ] });
}
var PROCESSED_STATUSES = ["confirmed_to_client", "in_progress", "completed", "cancelled"];
function AssignDetail({ activeJob, activeJobForm, selectedPainter, selectedDay, onAssign, busy, msg, onAdminAction }) {
  const [duration, setDuration] = useState(1);
  const [noteText, setNoteText] = useState("");
  const [noteMsg, setNoteMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setDuration(1), [selectedPainter, selectedDay]);
  useEffect(() => {
    setNoteText("");
    setNoteMsg("");
    setStatusMsg("");
    setExpanded(false);
  }, [activeJob?.id]);
  const price = Number(activeJobForm.confirmedPrice) || Number(activeJob?.estimated_client_price_max) || 0;
  const payout = Number(activeJobForm.painterPayout) || Number(activeJob?.painter_reward) || Math.round(price * 0.75);
  const comm = Math.round(price * 0.15);
  if (!activeJob && !selectedPainter) return /* @__PURE__ */ jsxs("div", { style: { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsx(ColHeader, { children: "Detail & odesl\xE1n\xED" }),
    /* @__PURE__ */ jsx("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }, children: /* @__PURE__ */ jsxs("span", { style: { fontSize: 13, color: C.light, textAlign: "center", lineHeight: 1.6 }, children: [
      "Vyberte zak\xE1zku",
      /* @__PURE__ */ jsx("br", {}),
      "a mal\xED\u0159e"
    ] }) })
  ] });
  const isProcessed = activeJob && PROCESSED_STATUSES.includes(activeJob.status);
  if (isProcessed && !expanded) {
    const s = JOB_STATUS[activeJob.status] || { label: activeJob.status, pill: "#f3f4f6", text: C.mid };
    return /* @__PURE__ */ jsxs("div", { style: { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
      /* @__PURE__ */ jsx(ColHeader, { children: "Detail & odesl\xE1n\xED" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setExpanded(true), style: {
        margin: 12,
        padding: "12px 14px",
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: C.soft,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "'Outfit', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10
      }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }, children: activeJob.client_name || "Zak\xE1zka" }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.light }, children: activeJob.reference })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }, children: [
          /* @__PURE__ */ jsx("span", { style: { padding: "3px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.pill, color: s.text }, children: s.label }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: C.light }, children: "Rozkliknout \u2192" })
        ] })
      ] })
    ] });
  }
  const isError = msg && (msg.includes("fail") || msg.includes("Chyba"));
  return /* @__PURE__ */ jsxs("div", { style: { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsx(ColHeader, { children: "Detail & odesl\xE1n\xED" }),
    isProcessed && expanded && /* @__PURE__ */ jsx("button", { onClick: () => setExpanded(false), style: {
      margin: "8px 12px 0",
      padding: "6px 10px",
      borderRadius: 7,
      border: `1px solid ${C.border}`,
      background: C.soft,
      cursor: "pointer",
      fontFamily: "'Outfit', sans-serif",
      fontSize: 11,
      color: C.mid,
      textAlign: "left"
    }, children: "\u2190 Sbalit detail" }),
    /* @__PURE__ */ jsxs("div", { style: { flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }, children: [
      activeJob && /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px", borderBottom: LINE }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 600, color: C.light, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }, children: "Zak\xE1zka" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }, children: activeJob.client_name }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: C.mid, lineHeight: 1.7 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            activeJob.client_phone,
            activeJob.client_email ? " \xB7 " + activeJob.client_email : ""
          ] }),
          /* @__PURE__ */ jsx("div", { children: activeJob.client_address || activeJob.locality || "\u2014" }),
          /* @__PURE__ */ jsxs("div", { children: [
            activeJob.work_type,
            activeJob.custom_area ? " \xB7 " + activeJob.custom_area + " m\xB2" : ""
          ] }),
          activeJob.service_area ? /* @__PURE__ */ jsxs("div", { children: [
            "Oblast: ",
            activeJob.service_area
          ] }) : null,
          activeJob.repairs && activeJob.repairs !== "\u017D\xE1dn\xE9" ? /* @__PURE__ */ jsxs("div", { children: [
            "Opravy: ",
            activeJob.repairs
          ] }) : null,
          activeJob.client_note ? /* @__PURE__ */ jsxs("div", { style: { marginTop: 4, fontStyle: "italic" }, children: [
            "Pozn\xE1mka: ",
            activeJob.client_note
          ] }) : null
        ] })
      ] }),
      activeJob && onAdminAction && /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px", borderBottom: LINE }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 600, color: C.light, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }, children: "Zm\u011Bna stavu" }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6 }, children: /* @__PURE__ */ jsxs(
          "select",
          {
            style: { flex: 1, fontSize: 12, padding: "7px 8px", borderRadius: 7, border: LINE2, fontFamily: "'Outfit', sans-serif", color: C.text, background: "#fff" },
            defaultValue: "",
            onChange: async (e) => {
              const newStatus = e.target.value;
              if (!newStatus) return;
              setSavingStatus(true);
              setStatusMsg("");
              try {
                await onAdminAction(activeJob.id, "set_status", { status: newStatus });
                setStatusMsg("\u2713 Stav ulo\u017Een");
              } catch (err) {
                setStatusMsg("\u2717 " + (err.message || "Chyba"));
              }
              setSavingStatus(false);
              e.target.value = "";
            },
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "P\u0159ej\xEDt na stav\u2026" }),
              Object.entries(JOB_STATUS).map(([v, meta]) => /* @__PURE__ */ jsx("option", { value: v, children: meta.label }, v))
            ]
          }
        ) }),
        statusMsg && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, marginTop: 5, color: statusMsg.startsWith("\u2713") ? C.accent : C.danger }, children: statusMsg })
      ] }),
      activeJob && onAdminAction && /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px", borderBottom: LINE }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 600, color: C.light, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }, children: "Intern\xED pozn\xE1mky" }),
        (activeJob.internal_notes || []).map((n, i) => /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.mid, marginBottom: 5, padding: "6px 8px", background: C.soft, borderRadius: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { color: C.text }, children: n.text }),
          /* @__PURE__ */ jsxs("span", { style: { display: "block", color: C.light, marginTop: 2 }, children: [
            n.author,
            " \xB7 ",
            n.at ? new Date(n.at).toLocaleString("cs-CZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""
          ] })
        ] }, i)),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, marginTop: 4 }, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              value: noteText,
              onChange: (e) => setNoteText(e.target.value),
              placeholder: "P\u0159idat intern\xED pozn\xE1mku\u2026",
              style: { flex: 1, fontSize: 12, padding: "7px 8px", borderRadius: 7, border: LINE2, fontFamily: "'Outfit', sans-serif", color: C.text },
              onKeyDown: async (e) => {
                if (e.key === "Enter" && noteText.trim()) {
                  setSavingNote(true);
                  try {
                    await onAdminAction(activeJob.id, "add_note", { note: noteText.trim() });
                    setNoteText("");
                    setNoteMsg("\u2713");
                  } catch (err) {
                    setNoteMsg("\u2717 " + (err.message || "Chyba"));
                  }
                  setSavingNote(false);
                }
              }
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              disabled: savingNote || !noteText.trim(),
              onClick: async () => {
                setSavingNote(true);
                try {
                  await onAdminAction(activeJob.id, "add_note", { note: noteText.trim() });
                  setNoteText("");
                  setNoteMsg("\u2713");
                } catch (err) {
                  setNoteMsg("\u2717 " + (err.message || "Chyba"));
                }
                setSavingNote(false);
              },
              style: { padding: "7px 10px", borderRadius: 7, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", opacity: savingNote || !noteText.trim() ? 0.5 : 1 },
              children: "+"
            }
          )
        ] }),
        noteMsg && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, marginTop: 4, color: noteMsg.startsWith("\u2713") ? C.accent : C.danger }, children: noteMsg })
      ] }),
      selectedPainter && /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px", borderBottom: LINE }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 600, color: C.light, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }, children: "Mal\xED\u0159" }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { width: 8, height: 8, borderRadius: 99, background: AVAIL_COLOR[selectedPainter.availability_status] || C.light, display: "inline-block" } }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 600, color: C.text }, children: selectedPainter.name }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: C.mid }, children: AVAIL_LABEL[selectedPainter.availability_status] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: C.mid }, children: [
          "Term\xEDn: ",
          /* @__PURE__ */ jsx("strong", { style: { color: C.text }, children: fmtLong(selectedDay) })
        ] })
      ] }),
      activeJob && /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px", borderBottom: LINE }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 600, color: C.light, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }, children: "Finance" }),
        [
          ["Cena klientovi", fmt(price)],
          ["Odm\u011Bna mal\xED\u0159i", fmt(payout)],
          ["Provize (15 %)", fmt(comm)]
        ].map(([k, v]) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { color: C.mid }, children: k }),
          /* @__PURE__ */ jsx("span", { style: { color: C.text, fontWeight: 600 }, children: v })
        ] }, k))
      ] }),
      selectedPainter && selectedDay && /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px", borderBottom: LINE }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 600, color: C.light, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }, children: "D\xE9lka zak\xE1zky" }),
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }, children: [["1 den", 1], ["2 dny", 2], ["3+ dny", 3]].map(([label, val]) => /* @__PURE__ */ jsx("button", { onClick: () => setDuration(val), style: {
          padding: "9px 4px",
          borderRadius: 8,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 12,
          border: duration === val ? `1.5px solid ${C.accent}` : LINE2,
          background: duration === val ? C.accentSoft : "#fff",
          color: duration === val ? C.accent : C.mid,
          cursor: "pointer",
          fontWeight: duration === val ? 600 : 400
        }, children: label }, val)) }),
        duration > 1 && /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.light, marginTop: 8 }, children: [
          "Obsad\xED: ",
          Array.from({ length: duration }, (_, i) => fmtShort(addDays(selectedDay, i))).join(", ")
        ] })
      ] }),
      msg && /* @__PURE__ */ jsx("div", { style: {
        margin: "12px 16px",
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 12,
        background: isError ? C.dangerSoft : C.accentSoft,
        color: isError ? C.danger : C.accentText
      }, children: msg }),
      activeJob && selectedPainter && selectedDay && /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: C.mid, lineHeight: 1.6, padding: "10px 12px", background: C.soft, borderRadius: 8, border: LINE }, children: [
          "\u{1F4F1} Nab\xEDdka odejde mal\xED\u0159i ",
          /* @__PURE__ */ jsx("strong", { children: selectedPainter.name }),
          " do telefonu.",
          /* @__PURE__ */ jsx("br", {}),
          "\u2709\uFE0F Po p\u0159ijet\xED bude ",
          /* @__PURE__ */ jsx("strong", { children: activeJob.client_email }),
          " informov\xE1n e-mailem."
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            disabled: busy,
            onClick: () => onAssign(selectedPainter, duration),
            style: { ...primaryBtn(), width: "100%", padding: "12px", fontSize: 13, borderRadius: 8 },
            children: busy ? "Odes\xEDl\xE1m\u2026" : `Odeslat nab\xEDdku \u2192 ${selectedPainter.name}`
          }
        )
      ] })
    ] })
  ] });
}
function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}
function OpsCalendar({ jobs }) {
  const [month, setMonth] = useState(monthOf(today));
  const [popup, setPopup] = useState(null);
  const winW = useWindowWidth();
  const isMobile = winW < 700;
  const monthLabel = new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric" }).format(/* @__PURE__ */ new Date(month + "T12:00:00Z"));
  const days = daysInMonth(month);
  const leading = firstDow(month);
  const jobMap = {};
  jobs.forEach((j) => {
    const start = j.preferred_date;
    if (!start) return;
    const dur = j.duration_days || 1;
    for (let i = 0; i < dur; i++) {
      const date = addDays(start, i);
      if (!jobMap[date]) jobMap[date] = [];
      jobMap[date].push({ ...j, _dayIndex: i, _isStart: i === 0, _isCont: i > 0 });
    }
  });
  return /* @__PURE__ */ jsxs("div", { style: { overflowY: "auto", height: "calc(100vh - 56px)", background: "#fff" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: LINE }, children: [
      /* @__PURE__ */ jsx("button", { onClick: () => setMonth((m) => addMonths(m, -1)), style: { background: "none", border: LINE2, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: C.mid, display: "flex", alignItems: "center", justifyContent: "center" }, children: "\u2039" }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 16, fontWeight: 600, color: C.text, textTransform: "capitalize", flex: 1, textAlign: "center", letterSpacing: "-0.01em" }, children: monthLabel }),
      /* @__PURE__ */ jsx("button", { onClick: () => setMonth((m) => addMonths(m, 1)), style: { background: "none", border: LINE2, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: C.mid, display: "flex", alignItems: "center", justifyContent: "center" }, children: "\u203A" }),
      /* @__PURE__ */ jsx("button", { onClick: () => setMonth(monthOf(today)), style: { background: "none", border: LINE2, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: C.mid, fontFamily: "'Outfit',sans-serif", fontWeight: 500 }, children: "Dnes" })
    ] }),
    !isMobile && /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: LINE }, children: ["Pond\u011Bl\xED", "\xDAter\xFD", "St\u0159eda", "\u010Ctvrtek", "P\xE1tek", "Sobota", "Ned\u011Ble"].map((d, i) => /* @__PURE__ */ jsx("div", { style: { padding: "8px 12px", fontSize: 11, fontWeight: 600, color: i >= 5 ? "#94a3b8" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", borderRight: i < 6 ? LINE : "none" }, children: d }, d)) }),
    isMobile && /* @__PURE__ */ jsx("div", { children: Array.from({ length: days }, (_, i) => {
      const num = i + 1;
      const date = `${month.slice(0, 7)}-${String(num).padStart(2, "0")}`;
      const dayJobs = (jobMap[date] || []).filter((j) => j._isStart || !j._isCont || true);
      if (dayJobs.length === 0) return null;
      return /* @__PURE__ */ jsxs("div", { style: { borderBottom: LINE, padding: "12px 16px" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 600, color: date === today ? C.accent : C.mid, marginBottom: 8 }, children: new Intl.DateTimeFormat("cs-CZ", { weekday: "short", day: "numeric", month: "short" }).format(/* @__PURE__ */ new Date(date + "T12:00")) }),
        dayJobs.map((j) => {
          const s = JOB_STATUS[j.status] || {};
          return /* @__PURE__ */ jsxs("button", { onClick: () => setPopup(j), style: {
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            borderRadius: 8,
            marginBottom: 6,
            background: "#fff",
            border: LINE,
            borderLeft: `3px solid ${s.dot || C.light}`,
            cursor: "pointer",
            fontFamily: "'Outfit',sans-serif"
          }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: C.text }, children: j.client_name }),
            j.assigned_painter_name && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.mid }, children: j.assigned_painter_name }),
            /* @__PURE__ */ jsx("div", { style: { marginTop: 4 }, children: /* @__PURE__ */ jsx(StatusPill, { status: j.status }) })
          ] }, j.id + "_" + j._dayIndex);
        })
      ] }, date);
    }) }),
    !isMobile && /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }, children: [
      Array.from({ length: leading }, (_, i) => /* @__PURE__ */ jsx("div", { style: { borderRight: LINE, borderBottom: LINE, minHeight: 140, background: "#fafafa" } }, `l${i}`)),
      Array.from({ length: days }, (_, i) => {
        const num = i + 1;
        const date = `${month.slice(0, 7)}-${String(num).padStart(2, "0")}`;
        const dayJobs = jobMap[date] || [];
        const isToday = date === today;
        const isPast = date < today;
        const colIndex = (leading + i) % 7;
        const isWeekend = colIndex >= 5;
        const isLastCol = colIndex === 6;
        return /* @__PURE__ */ jsxs("div", { style: {
          minHeight: 140,
          padding: "8px 10px",
          borderRight: isLastCol ? "none" : LINE,
          borderBottom: LINE,
          background: isWeekend ? "#fafafa" : "#fff",
          boxShadow: isToday ? `inset 0 0 0 2px ${C.accent}` : "none"
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }, children: [
            /* @__PURE__ */ jsx("span", { style: {
              fontSize: 13,
              fontWeight: isToday ? 700 : 400,
              color: isToday ? "#fff" : isPast ? C.light : isWeekend ? "#94a3b8" : C.text,
              background: isToday ? C.accent : "transparent",
              borderRadius: 99,
              width: isToday ? 26 : "auto",
              height: isToday ? 26 : "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }, children: num }),
            dayJobs.length > 0 && /* @__PURE__ */ jsxs("span", { style: { fontSize: 10, color: C.light }, children: [
              dayJobs.length,
              " zak."
            ] })
          ] }),
          dayJobs.map((j) => {
            const s = JOB_STATUS[j.status] || { dot: C.light, label: j.status, pill: "#f3f4f6", text: C.mid };
            const price = j.confirmed_client_price || j.estimated_client_price_max;
            const dur = j.duration_days || 1;
            return /* @__PURE__ */ jsx("button", { onClick: () => setPopup(j), style: {
              width: "100%",
              textAlign: "left",
              padding: "5px 8px 6px",
              borderRadius: 6,
              marginBottom: 3,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              background: j._isCont ? "#f9fafb" : "#fff",
              border: LINE,
              borderLeft: `3px solid ${j._isCont ? "#d1d5db" : s.dot}`,
              display: "block",
              opacity: j._isCont ? 0.75 : 1
            }, children: j._isCont ? /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.light, fontStyle: "italic" }, children: [
              "\u21B3 ",
              j.client_name,
              " (den ",
              j._dayIndex + 1,
              "/",
              dur,
              ")"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }, children: [
                j.client_name || "Klient",
                dur > 1 && /* @__PURE__ */ jsxs("span", { style: { fontWeight: 400, color: C.light, marginLeft: 4 }, children: [
                  dur,
                  " dny"
                ] })
              ] }),
              j.assigned_painter_name && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.mid, marginBottom: 2 }, children: j.assigned_painter_name }),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }, children: [
                /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: C.light, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: j.work_type || j.locality || "\u2014" }),
                price && /* @__PURE__ */ jsx("span", { style: { fontSize: 11, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }, children: fmt(price) })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { marginTop: 4 }, children: /* @__PURE__ */ jsx(StatusPill, { status: j.status }) })
            ] }) }, j.id + "_" + j._dayIndex);
          })
        ] }, date);
      }),
      (() => {
        const total = leading + days;
        const rem = total % 7 === 0 ? 0 : 7 - total % 7;
        return Array.from({ length: rem }, (_, i) => /* @__PURE__ */ jsx("div", { style: { borderRight: i < rem - 1 ? LINE : "none", borderBottom: LINE, minHeight: 140, background: "#fafafa" } }, `t${i}`));
      })()
    ] }),
    popup && /* @__PURE__ */ jsxs("div", { style: { position: "fixed", inset: 0, zIndex: 200, display: "grid", placeItems: "center", padding: 20 }, children: [
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)" }, onClick: () => setPopup(null) }),
      /* @__PURE__ */ jsxs("div", { style: { position: "relative", width: "100%", maxWidth: 440, background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: LINE2 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            popup.reference && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.light, marginBottom: 4 }, children: popup.reference }),
            /* @__PURE__ */ jsx("h3", { style: { fontSize: 20, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em" }, children: popup.client_name })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setPopup(null), style: { background: "none", border: LINE2, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, color: C.mid, display: "flex", alignItems: "center", justifyContent: "center" }, children: "\xD7" })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { marginBottom: 14 }, children: /* @__PURE__ */ jsx(StatusPill, { status: popup.status }) }),
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gap: "10px 16px", gridTemplateColumns: "1fr 1fr", fontSize: 13, marginBottom: 14 }, children: [
          ["Term\xEDn", fmtShort(popup.preferred_date)],
          ["Mal\xED\u0159", popup.assigned_painter_name],
          ["Lokalita", popup.locality || popup.client_address],
          ["Telefon", popup.client_phone],
          ["E-mail", popup.client_email],
          ["Typ pr\xE1ce", popup.work_type],
          ["Plocha", popup.custom_area ? popup.custom_area + " m\xB2" : null],
          ["Opravy", popup.repairs],
          ["Cena klientovi", fmt(popup.confirmed_client_price || popup.estimated_client_price_max)],
          ["Odm\u011Bna mal\xED\u0159i", fmt(popup.painter_reward)],
          ["Provize (15 %)", commission(popup.confirmed_client_price || popup.estimated_client_price_max)]
        ].filter(([, v]) => v).map(([k, v]) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { color: C.light, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }, children: k }),
          /* @__PURE__ */ jsx("div", { style: { color: C.text }, children: v })
        ] }, k)) }),
        popup.booking_note && /* @__PURE__ */ jsx("div", { style: { paddingTop: 12, borderTop: LINE, fontSize: 12, color: C.mid, lineHeight: 1.6 }, children: popup.booking_note })
      ] })
    ] })
  ] });
}
function StatsPanel({ jobs, painters }) {
  const now = /* @__PURE__ */ new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
  const completed = jobs.filter((j) => j.status === "completed");
  const cancelled = jobs.filter((j) => j.status === "cancelled");
  const active = jobs.filter((j) => !["completed", "cancelled"].includes(j.status));
  const thisMonthDone = completed.filter((j) => (j.preferred_date || j.created_at || "").startsWith(thisMonth));
  const lastMonthDone = completed.filter((j) => (j.preferred_date || j.created_at || "").startsWith(lastMonth));
  const totalRevenue = completed.reduce((s, j) => s + (Number(j.confirmed_price) || Number(j.estimated_client_price_max) || 0), 0);
  const avgPrice = completed.length ? Math.round(totalRevenue / completed.length) : 0;
  const painterStats = painters.map((p) => {
    const done = completed.filter((j) => j.assigned_painter_id === p.id).length;
    const canc = cancelled.filter((j) => j.assigned_painter_id === p.id).length;
    return { ...p, done, canc };
  }).sort((a, b) => b.done - a.done);
  const stat = (label, value, sub) => /* @__PURE__ */ jsxs("div", { style: { background: "#fff", border: LINE2, borderRadius: 12, padding: "20px 24px", minWidth: 140 }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.mid, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }, children: label }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }, children: value }),
    sub && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.light, marginTop: 4 }, children: sub })
  ] });
  return /* @__PURE__ */ jsxs("div", { style: { flex: 1, overflow: "auto", padding: 32, background: C.soft }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 24, letterSpacing: "-0.02em" }, children: "Statistiky" }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }, children: [
      stat("Aktivn\xED zak\xE1zky", active.length),
      stat("Dokon\u010Deno celkem", completed.length, `tento m\u011Bs\xEDc: ${thisMonthDone.length}, minul\xFD: ${lastMonthDone.length}`),
      stat("Zru\u0161eno", cancelled.length),
      stat("Pr\u016Fm\u011Brn\xE1 cena", avgPrice ? `${avgPrice.toLocaleString("cs")} K\u010D` : "\u2014"),
      stat("Odhadovan\xFD obrat", totalRevenue ? `${Math.round(totalRevenue / 1e3)}k K\u010D` : "\u2014", "z dokon\u010Den\xFDch")
    ] }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }, children: "V\xFDkon mal\xED\u0159\u016F" }),
    /* @__PURE__ */ jsxs("div", { style: { background: "#fff", border: LINE2, borderRadius: 12, overflow: "hidden" }, children: [
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 80px 80px 100px", padding: "8px 16px", background: C.soft, borderBottom: LINE2 }, children: ["Jm\xE9no", "Dokon\u010Deno", "Zru\u0161eno", "Spolehlivost"].map((h) => /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 600, color: C.light, textTransform: "uppercase", letterSpacing: "0.06em" }, children: h }, h)) }),
      painterStats.map((p, i) => /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 80px 80px 100px", padding: "10px 16px", borderBottom: i < painterStats.length - 1 ? LINE : "none", alignItems: "center" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 500, color: C.text }, children: p.name }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: p.done > 0 ? C.accent : C.light, fontWeight: 600 }, children: p.done }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: p.canc > 0 ? C.danger : C.light }, children: p.canc }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.mid }, children: p.reliability_score != null ? `\u2B50 ${p.reliability_score}` : "\u2014" })
      ] }, p.id)),
      painterStats.length === 0 && /* @__PURE__ */ jsx("div", { style: { padding: "24px 16px", fontSize: 13, color: C.light, textAlign: "center" }, children: "\u017D\xE1dn\xE1 data" })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, margin: "28px 0 12px" }, children: "Stav zak\xE1zek" }),
    /* @__PURE__ */ jsx("div", { style: { background: "#fff", border: LINE2, borderRadius: 12, overflow: "hidden" }, children: Object.entries(JOB_STATUS).map(([k, v], i, arr) => {
      const cnt = jobs.filter((j) => j.status === k).length;
      return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < arr.length - 1 ? LINE : "none" }, children: [
        /* @__PURE__ */ jsx("span", { style: { width: 6, height: 6, borderRadius: 99, background: v.dot, flexShrink: 0, display: "inline-block" } }),
        /* @__PURE__ */ jsx("span", { style: { flex: 1, fontSize: 12, color: C.text }, children: v.label }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600, color: cnt > 0 ? C.text : C.light }, children: cnt })
      ] }, k);
    }) }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: C.text, margin: "28px 0 12px" }, children: "Export" }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            const cols = ["reference", "status", "client_name", "client_phone", "client_email", "client_address", "work_type", "custom_area", "preferred_date_label", "preferred_time_label", "estimated_client_price_max", "confirmed_price", "painter_reward", "created_at"];
            const header = cols.join(";");
            const rows = jobs.map((j) => cols.map((c) => {
              const v = j[c] ?? "";
              return `"${String(v).replace(/"/g, '""')}"`;
            }).join(";"));
            const csv = [header, ...rows].join("\n");
            const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `zakazky-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
            a.click();
          },
          style: { padding: "10px 18px", borderRadius: 9, border: LINE2, background: "#fff", color: C.text, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: "pointer", fontWeight: 500 },
          children: "\u2B07 St\xE1hnout CSV (v\u0161echny zak\xE1zky)"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => window.print(),
          style: { padding: "10px 18px", borderRadius: 9, border: LINE2, background: "#fff", color: C.text, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: "pointer", fontWeight: 500 },
          children: "\u{1F5A8} Tisknout / ulo\u017Eit PDF"
        }
      )
    ] })
  ] });
}
function App() {
  const [session, setSession] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dispatch");
  const [jobs, setJobs] = useState([]);
  const [painters, setPainters] = useState([]);
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeJobForm, setActiveJobForm] = useState({});
  const [monthBase, setMonthBase] = useState(monthOf(today));
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedPainter, setSelectedPainter] = useState(null);
  const [dayCache, setDayCache] = useState({});
  const [monthData, setMonthData] = useState(null);
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignMsg, setAssignMsg] = useState("");
  const activeJob = jobs.find((j) => j.id === activeJobId) || null;
  useEffect(() => {
    const q = new URLSearchParams({ from: monthBase, months: "1" });
    fetch(`/api/admin/availability?${q}`).then((r) => r.json()).then(setMonthData).catch(() => {
    });
  }, [monthBase]);
  const fetchDay = useCallback(async (date) => {
    if (!date || dayCache[date]) return;
    const q = new URLSearchParams({ from: monthOf(date), months: "1", date });
    try {
      const r = await fetch(`/api/admin/availability?${q}`);
      const d = await r.json();
      if (d.selected_day) setDayCache((p) => ({ ...p, [date]: d.selected_day }));
    } catch {
    }
  }, [dayCache]);
  useEffect(() => {
    fetchDay(selectedDay);
  }, [selectedDay]);
  useEffect(() => {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      setSession({ email: "dev@localhost" });
      setLoading(false);
      return;
    }
    fetch("/api/admin/session").then((r) => r.json()).then(async (d) => {
      if (d.authenticated) {
        setSession(d.admin);
        const [jr, pr] = await Promise.all([
          fetch("/api/admin/jobs").then((r) => r.json()),
          fetch("/api/admin/painters").then((r) => r.json())
        ]);
        if (jr.jobs) setJobs(jr.jobs);
        if (pr.painters) setPainters(pr.painters);
      }
      setLoading(false);
    });
  }, []);
  const [toast, setToast] = useState(null);
  const jobsRef = React.useRef(jobs);
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);
  useEffect(() => {
    if (!session) return;
    const id = setInterval(async () => {
      try {
        const d = await fetch("/api/admin/jobs").then((r) => r.json());
        if (!d.jobs) return;
        const prev = jobsRef.current;
        const newOnes = d.jobs.filter((j) => !prev.find((p) => p.id === j.id));
        if (newOnes.length > 0) {
          setToast(`${newOnes.length} nov\xE1 zak\xE1zka p\u0159i\u0161la: ${newOnes.map((j) => j.client_name).join(", ")}`);
          setTimeout(() => setToast(null), 6e3);
        }
        setJobs(d.jobs);
      } catch {
      }
    }, 3e4);
    return () => clearInterval(id);
  }, [session]);
  async function login(payload) {
    setLoginError("");
    setLoading(true);
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json();
    if (!r.ok) {
      setLoginError(d.error || "Chyba p\u0159ihl\xE1\u0161en\xED");
      setLoading(false);
      return;
    }
    setSession({ email: d.email });
    const [jr, pr] = await Promise.all([
      fetch("/api/admin/jobs").then((r2) => r2.json()),
      fetch("/api/admin/painters").then((r2) => r2.json())
    ]);
    if (jr.jobs) setJobs(jr.jobs);
    if (pr.painters) setPainters(pr.painters);
    setLoading(false);
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setSession(null);
    setJobs([]);
    setPainters([]);
  }
  function handleSelectJob(jobId, confirmedPrice, painterPayout) {
    setActiveJobId(jobId);
    setActiveJobForm({ confirmedPrice, painterPayout });
    setSelectedPainter(null);
    setAssignMsg("");
  }
  function handleSetCalDate(date) {
    setMonthBase(monthOf(date));
    setSelectedDay(date);
  }
  async function handleAdminAction(jobId, action, extra = {}) {
    const res = await fetch("/api/admin/job-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, action, ...extra })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Akci se nepoda\u0159ilo prov\xE9st.");
    const [jr] = await Promise.all([
      fetch("/api/admin/jobs").then((r) => r.json()),
      fetch(`/api/admin/availability?${new URLSearchParams({ from: monthBase, months: "1" })}`).then((r) => r.json()).then(setMonthData).catch(() => {
      })
    ]);
    if (jr.jobs) setJobs(jr.jobs);
    return data;
  }
  async function handleAssign(painter, duration) {
    if (!activeJobId || !painter || !selectedDay) return;
    setAssignBusy(true);
    setAssignMsg("");
    try {
      await fetch("/api/admin/job-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: activeJobId,
          action: "prepare_job",
          confirmedPrice: activeJobForm.confirmedPrice || activeJob?.estimated_client_price_max,
          painterPayout: activeJobForm.painterPayout || activeJob?.painter_reward
        })
      });
      await fetch("/api/admin/job-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: activeJobId, action: "send_offer", painterId: painter.id })
      });
      for (let i = 0; i < duration; i++) {
        const date = addDays(selectedDay, i);
        await fetch("/api/admin/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            painterId: painter.id,
            jobId: activeJobId,
            from: monthOf(date),
            months: 1,
            date,
            entries: [{ date, status: "unavailable", capacity: 0, accepts_express: false, note: activeJob?.reference || "" }]
          })
        });
        setDayCache((p) => {
          const n = { ...p };
          delete n[date];
          return n;
        });
      }
      setAssignMsg(`\u2713 Nab\xEDdka odesl\xE1na mal\xED\u0159i ${painter.name}. Po p\u0159ijet\xED bude klient informov\xE1n e-mailem.`);
      const [jr] = await Promise.all([
        fetch("/api/admin/jobs").then((r) => r.json()),
        fetch(`/api/admin/availability?${new URLSearchParams({ from: monthBase, months: "1" })}`).then((r) => r.json()).then(setMonthData)
      ]);
      if (jr.jobs) setJobs(jr.jobs);
      setSelectedPainter(null);
    } catch {
      setAssignMsg("Chyba p\u0159i odes\xEDl\xE1n\xED. Zkuste znovu.");
    }
    setAssignBusy(false);
  }
  const [colWidths, setColWidths] = useState({ w0: 300, w2: 240, w3: 300 });
  function makeResizer(applyFn) {
    return function(e) {
      e.preventDefault();
      const startX = e.clientX;
      const snapshot = { ...colWidths };
      function onMove(ev) {
        const dx = ev.clientX - startX;
        setColWidths((prev) => {
          const next = applyFn({ ...prev }, dx, snapshot);
          return next;
        });
      }
      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
  }
  const onDragH0 = makeResizer((w, dx, snap) => ({
    ...w,
    w0: Math.max(160, snap.w0 + dx)
  }));
  const onDragH1 = makeResizer((w, dx, snap) => ({
    ...w,
    w2: Math.max(160, snap.w2 - dx)
  }));
  const onDragH2 = makeResizer((w, dx, snap) => ({
    ...w,
    w2: Math.max(160, snap.w2 + dx),
    w3: Math.max(160, snap.w3 - dx)
  }));
  function ResizeHandle({ onMouseDown }) {
    const [hov, setHov] = useState(false);
    return /* @__PURE__ */ jsx(
      "div",
      {
        onMouseDown,
        onMouseEnter: () => setHov(true),
        onMouseLeave: () => setHov(false),
        style: { width: 5, flexShrink: 0, cursor: "col-resize", position: "relative", zIndex: 10 },
        children: /* @__PURE__ */ jsx("div", { style: {
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }, children: /* @__PURE__ */ jsx("div", { style: {
          width: 1,
          height: "100%",
          background: hov ? C.accent : "#e5e7eb",
          transition: "background 0.15s"
        } }) })
      }
    );
  }
  if (loading && !session) return /* @__PURE__ */ jsx(Login, { onLogin: login, loading, error: loginError });
  if (!session) return /* @__PURE__ */ jsx(Login, { onLogin: login, loading, error: loginError });
  const activeCount = jobs.filter((j) => !["completed", "cancelled"].includes(j.status)).length;
  const { w0, w2, w3 } = colWidths;
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: "#fff", fontFamily: "'Outfit', sans-serif", display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ jsx("div", { style: { position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: LINE }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 56 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 24 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }, children: "Mal\xED\u0159 Hned" }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 2 }, children: [["dispatch", `Dispe\u010Dink${activeCount ? ` (${activeCount})` : ""}`], ["ops", "P\u0159ehled zak\xE1zek"], ["stats", "Statistiky"]].map(([key, label]) => /* @__PURE__ */ jsx("button", { onClick: () => setTab(key), style: {
          padding: "6px 14px",
          border: "none",
          background: tab === key ? C.soft : "transparent",
          borderRadius: 8,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13,
          cursor: "pointer",
          color: tab === key ? C.text : C.mid,
          fontWeight: tab === key ? 600 : 400
        }, children: label }, key)) })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: logout, style: { ...ghostBtn(), fontSize: 12, padding: "6px 12px" }, children: "Odhl\xE1sit" })
    ] }) }),
    toast && /* @__PURE__ */ jsxs("div", { style: {
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 999,
      background: C.text,
      color: "#fff",
      padding: "12px 20px",
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 500,
      boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }, children: [
      /* @__PURE__ */ jsx("span", { style: { width: 8, height: 8, borderRadius: 99, background: C.accent, display: "inline-block", flexShrink: 0 } }),
      toast,
      /* @__PURE__ */ jsx("button", { onClick: () => setToast(null), style: { background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16, lineHeight: 1, marginLeft: 4 }, children: "\xD7" })
    ] }),
    tab === "dispatch" && /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }, children: [
      /* @__PURE__ */ jsx("div", { style: { width: w0, flexShrink: 0, overflow: "hidden", display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ jsx(JobList, { jobs, activeJobId, onSelectJob: handleSelectJob, onSetCalDate: handleSetCalDate }) }),
      /* @__PURE__ */ jsx(ResizeHandle, { onMouseDown: onDragH0 }),
      /* @__PURE__ */ jsx("div", { style: { flex: 1, minWidth: 280, overflow: "hidden", display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ jsx(
        MonthCalendar,
        {
          selectedDay,
          onSelectDay: (date) => {
            setSelectedDay(date);
            setSelectedPainter(null);
          },
          monthBase,
          setMonthBase,
          monthData,
          painters,
          activeJob
        }
      ) }),
      /* @__PURE__ */ jsx(ResizeHandle, { onMouseDown: onDragH1 }),
      /* @__PURE__ */ jsx("div", { style: { width: w2, flexShrink: 0, overflow: "hidden", display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ jsx(
        AssignDetail,
        {
          activeJob,
          activeJobForm,
          selectedPainter,
          selectedDay,
          onAssign: handleAssign,
          busy: assignBusy,
          msg: assignMsg,
          onAdminAction: handleAdminAction
        }
      ) }),
      /* @__PURE__ */ jsx(ResizeHandle, { onMouseDown: onDragH2 }),
      /* @__PURE__ */ jsx("div", { style: { width: w3, flexShrink: 0, overflow: "hidden", display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ jsx(
        PainterAvail,
        {
          selectedDay,
          dayCache,
          activeJob,
          onSelectPainter: (p) => {
            setSelectedPainter(p);
            setAssignMsg("");
          },
          selectedPainterId: selectedPainter?.id
        }
      ) })
    ] }),
    tab === "ops" && /* @__PURE__ */ jsx(OpsCalendar, { jobs }),
    tab === "stats" && /* @__PURE__ */ jsx(StatsPanel, { jobs, painters })
  ] });
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ jsx(App, {}));
