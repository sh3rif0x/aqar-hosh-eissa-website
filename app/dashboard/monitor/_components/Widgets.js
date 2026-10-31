"use client";
import { useState } from "react";
import styles from "../../dashboard.module.css";
import { FORMATS, cls, toCsv, downloadCsv, cellValue, callRpc, refreshAll, errMsg } from "@/lib/monitor/core";

export function StatView({ rows }) {
  if (!rows.length) return <p className={styles.empty}>لا توجد بيانات.</p>;
  return (
    <div className={styles.tiles} style={{ marginBottom: 0 }}>
      {rows.map((r) => (
        <div className={styles.tile} key={r.label}><small>{r.label}</small><b>{FORMATS.num(r.value)}</b></div>
      ))}
    </div>
  );
}

export function BarsView({ rows }) {
  if (!rows.length) return <p className={styles.empty}>لا توجد بيانات.</p>;
  const max = Math.max(1, ...rows.map((i) => Number(i.value) || 0));
  return (
    <div className={styles.bars}>
      {rows.map((i, n) => (
        <div className={styles.bar} key={`${i.label}-${n}`}>
          <span>{i.label}</span><i style={{ width: `${((Number(i.value) || 0) / max) * 100}%` }} /><span>{FORMATS.num(i.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function TableView({ f, rows, reload }) {
  const cols = f.columns || [];
  const actions = f.actions || [];
  const [note, setNote] = useState("");
  const run = async (a, r) => {
    if (a.confirm && !confirm(a.confirm)) return;
    try { await callRpc(a.rpc, a.args(r)); setNote(""); reload(); } catch (e) { setNote(errMsg(e)); }
  };
  if (!rows.length) return <p className={styles.empty}>{f.empty || "لا توجد بيانات."}</p>;
  return (
    <>
      {f.exportable !== false && (
        <div className={styles.acts} style={{ marginBottom: ".6rem" }}>
          <button className={styles.b} onClick={() => downloadCsv(`${f.key || f.id}.csv`, toCsv(rows, cols))}>تصدير CSV</button>
        </div>
      )}
      {note && <p className={styles.err}>{note}</p>}
      <div className={styles.tw}>
        <table className={styles.tbl}>
          <thead><tr>{cols.map((c) => <th key={c.key}>{c.label}</th>)}{actions.length > 0 && <th>إجراءات</th>}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {cols.map((c) => <td key={c.key}>{(FORMATS[c.fmt] || FORMATS.text)(cellValue(r, c))}</td>)}
                {actions.length > 0 && (
                  <td><div className={styles.acts}>
                    {actions.map((a) => (
                      <button key={a.label} className={cls(styles.b, a.danger && styles.bDanger)} onClick={() => run(a, r)}>{a.label}</button>
                    ))}
                  </div></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function FormView({ f }) {
  const fields = f.fields || [];
  const init = Object.fromEntries(fields.map((x) => [x.name, x.default ?? ""]));
  const [v, setV] = useState(init);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState({ t: "", k: "" });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const args = Object.fromEntries(fields.map((x) => [x.name, x.type === "number" ? Number(v[x.name] || 0) : v[x.name]]));
      await callRpc(f.rpc, args);
      setNote({ t: f.success || "تم التنفيذ", k: "ok" }); setV(init); refreshAll();
    } catch (x) { setNote({ t: errMsg(x), k: "err" }); } finally { setBusy(false); }
  };
  return (
    <form className={styles.form} onSubmit={submit}>
      {fields.map((x) => (
        <div className={styles.field} key={x.name}>
          <label>{x.label}</label>
          {x.type === "select" ? (
            <select className={styles.in} value={v[x.name]} onChange={(e) => setV({ ...v, [x.name]: e.target.value })}>
              {(x.options || []).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          ) : (
            <input className={styles.in} type={x.type || "text"} required={x.required} value={v[x.name]}
              onChange={(e) => setV({ ...v, [x.name]: e.target.value })} />
          )}
        </div>
      ))}
      {note.t && <p className={note.k === "err" ? styles.err : undefined}>{note.t}</p>}
      <div><button className={cls(styles.b, styles.bPrimary)} disabled={busy}>{busy ? "..." : f.submit || "تنفيذ"}</button></div>
    </form>
  );
}
FormView.isStatic = true;

// لإضافة نوع عرض جديد: أنشئ Component وأضفه هنا فقط.
export const RENDERERS = { stat: StatView, bars: BarsView, table: TableView, form: FormView };
