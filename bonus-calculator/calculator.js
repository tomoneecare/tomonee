/**
 * Tomonee Bonus Feature - Financial Mirror
 * Calculator Logic for Cek Pinjol & Lunas Cepat
 */

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Format number to Indonesian Rupiah
 */
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

/**
 * Parse Indonesian number format to integer
 */
function parseNumber(str) {
    if (!str) return 0;
    // Remove all non-digit characters except minus
    return parseInt(str.replace(/[^\d-]/g, '')) || 0;
}

/**
 * Format input field as currency while typing
 */
function formatInputAsCurrency(input) {
    let value = input.value.replace(/[^\d]/g, '');
    if (value) {
        value = parseInt(value).toLocaleString('id-ID');
    }
    input.value = value;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        button.textContent = '✓ Tersalin!';
        button.classList.add('copied');
        setTimeout(() => {
            button.textContent = '📋 Salin Realita';
            button.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

// =============================================
// MODULE TOGGLE
// =============================================

document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update buttons
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update modules
        const moduleId = btn.dataset.module;
        document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
        document.getElementById(moduleId).classList.add('active');
    });
});

// Handle URL hash on page load (for direct links like #cek-pinjol or #lunas-cepat)
function handleHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'cek-pinjol' || hash === 'lunas-cepat') {
        // Update buttons
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        const targetBtn = document.querySelector(`.toggle-btn[data-module="${hash}"]`);
        if (targetBtn) targetBtn.classList.add('active');

        // Update modules
        document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
        const targetModule = document.getElementById(hash);
        if (targetModule) targetModule.classList.add('active');
    }
}

// Run on load and hash change
window.addEventListener('load', handleHash);
window.addEventListener('hashchange', handleHash);

// =============================================
// INPUT FORMATTING
// =============================================

// Format currency inputs on input
document.querySelectorAll('#nominal-cair, #cicilan-baru, #pokok-sisa').forEach(input => {
    input.addEventListener('input', () => formatInputAsCurrency(input));
});

// =============================================
// MODULE 1: CEK PINJOL (Loan Comparison)
// =============================================

let cicilanCount = 0;

/**
 * Add a new debt item to the list
 */
function addCicilanItem() {
    cicilanCount++;
    const container = document.getElementById('cicilan-list');

    const item = document.createElement('div');
    item.className = 'cicilan-item';
    item.dataset.id = cicilanCount;
    item.innerHTML = `
        <div class="input-group" style="margin:0">
            <div class="input-wrapper">
                <span class="input-prefix">Rp</span>
                <input type="text" class="input-field cicilan-amount" placeholder="500.000" inputmode="numeric">
            </div>
        </div>
        <div class="input-wrapper" style="height:40px">
            <input type="number" class="input-field cicilan-months" placeholder="6" min="1" style="padding:8px 12px">
            <span class="input-suffix" style="height:40px;font-size:0.8rem">bln</span>
        </div>
        <button class="remove-btn" onclick="removeCicilanItem(${cicilanCount})">×</button>
    `;

    container.appendChild(item);

    // Add currency formatting to the new input
    const amountInput = item.querySelector('.cicilan-amount');
    amountInput.addEventListener('input', () => formatInputAsCurrency(amountInput));
}

/**
 * Remove a debt item from the list
 */
function removeCicilanItem(id) {
    const item = document.querySelector(`.cicilan-item[data-id="${id}"]`);
    if (item) {
        item.style.animation = 'slideOut 0.2s ease forwards';
        setTimeout(() => item.remove(), 200);
    }
}

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to { opacity: 0; transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Add cicilan button handler
document.getElementById('add-cicilan').addEventListener('click', addCicilanItem);

/**
 * Calculate and display Cek Pinjol results
 */
function hitungCekPinjol() {
    // Get new loan inputs
    const nominalCair = parseNumber(document.getElementById('nominal-cair').value);
    const cicilanBaru = parseNumber(document.getElementById('cicilan-baru').value);
    const tenorBaru = parseInt(document.getElementById('tenor-baru').value) || 0;

    // Validate inputs
    if (nominalCair <= 0 || cicilanBaru <= 0 || tenorBaru <= 0) {
        alert('Mohon isi semua field pinjaman baru dengan angka yang valid.');
        return;
    }

    // Calculate new loan total
    const totalPinjamanBaru = cicilanBaru * tenorBaru;
    const hargaSebenarnya = (totalPinjamanBaru / nominalCair * 100).toFixed(0);

    // Calculate current debts total and monthly burden
    let totalCicilanSekarang = 0;
    let totalHutangSekarang = 0;

    document.querySelectorAll('.cicilan-item').forEach(item => {
        const amount = parseNumber(item.querySelector('.cicilan-amount').value);
        const months = parseInt(item.querySelector('.cicilan-months').value) || 0;
        totalCicilanSekarang += amount;
        totalHutangSekarang += amount * months;
    });

    // Calculate new monthly burden
    const bebanBaruBulanan = totalCicilanSekarang + cicilanBaru;

    // Calculate total outflow (current debts + new loan)
    const totalSemua = totalHutangSekarang + totalPinjamanBaru;

    // Update UI
    document.getElementById('harga-sebenarnya').textContent = hargaSebenarnya + '%';
    document.getElementById('detail-pinjaman').textContent =
        `Kamu menerima ${formatRupiah(nominalCair)}, tapi total yang akan kamu bayar adalah ${formatRupiah(totalPinjamanBaru)} selama ${tenorBaru} bulan.`;

    document.getElementById('beban-sekarang').textContent = formatRupiah(totalCicilanSekarang);
    document.getElementById('beban-baru').textContent = formatRupiah(bebanBaruBulanan);

    // Insight message
    const selisih = bebanBaruBulanan - totalCicilanSekarang;
    let insightText = '';
    if (selisih > 0) {
        insightText = `Beban bulananmu akan bertambah ${formatRupiah(selisih)}. Pastikan napas keuanganmu masih cukup.`;
    } else if (totalCicilanSekarang === 0) {
        insightText = `Ini akan menjadi cicilan pertamamu. Setiap bulan, ${formatRupiah(cicilanBaru)} harus siap keluar.`;
    }
    document.getElementById('insight-beban').textContent = insightText;

    // Total outflow
    let totalKeluarText = `Total hutang saat ini: ${formatRupiah(totalHutangSekarang)}`;
    totalKeluarText += `\nTotal pinjaman baru: ${formatRupiah(totalPinjamanBaru)}`;
    totalKeluarText += `\n\nTotal keseluruhan yang akan keluar: ${formatRupiah(totalSemua)}`;
    document.getElementById('total-keluar').style.whiteSpace = 'pre-line';
    document.getElementById('total-keluar').textContent = totalKeluarText;

    // Show result
    document.getElementById('result-pinjol').classList.remove('hidden');
    document.getElementById('result-pinjol').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Store data for copy function
    window.pinjolData = {
        nominalCair,
        cicilanBaru,
        tenorBaru,
        totalPinjamanBaru,
        hargaSebenarnya,
        totalCicilanSekarang,
        bebanBaruBulanan,
        totalSemua
    };
}

document.getElementById('hitung-pinjol').addEventListener('click', hitungCekPinjol);

/**
 * Copy Cek Pinjol results
 */
document.getElementById('copy-pinjol').addEventListener('click', function () {
    const d = window.pinjolData;
    if (!d) return;

    const text = `📊 REALITA KEUANGANKU
━━━━━━━━━━━━━━━━━━

💰 Pinjaman yang dipertimbangkan:
• Nominal cair: ${formatRupiah(d.nominalCair)}
• Cicilan/bulan: ${formatRupiah(d.cicilanBaru)}
• Tenor: ${d.tenorBaru} bulan

⚠️ Harga Sebenarnya: ${d.hargaSebenarnya}%
Total yang akan dibayar: ${formatRupiah(d.totalPinjamanBaru)}

📉 Beban Napas Bulanan:
• Sekarang: ${formatRupiah(d.totalCicilanSekarang)}
• Jika ambil pinjaman baru: ${formatRupiah(d.bebanBaruBulanan)}

💸 Total uang yang akan keluar: ${formatRupiah(d.totalSemua)}

━━━━━━━━━━━━━━━━━━
Dibuat dengan Tomonee Financial Mirror
tomonee.com/bonus-calculator`;

    copyToClipboard(text, this);
});

// =============================================
// MODULE 2: LUNAS CEPAT (Early Payoff)
// =============================================

/**
 * Calculate and display Lunas Cepat results
 */
function hitungLunasCepat() {
    // Get inputs
    const pokokSisa = parseNumber(document.getElementById('pokok-sisa').value);
    const bungaRate = parseFloat(document.getElementById('bunga-rate').value) || 0;
    const tipeBunga = document.getElementById('tipe-bunga').value;
    const sisaTenor = parseInt(document.getElementById('sisa-tenor').value) || 0;
    const targetLunas = parseInt(document.getElementById('target-lunas').value) || 0;

    // Validate inputs
    if (pokokSisa <= 0 || bungaRate <= 0 || sisaTenor <= 0 || targetLunas <= 0) {
        alert('Mohon isi semua field dengan angka yang valid.');
        return;
    }

    if (targetLunas >= sisaTenor) {
        alert('Target lunas harus lebih cepat dari sisa tenor.');
        return;
    }

    // Calculate based on interest type
    let bungaFullTerm, bungaEarly;

    if (tipeBunga === 'daily') {
        // Daily interest calculation
        const dailyRate = bungaRate / 100;
        bungaFullTerm = pokokSisa * dailyRate * sisaTenor;
        bungaEarly = pokokSisa * dailyRate * targetLunas;
    } else {
        // Monthly interest calculation
        const monthlyRate = bungaRate / 100;
        const sisaBulan = sisaTenor / 30;
        const targetBulan = targetLunas / 30;
        bungaFullTerm = pokokSisa * monthlyRate * sisaBulan;
        bungaEarly = pokokSisa * monthlyRate * targetBulan;
    }

    const totalFullTerm = pokokSisa + bungaFullTerm;
    const totalEarly = pokokSisa + bungaEarly;
    const penghematan = totalFullTerm - totalEarly;

    // Update UI
    document.getElementById('jadwal-hari').textContent = `${sisaTenor} hari lagi`;
    document.getElementById('total-jadwal').textContent = formatRupiah(totalFullTerm);

    document.getElementById('target-hari').textContent = targetLunas;
    document.getElementById('total-cepat').textContent = formatRupiah(totalEarly);

    document.getElementById('penghematan').textContent = formatRupiah(penghematan);

    // Show result
    document.getElementById('result-lunas').classList.remove('hidden');
    document.getElementById('result-lunas').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Store data for copy function
    window.lunasData = {
        pokokSisa,
        bungaRate,
        tipeBunga: tipeBunga === 'daily' ? 'per hari' : 'per bulan',
        sisaTenor,
        targetLunas,
        totalFullTerm,
        totalEarly,
        penghematan
    };
}

document.getElementById('hitung-lunas').addEventListener('click', hitungLunasCepat);

/**
 * Copy Lunas Cepat results
 */
document.getElementById('copy-lunas').addEventListener('click', function () {
    const d = window.lunasData;
    if (!d) return;

    const text = `🎯 POTENSI PENGHEMATANKU
━━━━━━━━━━━━━━━━━━

💳 Detail Hutang:
• Sisa pokok: ${formatRupiah(d.pokokSisa)}
• Bunga: ${d.bungaRate}% ${d.tipeBunga}
• Sisa tenor: ${d.sisaTenor} hari

📅 Perbandingan:
• Kalau bayar sesuai jadwal (${d.sisaTenor} hari): ${formatRupiah(d.totalFullTerm)}
• Kalau lunas di hari ke-${d.targetLunas}: ${formatRupiah(d.totalEarly)}

💚 Uang yang diselamatkan: ${formatRupiah(d.penghematan)}

Ini bukan uang "hilang" — ini uang yang tetap jadi milikku.

━━━━━━━━━━━━━━━━━━
Dibuat dengan Tomonee Financial Mirror
tomonee.com/bonus-calculator`;

    copyToClipboard(text, this);
});

// =============================================
// FORMAT POKOK SISA INPUT
// =============================================

document.getElementById('pokok-sisa').addEventListener('input', function () {
    formatInputAsCurrency(this);
});

// Initial empty state for cicilan list
document.getElementById('cicilan-list').innerHTML = `
    <p style="text-align: center; color: #8A8D82; font-size: 0.9rem; padding: 16px;">
        Belum ada cicilan yang ditambahkan.<br>
        <span style="font-size: 0.8rem;">Klik tombol di bawah untuk menambah.</span>
    </p>
`;

// Update empty state when adding first item
const originalAddCicilan = addCicilanItem;
window.addCicilanItem = function () {
    const list = document.getElementById('cicilan-list');
    if (list.querySelector('p')) {
        list.innerHTML = '';
    }
    originalAddCicilan();
};

document.getElementById('add-cicilan').removeEventListener('click', addCicilanItem);
document.getElementById('add-cicilan').addEventListener('click', window.addCicilanItem);
