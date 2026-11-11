// ステップアップ表の書き出し（Excel .xlsx・Word .docx）。外部ライブラリを使わず、ZIP（無圧縮）と XML を組み立てる。
// PDF はブラウザの印刷（「PDF に保存」）を使う。

const enc = new TextEncoder();

let CRC_TABLE = null;
function crc32(bytes) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** files: [{name, data(string|Uint8Array)}] → ZIP（無圧縮）の Uint8Array */
export function zip(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  const dosTime = 0;
  const dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1;
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = typeof f.data === "string" ? enc.encode(f.data) : f.data;
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 のファイル名
    local.setUint16(8, 0, true);
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    parts.push(new Uint8Array(local.buffer), name, data);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(10, 0, true);
    cen.setUint16(12, dosTime, true);
    cen.setUint16(14, dosDate, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cenSize = central.reduce((a, p) => a + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cenSize, true);
  end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((a, p) => a + p.length, 0));
  let pos = 0;
  for (const p of all) { out.set(p, pos); pos += p.length; }
  return out;
}

function x(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function colName(i) {
  let s = "";
  let n = i + 1;
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/* ---------- Excel ---------- */

/**
 * sheets: [{name, title?, widths:[...], header:[...], rows:[[...]]}]
 * 数値はそのまま数値のセル、それ以外は文字列のセル。1行目にタイトル（太字）、見出し行は太字・色つき。
 */
export function buildXlsx(sheets) {
  const files = [];
  const sheetEntries = sheets.map((sh, i) => {
    const rowsXml = [];
    let r = 1;
    const cell = (c, v, style) => {
      const ref = colName(c) + r;
      if (typeof v === "number" && Number.isFinite(v)) return `<c r="${ref}" s="${style}"><v>${v}</v></c>`;
      if (v === null || v === undefined || v === "") return `<c r="${ref}" s="${style}"/>`;
      return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${x(v)}</t></is></c>`;
    };
    if (sh.title) { rowsXml.push(`<row r="${r}">${cell(0, sh.title, 3)}</row>`); r += 1; }
    if (sh.note) { rowsXml.push(`<row r="${r}">${cell(0, sh.note, 0)}</row>`); r += 1; }
    if (sh.title || sh.note) r += 1;
    if (sh.header) { rowsXml.push(`<row r="${r}">${sh.header.map((h, c) => cell(c, h, 1)).join("")}</row>`); r += 1; }
    for (const row of sh.rows) { rowsXml.push(`<row r="${r}">${row.map((v, c) => cell(c, v, 2)).join("")}</row>`); r += 1; }
    const cols = (sh.widths || []).map((w, c) => `<col min="${c + 1}" max="${c + 1}" width="${w}" customWidth="1"/>`).join("");
    const headerRow = (sh.title ? 1 : 0) + (sh.note ? 1 : 0) + ((sh.title || sh.note) ? 1 : 0) + 1;
    const pane = sh.header ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` : "";
    files.push({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>${pane}${cols ? `<cols>${cols}</cols>` : ""}<sheetData>${rowsXml.join("")}</sheetData><pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`,
    });
    const safe = String(sh.name).replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || `Sheet${i + 1}`;
    return { id: i + 1, name: safe };
  });
  files.unshift(
    { name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheetEntries.map((s) => `<Override PartName="/xl/worksheets/sheet${s.id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>` },
    { name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: "xl/workbook.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetEntries.map((s) => `<sheet name="${x(s.name)}" sheetId="${s.id}" r:id="rId${s.id}"/>`).join("")}</sheets></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetEntries.map((s) => `<Relationship Id="rId${s.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${s.id}.xml"/>`).join("")}<Relationship Id="rId${sheetEntries.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: "xl/styles.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Yu Gothic"/><family val="3"/><charset val="128"/></font><font><b/><sz val="11"/><name val="Yu Gothic"/><family val="3"/><charset val="128"/></font><font><b/><sz val="14"/><name val="Yu Gothic"/><family val="3"/><charset val="128"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE4F3F8"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9CFC2"/></left><right style="thin"><color rgb="FFD9CFC2"/></right><top style="thin"><color rgb="FFD9CFC2"/></top><bottom style="thin"><color rgb="FFD9CFC2"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>` },
  );
  return zip(files);
}

/* ---------- Word ---------- */

const FONT = `<w:rFonts w:ascii="Yu Gothic" w:hAnsi="Yu Gothic" w:eastAsia="Yu Gothic"/>`;

function run(text, { bold = false, size = 21, color = "" } = {}) {
  return `<w:r><w:rPr>${FONT}${bold ? "<w:b/>" : ""}${color ? `<w:color w:val="${color}"/>` : ""}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${x(text)}</w:t></w:r>`;
}

function para(text, opts = {}) {
  const spacing = `<w:spacing w:before="${opts.before ?? 0}" w:after="${opts.after ?? 80}"/>`;
  return `<w:p><w:pPr>${spacing}${opts.keepNext ? "<w:keepNext/>" : ""}</w:pPr>${Array.isArray(text) ? text.map((t) => run(t.text, t)).join("") : run(text, opts)}</w:p>`;
}

/** cells: 各行の配列。widths は twips。header 行は太字・色つき。 */
function table(header, rows, widths) {
  const border = `<w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map((b) => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="BFB3A5"/>`).join("")}</w:tblBorders>`;
  const grid = `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
  const tc = (content, w, head) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${head ? `<w:shd w:val="clear" w:color="auto" w:fill="E4F3F8"/>` : ""}</w:tcPr>${String(content).split("\n").map((line, i) => `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>${run(line, { bold: head || (i === 0 && false), size: i === 0 ? 20 : 17, color: i === 0 ? "" : "6F6578" })}</w:p>`).join("")}</w:tc>`;
  const tr = (cells, head) => `<w:tr>${head ? "<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>" : "<w:trPr><w:cantSplit/></w:trPr>"}${cells.map((c, i) => tc(c, widths[i], head)).join("")}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/>${border}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>${grid}${header ? tr(header, true) : ""}${rows.map((r) => tr(r, false)).join("")}</w:tbl>`;
}

/** blocks: [{type:'title'|'p'|'h'|'table', ...}] → docx */
export function buildDocx(blocks) {
  const body = blocks.map((b) => {
    if (b.type === "title") return para(b.text, { bold: true, size: 32, after: 60 });
    if (b.type === "h") return para(b.text, { bold: true, size: 24, before: 200, after: 60, keepNext: true, color: "1F7A99" });
    if (b.type === "p") return para(b.text, { size: b.size || 20, color: b.color || "" });
    if (b.type === "table") return table(b.header, b.rows, b.widths) + para("", { after: 0 });
    return "";
  }).join("");
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850" w:header="425" w:footer="425" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  return zip([
    { name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>` },
    { name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: "word/document.xml", data: document },
  ]);
}

/* ---------- ステップアップ表・項目一覧・分析 ---------- */

function md(date) {
  if (!date) return "";
  const [y, m, d] = date.slice(0, 10).split("-");
  return `${Number(y)}/${Number(m)}/${Number(d)}`;
}

function jstDate(iso) {
  if (!iso) return "";
  return md(new Date(new Date(iso).getTime() + 9 * 3600000).toISOString());
}

/** 一人ぶんのステップアップ表。v は learnerView の戻り値。 */
export function learnerXlsx(v) {
  const L = v.learner;
  const rows = [];
  for (const st of v.view.stages) {
    for (const it of st.items) {
      rows.push([`${st.title}（${st.theme}）`, md(st.target), it.text, it.detail, it.self_at ? jstDate(it.self_at) : "", it.mentor_at ? jstDate(it.mentor_at) : "", it.mentor_at ? "☑" : "□"]);
    }
  }
  const reviews = v.view.stages.map((st) => {
    const r = v.reviews[st.id] || {};
    return [st.title, md(st.target), st.state === "done" ? "達成" : st.late ? "目標日すぎ" : st.state === "current" ? "いまの段階" : "", r.met_on ? md(r.met_on) : "", r.self_note || "", r.mentor_note || ""];
  });
  const note = `${L.nursery_name}　${L.display_name} さん　入社日 ${md(L.start_date)}　指導役 ${L.mentor_name || "未定"}　指導役の確認 ${v.view.ok}/${v.view.total}`;
  return buildXlsx([
    { name: "ステップアップ表", title: "ステップアップ表", note, widths: [24, 11, 44, 52, 12, 12, 8], header: ["段階", "目標日", "できるようになること", "覚えるポイント", "本人できた", "指導役確認", "確認"], rows },
    { name: "振り返り面談", title: "振り返り面談", note, widths: [12, 11, 12, 12, 40, 40], header: ["段階", "目標日", "状態", "面談日", "本人のひとこと", "指導役のひとこと"], rows: reviews },
  ]);
}

export function learnerDocx(v) {
  const L = v.learner;
  const blocks = [
    { type: "title", text: "トリオランド　ステップアップ表" },
    { type: "p", text: `名前：${L.display_name}　園：${L.nursery_name}　入社日：${md(L.start_date)}　指導役：${L.mentor_name || "未定"}` },
    { type: "p", text: `指導役の確認：${v.view.ok} / ${v.view.total}（指導役が確認した項目に ☑）`, color: "6F6578" },
  ];
  for (const st of v.view.stages) {
    const r = v.reviews[st.id] || {};
    blocks.push({ type: "h", text: `${st.title}　${st.theme}（目標日 ${md(st.target)}）` });
    blocks.push({
      type: "table",
      header: ["確認", "できるようになること", "本人", "指導役"],
      widths: [700, 6900, 1300, 1300],
      rows: st.items.map((it) => [it.mentor_at ? "☑" : "□", it.detail ? `${it.text}\n${it.detail}` : it.text, it.self_at ? jstDate(it.self_at) : "", it.mentor_at ? jstDate(it.mentor_at) : ""]),
    });
    blocks.push({ type: "p", text: `面談日 ${r.met_on ? md(r.met_on) : "＿＿／＿＿"}　本人サイン＿＿＿＿＿＿　指導役サイン＿＿＿＿＿＿`, size: 18 });
    if (r.self_note || r.mentor_note) blocks.push({ type: "p", text: `本人：${r.self_note || "—"}　指導役：${r.mentor_note || "—"}`, size: 18, color: "6F6578" });
  }
  blocks.push({ type: "p", text: "6ヶ月でクラス担任" });
  return buildDocx(blocks);
}

/** 項目一覧（白紙の表として印刷・配布できる）。 */
export function checklistXlsx(checklist) {
  const rows = [];
  for (const st of checklist.stages) for (const it of st.items) rows.push([`${st.title}（${st.theme}）`, st.days, it.text, it.detail || "", "", ""]);
  return buildXlsx([{ name: "項目一覧", title: `ステップアップ表の項目（版${checklist.version}）`, widths: [26, 10, 44, 56, 12, 12], header: ["段階", "入社何日目", "できるようになること", "覚えるポイント", "本人", "指導役"], rows }]);
}

export function checklistDocx(checklist) {
  const blocks = [
    { type: "title", text: "トリオランド　ステップアップ表（項目一覧）" },
    { type: "p", text: `版${checklist.version}　名前：＿＿＿＿＿＿＿＿　入社日：＿＿／＿＿／＿＿　指導役：＿＿＿＿＿＿＿＿` },
  ];
  for (const st of checklist.stages) {
    blocks.push({ type: "h", text: `${st.title}（入社${st.days}日目まで）　${st.theme}` });
    blocks.push({ type: "table", header: ["確認", "できるようになること", "本人", "指導役"], widths: [700, 6900, 1300, 1300], rows: st.items.map((it) => ["□", it.detail ? `${it.text}\n${it.detail}` : it.text, "", ""]) });
    blocks.push({ type: "p", text: "面談日 ＿＿／＿＿　本人サイン＿＿＿＿＿＿　指導役サイン＿＿＿＿＿＿", size: 18 });
  }
  return buildDocx(blocks);
}

/** 分析（月ごと・年度ごと・理由・時期・指導役）。 */
export function analyticsXlsx(nurseryName, a, reasons) {
  const pct = (r) => (r === null || r === undefined ? "" : Math.round(r * 1000) / 10);
  return buildXlsx([
    { name: "月ごと", title: `退職の集計（${nurseryName}）　月ごと`, note: "退職率（%）＝その月の退職者 ÷ 月初の在籍。アプリに登録した人だけを数えています。", widths: [12, 12, 10, 10, 12], header: ["月", "月初の在籍", "入社", "退職", "退職率(%)"], rows: a.monthly.map((m) => [m.ym, m.headcount, m.joined, m.left, pct(m.rate)]) },
    { name: "年度ごと", title: `退職の集計（${nurseryName}）　年度ごと（4月はじまり）`, note: "退職率（%）＝年度内の退職者 ÷（年度初めの在籍＋年度内の入社）。〜1・3・6か月は、その年度の入社者のうち期間内に辞めた割合。", widths: [10, 12, 10, 10, 12, 12, 12, 12], header: ["年度", "年度初めの在籍", "入社", "退職", "退職率(%)", "〜1か月(%)", "〜3か月(%)", "〜6か月(%)"], rows: a.yearly.map((y) => [y.fy, y.atStart, y.joined, y.left, pct(y.rate), ...y.early.map((w) => pct(w.rate))]) },
    { name: "時期と理由", title: "いつ・なぜ辞めているか", widths: [30, 10], header: ["区分", "人数"], rows: [
      ...Object.entries(a.byStage).map(([k, n]) => [`時期：${k}`, n]),
      ...a.calMonths.map((n, i) => [`辞めた月：${i + 1}月`, n]),
      ...Object.entries(a.byReason).map(([k, n]) => [`理由：${reasons[k] || "理由の記録なし"}`, n]),
    ] },
    { name: "指導役・雇用形態", title: "指導役ごと・雇用形態ごと", widths: [20, 10, 10, 12], header: ["区分", "人数", "退職", "割合(%)"], rows: [
      ...a.byMentor.map((r) => [`指導役：${r.key}`, r.total, r.left, pct(r.total ? r.left / r.total : null)]),
      ...a.byEmployment.map((r) => [`雇用形態：${r.key}`, r.total, r.left, pct(r.total ? r.left / r.total : null)]),
    ] },
  ]);
}
