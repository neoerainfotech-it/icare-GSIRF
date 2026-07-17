/**
 * GARVI — Category Submission Flow  (v2 — row-level selection)
 * =============================================================
 * Handles post-submission per-category configuration.
 *
 * After the overall submission saves, call:
 * CategorySubmissionFlow.init(null, submissionId, formData, instituteUserId)
 *
 * Migrated completely from Supabase to native Express API endpoints.
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

  // ─── Program definitions ──────────────────────────────────────────────────
  const PROGRAMS = [
    { key:'ug3', label:'UG [3 Years]',         dur:3 },
    { key:'ug4', label:'UG [4 Years]',         dur:4 },
    { key:'ug5', label:'UG [5 Years]',         dur:5 },
    { key:'ug6', label:'UG [6 Years]',         dur:6 },
    { key:'pg1', label:'PG [1 Year]',          dur:1 },
    { key:'pg2', label:'PG [2 Years]',         dur:2 },
    { key:'pg3', label:'PG [3 Years]',         dur:3 },
    { key:'pgi', label:'PG-Integrated [5 Yrs]', dur:5 },
    { key:'pg6', label:'PG [6 Years]',         dur:6 },
  ];

  function intakeYears(dur) {
    const yrs = [];
    for (let i = 0; i < Math.min(dur, 6); i++) yrs.push(`${2025-i}-${String(2026-i).slice(-2)}`);
    return yrs;
  }

  function intakeFields(key) {
    const p = PROGRAMS.find(x => x.key === key);
    if (!p) return [];
    return intakeYears(p.dur).map(yr => `intake_${key}_${yr.replace('-','')}`);
  }

  const STR_SUFFIXES = ['m','f','t','tot','ws','os','oc','eb','sc','fee_gov','fee_inst','fee_pvt','fee_none'];
  function strengthFields(key) {
    return STR_SUFFIXES.map(s => `str_${key}_${s}`);
  }

  const STR_LABELS = {
    m:'Male Students', f:'Female Students', t:'Transgender Students', tot:'Total Students',
    ws:'Within State', os:'Outside State', oc:'Outside Country',
    eb:'Economically Backward', sc:'Socially Challenged (SC+ST+OBC)',
    fee_gov:'Fee Reimbursement — State/Central Govt',
    fee_inst:'Fee Reimbursement — Institution Funds',
    fee_pvt:'Fee Reimbursement — Private Bodies',
    fee_none:'Not Receiving Full Fee Reimbursement',
  };

  const FLAT_GROUPS = [
    { key:'g1',   label:'Institute Profile & Registration', icon:'📋', test: k => k.startsWith('s1_') },
    { key:'g_phd',label:'Ph.D. Student Details',          icon:'🔬', test: k => k.startsWith('phd_') },
    { key:'g_slp',label:'Sustainable Living Practices',   icon:'🌿', test: k => k.startsWith('slp_') || k.startsWith('radio_slp') },
    { key:'g_acc',label:'Accreditation',                   icon:'🏅', test: k => k.startsWith('naac_') || k.startsWith('nba_') },
    { key:'g_nep',label:'Multiple Entry/Exit & NEP',       icon:'🔄', test: k => k.startsWith('nep_') },
    { key:'g_ipr',label:'Research, Publications & IPR',   icon:'💡', test: k => k.startsWith('ipr_') },
    { key:'g_ab', label:'About Institute',                 icon:'🏛️', test: k => k.startsWith('about_') },
    { key:'g_dec',label:'Declaration',                     icon:'📢', test: k => k.startsWith('s8_') || k === 'declarationCheck' },
  ];

  const FIELD_LABELS = {
    s1_gsirfId:'GSIRF ID', s1_instName:'Institution Name', s1_instType:'Institution Type',
    s1_affiliatedUniv:'Affiliated University', s1_city:'City', s1_district:'District',
    s1_nodalName:'Nodal Officer Name', s1_nodalDesig:'Nodal Officer Designation',
    s1_email:'Email', s1_mobile:'Mobile', s1_submitDate:'Submission Date', s1_isRevised:'Revised Submission',
    phd_ft_current:'Full-Time Ph.D. Scholars (Current)', phd_pt_current:'Part-Time Ph.D. Scholars (Current)', phd_total_current:'Total Ph.D. Scholars (Current)',
    phd_grad_ft_2526:'FT Graduated 2025-26', phd_grad_ft_2425:'FT Graduated 2024-25', phd_grad_ft_2324:'FT Graduated 2023-24',
    phd_grad_pt_2526:'PT Graduated 2025-26', phd_grad_pt_2425:'PT Graduated 2024-25', phd_grad_pt_2324:'PT Graduated 2023-24',
    phd_med_pursuing:'Medical Ph.D. (Pursuing)', phd_med_grad_2526:'Medical Ph.D. Graduated 2025-26', phd_med_grad_2425:'Medical Ph.D. Graduated 2024-25', phd_med_grad_2324:'Medical Ph.D. Graduated 2023-24',
    naac_accred:'NAAC Accreditation', naac_grade:'NAAC Grade', naac_cgpa:'NAAC CGPA', naac_valid:'NAAC Validity', nba_accred:'NBA Accreditation',
    nba_total_progs:'Total Programs', nba_accred_progs:'NBA Accredited Programs', nep_yes:'NEP Implemented', nep_no:'NEP Not Implemented',
    ipr_pub_2025:'Publications 2024-25', ipr_pub_2024:'Publications 2023-24', ipr_pub_2023:'Publications 2022-23',
    ipr_grant_2025:'Research Grants 2024-25 (₹)', ipr_grant_2024:'Research Grants 2023-24 (₹)', ipr_grant_2023:'Research Grants 2022-23 (₹)',
    about_campuses:'List of Campuses', about_constituent:'Constituent Colleges', s8_signatoryName:'Authorised Signatory Name', s8_signatoryDate:'Submission Date', declarationCheck:'Declaration Agreed',
  };

  const SKIP_KEYS = new Set(['faculty_count','_selectedPrograms']);
  const isSkip = k => SKIP_KEYS.has(k) || k.startsWith('intake_') || k.startsWith('str_');

  // ─── State ────────────────────────────────────────────────────────────────
  let _subId        = null;
  let _data         = null;
  let _instId       = null;
  let _selected     = [];
  let _idx          = 0;
  let _sels         = {};
  let _progSels     = {};
  let _facSels      = {};
  let _edits        = {};
  let _facultyData  = [];
  let _saved        = [];

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const fLabel = k => {
    const intM = k.match(/^intake_(\w+)_(\d+)$/);
    if (intM) {
      const prog = PROGRAMS.find(p => p.key === intM[1]);
      return `${prog?.label || intM[1]} — Intake ${intM[2].replace(/(\d{4})(\d{2})/, '$1-$2')}`;
    }
    const strM = k.match(/^str_(\w+)_(.+)$/);
    if (strM) {
      const prog = PROGRAMS.find(p => p.key === strM[1]);
      return `${prog?.label || strM[1]} — ${STR_LABELS[strM[2]] || strM[2]}`;
    }
    return FIELD_LABELS[k] || k.replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
  };

  function fmtVal(v) {
    if (v===null||v===undefined) return '—';
    if (typeof v=='bit' || typeof v=='boolean') return v ? 'Yes' : 'No';
    const s=String(v); return s.length>42?s.slice(0,39)+'…':s;
  }

  function isNumeric(v) {
    if (v===null||v===undefined||v===''||typeof v==='boolean') return false;
    return !isNaN(Number(v)) && String(v).trim()!=='';
  }

  function valCell(k, v, catId) {
    if (isNumeric(v)) {
      return `<input type="number" class="csf-fval-inp" value="${v}" min="0" data-editkey="${k}" data-cat="${catId}" oninput="CategorySubmissionFlow._edit(this)" onclick="event.stopPropagation()">`;
    }
    return `<span class="csf-fval" title="${v}">${fmtVal(v)}</span>`;
  }

  function selectedPrograms() {
    const sp = _data?._selectedPrograms;
    if (!Array.isArray(sp)) return [];
    return sp.filter(p => p.checked).map(p => p.key);
  }

  function injectStyles() {
    if (document.getElementById('csf-styles')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="csf-styles">
      .csf-ov{position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);animation:csfIn .2s ease}
      @keyframes csfIn{from{opacity:0}to{opacity:1}}
      .csf-modal{background:#fff;border-radius:12px;width:100%;max-width:850px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 40px rgba(0,0,0,0.1);border:1px solid #e2e8f0;animation:csfUp .2s ease}
      @keyframes csfUp{from{transform:translateY(15px);opacity:0}to{transform:translateY(0);opacity:1}}
      .csf-head{padding:1.25rem 1.75rem;border-b:1px solid #e2e8f0;flex-shrink:0;border-bottom:1px solid #f1f5f9}
      .csf-body{padding:1.25rem 1.75rem;overflow-y:auto;flex:1;min-height:0}
      .csf-foot{padding:1rem 1.75rem;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;background:#f8fafc}
      .csf-h1{font-size:1.2rem;font-weight:800;color:#0f172a;margin:0 0 .2rem}
      .csf-sub{font-size:.85rem;color:#475569;line-height:1.5;margin:0}
      .csf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.5rem}
      .csf-card{border:1px solid #e2e8f0;border-radius:8px;padding:.75rem;cursor:pointer;transition:all .15s;position:relative;background:#fff}
      .csf-card:hover{border-color:#D58B00;background:#fffbeb;transform:translateY(-1px)}
      .csf-card.sel{border-color:#D58B00;background:#fff9db}
      .csf-card .ci{font-size:1.25rem;margin-bottom:.2rem}
      .csf-card .cl{font-size:.75rem;font-weight:700;color:#0f172a}
      .csf-card .cd{font-size:.65rem;color:#64748b;line-height:1.3;margin-top:2px}
      .csf-pill{position:absolute;top:.35rem;right:.35rem;width:16px;height:16px;border-radius:50%;border:1.5px solid #D58B00;background:#fff;display:flex;align-items:center;justify-content:center;font-size:.55rem;color:#fff}
      .csf-card.sel .csf-pill{background:#D58B00}
      .csf-btn{padding:.5rem 1.25rem;border-radius:6px;font-size:.8rem;font-weight:700;cursor:pointer;border:none;transition:all .1s;line-height:1}
      .csf-gold{background:#D58B00;color:#fff}
      .csf-gold:hover{background:#b27700}
      .csf-gold:disabled{background:#cbd5e1;color:#94a3b8;cursor:not-allowed}
      .csf-out{background:#fff;color:#334155;border:1px solid #cbd5e1}
      .csf-out:hover{background:#f8fafc}
      .csf-skip{font-size:.78rem;color:#64748b;background:none;border:none;text-decoration:underline;cursor:pointer}
      .csf-info{background:#fffbeb;border:1px solid #fef3c7;border-radius:6px;padding:.6rem .8rem;font-size:.8rem;color:#92400e;margin-bottom:1rem}
      .csf-steps{display:flex;gap:4px;margin-bottom:4px}
      .csf-step{flex:1;height:4px;border-radius:4px;background:#e2e8f0}
      .csf-step.done{background:#16a34a}.csf-step.act{background:#D58B00}
      .csf-tree{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
      .csf-sec-row{display:flex;align-items:center;gap:.5rem;padding:.65rem .85rem;background:#f8fafc;cursor:pointer;border-bottom:1px solid #e2e8f0;user-select:none}
      .csf-sec-row:hover{background:#f1f5f9}
      .csf-sec-lbl{font-weight:700;font-size:.82rem;color:#1e293b;flex:1}
      .csf-sec-cnt{font-size:.7rem;color:#64748b}
      .csf-arr{font-size:.6rem;color:#64748b;transition:transform .15s}
      .csf-arr.open{transform:rotate(90deg)}
      .csf-fields{display:none;background:#fff;border-bottom:1px solid #e2e8f0}
      .csf-fields.open{display:block}
      .csf-field{display:flex;align-items:center;gap:.5rem;padding:.4rem .85rem .4rem 2.25rem;border-bottom:1px solid #f1f5f9}
      .csf-fkey{font-size:.78rem;color:#334155;font-weight:500;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .csf-fval{font-size:.74rem;color:#94a3b8;font-style:italic}
      input[type="number"].csf-fval-inp{width:75px!important;max-width:75px!important;text-align:right!important;border:1px solid #cbd5e1!important;border-radius:4px!important;padding:2px 4px!important;font-size:.78rem!important;background:#f8fafc!important}
      input[type="number"].csf-fval-inp:focus{border-color:#D58B00!important;background:#fff!important;outline:none!important}
      .csf-prog-block{border-bottom:1px solid #e2e8f0}
      .csf-prog-head{display:flex;align-items:center;gap:.5rem;padding:.5rem .85rem .5rem 1.75rem;background:#f0f7ff;cursor:pointer;user-select:none;border-bottom:1px solid #e2e8f0}
      .csf-prog-lbl{font-size:.78rem;font-weight:700;color:#1d4ed8;flex:1}
      .csf-prog-fields{display:none;background:#fafcff}
      .csf-prog-fields.open{display:block}
      .csf-sub-field{display:flex;align-items:center;gap:.5rem;padding:.35rem .85rem .35rem 3rem;border-bottom:1px solid #f1f5f9}
      .csf-fac-row{display:flex;align-items:center;gap:.6rem;padding:.45rem .85rem .45rem 2.25rem;border-bottom:1px solid #f1f5f9}
      .csf-fac-name{display:block;font-size:.8rem;font-weight:700;color:#0f172a}
      .csf-fac-meta{display:block;font-size:.7rem;color:#64748b}
      .csf-fac-badge{display:inline-block;font-size:.62rem;font-weight:700;padding:1px 4px;border-radius:4px;margin-left:4px}
      .bg-blue{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}
      .bg-green{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}
      .bg-purple{background:#faf5ff;color:#7e22ce;border:1px solid #e9d5ff}
      input.csf-chk{accent-color:#D58B00;cursor:pointer;width:13px;height:14px}
      .csf-tools{display:flex;gap:.35rem;margin-bottom:.6rem}
      .csf-tbtn{padding:.25rem .6rem;border-radius:4px;font-size:.72rem;font-weight:700;cursor:pointer;border:1px solid #e2e8f0;background:#fff;color:#475569}
      .csf-tbtn:hover{border-color:#D58B00;color:#D58B00}
      .csf-done{text-align:center;padding:2.5rem 1.5rem}
      .csf-done-ico{font-size:3rem;margin-bottom:.5rem}
      .csf-badges{display:flex;flex-wrap:wrap;gap:.35rem;justify-content:center;margin-bottom:1.5rem}
      .csf-badge{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:.2rem .6rem;border-radius:12px;font-size:.75rem;font-weight:700}
      .csf-spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:csfSp .5s linear infinite;margin-right:4px;vertical-align:middle}
      @keyframes csfSp{to{transform:rotate(360deg)}}
    </style>`);
  }

  function removeOv() { document.getElementById('csf-ov')?.remove(); }
  
  function mountOv(html) {
    removeOv();
    const d=document.createElement('div');
    d.className='csf-ov'; d.id='csf-ov'; d.innerHTML=html;
    document.body.appendChild(d);
    requestAnimationFrame(() => {
      document.querySelectorAll('input.csf-chk[data-ind="1"]').forEach(cb=>{ cb.indeterminate=true; cb.checked=true; });
    });
    return d;
  }

  // ─── SCREEN 1 ─────────────────────────────────────────────────────────────
  function showCatSel() {
    const cards = NIRF_CATS.map(c=>`
      <div class="csf-card ${_selected.includes(c.id)?'sel':''}" id="csf-card-${c.id}" onclick="CategorySubmissionFlow._tc('${c.id}')">
        <div class="csf-pill" id="csf-pill-${c.id}">✓</div>
        <div class="ci">${c.icon}</div>
        <div class="cl">${c.label}</div>
        <div class="cd">${c.desc}</div>
      </div>`).join('');

    mountOv(`
      <div class="csf-modal">
        <div class="csf-head">
          <h2 class="csf-h1">🏆 Select Ranking Categories</h2>
          <p class="csf-sub">Your data is configured under <strong>Overall</strong> automatically. Select individual categories to map data records directly.</p>
        </div>
        <div class="csf-body">
          <div class="csf-info">Configure matching <strong>faculty, program intake, and metrics data</strong> targets for each selected framework category below.</div>
          <div class="csf-grid">${cards}</div>
          <p style="text-align:center;font-size:.75rem;color:#64748b;margin-top:.75rem">
            <span id="csf-cnt">0</span> categories selected
          </p>
        </div>
        <div class="csf-foot">
          <button class="csf-skip" onclick="CategorySubmissionFlow._skip()">Skip — Overall only</button>
          <button class="csf-btn csf-gold" id="csf-proc" onclick="CategorySubmissionFlow._proc()" ${_selected.length===0?'disabled':''}>Configure Categories →</button>
        </div>
      </div>`);
    _refreshCnt();
  }

  // ─── SCREEN 2 ─────────────────────────────────────────────────────────────
  function showReview() {
    const catId = _selected[_idx];
    const cat   = NIRF_CATS.find(c=>c.id===catId);
    const isLast = _idx===_selected.length-1;

    if (!_sels[catId])      _sels[catId]    = _buildFlatSels();
    if (!_progSels[catId]) _progSels[catId] = _buildProgSels();
    if (!_facSels[catId]) {
      _facSels[catId]={};
      _facultyData.forEach(f=>{ _facSels[catId][f.id]=true; });
    }

    const steps = _selected.map((id,i)=>{
      const cls=i<_idx?'done':i===_idx?'act':'';
      return `<div class="csf-step ${cls}"></div>`;
    }).join('');

    mountOv(`
      <div class="csf-modal">
        <div class="csf-head">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
            <span style="font-size:1.5rem">${cat.icon}</span>
            <div>
              <h2 class="csf-h1" style="margin-bottom:0">${cat.label} Data Mapping</h2>
              <span style="font-size:.7rem;color:#64748b">Category ${_idx+1} of ${_selected.length}</span>
            </div>
          </div>
          <div class="csf-steps">${steps}</div>
        </div>
        <div class="csf-body">
          <div class="csf-info">Uncheck data rows or adjust specific metrics fields to map your core dataset accurately to this stream.</div>
          <div class="csf-tools">
            <button class="csf-tbtn" onclick="CategorySubmissionFlow._all('${catId}')">✓ Select All</button>
            <button class="csf-tbtn" onclick="CategorySubmissionFlow._none('${catId}')">✗ Deselect All</button>
          </div>
          <div class="csf-tree" id="csf-tree">${buildTree(catId)}</div>
        </div>
        <div class="csf-foot">
          <button class="csf-btn csf-out" onclick="CategorySubmissionFlow._back()">← Back</button>
          <div style="display:flex;align-items:center;gap:.5rem">
            <span class="csf-fcnt" id="csf-fcnt" style="font-size:.75rem;color:#475569"></span>
            <button class="csf-btn csf-gold" id="csf-savebtn" onclick="CategorySubmissionFlow._save('${catId}')">
              ${isLast?'✓ Save & Finish':'Save & Next →'}
            </button>
          </div>
        </div>
      </div>`);

    _updateFCnt(catId);
  }

  function _buildFlatSels() {
    const out={}; if (!_data) return out;
    Object.keys(_data).forEach(k=>{ if(!isSkip(k)) out[k]=true; });
    return out;
  }

  function _buildProgSels() {
    const out={}; selectedPrograms().forEach(k=>{ out[k]=true; });
    return out;
  }

  function buildTree(catId) {
    const parts = [];

    FLAT_GROUPS.forEach((grp, gi) => {
      const fields = Object.keys(_data||{}).filter(k=>!isSkip(k)&&grp.test(k));
      if (!fields.length) return;

      const allOn  = fields.every(k=>_sels[catId]?.[k]!==false);
      const anyOn  = fields.some( k=>_sels[catId]?.[k]!==false);

      const rows = fields.map(k=>{
        const chk=_sels[catId]?.[k]!==false;
        const curVal = _edits[catId]?.[k] !== undefined ? _edits[catId][k] : (_data[k]);
        return `<div class="csf-field">
          <input type="checkbox" class="csf-chk" data-path="${k}" data-cat="${catId}" data-secid="${grp.key}" ${chk?'checked':''} onchange="CategorySubmissionFlow._fc(this)">
          <span class="csf-fkey">${fLabel(k)}</span>
          ${valCell(k, curVal, catId)}
        </div>`;
      }).join('');

      const uid=`flat-${gi}`;
      parts.push(`
        <div>
          <div class="csf-sec-row" onclick="CategorySubmissionFlow._ts('csf-fb-${uid}','csf-fa-${uid}')">
            <input type="checkbox" class="csf-chk" data-section="${grp.key}" data-cat="${catId}" data-flist="${fields.join('|')}" data-flat="1" ${allOn?'checked':''} ${(!allOn&&anyOn)?'data-ind="1"':''} onchange="CategorySubmissionFlow._sc(this)" onclick="event.stopPropagation()">
            <span class="csf-sec-lbl" style="margin-left:6px">${grp.icon} ${grp.label}</span>
            <span class="csf-sec-cnt">${fields.length} fields &nbsp;</span>
            <span class="csf-arr" id="csf-fa-${uid}">▶</span>
          </div>
          <div class="csf-fields" id="csf-fb-${uid}">${rows}</div>
        </div>`);
    });

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
            <input type="checkbox" class="csf-chk" data-path="${k}" data-cat="${catId}" data-secid="intake_${pk}" ${chk?'checked':''} onchange="CategorySubmissionFlow._fc(this)">
            <span class="csf-fkey">Intake Year ${yr}</span>
            <input type="number" class="csf-fval-inp" value="${curVal||0}" min="0" data-editkey="${k}" data-cat="${catId}" oninput="CategorySubmissionFlow._edit(this)" onclick="event.stopPropagation()">
          </div>`;
        }).join('');

        return `
          <div class="csf-prog-block">
            <div class="csf-prog-head" onclick="CategorySubmissionFlow._ts('csf-ib-${pi}','csf-ia-${pi}')">
              <input type="checkbox" class="csf-chk" data-prog="${pk}" data-cat="${catId}" ${pOn?'checked':''} onchange="CategorySubmissionFlow._pc(this)" onclick="event.stopPropagation()">
              <span class="csf-prog-lbl">${prog?.label||pk}</span>
              <span class="csf-prog-arr" id="csf-ia-${pi}">▶</span>
            </div>
            <div class="csf-prog-fields" id="csf-ib-${pi}">${subRows||'<div class="csf-sub-field" style="color:#94a3b8;font-size:.75rem">No intake configurations.</div>'}</div>
          </div>`;
      }).join('');

      parts.push(`
        <div>
          <div class="csf-sec-row" onclick="CategorySubmissionFlow._ts('csf-int-body','csf-int-arr')">
            <input type="checkbox" class="csf-chk" data-section="__intake__" data-cat="${catId}" data-proglist="${progKeys.join('|')}" ${intAllOn?'checked':''} ${(!intAllOn&&intAnyOn)?'data-ind="1"':''} onchange="CategorySubmissionFlow._intSecChange(this)" onclick="event.stopPropagation()">
            <span class="csf-sec-lbl" style="margin-left:6px">📝 Sanctioned (Approved) Intake</span>
            <span class="csf-sec-cnt">${progKeys.length} items &nbsp;</span>
            <span class="csf-arr" id="csf-int-arr">▶</span>
          </div>
          <div class="csf-fields" id="csf-int-body">${progBlocks}</div>
        </div>`);
    }

    if (progKeys.length) {
      const strAllOn = progKeys.every(pk=>_progSels[catId]?.[pk]!==false);
      const strAnyOn = progKeys.some( pk=>_progSels[catId]?.[pk]!==false);

      const strBlocks = progKeys.map((pk,pi)=>{
        const prog  = PROGRAMS.find(p=>p.key===pk);
        const sKeys = strengthFields(pk).filter(k=>k in (_data||{}));
        const pOn   = _progSels[catId]?.[pk]!==false;
        const si    = 100+pi;

        const subRows = sKeys.map(k=>{
          const chk = pOn && (_sels[catId]?.[k]!==false);
          const sfx = k.replace(`str_${pk}_`,'');
          const curVal = _edits[catId]?.[k] !== undefined ? _edits[catId][k] : (_data?.[k]);
          return `<div class="csf-sub-field">
            <input type="checkbox" class="csf-chk" data-path="${k}" data-cat="${catId}" data-secid="str_${pk}" ${chk?'checked':''} onchange="CategorySubmissionFlow._fc(this)">
            <span class="csf-fkey">${STR_LABELS[sfx]||sfx}</span>
            <input type="number" class="csf-fval-inp" value="${curVal||0}" min="0" data-editkey="${k}" data-cat="${catId}" oninput="CategorySubmissionFlow._edit(this)" onclick="event.stopPropagation()">
          </div>`;
        }).join('');

        return `
          <div class="csf-prog-block">
            <div class="csf-prog-head" onclick="CategorySubmissionFlow._ts('csf-sb-${si}','csf-sa-${si}')">
              <input type="checkbox" class="csf-chk" data-prog="${pk}" data-cat="${catId}" ${pOn?'checked':''} onchange="CategorySubmissionFlow._pc(this)" onclick="event.stopPropagation()">
              <span class="csf-prog-lbl">${prog?.label||pk}</span>
              <span class="csf-prog-arr" id="csf-sa-${si}">▶</span>
            </div>
            <div class="csf-prog-fields" id="csf-sb-${si}">${subRows||'<div class="csf-sub-field" style="color:#94a3b8;font-size:.75rem">No strength configurations.</div>'}</div>
          </div>`;
      }).join('');

      parts.push(`
        <div>
          <div class="csf-sec-row" onclick="CategorySubmissionFlow._ts('csf-str-body','csf-str-arr')">
            <input type="checkbox" class="csf-chk" data-section="__strength__" data-cat="${catId}" data-proglist="${progKeys.join('|')}" ${strAllOn?'checked':''} ${(!strAllOn&&strAnyOn)?'data-ind="1"':''} onchange="CategorySubmissionFlow._intSecChange(this)" onclick="event.stopPropagation()">
            <span class="csf-sec-lbl" style="margin-left:6px">🎓 Student Strength Metrics</span>
            <span class="csf-sec-cnt">${progKeys.length} items &nbsp;</span>
            <span class="csf-arr" id="csf-str-arr">▶</span>
          </div>
          <div class="csf-fields" id="csf-str-body">${strBlocks}</div>
        </div>`);
    }

    const facSel  = _facSels[catId]||{};
    const facTotal= _facultyData.length;
    const facChkd = _facultyData.filter(f=>facSel[f.id]!==false).length;
    const facAllOn= facTotal>0 && facChkd===facTotal;
    const facAnyOn= facChkd>0;

    if (facTotal > 0) {
      const facRows = _facultyData.map((f)=>{
        const chk   = facSel[f.id]!==false;
        const exp   = f.teaching_exp ? Math.floor(f.teaching_exp/12)+' yrs' : '0 yrs';
        return `
          <div class="csf-fac-row">
            <input type="checkbox" class="csf-chk csf-fac-chk" data-facid="${f.id}" data-cat="${catId}" ${chk?'checked':''} onchange="CategorySubmissionFlow._facChg(this)">
            <div style="flex:1;min-width:0;margin-left:6px">
              <span class="csf-fac-name">${f.name||'—'}</span>
              <span class="csf-fac-meta">
                ${f.designation||'Faculty'}
                <span class="csf-fac-badge bg-blue">${f.highest_degree||'—'}</span>
                <span class="csf-fac-badge bg-green">Exp: ${exp}</span>
              </span>
            </div>
          </div>`;
      }).join('');

      parts.push(`
        <div>
          <div class="csf-sec-row" onclick="CategorySubmissionFlow._ts('csf-fac-body','csf-fac-arr')">
            <input type="checkbox" class="csf-chk" data-section="__faculty__" data-cat="${catId}" ${facAllOn?'checked':''} ${(!facAllOn&&facAnyOn)?'data-ind="1"':''} onchange="CategorySubmissionFlow._facSecChg(this,'${catId}')" onclick="event.stopPropagation()">
            <span class="csf-sec-lbl" style="margin-left:6px">👩‍🏫 Faculty Rosters</span>
            <span class="csf-sec-cnt" id="csf-fac-cnt">${facChkd} / ${facTotal} selected &nbsp;</span>
            <span class="csf-arr" id="csf-fac-arr">▶</span>
          </div>
          <div class="csf-fields" id="csf-fac-body">${facRows}</div>
        </div>`);
    } else {
      parts.push(`
        <div class="csf-sec-row" style="cursor:default">
          <span class="csf-sec-lbl" style="margin-left:6px">👩‍🏫 Faculty Details</span>
          <span class="csf-sec-cnt">No active faculty found.</span>
        </div>`);
    }

    return parts.join('');
  }

  // ─── SCREEN 3 ─────────────────────────────────────────────────────────────
  function showDone() {
    const all=[{label:'Overall',icon:'🏆'},..._saved.map(id=>NIRF_CATS.find(c=>c.id===id)).filter(Boolean)];
    mountOv(`
      <div class="csf-modal" style="max-w:500px">
        <div class="csf-done">
          <div class="csf-done-ico">🎉</div>
          <h2 class="csf-done-h">Submission Finalized</h2>
          <p class="csf-done-p">Your dataset mappings are completely synchronized across selected scopes:</p>
          <div class="csf-badges">
            ${all.map(c=>`<span class="csf-badge">${c.icon} ${c.label}</span>`).join('')}
          </div>
          <button class="csf-btn csf-gold" style="width:100%;padding:.65rem" onclick="CategorySubmissionFlow._dash()">Exit to Dashboard</button>
        </div>
      </div>`);
  }

  // ─── CORE PROPERTY UI MUTATOR INTERFACES ──────────────────────────────────
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
    const total    = fieldAll.length + _facultyData.length;
    const checked  = fieldChk.length + facChk;
    el.textContent = `${checked} / ${total} items mapped`;
  }

  function _updateFacCnt(catId) {
    const el=document.getElementById('csf-fac-cnt'); if(!el) return;
    const chk=_facultyData.filter(f=>_facSels[catId]?.[f.id]!==false).length;
    el.textContent=`${chk} / ${_facultyData.length} selected &nbsp;`;
  }

  function _tc(catId) {
    const i=_selected.indexOf(catId);
    if(i>=0){_selected.splice(i,1);document.getElementById(`csf-card-${catId}`)?.classList.remove('sel');}
    else    {_selected.push(catId);  document.getElementById(`csf-card-${catId}`)?.classList.add('sel');}
    _refreshCnt();
  }

  function _skip() {
    if(!confirm('Map submission configurations to Overall framework profiles only?')) return;
    _saved=[]; showDone();
  }

  function _proc() { if(!_selected.length) return; _idx=0; showReview(); }
  
  function _ts(bodyId, arrowId) { 
    document.getElementById(bodyId)?.classList.toggle('open'); 
    document.getElementById(arrowId)?.classList.toggle('open'); 
  }

  function _sc(cb) {
    const catId=cb.dataset.cat;
    const keys=(cb.dataset.flist||'').split('|').filter(Boolean);
    const on=cb.checked;
    if(!_sels[catId]) _sels[catId]={};
    keys.forEach(k=>{
      _sels[catId][k]=on;
      const f=document.querySelector(`input.csf-chk[data-path="${k}"][data-cat="${catId}"]`);
      if(f){f.checked=on; f.indeterminate=false;}
    });
    cb.indeterminate=false;
    _updateFCnt(catId);
  }

  function _fc(cb) {
    const catId=cb.dataset.cat, path=cb.dataset.path, secid=cb.dataset.secid;
    if(!_sels[catId]) _sels[catId]={};
    _sels[catId][path]=cb.checked;
    if(secid) {
      const secCb=document.querySelector(`input.csf-chk[data-section="${secid}"][data-cat="${catId}"]`);
      if(secCb) {
        const sibs=document.querySelectorAll(`input.csf-chk[data-secid="${secid}"][data-cat="${catId}"]`);
        const c=Array.from(sibs).filter(s=>s.checked).length;
        secCb.checked=c>0; secCb.indeterminate=c>0&&c<sibs.length;
      }
    }
    _updateFCnt(catId);
  }

  function _pc(cb) {
    const catId=cb.dataset.cat, pk=cb.dataset.prog, on=cb.checked;
    if(!_progSels[catId]) _progSels[catId]={};
    _progSels[catId][pk]=on;
    if(!_sels[catId]) _sels[catId]={};
    [...intakeFields(pk),...strengthFields(pk)].forEach(k=>{
      _sels[catId][k]=on;
      const f=document.querySelector(`input.csf-chk[data-path="${k}"][data-cat="${catId}"]`);
      if(f){f.checked=on;}
    });
    ['__intake__','__strength__'].forEach(sec=>{
      const secCb=document.querySelector(`input.csf-chk[data-section="${sec}"][data-cat="${catId}"]`);
      if(!secCb) return;
      const plist=(secCb.dataset.proglist||'').split('|').filter(Boolean);
      const anyOn=plist.some( p=>_progSels[catId]?.[p]!==false);
      secCb.checked=anyOn; secCb.indeterminate=anyOn && !plist.every(p=>_progSels[catId]?.[p]!==false);
    });
    _updateFCnt(catId);
  }

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

  function _facChg(cb) {
    const catId=cb.dataset.cat, facId=cb.dataset.facid;
    if(!_facSels[catId]) _facSels[catId]={};
    _facSels[catId][facId]=cb.checked;
    const secCb=document.querySelector(`input.csf-chk[data-section="__faculty__"][data-cat="${catId}"]`);
    if(secCb){
      const chk=_facultyData.filter(f=>_facSels[catId]?.[f.id]!==false).length;
      secCb.checked=chk>0; secCb.indeterminate=chk>0&&chk<_facultyData.length;
    }
    _updateFacCnt(catId);
    _updateFCnt(catId);
  }

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

  function _all(catId) {
    document.querySelectorAll(`input.csf-chk[data-cat="${catId}"]`).forEach(cb=>{
      cb.checked=true; cb.indeterminate=false;
      if(cb.dataset.path)  { if(!_sels[catId]) _sels[catId]={}; _sels[catId][cb.dataset.path]=true; }
      if(cb.dataset.prog)  { if(!_progSels[catId]) _progSels[catId]={}; _progSels[catId][cb.dataset.prog]=true; }
      if(cb.dataset.facid) { if(!_facSels[catId]) _facSels[catId]={}; _facSels[catId][cb.dataset.facid]=true; }
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

  function _edit(inp) {
    const catId = inp.dataset.cat;
    const key   = inp.dataset.editkey;
    if (!_edits[catId]) _edits[catId] = {};
    _edits[catId][key] = inp.value === '' ? '' : Number(inp.value);
  }

  function _back() { showCatSel(); }

  // ─── EXPRESS REGISTRY POST SYNCHRONIZER ───────────────────────────────────
  async function _save(catId) {
    const btn=document.getElementById('csf-savebtn');
    if(btn){btn.disabled=true; btn.innerHTML='<span class="csf-spin"></span>Saving…';}

    try {
      const flatFiltered={};
      Object.entries(_sels[catId]||{}).forEach(([k,v])=>{
        if(v!==false && k in (_data||{})) {
          flatFiltered[k] = (_edits[catId]?.[k] !== undefined) ? _edits[catId][k] : _data[k];
        }
      });

      const selPrograms=Object.entries(_progSels[catId]||{}).filter(([,v])=>v!==false).map(([k])=>k);
      selPrograms.forEach(pk=>{
        [...intakeFields(pk),...strengthFields(pk)].forEach(k=>{
          if (k in (_data||{})) {
            flatFiltered[k] = (_edits[catId]?.[k] !== undefined) ? _edits[catId][k] : _data[k];
          }
        });
      });

      const selFacultyIds=_facultyData.filter(f=>(_facSels[catId]||{})[f.id]!==false).map(f=>f.id);

      const dataToSave={
        ...flatFiltered,
        _selected_programs: selPrograms,
        _faculty_ids:       selFacultyIds,
        _faculty_count:      selFacultyIds.length,
      };

      // Dispatches mapped rows array down to your relational backend router
      const response = await fetch('/api/applications/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: _subId,
          institute_id:  _instId,
          ranking_year:  2026,
          categories:    [catId], 
          category_data: dataToSave 
        })
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Server rejected categorization adjustments.');

      _saved.push(catId);
      _idx++;
      if(_idx<_selected.length) showReview(); else showDone();

    } catch(err) {
      console.error('[CSF Migration Error]', err);
      if(btn){btn.disabled=false; btn.innerHTML=_idx===_selected.length-1?'✓ Save & Finish':'Save & Next →';}
      alert('Could not synchronize category data mapping: ' + err.message);
    }
  }

  function _dash(){ removeOv(); window.location.href='/dashboard'; }

  // ─── ARTIFACT ENTRY LOAD INITIALIZER ───────────────────────────────────────
  // Cleaned
  async function init(submissionId, formData, instituteUserId) {
    _subId    = submissionId;
    _data     = formData;
    _instId   = instituteUserId || null;
    _selected = []; _idx=0; _sels={}; _progSels={}; _facSels={}; _edits={}; _saved=[]; _facultyData=[];

    injectStyles();

    mountOv(`<div class="csf-modal" style="padding:2rem; max-w:400px"><div class="csf-loading">
      <span class="csf-spin" style="border-top-color:#D58B00;border-color:#e2e8f0;width:18px;height:18px;"></span>
      Synchronizing workspace profiles…
    </div></div>`);

    try {
      if(_instId){
        // Fetch matching workspace personnel arrays
        const response = await fetch(`/api/applications/faculty/${_instId}`);
        const result = await response.json();
        
        // 🌟 CRITICAL BUG FIX: Maps server elements to match internal f.id lookups
        if (result.success && Array.isArray(result.faculty)) {
          _facultyData = result.faculty.map(f => ({
            id: f.id || f.db_id, 
            name: f.name,
            designation: f.designation,
            highest_degree: f.highest_degree,
            teaching_exp: f.teaching_exp
          }));
        }
      }
    } catch(e){ console.warn('[CSF Initialization Fault]', e); }

    showCatSel();
  }

  global.CategorySubmissionFlow={
    init, _tc,_skip,_proc,_ts,_sc,_fc,_pc,_intSecChange,_facChg,_facSecChg,_all,_none,_back,_edit,_save,_dash,
  };

})(window);