/**
 * AlphaNifty Investment Calculators - UI Controller
 */

// Global state variables
let currentMode = 'sip'; // 'sip', 'swp', or 'lumpsum'
let stepUpType = 'percent'; // 'percent' or 'fixed'
let currentGraphicsTab = 'chart'; // 'chart', 'donut', or '3d'
let lineChart = null;
let donutChart = null;

// Initialize when DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initSyncing();
    initCharts();
    loadUrlParams();
    updateHero(currentMode);
    updateEducationalCard(currentMode);
    calculate();
});

/**
 * Connect range sliders with manual number inputs so they synchronize in real-time.
 */
function initSyncing() {
    const mappings = [
        // SIP
        { slider: 'sip-monthly-slider', input: 'sip-monthly-value' },
        { slider: 'sip-return-slider', input: 'sip-return-value' },
        { slider: 'sip-years-slider', input: 'sip-years-value' },
        { slider: 'sip-step-percent-slider', input: 'sip-step-percent-value' },
        { slider: 'sip-step-fixed-slider', input: 'sip-step-fixed-value' },
        // SWP
        { slider: 'swp-total-slider', input: 'swp-total-value' },
        { slider: 'swp-withdraw-slider', input: 'swp-withdraw-value' },
        { slider: 'swp-return-slider', input: 'swp-return-value' },
        { slider: 'swp-inflation-slider', input: 'swp-inflation-value' },
        { slider: 'swp-years-slider', input: 'swp-years-value' },
        // Lumpsum
        { slider: 'lumpsum-total-slider', input: 'lumpsum-total-value' },
        { slider: 'lumpsum-return-slider', input: 'lumpsum-return-value' },
        { slider: 'lumpsum-years-slider', input: 'lumpsum-years-value' }
    ];

    mappings.forEach(map => {
        const sliderEl = document.getElementById(map.slider);
        const inputEl = document.getElementById(map.input);
        
        if (sliderEl && inputEl) {
            // Slider drags -> update manual input box
            sliderEl.addEventListener('input', () => {
                inputEl.value = sliderEl.value;
                calculate();
            });

            // Input box edits -> update slider position (clamped by min/max/step)
            inputEl.addEventListener('input', () => {
                let val = parseFloat(inputEl.value);
                if (isNaN(val)) return;
                
                const min = parseFloat(sliderEl.min);
                const max = parseFloat(sliderEl.max);
                
                // Keep slider updated but don't strictly clamp while typing to prevent frustration
                if (val >= min && val <= max) {
                    sliderEl.value = val;
                }
                calculate();
            });

            // Input box loses focus -> apply strict clamp and formatting
            inputEl.addEventListener('blur', () => {
                let val = parseFloat(inputEl.value);
                const min = parseFloat(sliderEl.min);
                const max = parseFloat(sliderEl.max);

                if (isNaN(val) || val < min) val = min;
                if (val > max) val = max;

                // Round to slider steps
                const step = parseFloat(sliderEl.step);
                val = Math.round(val / step) * step;

                inputEl.value = val;
                sliderEl.value = val;
                calculate();
            });
        }
    });

    // Handle Step-Up Toggle checkbox
    const stepUpToggle = document.getElementById('sip-stepup-toggle');
    if (stepUpToggle) {
        stepUpToggle.addEventListener('change', () => {
            const controls = document.getElementById('sip-stepup-controls');
            if (stepUpToggle.checked) {
                controls.classList.add('active');
            } else {
                controls.classList.remove('active');
            }
            calculate();
        });
    }
}

/**
 * Switches the primary calculator tab (SIP, SWP, Lumpsum)
 * @param {string} mode 'sip', 'swp', or 'lumpsum'
 */
function switchTab(mode) {
    currentMode = mode;
    
    // Update Tab Buttons UI
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${mode}`).classList.add('active');

    // Update Input Containers UI
    document.querySelectorAll('.inputs-group').forEach(group => group.classList.remove('active'));
    document.getElementById(`${mode}-inputs`).classList.add('active');

    // Update Hero text dynamically
    updateHero(mode);

    // Update Educational Card dynamically
    updateEducationalCard(mode);

    // Recalculate and update charts
    calculate();
}

/**
 * Updates the hero title and subtitle dynamically based on the active calculator mode.
 * @param {string} mode 'sip', 'swp', or 'lumpsum'
 */
function updateHero(mode) {
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    if (!heroTitle || !heroSubtitle) return;

    if (mode === 'sip') {
        heroTitle.innerHTML = `Systematic Investment Plan <span class="text-green">SIP Calculator</span>`;
        heroSubtitle.innerText = `Plan your regular monthly investments, leverage the compounding power of annual step-ups, and visualize your future wealth growth in real-time.`;
    } else if (mode === 'swp') {
        heroTitle.innerHTML = `Systematic Withdrawal Plan <span class="text-green">SWP Calculator</span>`;
        heroSubtitle.innerText = `Plan your regular income stream. Estimate how long your investments will last and watch your wealth compound in real-time with high-level 3D infographics.`;
    } else if (mode === 'lumpsum') {
        heroTitle.innerHTML = `Lumpsum Investment <span class="text-green">Lumpsum Calculator</span>`;
        heroSubtitle.innerText = `Calculate the compound interest on your one-time investment. Estimate long-term wealth growth and compounding velocity in real-time.`;
    }
}

/**
 * Switches the sub-input options for SIP Step Up type (Percentage vs Fixed)
 * @param {string} type 'percent' or 'fixed'
 */
function toggleStepUpType(type) {
    stepUpType = type;

    // Toggle button active styling
    document.getElementById('step-type-percent').classList.toggle('active', type === 'percent');
    document.getElementById('step-type-fixed').classList.toggle('active', type === 'fixed');

    // Show/Hide sliders
    document.getElementById('step-percent-wrapper').classList.toggle('hidden', type !== 'percent');
    document.getElementById('step-fixed-wrapper').classList.toggle('hidden', type !== 'fixed');

    calculate();
}

/**
 * Switches the graphics view tab (Growth Line, Donut Distribution, 3D Compounding)
 * @param {string} tab 'chart', 'donut', or '3d'
 */
function switchGraphicsTab(tab) {
    currentGraphicsTab = tab;

    // Toggle button active styling
    document.querySelectorAll('.graphics-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`gt-${tab}`).classList.add('active');

    // Toggle viewport active styling
    document.querySelectorAll('.graphics-viewport').forEach(vp => vp.classList.remove('active'));
    document.getElementById(`viewport-${tab}`).classList.add('active');
}

/**
 * Initialize empty Chart.js configurations
 */
function initCharts() {
    // 1. Line/Area Compounding Chart
    const ctxLine = document.getElementById('growthLineChart').getContext('2d');
    lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { family: 'Outfit', weight: '600', size: 12 },
                        color: '#475569'
                    }
                },
                tooltip: {
                    padding: 12,
                    bodyFont: { family: 'Inter', size: 13 },
                    titleFont: { family: 'Outfit', weight: '700', size: 14 },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: 'Outfit', weight: '600' },
                        color: '#64748B'
                    },
                    title: {
                        display: true,
                        text: 'Years',
                        font: { family: 'Outfit', weight: '700', size: 12 },
                        color: '#475569'
                    }
                },
                y: {
                    grid: { color: '#E2E8F0', borderDash: [5, 5] },
                    ticks: {
                        font: { family: 'Inter' },
                        color: '#64748B',
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        }
                    }
                }
            }
        }
    });

    // 2. Doughnut Distribution Chart
    const ctxDonut = document.getElementById('distributionDonutChart').getContext('2d');
    donutChart = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Outfit', weight: '600', size: 12 },
                        color: '#475569',
                        padding: 15
                    }
                },
                tooltip: {
                    padding: 10,
                    bodyFont: { family: 'Inter', size: 13 },
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            if (context.parsed !== null) {
                                label += formatCurrency(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Main calculation logic router. Fetches values from UI, triggers calculations,
 * and updates summary cards, charts, 3D pillars, and tables.
 */
function calculate() {
    let result = null;
    
    if (currentMode === 'sip') {
        const amt = parseFloat(document.getElementById('sip-monthly-slider').value);
        const rate = parseFloat(document.getElementById('sip-return-slider').value);
        const yrs = parseFloat(document.getElementById('sip-years-slider').value);
        const hasStepUp = document.getElementById('sip-stepup-toggle').checked;
        
        let stepPct = 0;
        let stepAmt = 0;
        if (hasStepUp) {
            if (stepUpType === 'percent') {
                stepPct = parseFloat(document.getElementById('sip-step-percent-slider').value);
            } else {
                stepAmt = parseFloat(document.getElementById('sip-step-fixed-slider').value);
            }
        }

        result = window.Calculators.calculateSIP(amt, rate, yrs, stepPct, stepAmt);
        updateSIPUI(result, yrs);

    } else if (currentMode === 'swp') {
        const totalInv = parseFloat(document.getElementById('swp-total-slider').value);
        const withdraw = parseFloat(document.getElementById('swp-withdraw-slider').value);
        const rate = parseFloat(document.getElementById('swp-return-slider').value);
        const inf = parseFloat(document.getElementById('swp-inflation-slider').value);
        const yrs = parseFloat(document.getElementById('swp-years-slider').value);

        result = window.Calculators.calculateSWP(totalInv, withdraw, rate, inf, yrs);
        updateSWPUI(result, yrs);

    } else if (currentMode === 'lumpsum') {
        const totalInv = parseFloat(document.getElementById('lumpsum-total-slider').value);
        const rate = parseFloat(document.getElementById('lumpsum-return-slider').value);
        const yrs = parseFloat(document.getElementById('lumpsum-years-slider').value);

        result = window.Calculators.calculateLumpsum(totalInv, rate, yrs);
        updateLumpsumUI(result, yrs);
    }

    // Cache calculation values globally on window object for exports
    window.currentCalculatedResult = result;
}

/**
 * Update SIP metrics, table, charts, and 3D shapes
 */
function updateSIPUI(result, years) {
    const summary = result.summary;
    
    // 1. Text Summary Metrics
    document.getElementById('lbl-metric-1').innerText = 'Total Invested';
    document.getElementById('val-metric-1').innerText = formatCurrency(summary.totalInvested);

    document.getElementById('lbl-metric-2').innerText = 'Est. Returns';
    document.getElementById('val-metric-2').innerText = formatCurrency(summary.wealthGained);

    document.getElementById('lbl-metric-3').innerText = 'Total Wealth';
    document.getElementById('val-metric-3').innerText = formatCurrency(summary.totalValue);
    
    const multiplier = (summary.totalValue / (summary.totalInvested || 1)).toFixed(2);
    document.getElementById('lbl-metric-4').innerText = 'Growth Multiplier';
    document.getElementById('val-metric-4').innerText = `${multiplier}x Growth`;
    
    const rate = parseFloat(document.getElementById('sip-return-slider').value);
    const hasStepUp = document.getElementById('sip-stepup-toggle').checked;
    
    if (rate > 15) {
        showAlert('caution', 'Optimistic Return assumption:', 'Assumptions above 15% p.a. are optimistic for long-term investments. Historical mutual funds average returns tend to be 12-15%.', 'fa-circle-exclamation');
    } else if (rate < 8) {
        showAlert('info', 'Low Return assumption:', 'Expected returns under 8% are close to average inflation. Consider equity funds to build real wealth over time.', 'fa-circle-info');
    } else if (!hasStepUp) {
        showAlert('info', 'Compounding Tip:', 'You have not enabled Step-Up. Enabling a 10% annual Step-Up can increase your final wealth by up to 50% without altering your current budget!', 'fa-wand-magic-sparkles');
    } else {
        showAlert('success', 'Safe Plan:', 'Your regular SIP investment is active and optimized. The annual step-up will protect your purchasing power from inflation.', 'fa-shield-halved');
    }

    // 2. Year-on-Year Line Chart
    const yearsArr = result.breakdown.map(b => `Year ${b.year}`);
    const investedArr = result.breakdown.map(b => b.cumulativeInvested);
    const valueArr = result.breakdown.map(b => b.closingBalance);

    updateGrowthLineChart(yearsArr, [
        {
            label: 'Total Value',
            data: valueArr,
            borderColor: '#10B981',
            backgroundColor: createChartGradient('#10B981', 0.15),
            fill: true,
            tension: 0.4
        },
        {
            label: 'Invested Capital',
            data: investedArr,
            borderColor: '#2563EB',
            backgroundColor: createChartGradient('#2563EB', 0.05),
            fill: true,
            tension: 0.4
        }
    ]);

    // 3. Distribution Donut Chart
    updateDonutChart(
        ['Invested Capital', 'Estimated Wealth'],
        [summary.totalInvested, summary.wealthGained],
        ['#2563EB', '#10B981']
    );

    // 4. Compounding Speed 3D Info Graphic
    const speedNode = document.getElementById('txt-compounding-speed');
    if (speedNode) {
        speedNode.innerText = `${multiplier}x Growth`;
        speedNode.className = 'speed-badge font-outfit';
    }

    // Update 3D SVG Cylinders
    updateCylinderVisualizer(
        summary.totalInvested,
        summary.wealthGained,
        summary.totalValue,
        'INVESTED',
        'RETURNS',
        'TOTAL WEALTH'
    );

    // 5. Projections Table
    updateTableHeaders(['Year', 'Monthly Investment', 'Invested (Annual)', 'Total Invested', 'Interest Earned', 'Closing Balance']);
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';
    
    result.breakdown.forEach(b => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Year ${b.year}</td>
            <td>${formatCurrency(b.monthlyInvestment)}</td>
            <td>${formatCurrency(b.investedThisYear)}</td>
            <td>${formatCurrency(b.cumulativeInvested)}</td>
            <td>${formatCurrency(b.interestEarnedThisYear)}</td>
            <td>${formatCurrency(b.closingBalance)}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Update SWP metrics, table, charts, and 3D shapes
 */
function updateSWPUI(result, years) {
    const summary = result.summary;

    // 1. Text Summary Metrics
    document.getElementById('lbl-metric-1').innerText = 'Total Invested';
    document.getElementById('val-metric-1').innerText = formatCurrency(summary.totalInvestment);

    document.getElementById('lbl-metric-2').innerText = 'Total Withdrawn';
    document.getElementById('val-metric-2').innerText = formatCurrency(summary.totalWithdrawn);

    document.getElementById('lbl-metric-3').innerText = 'Remaining Wealth';
    document.getElementById('val-metric-3').innerText = formatCurrency(summary.closingBalance);

    const returnsEarned = Math.max(0, summary.closingBalance + summary.totalWithdrawn - summary.totalInvestment);
    document.getElementById('lbl-metric-4').innerText = 'Returns Earned';
    document.getElementById('val-metric-4').innerText = formatCurrency(returnsEarned);

    if (summary.ranOut) {
        const rY = summary.ranOutYear;
        const rM = summary.ranOutMonth % 12 === 0 ? 12 : summary.ranOutMonth % 12;
        showAlert('warning', 'Caution:', `Your withdrawal rate is unsustainable. Your capital will run out in Year ${rY}, Month ${rM}. Consider reducing monthly withdrawal or increasing initial capital.`, 'fa-circle-exclamation');
    } else if (summary.closingBalance < summary.totalInvestment) {
        showAlert('caution', 'Capital Declining:', 'Your capital is decreasing over time. While it lasts the selected period, it may deplete soon after.', 'fa-triangle-exclamation');
    } else {
        showAlert('success', 'Safe Plan:', 'Your withdrawal rate is highly sustainable. Your remaining capital is growing robustly.', 'fa-shield-halved');
    }

    // 2. Year-on-Year Line Chart
    const yearsArr = result.breakdown.map(b => `Year ${b.year}`);
    const balanceArr = result.breakdown.map(b => b.closingBalance);
    const withdrawnArr = result.breakdown.map(b => b.cumulativeWithdrawn);

    updateGrowthLineChart(yearsArr, [
        {
            label: 'Remaining Balance',
            data: balanceArr,
            borderColor: summary.ranOut ? '#EF4444' : '#10B981',
            backgroundColor: createChartGradient(summary.ranOut ? '#EF4444' : '#10B981', 0.12),
            fill: true,
            tension: 0.4
        },
        {
            label: 'Total Withdrawn',
            data: withdrawnArr,
            borderColor: '#F5A623',
            backgroundColor: createChartGradient('#F5A623', 0.05),
            fill: true,
            tension: 0.4
        }
    ]);

    // 3. Distribution Donut Chart
    updateDonutChart(
        ['Remaining Balance', 'Total Withdrawn'],
        [summary.closingBalance, summary.totalWithdrawn],
        [summary.ranOut ? '#EF4444' : '#10B981', '#F5A623']
    );

    // 4. Compounding Speed 3D Info Graphic
    const multiWithdrawn = (summary.totalWithdrawn / (summary.totalInvestment || 1)).toFixed(2);
    const speedNode = document.getElementById('txt-compounding-speed');
    if (speedNode) {
        speedNode.innerText = `${multiWithdrawn}x Withdrawn`;
        speedNode.className = 'speed-badge font-outfit swp-badge';
    }

    // Update 3D SVG Cylinders
    updateCylinderVisualizer(
        summary.totalInvestment,
        summary.totalWithdrawn,
        summary.closingBalance,
        'INVESTED',
        'WITHDRAWN',
        'WEALTH'
    );

    // 5. Projections Table
    updateTableHeaders(['Year', 'Monthly Withdrawal', 'Withdrawn (Annual)', 'Total Withdrawn', 'Interest Earned', 'Closing Balance']);
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';

    result.breakdown.forEach(b => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Year ${b.year}</td>
            <td>${formatCurrency(b.monthlyWithdrawal)}</td>
            <td>${formatCurrency(b.withdrawnThisYear)}</td>
            <td>${formatCurrency(b.cumulativeWithdrawn)}</td>
            <td>${formatCurrency(b.interestEarnedThisYear)}</td>
            <td class="${b.closingBalance === 0 ? 'text-red font-semibold' : ''}">${formatCurrency(b.closingBalance)}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Update Lumpsum metrics, table, charts, and 3D shapes
 */
function updateLumpsumUI(result, years) {
    const summary = result.summary;

    // 1. Text Summary Metrics
    document.getElementById('lbl-metric-1').innerText = 'Total Invested';
    document.getElementById('val-metric-1').innerText = formatCurrency(summary.totalInvested);

    document.getElementById('lbl-metric-2').innerText = 'Est. Returns';
    document.getElementById('val-metric-2').innerText = formatCurrency(summary.wealthGained);

    document.getElementById('lbl-metric-3').innerText = 'Total Wealth';
    document.getElementById('val-metric-3').innerText = formatCurrency(summary.totalValue);

    const multiplier = (summary.totalValue / (summary.totalInvested || 1)).toFixed(2);
    document.getElementById('lbl-metric-4').innerText = 'Growth Multiplier';
    document.getElementById('val-metric-4').innerText = `${multiplier}x Growth`;

    const lumpsumRate = parseFloat(document.getElementById('lumpsum-return-slider').value);
    if (lumpsumRate > 15) {
        showAlert('caution', 'High Return assumption:', 'Assumptions above 15% p.a. are highly optimistic for long-term lumpsum investments. Realistic CAGR is typically 12-15%.', 'fa-circle-exclamation');
    } else if (lumpsumRate < 8) {
        showAlert('info', 'Inflation impact:', 'Returns under 8% are near historical average inflation rates. Consider higher yield assets to achieve significant real compounding.', 'fa-circle-info');
    } else {
        showAlert('success', 'Compounding Active:', 'Your one-time investment is compounding steadily. Time in the market is the key to building large corpuses.', 'fa-shield-halved');
    }

    // 2. Year-on-Year Line Chart
    const yearsArr = result.breakdown.map(b => `Year ${b.year}`);
    const investedArr = result.breakdown.map(b => b.cumulativeInvested);
    const valueArr = result.breakdown.map(b => b.closingBalance);

    updateGrowthLineChart(yearsArr, [
        {
            label: 'Total Value',
            data: valueArr,
            borderColor: '#10B981',
            backgroundColor: createChartGradient('#10B981', 0.15),
            fill: true,
            tension: 0.4
        },
        {
            label: 'Invested Capital',
            data: investedArr,
            borderColor: '#2563EB',
            backgroundColor: createChartGradient('#2563EB', 0.05),
            fill: true,
            tension: 0.4
        }
    ]);

    // 3. Distribution Donut Chart
    updateDonutChart(
        ['Invested Capital', 'Estimated Wealth'],
        [summary.totalInvested, summary.wealthGained],
        ['#2563EB', '#10B981']
    );

    // 4. Compounding Speed 3D Info Graphic
    const speedNode = document.getElementById('txt-compounding-speed');
    if (speedNode) {
        speedNode.innerText = `${multiplier}x Growth`;
        speedNode.className = 'speed-badge font-outfit';
    }

    // Update 3D SVG Cylinders
    updateCylinderVisualizer(
        summary.totalInvested,
        summary.wealthGained,
        summary.totalValue,
        'INVESTED',
        'RETURNS',
        'TOTAL WEALTH'
    );

    // 5. Projections Table
    updateTableHeaders(['Year', 'Invested (Annual)', 'Total Invested', 'Interest Earned', 'Cumulative Interest', 'Closing Balance']);
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';

    result.breakdown.forEach(b => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Year ${b.year}</td>
            <td>${formatCurrency(b.investedThisYear)}</td>
            <td>${formatCurrency(b.cumulativeInvested)}</td>
            <td>${formatCurrency(b.interestEarnedThisYear)}</td>
            <td>${formatCurrency(b.cumulativeInterest)}</td>
            <td>${formatCurrency(b.closingBalance)}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Utility: Set table columns headers
 */
function updateTableHeaders(headers) {
    const headRow = document.getElementById('table-head-row');
    headRow.innerHTML = '';
    headers.forEach(h => {
        const th = document.createElement('th');
        th.innerText = h;
        headRow.appendChild(th);
    });
}

/**
 * Utility: Redraw Chart.js Growth Line Chart
 */
function updateGrowthLineChart(labels, datasets) {
    lineChart.data.labels = labels;
    lineChart.data.datasets = datasets;
    lineChart.update();
}

/**
 * Utility: Redraw Chart.js Donut Chart
 */
function updateDonutChart(labels, data, colors) {
    donutChart.data.labels = labels;
    donutChart.data.datasets = [{
        data: data,
        backgroundColor: colors,
        borderColor: '#FFFFFF',
        borderWidth: 2
    }];
    donutChart.update();
}

/**
 * Utility: Dynamically redraw 3D isometric SVG blocks based on height
 */
/**
 * Utility: Dynamically redraw 3D SVG cylinders based on height and values
 */
function updateCylinderVisualizer(val1, val2, val3, label1, label2, label3) {
    const maxVal = Math.max(val1, val2, val3, 1);
    const MAX_HEIGHT = 160; // Max height for cylinders inside 285px viewport
    const MIN_HEIGHT = 15;  // Minimum height so they look like a small 3D disc even at low values

    const h1 = val1 === 0 ? 0 : Math.max(MIN_HEIGHT, (val1 / maxVal) * MAX_HEIGHT);
    const h2 = val2 === 0 ? 0 : Math.max(MIN_HEIGHT, (val2 / maxVal) * MAX_HEIGHT);
    const h3 = val3 === 0 ? 0 : Math.max(MIN_HEIGHT, (val3 / maxVal) * MAX_HEIGHT);

    updateSingleCylinder(1, h1, val1, label1);
    updateSingleCylinder(2, h2, val2, label2);
    updateSingleCylinder(3, h3, val3, label3);
}

/**
 * Helper: Morph individual SVG cylinder path, top ellipse, text and badge rect
 */
function updateSingleCylinder(index, H, value, labelText) {
    const cx = index === 1 ? 120 : (index === 2 ? 250 : 380);
    const y_base = 230;
    const y_top = y_base - H;

    const sidePath = document.getElementById(`cyl-${index}-side`);
    const topEllipse = document.getElementById(`cyl-${index}-top`);
    const badgeText = document.querySelector(`#cyl-${index}-badge text`);
    const badgeRect = document.querySelector(`#cyl-${index}-badge rect`);
    const labelTextNode = document.getElementById(`lbl-pillar-${index}`);

    // Update label text
    if (labelTextNode) {
        labelTextNode.textContent = labelText;
    }

    // If height is 0, hide or flatten cylinder parts
    if (H === 0) {
        if (sidePath) sidePath.setAttribute('d', '');
        if (topEllipse) {
            topEllipse.setAttribute('cy', y_base.toString());
            topEllipse.setAttribute('opacity', '0.2');
        }
        if (badgeRect) badgeRect.setAttribute('y', (y_base - 34).toString());
        if (badgeText) {
            badgeText.textContent = formatCurrencyShort(value);
            badgeText.setAttribute('y', (y_base - 19).toString());
        }
    } else {
        // Draw cylinder side path
        if (sidePath) {
            const d = `M ${cx - 30},${y_base} A 30,12 0 0,0 ${cx + 30},${y_base} L ${cx + 30},${y_top} A 30,12 0 0,1 ${cx - 30},${y_top} Z`;
            sidePath.setAttribute('d', d);
        }
        // Move top ellipse to new height
        if (topEllipse) {
            topEllipse.setAttribute('cy', y_top.toString());
            topEllipse.setAttribute('opacity', '1.0');
        }
        // Move floating badge rect & text above top ellipse
        if (badgeRect) {
            badgeRect.setAttribute('y', (y_top - 34).toString());
        }
        if (badgeText) {
            badgeText.textContent = formatCurrencyShort(value);
            badgeText.setAttribute('y', (y_top - 19).toString());
        }
    }
}

/**
 * Utility: Create gradient background for Chart.js
 */
function createChartGradient(color, opacity) {
    const ctx = document.getElementById('growthLineChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, hexToRgba(color, opacity));
    gradient.addColorStop(1, hexToRgba(color, 0));
    return gradient;
}

/**
 * Helper: Convert HEX color to RGBA string
 */
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Format helper for Currency values (Indian numbering system standard, ₹)
 */
function formatCurrency(val) {
    const rounded = Math.round(val);
    // standard Indian currency format (e.g. 10,00,000)
    return '₹' + rounded.toLocaleString('en-IN');
}

/**
 * Format helper for Axis Ticks (e.g., 1.5L, 2Cr)
 */
function formatCurrencyShort(val) {
    if (val >= 10000000) {
        return '₹' + (val / 10000000).toFixed(2) + ' Cr';
    } else if (val >= 100000) {
        return '₹' + (val / 100000).toFixed(2) + ' L';
    } else if (val >= 1000) {
        return '₹' + (val / 1000).toFixed(1) + ' K';
    }
    return '₹' + val;
}

/**
 * Reset all calculator parameters in the active tab to defaults
 */
function resetInputs() {
    if (currentMode === 'sip') {
        document.getElementById('sip-monthly-slider').value = 25000;
        document.getElementById('sip-monthly-value').value = 25000;
        document.getElementById('sip-return-slider').value = 12;
        document.getElementById('sip-return-value').value = 12;
        document.getElementById('sip-years-slider').value = 15;
        document.getElementById('sip-years-value').value = 15;
        document.getElementById('sip-stepup-toggle').checked = true;
        document.getElementById('sip-stepup-controls').classList.add('active');
        document.getElementById('sip-step-percent-slider').value = 10;
        document.getElementById('sip-step-percent-value').value = 10;
        document.getElementById('sip-step-fixed-slider').value = 2000;
        document.getElementById('sip-step-fixed-value').value = 2000;
        stepUpType = 'percent';
        document.getElementById('step-type-percent').classList.add('active');
        document.getElementById('step-type-fixed').classList.remove('active');
        document.getElementById('step-percent-wrapper').classList.remove('hidden');
        document.getElementById('step-fixed-wrapper').classList.add('hidden');
    } else if (currentMode === 'swp') {
        document.getElementById('swp-total-slider').value = 5000000;
        document.getElementById('swp-total-value').value = 5000000;
        document.getElementById('swp-withdraw-slider').value = 30000;
        document.getElementById('swp-withdraw-value').value = 30000;
        document.getElementById('swp-return-slider').value = 8;
        document.getElementById('swp-return-value').value = 8;
        document.getElementById('swp-inflation-slider').value = 6;
        document.getElementById('swp-inflation-value').value = 6;
        document.getElementById('swp-years-slider').value = 20;
        document.getElementById('swp-years-value').value = 20;
    } else if (currentMode === 'lumpsum') {
        document.getElementById('lumpsum-total-slider').value = 500000;
        document.getElementById('lumpsum-total-value').value = 500000;
        document.getElementById('lumpsum-return-slider').value = 12;
        document.getElementById('lumpsum-return-value').value = 12;
        document.getElementById('lumpsum-years-slider').value = 15;
        document.getElementById('lumpsum-years-value').value = 15;
    }
    
    calculate();
    showToast('Calculations reset to defaults.');
}

/**
 * Shareable Link Generation: Encodes current state variables in URL hashes/params
 */
function shareCalculation() {
    const params = new URLSearchParams();
    params.set('mode', currentMode);

    if (currentMode === 'sip') {
        params.set('amt', document.getElementById('sip-monthly-slider').value);
        params.set('rate', document.getElementById('sip-return-slider').value);
        params.set('yrs', document.getElementById('sip-years-slider').value);
        const hasStepUp = document.getElementById('sip-stepup-toggle').checked;
        params.set('stepup', hasStepUp ? '1' : '0');
        if (hasStepUp) {
            params.set('steptype', stepUpType);
            if (stepUpType === 'percent') {
                params.set('stepval', document.getElementById('sip-step-percent-slider').value);
            } else {
                params.set('stepval', document.getElementById('sip-step-fixed-slider').value);
            }
        }
    } else if (currentMode === 'swp') {
        params.set('total', document.getElementById('swp-total-slider').value);
        params.set('withdraw', document.getElementById('swp-withdraw-slider').value);
        params.set('rate', document.getElementById('swp-return-slider').value);
        params.set('inf', document.getElementById('swp-inflation-slider').value);
        params.set('yrs', document.getElementById('swp-years-slider').value);
    } else if (currentMode === 'lumpsum') {
        params.set('total', document.getElementById('lumpsum-total-slider').value);
        params.set('rate', document.getElementById('lumpsum-return-slider').value);
        params.set('yrs', document.getElementById('lumpsum-years-slider').value);
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Shareable configuration link copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy link: ', err);
        showToast('Link created: ' + shareUrl);
    });
}

/**
 * Load parameter configurations from URL if present
 */
function loadUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('mode')) return;

    const mode = params.get('mode');
    if (mode === 'sip') {
        switchTab('sip');
        if (params.has('amt')) {
            const amt = params.get('amt');
            document.getElementById('sip-monthly-slider').value = amt;
            document.getElementById('sip-monthly-value').value = amt;
        }
        if (params.has('rate')) {
            const rate = params.get('rate');
            document.getElementById('sip-return-slider').value = rate;
            document.getElementById('sip-return-value').value = rate;
        }
        if (params.has('yrs')) {
            const yrs = params.get('yrs');
            document.getElementById('sip-years-slider').value = yrs;
            document.getElementById('sip-years-value').value = yrs;
        }
        if (params.has('stepup')) {
            const hasStepUp = params.get('stepup') === '1';
            document.getElementById('sip-stepup-toggle').checked = hasStepUp;
            document.getElementById('sip-stepup-controls').classList.toggle('active', hasStepUp);
            
            if (hasStepUp && params.has('steptype') && params.has('stepval')) {
                const sType = params.get('steptype');
                const sVal = params.get('stepval');
                toggleStepUpType(sType);
                if (sType === 'percent') {
                    document.getElementById('sip-step-percent-slider').value = sVal;
                    document.getElementById('sip-step-percent-value').value = sVal;
                } else {
                    document.getElementById('sip-step-fixed-slider').value = sVal;
                    document.getElementById('sip-step-fixed-value').value = sVal;
                }
            }
        }
    } else if (mode === 'swp') {
        switchTab('swp');
        if (params.has('total')) {
            const total = params.get('total');
            document.getElementById('swp-total-slider').value = total;
            document.getElementById('swp-total-value').value = total;
        }
        if (params.has('withdraw')) {
            const w = params.get('withdraw');
            document.getElementById('swp-withdraw-slider').value = w;
            document.getElementById('swp-withdraw-value').value = w;
        }
        if (params.has('rate')) {
            const rate = params.get('rate');
            document.getElementById('swp-return-slider').value = rate;
            document.getElementById('swp-return-value').value = rate;
        }
        if (params.has('inf')) {
            const inf = params.get('inf');
            document.getElementById('swp-inflation-slider').value = inf;
            document.getElementById('swp-inflation-value').value = inf;
        }
        if (params.has('yrs')) {
            const yrs = params.get('yrs');
            document.getElementById('swp-years-slider').value = yrs;
            document.getElementById('swp-years-value').value = yrs;
        }
    } else if (mode === 'lumpsum') {
        switchTab('lumpsum');
        if (params.has('total')) {
            const total = params.get('total');
            document.getElementById('lumpsum-total-slider').value = total;
            document.getElementById('lumpsum-total-value').value = total;
        }
        if (params.has('rate')) {
            const rate = params.get('rate');
            document.getElementById('lumpsum-return-slider').value = rate;
            document.getElementById('lumpsum-return-value').value = rate;
        }
        if (params.has('yrs')) {
            const yrs = params.get('yrs');
            document.getElementById('lumpsum-years-slider').value = yrs;
            document.getElementById('lumpsum-years-value').value = yrs;
        }
    }
}

/**
 * Exports currently calculated year-by-year projections into a CSV file
 */
function exportCSV() {
    if (!window.currentCalculatedResult || !window.currentCalculatedResult.breakdown) {
        showToast('Error: No calculations available for export!');
        return;
    }

    const breakdown = window.currentCalculatedResult.breakdown;
    let csvRows = [];
    
    // Determine headers based on active mode
    let headers = [];
    if (currentMode === 'sip') {
        headers = ['Year', 'Monthly Investment (INR)', 'Invested this Year (INR)', 'Cumulative Invested (INR)', 'Interest Earned this Year (INR)', 'Closing Balance (INR)'];
    } else if (currentMode === 'swp') {
        headers = ['Year', 'Monthly Withdrawal (INR)', 'Withdrawn this Year (INR)', 'Cumulative Withdrawn (INR)', 'Interest Earned this Year (INR)', 'Closing Balance (INR)'];
    } else {
        headers = ['Year', 'Invested this Year (INR)', 'Cumulative Invested (INR)', 'Interest Earned this Year (INR)', 'Cumulative Interest (INR)', 'Closing Balance (INR)'];
    }

    csvRows.push(headers.join(','));

    // Populate data
    breakdown.forEach(row => {
        let values = [];
        if (currentMode === 'sip') {
            values = [row.year, row.monthlyInvestment, row.investedThisYear, row.cumulativeInvested, row.interestEarnedThisYear, row.closingBalance];
        } else if (currentMode === 'swp') {
            values = [row.year, row.monthlyWithdrawal, row.withdrawnThisYear, row.cumulativeWithdrawn, row.interestEarnedThisYear, row.closingBalance];
        } else {
            values = [row.year, row.investedThisYear, row.cumulativeInvested, row.interestEarnedThisYear, row.cumulativeInterest, row.closingBalance];
        }
        csvRows.push(values.join(','));
    });

    // Create file blob and download
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const filename = `AlphaNifty_${currentMode.toUpperCase()}_Projection.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Successfully downloaded: ${filename}`);
}

/**
 * Toast Notification system helper
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    
    toastMsg.innerText = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 4000);
}

/**
 * Updates and displays the dynamic caution / safe indicator box.
 * @param {string} type 'success', 'warning', 'caution', or 'info'
 * @param {string} title Alert title text
 * @param {string} desc Alert description text
 * @param {string} iconClass FontAwesome icon class (e.g. 'fa-shield-halved', 'fa-circle-exclamation')
 */
function showAlert(type, title, desc, iconClass) {
    const alertBox = document.getElementById('calculator-alert-box');
    const alertIcon = document.getElementById('calculator-alert-icon');
    const alertTitle = document.getElementById('calculator-alert-title');
    const alertDesc = document.getElementById('calculator-alert-desc');

    if (!alertBox || !alertIcon || !alertTitle || !alertDesc) return;

    // Reset and apply styles
    alertBox.className = 'alert-box';
    alertBox.classList.add(`${type}-alert`);
    alertBox.classList.remove('hidden');

    // Update content
    alertIcon.className = `fa-solid ${iconClass}`;
    alertTitle.innerText = title;
    alertDesc.innerText = desc;
}

/**
 * Hides the dynamic alert box.
 */
function hideAlert() {
    const alertBox = document.getElementById('calculator-alert-box');
    if (alertBox) {
        alertBox.classList.add('hidden');
    }
}

// Interactive 3D Rotatable Logo (Click & Drag / Touch Swipe to rotate 360 degrees)
document.addEventListener('DOMContentLoaded', () => {
    const logo3D = document.querySelector('.logo-3d-container');
    const logoLink = document.querySelector('.logo-link');
    if (!logo3D || !logoLink) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentY = 0;
    let currentX = 0;
    let dragThreshold = 5;
    let hasDragged = false;

    // Track dragging to rotate
    logoLink.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        hasDragged = false;
        
        // Disable continuous CSS animation during manual drag
        logo3D.style.animation = 'none';
        logo3D.style.transition = 'none'; // Snappy rotation response
        e.preventDefault(); // Prevent text/image dragging ghost
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
            hasDragged = true;
        }

        // Map mouse movements to Y and X rotations
        const rotY = currentY + deltaX * 0.8;
        const rotX = currentX - deltaY * 0.8;

        logo3D.style.transform = `perspective(800px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(1.08)`;
    });

    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        currentY += deltaX * 0.8;
        currentX -= deltaY * 0.8;

        // Transition back to automatic continuous 360 spin
        logo3D.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)';
        logo3D.style.transform = '';
        
        // Re-enable the continuous spin keyframes after transition
        setTimeout(() => {
            if (!isDragging) {
                logo3D.style.animation = 'rotate3DContinuous 12s linear infinite';
                currentY = 0;
                currentX = 0;
            }
        }, 800);
    });

    // Prevent link clicking if they were dragging
    logoLink.addEventListener('click', (e) => {
        if (hasDragged) {
            e.preventDefault();
        }
    });

    // Touch support for mobile devices
    logoLink.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        hasDragged = false;
        logo3D.style.animation = 'none';
        logo3D.style.transition = 'none';
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;

        if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
            hasDragged = true;
        }

        const rotY = currentY + deltaX * 0.8;
        const rotX = currentX - deltaY * 0.8;
        logo3D.style.transform = `perspective(800px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(1.08)`;
    }, { passive: true });

    window.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        logo3D.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)';
        logo3D.style.transform = '';
        setTimeout(() => {
            if (!isDragging) {
                logo3D.style.animation = 'rotate3DContinuous 12s linear infinite';
                currentY = 0;
                currentX = 0;
            }
        }, 800);
    });
});

/**
 * Shows only the educational card that matches the active calculator mode (SIP/SWP/Lumpsum).
 */
function updateEducationalCard(mode) {
    document.querySelectorAll('.wealth-education-section .education-box').forEach(box => {
        box.classList.add('hidden');
    });
    const activeEdu = document.getElementById(`edu-${mode}`);
    if (activeEdu) {
        activeEdu.classList.remove('hidden');
    }
}
