// src/painter-app.jsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var { useEffect, useMemo, useState } = React;
var C = {
  bg: "#f0ece6",
  surface: "#ffffff",
  surfaceSoft: "#f7f3ee",
  border: "rgba(175,165,148,0.28)",
  text: "#18170f",
  textMid: "#7a7268",
  textLight: "#b8b0a4",
  accent: "#2a7a4e",
  accentSoft: "#e6f3ec",
  warn: "#b89236",
  warnSoft: "#f7eed8",
  muted: "#8b8173",
  mutedSoft: "#efe9e0",
  danger: "#b54d43",
  dangerSoft: "#fbecea",
  shadow: "0 2px 8px rgba(20,14,6,0.04), 0 24px 64px rgba(20,14,6,0.09)"
};
var STATUS_META = {
  available: { label: "Volno", bg: C.accentSoft, text: C.accent, dot: C.accent },
  limited: { label: "Omezen\u011B", bg: C.warnSoft, text: C.warn, dot: C.warn },
  unavailable: { label: "Pry\u010D", bg: C.mutedSoft, text: C.muted, dot: C.muted }
};
var JOB_STATUS_META = {
  new: { label: "Nov\xE1", bg: C.warnSoft, color: C.warn },
  pending_review: { label: "Ke zpracov\xE1n\xED", bg: C.warnSoft, color: C.warn },
  waiting_for_review: { label: "Ke zpracov\xE1n\xED", bg: C.warnSoft, color: C.warn },
  waiting_for_client_details: { label: "\u010Cek\xE1 na klienta", bg: C.mutedSoft, color: C.muted },
  ready_to_offer: { label: "P\u0159ipravena", bg: C.warnSoft, color: C.warn },
  in_dispatch: { label: "Dispe\u010Dink", bg: C.warnSoft, color: C.warn },
  offered_to_painter: { label: "Nab\xEDdka odesl\xE1na", bg: C.warnSoft, color: C.warn },
  offer_sent: { label: "Nab\xEDdka odesl\xE1na", bg: C.warnSoft, color: C.warn },
  painter_accepted: { label: "P\u0159ijat\xE1", bg: C.accentSoft, color: C.accent },
  assigned: { label: "P\u0159id\u011Blena", bg: C.accentSoft, color: C.accent },
  confirmed_to_client: { label: "Potvrzena \u2713", bg: C.accentSoft, color: C.accent },
  in_progress: { label: "Prob\xEDh\xE1", bg: C.accentSoft, color: C.accent },
  completed: { label: "Dokon\u010Dena", bg: C.mutedSoft, color: C.muted },
  done: { label: "Dokon\u010Dena", bg: C.mutedSoft, color: C.muted },
  cancelled: { label: "Zru\u0161ena", bg: C.dangerSoft, color: C.danger }
};
var WEEKDAYS = ["Po", "\xDAt", "St", "\u010Ct", "P\xE1", "So", "Ne"];
function Icon({ name, size = 16, color = "currentColor" }) {
  const s = { display: "block", flexShrink: 0 };
  switch (name) {
    case "calendar":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("rect", { x: "1.5", y: "2.5", width: "13", height: "12", rx: "2" }),
        /* @__PURE__ */ jsx("line", { x1: "1.5", y1: "6", x2: "14.5", y2: "6" }),
        /* @__PURE__ */ jsx("line", { x1: "5", y1: "1", x2: "5", y2: "4" }),
        /* @__PURE__ */ jsx("line", { x1: "11", y1: "1", x2: "11", y2: "4" }),
        /* @__PURE__ */ jsx("rect", { x: "4", y: "8.5", width: "2", height: "2", rx: "0.4", fill: color, stroke: "none" }),
        /* @__PURE__ */ jsx("rect", { x: "7", y: "8.5", width: "2", height: "2", rx: "0.4", fill: color, stroke: "none" }),
        /* @__PURE__ */ jsx("rect", { x: "10", y: "8.5", width: "2", height: "2", rx: "0.4", fill: color, stroke: "none" }),
        /* @__PURE__ */ jsx("rect", { x: "4", y: "11.5", width: "2", height: "2", rx: "0.4", fill: color, stroke: "none" }),
        /* @__PURE__ */ jsx("rect", { x: "7", y: "11.5", width: "2", height: "2", rx: "0.4", fill: color, stroke: "none" })
      ] });
    case "briefcase":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("rect", { x: "1", y: "5", width: "14", height: "9", rx: "2" }),
        /* @__PURE__ */ jsx("path", { d: "M5 5V3.5A1.5 1.5 0 0 1 6.5 2h3A1.5 1.5 0 0 1 11 3.5V5" }),
        /* @__PURE__ */ jsx("line", { x1: "1", y1: "9", x2: "15", y2: "9" })
      ] });
    case "inbox":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("path", { d: "M1 10l2.5-7h9L15 10" }),
        /* @__PURE__ */ jsx("rect", { x: "1", y: "10", width: "14", height: "4", rx: "1.5" }),
        /* @__PURE__ */ jsx("path", { d: "M5.5 12h5" })
      ] });
    case "pin":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("path", { d: "M8 1.5C5.8 1.5 4 3.3 4 5.5c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" }),
        /* @__PURE__ */ jsx("circle", { cx: "8", cy: "5.5", r: "1.5" })
      ] });
    case "phone":
      return /* @__PURE__ */ jsx("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: /* @__PURE__ */ jsx("path", { d: "M3 2h3l1.5 3.5-2 1.2c.8 1.7 2 2.9 3.7 3.7l1.2-2L14 9.5V12.5A1.5 1.5 0 0 1 12.5 14C6 14 2 8 2 3.5A1.5 1.5 0 0 1 3.5 2z" }) });
    case "message":
      return /* @__PURE__ */ jsx("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: /* @__PURE__ */ jsx("path", { d: "M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 2 3-2h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" }) });
    case "map":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("polygon", { points: "1,2 6,4 10,2 15,4 15,14 10,12 6,14 1,12" }),
        /* @__PURE__ */ jsx("line", { x1: "6", y1: "4", x2: "6", y2: "14" }),
        /* @__PURE__ */ jsx("line", { x1: "10", y1: "2", x2: "10", y2: "12" })
      ] });
    case "chevron_right":
      return /* @__PURE__ */ jsx("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: /* @__PURE__ */ jsx("polyline", { points: "6,4 10,8 6,12" }) });
    case "chevron_left":
      return /* @__PURE__ */ jsx("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: /* @__PURE__ */ jsx("polyline", { points: "10,4 6,8 10,12" }) });
    case "check":
      return /* @__PURE__ */ jsx("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: /* @__PURE__ */ jsx("polyline", { points: "2.5,8.5 6.5,12.5 13.5,4" }) });
    case "x":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("line", { x1: "3", y1: "3", x2: "13", y2: "13" }),
        /* @__PURE__ */ jsx("line", { x1: "13", y1: "3", x2: "3", y2: "13" })
      ] });
    case "clock":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("circle", { cx: "8", cy: "8", r: "6.5" }),
        /* @__PURE__ */ jsx("polyline", { points: "8,4.5 8,8 10.5,10" })
      ] });
    case "ruler":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("rect", { x: "1", y: "5", width: "14", height: "6", rx: "1.5" }),
        /* @__PURE__ */ jsx("line", { x1: "4", y1: "5", x2: "4", y2: "8" }),
        /* @__PURE__ */ jsx("line", { x1: "7", y1: "5", x2: "7", y2: "7" }),
        /* @__PURE__ */ jsx("line", { x1: "10", y1: "5", x2: "10", y2: "8" }),
        /* @__PURE__ */ jsx("line", { x1: "13", y1: "5", x2: "13", y2: "7" })
      ] });
    case "tag":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("path", { d: "M8.5 1.5H13a1.5 1.5 0 0 1 1.5 1.5v4.5L8 14 2 8l6.5-6.5z" }),
        /* @__PURE__ */ jsx("circle", { cx: "11.5", cy: "4.5", r: "1", fill: color, stroke: "none" })
      ] });
    case "note":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("rect", { x: "2", y: "1.5", width: "12", height: "13", rx: "2" }),
        /* @__PURE__ */ jsx("line", { x1: "5", y1: "5.5", x2: "11", y2: "5.5" }),
        /* @__PURE__ */ jsx("line", { x1: "5", y1: "8", x2: "11", y2: "8" }),
        /* @__PURE__ */ jsx("line", { x1: "5", y1: "10.5", x2: "8.5", y2: "10.5" })
      ] });
    case "send":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("line", { x1: "14", y1: "2", x2: "1", y2: "8" }),
        /* @__PURE__ */ jsx("line", { x1: "14", y1: "2", x2: "9", y2: "14" }),
        /* @__PURE__ */ jsx("line", { x1: "14", y1: "2", x2: "6", y2: "9" })
      ] });
    case "coins":
      return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", style: s, children: [
        /* @__PURE__ */ jsx("ellipse", { cx: "6", cy: "5", rx: "4.5", ry: "2" }),
        /* @__PURE__ */ jsx("path", { d: "M1.5 5v3c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V5" }),
        /* @__PURE__ */ jsx("ellipse", { cx: "10", cy: "10", rx: "4.5", ry: "2" }),
        /* @__PURE__ */ jsx("path", { d: "M5.5 10v.5c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V10" })
      ] });
    default:
      return null;
  }
}
function field() {
  return { width: "100%", padding: "11px 12px", borderRadius: 12, border: `1px solid ${C.border}`, background: "#fff", fontFamily: "'Outfit', sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" };
}
function monthStart(v) {
  const d = /* @__PURE__ */ new Date(`${v}T12:00:00Z`);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}
function addMonths(v, n) {
  const d = /* @__PURE__ */ new Date(`${v}T12:00:00Z`);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}
function pad(n) {
  return String(n).padStart(2, "0");
}
function monthLabel(v) {
  return new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric" }).format(/* @__PURE__ */ new Date(`${v}T12:00:00Z`));
}
function dayLabel(v) {
  return new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" }).format(/* @__PURE__ */ new Date(`${v}T12:00:00Z`));
}
function fmtPhone(p) {
  return p ? p.replace(/\s+/g, "").replace(/^00/, "+") : null;
}
function mapsUrl(a) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
}
function fmtCzk(n) {
  return new Intl.NumberFormat("cs-CZ").format(n) + " K\u010D";
}
function buildMonthCells(month, availabilityMap) {
  const first = /* @__PURE__ */ new Date(`${month}T12:00:00Z`);
  const year = first.getUTCFullYear(), mi = first.getUTCMonth();
  const leading = (new Date(Date.UTC(year, mi, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, mi + 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    const date = `${year}-${pad(mi + 1)}-${pad(d)}`;
    cells.push({ date, day: d, row: availabilityMap.get(date) || { date, status: "available", capacity: 1, accepts_express: false, note: "" } });
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}
function Screen({ title, onBack, children }) {
  return /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", background: C.bg, padding: 14 }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 430, margin: "0 auto", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, boxShadow: C.shadow, overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: `1px solid ${C.border}` }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onBack,
          style: { width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text, flexShrink: 0 },
          children: /* @__PURE__ */ jsx(Icon, { name: "chevron_left", size: 18, color: C.text })
        }
      ),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 500, color: C.text }, children: title })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { padding: 14 }, children })
  ] }) });
}
function KalendarScreen({ onBack, availabilityMap, monthCells, month, setMonth, save, saving, painterNote, setPainterNote, setDetailDate }) {
  return /* @__PURE__ */ jsx(Screen, { title: "Kalend\xE1\u0159", onBack, children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: 14 }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: C.textMid }, children: "Zaklikejte dny, kdy m\u016F\u017Eete pracovat. Detail dne otev\u0159ete tapnut\xEDm." }),
    /* @__PURE__ */ jsxs("div", { style: { border: `1px solid ${C.border}`, borderRadius: 18, padding: 12, background: C.surfaceSoft }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setMonth((p) => addMonths(p, -1)),
            style: { width: 34, height: 34, borderRadius: 999, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
            children: /* @__PURE__ */ jsx(Icon, { name: "chevron_left", size: 16, color: C.text })
          }
        ),
        /* @__PURE__ */ jsx("strong", { style: { fontSize: 16, color: C.text, textTransform: "capitalize" }, children: monthLabel(month) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setMonth((p) => addMonths(p, 1)),
            style: { width: 34, height: 34, borderRadius: 999, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
            children: /* @__PURE__ */ jsx(Icon, { name: "chevron_right", size: 16, color: C.text })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }, children: WEEKDAYS.map((w) => /* @__PURE__ */ jsx("div", { style: { textAlign: "center", fontSize: 11, color: C.textLight }, children: w }, w)) }),
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }, children: monthCells.map((cell, i) => {
        if (!cell) return /* @__PURE__ */ jsx("div", {}, `e-${i}`);
        const meta = STATUS_META[cell.row.status] || STATUS_META.available;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setDetailDate(cell.date),
            style: { minHeight: 48, borderRadius: 14, border: `1px solid ${C.border}`, background: meta.bg, color: meta.text, display: "grid", placeItems: "center", padding: 6, cursor: "pointer", fontFamily: "'Outfit', sans-serif" },
            children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 600 }, children: cell.day }),
              /* @__PURE__ */ jsx("div", { style: { width: 5, height: 5, borderRadius: 999, background: meta.dot } })
            ]
          },
          cell.date
        );
      }) }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }, children: Object.entries(STATUS_META).map(([k, m]) => /* @__PURE__ */ jsxs("div", { style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 999, background: m.bg, color: m.text, fontSize: 11 }, children: [
        /* @__PURE__ */ jsx("span", { style: { width: 5, height: 5, borderRadius: 999, background: m.dot, display: "inline-block" } }),
        m.label
      ] }, k)) })
    ] }),
    /* @__PURE__ */ jsx(BulkAvailability, { availabilityMap, onSave: save, saving }),
    /* @__PURE__ */ jsxs("div", { style: { border: `1px solid ${C.border}`, borderRadius: 16, padding: 12 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }, children: "Zpr\xE1va pro dispe\u010Dink" }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          value: painterNote,
          onChange: (e) => setPainterNote(e.target.value),
          placeholder: "Nap\u0159. tento t\xFDden jen men\u0161\xED zak\xE1zky.",
          style: { ...field(), minHeight: 88, resize: "vertical" }
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => save({ painterNote }, "note"),
          style: { marginTop: 8, width: "100%", padding: "12px 14px", borderRadius: 12, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
          children: [
            /* @__PURE__ */ jsx(Icon, { name: "send", size: 14, color: "#fff" }),
            saving === "note" ? "Ukl\xE1d\xE1m\u2026" : "Ulo\u017Eit zpr\xE1vu"
          ]
        }
      )
    ] })
  ] }) });
}
function BulkAvailability({ availabilityMap, onSave, saving }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("unavailable");
  const [done, setDone] = useState(false);
  const SC = { available: { bg: C.accentSoft, color: C.accent }, limited: { bg: C.warnSoft, color: C.warn }, unavailable: { bg: C.mutedSoft, color: C.muted } };
  const SL = { available: "Volno", limited: "Omezen\u011B", unavailable: "Pry\u010D" };
  async function apply() {
    if (!from || !to || from > to) return;
    const entries = [], cur = /* @__PURE__ */ new Date(`${from}T12:00:00Z`), end = /* @__PURE__ */ new Date(`${to}T12:00:00Z`);
    while (cur <= end) {
      const date = cur.toISOString().slice(0, 10);
      const ex = availabilityMap.get(date) || {};
      entries.push({ date, status, capacity: status === "unavailable" ? 0 : ex.capacity ?? 1, accepts_express: ex.accepts_express ?? false, note: ex.note || "", source: "painter" });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    const ok = await onSave({ entries }, "bulk");
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 2e3);
    }
  }
  const fs = { padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.border}`, background: "#fff", fontFamily: "'Outfit', sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box" };
  return /* @__PURE__ */ jsxs("div", { style: { border: `1px solid ${C.border}`, borderRadius: 16, padding: 12 }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }, children: "Nastavit blok dn\u016F" }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.textLight, marginBottom: 4 }, children: "Od" }),
        /* @__PURE__ */ jsx("input", { type: "date", value: from, onChange: (e) => setFrom(e.target.value), style: { ...fs, width: "100%" } })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.textLight, marginBottom: 4 }, children: "Do" }),
        /* @__PURE__ */ jsx("input", { type: "date", value: to, onChange: (e) => setTo(e.target.value), style: { ...fs, width: "100%" } })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }, children: Object.entries(SL).map(([k, l]) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setStatus(k),
        style: { padding: "9px 6px", borderRadius: 12, border: `1px solid ${status === k ? SC[k].color : C.border}`, background: status === k ? SC[k].bg : "#fff", color: status === k ? SC[k].color : C.textMid, fontFamily: "'Outfit', sans-serif", fontSize: 12, cursor: "pointer" },
        children: l
      },
      k
    )) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: apply,
        disabled: !from || !to || saving === "bulk",
        style: { width: "100%", padding: "11px 12px", borderRadius: 12, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: "pointer", opacity: !from || !to ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
        children: saving === "bulk" ? "Ukl\xE1d\xE1m\u2026" : done ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Icon, { name: "check", size: 14, color: "#fff" }),
          "Ulo\u017Eeno"
        ] }) : "Pou\u017E\xEDt na v\xFDb\u011Br"
      }
    )
  ] });
}
function ZakazkyScreen({ jobs, onBack }) {
  const [selected, setSelected] = useState(null);
  const DONE_STATUSES = ["completed", "done", "cancelled"];
  const active = jobs.filter((j) => !DONE_STATUSES.includes(j.status));
  const done = jobs.filter((j) => DONE_STATUSES.includes(j.status));
  if (selected) return /* @__PURE__ */ jsx(JobDetail, { job: selected, onClose: () => setSelected(null), onBack });
  function Card({ job }) {
    const meta = JOB_STATUS_META[job.status] || { label: job.status, bg: C.mutedSoft, color: C.muted };
    const addr = job.client_address || job.address || job.service_area || job.locality || "\u2014";
    return /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setSelected(job),
        style: { width: "100%", textAlign: "left", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif" },
        children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 600, color: C.text }, children: job.client_name || "Z\xE1kazn\xEDk" }),
            /* @__PURE__ */ jsx("span", { style: { padding: "4px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: meta.bg, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }, children: meta.label })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, color: C.textMid, fontSize: 13, marginBottom: 6 }, children: [
            /* @__PURE__ */ jsx(Icon, { name: "pin", size: 13, color: C.textLight }),
            addr
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 6, color: C.textLight, fontSize: 12 }, children: job.preferred_date_label && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Icon, { name: "calendar", size: 12, color: C.textLight }),
              job.preferred_date_label
            ] }) }),
            job.painter_reward != null && /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: C.accent }, children: fmtCzk(job.painter_reward) })
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsx(Screen, { title: "Zak\xE1zky", onBack, children: jobs.length === 0 ? /* @__PURE__ */ jsxs("div", { style: { padding: "48px 0", textAlign: "center" }, children: [
    /* @__PURE__ */ jsx("div", { style: { width: 48, height: 48, borderRadius: 14, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: C.textLight }, children: /* @__PURE__ */ jsx(Icon, { name: "briefcase", size: 22 }) }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 15, color: C.textMid }, children: "Zat\xEDm \u017E\xE1dn\xE9 zak\xE1zky" }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: C.textLight, marginTop: 6 }, children: "P\u0159id\u011Blen\xE9 zak\xE1zky se zobraz\xED zde" })
  ] }) : /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: 8 }, children: [
    active.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4, marginBottom: 2 }, children: "Aktivn\xED" }),
      active.map((j) => /* @__PURE__ */ jsx(Card, { job: j }, j.id))
    ] }),
    done.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: active.length ? 10 : 4, marginBottom: 2 }, children: "Dokon\u010Den\xE9" }),
      done.map((j) => /* @__PURE__ */ jsx(Card, { job: j }, j.id))
    ] })
  ] }) });
}
function JobDetail({ job, onClose, onBack }) {
  const addr = job.client_address || job.address || "";
  const area = job.service_area || job.locality || "";
  const phone = fmtPhone(job.client_phone);
  const meta = JOB_STATUS_META[job.status] || { label: job.status, bg: C.mutedSoft, color: C.muted };
  function Row({ icon, label, children, accent }) {
    return /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 12, paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${C.border}` }, children: [
      /* @__PURE__ */ jsx("div", { style: { marginTop: 1, color: C.textLight, flexShrink: 0 }, children: /* @__PURE__ */ jsx(Icon, { name: icon, size: 14 }) }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.textLight, marginBottom: 3 }, children: label }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 14, color: accent ? C.accent : C.text, fontWeight: accent ? 600 : 400 }, children })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsx(Screen, { title: job.client_name || "Detail zak\xE1zky", onBack: onClose, children: /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }, children: [
      /* @__PURE__ */ jsx("div", { children: job.reference && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.textLight }, children: job.reference }) }),
      /* @__PURE__ */ jsx("span", { style: { padding: "5px 11px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: meta.bg, color: meta.color }, children: meta.label })
    ] }),
    phone && /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }, children: [
      /* @__PURE__ */ jsxs("a", { href: `tel:${phone}`, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 12px", borderRadius: 14, background: C.accent, color: "#fff", textDecoration: "none", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500 }, children: [
        /* @__PURE__ */ jsx(Icon, { name: "phone", size: 15, color: "#fff" }),
        "Volat"
      ] }),
      /* @__PURE__ */ jsxs("a", { href: `sms:${phone}`, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 12px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.surfaceSoft, color: C.accent, textDecoration: "none", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500 }, children: [
        /* @__PURE__ */ jsx(Icon, { name: "message", size: 15, color: C.accent }),
        "SMS"
      ] })
    ] }),
    addr && /* @__PURE__ */ jsxs(
      "a",
      {
        href: mapsUrl(addr),
        target: "_blank",
        rel: "noopener noreferrer",
        style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.surfaceSoft, textDecoration: "none", marginBottom: 20, fontFamily: "'Outfit', sans-serif" },
        children: [
          /* @__PURE__ */ jsx(Icon, { name: "map", size: 18, color: C.accent }),
          /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 500, color: C.text }, children: addr }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.accent, marginTop: 2 }, children: "Otev\u0159\xEDt v Google Maps" })
          ] }),
          /* @__PURE__ */ jsx(Icon, { name: "chevron_right", size: 16, color: C.textLight })
        ]
      }
    ),
    phone && /* @__PURE__ */ jsx(Row, { icon: "phone", label: "Telefon", children: /* @__PURE__ */ jsx("a", { href: `tel:${phone}`, style: { color: C.accent, textDecoration: "none" }, children: job.client_phone }) }),
    job.preferred_date_label && /* @__PURE__ */ jsx(Row, { icon: "calendar", label: "Term\xEDn", children: job.preferred_date_label }),
    job.preferred_time_label && /* @__PURE__ */ jsx(Row, { icon: "clock", label: "\u010Cas", children: job.preferred_time_label }),
    job.work_type && /* @__PURE__ */ jsx(Row, { icon: "tag", label: "Typ pr\xE1ce", children: job.work_type }),
    (job.custom_area || job.area_m2) && /* @__PURE__ */ jsxs(Row, { icon: "ruler", label: "Plocha", children: [
      job.custom_area || job.area_m2,
      " m\xB2"
    ] }),
    area && area !== addr && /* @__PURE__ */ jsx(Row, { icon: "pin", label: "Oblast", children: area }),
    job.painter_reward != null && /* @__PURE__ */ jsx(Row, { icon: "coins", label: "Va\u0161e odm\u011Bna", accent: true, children: fmtCzk(job.painter_reward) }),
    job.confirmed_price != null && /* @__PURE__ */ jsx(Row, { icon: "coins", label: "Cena pro z\xE1kazn\xEDka", children: fmtCzk(job.confirmed_price) }),
    job.client_note && /* @__PURE__ */ jsx(Row, { icon: "note", label: "Pozn\xE1mka z\xE1kazn\xEDka", children: /* @__PURE__ */ jsxs("span", { style: { fontStyle: "italic", color: C.textMid }, children: [
      "\u201E",
      job.client_note,
      '"'
    ] }) })
  ] }) });
}
function NabidkyScreen({ offers, respondingId, respondOffer, onBack }) {
  const pending = offers.filter((o) => o.status === "pending");
  const past = offers.filter((o) => o.status !== "pending");
  const [daysMap, setDaysMap] = useState({});
  const [daysError, setDaysError] = useState({});
  function setDays(offerId, val) {
    setDaysMap((p) => ({ ...p, [offerId]: val }));
    setDaysError((p) => ({ ...p, [offerId]: false }));
  }
  function handleAccept(offerToken, offerId) {
    const d = parseInt(daysMap[offerId] || "", 10);
    if (!d || d < 1) {
      setDaysError((p) => ({ ...p, [offerId]: true }));
      return;
    }
    respondOffer(offerToken, "accepted", d);
  }
  return /* @__PURE__ */ jsx(Screen, { title: "Nab\xEDdky", onBack, children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: 14 }, children: [
    pending.length === 0 && past.length === 0 && /* @__PURE__ */ jsxs("div", { style: { padding: "48px 0", textAlign: "center" }, children: [
      /* @__PURE__ */ jsx("div", { style: { width: 48, height: 48, borderRadius: 14, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: C.textLight }, children: /* @__PURE__ */ jsx(Icon, { name: "inbox", size: 22 }) }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 15, color: C.textMid }, children: "\u017D\xE1dn\xE9 nab\xEDdky" }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: C.textLight, marginTop: 6 }, children: "Nov\xE9 nab\xEDdky se zobraz\xED zde" })
    ] }),
    pending.length > 0 && /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: 12 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }, children: "\u010Cek\xE1 na reakci" }),
      pending.map((offer) => {
        const job = offer.job || {};
        const loc = job.service_area || job.locality || offer.approx_location || "\u2014";
        const addr = job.client_address || job.address || "";
        const payout = offer.offered_payout || offer.offered_reward;
        function DetailRow({ icon, label, value }) {
          if (!value) return null;
          return /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, paddingBottom: 11, marginBottom: 11, borderBottom: `1px solid ${C.border}` }, children: [
            /* @__PURE__ */ jsx("div", { style: { color: C.textLight, flexShrink: 0, marginTop: 1 }, children: /* @__PURE__ */ jsx(Icon, { name: icon, size: 13 }) }),
            /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.textLight, marginBottom: 2 }, children: label }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: C.text }, children: value })
            ] })
          ] });
        }
        return /* @__PURE__ */ jsxs("div", { style: { border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px 14px", borderBottom: `1px solid ${C.border}`, background: C.warnSoft }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.warn, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }, children: "Nov\xE1 nab\xEDdka" }),
            (job.preferred_date_label || job.preferred_time_label) && /* @__PURE__ */ jsxs("div", { style: { background: "#fff", border: `1px solid ${C.warn}55`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }, children: [
              /* @__PURE__ */ jsx(Icon, { name: "calendar", size: 18, color: C.warn }),
              /* @__PURE__ */ jsxs("div", { children: [
                job.preferred_date_label && /* @__PURE__ */ jsx("div", { style: { fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }, children: job.preferred_date_label }),
                job.preferred_time_label && /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: C.textMid, marginTop: 2 }, children: job.preferred_time_label })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8 }, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 600, color: C.text }, children: loc }),
                addr && addr !== loc && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.textMid, marginTop: 2 }, children: addr })
              ] }),
              payout && /* @__PURE__ */ jsxs("div", { style: { textAlign: "right", flexShrink: 0 }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.textMid, marginBottom: 2 }, children: "Va\u0161e odm\u011Bna" }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 20, fontWeight: 700, color: C.accent, letterSpacing: "-0.02em" }, children: fmtCzk(payout) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px 4px" }, children: [
            /* @__PURE__ */ jsx(DetailRow, { icon: "tag", label: "Typ pr\xE1ce", value: job.work_type }),
            /* @__PURE__ */ jsx(DetailRow, { icon: "ruler", label: "Plocha", value: job.custom_area || job.area_m2 ? `${job.custom_area || job.area_m2} m\xB2` : null }),
            /* @__PURE__ */ jsx(DetailRow, { icon: "pin", label: "Oblast", value: loc !== addr ? null : loc }),
            job.repairs != null && /* @__PURE__ */ jsx(DetailRow, { icon: "note", label: "Opravy om\xEDtky", value: job.repairs ? "Ano" : "Ne" }),
            job.client_note && /* @__PURE__ */ jsx("div", { style: { paddingBottom: 11, marginBottom: 11, borderBottom: `1px solid ${C.border}` }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10 }, children: [
              /* @__PURE__ */ jsx("div", { style: { color: C.textLight, flexShrink: 0, marginTop: 1 }, children: /* @__PURE__ */ jsx(Icon, { name: "note", size: 13 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.textLight, marginBottom: 4 }, children: "Pozn\xE1mka z\xE1kazn\xEDka" }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: C.textMid, fontStyle: "italic", lineHeight: 1.5 }, children: [
                  "\u201E",
                  job.client_note,
                  '"'
                ] })
              ] })
            ] }) })
          ] }),
          offer.offer_token && /* @__PURE__ */ jsxs("div", { style: { padding: "0 16px 16px" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { marginBottom: 10 }, children: [
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.textLight, marginBottom: 6 }, children: [
                "Po\u010Det dn\xED pot\u0159ebn\xFDch na realizaci",
                /* @__PURE__ */ jsx("span", { style: { color: C.danger }, children: " *" })
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 0, border: `1px solid ${daysError[offer.id] ? C.danger : C.border}`, borderRadius: 12, overflow: "hidden", background: "#fff" }, children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setDays(offer.id, String(Math.max(1, (parseInt(daysMap[offer.id] || "1", 10) || 1) - 1))),
                    style: { width: 42, height: 44, border: "none", borderRight: `1px solid ${C.border}`, background: "transparent", fontSize: 20, color: C.textMid, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
                    children: "\u2212"
                  }
                ),
                /* @__PURE__ */ jsx("div", { style: { flex: 1, textAlign: "center" }, children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: "1",
                    max: "30",
                    value: daysMap[offer.id] || "",
                    onChange: (e) => setDays(offer.id, e.target.value),
                    placeholder: "\u2014",
                    style: { width: "100%", border: "none", outline: "none", textAlign: "center", fontSize: 16, fontWeight: 600, color: C.text, fontFamily: "'Outfit', sans-serif", padding: "0 4px", background: "transparent", height: 44, boxSizing: "border-box" }
                  }
                ) }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setDays(offer.id, String(Math.min(30, (parseInt(daysMap[offer.id] || "0", 10) || 0) + 1))),
                    style: { width: 42, height: 44, border: "none", borderLeft: `1px solid ${C.border}`, background: "transparent", fontSize: 20, color: C.textMid, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
                    children: "+"
                  }
                )
              ] }),
              daysError[offer.id] && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.danger, marginTop: 5 }, children: "Zadejte po\u010Det dn\xED p\u0159ed p\u0159ijet\xEDm." })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }, children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  disabled: !!respondingId,
                  onClick: () => handleAccept(offer.offer_token, offer.id),
                  style: { padding: "12px 12px", borderRadius: 12, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: "pointer", opacity: respondingId ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 500 },
                  children: [
                    /* @__PURE__ */ jsx(Icon, { name: "check", size: 15, color: "#fff" }),
                    respondingId === offer.offer_token + "accepted" ? "Ukl\xE1d\xE1m\u2026" : "P\u0159ijmout"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  disabled: !!respondingId,
                  onClick: () => respondOffer(offer.offer_token, "declined"),
                  style: { padding: "12px 12px", borderRadius: 12, border: `1px solid ${C.border}`, background: "#fff", color: C.danger, fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: "pointer", opacity: respondingId ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
                  children: [
                    /* @__PURE__ */ jsx(Icon, { name: "x", size: 15, color: C.danger }),
                    respondingId === offer.offer_token + "declined" ? "Ukl\xE1d\xE1m\u2026" : "Odm\xEDtnout"
                  ]
                }
              )
            ] })
          ] })
        ] }, offer.id);
      })
    ] }),
    past.length > 0 && /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: 6 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }, children: "Historie" }),
      past.map((offer) => {
        const sm = { accepted: { label: "P\u0159ijat\xE1", bg: C.accentSoft, color: C.accent }, declined: { label: "Odm\xEDtnut\xE1", bg: C.mutedSoft, color: C.muted }, expired: { label: "Pro\u0161l\xE1", bg: C.mutedSoft, color: C.muted }, withdrawn: { label: "Sta\u017Een\xE1", bg: C.mutedSoft, color: C.muted } }[offer.status] || { label: offer.status, bg: C.mutedSoft, color: C.muted };
        const loc = offer.approx_location || offer.job?.service_area || offer.job?.locality || "\u2014";
        const payout = offer.offered_payout || offer.offered_reward;
        return /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 14 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: C.textMid, fontWeight: 500 }, children: loc }),
            payout && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.textLight, marginTop: 2 }, children: fmtCzk(payout) })
          ] }),
          /* @__PURE__ */ jsx("span", { style: { padding: "4px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: sm.bg, color: sm.color, whiteSpace: "nowrap" }, children: sm.label })
        ] }, offer.id);
      })
    ] })
  ] }) });
}
function HomeScreen({ painter, offers, jobs, onNav, error }) {
  const pending = offers.filter((o) => o.status === "pending").length;
  const activeJobs = jobs.filter((j) => j.status === "assigned" || j.status === "in_progress").length;
  const sections = [
    {
      id: "nabidky",
      icon: "inbox",
      label: "Nab\xEDdky",
      sub: pending > 0 ? `${pending} \u010Dek\xE1 na reakci` : offers.length > 0 ? "\u017D\xE1dn\xE9 nov\xE9 nab\xEDdky" : "\u017D\xE1dn\xE9 nab\xEDdky",
      badge: pending || null,
      badgeColor: C.warn,
      highlight: pending > 0
    },
    {
      id: "kalendar",
      icon: "calendar",
      label: "Kalend\xE1\u0159",
      sub: "Dostupnost a voln\xE9 term\xEDny",
      badge: null
    },
    {
      id: "zakazky",
      icon: "briefcase",
      label: "Zak\xE1zky",
      sub: activeJobs > 0 ? `${activeJobs} aktivn\xED zak\xE1zk${activeJobs === 1 ? "a" : activeJobs < 5 ? "y" : "\xED"}` : jobs.length > 0 ? `${jobs.length} celkem` : "\u017D\xE1dn\xE9 zak\xE1zky",
      badge: activeJobs || null,
      badgeColor: C.accent
    }
  ];
  return /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", background: C.bg, padding: 14 }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 430, margin: "0 auto" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, boxShadow: C.shadow, padding: "22px 20px 20px", marginBottom: 12 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }, children: "Port\xE1l mal\xED\u0159e" }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 28, fontWeight: 400, color: C.text, letterSpacing: "-0.04em" }, children: painter?.name || "Mal\xED\u0159" }),
      error && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.danger, marginTop: 8 }, children: error })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "grid", gap: 8 }, children: sections.map((s) => /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => onNav(s.id),
        style: { width: "100%", textAlign: "left", background: s.highlight ? C.warnSoft : C.surface, border: `1px solid ${s.highlight ? C.warn + "55" : C.border}`, borderRadius: 18, padding: "18px 20px", cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: C.shadow, display: "flex", alignItems: "center", gap: 16 },
        children: [
          /* @__PURE__ */ jsx("div", { style: { width: 44, height: 44, borderRadius: 13, background: s.highlight ? C.warn + "18" : C.surfaceSoft, border: `1px solid ${s.highlight ? C.warn + "40" : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx(Icon, { name: s.icon, size: 20, color: s.highlight ? C.warn : C.textMid }) }),
          /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 3 }, children: s.label }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: s.highlight ? C.warn : C.textMid }, children: s.sub })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }, children: [
            s.badge ? /* @__PURE__ */ jsx("span", { style: { minWidth: 22, height: 22, borderRadius: 999, background: s.badgeColor, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }, children: s.badge }) : null,
            /* @__PURE__ */ jsx(Icon, { name: "chevron_right", size: 16, color: C.textLight })
          ] })
        ]
      },
      s.id
    )) })
  ] }) });
}
function DaySheet({ detailDate, draft, setDraft, saving, saveDay, onClose }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "button",
      tabIndex: 0,
      onClick: onClose,
      onKeyDown: (e) => {
        if (e.key === "Escape") onClose();
      },
      style: { position: "fixed", inset: 0, background: "rgba(20,14,6,0.36)", display: "grid", alignItems: "end", padding: 10, zIndex: 200 },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: (e) => e.stopPropagation(),
          style: { background: "#fff", borderRadius: "22px 22px 0 0", padding: 18, boxShadow: C.shadow, maxWidth: 430, width: "100%", margin: "0 auto" },
          children: [
            /* @__PURE__ */ jsx("div", { style: { width: 36, height: 3, borderRadius: 999, background: C.border, margin: "0 auto 16px" } }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: C.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }, children: "Detail dne" }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 20, color: C.text, letterSpacing: "-0.04em", marginBottom: 16 }, children: dayLabel(detailDate) }),
            /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }, children: Object.entries(STATUS_META).map(([v, m]) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setDraft((p) => ({ ...p, status: v })),
                style: { padding: "11px 8px", borderRadius: 14, border: `1px solid ${draft.status === v ? m.dot : C.border}`, background: draft.status === v ? m.bg : "#fff", color: draft.status === v ? m.text : C.textMid, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer" },
                children: m.label
              },
              v
            )) }),
            /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: 10 }, children: [
              /* @__PURE__ */ jsx("input", { type: "number", min: "0", value: draft.capacity ?? 1, onChange: (e) => setDraft((p) => ({ ...p, capacity: e.target.value })), placeholder: "Kapacita na den", style: field() }),
              /* @__PURE__ */ jsxs("label", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.text }, children: [
                /* @__PURE__ */ jsx("input", { type: "checkbox", checked: Boolean(draft.accepts_express), onChange: (e) => setDraft((p) => ({ ...p, accepts_express: e.target.checked })) }),
                "Bere expresn\xED zak\xE1zky"
              ] }),
              /* @__PURE__ */ jsx("textarea", { value: draft.note || "", onChange: (e) => setDraft((p) => ({ ...p, note: e.target.value })), placeholder: "Pozn\xE1mka k tomuto dni", style: { ...field(), minHeight: 84, resize: "vertical" } })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }, children: [
              /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, style: { ...field(), cursor: "pointer", textAlign: "center" }, children: "Zav\u0159\xEDt" }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: saveDay, style: { padding: "11px 12px", borderRadius: 12, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }, children: saving === draft.date ? "Ukl\xE1d\xE1m\u2026" : "Ulo\u017Eit" })
            ] })
          ]
        }
      )
    }
  );
}
function App() {
  const token = useMemo(() => new URLSearchParams(location.search).get("token") || "", []);
  const [state, setState] = useState({ loading: true, error: "", painter: null, availability: [] });
  const [offers, setOffers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [saving, setSaving] = useState("");
  const [painterNote, setPainterNote] = useState("");
  const [month, setMonth] = useState(monthStart((/* @__PURE__ */ new Date()).toISOString().slice(0, 10)));
  const [detailDate, setDetailDate] = useState("");
  const [draft, setDraft] = useState(null);
  const [respondingId, setRespondingId] = useState("");
  const [screen, setScreen] = useState("home");
  async function load() {
    const r = await fetch(`/api/painter/portal?token=${encodeURIComponent(token)}`);
    const d = await r.json();
    if (!r.ok) {
      setState({ loading: false, error: d.error || "Port\xE1l se nepoda\u0159ilo na\u010D\xEDst.", painter: null, availability: [] });
      return;
    }
    setPainterNote(d.painter?.notes || "");
    setOffers(d.offers || []);
    setJobs(d.jobs || []);
    setState({ loading: false, error: "", painter: d.painter, availability: d.availability || [] });
  }
  useEffect(() => {
    load();
  }, [token]);
  const availabilityMap = useMemo(() => new Map((state.availability || []).map((r) => [r.date, r])), [state.availability]);
  const monthCells = useMemo(() => buildMonthCells(month, availabilityMap), [month, availabilityMap]);
  useEffect(() => {
    if (!detailDate) return;
    const base = availabilityMap.get(detailDate) || { date: detailDate, status: "available", capacity: 1, accepts_express: false, note: "" };
    setDraft({ date: detailDate, status: base.status || "available", capacity: base.capacity ?? 1, accepts_express: Boolean(base.accepts_express), note: base.note || "" });
  }, [detailDate, availabilityMap]);
  async function save(payload, savingKey) {
    setSaving(savingKey);
    const r = await fetch("/api/painter/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...payload }) });
    const d = await r.json();
    setSaving("");
    if (!r.ok) {
      setState((p) => ({ ...p, error: d.error || "Ulo\u017Een\xED se nepoda\u0159ilo." }));
      return false;
    }
    setPainterNote(d.painter?.notes || "");
    setState((p) => ({ ...p, error: "", painter: d.painter, availability: d.availability || p.availability }));
    return true;
  }
  async function respondOffer(offerToken, decision, estimatedDays) {
    setRespondingId(offerToken + decision);
    const r = await fetch("/api/painter/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: offerToken, decision, estimatedDays: estimatedDays || null }) });
    const d = await r.json();
    setRespondingId("");
    if (!r.ok) {
      setState((p) => ({ ...p, error: d.error || "Reakci se nepoda\u0159ilo ulo\u017Eit." }));
      return;
    }
    load();
  }
  async function saveDay() {
    if (!draft?.date) return;
    const ok = await save({ entries: [{ date: draft.date, status: draft.status, capacity: draft.capacity, accepts_express: draft.accepts_express, note: draft.note, source: "painter" }] }, draft.date);
    if (ok) setDetailDate("");
  }
  if (state.loading) {
    return /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center", color: C.textMid, fontFamily: "'Outfit', sans-serif", fontSize: 14 }, children: "Na\u010D\xEDt\xE1m\u2026" });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    screen === "home" && /* @__PURE__ */ jsx(HomeScreen, { painter: state.painter, offers, jobs, error: state.error, onNav: setScreen }),
    screen === "nabidky" && /* @__PURE__ */ jsx(NabidkyScreen, { offers, respondingId, respondOffer, onBack: () => setScreen("home") }),
    screen === "kalendar" && /* @__PURE__ */ jsx(
      KalendarScreen,
      {
        onBack: () => setScreen("home"),
        availabilityMap,
        monthCells,
        month,
        setMonth,
        save,
        saving,
        painterNote,
        setPainterNote,
        setDetailDate
      }
    ),
    screen === "zakazky" && /* @__PURE__ */ jsx(ZakazkyScreen, { jobs, onBack: () => setScreen("home") }),
    detailDate && draft && /* @__PURE__ */ jsx(DaySheet, { detailDate, draft, setDraft, saving, saveDay, onClose: () => setDetailDate("") })
  ] });
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ jsx(App, {}));
