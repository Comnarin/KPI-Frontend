import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Employee, SalaryAdjustment } from '@/shared/types';

// ─── helpers ────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('th-TH').format(n);
}
function thaiDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
function scoreColor(score: number) {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#3b82f6';
  if (score >= 70) return '#eab308';
  if (score >= 60) return '#f97316';
  return '#ef4444';
}
function ratingLabel(score: number) {
  if (score >= 90) return 'ดีเยี่ยม';
  if (score >= 80) return 'เกินเป้า';
  if (score >= 70) return 'ได้เป้า';
  if (score >= 60) return 'ต้องปรับปรุง';
  return 'ไม่ผ่านเกณฑ์';
}

// ─── Build the HTML string that will become the PDF ─────────────
function buildHTML(emp: Employee, adj: SalaryAdjustment): string {
  const sc = scoreColor(adj.kpiScore);
  const rl = ratingLabel(adj.kpiScore);
  const increase = adj.recommendedSalary - adj.currentSalary;
  const docNo = `ADJ-${adj.id.slice(-6).toUpperCase()}`;

  return `
  <!DOCTYPE html>
  <html lang="th">
  <head>
    <meta charset="UTF-8"/>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Sarabun',sans-serif;background:#fff;color:#1a1a2e;width:794px;min-height:1123px;padding:0}
      /* HEADER */
      .header{background:linear-gradient(135deg,#4c1d95,#1d4ed8);padding:28px 40px;display:flex;align-items:center;justify-content:space-between}
      .header-logo{display:flex;align-items:center;gap:12px}
      .logo-box{width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px}
      .header-title{color:#fff}
      .header-title h1{font-size:20px;font-weight:700;margin-bottom:2px}
      .header-title p{font-size:11px;color:rgba(255,255,255,0.75)}
      .header-badge{text-align:right}
      .approved-badge{background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);border-radius:20px;color:#fff;font-size:11px;padding:5px 14px;display:inline-flex;align-items:center;gap:6px}
      /* META BAR */
      .meta-bar{background:#f8f7ff;border-bottom:1px solid #e5e2f5;padding:10px 40px;display:flex;gap:32px;font-size:11px;color:#6b5f9a}
      .meta-bar span b{color:#2d1f6e}
      /* BODY */
      .body{padding:24px 40px}
      /* SECTION */
      .section-title{display:flex;align-items:center;gap:8px;margin-bottom:12px;margin-top:20px}
      .section-dot{width:10px;height:10px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);flex-shrink:0}
      .section-title h2{font-size:13px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.08em}
      /* EMP TABLE */
      .emp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px}
      .emp-cell{background:#f8f7ff;border:1px solid #e5e2f5;border-radius:8px;padding:10px 14px}
      .emp-cell .lbl{font-size:10px;color:#9b8bc0;margin-bottom:3px}
      .emp-cell .val{font-size:13px;font-weight:600;color:#1a1a2e}
      /* KPI SCORE */
      .kpi-row{display:flex;align-items:center;gap:20px;background:#f8f7ff;border:1px solid #e5e2f5;border-radius:10px;padding:16px 20px}
      .score-circle{width:72px;height:72px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;border:3px solid ${sc}}
      .score-circle .num{font-size:24px;font-weight:800;color:${sc};line-height:1}
      .score-circle .out{font-size:9px;color:#9b8bc0;margin-top:2px}
      .kpi-info h3{font-size:18px;font-weight:800;color:${sc};margin-bottom:4px}
      .kpi-info p{font-size:11px;color:#6b5f9a}
      .rating-badge{display:inline-block;background:${sc}20;border:1px solid ${sc}50;border-radius:12px;color:${sc};font-size:11px;font-weight:600;padding:3px 12px;margin-bottom:6px}
      /* TABLE */
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:linear-gradient(135deg,#4c1d95,#1d4ed8);color:#fff;padding:9px 12px;text-align:left;font-weight:600;font-size:11px}
      th:last-child{text-align:right}
      td{padding:9px 12px;border-bottom:1px solid #eeeaf8;color:#1a1a2e}
      td:last-child{text-align:right;font-weight:700}
      tr:nth-child(even) td{background:#f8f7ff}
      tr.total td{background:#ede9fe;font-weight:700;color:#4c1d95}
      /* COMPARE */
      .compare{display:flex;align-items:stretch;gap:0;border-radius:12px;overflow:hidden;border:1px solid #e5e2f5;margin-top:4px}
      .compare-box{flex:1;padding:18px 20px}
      .compare-box .lbl{font-size:10px;color:#9b8bc0;margin-bottom:6px}
      .compare-box .amount{font-size:22px;font-weight:800}
      .compare-box .sub{font-size:10px;margin-top:4px}
      .compare-old{background:#f8f7ff}
      .compare-old .amount{color:#4c1d95}
      .compare-arrow{width:48px;background:#ede9fe;display:flex;align-items:center;justify-content:center;font-size:22px;color:#7c3aed;flex-shrink:0}
      .compare-new{background:#ecfdf5}
      .compare-new .amount{color:#059669}
      .compare-new .sub{color:#059669}
      /* ADJUSTMENT */
      .adj-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
      .adj-cell{background:#f8f7ff;border:1px solid #e5e2f5;border-radius:8px;padding:10px;text-align:center}
      .adj-cell .pct{font-size:16px;font-weight:800;color:#4c1d95;margin-bottom:3px}
      .adj-cell .lbl{font-size:10px;color:#9b8bc0}
      .adj-total{background:linear-gradient(135deg,#ede9fe,#dbeafe);border:1px solid #c4b5fd;border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-top:8px}
      .adj-total .lbl{font-size:11px;color:#5b21b6;font-weight:600}
      .adj-total .pct{font-size:18px;font-weight:800;color:#4c1d95}
      /* SIGNATURES */
      .sig-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:4px}
      .sig-box{border:1px solid #e5e2f5;border-radius:10px;padding:16px 14px;text-align:center;background:#fafafa}
      .sig-role{font-size:10px;color:#9b8bc0;margin-bottom:20px}
      .sig-line{border-bottom:1px solid #c4b5fd;margin:0 10px 6px}
      .sig-name{font-size:11px;font-weight:600;color:#1a1a2e;margin-bottom:2px}
      .sig-title{font-size:9.5px;color:#9b8bc0;margin-bottom:6px}
      .sig-date{font-size:9px;color:#c4b5fd}
      /* FOOTER */
      .footer{background:linear-gradient(135deg,#4c1d95,#1d4ed8);padding:10px 40px;display:flex;justify-content:space-between;align-items:center;margin-top:28px}
      .footer p{color:rgba(255,255,255,0.7);font-size:9px}
      hr.divider{border:none;border-top:1px solid #e5e2f5;margin:16px 0 0}
    </style>
  </head>
  <body>

  <!-- HEADER -->
  <div class="header">
    <div class="header-logo">
      <div class="logo-box">📊</div>
      <div class="header-title">
        <h1>KPI Manager</h1>
        <p>เอกสารอนุมัติการปรับเงินเดือน · Salary Adjustment Approval</p>
      </div>
    </div>
    <div class="header-badge">
      <div class="approved-badge">✓ อนุมัติแล้ว</div>
    </div>
  </div>

  <!-- META BAR -->
  <div class="meta-bar">
    <span>เลขที่เอกสาร: <b>${docNo}</b></span>
    <span>รอบประเมิน: <b>${adj.period}</b></span>
    <span>วันที่ออกเอกสาร: <b>${thaiDate(adj.createdAt)}</b></span>
    <span>ชื่อไฟล์: <b>salary-approval-${emp.code}-${adj.period}.pdf</b></span>
  </div>

  <!-- BODY -->
  <div class="body">

    <!-- ข้อมูลพนักงาน -->
    <div class="section-title"><div class="section-dot"></div><h2>ข้อมูลพนักงาน</h2></div>
    <div class="emp-grid">
      <div class="emp-cell"><div class="lbl">ชื่อ-นามสกุล</div><div class="val">${emp.firstName} ${emp.lastName}</div></div>
      <div class="emp-cell"><div class="lbl">รหัสพนักงาน</div><div class="val">${emp.code}</div></div>
      <div class="emp-cell"><div class="lbl">แผนก</div><div class="val">${emp.department}</div></div>
      <div class="emp-cell"><div class="lbl">ตำแหน่ง</div><div class="val">${emp.position}</div></div>
      <div class="emp-cell"><div class="lbl">อายุงาน</div><div class="val">${emp.yearsOfService} ปี</div></div>
      <div class="emp-cell"><div class="lbl">วันที่เริ่มงาน</div><div class="val">${thaiDate(emp.startDate)}</div></div>
    </div>

    <!-- ผล KPI -->
    <div class="section-title" style="margin-top:18px"><div class="section-dot"></div><h2>ผลการประเมิน KPI</h2></div>
    <div class="kpi-row">
      <div class="score-circle">
        <div class="num">${adj.kpiScore}</div>
        <div class="out">จาก 100</div>
      </div>
      <div class="kpi-info">
        <div class="rating-badge">${rl}</div>
        <h3>${adj.kpiScore} คะแนน</h3>
        <p>รอบการประเมิน: ${adj.period} &nbsp;|&nbsp; Merit Increase ที่ได้รับ: <b>+${adj.meritPercent}%</b></p>
      </div>
    </div>

    <!-- โครงสร้างเงินเดือน 3P -->
    <div class="section-title" style="margin-top:18px"><div class="section-dot"></div><h2>โครงสร้างเงินเดือน (โมเดล 3P)</h2></div>
    <table>
      <thead>
        <tr>
          <th>ส่วนประกอบ</th>
          <th>คำอธิบาย</th>
          <th>จำนวน (บาท)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>P1 — เงินเดือนตามตำแหน่ง</td><td>ฐานเงินเดือนตามระดับตำแหน่ง</td><td>฿${fmt(emp.baseSalary)}</td></tr>
        <tr><td>P2 — ค่าความสามารถส่วนบุคคล</td><td>ประสบการณ์ + ทักษะพิเศษ</td><td>฿${fmt(emp.personalCapacity)}</td></tr>
        <tr><td>P3 — ผลการปฏิบัติงาน (KPI)</td><td>คะแนน ${adj.kpiScore}/100 × ฐาน ฿${fmt(emp.variablePayBase)}</td><td>฿${fmt(adj.p3Amount)}</td></tr>
        <tr class="total"><td colspan="2"><b>รวมเงินเดือนทั้งหมด (P1 + P2 + P3)</b></td><td>฿${fmt(adj.currentSalary + adj.p3Amount)}</td></tr>
      </tbody>
    </table>

    <!-- การปรับเงินเดือน -->
    <div class="section-title" style="margin-top:18px"><div class="section-dot"></div><h2>สรุปการปรับเงินเดือนประจำปี</h2></div>
    <div class="adj-grid">
      <div class="adj-cell"><div class="pct">+${adj.meritPercent}%</div><div class="lbl">Merit Pay (KPI)</div></div>
      <div class="adj-cell"><div class="pct">+${adj.tenureBonus.toFixed(1)}%</div><div class="lbl">อายุงาน</div></div>
      <div class="adj-cell"><div class="pct">+${adj.marketCorrection}%</div><div class="lbl">ปรับตามตลาด</div></div>
      <div class="adj-cell"><div class="pct">+${adj.costOfLiving}%</div><div class="lbl">ค่าครองชีพ</div></div>
    </div>
    <div class="adj-total">
      <span class="lbl">รวมการปรับเงินเดือนทั้งหมด</span>
      <span class="pct">+${adj.totalAdjustmentPercent.toFixed(1)}%</span>
    </div>

    <!-- เปรียบเทียบเงินเดือน -->
    <div class="section-title" style="margin-top:18px"><div class="section-dot"></div><h2>เปรียบเทียบเงินเดือน</h2></div>
    <div class="compare">
      <div class="compare-box compare-old">
        <div class="lbl">เงินเดือนปัจจุบัน (P1+P2)</div>
        <div class="amount">฿${fmt(adj.currentSalary)}</div>
        <div class="sub" style="color:#9b8bc0">ก่อนปรับ</div>
      </div>
      <div class="compare-arrow">→</div>
      <div class="compare-box compare-new">
        <div class="lbl">เงินเดือนใหม่ที่แนะนำ</div>
        <div class="amount">฿${fmt(adj.recommendedSalary)}</div>
        <div class="sub">+฿${fmt(increase)} (+${adj.totalAdjustmentPercent.toFixed(1)}%)</div>
      </div>
    </div>

    <!-- ลายเซ็น -->
    <div class="section-title" style="margin-top:20px"><div class="section-dot"></div><h2>ลงนามผู้มีอำนาจอนุมัติ</h2></div>
    <div class="sig-row">
      ${[
        ['ผู้จัดทำเอกสาร', 'HR Officer / ฝ่ายทรัพยากรบุคคล'],
        ['ผู้จัดการโดยตรง', 'Direct Manager'],
        ['ผู้อนุมัติสูงสุด', 'Director / CEO'],
      ].map(([name, title]) => `
        <div class="sig-box">
          <div class="sig-role">${title}</div>
          <div class="sig-line"></div>
          <div class="sig-name">${name}</div>
          <div class="sig-date">วันที่: ................................</div>
        </div>
      `).join('')}
    </div>

  </div><!-- end body -->

  <!-- FOOTER -->
  <div class="footer">
    <p>KPI Manager · ระบบประเมินผลการปฏิบัติงานและปรับเงินเดือน</p>
    <p>เอกสารนี้สร้างโดยระบบอัตโนมัติ · ${thaiDate(adj.createdAt)}</p>
  </div>

  </body>
  </html>
  `;
}

// ─── Main export ─────────────────────────────────────────────────
export async function generateSalaryApprovalPDF(
  employee: Employee,
  adjustment: SalaryAdjustment,
): Promise<void> {
  // 1. Create a hidden iframe to render the HTML with full font support
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument!;
  iframeDoc.open();
  iframeDoc.write(buildHTML(employee, adjustment));
  iframeDoc.close();

  // 2. Wait for fonts (Sarabun) to load inside iframe
  await new Promise<void>((resolve) => {
    const checkReady = () => {
      if (iframeDoc.fonts) {
        iframeDoc.fonts.ready.then(() => {
          setTimeout(resolve, 300); // extra buffer for layout
        });
      } else {
        setTimeout(resolve, 800);
      }
    };
    if (iframeDoc.readyState === 'complete') {
      checkReady();
    } else {
      iframe.onload = checkReady;
    }
  });

  // 3. Capture the iframe body to canvas
  const canvas = await html2canvas(iframeDoc.body, {
    scale: 2,                 // retina quality
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 794,
    windowWidth: 794,
  });

  document.body.removeChild(iframe);

  // 4. Convert canvas to A4 PDF
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const imgW = pageW;
  const imgH = (canvas.height / canvas.width) * pageW;

  // If content exceeds one page, split it
  if (imgH <= pageH) {
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH);
  } else {
    // Multi-page: slice canvas into page-sized chunks
    const pxPerMm = canvas.width / pageW;
    const pageHeightPx = pageH * pxPerMm;
    let offsetPx = 0;
    let pageNum = 0;
    while (offsetPx < canvas.height) {
      if (pageNum > 0) pdf.addPage();
      const sliceH = Math.min(pageHeightPx, canvas.height - offsetPx);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceH;
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, -offsetPx);
      const sliceMmH = sliceH / pxPerMm;
      pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, sliceMmH);
      offsetPx += pageHeightPx;
      pageNum++;
    }
  }

  // 5. Download
  const filename = `salary-approval-${employee.code}-${adjustment.period.replace('/', '-')}.pdf`;
  pdf.save(filename);
}
