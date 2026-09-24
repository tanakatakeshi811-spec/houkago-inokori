/* 「放課後の居残り」公式サイトのキャラ図鑑データ(site/js/characters-data.js)を
   ゲーム本体(index.html)のSTU配列から再生成するツール。
   実行: node site/tools/gen-characters.js  (HoukagoInokoriリポジトリのルートから)
   先生側(KINDS/TCH)は今まで通り手動更新のスコープ外(このスクリプトは生徒(STU)側だけを
   再生成し、既存の先生エントリはそのまま残す)。新しい生徒を追加/改名するたびに
   このスクリプトを再実行してcharacters-data.jsを最新化する運用にする(2026-09-25追加)。 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const INDEX_HTML = path.join(ROOT, 'index.html');
const DATA_JS = path.join(ROOT, 'site', 'js', 'characters-data.js');

function extractBalanced(src, startIdx) {
  // startIdx points at the opening bracket ('[' or '{')
  const open = src[startIdx];
  const close = open === '[' ? ']' : '}';
  let depth = 0, inStr = null, esc = false;
  for (let i = startIdx; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) { esc = false; }
      else if (c === '\\') { esc = true; }
      else if (c === inStr) { inStr = null; }
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return src.slice(startIdx, i + 1); }
  }
  throw new Error('unbalanced brackets from index ' + startIdx);
}

function extractArrayLiteral(src, constName) {
  const marker = 'const ' + constName + '=';
  const at = src.indexOf(marker);
  if (at < 0) throw new Error('could not find ' + marker);
  const bracketStart = at + marker.length;
  const code = extractBalanced(src, bracketStart);
  return new Function('return ' + code)();
}

function hex(n) { return '#' + (n >>> 0).toString(16).padStart(6, '0'); }

function splitLabelText(s) {
  if (!s) return { label: '', text: '' };
  const i = s.indexOf('｜');
  if (i < 0) return { label: '', text: s };
  return { label: s.slice(0, i), text: s.slice(i + 1) };
}

function buildStudentEntries(STU) {
  return STU.map(function (C, i) {
    const p = splitLabelText(C.ptxt);
    const abilities = [{ label: p.label, text: p.text, kind: 'passive' }];
    if (C.skill) {
      const a = { label: C.sname || '', text: C.stxt || '', kind: 'active' };
      if (C.cd) a.cd = C.cd;
      if (C.uses !== undefined) a.uses = C.uses;
      abilities.push(a);
    }
    return {
      id: 'stu_' + i + '_' + C.short,
      side: 'student',
      name: C.name,
      short: C.short,
      tagline: p.text || p.label,
      color: hex(C.uniform),
      hair: hex(C.hair),
      abilities: abilities
    };
  });
}

function main() {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const STU = extractArrayLiteral(html, 'STU');

  const dataSrc = fs.readFileSync(DATA_JS, 'utf8');
  const arrAt = dataSrc.indexOf('[');
  const header = dataSrc.slice(0, arrAt);
  const arrLiteral = extractBalanced(dataSrc, arrAt);
  const CHARACTERS = new Function('return ' + arrLiteral)();

  const teachers = CHARACTERS.filter(function (c) { return c.side !== 'student'; });
  const students = buildStudentEntries(STU);
  const merged = teachers.concat(students);

  const finalOut = header + JSON.stringify(merged, null, 1) + ';\n';
  fs.writeFileSync(DATA_JS, finalOut, 'utf8');
  console.log('teachers kept:', teachers.length, ' students regenerated:', students.length, ' total:', merged.length);
}

main();
