/* =====================================================================
   Pushing · Christmas Wonderland — game logic
   Theo docs/02-chuc-nang.html và docs/04-quy-tac-du-lieu.html.
   Thời gian chạy theo "đồng hồ game": chỉ tiến khi đang chơi và không
   tạm dừng; mọi sự kiện (chuột hiện, lặn, nghỉ) tính theo đồng hồ này.
   ===================================================================== */
'use strict';

/* ---------- Hằng số (chỉnh tại đây) ---------- */
const THOI_GIAN_LUOT = 30_000;     // ms
const DEM_NGUOC_CHUAN_BI = 3;      // 3-2-1
const MOI_SO_DEM_NGUOC = 600;      // ms cho mỗi số
// Tên chặng chỉ để hiển thị; tốc độ tăng liên tục theo hàm tocDo() bên dưới
const CHANG = [
  { ten: 'Vibing' },
  { ten: 'Locked in fr! 🔒' },
  { ten: 'UNHINGED MODE ❄' },
];

// 3 nhân vật: điểm khi bị đập, tỉ lệ xuất hiện (đầu → cuối lượt), hệ số thời gian hiện
//  - Martin: hiếm và chạy rất nhanh (+3)
//  - Xuka: phổ biến (+1)
//  - Mina: nán lại lâu hơn để "dụ" người chơi; về cuối xuất hiện nhiều hơn (−2)
const NHAN_VAT = {
  martin: { ten: 'Martin', diem: 3,  tiLe: [0.20, 0.16], heSoHien: 0.72 },
  xuka:   { ten: 'Xuka',   diem: 1,  tiLe: [0.58, 0.44], heSoHien: 1.0 },
  mina:   { ten: 'Mina',   diem: -2, tiLe: [0.22, 0.40], heSoHien: 1.3 },
};
// Tốc độ (v2, nhanh hơn): thời gian hiện 950 ms → 380 ms, khoảng nghỉ cũng ngắn dần
const HIEN_DAU = 950, HIEN_CUOI = 380;
const NGHI_DAU = [320, 460], NGHI_CUOI = [70, 150];
// "Dồn dập": sau giây 12, 30% lần nhân vật tiếp theo bật lên gần như ngay lập tức
const DON_DAP_TU = 12_000, DON_DAP_TI_LE = 0.3, DON_DAP_NGHI = [40, 90];
const DO_DAI_CHANG = 10_000;       // ms
const COMBO_HIEN_TU = 3;
const GIAY_CANH_BAO = 5;
const THOI_GIAN_CHOANG = 200;      // ms nhân vật choáng khi bị đập
const KHONG_SINH_KHI_CON = 300;    // ms: không cho chuột mới khi còn ít hơn
const CHO_SAU_HET_GIO = 800;       // ms trước khi sang màn hình kết quả
const HIEN_NHAN_CHANG = 1000;      // ms
const DOC_MOI = 5;                 // giây: chu kỳ cập nhật vùng đọc màn hình
const SO_BONG_TUYET = 55;

const KHOA = {
  kyLuc: 'dapNoel.kyLuc',
  comboKyLuc: 'dapNoel.comboKyLuc',
  amThanh: 'dapNoel.amThanh',
};

/* ---------- Truy cập phần tử ---------- */
const $ = (id) => document.getElementById(id);
const el = {
  manBatDau: $('manBatDau'), manChoi: $('manChoi'), manKetQua: $('manKetQua'),
  btnBatDau: $('btnBatDau'), btnChoiLai: $('btnChoiLai'), btnVeChinh: $('btnVeChinh'),
  btnAmThanh: $('btnAmThanh'), btnTamDung: $('btnTamDung'), btnTiepTuc: $('btnTiepTuc'),
  bdKyLuc: $('bdKyLuc'), bdComboKyLuc: $('bdComboKyLuc'),
  choiDiem: $('choiDiem'), choiThoiGian: $('choiThoiGian'), choiCombo: $('choiCombo'),
  choiKyLuc: $('choiKyLuc'), theCombo: $('theCombo'), theKyLuc: $('theKyLuc'),
  nhanChang: $('nhanChang'), thanhTienTrinh: $('thanhTienTrinh'),
  tenChang: document.querySelectorAll('.ten-chang span'),
  bang: $('bang'), lopPhu: $('lopPhu'), lopPhuChu: $('lopPhuChu'),
  kqDiem: $('kqDiem'), kqKyLucMoi: $('kqKyLucMoi'), kqComboKyLuc: $('kqComboKyLuc'),
  kqSoChuot: $('kqSoChuot'), kqTrung: $('kqTrung'), kqTruot: $('kqTruot'), kqTiLe: $('kqTiLe'),
  kqCombo: $('kqCombo'), kqComboKL: $('kqComboKL'),
  vungDoc: $('vungDoc'), goLoi: $('goLoi'), tuyet: $('tuyet'),
  kqScript: $('kqScript'), kqTieuDe: $('kqTieuDe'), kqDanhHieu: $('kqDanhHieu'), nhayDo: $('nhayDo'),
  mauNhanVat: $('mauNhanVat'),
};

/* ---------- Lưu trữ (localStorage, có bọc lỗi) ---------- */
function docSo(khoa) {
  try {
    const v = localStorage.getItem(khoa);
    return v !== null && /^\d+$/.test(v) ? Number(v) : null;   // không hợp lệ → coi như chưa có
  } catch { return null; }
}
function ghi(khoa, giaTri) {
  try { localStorage.setItem(khoa, String(giaTri)); } catch { /* trình duyệt chặn: bỏ qua */ }
}
function docAmThanh() {
  try { return localStorage.getItem(KHOA.amThanh) === 'bat'; } catch { return false; }
}
const hienSo = (n) => (n === null ? '—' : String(n));

const luu = {
  kyLuc: docSo(KHOA.kyLuc),
  comboKyLuc: docSo(KHOA.comboKyLuc),
  amThanh: docAmThanh(),
};

/* ---------- Trạng thái một lượt ---------- */
let g = taoLuotMoi();
function taoLuotMoi() {
  return {
    trangThai: 'cho',          // cho | chuanBi | dangChoi | hetGio | ketQua
    tamDung: false,
    t: 0,                      // đồng hồ game (ms đã chơi)
    lanCuoi: 0,                // performance.now() ở nhịp trước
    diem: 0, combo: 0, comboDaiNhat: 0,
    trung: 0, truot: 0, chayThoat: 0,
    dem: { martin: 0, xuka: 0, mina: 0 },   // số lần đập trúng từng nhân vật
    dapNham: 0, minaThoat: 0,
    chang: 0,
    chuot: null,               // { o, hienDen, biDap, choangDen }
    sinhLuc: null,             // thời điểm (đồng hồ game) cho con tiếp theo
    oTruoc: -1,
    nhanChangDen: 0,
    lanDocCuoi: 0,
  };
}

/* ---------- Hẹn giờ thật (chỉ dùng cho đếm 3-2-1 và chờ sau hết giờ) ---------- */
let henGio = [];
let vongLap = 0, nhipNen = 0;
function hen(fn, ms) {
  const id = setTimeout(() => { henGio = henGio.filter((x) => x !== id); fn(); }, ms);
  henGio.push(id);
}
function huyTatCa() {
  henGio.forEach(clearTimeout); henGio = [];
  cancelAnimationFrame(vongLap); vongLap = 0;
  clearInterval(nhipNen); nhipNen = 0;
}

/* ---------- Âm thanh (Web Audio, không tải file) ---------- */
let audio = null;
function phat(notes) {
  if (!luu.amThanh) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    let t = audio.currentTime;
    for (const [tanSo, dai, kieu = 'sine'] of notes) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = kieu;
      osc.frequency.setValueAtTime(tanSo, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dai);
      osc.connect(gain).connect(audio.destination);
      osc.start(t); osc.stop(t + dai);
      t += dai * 0.9;
    }
  } catch { /* không hỗ trợ: im lặng */ }
}
const AM = {
  trung:  () => phat([[620, 0.07, 'square'], [380, 0.06, 'square']]),
  sao:    () => phat([[880, 0.06, 'triangle'], [1175, 0.06, 'triangle'], [1568, 0.1, 'triangle']]),
  sai:    () => phat([[180, 0.18, 'sawtooth'], [140, 0.2, 'sawtooth']]),
  chang:  () => phat([[660, 0.09], [880, 0.12]]),
  hetGio: () => phat([[700, 0.15, 'triangle'], [520, 0.15, 'triangle'], [360, 0.3, 'triangle']]),
};
function capNhatNutLoa() {
  el.btnAmThanh.textContent = luu.amThanh ? '🔊' : '🔇';
  el.btnAmThanh.setAttribute('aria-pressed', String(luu.amThanh));
  el.btnAmThanh.setAttribute('aria-label', luu.amThanh ? 'Turn sound off' : 'Turn sound on');
}

/* ---------- Tuyết rơi ---------- */
for (let i = 0; i < SO_BONG_TUYET; i++) {
  const b = document.createElement('span');
  const kt = 2 + Math.random() * 4;
  b.className = 'bong-tuyet';
  b.style.cssText = `left:${Math.random() * 100}%;width:${kt}px;height:${kt}px;` +
    `opacity:${0.25 + Math.random() * 0.45};--troi:${(Math.random() * 60 - 30).toFixed(0)}px;` +
    `animation-duration:${(14 + Math.random() * 12).toFixed(1)}s;animation-delay:-${(Math.random() * 16).toFixed(1)}s`;
  el.tuyet.appendChild(b);
}

/* ---------- Ảnh nhân vật trong bảng luật (màn hình bắt đầu) ---------- */
document.querySelectorAll('[data-anh]').forEach((o) => {
  const anh = el.mauNhanVat.content.querySelector('.nv-' + o.dataset.anh).cloneNode(true);
  anh.className = 'anh-nv';
  o.appendChild(anh);
});

/* ---------- Bảng 3×3 ---------- */
const o = [];
for (let i = 0; i < 9; i++) {
  const nut = document.createElement('button');
  nut.type = 'button';
  nut.className = 'o';
  nut.setAttribute('aria-label', `Hole ${i + 1}`);
  const ho = document.createElement('span'); ho.className = 'ho';
  const matNa = document.createElement('span'); matNa.className = 'mat-na';
  const mau = el.mauNhanVat.content.cloneNode(true);
  const tia = mau.querySelector('.tia-sao');
  matNa.appendChild(mau);
  const vanh = document.createElement('span'); vanh.className = 'vanh';   // viền gỗ phủ tuyết phía trước
  nut.append(ho, matNa, vanh, tia);
  // Chuột/cảm ứng: xử lý ngay khi nhấn xuống cho nhạy
  nut.addEventListener('pointerdown', (e) => { if (e.button === 0) bamO(i); });
  // Bàn phím (Enter/Space) sinh click với detail = 0
  nut.addEventListener('click', (e) => { if (e.detail === 0) bamO(i); });
  el.bang.appendChild(nut);
  o.push(nut);
}
function datNhanO(i) {
  const c = g.chuot;
  o[i].setAttribute('aria-label', c && c.o === i && !c.biDap ? `Hole ${i + 1}, ${NHAN_VAT[c.loai].ten}` : `Hole ${i + 1}`);
}
function donBang() {
  o.forEach((nut, i) => { nut.classList.remove('co-chuot', 'bi-dap', 'rung', 'dap-nham'); delete nut.dataset.loai; datNhanO(i); });
  el.bang.querySelectorAll('.cong-diem').forEach((n) => n.remove());
}
const khoaBang = (khoa) => el.bang.classList.toggle('khoa', khoa);

/* ---------- Chuyển màn hình ---------- */
function hienMan(ten) {
  el.manBatDau.hidden = ten !== 'batDau';
  el.manChoi.hidden = ten !== 'choi';
  el.manKetQua.hidden = ten !== 'ketQua';
  el.btnTamDung.hidden = ten !== 'choi';
}

function veManBatDau() {
  huyTatCa();
  g = taoLuotMoi();
  el.bdKyLuc.textContent = hienSo(luu.kyLuc);
  el.bdComboKyLuc.textContent = hienSo(luu.comboKyLuc);
  hienMan('batDau');
  el.btnBatDau.focus();
  veGoLoi();
}

/* ---------- CN-01: Bắt đầu lượt (đếm 3-2-1) ---------- */
function batDauLuot() {
  huyTatCa();
  g = taoLuotMoi();
  g.trangThai = 'chuanBi';
  donBang();
  khoaBang(true);
  capNhatDiem(false);
  capNhatCombo(false);
  capNhatHud();
  hienMan('choi');
  el.btnTamDung.disabled = true;

  el.btnTiepTuc.hidden = true;
  el.lopPhu.hidden = false;
  datChuLopPhu(String(DEM_NGUOC_CHUAN_BI), true);
  for (let k = 1; k < DEM_NGUOC_CHUAN_BI; k++) {
    hen(() => { datChuLopPhu(String(DEM_NGUOC_CHUAN_BI - k), true); }, k * MOI_SO_DEM_NGUOC);
  }
  hen(batDauChoi, DEM_NGUOC_CHUAN_BI * MOI_SO_DEM_NGUOC);
  veGoLoi();
}

function batDauChoi() {
  g.trangThai = 'dangChoi';
  g.t = 0;
  g.lanCuoi = performance.now();
  g.sinhLuc = ngauNhien(tocDo(0).nghi);
  el.lopPhu.hidden = true;
  el.btnTamDung.disabled = false;
  khoaBang(false);
  // rAF cho mượt; nhịp dự phòng 250ms vì rAF dừng khi tab bị ẩn
  const lap = (now) => { nhip(now); if (g.trangThai === 'dangChoi') vongLap = requestAnimationFrame(lap); };
  vongLap = requestAnimationFrame(lap);
  nhipNen = setInterval(() => nhip(performance.now()), 250);
}

/* ---------- Tạm dừng ---------- */
function datTamDung(dung) {
  if (g.trangThai !== 'dangChoi' || g.tamDung === dung) return;
  g.tamDung = dung;
  g.lanCuoi = performance.now();
  khoaBang(dung);
  datChuLopPhu('Paused. touch grass? 🌱');
  el.btnTiepTuc.hidden = !dung;
  el.lopPhu.hidden = !dung;
  el.btnTamDung.textContent = dung ? '▶' : '⏸';
  el.btnTamDung.setAttribute('aria-label', dung ? 'Resume' : 'Pause');
  if (dung) el.btnTiepTuc.focus();
}

/* ---------- Vòng lặp chính ---------- */
const ngauNhien = ([min, max]) => min + Math.random() * (max - min);
const changTai = (t) => Math.min(CHANG.length - 1, Math.floor(t / DO_DAI_CHANG));
const lerp = (a, b, k) => a + (b - a) * k;
/** Tốc độ tại thời điểm t: càng về cuối càng nhanh (tăng liên tục, không nhảy bậc) */
function tocDo(t) {
  const k = Math.pow(Math.min(1, Math.max(0, t / THOI_GIAN_LUOT)), 1.15);
  return {
    hien: lerp(HIEN_DAU, HIEN_CUOI, k),
    nghi: [lerp(NGHI_DAU[0], NGHI_CUOI[0], k), lerp(NGHI_DAU[1], NGHI_CUOI[1], k)],
  };
}
function chonNhanVat() {
  const k = Math.min(1, Math.max(0, g.t / THOI_GIAN_LUOT));
  const ds = Object.entries(NHAN_VAT).map(([loai, nv]) => [loai, lerp(nv.tiLe[0], nv.tiLe[1], k)]);
  let r = Math.random() * ds.reduce((tong, [, w]) => tong + w, 0);
  for (const [loai, w] of ds) { if ((r -= w) < 0) return loai; }
  return 'xuka';
}
/** Khoảng nghỉ trước nhân vật tiếp theo (có lúc dồn dập về cuối lượt) */
function khoangNghi(t) {
  if (t >= DON_DAP_TU && Math.random() < DON_DAP_TI_LE) return ngauNhien(DON_DAP_NGHI);
  return ngauNhien(tocDo(t).nghi);
}

let fps = 0, demKhung = 0, mocFps = 0;
function nhip(now) {
  if (g.trangThai !== 'dangChoi') return;
  demKhung++;
  if (now - mocFps >= 1000) { fps = demKhung; demKhung = 0; mocFps = now; }

  if (!g.tamDung) g.t += now - g.lanCuoi;
  g.lanCuoi = now;
  if (g.tamDung) { veGoLoi(); return; }

  // CN-06: hết giờ (kể cả khi quay lại từ tab khác sau hơn 30 giây)
  if (g.t >= THOI_GIAN_LUOT) { hetGio(); return; }

  // CN-03: sang chặng mới
  const c = changTai(g.t);
  if (c > g.chang) {
    g.chang = c;
    el.nhanChang.textContent = CHANG[c].ten;
    el.nhanChang.hidden = false;
    g.nhanChangDen = g.t + HIEN_NHAN_CHANG;
    AM.chang();
  }
  if (!el.nhanChang.hidden && g.t >= g.nhanChangDen) el.nhanChang.hidden = true;

  const ch = g.chuot;
  if (ch && !ch.biDap && g.t >= ch.hienDen) {
    chuotChayThoat();
  } else if (ch && ch.biDap && g.t >= ch.choangDen) {
    o[ch.o].classList.remove('bi-dap', 'dap-nham');
    g.chuot = null;
    datNhanO(ch.o);
    g.sinhLuc = g.t + khoangNghi(g.t);
  } else if (!ch && g.sinhLuc !== null && g.t >= g.sinhLuc) {
    sinhChuot();
  }

  capNhatHud();

  // Vùng đọc màn hình: mỗi 5 giây
  const moc = Math.floor(g.t / 1000 / DOC_MOI);
  if (moc > g.lanDocCuoi) {
    g.lanDocCuoi = moc;
    el.vungDoc.textContent = `Score ${g.diem}, ${Math.ceil((THOI_GIAN_LUOT - g.t) / 1000)} seconds left`;
  }
  veGoLoi();
}

/* ---------- CN-02: Chuột xuất hiện ---------- */
function sinhChuot() {
  g.sinhLuc = null;
  if (THOI_GIAN_LUOT - g.t < KHONG_SINH_KHI_CON) return;
  const loai = chonNhanVat();
  const hien = tocDo(g.t).hien * NHAN_VAT[loai].heSoHien;   // tốc độ tính lúc xuất hiện
  const ung = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => i !== g.oTruoc);
  const i = ung[Math.floor(Math.random() * ung.length)];
  g.oTruoc = i;
  g.chuot = { o: i, loai, hienDen: g.t + hien, biDap: false, choangDen: 0 };
  o[i].dataset.loai = loai;
  o[i].classList.add('co-chuot');
  datNhanO(i);
}

function chuotChayThoat() {
  const c = g.chuot;
  if (c.loai === 'mina') {
    g.minaThoat++;                                 // để Mina đi là đúng: không mất combo
  } else {
    g.chayThoat++;
    g.combo = 0;
    capNhatCombo(false);
  }
  o[c.o].classList.remove('co-chuot');
  g.chuot = null;
  datNhanO(c.o);
  g.sinhLuc = g.t + khoangNghi(g.t);
}

/* ---------- CN-04 / CN-05: Đập, điểm, combo ---------- */
function bamO(i) {
  if (g.trangThai !== 'dangChoi' || g.tamDung) return;   // đếm 3-2-1, tạm dừng, hết giờ: không tính
  const c = g.chuot;

  if (c && c.o === i) {
    if (c.biDap) return;                                   // bấm lại con đang choáng: không cộng
    c.biDap = true;
    c.choangDen = g.t + THOI_GIAN_CHOANG;
    const diem = NHAN_VAT[c.loai].diem;
    g.diem = Math.max(0, g.diem + diem);           // điểm không bao giờ âm
    if (diem > 0) {
      g.trung++; g.combo++;
      g.dem[c.loai]++;
      g.comboDaiNhat = Math.max(g.comboDaiNhat, g.combo);
      (diem >= 3 ? AM.sao : AM.trung)();
    } else {
      g.dapNham++; g.dem.mina++;
      g.combo = 0;                                 // đập nhầm Mina: mất combo
      AM.sai();
    }
    capNhatDiem(true);
    capNhatCombo(diem > 0);
    hieuUngDap(i, c.loai, diem);

    o[i].classList.remove('co-chuot');
    o[i].classList.add('bi-dap');
    if (diem < 0) { o[i].classList.remove('dap-nham'); void o[i].offsetWidth; o[i].classList.add('dap-nham'); }
    datNhanO(i);
    const cong = document.createElement('span');
    cong.className = 'cong-diem' + (diem < 0 ? ' am' : diem >= 3 ? ' lon' : '');
    cong.textContent = `${chon(CHU_DAP[c.loai])} ${diem > 0 ? '+' : '−'}${Math.abs(diem)}`;
    cong.setAttribute('aria-hidden', 'true');
    o[i].appendChild(cong);
    setTimeout(() => cong.remove(), 750);
    return;
  }

  // Trượt: không trừ điểm, combo về 0, hố rung nhẹ
  g.truot++;
  g.combo = 0;
  capNhatCombo(false);
  o[i].classList.remove('rung');
  void o[i].offsetWidth;
  o[i].classList.add('rung');
  const r = o[i].getBoundingClientRect();
  HU.no(r.left + r.width / 2, r.top + r.height * 0.75, { tuyet: 8, sao: 0, giay: 0, luc: 0.6 });
}

/* ---------- Cập nhật giao diện ---------- */
function nay(node) { node.classList.remove('nay'); void node.offsetWidth; node.classList.add('nay'); }

function capNhatHud() {
  const conLai = Math.max(0, THOI_GIAN_LUOT - g.t);
  const giay = Math.ceil(conLai / 1000);
  el.choiThoiGian.textContent = String(giay);
  const thap = g.trangThai === 'dangChoi' && conLai > 0 && giay <= GIAY_CANH_BAO;
  el.choiThoiGian.classList.toggle('thap', thap);
  el.thanhTienTrinh.classList.toggle('thap', thap);
  el.thanhTienTrinh.style.transform = `scaleX(${conLai / THOI_GIAN_LUOT})`;
  const c = changTai(Math.min(g.t, THOI_GIAN_LUOT - 1));
  el.tenChang.forEach((s) => s.classList.toggle('dang', Number(s.dataset.chang) === c));
}

function capNhatDiem(hieuUng) {
  el.choiDiem.textContent = String(g.diem);
  if (hieuUng) nay(el.choiDiem);
  const dangPha = g.diem > 0 && (luu.kyLuc === null || g.diem > luu.kyLuc);
  el.choiKyLuc.textContent = dangPha ? String(g.diem) : hienSo(luu.kyLuc);
  el.theKyLuc.classList.toggle('dang-pha', dangPha);
}

function capNhatCombo(tang) {
  el.choiCombo.textContent = g.combo >= COMBO_HIEN_TU ? `x${g.combo}` : String(g.combo);
  el.theCombo.classList.toggle('nong', g.combo >= COMBO_HIEN_TU);
  if (tang && g.combo >= COMBO_HIEN_TU) nay(el.choiCombo);
}

/* ---------- Kết thúc lượt ---------- */
function hetGio() {
  if (g.trangThai !== 'dangChoi') return;
  huyTatCa();
  g.trangThai = 'hetGio';
  g.t = THOI_GIAN_LUOT;
  g.chuot = null;                                // con đang hiện lúc hết giờ không tính
  donBang();
  khoaBang(true);
  capNhatHud();
  el.nhanChang.hidden = true;
  el.btnTamDung.disabled = true;
  el.btnTiepTuc.hidden = true;
  datChuLopPhu("THAT'S A WRAP! 🎬", true);
  HU.phaoHoa();
  el.lopPhu.hidden = false;
  AM.hetGio();
  veGoLoi();
  hen(hienKetQua, CHO_SAU_HET_GIO);
}

/* ---------- CN-07 / CN-08: Kết quả, kỷ lục ---------- */
function hienKetQua() {
  huyTatCa();
  g.trangThai = 'ketQua';
  el.lopPhu.hidden = true;

  const soChuot = g.trung + g.chayThoat;
  const kyLucMoi = g.diem > 0 && (luu.kyLuc === null || g.diem > luu.kyLuc);
  const comboMoi = g.comboDaiNhat > 0 && (luu.comboKyLuc === null || g.comboDaiNhat > luu.comboKyLuc);

  if (luu.kyLuc === null || g.diem > luu.kyLuc) { luu.kyLuc = g.diem; ghi(KHOA.kyLuc, g.diem); }
  if (luu.comboKyLuc === null || g.comboDaiNhat > luu.comboKyLuc) {
    luu.comboKyLuc = g.comboDaiNhat; ghi(KHOA.comboKyLuc, g.comboDaiNhat);
  }

  el.kqDiem.textContent = String(g.diem);
  const dh = danhHieu(g.diem, g.dapNham);
  el.kqScript.textContent = dh.script;
  el.kqTieuDe.textContent = dh.tieuDe;
  el.kqDanhHieu.textContent = dh.dong;
  el.kqKyLucMoi.hidden = !kyLucMoi;
  if (kyLucMoi) setTimeout(() => HU.mua(140), 150);
  el.kqComboKyLuc.hidden = !comboMoi;
  el.kqSoChuot.textContent = String(g.dem.martin);
  el.kqTrung.textContent = String(g.dem.xuka);
  el.kqTruot.textContent = String(g.dapNham);
  el.kqTiLe.textContent = soChuot === 0 ? '—' : `${Math.round((g.trung / soChuot) * 100)}%`;
  el.kqCombo.textContent = String(g.comboDaiNhat);
  el.kqComboKL.textContent = hienSo(luu.comboKyLuc);

  hienMan('ketQua');
  el.vungDoc.textContent = `Time's up. You scored ${g.diem} points.`;
  el.btnChoiLai.focus();
  veGoLoi();
}

/* ---------- Bảng gỡ lỗi (phím D hoặc ?debug=1) ---------- */
let batGoLoi = new URLSearchParams(location.search).has('debug');
function veGoLoi() {
  el.goLoi.hidden = !batGoLoi;
  if (!batGoLoi) return;
  const c = g.chuot;
  const tenTT = { cho: 'idle', chuanBi: 'countdown', dangChoi: g.tamDung ? 'paused' : 'playing', hetGio: 'timeup', ketQua: 'result' }[g.trangThai];
  const ch = changTai(Math.min(g.t, THOI_GIAN_LUOT - 1));
  el.goLoi.textContent =
    `state:      ${tenTT}\n` +
    `played:     ${(g.t / 1000).toFixed(2)}s\n` +
    `phase:      ${ch + 1} · ${CHANG[ch].ten.replace('!', '')}\n` +
    `on board:   ${c ? `${NHAN_VAT[c.loai].ten} hole ${c.o + 1} (${c.biDap ? 'hit' : ((c.hienDen - g.t) / 1000).toFixed(2) + 's'})` : '—'}\n` +
    `speed:      up ${Math.round(tocDo(g.t).hien)}ms\n` +
    `last hole:  ${g.oTruoc < 0 ? '—' : g.oTruoc + 1}\n` +
    `score/combo:${g.diem} / ${g.combo}\n` +
    `FPS:        ${fps}`;
}

/* =====================================================================
   Gen Z copy + hiệu ứng hạt (tuyết, lấp lánh, giấy màu, than) — vẽ trên 1 canvas
   ===================================================================== */
const chon = (ds) => ds[Math.floor(Math.random() * ds.length)];
const CHU_DAP = {
  martin: ['BONK!', 'BONKED', 'MAIN CHAR', 'SHEESH'],
  xuka:   ['boop!', 'snoot booped', 'good boy', 'pspsps'],
  mina:   ['NAUGHTY!', 'COAL 🪨', 'caught 📝', 'NOT HER'],
};
const HO_COMBO = {
  5: 'x5 · ATE THAT 💅', 10: 'x10 · SLAYYY 🔥', 15: 'x15 · UNREAL 😮‍💨', 20: "x20 · SANTA'S FAVE 🎅",
};
function datChuLopPhu(chu, nay) {
  el.lopPhuChu.textContent = chu;
  if (nay) { el.lopPhuChu.classList.remove('dem'); void el.lopPhuChu.offsetWidth; el.lopPhuChu.classList.add('dem'); }
}
function hoTo(chu) {
  const n = document.createElement('div');
  n.className = 'hu-het';
  n.textContent = chu;
  n.setAttribute('aria-hidden', 'true');
  el.bang.parentElement.appendChild(n);
  setTimeout(() => n.remove(), 1150);
}
function danhHieu(diem, nham) {
  let r;
  if (diem >= 45) r = { script: 'Purrr', tieuDe: "SANTA'S FAVE 🎅", dong: "It's giving main character. No crumbs left 💅" };
  else if (diem >= 30) r = { script: 'Slay', tieuDe: 'ELF-TIER SLAY ✨', dong: 'Ate that. The North Pole is shook.' };
  else if (diem >= 18) r = { script: 'Not bad', tieuDe: 'MID BUT MERRY 🎄', dong: 'Solid vibes, bestie. Run it back for the PB.' };
  else if (diem >= 8) r = { script: 'Hmm', tieuDe: 'LOWKEY LOCKED IN', dong: 'The vibes were there. The aim? Debatable.' };
  else r = { script: 'Santa saw that', tieuDe: 'COAL ERA 🪨', dong: 'Respectfully… run it back.' };
  if (nham >= 3) r.dong = `You touched Mina ${nham} times. Naughty list speedrun any% 📝`;
  return r;
}

function hieuUngDap(i, loai, diem) {
  const r = o[i].getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height * 0.42;
  if (loai === 'martin') {
    HU.no(x, y, { tuyet: 30, sao: 26, giay: 18, luc: 1.35 });
  } else if (loai === 'xuka') {
    HU.no(x, y, { tuyet: 26, sao: 10, giay: 6, luc: 1 });
  } else {
    HU.no(x, y, { tuyet: 10, sao: 0, giay: 0, than: 18, luc: 1.1 });
    document.body.classList.remove('rung-man'); void document.body.offsetWidth; document.body.classList.add('rung-man');
    el.nhayDo.classList.remove('bat'); void el.nhayDo.offsetWidth; el.nhayDo.classList.add('bat');
  }
  if (diem > 0 && g.combo >= 5 && g.combo % 5 === 0) {
    hoTo(HO_COMBO[g.combo] || `x${g.combo} · ICONIC 👑`);
    HU.mua(70);
  }
}

const HU = (() => {
  const cv = $('hieuUng');
  const ctx = cv.getContext('2d');
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAU_GIAY = ['#d9b56d', '#f0d595', '#d0323d', '#f9f2e8', '#1f6b4f', '#ffffff'];
  let ds = [], chay = 0, tr = 0, W = 0, H = 0;
  function coGian() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  coGian();
  addEventListener('resize', coGian);
  const nn = (a, b) => a + Math.random() * (b - a);
  function them(x, y, kieu, luc, tuTren) {
    const goc = tuTren ? nn(Math.PI * 0.35, Math.PI * 0.65) : nn(-Math.PI * 0.95, -Math.PI * 0.05);
    const v = tuTren ? nn(1, 3) : nn(3, 9) * luc;
    ds.push({
      x, y, vx: Math.cos(goc) * v * (tuTren ? 0.4 : 1), vy: Math.sin(goc) * v,
      g: kieu === 'giay' ? 0.12 : kieu === 'than' ? 0.32 : 0.16,
      keo: kieu === 'giay' ? 0.985 : 0.975,
      song: 0, tho: tuTren ? nn(2.4, 3.6) : nn(0.7, 1.4),
      r: kieu === 'sao' ? nn(4, 8) : kieu === 'giay' ? nn(4, 8) : kieu === 'than' ? nn(3, 6) : nn(4, 9),
      quay: nn(0, Math.PI * 2), vq: nn(-0.25, 0.25), kieu,
      mau: kieu === 'giay' ? MAU_GIAY[Math.floor(Math.random() * MAU_GIAY.length)] : kieu === 'sao' ? (Math.random() < 0.6 ? '#f0d595' : '#ffffff') : kieu === 'than' ? (Math.random() < 0.7 ? '#1c1414' : '#d0323d') : (Math.random() < 0.5 ? '#ffffff' : '#bfe3f5'),
    });
  }
  function batDau() { if (!chay) { tr = performance.now(); chay = requestAnimationFrame(ve); } }
  function veTuyet(p) {
    // viền bóng đỏ đậm để bông tuyết vẫn nổi trên sàn tuyết trắng
    ctx.shadowColor = 'rgba(94,15,23,.7)'; ctx.shadowBlur = 4;
    ctx.strokeStyle = p.mau; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = p.quay + k * Math.PI / 3;
      ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(a) * p.r, p.y + Math.sin(a) * p.r);
    }
    ctx.stroke();
    ctx.fillStyle = p.mau; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  function veSao(p) {
    const r = p.r, r2 = r * 0.28;
    ctx.fillStyle = p.mau; ctx.shadowColor = p.mau; ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = p.quay + k * Math.PI / 4, rr = k % 2 ? r2 : r;
      ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  }
  function ve(now) {
    const dt = Math.min(0.05, (now - tr) / 1000); tr = now;
    ctx.clearRect(0, 0, W, H);
    ds = ds.filter((p) => (p.song += dt) < p.tho && p.y < H + 40);
    for (const p of ds) {
      p.vx *= p.keo; p.vy = p.vy * p.keo + p.g * dt * 60;
      p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.quay += p.vq;
      ctx.globalAlpha = Math.max(0, 1 - (p.song / p.tho) ** 2);
      if (p.kieu === 'tuyet') veTuyet(p);
      else if (p.kieu === 'sao') veSao(p);
      else if (p.kieu === 'giay') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.quay);
        ctx.fillStyle = p.mau; ctx.fillRect(-p.r / 2, -p.r / 4 * (1 + Math.sin(p.song * 12)), p.r, p.r / 2 * (1 + Math.sin(p.song * 12)) + 1);
        ctx.restore();
      } else { ctx.fillStyle = p.mau; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    chay = ds.length ? requestAnimationFrame(ve) : 0;
    if (!ds.length) ctx.clearRect(0, 0, W, H);
  }
  return {
    /** Nổ hạt tại (x, y) */
    no(x, y, { tuyet = 20, sao = 8, giay = 0, than = 0, luc = 1 } = {}) {
      const k = giam ? 0.25 : 1;
      for (let n = 0; n < tuyet * k; n++) them(x, y, 'tuyet', luc);
      for (let n = 0; n < sao * k; n++) them(x, y, 'sao', luc * 1.1);
      for (let n = 0; n < giay * k; n++) them(x, y, 'giay', luc);
      for (let n = 0; n < than * k; n++) them(x, y, 'than', luc * 0.9);
      batDau();
    },
    /** Mưa giấy màu từ mép trên */
    mua(n = 80) {
      if (giam) return;
      for (let k = 0; k < n; k++) them(nn(0, W), nn(-80, -10), Math.random() < 0.8 ? 'giay' : 'sao', 1, true);
      batDau();
    },
    /** Pháo giấy hai bên khi hết giờ */
    phaoHoa() {
      if (giam) return;
      for (const [x, huong] of [[0, 1], [W, -1]]) {
        for (let k = 0; k < 45; k++) {
          ds.push({ x, y: H * 0.75, vx: huong * nn(4, 11), vy: -nn(8, 15), g: 0.22, keo: 0.985, song: 0, tho: nn(1.4, 2.4), r: nn(4, 8),
            quay: nn(0, 6), vq: nn(-0.3, 0.3), kieu: Math.random() < 0.75 ? 'giay' : 'sao', mau: MAU_GIAY[k % MAU_GIAY.length] });
        }
      }
      batDau();
    },
  };
})();

/* ---------- Sự kiện ---------- */
el.btnBatDau.addEventListener('click', batDauLuot);
el.btnChoiLai.addEventListener('click', batDauLuot);
el.btnVeChinh.addEventListener('click', veManBatDau);
el.btnTamDung.addEventListener('click', () => datTamDung(!g.tamDung));
el.btnTiepTuc.addEventListener('click', () => datTamDung(false));
el.btnAmThanh.addEventListener('click', () => {
  luu.amThanh = !luu.amThanh;
  try { localStorage.setItem(KHOA.amThanh, luu.amThanh ? 'bat' : 'tat'); } catch { /* bỏ qua */ }
  capNhatNutLoa();
  if (luu.amThanh) AM.trung();                  // tạo AudioContext trong cú bấm của người dùng
});

document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'd' && !e.ctrlKey && !e.metaKey) { batGoLoi = !batGoLoi; veGoLoi(); return; }
  if ((k === 'p' || k === 'escape') && g.trangThai === 'dangChoi') { datTamDung(!g.tamDung); return; }
  if (e.key !== 'Enter' && e.key !== ' ') return;
  if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
  if (g.trangThai === 'cho' || g.trangThai === 'ketQua') { e.preventDefault(); batDauLuot(); }
});

// Quay lại tab: tính lại ngay (đồng hồ vẫn chạy khi tab ẩn, trừ khi đang tạm dừng)
document.addEventListener('visibilitychange', () => { if (!document.hidden) nhip(performance.now()); });

/* ---------- Khởi động ---------- */
capNhatNutLoa();
veManBatDau();
