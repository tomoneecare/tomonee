import { html, render, useState, useEffect } from 'https://unpkg.com/htm/preact/standalone.module.js';

// --- Helper Functions ---
const formatCurrency = (value) => {
    if (value === 0) return "Rp 0"; // Allow 0
    if (!value) return "";
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value);
};

const parse = (input) => {
    if (!input) return 0;
    return Number(input.toString().replace(/[^0-9]/g, ''));
};

const CurrencyInput = ({ value, onChange, placeholder, ...props }) => {
    // Internal state for the input display
    // When focused, show raw number. When blurred, show formatted.
    const [displayVal, setDisplayVal] = useState(value === 0 ? "" : formatCurrency(value));
    const [isFocused, setIsFocused] = useState(false);

    // Sync external changes if not focused (e.g. initial load or external reset)
    useEffect(() => {
        if (!isFocused) {
            setDisplayVal(value === 0 ? "" : formatCurrency(value));
        }
    }, [value, isFocused]);

    const handleFocus = (e) => {
        setIsFocused(true);
        // On focus, show raw numeric value for easy editing
        const raw = value === 0 ? "" : value.toString();
        setDisplayVal(raw);
        e.target.select(); // Optional: select all for quick replace
    };

    const handleBlur = () => {
        setIsFocused(false);
        // On blur, re-format
        setDisplayVal(value === 0 ? "" : formatCurrency(value));
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setDisplayVal(val); // Update display immediately
        const num = parse(val);
        onChange(num); // Propagate numeric value
    };

    return html`
        <input 
            type="text" 
            class="sim-input"
            value=${displayVal}
            onInput=${handleChange}
            onFocus=${handleFocus}
            onBlur=${handleBlur}
            placeholder=${placeholder}
            ...${props}
        />
    `;
};

const CerminFinansial = () => {
    const [income, setIncome] = useState(0);
    const [obligations, setObligations] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [savings, setSavings] = useState(0);

    const burnRate = obligations + expenses;
    const monthlyBalance = income - burnRate;

    // Worst Case: If income stops today
    const survivalDays = burnRate > 0 ? Math.floor((savings / burnRate) * 30) : 0;

    // Real Pace: At current spending relative to income gap
    let runwayText = "\u221E";
    if (monthlyBalance < 0) {
        const daysUntilBroke = Math.floor((savings / Math.abs(monthlyBalance)) * 30);
        runwayText = `${daysUntilBroke} hari`;
    } else {
        runwayText = "Aman (Sustainable)";
    }

    const isDeficit = monthlyBalance < 0;

    return html`
        <div>
            <div class="info-box">
                <div class="info-icon">🛡️</div>
                <div class="info-content">
                    <h4>TUJUAN CERMIN INI</h4>
                    <p>Kita akan melihat dua hal: <strong>Ketahanan</strong> (seberapa kuat tabunganmu menopang gaya hidupmu saat ini) dan <strong>Cadangan</strong> (apa yang terjadi jika pendapatan tiba-tiba berhenti).</p>
                </div>
            </div>

            <div class="lite-input-stack">
                <div class="input-group">
                    <label>Pendapatan bulanan saat ini</label>
                     <${CurrencyInput} 
                        value=${income} 
                        onChange=${setIncome}
                        placeholder="Rp 0" />
                </div>

                <div class="sim-grid">
                    <div class="input-group">
                        <label>Cicilan & Kewajiban</label>
                        <${CurrencyInput} 
                            value=${obligations} 
                            onChange=${setObligations}
                            placeholder="Rp 0" />
                    </div>
                    <div class="input-group">
                        <label>Biaya Hidup Rutin</label>
                        <${CurrencyInput} 
                            value=${expenses} 
                            onChange=${setExpenses}
                            placeholder="Rp 0" />
                    </div>
                </div>

                <div class="input-group">
                    <label>Total Saldo Tabungan / Tunai</label>
                    <${CurrencyInput} 
                        value=${savings} 
                        onChange=${setSavings}
                        placeholder="Rp 0" />
                </div>
            </div>

            <button class="lite-action-btn" onClick=${() => window.dispatchEvent(new CustomEvent('simulation-complete'))}>Lihat Realita</button>

            <!-- Results Section (conditionally hidden or just shown below) -->
            <div class="sim-results" style="margin-top: 30px;">
                <div class="result-item">
                    <span class="result-label">Napas Darurat</span>
                    <span class="result-value text-xl">${survivalDays} Hari</span>
                    <span class="result-sub">Jika pendapatan stop hari ini.</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Status Bulanan</span>
                    <span class="result-value text-xl" style=${{ color: isDeficit ? 'var(--accent-brown)' : 'var(--primary-green)' }}>
                        ${monthlyBalance >= 0 ? 'Surplus' : 'Defisit'}
                    </span>
                    <span class="result-sub">${formatCurrency(monthlyBalance)} / bulan</span>
                </div>
            </div>
             ${isDeficit && html`
                <div class="sim-alert">
                    ⚠️ <strong>Peringatan Defisit:</strong> Tabunganmu akan habis dalam ${runwayText} jika pola ini berlanjut.
                </div>
            `}
        </div>
    `;
};

const KapanLunas = () => {
    const [debt, setDebt] = useState(0);
    const [interestRate, setInterestRate] = useState(0); // Annual %
    const [payment, setPayment] = useState(0);
    const [income, setIncome] = useState(0);

    const monthlyInterestRate = (interestRate / 100) / 12;
    const minPayment = debt * monthlyInterestRate;

    // Calculate Payoff Time
    let monthsToPayoff = Infinity;
    if (payment > minPayment) {
        monthsToPayoff = Math.log(payment / (payment - debt * monthlyInterestRate)) / Math.log(1 + monthlyInterestRate);
    }

    const stressRatio = income > 0 ? (payment / income) * 100 : 0;

    let stressLabel = "Terukur";
    let stressColor = "var(--primary-green)";
    if (stressRatio > 50) {
        stressLabel = "Sangat Berat";
        stressColor = "var(--accent-brown)";
    } else if (stressRatio > 30) {
        stressLabel = "Menyita";
        stressColor = "#d4a72c"; // Warning yellow/orange
    }

    const isTrap = payment > 0 && payment <= minPayment && debt > 0;

    return html`
        <div>
             <div class="info-box">
                <div class="info-icon">📈</div>
                <div class="info-content">
                    <h4>ESTIMASI UTANG</h4>
                    <p>Cek kapan utangmu akan lunas dengan alokasi saat ini, dan seberapa berat beban ini terhadap income.</p>
                </div>
            </div>

             <div class="lite-input-stack">
                <div class="sim-grid">
                    <div class="input-group">
                        <label>Sisa Pokok Utang</label>
                        <${CurrencyInput} 
                            value=${debt} 
                            onChange=${setDebt}
                            placeholder="Rp 0" />
                    </div>
                    <div class="input-group">
                        <label>Bunga Tahunan (%)</label>
                        <input type="number" class="sim-input" 
                            value=${interestRate}
                            onInput=${(e) => setInterestRate(Number(e.target.value))} 
                            placeholder="12" />
                    </div>
                </div>

                 <div class="input-group">
                    <label>Alokasi Bayar / Bulan</label>
                    <${CurrencyInput} 
                        value=${payment} 
                        onChange=${setPayment}
                        placeholder="Rp 0" />
                </div>
                 <div class="input-group">
                    <label>Pemasukan Bulanan (Opsional)</label>
                    <${CurrencyInput} 
                        value=${income} 
                        onChange=${setIncome}
                        placeholder="Rp 0" />
                </div>
             </div>

             <button class="lite-action-btn" onClick=${() => window.dispatchEvent(new CustomEvent('simulation-complete'))}>Hitung Estimasi</button>

             <div class="sim-results" style="margin-top: 30px;">
                 <div class="result-item">
                     <span class="result-label">Estimasi Lunas</span>
                     <span class="result-value text-xl">
                        ${isTrap ? '\u221E (Tidak akan lunas)' : (monthsToPayoff === Infinity || isNaN(monthsToPayoff)) ? '-' : `${Math.ceil(monthsToPayoff)} Bulan`}
                     </span>
                     <span className="result-sub">
                        ${isTrap ? 'Pembayaran < Bunga Bulanan' : 'Asumsi bunga tetap'}
                     </span>
                 </div>
                 <div class="result-item">
                     <span class="result-label">Rasio Beban</span>
                     <span class="result-value text-xl" style=${{ color: stressColor }}>${stressLabel}</span>
                     <span className="result-sub">${stressRatio.toFixed(1)}% dari income</span>
                 </div>
             </div>
        </div>
    `;
};

// --- Main App ---
const SimulationApp = () => {
    const [activeTab, setActiveTab] = useState('cermin');

    return html`
        <div class="sim-lite-wrapper">
            <div class="lite-header">
                <h2 class="lite-title">Cek Kondisi Finansialmu</h2>
            </div>
            
            <div class="tab-switcher">
                <button 
                    class="tab-btn ${activeTab === 'cermin' ? 'active' : ''}" 
                    onClick=${() => setActiveTab('cermin')}
                >
                    Cermin
                </button>
                <button 
                    class="tab-btn ${activeTab === 'lunas' ? 'active' : ''}" 
                    onClick=${() => setActiveTab('lunas')}
                >
                    Kapan Lunas?
                </button>
            </div>

            <div class="lite-card">
                ${activeTab === 'cermin' ? html`<${CerminFinansial} />` : html`<${KapanLunas} />`}
            </div>
        </div>
    `;
};

// Render
const rootElement = document.getElementById('financial-simulation-root');
if (rootElement) {
    console.log("Mounting Simulation App...");
    render(html`<${SimulationApp} />`, rootElement);
    console.log("Mounted.");
} else {
    console.error("Root element #financial-simulation-root not found!");
}
