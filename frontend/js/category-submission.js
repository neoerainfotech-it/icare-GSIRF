/**
 * GARVI — Category Submission Flow  (v2 — row-level selection)
 * =============================================================
 * Handles post-submission per-category configuration.
 *
 * After the overall submission saves, call:
 *   CategorySubmissionFlow.init(sb, submissionId, formData, instituteUserId)
 *
 * What's selectable at individual-row level:
 *   • Faculty      → pick individual teachers out of all submitted
 *   • Programs     → pick which programs apply (ug3, ug6, pg2 …)
 *   • Intake       → per-program intake rows (follow program selection)
 *   • Strength     → per-program student-strength rows (follow program)
 *   • Other fields → section / individual-field level (flat)
 */

(function (global) {
  'use strict';

  // ─── NIRF categories ──────────────────────────────────────────────────────
  const NIRF_CATS = [
    { id:'universities',    label:'Universities',            icon:'🎓', desc:'Universities & deemed-to-be universities' },
    { id:'colleges',        label:'Colleges',                icon:'🏫', desc:'Standalone undergraduate colleges' },
    { id:'research',        label:'Research',                icon:'🔬', desc:'Dedicated research institutions' },
    { id:'engineering',     label:'Engineering',             icon:'⚙️',  desc:'Engineering & technical institutions' },
    { id:'management',      label:'Management',              icon:'💼', desc:'Management & business schools' },
    { id:'pharmacy',        label:'Pharmacy',                icon:'💊', desc:'Pharmacy institutes & colleges' },
    { id:'medical',         label:'Medical',                 icon:'🏥', desc:'Medical colleges & hospitals' },
    { id:'dental',          label:'Dental',                  icon:'🦷', desc:'Dental colleges & institutes' },
    { id:'law',             label:'Law',                     icon:'⚖️',  desc:'Law schools & faculties' },
    { id:'architecture',    label:'Architecture & Planning', icon:'🏛️', desc:'Architecture & planning institutes' },
    { id:'agriculture',     label:'Agriculture',             icon:'🌾', desc:'Agriculture & allied sectors' },
    { id:'innovation',      label:'Innovation',              icon:'💡', desc:'ARIIA — innovation excellence' },
    { id:'open_university', label:'Open University',         icon:'📖', desc:'Open & distance-learning universities' },
    { id:'skill_university',label:'Skill University',        icon:'🛠️', desc:'Skill-focused universities' },
  ];

  // ─── Program definitions (mirrors gsirf-data-collection.html) ────────────
  const PROGRAMS = [
    { key:'ug3', label:'UG [3 Years]',          dur:3 },
    { key:'ug4', label:'UG [4 Years]',          dur:4 },
    { key:'ug5', label:'UG [5 Years]',          dur:5 },
    { key:'ug6', label:'UG [6 Years]',          dur:6 },
    { key:'pg1', label:'PG [1 Year]',           dur:1 },
    { key:'pg2', label:'PG [2 Years]',          dur:2 },
    { key:'pg3', label:'PG [3 Years]',          dur:3 },
    { key:'pgi', label:'PG-Integrated [5 Yrs]', dur:5 },
    { key:'pg6', label:'PG [6 Years]',          dur:6 },
  ];

  // Intake year strings for a program
  function intakeYears(dur) {
    const yrs = [];
    for (let i = 0; i < Math.min(dur, 6); i++) yrs.push(`${2025-i}-${String(2026-i).slice(-2)}`);
    return yrs;
  }

  // All intake field IDs for a program key
  function intakeFields(key) {
    const p = PROGRAMS.find(x => x.key === key);
    if (!p) return [];
    return intakeYears(p.dur).map(yr => `intake_${key}_${yr.replace('-','')}`);
  }

  // All strength field IDs for a program key
  const STR_SUFFIXES = ['m','f','t','tot','ws','os','oc','eb','sc','fee_gov','fee_inst','fee_pvt','fee_none'];
  function strengthFields(key) {
    return STR_SUFFIXES.map(s => `str_${key}_${s}`);
  }

  // Human-readable strength field names
  const STR_LABELS = {
    m:'Male Students', f:'Female Students', t:'Transgender Students', tot:'Total Students',
    ws:'Within State', os:'Outside State', oc:'Outside Country',
    eb:'Economically Backward', sc:'Socially Challenged (SC+ST+OBC)',
    fee_gov:'Fee Reimbursement — State/Central Govt',
    fee_inst:'Fee Reimbursement — Institution Funds',
    fee_pvt:'Fee Reimbursement — Private Bodies',
    fee_none:'Not Receiving Full Fee Reimbursement',
  };

  // ─── Flat-field section groupings ────────────────────────────────────────
  const FLAT_GROUPS = [
    { key:'g1',  label:'Institute Profile & Registration', icon:'📋',
      test: k => k.startsWith('s1_') },
    { key:'g_phd',label:'Ph.D. Student Details',          icon:'🔬',
      test: k => k.startsWith('phd_') },
    { key:'g_slp',label:'Sustainable Living Practices',   icon:'🌿',
      test: k => k.startsWith('slp_') || k.startsWith('radio_slp') },
    { key:'g_acc',label:'Accreditation',                  icon:'🏅',
      test: k => k.startsWith('naac_') || k.startsWith('nba_') },
    { key:'g_nep',label:'Multiple Entry/Exit & NEP',      icon:'🔄',
      test: k => k.startsWith('nep_') },
    { key:'g_ipr',label:'Research, Publications & IPR',   icon:'💡',
      test: k => k.startsWith('ipr_') },
    { key:'g_ab', label:'About Institute',                icon:'🏛️',
      test: k => k.startsWith('about_') },
    { key:'g_dec',label:'Declaration',                    icon:'📢',
      test: k => k.startsWith('s8_') || k === 'declarationCheck' },
  ];

  // Field-level human readable labels
  const FIELD_LABELS = {
    s1_gsirfId:'GSIRF ID', s1_instName:'Institution Name', s1_instType:'Institution Type',
    s1_affiliatedUniv:'Affiliated University', s1_city:'City', s1_district:'District',
    s1_nodalName:'Nodal Officer Name', s1_nodalDesig:'Nodal Officer Designation',
    s1_email:'Email', s1_mobile:'Mobile', s1_submitDate:'Submission Date',
    s1_isRevised:'Revised Submission',
    phd_ft_current:'Full-Time Ph.D. Scholars (Current)',
    phd_pt_current:'Part-Time Ph.D. Scholars (Current)',
    phd_total_current:'Total Ph.D. Scholars (Current)',
    phd_grad_ft_2526:'FT Graduated 2025-26', phd_grad_ft_2425:'FT Graduated 2024-25',
    phd_grad_ft_2324:'FT Graduated 2023-24', phd_grad_pt_2526:'PT Graduated 2025-26',
    phd_grad_pt_2425:'PT Graduated 2024-25', phd_grad_pt_2324:'PT Graduated 2023-24',
    phd_med_pursuing:'Medical Ph.D. (Pursuing)', phd_med_grad_2526:'Medical Ph.D. Graduated 2025-26',
    phd_med_grad_2425:'Medical Ph.D. Graduated 2024-25', phd_med_grad_2324:'Medical Ph.D. Graduated 2023-24',
    slp_q2_a:'Energy-Efficient Buildings', slp_q2_b:'Renewable Energy Installations',
    slp_q2_c:'Offsetting Emissions', slp_q2_d:'Sustainable Procurement', slp_q2_e:'No Energy Initiatives',
    slp_q4_a:'Rooftop Rainwater Harvesting', slp_q4_b:'Surface Runoff Harvesting',
    slp_q4_c:'Percolation Pit', slp_q4_d:'Recharge Wells', slp_q4_e:'Storage Tank', slp_q4_f:'No Water Harvesting',
    slp_q5_a:'Solar Panels', slp_q5_b:'Wind Turbines', slp_q5_c:'Biogas Plants',
    slp_q5_d:'Geothermal Energy', slp_q5_e:'No Renewable Energy',
    slp_q6_a:'Food Donation Programs', slp_q6_b:'Composting Systems',
    slp_q6_c:'Sustainable Food Procurement', slp_q6_d:'No Food Waste Programs',
    naac_accred:'NAAC Accreditation', naac_grade:'NAAC Grade', naac_cgpa:'NAAC CGPA',
    naac_valid:'NAAC Validity', nba_accred:'NBA Accreditation',
    nba_total_progs:'Total Programs', nba_accred_progs:'NBA Accredited Programs',
    nep_yes:'NEP Implemented', nep_no:'NEP Not Implemented',
    ipr_pub_2025:'Publications 2024-25', ipr_pub_2024:'Publications 2023-24', ipr_pub_2023:'Publications 2022-23',
    ipr_grant_2025:'Research Grants 2024-25 (₹)', ipr_grant_2024:'Research Grants 2023-24 (₹)',
    ipr_grant_2023:'Research Grants 2022-23 (₹)',
    about_campuses:'List of Campuses', about_constituent:'Constituent Colleges',
    s8_signatoryName:'Authorised Signatory Name', s8_signatoryDate:'Submission Date',
    declarationCheck:'Declaration Agreed',
    radio_slp_q1:'Single-Use Plastic Policy', radio_slp_q3:'Recycling Infrastructure',
  };

  // Keys to SKIP from flat display (handled specially)
  const SKIP_KEYS = new Set(['faculty_count','_selectedPrograms']);
  function isSkip(k) {
    if (SKIP_KEYS.has(k)) return true;
    if (k.startsWith('intake_') || k.startsWith('str_')) return true;
    return false;
  }

  // ─── State ────────────────────────────────────────────────────────────────
  let _sb           = null;
  let _subId        = null;
  let _data         = null;      // flat form_data
  let _instId       = null;
  let _selected     = [];        // chosen NIRF category IDs
  let _idx          = 0;
  let _sels         = {};        // { catId: { fieldKey: bool } }
  let _progSels     = {};        // { catId: { progKey: bool } }
  let _facSels      = {};        // { catId: { facultyId: bool } }
  let _edits        = {};        // { catId: { fieldKey: editedValue } }
  let _facultyData  = [];        // all faculty rows from gsirf_faculty
  let _saved        = [];

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const fLabel = k => {
    // Intake field: intake_ug6_202526
    const intM = k.match(/^intake_(\w+)_(\d+)$/);
    if (intM) {
      const prog = PROGRAMS.find(p => p.key === intM[1]);
      const yr   = intM[2].replace(/(\d{4})(\d{2})/, '$1-$2');
      return `${prog?.label || intM[1]} — Intake ${yr}`;
    }
    // Strength field: str_ug6_m
    const strM = k.match(/^str_(\w+)_(.+)$/);
    if (strM) {
      const prog = PROGRAMS.find(p => p.key === strM[1]);
      return `${prog?.label || strM[1]} — ${STR_LABELS[strM[2]] || strM[2]}`;
    }
    return FIELD_LABELS[k] || k.replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
  };

  function fmtVal(v) {
    if (v===null||v===undefined) return '—';
    if (typeof v==='boolean') return v?'Yes':'No';
    if (Array.isArray(v)) return `[${v.length} items]`;
    if (typeof v==='object') return '{…}';
    const s=String(v); return s.length>42?s.slice(0,39)+'…':s;
  }

  function isLeaf(v) { return v===null||v===undefined||typeof v!=='object'||Array.isArray(v); }

  function isNumeric(v) {
    if (v===null||v===undefined||v===''||typeof v==='boolean') return false;
    if (typeof v==='number') return true;
    return !isNaN(Number(v)) && String(v).trim()!=='';
  }

  // Render value cell — editable number input or read-only text
  function valCell(k, v, catId) {
    if (isNumeric(v)) {
      return `<input type="number" class="csf-fval-inp"
        value="${v}" min="0"
        data-editkey="${k}" data-cat="${catId}"
        oninput="CategorySubmissionFlow._edit(this)"
        onclick="event.stopPropagation()">`;
    }
    return `<span class="csf-fval" title="${v}">${fmtVal(v)}</span>`;
  }

  // Get selected programs from form_data
  function selectedPrograms() {
    const sp = _data?._selectedPrograms;
    if (!Array.isArray(sp)) return [];
    return sp.filter(p => p.checked).map(p => p.key);
  }

  // ─── Styles ───────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('csf-styles')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="csf-styles">
      .csf-ov{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99999;display:flex;
        align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(6px);
        animation:csfIn .22s ease}
      @keyframes csfIn{from{opacity:0}to{opacity:1}}
      .csf-modal{background:#fff;border-radius:18px;width:100%;max-width:900px;
        max-height:90vh;overflow:hidden;display:flex;flex-direction:column;
        box-shadow:0 28px 80px rgba(0,0,0,.32);animation:csfUp .22s ease}
      @keyframes csfUp{from{transform:translateY(22px);opacity:0}to{transform:translateY(0);opacity:1}}
      .csf-head{padding:1.5rem 2rem 1.1rem;border-bottom:1px solid #f0f0f0;flex-shrink:0}
      .csf-body{padding:1.2rem 2rem;overflow-y:auto;flex:1;min-height:0}
      .csf-foot{padding:.9rem 2rem 1.35rem;border-top:1px solid #f0f0f0;display:flex;
        justify-content:space-between;align-items:center;flex-shrink:0;background:#fafafa}
      .csf-h1{font-size:1.3rem;font-weight:700;color:#111;margin:0 0 .3rem}
      .csf-sub{font-size:.875rem;color:#555;line-height:1.55;margin:0}

      /* category grid */
      .csf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:.55rem}
      .csf-card{border:2px solid #e5e7eb;border-radius:12px;padding:.8rem;cursor:pointer;
        transition:all .14s;user-select:none;position:relative}
      .csf-card:hover{border-color:#d4a017;background:#fffdf5;transform:translateY(-1px)}
      .csf-card.sel{border-color:#d4a017;background:linear-gradient(135deg,#fffbeb,#fff8e1)}
      .csf-card .ci{font-size:1.3rem;margin-bottom:.25rem}
      .csf-card .cl{font-size:.78rem;font-weight:700;color:#111;margin-bottom:.15rem}
      .csf-card .cd{font-size:.7rem;color:#999;line-height:1.35}
      .csf-pill{position:absolute;top:.4rem;right:.4rem;width:18px;height:18px;
        border-radius:50%;border:2px solid #d4a017;background:#fff;display:flex;
        align-items:center;justify-content:center;font-size:.58rem;color:#fff;transition:background .14s}
      .csf-card.sel .csf-pill{background:#d4a017}

      /* buttons */
      .csf-btn{padding:.52rem 1.35rem;border-radius:8px;font-size:.875rem;font-weight:600;
        cursor:pointer;border:none;transition:all .14s;line-height:1}
      .csf-gold{background:#d4a017;color:#fff}
      .csf-gold:hover{background:#b8860b;transform:translateY(-1px);box-shadow:0 4px 14px rgba(212,160,23,.35)}
      .csf-gold:disabled{background:#ccc;cursor:not-allowed;transform:none;box-shadow:none}
      .csf-out{background:#fff;color:#555;border:1.5px solid #ddd}
      .csf-out:hover{border-color:#999;background:#f9f9f9}
      .csf-skip{font-size:.8rem;color:#aaa;cursor:pointer;background:none;border:none;
        text-decoration:underline;padding:0}.csf-skip:hover{color:#666}

      .csf-info{background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;
        padding:.65rem .9rem;font-size:.82rem;color:#78350f;margin-bottom:1rem;line-height:1.5}
      .csf-steps{display:flex;gap:4px;margin-bottom:4px}
      .csf-step{flex:1;height:4px;border-radius:4px;background:#e5e7eb;transition:background .25s}
      .csf-step.done{background:#22c55e}.csf-step.act{background:#d4a017}

      /* tree */
      .csf-tree{border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}

      /* section rows */
      .csf-sec-row{display:flex;align-items:center;gap:.6rem;padding:.75rem 1rem;
        background:#f8f9fa;cursor:pointer;border-bottom:1px solid #e5e7eb;
        user-select:none;transition:background .1s}
      .csf-sec-row:hover{background:#f1f3f5}
      .csf-sec-icon{font-size:.95rem;flex-shrink:0}
      .csf-sec-lbl{font-weight:600;font-size:.875rem;color:#111;flex:1}
      .csf-sec-cnt{font-size:.7rem;color:#999;white-space:nowrap}
      .csf-arr{font-size:.62rem;color:#999;transition:transform .18s;flex-shrink:0}
      .csf-arr.open{transform:rotate(90deg)}

      .csf-fields{display:none;background:#fff;border-bottom:1px solid #e5e7eb}
      .csf-fields.open{display:block}

      /* flat fields */
      .csf-field{display:flex;align-items:center;gap:.55rem;
        padding:.4rem 1rem .4rem 2.4rem;border-bottom:1px solid #f3f4f6}
      .csf-field:last-child{border-bottom:none}
      .csf-fkey{font-size:.79rem;color:#333;font-weight:500;flex:1;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
      .csf-fval{font-size:.74rem;color:#bbb;font-style:italic;
        max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

      /* compact number input — force fixed width against any Tailwind overrides */
      input[type="number"].csf-fval-inp {
        width: 80px !important;
        max-width: 80px !important;
        min-width: 60px !important;
        flex-shrink: 0 !important;
        flex-grow: 0 !important;
        box-sizing: border-box !important;
        text-align: right !important;
        border: 1.5px solid #d1d5db !important;
        border-radius: 6px !important;
        padding: 3px 6px !important;
        font-size: .82rem !important;
        font-style: normal !important;
        color: #1f2937 !important;
        background: #f9fafb !important;
        transition: border-color .15s, background .15s !important;
        -moz-appearance: number-input !important;
      }
      input[type="number"].csf-fval-inp:hover {
        border-color: #d4a017 !important;
        background: #fffdf5 !important;
      }
      input[type="number"].csf-fval-inp:focus {
        border-color: #d4a017 !important;
        background: #fff !important;
        outline: none !important;
        box-shadow: 0 0 0 2px rgba(212,160,23,.18) !important;
      }

      /* program rows (intake / strength) */
      .csf-prog-block{border-bottom:1px solid #e5e7eb}
      .csf-prog-block:last-child{border-bottom:none}
      .csf-prog-head{display:flex;align-items:center;gap:.55rem;
        padding:.6rem 1rem .6rem 1.8rem;background:#f0f4ff;
        cursor:pointer;user-select:none;border-bottom:1px solid #e5e7eb}
      .csf-prog-head:hover{background:#e8eeff}
      .csf-prog-lbl{font-size:.8rem;font-weight:600;color:#1e40af;flex:1}
      .csf-prog-cnt{font-size:.68rem;color:#6b7280}
      .csf-prog-arr{font-size:.6rem;color:#6b7280;transition:transform .18s}
      .csf-prog-arr.open{transform:rotate(90deg)}
      .csf-prog-fields{display:none;background:#fafbff}
      .csf-prog-fields.open{display:block}
      .csf-sub-field{display:flex;align-items:center;gap:.55rem;
        padding:.35rem 1rem .35rem 3.5rem;border-bottom:1px solid #f3f4f6;
        overflow:hidden}
      .csf-sub-field:last-child{border-bottom:none}
      .csf-sub-field .csf-fkey{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}

      /* faculty rows */
      .csf-fac-row{display:flex;align-items:center;gap:.7rem;
        padding:.5rem 1rem .5rem 2.4rem;border-bottom:1px solid #f3f4f6}
      .csf-fac-row:last-child{border-bottom:none}
      .csf-fac-info{flex:1;min-width:0}
      .csf-fac-name{display:block;font-size:.82rem;font-weight:600;color:#111}
      .csf-fac-meta{display:block;font-size:.72rem;color:#888;margin-top:1px}
      .csf-fac-badge{display:inline-block;font-size:.68rem;font-weight:600;
        padding:.1rem .45rem;border-radius:10px;margin-left:.35rem}
      .bg-blue{background:#eff6ff;color:#1d4ed8}
      .bg-green{background:#f0fdf4;color:#166534}
      .bg-purple{background:#faf5ff;color:#7e22ce}

      input.csf-chk{accent-color:#d4a017;cursor:pointer;flex-shrink:0;width:14px;height:14px}

      .csf-tools{display:flex;gap:.4rem;margin-bottom:.8rem;flex-wrap:wrap}
      .csf-tbtn{padding:.3rem .72rem;border-radius:6px;font-size:.77rem;font-weight:600;
        cursor:pointer;border:1.5px solid #e5e7eb;background:#fff;color:#666;transition:all .12s}
      .csf-tbtn:hover{border-color:#d4a017;color:#d4a017}

      /* done screen */
      .csf-done{text-align:center;padding:2.75rem 2rem}
      .csf-done-ico{font-size:3.5rem;margin-bottom:.7rem}
      .csf-done-h{font-size:1.4rem;font-weight:700;color:#111;margin-bottom:.4rem}
      .csf-done-p{color:#666;font-size:.9rem;margin-bottom:1.65rem}
      .csf-badges{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;margin-bottom:1.65rem}
      .csf-badge{background:#f0fdf4;border:1px solid #86efac;color:#166534;
        padding:.27rem .72rem;border-radius:20px;font-size:.77rem;font-weight:600}
      .csf-spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.35);
        border-top-color:#fff;border-radius:50%;animation:csfSp .6s linear infinite;
        vertical-align:middle;margin-right:5px}
      @keyframes csfSp{to{transform:rotate(360deg)}}
      .csf-fcnt{font-size:.79rem;color:#999}
      .csf-loading{text-align:center;padding:2rem;color:#999;font-size:.875rem}
      @media(max-width:600px){
        .csf-head,.csf-body,.csf-foot{padding-left:1rem;padding-right:1rem}
        .csf-grid{grid-template-columns:repeat(2,1fr)}
        .csf-h1{font-size:1.1rem}
      }
    </style>`);
  }

  // ─── Overlay helpers ──────────────────────────────────────────────────────
  function removeOv() { document.getElementById('csf-ov')?.remove(); }
  function mountOv(html) {
    removeOv();
    const d=document.createElement('div');
    d.className='csf-ov';d.id='csf-ov';d.innerHTML=html;
    document.body.appendChild(d);
    requestAnimationFrame(_applyIndeterminate);
    return d;
  }
  function _applyIndeterminate() {
    document.querySelectorAll('input.csf-chk[data-ind="1"]').forEach(cb=>{ cb.indeterminate=true; cb.checked=true; });
  }

  // ─── SCREEN 1: Category selection ─────────────────────────────────────────
  function showCatSel() {
    const cards = NIRF_CATS.map(c=>`
      <div class="csf-card ${_selected.includes(c.id)?'sel':''}"
           id="csf-card-${c.id}" onclick="CategorySubmissionFlow._tc('${c.id}')">
        <div class="csf-pill" id="csf-pill-${c.id}">✓</div>
        <div class="ci">${c.icon}</div>
        <div class="cl">${c.label}</div>
        <div class="cd">${c.desc}</div>
      </div>`).join('');

    mountOv(`
      <div class="csf-modal">
        <div class="csf-head">
          <h2 class="csf-h1">🏆 Select Ranking Categories</h2>
          <p class="csf-sub">Your data is submitted under <strong>Overall</strong> by default.
          Select additional NIRF categories your institution wants to participate in.</p>
        </div>
        <div class="csf-body">
          <div class="csf-info">ℹ️ For each category you select, you can choose exactly which
          <strong>faculty members, programs, intake rows and fields</strong> to include.</div>
          <div class="csf-grid">${cards}</div>
          <p style="text-align:center;font-size:.79rem;color:#bbb;margin-top:.7rem">
            <span id="csf-cnt">0</span> categories selected
          </p>
        </div>
        <div class="csf-foot">
          <button class="csf-skip" onclick="CategorySubmissionFlow._skip()">Skip — Overall only</button>
          <button class="csf-btn csf-gold" id="csf-proc"
                  onclick="CategorySubmissionFlow._proc()"
                  ${_selected.length===0?'disabled':''}>
            Configure Categories →
          </button>
        </div>
      </div>`);
    _refreshCnt();
  }

  // ─── SCREEN 2: Data review ────────────────────────────────────────────────
  function showReview() {
    const catId = _selected[_idx];
    const cat   = NIRF_CATS.find(c=>c.id===catId);
    const isLast = _idx===_selected.length-1;

    // Init selections for this category
    if (!_sels[catId])    _sels[catId]    = _buildFlatSels();
    if (!_progSels[catId]) _progSels[catId] = _buildProgSels();
    if (!_facSels[catId]) {
      _facSels[catId]={};
      _facultyData.forEach(f=>{ _facSels[catId][f.id]=true; });
    }

    const steps = _selected.map((id,i)=>{
      const cls=i<_idx?'done':i===_idx?'act':'';
      const m=NIRF_CATS.find(c=>c.id===id);
      return `<div class="csf-step ${cls}" title="${m?.label||id}"></div>`;
    }).join('');

    mountOv(`
      <div class="csf-modal">
        <div class="csf-head">
          <div style="display:flex;align-items:center;gap:.7rem;margin-bottom:.7rem">
            <span style="font-size:1.65rem">${cat.icon}</span>
            <div>
              <h2 class="csf-h1" style="margin-bottom:0">${cat.label}</h2>
              <span style="font-size:.78rem;color:#aaa">Category ${_idx+1} of ${_selected.length}</span>
            </div>
          </div>
          <div class="csf-steps">${steps}</div>
          <div style="font-size:.7rem;color:#ccc;margin-top:4px;display:flex;gap:.7rem">
            <span><span style="display:inline-block;width:8px;height:4px;background:#22c55e;border-radius:2px"></span> Done</span>
            <span><span style="display:inline-block;width:8px;height:4px;background:#d4a017;border-radius:2px"></span> Current</span>
            <span><span style="display:inline-block;width:8px;height:4px;background:#e5e7eb;border-radius:2px"></span> Pending</span>
          </div>
        </div>
        <div class="csf-body">
          <div class="csf-info">ℹ️ Deselect any <strong>faculty members, programs or fields</strong>
          that are <em>not relevant</em> to <strong>${cat.label}</strong>.
          Everything is included by default.</div>
          <div class="csf-tools">
            <button class="csf-tbtn" onclick="CategorySubmissionFlow._all('${catId}')">✓ Select All</button>
            <button class="csf-tbtn" onclick="CategorySubmissionFlow._none('${catId}')">✗ Deselect All</button>
          </div>
          <div class="csf-tree" id="csf-tree">${buildTree(catId)}</div>
        </div>
        <div class="csf-foot">
          <button class="csf-btn csf-out" onclick="CategorySubmissionFlow._back()">← Back</button>
          <div style="display:flex;align-items:center;gap:.7rem">
            <span class="csf-fcnt" id="csf-fcnt"></span>
            <button class="csf-btn csf-gold" id="csf-savebtn"
                    onclick="CategorySubmissionFlow._save('${catId}')">
              ${isLast?'✓ Save & Finish':'Save & Next →'}
            </button>
          </div>
        </div>
      </div>`);

    _updateFCnt(catId);
  }

  // Build initial flat field selection (all true, skip special keys)
  function _buildFlatSels() {
    const out={};
    if (!_data) return out;
    Object.keys(_data).forEach(k=>{ if(!isSkip(k)) out[k]=true; });
    return out;
  }

  // Build initial program selection (only checked programs, all true)
  function _buildProgSels() {
    const out={};
    selectedPrograms().forEach(k=>{ out[k]=true; });
    return out;
  }

  // ─── Build the data review tree ───────────────────────────────────────────
  function buildTree(catId) {
    const parts = [];

    // 1. Institute Profile + other flat sections
    FLAT_GROUPS.forEach((grp, gi) => {
      const fields = Object.keys(_data||{}).filter(k=>!isSkip(k)&&grp.test(k));
      if (!fields.length) return;

      const allOn  = fields.every(k=>_sels[catId]?.[k]!==false);
      const anyOn  = fields.some( k=>_sels[catId]?.[k]!==false);

      const rows = fields.map(k=>{
        const chk=_sels[catId]?.[k]!==false;
        const curVal = _edits[catId]?.[k] !== undefined ? _edits[catId][k] : (_data[k]);
        return `<div class="csf-field">
          <input type="checkbox" class="csf-chk" data-path="${k}" data-cat="${catId}" data-secid="${grp.key}"
            ${chk?'checked':''} onchange="CategorySubmissionFlow._fc(this)">
          <span class="csf-fkey">${fLabel(k)}</span>
          ${valCell(k, curVal, catId)}
        </div>`;
      }).join('');

      const uid=`flat-${gi}`;
      parts.push(`
        <div>
          <div class="csf-sec-row" onclick="CategorySubmissionFlow._ts('csf-fb-${uid}','csf-fa-${uid}')">
            <input type="checkbox" class="csf-chk" data-section="${grp.key}" data-cat="${catId}"
              data-flist="${fields.join('|')}" data-flat="1"
              ${allOn?'checked':''} ${(!allOn&&anyOn)?'data-ind="1"':''}
              onchange="CategorySubmissionFlow._sc(this)" onclick="event.stopPropagation()">
            <span class="csf-sec-icon">${grp.icon}</span>
            <span class="csf-sec-lbl">${grp.label}</span>
            <span class="csf-sec-cnt">${fields.length} fields</span>
            <span class="csf-arr" id="csf-fa-${uid}">▶</span>
          </div>
          <div class="csf-fields" id="csf-fb-${uid}">${rows}</div>
        </div>`);
    });

    // 2. Sanctioned Intake — per program
    const progKeys = Object.keys(_progSels[catId]||{});
    if (progKeys.length) {
      const intAllOn = progKeys.every(pk=>_progSels[catId]?.[pk]!==false);
      const intAnyOn = progKeys.some( pk=>_progSels[catId]?.[pk]!==false);

      const progBlocks = progKeys.map((pk,pi)=>{
        const prog   = PROGRAMS.find(p=>p.key===pk);
        const iKeys  = intakeFields(pk).filter(k=>k in (_data||{}));
        const pOn    = _progSels[catId]?.[pk]!==false;

        const subRows = iKeys.map(k=>{
          const chk = pOn && (_sels[catId]?.[k]!==false);
          const yr  = k.replace(`intake_${pk}_`,'').replace(/(\d{4})(\d{2})$/,'$1-$2');
          const curVal = _edits[catId]?.[k] !== undefined ? _edits[catId][k] : (_data?.[k]);
          return `<div class="csf-sub-field">
            <input type="checkbox" class="csf-chk" data-path="${k}" data-cat="${catId}"
              data-secid="intake_${pk}" ${chk?'checked':''}
              onchange="CategorySubmissionFlow._fc(this)">
            <span class="csf-fkey">Intake ${yr}</span>
            <input type="number" class="csf-fval-inp" value="${curVal||0}" min="0"
              data-editkey="${k}" data-cat="${catId}"
              oninput="CategorySubmissionFlow._edit(this)"
              onclick="event.stopPropagation()">
          </div>`;
        }).join('');

        return `
          <div class="csf-prog-block">
            <div class="csf-prog-head" onclick="CategorySubmissionFlow._ts('csf-ib-${pi}','csf-ia-${pi}')">
              <input type="checkbox" class="csf-chk" data-prog="${pk}" data-cat="${catId}"
                ${pOn?'checked':''} onchange="CategorySubmissionFlow._pc(this)"
                onclick="event.stopPropagation()">
              <span class="csf-prog-lbl">${prog?.label||pk}</span>
              <span class="csf-prog-cnt">${iKeys.length} year${iKeys.length!==1?'s':''}</span>
              <span class="csf-prog-arr" id="csf-ia-${pi}">▶</span>
            </div>
            <div class="csf-prog-fields" id="csf-ib-${pi}">${subRows||'<div class="csf-sub-field" style="color:#bbb;font-size:.78rem">No intake data entered</div>'}</div>
          </div>`;
      }).join('');

      parts.push(`
        <div>
          <div class="csf-sec-row" onclick="CategorySubmissionFlow._ts('csf-int-body','csf-int-arr')">
            <input type="checkbox" class="csf-chk" data-section="__intake__" data-cat="${catId}"
              data-proglist="${progKeys.join('|')}"
              ${intAllOn?'checked':''} ${(!intAllOn&&intAnyOn)?'data-ind="1"':''}
              onchange="CategorySubmissionFlow._intSecChange(this)" onclick="event.stopPropagation()">
            <span class="csf-sec-icon">📝</span>
            <span class="csf-sec-lbl">Sanctioned (Approved) Intake</span>
            <span class="csf-sec-cnt">${progKeys.length} program${progKeys.length!==1?'s':''}</span>
            <span class="csf-arr" id="csf-int-arr">▶</span>
          </div>
          <div class="csf-fields" id="csf-int-body">${progBlocks}</div>
        </div>`);
    }

    // 3. Student Strength — per program
    if (progKeys.length) {
      const strAllOn = progKeys.every(pk=>_progSels[catId]?.[pk]!==false);
      const strAnyOn = progKeys.some( pk=>_progSels[catId]?.[pk]!==false);

      const strBlocks = progKeys.map((pk,pi)=>{
        const prog  = PROGRAMS.find(p=>p.key===pk);
        const sKeys = strengthFields(pk).filter(k=>k in (_data||{}));
        const pOn   = _progSels[catId]?.[pk]!==false;
        const si    = 100+pi; // offset to avoid ID collision with intake

        const subRows = sKeys.map(k=>{
          const chk = pOn && (_sels[catId]?.[k]!==false);
          const sfx = k.replace(`str_${pk}_`,'');
          const curVal = _edits[catId]?.[k] !== undefined ? _edits[catId][k] : (_data?.[k]);
          return `<div class="csf-sub-field">
            <input type="checkbox" class="csf-chk" data-path="${k}" data-cat="${catId}"
              data-secid="str_${pk}" ${chk?'checked':''}
              onchange="CategorySubmissionFlow._fc(this)">
            <span class="csf-fkey">${STR_LABELS[sfx]||sfx}</span>
            <input type="number" class="csf-fval-inp" value="${curVal||0}" min="0"
              data-editkey="${k}" data-cat="${catId}"
              oninput="CategorySubmissionFlow._edit(this)"
              onclick="event.stopPropagation()">
          </div>`;
        }).join('');

        return `
          <div class="csf-prog-block">
            <div class="csf-prog-head" onclick="CategorySubmissionFlow._ts('csf-sb-${si}','csf-sa-${si}')">
              <input type="checkbox" class="csf-chk" data-prog="${pk}" data-cat="${catId}"
                ${pOn?'checked':''} onchange="CategorySubmissionFlow._pc(this)"
                onclick="event.stopPropagation()">
              <span class="csf-prog-lbl">${prog?.label||pk}</span>
              <span class="csf-prog-cnt">${sKeys.length} fields</span>
              <span class="csf-prog-arr" id="csf-sa-${si}">▶</span>
            </div>
            <div class="csf-prog-fields" id="csf-sb-${si}">${subRows||'<div class="csf-sub-field" style="color:#bbb;font-size:.78rem">No strength data entered</div>'}</div>
          </div>`;
      }).join('');

      parts.push(`
        <div>
          <div class="csf-sec-row" onclick="CategorySubmissionFlow._ts('csf-str-body','csf-str-arr')">
            <input type="checkbox" class="csf-chk" data-section="__strength__" data-cat="${catId}"
              data-proglist="${progKeys.join('|')}"
              ${strAllOn?'checked':''} ${(!strAllOn&&strAnyOn)?'data-ind="1"':''}
              onchange="CategorySubmissionFlow._intSecChange(this)" onclick="event.stopPropagation()">
            <span class="csf-sec-icon">🎓</span>
            <span class="csf-sec-lbl">Student Strength</span>
            <span class="csf-sec-cnt">${progKeys.length} program${progKeys.length!==1?'s':''}</span>
            <span class="csf-arr" id="csf-str-arr">▶</span>
          </div>
          <div class="csf-fields" id="csf-str-body">${strBlocks}</div>
        </div>`);
    }

    // 4. Faculty — individual rows
    const facSel  = _facSels[catId]||{};
    const facTotal= _facultyData.length;
    const facChkd = _facultyData.filter(f=>facSel[f.id]!==false).length;
    const facAllOn= facTotal>0 && facChkd===facTotal;
    const facAnyOn= facChkd>0;

    if (facTotal > 0) {
      const facRows = _facultyData.map((f,fi)=>{
        const chk   = facSel[f.id]!==false;
        const exp   = f.teaching_exp ? Math.floor(f.teaching_exp/12)+'yr' : '—';
        const deg   = f.highest_degree||'—';
        const desig = f.designation||'—';
        return `
          <div class="csf-fac-row">
            <input type="checkbox" class="csf-chk csf-fac-chk"
              data-facid="${f.id}" data-cat="${catId}"
              ${chk?'checked':''}
              onchange="CategorySubmissionFlow._facChg(this)">
            <div class="csf-fac-info">
              <span class="csf-fac-name">${f.name||'—'}</span>
              <span class="csf-fac-meta">
                ${desig}
                <span class="csf-fac-badge bg-blue">${deg}</span>
                <span class="csf-fac-badge bg-green">Exp: ${exp}</span>
                ${f.working==='yes'?'<span class="csf-fac-badge bg-purple">Active</span>':''}
              </span>
            </div>
          </div>`;
      }).join('');

      parts.push(`
        <div>
          <div class="csf-sec-row" onclick="CategorySubmissionFlow._ts('csf-fac-body','csf-fac-arr')">
            <input type="checkbox" class="csf-chk" data-section="__faculty__" data-cat="${catId}"
              ${facAllOn?'checked':''} ${(!facAllOn&&facAnyOn)?'data-ind="1"':''}
              onchange="CategorySubmissionFlow._facSecChg(this,'${catId}')"
              onclick="event.stopPropagation()">
            <span class="csf-sec-icon">👩‍🏫</span>
            <span class="csf-sec-lbl">Faculty Details</span>
            <span class="csf-sec-cnt" id="csf-fac-cnt">${facChkd} / ${facTotal} selected</span>
            <span class="csf-arr" id="csf-fac-arr">▶</span>
          </div>
          <div class="csf-fields" id="csf-fac-body">${facRows}</div>
        </div>`);
    } else {
      parts.push(`
        <div class="csf-sec-row" style="cursor:default">
          <span class="csf-sec-icon">👩‍🏫</span>
          <span class="csf-sec-lbl">Faculty Details</span>
          <span class="csf-sec-cnt" style="color:#bbb">No faculty records submitted yet</span>
        </div>`);
    }

    return parts.join('') || '<div style="padding:1.5rem;text-align:center;color:#bbb">No data found</div>';
  }

  // ─── SCREEN 3: Completion ─────────────────────────────────────────────────
  function showDone() {
    const all=[{label:'Overall',icon:'🏆'},..._saved.map(id=>NIRF_CATS.find(c=>c.id===id)).filter(Boolean)];
    mountOv(`
      <div class="csf-modal">
        <div class="csf-done">
          <div class="csf-done-ico">🎉</div>
          <h2 class="csf-done-h">Submission Complete!</h2>
          <p class="csf-done-p">Your data has been configured for the following ranking categories:</p>
          <div class="csf-badges">
            ${all.map(c=>`<span class="csf-badge">${c.icon} ${c.label}</span>`).join('')}
          </div>
          <p style="font-size:.82rem;color:#aaa;margin-bottom:2rem;line-height:1.6">
            The GSIRF committee will review your submission for each selected category
            before the deadline of <strong>31 Jul 2026</strong>.
          </p>
          <button class="csf-btn csf-gold" style="font-size:.95rem;padding:.7rem 2rem"
                  onclick="CategorySubmissionFlow._dash()">Go to Dashboard →</button>
        </div>
      </div>`);
  }

  // ─── UI updaters ──────────────────────────────────────────────────────────
  function _refreshCnt() {
    const el=document.getElementById('csf-cnt'), btn=document.getElementById('csf-proc');
    if(el) el.textContent=_selected.length;
    if(btn) btn.disabled=_selected.length===0;
  }

  function _updateFCnt(catId) {
    const el=document.getElementById('csf-fcnt'); if(!el) return;
    const fieldAll = document.querySelectorAll(`input.csf-chk[data-path][data-cat="${catId}"]`);
    const fieldChk = document.querySelectorAll(`input.csf-chk[data-path][data-cat="${catId}"]:checked`);
    const facChk   = _facultyData.filter(f=>_facSels[catId]?.[f.id]!==false).length;
    const progChk  = Object.values(_progSels[catId]||{}).filter(Boolean).length;
    const total    = fieldAll.length + _facultyData.length + Object.keys(_progSels[catId]||{}).length;
    const checked  = fieldChk.length + facChk + progChk;
    el.textContent = `${checked} / ${total} included`;
  }

  function _updateFacCnt(catId) {
    const el=document.getElementById('csf-fac-cnt'); if(!el) return;
    const chk=_facultyData.filter(f=>_facSels[catId]?.[f.id]!==false).length;
    el.textContent=`${chk} / ${_facultyData.length} selected`;
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  function _tc(catId) {
    const i=_selected.indexOf(catId);
    if(i>=0){_selected.splice(i,1);document.getElementById(`csf-card-${catId}`)?.classList.remove('sel');}
    else    {_selected.push(catId);  document.getElementById(`csf-card-${catId}`)?.classList.add('sel');}
    _refreshCnt();
  }

  function _skip() {
    if(!confirm('Skip?\nData will count for Overall ranking only.')) return;
    _saved=[]; showDone();
  }

  function _proc() { if(!_selected.length) return; _idx=0; showReview(); }

  function _ts(bodyId, arrowId) {
    document.getElementById(bodyId)?.classList.toggle('open');
    document.getElementById(arrowId)?.classList.toggle('open');
  }

  // Flat section bulk toggle
  function _sc(cb) {
    const catId=cb.dataset.cat, secKey=cb.dataset.section;
    const keys=(cb.dataset.flist||'').split('|').filter(Boolean);
    const on=cb.checked, flat=!!cb.dataset.flat;
    if(!_sels[catId]) _sels[catId]={};
    keys.forEach(k=>{
      const path=flat?k:`${secKey}.${k}`;
      _sels[catId][path]=on;
      const f=document.querySelector(`input.csf-chk[data-path="${path}"][data-cat="${catId}"]`);
      if(f){f.checked=on;f.indeterminate=false;}
    });
    cb.indeterminate=false;
    _updateFCnt(catId);
  }

  // Flat field toggle
  function _fc(cb) {
    const catId=cb.dataset.cat, path=cb.dataset.path, secid=cb.dataset.secid;
    if(!_sels[catId]) _sels[catId]={};
    _sels[catId][path]=cb.checked;
    // sync section checkbox
    if(secid) {
      const secCb=document.querySelector(`input.csf-chk[data-section="${secid}"][data-cat="${catId}"]`);
      if(secCb) {
        const sibs=document.querySelectorAll(`input.csf-chk[data-secid="${secid}"][data-cat="${catId}"]`);
        const t=sibs.length, c=Array.from(sibs).filter(s=>s.checked).length;
        secCb.checked=c>0; secCb.indeterminate=c>0&&c<t;
      }
    }
    _updateFCnt(catId);
  }

  // Program checkbox toggle (intake / strength)
  function _pc(cb) {
    const catId=cb.dataset.cat, pk=cb.dataset.prog, on=cb.checked;
    if(!_progSels[catId]) _progSels[catId]={};
    _progSels[catId][pk]=on;
    // Also cascade to related intake / strength field checkboxes
    if(!_sels[catId]) _sels[catId]={};
    [...intakeFields(pk),...strengthFields(pk)].forEach(k=>{
      _sels[catId][k]=on;
      const f=document.querySelector(`input.csf-chk[data-path="${k}"][data-cat="${catId}"]`);
      if(f){f.checked=on;}
    });
    // Sync parent intake/strength section checkbox
    ['__intake__','__strength__'].forEach(sec=>{
      const secCb=document.querySelector(`input.csf-chk[data-section="${sec}"][data-cat="${catId}"]`);
      if(!secCb) return;
      const plist=(secCb.dataset.proglist||'').split('|').filter(Boolean);
      const allOn=plist.every(p=>_progSels[catId]?.[p]!==false);
      const anyOn=plist.some( p=>_progSels[catId]?.[p]!==false);
      secCb.checked=anyOn; secCb.indeterminate=anyOn&&!allOn;
    });
    _updateFCnt(catId);
  }

  // Intake/Strength section all/none
  function _intSecChange(cb) {
    const catId=cb.dataset.cat, on=cb.checked;
    const plist=(cb.dataset.proglist||'').split('|').filter(Boolean);
    if(!_progSels[catId]) _progSels[catId]={};
    plist.forEach(pk=>{
      _progSels[catId][pk]=on;
      const pcb=document.querySelector(`input.csf-chk[data-prog="${pk}"][data-cat="${catId}"]`);
      if(pcb){pcb.checked=on;pcb.indeterminate=false;}
      if(!_sels[catId]) _sels[catId]={};
      [...intakeFields(pk),...strengthFields(pk)].forEach(k=>{
        _sels[catId][k]=on;
        const f=document.querySelector(`input.csf-chk[data-path="${k}"][data-cat="${catId}"]`);
        if(f) f.checked=on;
      });
    });
    cb.indeterminate=false;
    _updateFCnt(catId);
  }

  // Faculty individual toggle
  function _facChg(cb) {
    const catId=cb.dataset.cat, facId=cb.dataset.facid;
    if(!_facSels[catId]) _facSels[catId]={};
    _facSels[catId][facId]=cb.checked;
    // sync section checkbox
    const secCb=document.querySelector(`input.csf-chk[data-section="__faculty__"][data-cat="${catId}"]`);
    if(secCb){
      const chk=_facultyData.filter(f=>_facSels[catId]?.[f.id]!==false).length;
      const tot=_facultyData.length;
      secCb.checked=chk>0; secCb.indeterminate=chk>0&&chk<tot;
    }
    _updateFacCnt(catId);
    _updateFCnt(catId);
  }

  // Faculty section all/none
  function _facSecChg(cb, catId) {
    const on=cb.checked;
    if(!_facSels[catId]) _facSels[catId]={};
    _facultyData.forEach(f=>{
      _facSels[catId][f.id]=on;
      const fcb=document.querySelector(`input.csf-chk[data-facid="${f.id}"][data-cat="${catId}"]`);
      if(fcb){fcb.checked=on;}
    });
    cb.indeterminate=false;
    _updateFacCnt(catId);
    _updateFCnt(catId);
  }

  // Select / Deselect ALL
  function _all(catId) {
    document.querySelectorAll(`input.csf-chk[data-cat="${catId}"]`).forEach(cb=>{
      cb.checked=true; cb.indeterminate=false;
      if(cb.dataset.path)    { if(!_sels[catId]) _sels[catId]={}; _sels[catId][cb.dataset.path]=true; }
      if(cb.dataset.prog)    { if(!_progSels[catId]) _progSels[catId]={}; _progSels[catId][cb.dataset.prog]=true; }
      if(cb.dataset.facid)   { if(!_facSels[catId]) _facSels[catId]={}; _facSels[catId][cb.dataset.facid]=true; }
    });
    _facultyData.forEach(f=>{ if(!_facSels[catId]) _facSels[catId]={}; _facSels[catId][f.id]=true; });
    _updateFacCnt(catId); _updateFCnt(catId);
  }

  function _none(catId) {
    document.querySelectorAll(`input.csf-chk[data-cat="${catId}"]`).forEach(cb=>{
      cb.checked=false; cb.indeterminate=false;
      if(cb.dataset.path)  { if(!_sels[catId]) _sels[catId]={}; _sels[catId][cb.dataset.path]=false; }
      if(cb.dataset.prog)  { if(!_progSels[catId]) _progSels[catId]={}; _progSels[catId][cb.dataset.prog]=false; }
      if(cb.dataset.facid) { if(!_facSels[catId]) _facSels[catId]={}; _facSels[catId][cb.dataset.facid]=false; }
    });
    _facultyData.forEach(f=>{ if(!_facSels[catId]) _facSels[catId]={}; _facSels[catId][f.id]=false; });
    _updateFacCnt(catId); _updateFCnt(catId);
  }

  // Editable value handler — stores override for this category
  function _edit(inp) {
    const catId = inp.dataset.cat;
    const key   = inp.dataset.editkey;
    if (!_edits[catId]) _edits[catId] = {};
    _edits[catId][key] = inp.value === '' ? '' : Number(inp.value);
  }

  function _back() { showCatSel(); }

  // ─── Save ─────────────────────────────────────────────────────────────────
  async function _save(catId) {
    const btn=document.getElementById('csf-savebtn');
    if(btn){btn.disabled=true;btn.innerHTML='<span class="csf-spin"></span>Saving…';}

    try {
      // Build filtered flat fields — use edited value if user changed it
      const flatFiltered={};
      Object.entries(_sels[catId]||{}).forEach(([k,v])=>{
        if(v!==false && k in (_data||{})) {
          flatFiltered[k] = (_edits[catId]?.[k] !== undefined)
            ? _edits[catId][k]
            : _data[k];
        }
      });

      // Selected program keys
      const selPrograms=Object.entries(_progSels[catId]||{})
        .filter(([,v])=>v!==false).map(([k])=>k);

      // Include intake + strength fields for selected programs (with edits)
      selPrograms.forEach(pk=>{
        [...intakeFields(pk),...strengthFields(pk)].forEach(k=>{
          if (k in (_data||{})) {
            flatFiltered[k] = (_edits[catId]?.[k] !== undefined)
              ? _edits[catId][k]
              : _data[k];
          }
        });
      });

      // Selected faculty IDs
      const selFacultyIds=_facultyData
        .filter(f=>(_facSels[catId]||{})[f.id]!==false)
        .map(f=>f.id);

      // Compose what gets stored
      const dataToSave={
        ...flatFiltered,
        _selected_programs: selPrograms,
        _faculty_ids:       selFacultyIds,
        _faculty_count:     selFacultyIds.length,
      };

      // Resolve institute ID
      let instId=_instId;
      if(!instId){
        const {data:{user}}=await _sb.auth.getUser();
        if(user){
          const {data:inst}=await _sb.from('institutes').select('id').eq('email',user.email).single();
          instId=inst?.id;
        }
      }

      const {error}=await _sb.from('gsirf_category_submissions')
        .upsert({
          institute_id:instId, overall_submission_id:_subId,
          category:catId, data:dataToSave,
          status:'submitted',
          submitted_at:new Date().toISOString(), updated_at:new Date().toISOString(),
        },{onConflict:'institute_id,category'});

      if(error) throw error;

      _saved.push(catId);
      _idx++;
      if(_idx<_selected.length) showReview(); else showDone();

    } catch(err) {
      console.error('[CSF]',err);
      if(btn){btn.disabled=false;btn.innerHTML=_idx<_selected.length-1?'Save & Next →':'✓ Save & Finish';}
      alert('Could not save. Please try again.\n\n'+(err.message||''));
    }
  }

  function _dash(){ removeOv(); window.location.href='dashboard.html'; }

  // ─── Public API ───────────────────────────────────────────────────────────
  async function init(supabaseClient, submissionId, formData, instituteUserId) {
    _sb       = supabaseClient;
    _subId    = submissionId;
    _data     = formData;
    _instId   = instituteUserId||null;
    _selected = []; _idx=0; _sels={}; _progSels={}; _facSels={}; _edits={}; _saved=[];
    _facultyData=[];

    injectStyles();

    // Show loading while fetching faculty
    mountOv(`<div class="csf-modal" style="padding:2rem"><div class="csf-loading">
      <span class="csf-spin" style="border-top-color:#d4a017;border-color:#e5e7eb;display:inline-block;width:20px;height:20px;"></span>
      &nbsp; Loading your data…
    </div></div>`);

    // Fetch faculty from Supabase
    try {
      const instId=_instId;
      if(instId){
        const {data:fac}=await _sb.from('gsirf_faculty')
          .select('id,name,designation,highest_degree,teaching_exp,working,association')
          .eq('institute_id',instId)
          .order('name');
        _facultyData=fac||[];
      }
    } catch(e){ console.warn('[CSF] faculty fetch failed',e); }

    showCatSel();
  }

  global.CategorySubmissionFlow={
    init,
    _tc,_skip,_proc,_ts,_sc,_fc,_pc,_intSecChange,
    _facChg,_facSecChg,_all,_none,_back,_edit,_save,_dash,
  };

})(window);
