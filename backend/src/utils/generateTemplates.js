require('dotenv').config();
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '../../templates');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Shared styles
const RTB_RED    = 'FFC0392B';
const RTB_ORANGE = 'FFE67E22';
const HEADER_BG  = 'FF2C3E50';
const SUB_BG     = 'FF34495E';
const LIGHT_GRAY = 'FFF5F5F5';
const DARK_GRAY  = 'FF7F8C8D';
const WHITE      = 'FFFFFFFF';
const AMBER      = 'FFFFA500';

function applyHeader(cell, text, bgColor = HEADER_BG, fgColor = WHITE, fontSize = 11, bold = true) {
  cell.value = text;
  cell.font = { bold, size: fontSize, color: { argb: fgColor }, name: 'Calibri' };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };
}

function applyCell(cell, value = '', bgColor = WHITE, fgColor = '000000', bold = false, locked = false) {
  cell.value = value;
  cell.font = { size: 10, color: { argb: 'FF' + fgColor }, bold, name: 'Calibri' };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.border = {
    top: { style: 'hair', color: { argb: 'FFB0B0B0' } },
    bottom: { style: 'hair', color: { argb: 'FFB0B0B0' } },
    left: { style: 'hair', color: { argb: 'FFB0B0B0' } },
    right: { style: 'hair', color: { argb: 'FFB0B0B0' } },
  };
  cell.protection = { locked };
}

// ──────────────────────────────────────────────────────────────
// 1. CHRONOGRAM TEMPLATE
// ──────────────────────────────────────────────────────────────
async function makeChronogramTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Shulink by MilleHills Ltd';
  wb.created = new Date();

  const ws = wb.addWorksheet('Chronogram', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    properties: { tabColor: { argb: RTB_RED } },
  });

  // === ROW 1: Title bar ===
  ws.mergeCells('A1:Z1');
  applyHeader(ws.getCell('A1'), 'TRAINING CHRONOGRAM — SHULINK IMPORT TEMPLATE', RTB_RED, WHITE, 14);
  ws.getRow(1).height = 28;

  // === ROW 2: Instructions ===
  ws.mergeCells('A2:Z2');
  const instrCell = ws.getCell('A2');
  instrCell.value = '⚠  Fill in the YELLOW cells only. Module codes must match exactly what is in Shulink. Save as .xlsx and upload via Chronogram → Import.';
  instrCell.font = { size: 10, color: { argb: 'FF000000' }, italic: true };
  instrCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
  instrCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(2).height = 20;

  // === ROWS 3-7: Header info ===
  const infoRows = [
    ['SECTOR',            ''],
    ['TRADE / SUB-SECTOR',''],
    ['RQF LEVEL',         ''],
    ['QUALIFICATION TITLE',''],
    ['ACADEMIC YEAR',     ''],
  ];
  for (let i = 0; i < infoRows.length; i++) {
    const r = i + 3;
    ws.mergeCells(`A${r}:B${r}`);
    applyCell(ws.getCell(`A${r}`), infoRows[i][0], SUB_BG, 'FFFFFF', true, true);
    ws.mergeCells(`C${r}:J${r}`);
    const valCell = ws.getCell(`C${r}`);
    valCell.value = infoRows[i][1];
    valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    valCell.font = { size: 10, bold: true };
    valCell.border = { bottom: { style: 'medium', color: { argb: 'FF000000' } } };
    ws.getRow(r).height = 18;
  }

  // === ROW 8: Column headers ===
  // Shulink expects: Week# | Term | Date Start | Date End | Week Type | Notes | MOD1 | MOD2 | ... | Total
  // User fills module codes in row 9 (yellow) — these become the column names
  const fixedCols = ['WEEK #', 'TERM', 'DATE START\n(DD/MM/YYYY)', 'DATE END\n(DD/MM/YYYY)', 'WEEK TYPE', 'NOTES'];
  const maxModules = 20; // supports up to 20 modules

  ws.getRow(8).height = 36;
  for (let c = 0; c < fixedCols.length; c++) {
    applyHeader(ws.getCell(8, c + 1), fixedCols[c], HEADER_BG, WHITE, 9);
  }
  for (let m = 0; m < maxModules; m++) {
    applyHeader(ws.getCell(8, fixedCols.length + 1 + m), `MODULE ${m + 1}\n(code)`, HEADER_BG, WHITE, 9);
  }
  applyHeader(ws.getCell(8, fixedCols.length + maxModules + 1), 'TOTAL\nPERIODS', RTB_RED, WHITE, 9);

  // === ROW 9: Module code row (user fills these) ===
  ws.getRow(9).height = 22;
  applyCell(ws.getCell(9, 1), '← Fill module codes in yellow cells →', AMBER, '000000', true, true);
  ws.mergeCells(9, 1, 9, fixedCols.length);
  for (let m = 0; m < maxModules; m++) {
    const cell = ws.getCell(9, fixedCols.length + 1 + m);
    cell.value = '';
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    cell.font = { size: 10, bold: true, color: { argb: 'FF8B0000' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }
  applyCell(ws.getCell(9, fixedCols.length + maxModules + 1), 'AUTO', 'FFDDDDDD', '666666', true, true);

  // === ROWS 10+: Week rows ===
  // Term labels
  const termConfig = [
    { label: 'TERM 1', weeks: 13, startRow: 10 },
    { label: 'TERM 2', weeks: 12, startRow: 10 + 13 + 1 },
    { label: 'TERM 3', weeks: 10, startRow: 10 + 13 + 1 + 12 + 1 },
  ];

  const weekTypes = [
    'teaching',
    'assessment_school',
    'assessment_district',
    'assessment_national',
    'iap',
    'holiday',
    'other',
  ];

  let currentRow = 10;
  for (const term of termConfig) {
    // Term header row
    ws.mergeCells(currentRow, 1, currentRow, fixedCols.length + maxModules + 1);
    const termCell = ws.getCell(currentRow, 1);
    termCell.value = term.label;
    termCell.font = { bold: true, size: 11, color: { argb: WHITE } };
    termCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RTB_ORANGE } };
    termCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(currentRow).height = 20;
    currentRow++;

    for (let w = 1; w <= term.weeks; w++) {
      const row = ws.getRow(currentRow);
      row.height = 18;
      const rowBg = w % 2 === 0 ? LIGHT_GRAY : WHITE;

      // Week number (locked)
      applyCell(ws.getCell(currentRow, 1), w, SUB_BG, 'FFFFFF', true, true);
      // Term number (locked)
      applyCell(ws.getCell(currentRow, 2), term.label.replace('TERM ', ''), '22D6A0B0', '000000', false, true);
      // Date start (user fills)
      const dsCell = ws.getCell(currentRow, 3);
      dsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      dsCell.font = { size: 10 };
      dsCell.numFmt = 'DD/MM/YYYY';
      // Date end (user fills)
      const deCell = ws.getCell(currentRow, 4);
      deCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      deCell.font = { size: 10 };
      deCell.numFmt = 'DD/MM/YYYY';
      // Week type (user selects from list)
      const wtCell = ws.getCell(currentRow, 5);
      wtCell.value = 'teaching';
      wtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      wtCell.dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`"${weekTypes.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Invalid type',
        error: `Choose from: ${weekTypes.join(', ')}`,
      };
      // Notes (user fills)
      const notesCell = ws.getCell(currentRow, 6);
      notesCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };

      // Module period cells (user fills — numbers only)
      for (let m = 0; m < maxModules; m++) {
        const mc = ws.getCell(currentRow, fixedCols.length + 1 + m);
        mc.value = null;
        mc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
        mc.dataValidation = {
          type: 'whole',
          operator: 'between',
          formulae: [0, 999],
          allowBlank: true,
          showErrorMessage: true,
          error: 'Enter a number of periods (0-999)',
        };
        mc.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
      }

      // Auto-sum formula
      const firstModCol = ExcelJS.utils ? '' : String.fromCharCode(64 + fixedCols.length + 1);
      const lastModCol  = String.fromCharCode(64 + fixedCols.length + maxModules);
      const fc = String.fromCharCode(64 + fixedCols.length + 1);
      const lc = String.fromCharCode(64 + fixedCols.length + maxModules);
      ws.getCell(currentRow, fixedCols.length + maxModules + 1).value = {
        formula: `SUM(${fc}${currentRow}:${lc}${currentRow})`,
      };
      ws.getCell(currentRow, fixedCols.length + maxModules + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
      ws.getCell(currentRow, fixedCols.length + maxModules + 1).font = { bold: true, size: 10 };

      currentRow++;
    }
  }

  // Column widths
  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 8;
  ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 14;
  ws.getColumn(5).width = 18;
  ws.getColumn(6).width = 20;
  for (let m = 0; m < maxModules; m++) {
    ws.getColumn(7 + m).width = 10;
  }
  ws.getColumn(7 + maxModules).width = 10;

  // Freeze panes at row 10, col 7
  ws.views = [{ state: 'frozen', xSplit: 6, ySplit: 9, activeCell: 'G10' }];

  // Instructions sheet
  const wsInfo = wb.addWorksheet('Instructions', { properties: { tabColor: { argb: 'FF00AA00' } } });
  wsInfo.getColumn(1).width = 80;
  const instructions = [
    ['SHULINK CHRONOGRAM IMPORT — INSTRUCTIONS'],
    [''],
    ['STEP 1: Fill in the school information (rows 3-7)'],
    ['  • Sector: e.g. ICT and Multimedia'],
    ['  • Trade: e.g. Software Development'],
    ['  • RQF Level: e.g. 3'],
    ['  • Qualification Title: e.g. TVET Certificate III in Software Development'],
    ['  • Academic Year: e.g. 2024-2025'],
    [''],
    ['STEP 2: Fill in module codes (Row 9, yellow cells)'],
    ['  • Enter module codes exactly as they appear in Shulink Curriculum module (e.g. SWDVC301)'],
    ['  • One code per column. Leave unused columns blank.'],
    ['  • Module codes must already exist in Shulink for your school\'s qualification.'],
    [''],
    ['STEP 3: Fill in week dates (Columns C and D)'],
    ['  • Enter dates in DD/MM/YYYY format'],
    ['  • Use the RTB chronogram PDF as your reference'],
    [''],
    ['STEP 4: Set week type (Column E)'],
    ['  • teaching — normal teaching weeks'],
    ['  • assessment_school — school comprehensive assessment'],
    ['  • assessment_district — district comprehensive assessment'],
    ['  • assessment_national — national practical assessment'],
    ['  • iap — industrial attachment program block'],
    ['  • holiday — school holiday / vacation'],
    [''],
    ['STEP 5: Fill in period allocations (yellow module columns)'],
    ['  • Enter the number of periods each module gets that week'],
    ['  • Copy directly from the RTB PDF chronogram'],
    ['  • Leave blank (not 0) for weeks where a module is not taught'],
    [''],
    ['STEP 6: Save the file as .xlsx and upload to Shulink'],
    ['  • Go to Chronogram → Import → Upload this file'],
    ['  • Shulink will validate and import all data automatically'],
    [''],
    ['IMPORTANT NOTES:'],
    ['  • Do not change column order or add/remove columns'],
    ['  • Do not change week numbers or term labels'],
    ['  • The Total Periods column is auto-calculated — do not edit it'],
    ['  • Contact admin@shulink.rw if you encounter any issues'],
  ];
  instructions.forEach((row, i) => {
    const cell = wsInfo.getCell(i + 1, 1);
    cell.value = row[0];
    if (i === 0) { cell.font = { bold: true, size: 14, color: { argb: RTB_RED } }; }
    else if (row[0].startsWith('STEP') || row[0].startsWith('IMPORTANT')) { cell.font = { bold: true, size: 11 }; }
    else { cell.font = { size: 10 }; }
  });

  await wb.xlsx.writeFile(path.join(OUT, 'shulink_chronogram_template.xlsx'));
  console.log('✅ shulink_chronogram_template.xlsx');
}

// ──────────────────────────────────────────────────────────────
// 2. STUDENTS IMPORT TEMPLATE
// ──────────────────────────────────────────────────────────────
async function makeStudentsTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Shulink by MilleHills Ltd';
  const ws = wb.addWorksheet('Students', { properties: { tabColor: { argb: 'FF0070C0' } } });

  const cols = [
    { header: 'REG NUMBER *',     key: 'reg_number',   width: 16, required: true  },
    { header: 'FULL NAME *',      key: 'full_name',    width: 28, required: true  },
    { header: 'CLASS NAME *',     key: 'class_name',   width: 22, required: true  },
    { header: 'GENDER',           key: 'gender',       width: 12, required: false },
    { header: 'DATE OF BIRTH\n(DD/MM/YYYY)', key: 'dob', width: 18, required: false },
    { header: 'BOARDING (Yes/No)',key: 'boarding',     width: 16, required: false },
    { header: 'PARENT NAME',      key: 'parent_name',  width: 24, required: false },
    { header: 'PARENT PHONE\n(+250...)', key: 'parent_phone', width: 20, required: false },
    { header: 'PARENT EMAIL',     key: 'parent_email', width: 28, required: false },
  ];

  // Title
  ws.mergeCells(1, 1, 1, cols.length);
  applyHeader(ws.getCell('A1'), 'SHULINK — STUDENTS IMPORT TEMPLATE', 'FF0070C0', WHITE, 13);
  ws.getRow(1).height = 26;
  ws.mergeCells(2, 1, 2, cols.length);
  ws.getCell('A2').value = '* Required fields. Class name must match exactly what is in Shulink. Delete this row before importing.';
  ws.getCell('A2').font = { italic: true, size: 10 };
  ws.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
  ws.getRow(2).height = 18;

  // Headers
  ws.getRow(3).height = 36;
  cols.forEach((col, i) => {
    applyHeader(ws.getCell(3, i + 1), col.header, HEADER_BG, WHITE, 10);
    ws.getColumn(i + 1).width = col.width;
  });

  // 50 sample rows
  for (let r = 4; r <= 53; r++) {
    const bg = r % 2 === 0 ? LIGHT_GRAY : WHITE;
    for (let c = 0; c < cols.length; c++) {
      const cell = ws.getCell(r, c + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.font = { size: 10 };
      cell.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
    }
    // Gender dropdown
    ws.getCell(r, 4).dataValidation = { type: 'list', formulae: ['"Male,Female"'], allowBlank: true };
    // Boarding dropdown
    ws.getCell(r, 6).dataValidation = { type: 'list', formulae: ['"Yes,No"'], allowBlank: true };
  }

  ws.views = [{ state: 'frozen', ySplit: 3, activeCell: 'A4' }];
  await wb.xlsx.writeFile(path.join(OUT, 'shulink_students_template.xlsx'));
  console.log('✅ shulink_students_template.xlsx');
}

// ──────────────────────────────────────────────────────────────
// 3. MODULES IMPORT TEMPLATE
// ──────────────────────────────────────────────────────────────
async function makeModulesTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Shulink by MilleHills Ltd';
  const ws = wb.addWorksheet('Modules', { properties: { tabColor: { argb: RTB_RED } } });

  const cols = [
    { header: 'MODULE CODE *',      width: 16 },
    { header: 'MODULE NAME *',      width: 40 },
    { header: 'TYPE *\n(specific/general/complementary)', width: 26 },
    { header: 'LEARNING HOURS *',   width: 16 },
    { header: 'LEARNING PERIODS *', width: 18 },
    { header: 'CREDITS *',          width: 12 },
    { header: 'THEORY %',           width: 12 },
    { header: 'PRACTICAL %',        width: 12 },
    { header: 'PASSING LINE %',     width: 14 },
    { header: 'SEQUENCE ORDER',     width: 14 },
  ];

  ws.mergeCells(1, 1, 1, cols.length);
  applyHeader(ws.getCell('A1'), 'SHULINK — MODULES IMPORT TEMPLATE', RTB_RED, WHITE, 13);
  ws.getRow(1).height = 26;
  ws.mergeCells(2, 1, 2, cols.length);
  ws.getCell('A2').value = '* Required. Type must be: specific, general, or complementary. Passing line: 70 for specific, 50 for complementary/general.';
  ws.getCell('A2').font = { italic: true, size: 10 };
  ws.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
  ws.getRow(2).height = 18;

  ws.getRow(3).height = 40;
  cols.forEach((col, i) => {
    applyHeader(ws.getCell(3, i + 1), col.header, HEADER_BG, WHITE, 10);
    ws.getColumn(i + 1).width = col.width;
  });

  // Pre-fill example rows from SWD L3
  const examples = [
    ['SWDWD301','Develop website','specific',140,210,12,30,70,70,1],
    ['SWDJF301','Apply JavaScript','specific',120,180,12,30,70,70,2],
    ['SWDVC301','Conduct version control','specific',80,120,8,15,85,70,3],
    ['SWDPR301','Analyse project requirements','specific',80,120,8,30,70,70,4],
    ['SWDVF301','Develop simple game in Vue','specific',130,195,15,30,70,70,5],
    ['SWDUX301','Design UI/UX','specific',120,180,12,30,70,70,6],
    ['GENGD301','Apply basic graphics design','general',100,150,10,30,70,70,7],
    ['CCMCZ301','Comply with citizenship values','complementary',30,45,3,30,70,50,8],
    ['CCMEN302','Communicate simply using English','complementary',30,45,3,30,70,50,9],
    ['SWIA302','Integrate at workplace (IAP)','specific',200,300,30,0,100,70,10],
  ];

  examples.forEach((row, i) => {
    const r = i + 4;
    const bg = i % 2 === 0 ? LIGHT_GRAY : WHITE;
    row.forEach((val, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = val;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.font = { size: 10 };
      cell.alignment = { horizontal: c > 1 ? 'center' : 'left', vertical: 'middle' };
      cell.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
    });
    ws.getCell(r, 3).dataValidation = {
      type: 'list',
      formulae: ['"specific,general,complementary"'],
      allowBlank: false,
    };
  });

  // Empty rows for new entries
  for (let r = examples.length + 4; r <= examples.length + 33; r++) {
    for (let c = 1; c <= cols.length; c++) {
      const cell = ws.getCell(r, c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: r % 2 === 0 ? LIGHT_GRAY : WHITE } };
      cell.font = { size: 10 };
      cell.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
    }
    ws.getCell(r, 3).dataValidation = { type: 'list', formulae: ['"specific,general,complementary"'], allowBlank: true };
  }

  ws.views = [{ state: 'frozen', ySplit: 3, activeCell: 'A4' }];
  await wb.xlsx.writeFile(path.join(OUT, 'shulink_modules_template.xlsx'));
  console.log('✅ shulink_modules_template.xlsx');
}

// ──────────────────────────────────────────────────────────────
// 4. TRAINERS IMPORT TEMPLATE
// ──────────────────────────────────────────────────────────────
async function makeTrainersTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Shulink by MilleHills Ltd';
  const ws = wb.addWorksheet('Trainers', { properties: { tabColor: { argb: 'FF107C10' } } });

  const cols = [
    { header: 'FULL NAME *',    width: 28 },
    { header: 'EMAIL *',        width: 28 },
    { header: 'ROLE *',         width: 20 },
    { header: 'PHONE',          width: 18 },
    { header: 'DEPARTMENT',     width: 24 },
    { header: 'NATIONAL ID',    width: 20 },
    { header: 'TEMP PASSWORD\n(leave blank to auto-generate)', width: 28 },
  ];

  ws.mergeCells(1, 1, 1, cols.length);
  applyHeader(ws.getCell('A1'), 'SHULINK — STAFF IMPORT TEMPLATE', '22107C10', WHITE, 13);
  ws.getRow(1).height = 26;
  ws.mergeCells(2, 1, 2, cols.length);
  ws.getCell('A2').value = 'Roles: headmaster, dos, dod, hod, patron, metron, trainer. Department must match Shulink department name.';
  ws.getCell('A2').font = { italic: true, size: 10 };
  ws.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
  ws.getRow(2).height = 18;

  ws.getRow(3).height = 40;
  cols.forEach((col, i) => {
    applyHeader(ws.getCell(3, i + 1), col.header, HEADER_BG, WHITE, 10);
    ws.getColumn(i + 1).width = col.width;
  });

  const validRoles = 'headmaster,dos,dod,hod,patron,metron,trainer,school_admin';
  for (let r = 4; r <= 53; r++) {
    const bg = r % 2 === 0 ? LIGHT_GRAY : WHITE;
    for (let c = 1; c <= cols.length; c++) {
      const cell = ws.getCell(r, c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.font = { size: 10 };
      cell.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
    }
    ws.getCell(r, 3).dataValidation = {
      type: 'list',
      formulae: [`"${validRoles}"`],
      allowBlank: false,
    };
  }

  ws.views = [{ state: 'frozen', ySplit: 3, activeCell: 'A4' }];
  await wb.xlsx.writeFile(path.join(OUT, 'shulink_trainers_template.xlsx'));
  console.log('✅ shulink_trainers_template.xlsx');
}

// ──────────────────────────────────────────────────────────────
// Run all
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log('\n📊 Generating Shulink Excel import templates...\n');
  await makeChronogramTemplate();
  await makeStudentsTemplate();
  await makeModulesTemplate();
  await makeTrainersTemplate();
  console.log(`\n✅ All templates saved to: ${OUT}\n`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
