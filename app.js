/* =========================================================================
   GLOBAL PILGRIM BANK — Payments Platform
   Front-end application (simulation mode)
   -------------------------------------------------------------------------
   NOTE: All transactions here are simulated in the browser. No real money
   moves. Monnify secret keys must NEVER be shipped to a browser — route
   live calls through a backend proxy.
   ========================================================================= */
(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     1. STATE
     ---------------------------------------------------------------------- */
  const STORE_KEY = 'gpb.state.v1';

  const RATES = { NGN: 1, USD: 1520, GBP: 1930, EUR: 1650, GHS: 100, ZAR: 82, CAD: 1110, AUD: 1000, CNY: 210, RUB: 16.5, UAH: 37, XAF: 2.5 };
  const SYM = { NGN: '₦', USD: '$', GBP: '£', EUR: '€', GHS: '₵', ZAR: 'R', CAD: 'C$', AUD: 'A$', CNY: '¥', RUB: '₽', UAH: '₴', XAF: 'FCFA' };

  const BANKS = ['Opay Digital Services', 'PalmPay', 'Moniepoint MFB', 'Kuda MFB', 'First City Monument Bank (FCMB)', 'Zenith Bank', 'Wema Bank', 'Sterling Bank', 'Guaranty Trust Bank (GTB)', 'Access Bank', 'United Bank for Africa (UBA)', 'Global Pilgrim Bank (GPB)'];

  const NAMES = ['CHINEDU OKAFOR', 'AMINA BELLO', 'TUNDE ADEYEMI', 'GRACE ETIM', 'IBRAHIM MUSA', 'NGOZI EZE', 'SAMUEL OWUSU', 'FATIMA YUSUF', 'DAVID MENDY', 'BLESSING ADELEKE', 'KELVIN MBAGA', 'ESTHER NKEM'];

  const state = {
    balance: 12450800.55,
    serial: 1042,
    txs: [],
    customers: [],
    sms: [],
    emails: [],
    audit: [],
    recipients: [
      { name: 'CHINEDU OKAFOR', bank: 'Opay Digital Services', acct: '8034567219' },
      { name: 'AMINA BELLO', bank: 'PalmPay', acct: '9123456780' },
      { name: 'TUNDE ADEYEMI', bank: 'Zenith Bank', acct: '2087654321' }
    ]
  };

  /* ----------------------------------------------------------------------
     2. HELPERS
     ---------------------------------------------------------------------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const nf = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d === undefined ? 2 : d, maximumFractionDigits: d === undefined ? 2 : d });

  function money(amount, ccy) {
    ccy = ccy || 'NGN';
    const sym = SYM[ccy] || '';
    return sym + nf(amount, ccy === 'NGN' ? 2 : 2);
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function stamp(d) {
    d = d || new Date();
    const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${pad(d.getDate())} ${M[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function clock(d) {
    d = d || new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function txId() {
    return 'GPB-' + Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Math.random().toString(16).slice(2, 6).toUpperCase();
  }

  function nextSerial() {
    state.serial += 1;
    return 'GPB-' + String(state.serial).padStart(7, '0');
  }

  function hashName(acct) {
    let h = 0;
    for (let i = 0; i < acct.length; i++) h = (h * 31 + acct.charCodeAt(i)) % 9973;
    return NAMES[h % NAMES.length];
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ----------------------------------------------------------------------
     3. TOASTS
     ---------------------------------------------------------------------- */
  function toast(title, msg, kind) {
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.innerHTML = `<b>${esc(title)}</b><span>${esc(msg || '')}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(24px)';
      setTimeout(() => el.remove(), 320);
    }, 4200);
  }

  /* ----------------------------------------------------------------------
     4. MODAL
     ---------------------------------------------------------------------- */
  function openModal(html, wide) {
    const root = $('#modalRoot');
    root.innerHTML = `<div class="modal" id="modalOverlay"><div class="modal-card${wide ? ' wide' : ''}">${html}</div></div>`;
    const overlay = $('#modalOverlay');
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    $$('.x', root).forEach(b => b.addEventListener('click', closeModal));
    return root;
  }
  function closeModal() { $('#modalRoot').innerHTML = ''; }

  /* ----------------------------------------------------------------------
     5. SEED DATA
     ---------------------------------------------------------------------- */
  function seed() {
    const now = Date.now();
    const seeds = [
      ['CREDIT', 'AMINA BELLO', 'PalmPay', 'NIP', 250000, 'SUCCESS', 12],
      ['DEBIT', 'CHINEDU OKAFOR', 'Opay Digital Services', 'NIP', 45000, 'SUCCESS', 46],
      ['DEBIT', 'TUNDE ADEYEMI', 'Zenith Bank', 'NIP', 128500, 'SUCCESS', 92],
      ['CREDIT', 'GLOBAL PILGRIM LTD', 'GPB', 'SWIFT', 1850000, 'SUCCESS', 160],
      ['DEBIT', 'ATM WITHDRAWAL', 'GPB ATM 000920', 'ATM', 20000, 'SUCCESS', 210],
      ['CREDIT', 'SAMUEL OWUSU', 'GTB', 'NIP', 78000, 'PENDING', 240],
      ['DEBIT', 'USDT TRC20', 'TQn9Y2kh…LSE', 'CHAIN', 320000, 'SUCCESS', 300],
      ['DEBIT', 'BLESSING ADELEKE', 'Kuda MFB', 'USSD', 15000, 'SUCCESS', 380],
      ['CREDIT', 'FATIMA YUSUF', 'Moniepoint MFB', 'NIP', 62000, 'SUCCESS', 430],
      ['DEBIT', 'NGOZI EZE', 'Wema Bank', 'NIP', 95000, 'FAILED', 500]
    ];
    seeds.forEach((s, i) => {
      state.txs.push({
        serial: 'GPB-' + String(1000 + i).padStart(7, '0'),
        id: txId(),
        type: s[0],
        name: s[1],
        bank: s[2],
        channel: s[3],
        amount: s[4],
        ccy: 'NGN',
        status: s[5],
        ts: new Date(now - s[6] * 60000),
        narration: s[0] === 'CREDIT' ? 'Inward transfer' : 'Outward transfer'
      });
    });
    state.txs.sort((a, b) => b.ts - a.ts);

    state.customers = [
      { acct: '3855158987', name: 'OLAWALE ABDUL-GANIYU ADESHINA', bank: 'GPB', balance: 12450800.55, status: 'active' },
      { acct: '8034567219', name: 'CHINEDU OKAFOR', bank: 'Opay', balance: 482300.10, status: 'active' },
      { acct: '9123456780', name: 'AMINA BELLO', bank: 'PalmPay', balance: 128400.00, status: 'active' },
      { acct: '2087654321', name: 'TUNDE ADEYEMI', bank: 'Zenith', balance: 2984500.75, status: 'active' },
      { acct: '4451209837', name: 'GRACE ETIM', bank: 'GPB', balance: 76500.00, status: 'frozen' },
      { acct: '7012384456', name: 'IBRAHIM MUSA', bank: 'Kuda', balance: 15200.00, status: 'active' },
      { acct: '3390871225', name: 'NGOZI EZE', bank: 'Wema', balance: 0.00, status: 'blocked' }
    ];

    state.sms = [
      { t: new Date(now - 12 * 60000), body: 'GPB Alert: Credit NGN250,000.00 from AMINA BELLO. Bal: NGN12,450,800.55. Ref GPB-0001000' },
      { t: new Date(now - 46 * 60000), body: 'GPB Alert: Debit NGN45,000.00 to CHINEDU OKAFOR. Bal: NGN12,200,800.55. Ref GPB-0001001' }
    ];
    state.emails = [
      { t: new Date(now - 12 * 60000), subject: 'Credit alert — NGN 250,000.00', to: 'olawale.adeshina@gpb.com' }
    ];
    state.audit = [
      { t: new Date(now - 3600000), msg: 'SYSTEM BOOT · settlement node 920 MFB online' },
      { t: new Date(now - 3000000), msg: 'NIP handshake OK · 29COMM/195 peers linked' }
    ];
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ balance: state.balance, serial: state.serial, txs: state.txs.map(t => ({ ...t, ts: t.ts.toISOString() })), customers: state.customers }));
    } catch (e) { /* ignore quota */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      if (!d.txs) return false;
      state.balance = d.balance;
      state.serial = d.serial;
      state.txs = d.txs.map(t => ({ ...t, ts: new Date(t.ts) }));
      state.customers = d.customers || state.customers;
      return true;
    } catch (e) { return false; }
  }

  /* ----------------------------------------------------------------------
     6. AUTH
     ---------------------------------------------------------------------- */
  function initAuth() {
    const pass = $('#loginPass');
    const err = $('#authErr');

    function attempt() {
      if (pass.value === 'GPB2024') {
        err.textContent = '';
        $('#authScreen').classList.add('hidden');
        $('#appShell').classList.remove('hidden');
        boot();
        toast('Session authorised', 'AES-256-GCM tunnel established · token issued');
      } else {
        err.textContent = 'Invalid credentials. Use the demo password GPB2024.';
        pass.value = '';
        pass.focus();
      }
    }
    $('#loginBtn').addEventListener('click', attempt);
    pass.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
    $('#logoutBtn').addEventListener('click', () => {
      $('#appShell').classList.add('hidden');
      $('#authScreen').classList.remove('hidden');
      pass.value = '';
      T.running = false;
    });
  }

  /* ----------------------------------------------------------------------
     7. NAVIGATION
     ---------------------------------------------------------------------- */
  const TITLES = {
    dashboard: ['Dashboard', 'GPB / overview'],
    transfer: ['Send money', 'GPB / payments / transfer'],
    transactions: ['Transactions', 'GPB / ledger'],
    terminal: ['Live terminal', 'GPB / core / settlement'],
    cards: ['Cards & ATM', 'GPB / channels / card issuing'],
    ussd: ['USSD & alerts', 'GPB / channels / ussd'],
    crypto: ['Crypto & wallets', 'GPB / wallet engine'],
    admin: ['Back-office', 'GPB / operations / admin'],
    api: ['API & integrations', 'GPB / developers']
  };

  function go(view) {
    $$('.view').forEach(v => v.classList.remove('active'));
    const el = $('#view-' + view);
    if (el) el.classList.add('active');
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    const t = TITLES[view] || ['GPB', 'GPB'];
    $('#pageTitle').textContent = t[0];
    $('#pageCrumb').textContent = t[1];
    $('#views').scrollTop = 0;
    if (view === 'terminal') setTimeout(() => $('#termInput').focus(), 120);
  }

  /* ----------------------------------------------------------------------
     8. RENDER: DASHBOARD
     ---------------------------------------------------------------------- */
  const FX_META = [
    ['USD', 'US Dollar', 1520.44, 0.42], ['GBP', 'Pound Sterling', 1932.10, -0.18],
    ['EUR', 'Euro', 1651.80, 0.26], ['CNY', 'Chinese Yuan', 210.35, 0.08],
    ['CAD', 'Canadian Dollar', 1112.60, -0.11], ['AUD', 'Australian Dollar', 1004.20, 0.35],
    ['ZAR', 'South African Rand', 82.40, -0.52], ['GHS', 'Ghanaian Cedi', 100.75, 0.19],
    ['RUB', 'Russian Ruble', 16.55, -0.33], ['UAH', 'Ukrainian Hryvnia', 37.20, 0.05],
    ['XAF', 'Central African CFA', 2.52, 0.02]
  ];

  function renderFX() {
    $('#fxList').innerHTML = FX_META.map(([code, name, rate, chg]) => `
      <div class="rate-row">
        <div class="ccy">
          <div class="flag">${code.slice(0, 2)}</div>
          <div><b>${code}</b><span>${name}</span></div>
        </div>
        <div class="r">₦${nf(rate)}<em class="${chg >= 0 ? 'up-txt' : 'down-txt'}">${chg >= 0 ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}%</em></div>
      </div>`).join('');
  }

  function renderWallets() {
    const w = [
      ['NGN', 'Fiat · Naira', state.balance, 'var(--emerald)'],
      ['USD', 'Fiat · Dollar', 8420.10, 'var(--cyan)'],
      ['BTC', 'Bitcoin', 0.0842, 'var(--amber)'],
      ['USDT', 'Tether TRC20', 5400, 'var(--violet)']
    ];
    $('#walletList').innerHTML = w.map(([c, l, v, col]) => `
      <div class="rate-row">
        <div class="ccy">
          <div class="flag" style="color:${col}">${c.slice(0, 2)}</div>
          <div><b>${c}</b><span>${l}</span></div>
        </div>
        <div class="r">${c === 'BTC' ? v.toFixed(4) : nf(v)}</div>
      </div>`).join('');
  }

  function statusBadge(s) {
    const map = { SUCCESS: 'success', PENDING: 'pending', FAILED: 'failed', FROZEN: 'frozen', BLOCKED: 'blocked', ACTIVE: 'active' };
    return `<span class="badge ${map[s] || 'pending'}">${s}</span>`;
  }

  function renderDashboard() {
    $('#mainBalance').textContent = nf(state.balance);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let inflow = 0, outflow = 0;
    state.txs.forEach(t => {
      if (t.ts >= today && t.status === 'SUCCESS') {
        if (t.type === 'CREDIT') inflow += t.amount; else outflow += t.amount;
      }
    });
    $('#statIn').textContent = money(inflow);
    $('#statOut').textContent = money(outflow);
    const ok = state.txs.filter(t => t.status === 'SUCCESS').length;
    const rate = state.txs.length ? (ok / state.txs.length * 100) : 100;
    $('#statRate').textContent = rate.toFixed(1) + '%';

    $('#recentTxBody').innerHTML = state.txs.slice(0, 6).map(t => `
      <tr>
        <td class="mono" style="color:#7dd3fc">${t.serial}</td>
        <td>
          <div style="font-weight:600;font-size:12.5px">${esc(t.name)}</div>
          <div class="mini">${esc(t.bank)}</div>
        </td>
        <td><span class="chip">${t.channel}</span></td>
        <td class="tx-amt ${t.type === 'CREDIT' ? 'credit' : 'debit'}">${t.type === 'CREDIT' ? '+' : '−'}${money(t.amount, t.ccy)}</td>
        <td>${statusBadge(t.status)}</td>
        <td class="mono" style="color:#8797b6">${clock(t.ts)}</td>
      </tr>`).join('');
  }

  function renderAllTx(filter) {
    const q = (filter || '').toLowerCase();
    const rows = state.txs.filter(t => !q ||
      t.serial.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.bank.toLowerCase().includes(q));
    $('#allTxBody').innerHTML = rows.length ? rows.map(t => `
      <tr>
        <td class="mono" style="color:#7dd3fc">${t.serial}</td>
        <td class="mono" style="color:#8797b6">${t.id}</td>
        <td>${t.type}</td>
        <td><div style="font-weight:600;font-size:12.5px">${esc(t.name)}</div><div class="mini">${esc(t.bank)}</div></td>
        <td><span class="chip">${t.channel}</span></td>
        <td class="tx-amt ${t.type === 'CREDIT' ? 'credit' : 'debit'}">${t.type === 'CREDIT' ? '+' : '−'}${money(t.amount, t.ccy)}</td>
        <td>${statusBadge(t.status)}</td>
        <td class="mono" style="color:#8797b6">${stamp(t.ts)}</td>
      </tr>`).join('') : `<tr><td colspan="8" style="text-align:center;color:#5f6f8d;padding:26px">No transactions match your search.</td></tr>`;
  }

  function renderRecipients() {
    $('#recipients').innerHTML = state.recipients.map((r, i) => `
      <div class="rate-row" style="cursor:pointer" data-rcp="${i}">
        <div class="ccy">
          <div class="flag">${r.name.slice(0, 2)}</div>
          <div><b>${esc(r.name)}</b><span>${esc(r.bank)} · ${r.acct}</span></div>
        </div>
        <div class="r" style="color:var(--emerald);font-size:11px">SEND →</div>
      </div>`).join('');
    $$('[data-rcp]').forEach(el => el.addEventListener('click', () => {
      const r = state.recipients[+el.dataset.rcp];
      go('transfer');
      $('#bankSelect').value = r.bank;
      $('#destAcct').value = r.acct;
      $('#destName').value = r.name;
      $('#routeDest').textContent = r.bank;
      $('#routeName').textContent = r.name;
    }));
  }

  /* ----------------------------------------------------------------------
     9. TRANSFER
     ---------------------------------------------------------------------- */
  let destType = 'bank';

  function feeFor(amount, ccy) {
    if (!amount || amount <= 0) return { fee: 0, vat: 0, total: 0 };
    const ngn = amount * (RATES[ccy] || 1);
    const feeNgn = Math.min(50, 10 + ngn * 0.005);
    const vatNgn = feeNgn * 0.075;
    const r = RATES[ccy] || 1;
    return { fee: feeNgn / r, vat: vatNgn / r, total: amount + (feeNgn + vatNgn) / r };
  }

  function updateFee() {
    const amt = parseFloat($('#sendAmount').value) || 0;
    const ccy = $('#sendCcy').value;
    const f = feeFor(amt, ccy);
    $('#feeOut').textContent = money(f.fee, ccy);
    $('#vatOut').textContent = money(f.vat, ccy);
    $('#totalOut').textContent = money(f.total, ccy);
  }

  function initTransfer() {
    $$('#destSeg button').forEach(b => b.addEventListener('click', () => {
      $$('#destSeg button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      destType = b.dataset.dest;
      $('#bankField').classList.toggle('hidden', destType !== 'bank');
      $('#cryptoField').classList.toggle('hidden', destType !== 'crypto');
      const acct = $('#destAcct');
      if (destType === 'bank') { $('#acctLabel').textContent = 'Account number'; acct.placeholder = '10-digit account number'; acct.maxLength = 10; }
      if (destType === 'wallet') { $('#acctLabel').textContent = 'GPB wallet number'; acct.placeholder = '10-digit wallet number'; acct.maxLength = 10; }
      if (destType === 'crypto') { $('#acctLabel').textContent = 'Wallet address'; acct.placeholder = 'Paste wallet address'; acct.maxLength = 48; }
      acct.value = ''; $('#destName').value = '';
      $('#routeDest').textContent = '—'; $('#routeName').textContent = '—';
    }));

    let deb;
    $('#destAcct').addEventListener('input', () => {
      clearTimeout(deb);
      const v = $('#destAcct').value.trim();
      if (destType === 'crypto') {
        if (v.length > 20) { $('#destName').value = 'HD-WALLET · ' + $('#cryptoNet').value; $('#routeName').textContent = 'HD-WALLET · ' + $('#cryptoNet').value; }
        return;
      }
      if (v.length === 10) {
        $('#destName').value = 'Resolving…';
        deb = setTimeout(() => {
          const n = hashName(v);
          $('#destName').value = n;
          $('#routeName').textContent = n;
          $('#routeDest').textContent = destType === 'wallet' ? 'GPB Wallet' : ($('#bankSelect').value || 'Bank');
          term('NIP', 'nip', 'ok', `Name enquiry  <b>${v}</b> → <span class="hl">${n}</span> · RC 00`);
        }, 550);
      } else {
        $('#destName').value = '';
      }
    });

    $('#bankSelect').addEventListener('change', () => { $('#routeDest').textContent = $('#bankSelect').value || '—'; });
    $('#sendAmount').addEventListener('input', updateFee);
    $('#sendCcy').addEventListener('change', updateFee);

    $('#sendBtn').addEventListener('click', startTransfer);
  }

  function startTransfer() {
    const acct = $('#destAcct').value.trim();
    const amount = parseFloat($('#sendAmount').value);
    const ccy = $('#sendCcy').value;
    const name = $('#destName').value;
    const bank = destType === 'crypto' ? $('#cryptoNet').value : (destType === 'wallet' ? 'GPB Wallet' : $('#bankSelect').value);

    if (!acct) return toast('Missing account', 'Enter a destination account or wallet address.', 'err');
    if (destType === 'bank' && acct.length !== 10) return toast('Invalid account', 'Account number must be 10 digits.', 'err');
    if (destType !== 'crypto' && !bank) return toast('Missing bank', 'Select a destination bank.', 'err');
    if (!amount || amount <= 0) return toast('Invalid amount', 'Enter an amount greater than zero.', 'err');
    if (amount * (RATES[ccy] || 1) > state.balance) return toast('Insufficient funds', 'Amount exceeds available balance.', 'err');

    const f = feeFor(amount, ccy);

    openModal(`
      <div class="modal-head">
        <div><h3>Authorise transfer</h3><p>Confirm details and enter your transaction PIN.</p></div>
        <button class="x">×</button>
      </div>
      <div class="receipt" style="border-style:solid;margin-bottom:16px">
        <div class="rc-row"><span class="k">Amount</span><span class="v" style="font-size:14px;color:#fff">${money(amount, ccy)}</span></div>
        <div class="rc-row"><span class="k">Fee + VAT</span><span class="v">${money(f.fee + f.vat, ccy)}</span></div>
        <div class="rc-row"><span class="k">Total debit</span><span class="v" style="color:#00e5a0">${money(f.total, ccy)}</span></div>
        <div class="rc-row"><span class="k">Recipient</span><span class="v">${esc(name || acct)}</span></div>
        <div class="rc-row"><span class="k">Destination</span><span class="v">${esc(bank || 'Crypto')} · ${esc(acct)}</span></div>
        <div class="rc-row"><span class="k">Channel</span><span class="v">${destType === 'crypto' ? 'BLOCKCHAIN' : 'NIP / ISO 8583'}</span></div>
      </div>
      <div class="field"><label>Transaction PIN</label><input class="input mono" id="pinInput" type="password" placeholder="••••" maxlength="4" inputmode="numeric" /></div>
      <div class="auth-err" id="pinErr"></div>
      <button class="btn btn-primary btn-block" id="confirmPin">Authorise payment</button>
      <div class="hint" style="text-align:center">Demo PIN: <b style="color:#00e5a0">1234</b></div>
    `);

    setTimeout(() => $('#pinInput').focus(), 100);
    $('#confirmPin').addEventListener('click', () => {
      if ($('#pinInput').value !== '1234') {
        $('#pinErr').textContent = 'Incorrect PIN. Try 1234.';
        return;
      }
      runProcessing({ acct, amount, ccy, name: name || acct, bank, f });
    });
    $('#pinInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#confirmPin').click(); });
  }

  function runProcessing(t) {
    const steps = [
      'Validating request & idempotency key',
      'AML / sanctions screening',
      t.bank === 'BTC' || t.bank === 'TRC20' || t.bank === 'ERC20' || t.bank === 'HTX' ? 'Broadcasting to blockchain node' : 'Routing over NIP (ISO 8583 · MTI 0200)',
      'Posting double-entry to ledger',
      'Dispatching SMS + email alerts'
    ];

    openModal(`
      <div class="modal-head">
        <div><h3>Processing payment</h3><p>${money(t.amount, t.ccy)} → ${esc(t.name)}</p></div>
      </div>
      <div class="proc-steps" id="procSteps">
        ${steps.map((s, i) => `<div class="pstep" data-i="${i}"><div class="ic">${i + 1}</div><span>${s}</span><span class="t">—</span></div>`).join('')}
      </div>
      <div class="hint" style="text-align:center;margin-top:14px">Do not close this window</div>
    `);

    let i = 0;
    const tick = () => {
      const rows = $$('#procSteps .pstep');
      if (i > 0) { rows[i - 1].classList.remove('run'); rows[i - 1].classList.add('done'); rows[i - 1].querySelector('.ic').textContent = '✓'; rows[i - 1].querySelector('.t').textContent = rnd(120, 640) + 'ms'; }
      if (i >= steps.length) { setTimeout(() => commit(t), 380); return; }
      rows[i].classList.add('run');
      i++;
      setTimeout(tick, rnd(420, 720));
    };
    tick();
  }

  function commit(t) {
    const serial = nextSerial();
    const id = txId();
    const now = new Date();
    const isCrypto = ['BTC', 'TRC20', 'ERC20', 'HTX'].includes(t.bank);

    state.balance -= t.f.total * (RATES[t.ccy] || 1);

    const tx = {
      serial, id, type: 'DEBIT', name: t.name, bank: t.bank || 'Crypto',
      channel: isCrypto ? 'CHAIN' : 'NIP', amount: t.amount, ccy: t.ccy,
      status: 'SUCCESS', ts: now, narration: $('#sendNarration').value || 'Outward transfer',
      fee: t.f.fee
    };
    state.txs.unshift(tx);

    // alerts
    state.sms.unshift({ t: now, body: `GPB Alert: Debit ${money(t.amount, t.ccy)} to ${t.name}. Bal: ${money(state.balance)}. Ref ${serial}` });
    state.emails.unshift({ t: now, subject: `Debit alert — ${money(t.amount, t.ccy)}`, to: 'olawale.adeshina@gpb.com' });
    state.audit.unshift({ t: now, msg: `TRANSFER ${serial} · ${money(t.amount, t.ccy)} → ${t.name} · ${t.bank}` });

    save();
    renderDashboard();
    renderAllTx();
    renderAlerts();

    // terminal lines
    term('NIP', 'nip', 'ok', `Outward transfer <b>${serial}</b> · ${money(t.amount, t.ccy)} → <span class="hl">${esc(t.name)}</span>`);
    term('ISO', 'iso', 'dim', `0200 ${t.bank} · DE4 ${String(Math.round(t.amount * 100)).padStart(12, '0')} · DE39 00`);
    term('LEDGER', 'ledger', 'ok', `Posted DEBIT ${money(t.amount, t.ccy)} · balance ${money(state.balance)}`);
    term('WEBHOOK', 'webhook', 'dim', `POST /webhook/gpb/settlement · 200 OK · ${id}`);
    term('SMS', 'sms', 'dim', `SMPP submit_sm → +2348••••••• · ${serial}`);

    showReceipt(tx);

    // reset form
    $('#destAcct').value = ''; $('#destName').value = ''; $('#sendAmount').value = ''; $('#sendNarration').value = '';
    $('#routeDest').textContent = '—'; $('#routeName').textContent = '—';
    updateFee();
  }

  function showReceipt(tx) {
    openModal(`
      <div class="modal-head">
        <div><h3 style="color:#3dffc0">Payment successful</h3><p>${stamp(tx.ts)} · WAT</p></div>
        <button class="x">×</button>
      </div>
      <div class="receipt">
        <div class="rc-head">
          <div class="b">GLOBAL PILGRIM BANK</div>
          <div class="s">MFB 920 · SWIFT GPBINGLA · TIN 22203477001</div>
        </div>
        <div class="rc-amt">${money(tx.amount, tx.ccy)}</div>
        <div class="rc-status">${statusBadge('SUCCESS')}</div>
        <div class="rc-row"><span class="k">Serial number</span><span class="v">${tx.serial}</span></div>
        <div class="rc-row"><span class="k">Transaction ID</span><span class="v">${tx.id}</span></div>
        <div class="rc-row"><span class="k">Date / time</span><span class="v">${stamp(tx.ts)}</span></div>
        <div class="rc-row"><span class="k">Beneficiary</span><span class="v">${esc(tx.name)}</span></div>
        <div class="rc-row"><span class="k">Destination</span><span class="v">${esc(tx.bank)}</span></div>
        <div class="rc-row"><span class="k">Channel</span><span class="v">${tx.channel}</span></div>
        <div class="rc-row"><span class="k">Fee</span><span class="v">${money(tx.fee || 0, tx.ccy)}</span></div>
        <div class="rc-row"><span class="k">Balance after</span><span class="v">${money(state.balance)}</span></div>
        <div class="rc-row"><span class="k">Status</span><span class="v" style="color:#3dffc0">SUCCESS · RC 00</span></div>
        <div class="rc-foot">Thank you for banking with Global Pilgrim Bank.<br>Keep this receipt for your records · support@gpb.com</div>
      </div>
      <div class="flex mt" style="gap:9px">
        <button class="btn btn-ghost btn-block" id="rcClose">Done</button>
        <button class="btn btn-primary btn-block" id="rcCopy">Copy details</button>
      </div>
    `);
    $('#rcClose').addEventListener('click', closeModal);
    $('#rcCopy').addEventListener('click', () => {
      const txt = `GPB Receipt\nSerial: ${tx.serial}\nTxID: ${tx.id}\nAmount: ${money(tx.amount, tx.ccy)}\nTo: ${tx.name} (${tx.bank})\nDate: ${stamp(tx.ts)}\nStatus: SUCCESS`;
      navigator.clipboard?.writeText(txt).then(() => toast('Copied', 'Receipt details copied to clipboard.'));
    });
  }

  /* ----------------------------------------------------------------------
     10. TERMINAL ENGINE
     ---------------------------------------------------------------------- */
  const T = {
    running: true,
    filter: 'ALL',
    lines: [],
    settled: 0,
    failed: 0,
    volume: 0,
    tps: 0,
    lat: 0,
    start: Date.now(),
    timer: null,
    statTimer: null
  };

  const CAT_CLASS = { NIP: 'nip', ISO: 'iso', SWIFT: 'swift', CHAIN: 'chain', LEDGER: 'ledger', WEBHOOK: 'webhook', SMS: 'sms', EMAIL: 'email', AUTH: 'auth', FX: 'fx', SYS: 'sys', USSD: 'ussd', ATM: 'atm' };

  function term(tag, cat, cls, text) {
    const line = { t: new Date(), tag, cat, cls: cls || '', text };
    T.lines.push(line);
    if (T.lines.length > 600) T.lines.splice(0, T.lines.length - 600);
    if (T.filter === 'ALL' || T.filter === cat.toUpperCase()) appendLine(line);
  }

  function appendLine(line) {
    const body = $('#termBody');
    if (!body) return;
    const nearBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 90;
    const el = document.createElement('div');
    el.className = 'ln ' + line.cls;
    el.innerHTML = `<span class="ts">${clock(line.t)}</span><span class="tag ${CAT_CLASS[line.cat] || 'sys'}">[${line.tag}]</span><span class="msg">${line.text}</span>`;
    body.appendChild(el);
    while (body.children.length > 400) body.removeChild(body.firstChild);
    if (nearBottom) body.scrollTop = body.scrollHeight;
  }

  function rerenderTerm() {
    const body = $('#termBody');
    body.innerHTML = '';
    T.lines.filter(l => T.filter === 'ALL' || T.filter === l.cat.toUpperCase()).forEach(appendLine);
    body.scrollTop = body.scrollHeight;
  }

  function bootTerminal() {
    const body = $('#termBody');
    body.innerHTML = '';
    T.lines = [];
    const boot = [
      ['SYS', 'sys', 'dim', 'GPB Core Settlement Daemon v4.2.1 — starting'],
      ['SYS', 'sys', 'dim', 'Loading crypto engine · AES-256-GCM · HSM handshake OK'],
      ['AUTH', 'auth', 'ok', 'Session token issued · operator OLAWALE A. ADESHINA · scope ADMIN'],
      ['NIP', 'nip', 'ok', 'NIBSS NIP connected · institution 920 MFB · 29COMM/195 peers'],
      ['SWIFT', 'swift', 'ok', 'SWIFT gpi gateway GPBINGLA online · T+0 tracking enabled'],
      ['ISO', 'iso', 'ok', 'ISO 8583 switch ready · MTI 0100/0200 · PIN block ISO 9564'],
      ['CHAIN', 'chain', 'ok', 'Blockchain nodes synced · BTC · TRC20 · ERC20 · HTX'],
      ['FX', 'fx', 'dim', 'Currency engine loaded · 12 pairs · NGN base'],
      ['LEDGER', 'ledger', 'ok', 'Double-entry ledger verified · opening balance ' + money(state.balance)],
      ['SYS', 'sys', 'ok', 'ACCEPTANCE MESSAGE STATUS: READY TO RECEIVE']
    ];
    boot.forEach((b, i) => setTimeout(() => term(b[0], b[1], b[2], b[3]), i * 110));

    setTimeout(() => {
      term('SYS', 'sys', 'dim', 'Type <span class="hl">help</span> for available commands.');
    }, 1250);

    if (T.timer) clearInterval(T.timer);
    T.timer = setInterval(streamEvent, 1500);

    if (T.statTimer) clearInterval(T.statTimer);
    T.statTimer = setInterval(updateTermStats, 1000);
  }

  function streamEvent() {
    if (!T.running) return;
    const kind = Math.random();
    const acct = String(rnd(1000000000, 9999999999));
    const name = hashName(acct);
    const bank = pick(BANKS);
    const amt = rnd(500, 480000);

    if (kind < 0.34) {
      const ok = Math.random() > 0.06;
      term('NIP', 'nip', ok ? 'ok' : 'err',
        `Inward credit <b>${money(amt)}</b> · ${name} · ${bank} · <span class="hl">${ok ? 'RC 00 SUCCESS' : 'RC 91 TIMEOUT'}</span>`);
      if (ok) { T.settled++; T.volume += amt; } else T.failed++;
    } else if (kind < 0.52) {
      term('ISO', 'iso', 'dim',
        `0200 ${pick(['GPBATM000920', 'POS-TRM-4471', 'WEB-GW-01'])} · DE2 ${acct.slice(0, 6)}•••• · DE4 ${String(amt * 100).padStart(12, '0')} · DE39 00`);
    } else if (kind < 0.66) {
      const lat = rnd(18, 240);
      T.lat = lat;
      term('SWIFT', 'swift', 'dim',
        `gpi <span class="vi">${txId()}</span> · ${pick(['USD', 'GBP', 'EUR', 'CAD'])} ${nf(amt)} · ${pick(['London', 'Frankfurt', 'New York', 'Dubai'])} → Lagos · ${lat}ms`);
    } else if (kind < 0.78) {
      const c = pick(['BTC', 'USDT-TRC20', 'USDT-ERC20', 'HTX']);
      const conf = rnd(1, 12);
      term('CHAIN', 'chain', conf >= 3 ? 'ok' : 'warn',
        `${c} tx <span class="am">0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}</span> · ${conf}/12 confirmations · ${conf >= 3 ? 'CONFIRMED' : 'PENDING'}`);
    } else if (kind < 0.88) {
      term('WEBHOOK', 'webhook', 'dim',
        `POST /webhook/gpb/settlement · 200 OK · ${txId()} · ${rnd(20, 90)}ms`);
    } else if (kind < 0.95) {
      term('SMS', 'sms', 'dim', `SMPP submit_sm → +234${rnd(7000000000, 9099999999)} · delivered · ${txId()}`);
    } else {
      term('FX', 'fx', 'dim', `${pick(['USD', 'GBP', 'EUR', 'GHS', 'ZAR'])}/NGN ${nf(pick([1520.44, 1932.10, 1651.80, 100.75, 82.40]))} · spread 0.35% · liquidity OK`);
    }
  }

  function updateTermStats() {
    T.tps = +(Math.random() * 40 + 12).toFixed(1);
    if (!T.lat) T.lat = rnd(30, 180);
    $('#tpsVal').textContent = T.tps.toFixed(1);
    $('#latVal').textContent = T.lat + ' ms';
    $('#settledVal').textContent = nf(T.settled, 0);
    $('#volVal').textContent = '₦' + nf(T.volume, 0);
    $('#failVal').textContent = T.failed;
    const up = Math.floor((Date.now() - T.start) / 1000);
    $('#termUptime').textContent = 'UPTIME ' + [Math.floor(up / 3600), Math.floor(up % 3600 / 60), up % 60].map(pad).join(':');
  }

  function initTerminal() {
    $$('.tab').forEach(t => t.addEventListener('click', () => {
      $$('.tab').forEach(x => x.classList.remove('on'));
      t.classList.add('on');
      T.filter = t.dataset.filter;
      rerenderTerm();
    }));

    $('#pauseBtn').addEventListener('click', () => {
      T.running = !T.running;
      $('#pauseBtn').classList.toggle('on', T.running);
      $('#pauseBtn').textContent = T.running ? '⏸ PAUSE' : '▶ RESUME';
      term('SYS', 'sys', 'warn', T.running ? 'Stream resumed' : 'Stream paused by operator');
    });

    $('#clearBtn').addEventListener('click', () => {
      T.lines = [];
      $('#termBody').innerHTML = '';
      term('SYS', 'sys', 'dim', 'Buffer cleared.');
    });

    $('#exportLogBtn').addEventListener('click', exportLog);

    const input = $('#termInput');
    input.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const cmd = input.value.trim();
      if (!cmd) return;
      input.value = '';
      runCommand(cmd);
    });
  }

  function exportLog() {
    const txt = T.lines.map(l => `${l.t.toISOString()} [${l.tag}] ${l.text.replace(/<[^>]+>/g, '')}`).join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gpb-settlement-' + Date.now() + '.log';
    a.click();
    toast('Log exported', T.lines.length + ' lines written to file.');
  }

  function runCommand(raw) {
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');
    term('CMD', 'sys', 'cmd', `<b>$ ${esc(raw)}</b>`);

    switch (cmd) {
      case 'help':
        term('SYS', 'sys', 'dim', 'Commands: <span class="hl">status</span> · <span class="hl">bal</span> · <span class="hl">rates</span> · <span class="hl">netstat</span> · <span class="hl">tx &lt;id|serial&gt;</span> · <span class="hl">send &lt;amount&gt;</span> · <span class="hl">whoami</span> · <span class="hl">clear</span> · <span class="hl">export</span>');
        break;
      case 'status':
        term('SYS', 'sys', 'ok', `Core: ONLINE · NIP: CONNECTED · SWIFT gpi: ONLINE · ISO8583: READY · CHAIN: SYNCED`);
        term('SYS', 'sys', 'dim', `Settled ${T.settled} · Failed ${T.failed} · Volume ₦${nf(T.volume, 0)} · TPS ${T.tps.toFixed(1)} · Latency ${T.lat}ms`);
        break;
      case 'bal':
        term('LEDGER', 'ledger', 'ok', `Available balance: <b>${money(state.balance)}</b> · ledger reconciled · T+0`);
        break;
      case 'rates':
        ['USD', 'GBP', 'EUR', 'GHS', 'ZAR', 'CAD', 'AUD', 'CNY'].forEach(c => {
          term('FX', 'fx', 'dim', `${c}/NGN  ${nf(RATES[c])}  · spread 0.35%`);
        });
        break;
      case 'netstat':
        term('NIP', 'nip', 'dim', 'peer 920-MFB-01   ESTABLISHED  rtt 12ms');
        term('NIP', 'nip', 'dim', 'peer 29COMM-195   ESTABLISHED  rtt 18ms');
        term('SWIFT', 'swift', 'dim', 'gpi gateway GPBINGLA  ACTIVE  tls1.3');
        term('CHAIN', 'chain', 'dim', 'btc-node  height 851,204  peers 12');
        term('SYS', 'sys', 'ok', 'secure-tunnel gpb-mesh-achibe · aes-256-gcm · 0 drops');
        break;
      case 'tx': {
        if (!arg) { term('SYS', 'sys', 'warn', 'Usage: tx <transactionId|serial>'); break; }
        const t = state.txs.find(x => x.id.toLowerCase() === arg.toLowerCase() || x.serial.toLowerCase() === arg.toLowerCase());
        if (!t) { term('SYS', 'sys', 'err', `No transaction found for "${esc(arg)}"`); break; }
        term('LEDGER', 'ledger', 'ok', `${t.serial} · ${t.id} · ${t.type} ${money(t.amount, t.ccy)} · ${t.name}`);
        term('LEDGER', 'ledger', 'dim', `channel ${t.channel} · status ${t.status} · ${stamp(t.ts)}`);
        break;
      }
      case 'send': {
        const amt = parseFloat(arg);
        if (!amt || amt <= 0) { term('SYS', 'sys', 'warn', 'Usage: send <amount>'); break; }
        const acct = String(rnd(1000000000, 9999999999));
        const nm = hashName(acct);
        const serial = nextSerial();
        const id = txId();
        state.balance -= amt;
        state.txs.unshift({ serial, id, type: 'DEBIT', name: nm, bank: pick(BANKS), channel: 'NIP', amount: amt, ccy: 'NGN', status: 'SUCCESS', ts: new Date(), narration: 'Terminal transfer' });
        save(); renderDashboard(); renderAllTx();
        term('NIP', 'nip', 'ok', `SENT ${money(amt)} → ${nm} · <b>${serial}</b> · RC 00`);
        term('WEBHOOK', 'webhook', 'dim', `POST /webhook/gpb/settlement · 200 OK · ${id}`);
        toast('Transfer sent', `${money(amt)} to ${nm} · ${serial}`);
        break;
      }
      case 'whoami':
        term('AUTH', 'auth', 'dim', 'operator: OLAWALE ABDUL-GANIYU ADESHINA · acct 3855158987 · scope ADMIN · tier 3');
        break;
      case 'clear':
        T.lines = []; $('#termBody').innerHTML = '';
        break;
      case 'export':
        exportLog();
        break;
      default:
        term('SYS', 'sys', 'err', `command not found: ${esc(cmd)} — type 'help'`);
    }
  }

  /* ----------------------------------------------------------------------
     11. ALERTS
     ---------------------------------------------------------------------- */
  function renderAlerts() {
    $('#smsLog').innerHTML = state.sms.slice(0, 12).map(s => `
      <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">
        <div class="mini" style="color:#7dd3fc;margin-bottom:4px">${clock(s.t)} · +2348•••••••</div>
        <div style="font-size:11.5px;line-height:1.55;color:#b9cbe4">${esc(s.body)}</div>
      </div>`).join('');
    $('#emailLog').innerHTML = state.emails.slice(0, 10).map(e => `
      <div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">
        <div style="font-size:12px;font-weight:600">${esc(e.subject)}</div>
        <div class="mini">${clock(e.t)} · ${esc(e.to)}</div>
      </div>`).join('');
  }

  /* ----------------------------------------------------------------------
     12. ATM
     ---------------------------------------------------------------------- */
  function initATM() {
    $('#atmRunBtn').addEventListener('click', () => {
      const dir = $('#atmDirective').value;
      const amt = parseFloat($('#atmAmount').value) || 0;
      const termId = $('#atmTerm').value;

      term('ISO', 'iso', 'dim', `→ 0200 ${termId} · DE3 ${dir.split(' ')[0]} · DE4 ${String(Math.round(amt * 100)).padStart(12, '0')}`);
      setTimeout(() => term('ISO', 'iso', 'ok', `← 0210 ${termId} · DE39 00 APPROVED · auth ${rnd(100000, 999999)}`), 700);

      if (dir.startsWith('WITHDRAWAL')) {
        if (amt > state.balance) return toast('Declined', 'Insufficient funds for ATM withdrawal.', 'err');
        state.balance -= amt;
        const serial = nextSerial();
        state.txs.unshift({ serial, id: txId(), type: 'DEBIT', name: 'ATM WITHDRAWAL', bank: termId, channel: 'ATM', amount: amt, ccy: 'NGN', status: 'SUCCESS', ts: new Date(), narration: 'Cash dispense' });
        state.sms.unshift({ t: new Date(), body: `GPB Alert: ATM withdrawal ${money(amt)} at ${termId}. Bal: ${money(state.balance)}. Ref ${serial}` });
        save(); renderDashboard(); renderAllTx(); renderAlerts();
        toast('Cash dispensed', `${money(amt)} · ${serial}`, '');
      } else if (dir.startsWith('BALANCE')) {
        toast('Balance enquiry', 'Available balance: ' + money(state.balance));
      } else {
        toast('Directive executed', dir + ' completed · RC 00');
      }
    });
  }

  /* ----------------------------------------------------------------------
     13. USSD
     ---------------------------------------------------------------------- */
  const ussd = { step: 'root' };
  function initUSSD() {
    const screen = $('#ussdScreen');
    const input = $('#ussdInput');

    function render(txt) { screen.textContent = txt; }

    function send() {
      const v = input.value.trim();
      input.value = '';
      if (!v) return;
      term('USSD', 'ussd', 'dim', `*920# → ${v}`);
      if (ussd.step === 'root') {
        if (v === '1') { render(`GPB\nAvailable balance\n${money(state.balance)}\n\n0. Back`); ussd.step = 'back'; }
        else if (v === '2') { render('GPB Transfer\nEnter amount'); ussd.step = 'amt'; }
        else if (v === '3') { render('GPB Airtime\nEnter amount'); ussd.step = 'air'; }
        else if (v === '4') {
          const lines = state.txs.slice(0, 4).map(t => `${t.type === 'CREDIT' ? '+' : '-'}${money(t.amount)} ${clock(t.ts)}`).join('\n');
          render(`GPB Mini statement\n${lines}\n\n0. Back`); ussd.step = 'back';
        } else if (v === '5') { render('GPB\nEnter new 4-digit PIN'); ussd.step = 'pin'; }
        else render('GPB\nInvalid option\n\n1. Balance\n2. Transfer\n3. Airtime\n4. Mini statement\n5. Change PIN');
      } else if (ussd.step === 'amt') {
        const amt = parseFloat(v);
        if (!amt) { render('GPB\nInvalid amount'); return; }
        state.balance -= amt;
        const serial = nextSerial();
        state.txs.unshift({ serial, id: txId(), type: 'DEBIT', name: 'USSD TRANSFER', bank: 'NIP', channel: 'USSD', amount: amt, ccy: 'NGN', status: 'SUCCESS', ts: new Date(), narration: 'USSD transfer' });
        save(); renderDashboard(); renderAllTx();
        render(`GPB\nTransfer successful\n${money(amt)}\nRef ${serial}\nBal ${money(state.balance)}`);
        ussd.step = 'root';
        toast('USSD transfer', `${money(amt)} sent · ${serial}`);
      } else if (ussd.step === 'air') {
        render('GPB\nAirtime purchase successful');
        ussd.step = 'root';
      } else if (ussd.step === 'pin') {
        render('GPB\nPIN changed successfully');
        ussd.step = 'root';
      } else {
        render('GPB\nWelcome, OLAWALE\n1. Balance\n2. Transfer\n3. Airtime\n4. Mini statement\n5. Change PIN');
        ussd.step = 'root';
      }
    }
    $('#ussdSend').addEventListener('click', send);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    $('#ussdReset').addEventListener('click', () => {
      ussd.step = 'root';
      render('GPB\nWelcome, OLAWALE\n1. Balance\n2. Transfer\n3. Airtime\n4. Mini statement\n5. Change PIN');
    });
  }

  /* ----------------------------------------------------------------------
     14. ADMIN
     ---------------------------------------------------------------------- */
  function renderCustomers(q) {
    q = (q || '').toLowerCase();
    const rows = state.customers.filter(c => !q || c.name.toLowerCase().includes(q) || c.acct.includes(q));
    $('#custBody').innerHTML = rows.map((c, i) => `
      <tr>
        <td class="mono" style="color:#7dd3fc">${c.acct}</td>
        <td><div style="font-weight:600;font-size:12.5px">${esc(c.name)}</div></td>
        <td><span class="chip">${esc(c.bank)}</span></td>
        <td class="mono">${money(c.balance)}</td>
        <td>${statusBadge(c.status.toUpperCase())}</td>
        <td>
          <div class="flex" style="gap:5px">
            <button class="btn btn-ghost btn-sm" data-act="credit" data-i="${i}">Credit</button>
            <button class="btn btn-ghost btn-sm" data-act="debit" data-i="${i}">Debit</button>
            <button class="btn btn-ghost btn-sm" data-act="freeze" data-i="${i}">${c.status === 'frozen' ? 'Unfreeze' : 'Freeze'}</button>
            <button class="btn btn-danger btn-sm" data-act="block" data-i="${i}">${c.status === 'blocked' ? 'Unblock' : 'Block'}</button>
          </div>
        </td>
      </tr>`).join('');

    $$('[data-act]', $('#custBody')).forEach(b => b.addEventListener('click', () => {
      adminAction(b.dataset.act, +b.dataset.i);
    }));
  }

  function renderAudit() {
    $('#auditLog').innerHTML = state.audit.slice(0, 40).map(a => `
      <div style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);color:#a9bdd8">
        <span style="color:#3d5a7a">${stamp(a.t)}</span> · ${esc(a.msg)}
      </div>`).join('');
  }

  function adminAction(act, i) {
    const c = state.customers[i];
    if (!c) return;

    if (act === 'freeze' || act === 'block') {
      const target = act === 'freeze' ? (c.status === 'frozen' ? 'active' : 'frozen') : (c.status === 'blocked' ? 'active' : 'blocked');
      c.status = target;
      state.audit.unshift({ t: new Date(), msg: `ADMIN ${act.toUpperCase()} · ${c.acct} ${c.name} → ${target.toUpperCase()}` });
      renderCustomers($('#custSearch').value);
      renderAudit();
      toast('Account updated', `${c.name} is now ${target.toUpperCase()}.`, target === 'active' ? '' : 'warn');
      return;
    }

    openModal(`
      <div class="modal-head">
        <div><h3>${act === 'credit' ? 'Credit account' : 'Debit account'}</h3><p>${esc(c.name)} · ${c.acct}</p></div>
        <button class="x">×</button>
      </div>
      <div class="field"><label>Amount (NGN)</label><input class="input mono" id="adjAmt" placeholder="0.00" inputmode="decimal" /></div>
      <div class="field"><label>Admin PIN</label><input class="input mono" id="adjPin" type="password" placeholder="••••••••" /></div>
      <div class="auth-err" id="adjErr"></div>
      <button class="btn btn-primary btn-block" id="adjGo">Post ${act}</button>
      <div class="hint" style="text-align:center">Demo admin PIN: <b style="color:#00e5a0">admin123</b></div>
    `);

    $('#adjGo').addEventListener('click', () => {
      const amt = parseFloat($('#adjAmt').value);
      if ($('#adjPin').value !== 'admin123') { $('#adjErr').textContent = 'Invalid admin PIN.'; return; }
      if (!amt || amt <= 0) { $('#adjErr').textContent = 'Enter a valid amount.'; return; }
      if (act === 'debit' && amt > c.balance) { $('#adjErr').textContent = 'Amount exceeds customer balance.'; return; }

      c.balance += act === 'credit' ? amt : -amt;
      if (c.acct === '3855158987') state.balance = c.balance;

      const serial = nextSerial();
      state.txs.unshift({
        serial, id: txId(), type: act === 'credit' ? 'CREDIT' : 'DEBIT',
        name: 'ADMIN ADJUSTMENT · ' + c.name, bank: c.bank, channel: 'MANUAL',
        amount: amt, ccy: 'NGN', status: 'SUCCESS', ts: new Date(), narration: 'Manual ' + act
      });
      state.audit.unshift({ t: new Date(), msg: `ADMIN ${act.toUpperCase()} ${money(amt)} · ${c.acct} ${c.name} · new balance ${money(c.balance)}` });

      save(); renderCustomers($('#custSearch').value); renderAudit(); renderDashboard(); renderAllTx();
      closeModal();
      toast('Posted', `${act === 'credit' ? 'Credit' : 'Debit'} of ${money(amt)} applied to ${c.name}.`);
      term('LEDGER', 'ledger', 'ok', `ADMIN ${act.toUpperCase()} ${money(amt)} · ${c.acct} · balance ${money(c.balance)}`);
    });
  }

  function initAdmin() {
    $('#custSearch').addEventListener('input', e => renderCustomers(e.target.value));
  }

  /* ----------------------------------------------------------------------
     15. CRYPTO TABLE
     ---------------------------------------------------------------------- */
  function renderChain() {
    const rows = [
      ['0x9f2a…c41b', 'USDT', 'TRC-20', 1200, 12, 'SUCCESS'],
      ['0x7b31…9de0', 'BTC', 'Bitcoin', 0.00412, 6, 'SUCCESS'],
      ['0x1c88…4af7', 'HTX', 'Hotcoin', 350, 2, 'PENDING'],
      ['0x5e02…b8c3', 'USDT', 'ERC-20', 800, 9, 'SUCCESS']
    ];
    $('#chainBody').innerHTML = rows.map(r => `
      <tr>
        <td class="mono" style="color:#c4b5fd">${r[0]}</td>
        <td>${r[1]}</td>
        <td><span class="chip">${r[2]}</span></td>
        <td class="mono">${nf(r[3], r[1] === 'BTC' ? 5 : 2)}</td>
        <td class="mono">${r[4]}/12</td>
        <td>${statusBadge(r[5])}</td>
      </tr>`).join('');
  }

  /* ----------------------------------------------------------------------
     16. EXPORT CSV
     ---------------------------------------------------------------------- */
  function initExport() {
    $('#exportCsvBtn').addEventListener('click', () => {
      const head = 'serial,transaction_id,type,counterparty,bank,channel,amount,currency,status,datetime\n';
      const body = state.txs.map(t => [t.serial, t.id, t.type, `"${t.name}"`, `"${t.bank}"`, t.channel, t.amount, t.ccy, t.status, `"${stamp(t.ts)}"`].join(',')).join('\n');
      const blob = new Blob([head + body], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gpb-transactions.csv';
      a.click();
      toast('Export ready', state.txs.length + ' transactions exported.');
    });
    $('#txSearch').addEventListener('input', e => renderAllTx(e.target.value));
  }

  /* ----------------------------------------------------------------------
     17. GLOBAL WIRING
     ---------------------------------------------------------------------- */
  function initGlobal() {
    $$('.nav-item').forEach(n => n.addEventListener('click', () => go(n.dataset.view)));
    $$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

    $('#copyAcctBtn').addEventListener('click', copyAcct);
    $('#acctNo').addEventListener('click', copyAcct);

    $('#alertBtn').addEventListener('click', () => {
      openModal(`
        <div class="modal-head"><div><h3>Notifications</h3><p>Latest account alerts</p></div><button class="x">×</button></div>
        ${state.sms.slice(0, 6).map(s => `<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:12px;line-height:1.55;color:#b9cbe4"><div class="mini" style="color:#7dd3fc">${stamp(s.t)}</div>${esc(s.body)}</div>`).join('')}
      `);
    });

    $('#clockBtn').addEventListener('click', () => {
      toast('System time', stamp() + ' · WAT (UTC+1)');
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function copyAcct() {
    navigator.clipboard?.writeText('3855158987')
      .then(() => toast('Copied', 'Account number 3855158987 copied.'))
      .catch(() => toast('Account number', '3855158987'));
  }

  /* ----------------------------------------------------------------------
     18. BOOT
     ---------------------------------------------------------------------- */
  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;

    if (!load()) seed();

    renderFX();
    renderWallets();
    renderDashboard();
    renderAllTx();
    renderRecipients();
    renderCustomers();
    renderAudit();
    renderChain();
    renderAlerts();
    updateFee();

    initGlobal();
    initTransfer();
    initTerminal();
    initATM();
    initUSSD();
    initAdmin();
    initExport();

    bootTerminal();

    // live dashboard ticker
    setInterval(() => {
      if (!T.running) return;
      // occasional background credit to keep stats alive
    }, 5000);
  }

  /* start */
  document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    // prefill demo password for convenience
    $('#loginPass').value = 'GPB2024';
  });
})();
