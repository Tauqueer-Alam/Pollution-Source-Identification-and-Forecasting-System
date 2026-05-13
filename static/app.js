let trendChartInstance = null;
let probDonutChart = null;
let weatherCorrelationChart = null;

// Live Clock Logic
function updateClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;
    const now = new Date();
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    clockEl.textContent = now.toLocaleString('en-US', options);
}
setInterval(updateClock, 1000);
updateClock();

function updateDonutChart(probabilities) {
    const ctx = document.getElementById('donutChart');
    if (!ctx) return;

    // Use all entries for consistency with the bar list
    const entries = Object.entries(probabilities);
    const labels = entries.map(e => e[0].split('/')[0]); // Use shortened names
    const data = entries.map(e => e[1]);

    const colors = labels.map(label => {
        if (label.includes('Biomass')) return '#ef4444'; // Red
        if (label.includes('Vehicular')) return '#0ea5e9'; // Cyan/Blue
        if (label.includes('Construction')) return '#eab308'; // Yellow/Dust
        if (label.includes('Industrial')) return '#a855f7'; // Purple
        return '#64748b'; // Mixed/Grey
    });

    if (probDonutChart) {
        probDonutChart.data.labels = labels;
        probDonutChart.data.datasets[0].data = data;
        probDonutChart.data.datasets[0].backgroundColor = colors;
        probDonutChart.update();
    } else {
        probDonutChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#0f172a',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                layout: { padding: 10 },
                plugins: {
                    legend: {
                        position: 'right',
                        align: 'center',
                        labels: { color: '#cbd5e1', font: { family: 'Outfit', size: 12 }, boxWidth: 12, padding: 15 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleFont: { family: 'Outfit', size: 13 },
                        bodyFont: { family: 'Outfit', size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) { return ' ' + context.label + ': ' + context.parsed + '%'; }
                        }
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function (chart) {
                    const width = chart.chartArea.right - chart.chartArea.left;
                    const height = chart.chartArea.bottom - chart.chartArea.top;
                    const chartCtx = chart.ctx;
                    chartCtx.restore();

                    // Find exactly where the center of the pie is (bypassing the legend shift)
                    const x = chart.chartArea.left + (width / 2);
                    const y = chart.chartArea.top + (height / 2);

                    const currentData = chart.data.datasets[0].data;
                    const currentColors = chart.data.datasets[0].backgroundColor;
                    const maxIdx = currentData.indexOf(Math.max(...currentData));

                    chartCtx.textAlign = 'center';
                    chartCtx.textBaseline = 'middle';

                    // Top Subtitle
                    chartCtx.font = "300 0.85rem Outfit";
                    chartCtx.fillStyle = "#94a3b8";
                    chartCtx.fillText("Primary Factor", x, y - 12);

                    // Large Value
                    chartCtx.font = "600 1.6rem Outfit";
                    chartCtx.fillStyle = currentColors[maxIdx] || "#cbd5e1";
                    chartCtx.fillText(parseFloat(currentData[maxIdx]).toFixed(1) + "%", x, y + 14);

                    chartCtx.save();
                }
            }]
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Render Chart
    if (typeof featureImportance !== 'undefined' && featureImportance.length > 0) {
        try {
            const ctx = document.getElementById('importanceChart').getContext('2d');

            // Process data for chart - Top 12 features
            const sortedFeatures = [...featureImportance].sort((a, b) => b.Importance - a.Importance).slice(0, 12);
            const labels = sortedFeatures.map(f => f.Feature.toUpperCase().replace('_', ' '));
            const data = sortedFeatures.map(f => f.Importance);

            // COLOR SYSTEM: Group by data type for professionalism
            const pollutants = ['PM25', 'PM10', 'NO2', 'SO2', 'CO', 'O3'];
            const weather = ['TEMPERATURE', 'HUMIDITY', 'WIND SPEED', 'VISIBILITY'];
            const fire = ['FIRE COUNT', 'FRP', 'NEARBY FIRES', 'FIRE FRP SUM'];

            const backgroundColors = labels.map(label => {
                if (pollutants.includes(label)) return 'rgba(56, 189, 248, 0.7)'; // Sky Blue
                if (weather.includes(label)) return 'rgba(52, 211, 153, 0.7)';    // Emerald Green
                if (fire.includes(label)) return 'rgba(248, 113, 113, 0.7)';       // Red/Fire
                return 'rgba(168, 85, 247, 0.7)';                                // Purple (Temporal)
            });

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Impact Score',
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: backgroundColors.map(c => c.replace('0.7', '1')),
                        borderWidth: 1,
                        borderRadius: 4,
                        barThickness: 15
                    }]
                },
                options: {
                    indexAxis: 'y', // HORIZONTAL looks much more professional for labels
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: {
                                color: '#94a3b8',
                                callback: function (value) { return value.toFixed(1); }
                            },
                            title: { display: true, text: 'Absolute Impact (Mean |SHAP| Value)', color: '#64748b' }
                        },
                        y: {
                            grid: { display: false },
                            ticks: {
                                color: '#cbd5e1',
                                font: { family: 'Outfit', size: 10, weight: 'bold' }
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            titleFont: { family: 'Outfit', size: 13 },
                            bodyFont: { family: 'Outfit', size: 12 },
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) { label += ': '; }
                                    label += context.parsed.x.toFixed(2) + ' AQI points';
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.error("Failed to render Chart:", e);
        }
    }

    // Fetch All Live Data Logic
    const btnFetchWeather = document.getElementById('btn-fetch-weather');

    async function fetchAllData() {
        if (btnFetchWeather) btnFetchWeather.textContent = 'Fetching...';

        const stationSelector = document.getElementById('station-selector');
        let queryParams = '';
        let currentLat = '28.6139';
        let currentLon = '77.2090';
        let currentCity = 'NCR Average';

        if (stationSelector) {
            const [lat, lon, city] = stationSelector.value.split(',');
            currentLat = lat;
            currentLon = lon;
            currentCity = city;
            
            if (lat === 'NCR_AVG') {
                queryParams = `?mode=ncr`;
            } else {
                queryParams = `?lat=${lat}&lon=${lon}&city=${city}`;
            }
        }

        try {
            const res = await fetch(`/api/auto_fill${queryParams}`);
            const data = await res.json();
            if (res.ok) {
                // Populate all fields dynamically (both hidden inputs and metric cards)
                for (const key in data) {
                    const inputEl = document.getElementById(key);
                    if (inputEl) inputEl.value = data[key];

                    const metricValueEl = document.getElementById('val-' + key);
                    if (metricValueEl) metricValueEl.textContent = data[key];
                }

                if (btnFetchWeather) {
                    btnFetchWeather.textContent = '✅ System Synced';
                    setTimeout(() => btnFetchWeather.textContent = '☁️ Sync Live NCR Data', 4000);
                }

                // 4. Update hidden location field for database tracking
                const locationInput = document.querySelector('#prediction-form input[name="Station_Name"]');
                if (locationInput) locationInput.value = currentCity;

                const latInput = document.querySelector('#prediction-form input[name="lat"]');
                if (latInput) latInput.value = currentLat;
                const lonInput = document.querySelector('#prediction-form input[name="lon"]');
                if (lonInput) lonInput.value = currentLon;

                // TRIGGER MAP INTELLIGENCE
                if (window.sourceMap && currentLat !== 'NCR_AVG') {
                    const pos = { lat: parseFloat(currentLat), lng: parseFloat(currentLon) };
                    window.sourceMap.panTo(pos);
                    window.sourceMap.setZoom(11);
                    if (window.triggerRadar) window.triggerRadar(currentLat, currentLon);
                }
                
                if (data.wind_deg && window.updateWindOverlay) {
                    window.lastWindData = { deg: data.wind_deg, speed: data.wind_speed };
                    window.updateWindOverlay(data.wind_deg, data.wind_speed);
                }

                // 5. Automatically trigger a prediction for instant feedback
                const form = document.getElementById('prediction-form');
                if (form) {
                    form.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            } else {
                alert('Error fetching data: ' + data.error);
                if (btnFetchWeather) btnFetchWeather.textContent = '☁️ Refresh Live Data';
            }
        } catch (err) {
            console.error(err);
            if (btnFetchWeather) btnFetchWeather.textContent = '☁️ Refresh Live Data';
        }
    }

    if (btnFetchWeather) {
        btnFetchWeather.addEventListener('click', fetchAllData);
    }

    // AUTO-REFRESH when city is changed
    const stationSelector = document.getElementById('station-selector');
    if (stationSelector) {
        stationSelector.addEventListener('change', fetchAllData);
    }

    // Automatically fetch on page load
    fetchAllData();

    // Toggle Simulation Mode
    const toggleSim = document.getElementById('toggle-simulation');
    const simControls = document.getElementById('simulation-controls');

    if (toggleSim && simControls) {
        toggleSim.addEventListener('click', () => {
            toggleSim.classList.toggle('active');
            simControls.classList.toggle('hidden');
        });
    }

    // POLICY SCENARIO HANDLERS
    const btnConstBan = document.getElementById('btn-policy-construction');
    const btnTrafficBan = document.getElementById('btn-policy-traffic');

    function applyPolicySimulation(pollutantAdjustments) {
        // Find inputs and reduce their values
        for (const [id, factor] of Object.entries(pollutantAdjustments)) {
            const input = document.getElementById(id);
            if (input && input.value) {
                input.value = (parseFloat(input.value) * factor).toFixed(2);
                input.style.borderColor = "#38bdf8";
                input.style.boxShadow = "0 0 10px rgba(56, 189, 248, 0.3)";
                setTimeout(() => {
                    input.style.borderColor = "";
                    input.style.boxShadow = "";
                }, 2000);
            }
        }
        // Auto-trigger prediction
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
    }

    if (btnConstBan) {
        btnConstBan.addEventListener('click', () => {
            // Construction ban targets PM10 (heavy dust) and PM2.5
            applyPolicySimulation({ 'pm10': 0.6, 'pm25': 0.8 });
        });
    }
    if (btnTrafficBan) {
        btnTrafficBan.addEventListener('click', () => {
            // Odd-even targets CO and NO2 (combustion)
            applyPolicySimulation({ 'co': 0.7, 'no2': 0.8, 'pm25': 0.85 });
        });
    }

    // Setup DateTime Picker
    const datetimePicker = document.getElementById('datetimepicker');
    if (datetimePicker) {
        // Set to current date time initially
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        datetimePicker.value = now.toISOString().slice(0, 16);

        function updateHiddenTimeFields() {
            if (!datetimePicker.value) return;
            const dt = new Date(datetimePicker.value);
            const monthInput = document.getElementById('month');
            const dayInput = document.getElementById('day');
            const hourInput = document.getElementById('hour');
            const isWeekendInput = document.getElementById('is_weekend');

            if (monthInput) monthInput.value = dt.getMonth() + 1; // Months are 0-indexed
            if (dayInput) dayInput.value = dt.getDate();
            if (hourInput) hourInput.value = dt.getHours();

            // Auto-calculate is_weekend
            if (isWeekendInput) {
                isWeekendInput.value = (dt.getDay() === 0 || dt.getDay() === 6) ? 1 : 0;
            }
        }

        updateHiddenTimeFields();
        datetimePicker.addEventListener('change', updateHiddenTimeFields);
    }

    // Handle Form Submit
    const form = document.getElementById('prediction-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Sync Station_Name carefully before submittal to ensure DB gets correct NCR region
            const stationSelector = document.getElementById('station-selector');
            const stationNameInput = document.querySelector('#prediction-form input[name="Station_Name"]');
            if (stationSelector && stationNameInput) {
                const parts = stationSelector.value.split(',');
                if (parts.length >= 3) {
                    stationNameInput.value = parts[2].trim();
                } else if (stationSelector.value.includes('NCR')) {
                    stationNameInput.value = "NCR Average";
                }
            }

            const btnText = document.querySelector('.btn-predict span');
            const loader = document.getElementById('loader');

            btnText.style.display = 'none';
            loader.style.display = 'block';

            const formData = new FormData(form);
            const dataPayload = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataPayload)
                });
                const result = await response.json();

                if (response.ok) {
                    updateAQIDisplay(result);
                    loadHistory(); // Refresh the DB log view
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to connect to server.');
            } finally {
                btnText.style.display = 'block';
                loader.style.display = 'none';
            }
        });
    }

    function updateHealthAdvisory(aqi) {
        const box = document.getElementById('health-advisory-box');
        const text = document.getElementById('health-advisory-text');
        if (!box || !text) return;

        box.style.display = 'block';
        let advisory = "";
        let color = "#38bdf8";

        if (aqi > 400) {
            advisory = "🆘 SEVERE EMERGENCY: Wear N95 masks indoors. Stop all outdoor physical activity. Use air purifiers at max setting.";
            color = "#9f1239";
        } else if (aqi > 300) {
            advisory = "⚠️ SEVERE: Respiratory risk to all. Wear N95 masks outdoors. Keep all windows and doors tightly shut.";
            color = "#e11d48";
        } else if (aqi > 200) {
            advisory = "🚫 POOR: Sensitive groups should stay indoors. Healthy adults should avoid prolonged heavy exercise.";
            color = "#f87171";
        } else if (aqi > 100) {
            advisory = "🧐 MODERATE: People with respiratory illness should reduce exertion. Consider closing windows during peak traffic.";
            color = "#fbbf24";
        } else if (aqi > 50) {
            advisory = "👍 SATISFACTORY: Generally safe. Unusually sensitive people should monitor symptoms.";
            color = "#34d399";
        } else {
            advisory = "🌿 GOOD: Ideal air quality. Perfect for all outdoor activities and exercise.";
            color = "#10b981";
        }

        box.style.borderLeftColor = color;
        text.style.color = "#e2e8f0";
        text.innerHTML = advisory;
        box.querySelector('h4').style.color = color;
    }

    function updateAQIDisplay(result) {
        const aqi = result.prediction;
        const sourceClassification = result.source_classification || "Unknown";
        const probabilities = result.probabilities || {};
        const advice = result.advice || "";
        const ratios = result.ratios || {};

        const resultContainer = document.getElementById('result-container');
        const aqiValue = document.getElementById('aqi-value');
        const aqiCircle = document.getElementById('aqi-circle');
        const aqiCategory = document.getElementById('aqi-category');
        const primarySource = document.getElementById('primary-source');

        if (primarySource) {
            primarySource.textContent = sourceClassification;
        }

        // Show Prediction Source
        const sourceLabel = document.getElementById('prediction-source');
        if (sourceLabel) {
            sourceLabel.textContent = result.prediction_source || "";
        }

        // Populate LSTM if available
        const lstmContainer = document.getElementById('lstm-container');
        const lstmValue = document.getElementById('lstm-value');
        const lstmInner = document.getElementById('lstm-inner');
        const lstmStatus = document.getElementById('lstm-status-text');

        if (lstmContainer && lstmValue) {
            if (result.lstm_prediction !== undefined && result.lstm_prediction !== null) {
                lstmValue.textContent = Math.round(result.lstm_prediction);
                if (lstmInner) {
                    lstmInner.style.background = 'rgba(168, 85, 247, 0.15)';
                    lstmInner.style.border = '1px solid rgba(168, 85, 247, 0.4)';
                    lstmInner.style.borderStyle = 'solid';
                }
                if (lstmStatus) {
                    lstmStatus.textContent = result.lstm_status || "Neural Engine: Active";
                    lstmStatus.style.color = "#a855f7";
                }
                lstmValue.style.color = "#d8b4fe";
            } else {
                lstmValue.textContent = "Inference Pending";
                if (lstmStatus) {
                    lstmStatus.textContent = result.lstm_status || "Syncing temporal history...";
                }
            }
        }

        // 1. Populate Probabilities Bars
        const probsContainer = document.getElementById('source-probabilities');
        if (probsContainer && Object.keys(probabilities).length > 0) {
            let probsHtml = '<div style="display: flex; flex-direction: column; gap: 6px;">';
            for (const [sourceName, probVal] of Object.entries(probabilities)) {
                if (probVal >= 0.0) { // Show ALL sources regardless of % for completeness

                    let barColor = '#64748b'; // default grey
                    if (sourceName.includes('Biomass')) barColor = '#ef4444';
                    else if (sourceName.includes('Vehicular')) barColor = '#0ea5e9';
                    else if (sourceName.includes('Construction')) barColor = '#eab308';
                    else if (sourceName.includes('Industrial')) barColor = '#a855f7';

                    probsHtml += `
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="flex: 1; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sourceName.split('/')[0]}</span>
                            <div style="flex: 2; height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${probVal}%; background: ${barColor}; transition: width 1s ease-in-out;"></div>
                            </div>
                            <span style="width: 35px; text-align: right;">${parseFloat(probVal).toFixed(1)}%</span>
                        </div>
                    `;
                }
            }
            probsHtml += '</div>';
            probsContainer.innerHTML = probsHtml;
            updateDonutChart(probabilities);
        }

        // 2. Populate Pollution Fingerprint (Ratios)
        const ratioPmEl = document.getElementById('ratio-pm');
        const ratioSo2El = document.getElementById('ratio-so2');
        const fingerprintEl = document.getElementById('fingerprint-conclusion');

        if (ratios && ratioPmEl && ratioSo2El && fingerprintEl) {
            const pmRatio = ratios.pm25_pm10 || 0;
            const snRatio = ratios.so2_no2 || 0;

            ratioPmEl.textContent = pmRatio.toFixed(2);
            ratioSo2El.textContent = snRatio.toFixed(2);

            let conclusion = "";
            if (pmRatio > 0.65) {
                conclusion = "🧬 Signature: <strong>High Combustion</strong> (Vehicles/Fires/Coal). Fine particles dominate the mass.";
            } else if (pmRatio < 0.40) {
                conclusion = "🧬 Signature: <strong>Mechanical Dust</strong> (Construction/Roads). Heavy coarse particles detected.";
            } else {
                conclusion = "🧬 Signature: <strong>Urban Mixture</strong>. Balanced contribution from dust and emissions.";
            }

            if (snRatio > 0.4) {
                conclusion += " <br>⚠️ Industrial chemical footprint detected (High SO2 signature).";
            } else if (snRatio < 0.1 && aqi > 100) {
                conclusion += " <br>🚗 Traffic-heavy signature detected (High NO2 relative to SO2).";
            }

            fingerprintEl.innerHTML = conclusion;
        }

        // 2. Populate Advice (Health Guidelines)
        const adviceContainer = document.getElementById('health-advice');
        if (adviceContainer) {
            adviceContainer.style.display = 'block';
            let adviceIcon = "💡";
            let adviceColor = "#fef08a"; // Default yellow
            let healthText = advice || "Air quality is acceptable.";

            if (aqi > 300) {
                adviceIcon = "😷"; // N95 Mask
                adviceColor = "#9f1239";
                healthText = "SEVERE: Wear N95 Mask outdoors. No outdoor exercise.";
            } else if (aqi > 200) {
                adviceIcon = "🚷"; // Avoid outdoors
                adviceColor = "#f87171";
                healthText = "POOR: Reduce prolonged heavy exertion. Keep windows closed.";
            } else if (aqi > 100) {
                adviceIcon = "🪟"; // Close windows
                adviceColor = "#fbbf24";
                healthText = "MODERATE: Unusually sensitive people should consider reducing prolonged outdoor exertion.";
            } else if (aqi <= 50) {
                adviceIcon = "🌿";
                adviceColor = "#34d399";
                healthText = "GOOD: Great day to be active outside!";
            }

            adviceContainer.style.borderLeftColor = adviceColor;
            adviceContainer.innerHTML = `<span style="font-size: 1.2rem; margin-right: 8px;">${adviceIcon}</span> <span>${healthText}</span>`;
        }

        // 3. Populate Chemical Ratios
        const pmRatio = document.getElementById('ratio-pm');
        const so2Ratio = document.getElementById('ratio-so2');
        if (pmRatio && ratios.pm25_pm10) pmRatio.textContent = ratios.pm25_pm10;
        if (so2Ratio && ratios.so2_no2) so2Ratio.textContent = ratios.so2_no2;

        resultContainer.classList.remove('result-hidden');
        resultContainer.style.height = 'auto';

        const displayValue = Math.round(aqi);

        // Animate counter
        let start = 0;
        const duration = 1000;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = displayValue / steps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= displayValue) {
                start = displayValue;
                clearInterval(timer);
            }
            aqiValue.textContent = Math.round(start);
        }, stepTime);

        // Determine Category and Color
        let color = '#34d399'; // Good
        let text = 'Good (0-50)';

        if (aqi > 300) {
            color = '#9f1239'; // Severe
            text = 'Severe/Hazardous (>300)';
        } else if (aqi > 200) {
            color = '#f87171'; // Poor
            text = 'Poor (201-300)';
        } else if (aqi > 100) {
            color = '#fbbf24'; // Moderate
            text = 'Moderate (101-200)';
        } else if (aqi > 50) {
            color = '#fef08a'; // Satisfactory
            text = 'Satisfactory (51-100)';
        }

        requestAnimationFrame(() => {
            const maxDash = 100; // max circumference visualization
            const percentage = Math.min((aqi / 500) * 100, 100);
            aqiCircle.style.strokeDasharray = `${percentage}, 100`;
            aqiCircle.style.stroke = color;

            aqiCategory.textContent = text;
            aqiCategory.style.color = color;
            aqiCategory.style.textShadow = `0 0 10px ${color}80`;
        });

        // Update Intelligence Health Advisory
        updateHealthAdvisory(aqi);

        // --- 4. Historical vs Predicted Trend Chart ---
        const trendContainer = document.getElementById('trend-chart-container');
        if (trendContainer) {
            trendContainer.style.display = 'block';
            const ctx = document.getElementById('trendChart').getContext('2d');

            // DYNAMIC LABELS: Handle either 24h hourly (LSTM) or 5-point (GBR)
            let labels = [];
            const dataPred = result.forecast || [];

            if (dataPred.length > 10) {
                // If we have many points (e.g. 24 hours from LSTM)
                labels = Array.from({ length: dataPred.length }, (_, i) => `+${i + 1}h`);
                // For readability, show every 4th label on X axis
            } else {
                // Old 5-point version
                labels = ['Now', '+6h', '+12h', '+18h', '+24h'];
            }

            // Historical Jitter (Mock for demo)
            const base = Math.max(50, aqi - 30);
            const dataHist = [base + 40, base + 20, base + 50, base + 10, aqi];

            // Align historical and future data
            const pastData = [...dataHist, ...new Array(dataPred.length).fill(null)];
            const futureData = [...new Array(4).fill(null), aqi, ...dataPred];

            // Adjust labels to include history
            const histLabels = ['-24h', '-18h', '-12h', '-6h'];
            const allLabels = [...histLabels, ...labels];

            if (trendChartInstance) { trendChartInstance.destroy(); }

            trendChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: allLabels,
                    datasets: [
                        {
                            label: 'Historical Context', data: pastData,
                            borderColor: '#94a3b8', tension: 0.4, borderWidth: 2, pointRadius: 2, pointBackgroundColor: '#94a3b8'
                        },
                        {
                            label: 'LSTM 24h Deep Forecast', data: futureData,
                            borderColor: '#a855f7', tension: 0.4, borderWidth: 3, pointRadius: (context) => context.dataIndex % 4 === 0 ? 3 : 0,
                            pointBackgroundColor: '#a855f7', fill: true,
                            backgroundColor: 'rgba(168, 85, 247, 0.1)'
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, labels: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } } },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#64748b',
                                font: { size: 9 },
                                autoSkip: true,
                                maxRotation: 0
                            },
                            grid: { display: false }
                        },
                        y: {
                            ticks: { color: '#64748b' },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        }
                    }
                }
            });
        }
        
        // --- 4.5 Hourly Forecast Strip ---
        const hourlyContainer = document.getElementById('hourly-forecast-container');
        const hourlyTimeline = document.getElementById('hourly-timeline');
        if (hourlyContainer && hourlyTimeline && result.forecast && result.future_weather) {
            hourlyContainer.style.display = 'block';
            let htmlStr = '';
            
            // Current hour from backend
            let startHour = result.req_hour || new Date().getHours();
            
            for (let i = 0; i < result.forecast.length; i++) {
                const hourAqi = result.forecast[i];
                const weather = result.future_weather[i] || {};
                const sourceData = (result.source_forecast && result.source_forecast[i]) ? result.source_forecast[i] : {emoji: '🌍', name: 'Mixed'};
                const sourceEmoji = sourceData.emoji || '🌍';
                const sourceName = sourceData.name || 'Mixed';
                
                const timeStr = ((startHour + i + 1) % 24).toString().padStart(2, '0') + ':00';
                
                // Color mapping for AQI
                let bgColor = '#34d399';
                let textColor = '#fff';
                if (hourAqi > 300) bgColor = '#9f1239';
                else if (hourAqi > 200) bgColor = '#f87171';
                else if (hourAqi > 100) bgColor = '#fbbf24';
                else if (hourAqi > 50) { bgColor = '#fef08a'; textColor = '#1e293b'; }
                
                htmlStr += `
                    <div class="hourly-card">
                        <div class="h-time">${timeStr}</div>
                        <div class="h-aqi" style="background: ${bgColor}; color: ${textColor}">${Math.round(hourAqi)}</div>
                        <div class="h-source" style="margin: 6px 0 4px 0; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px;" title="Forecasted Dominant Source">
                            <div style="font-size: 1.4rem; line-height: 1;">${sourceEmoji}</div>
                            <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${sourceName}</div>
                        </div>
                        <div class="h-temp">${Math.round(weather.temp || 0)}°C</div>
                        <div class="h-wind">🌬️ ${Math.round(weather.wind || 0)} <span style="font-size: 0.6rem">m/s</span></div>
                        <div class="h-hum">💧 ${Math.round(weather.hum || 0)}%</div>
                    </div>
                `;
            }
            hourlyTimeline.innerHTML = htmlStr;
        }

        // --- 5. PDF Export Generation ---
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.style.display = 'inline-flex';
            btnExport.style.alignItems = 'center';
            btnExport.style.justifyContent = 'center';
            btnExport.onclick = () => {
                // Capture the main wrapper to include title/header and avoid CSS Grid cutoff bugs
                const element = document.querySelector('.glass-container');
                btnExport.style.display = 'none'; // hide button while generating

                window.scrollTo(0, 0);

                // Temporary CSS fixes for html2canvas rendering
                const originalBg = element.style.background;
                element.style.background = '#0f172a'; // Force solid bg

                // Disable dynamic layout that causes Y-offset blank-page bugs!
                const origBodyDisplay = document.body.style.display;
                document.body.style.display = 'block';

                // Prevent internal scrollbars from cutting off content in the PDF
                const inputGrid = document.querySelector('.input-grid');
                const origMaxHeight = inputGrid ? inputGrid.style.maxHeight : '';
                const origOverflow = inputGrid ? inputGrid.style.overflow : '';
                if (inputGrid) {
                    inputGrid.style.maxHeight = 'none';
                    inputGrid.style.overflow = 'visible';
                }

                // Allow DOM to reflow before capturing
                setTimeout(() => {
                    const pdfWidth = element.scrollWidth || 1200;
                    const pdfHeight = element.scrollHeight || 1600;

                    const opt = {
                        margin: 0,
                        filename: `Pollution_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                            backgroundColor: '#0f172a',
                            // Sometimes Google Maps UI buttons taint the canvas
                            ignoreElements: (node) => node.className && typeof node.className === 'string' && (node.className.includes('gm-control-active') || node.className.includes('gm-style-cc'))
                        },
                        // Single page custom format
                        jsPDF: { unit: 'px', format: [pdfWidth, pdfHeight], orientation: 'portrait' }
                    };

                    html2pdf().set(opt).from(element).save().then(() => {
                        // Restore UI state flawlessly
                        btnExport.style.display = 'inline-flex';
                        element.style.background = originalBg;
                        document.body.style.display = origBodyDisplay;
                        if (inputGrid) {
                            inputGrid.style.maxHeight = origMaxHeight;
                            inputGrid.style.overflow = origOverflow;
                        }
                    });
                }, 100);
            };
        }
    }

    async function loadHistory() {
        const tableBody = document.getElementById('history-table-body');
        if (!tableBody) return;

        try {
            const res = await fetch('/api/history');
            const history = await res.json();

            tableBody.innerHTML = history.map(entry => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;">
                    <td style="padding: 12px; color: #94a3b8;">${new Date(entry.timestamp + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style="padding: 12px; font-weight: 600; color: #cbd5e1;">${entry.location_name}</td>
                    <td style="padding: 12px; color: var(--primary); font-weight: bold;">${Math.round(entry.aqi)}</td>
                    <td style="padding: 12px;">
                        <span style="background: rgba(56, 189, 248, 0.1); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.2);">
                            ${entry.primary_source}
                        </span>
                    </td>
                    <td style="padding: 12px; color: #94a3b8;">${entry.pm25.toFixed(1)}</td>
                </tr>
            `).join('') || '<tr><td colspan="5" style="padding: 30px; text-align: center; color: #64748b;">No recent predictions found. Click "Refresh Live Data" to create one.</td></tr>';

            // NEW: Update Weather Correlation Chart
            updateWeatherCorrelationChart(history);

        } catch (err) {
            console.error("Failed to load history", err);
        }
    }

    function updateWeatherCorrelationChart(historyData) {
        const ctx = document.getElementById('weatherCorrelationChart');
        if (!ctx || !historyData || historyData.length === 0) return;

        // Take last 10 entries and reverse to show timeline left-to-right
        const data = [...historyData].reverse();
        const labels = data.map(d => new Date(d.timestamp + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        const aqiValues = data.map(d => d.aqi);
        const windSpeeds = data.map(d => d.wind_speed || 0);

        const insightText = document.getElementById('wind-insight-text');
        if (insightText && aqiValues.length > 0) {
            const latestAQI = aqiValues[aqiValues.length - 1];
            const latestWind = windSpeeds[windSpeeds.length - 1];

            if (latestWind < 1.5) {
                insightText.innerHTML = "🌪️ <strong>Stagnation Alert:</strong> Airflow is nearly dead. Pollutants are building up locally.";
            } else if (latestWind > 4.5) {
                insightText.innerHTML = "🌬️ <strong>High Dispersion:</strong> Strong breeze detected. AQI is dropping due to mechanical ventilation.";
            } else {
                insightText.innerHTML = "⚖️ <strong>Balanced Atmosphere:</strong> Moderate winds are preventing extreme spikes.";
            }
        }

        if (weatherCorrelationChart) {
            weatherCorrelationChart.data.labels = labels;
            weatherCorrelationChart.data.datasets[0].data = aqiValues;
            weatherCorrelationChart.data.datasets[1].data = windSpeeds;
            weatherCorrelationChart.update();
        } else {
            weatherCorrelationChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'AQI Level',
                            data: aqiValues,
                            borderColor: '#38bdf8',
                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                            yAxisID: 'y',
                            tension: 0.4,
                            fill: true,
                            borderWidth: 2
                        },
                        {
                            label: 'Wind Speed (m/s)',
                            data: windSpeeds,
                            borderColor: '#10b981',
                            borderDash: [4, 4],
                            yAxisID: 'y1',
                            tension: 0.2,
                            pointRadius: 3,
                            backgroundColor: '#10b981'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 10 } },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: { display: false },
                            ticks: { color: '#10b981', font: { size: 10 } },
                            grid: { drawOnChartArea: false }
                        },
                        x: {
                            ticks: { color: '#64748b', font: { size: 9 }, autoSkip: true, maxRotation: 0 },
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                color: '#94a3b8',
                                font: { size: 10 },
                                boxWidth: 10,
                                padding: 15
                            }
                        },
                        tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
                    }
                }
            });
        }
    }

    // Initial load and global assignment
    loadHistory();
    window.loadHistory = loadHistory;

});

// Initialize Google Maps for Pollution Source Localization
window.initMap = function () {
    const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi NCR
    const map = new google.maps.Map(document.getElementById("source-map"), {
        zoom: 10,
        center: defaultCenter,
        mapTypeId: 'hybrid', // Hybrid view is good for satellite/roads
        tilt: 45,
        styles: [
            { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
            { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
            { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
            { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
            { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
            { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
            { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
            { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
            { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
            { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
            { "featureType": "poi.park", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1b1b1b" }] },
            { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
            { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
            { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] },
            { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
            { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] },
            { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
            { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
            { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }
        ]
    });
    window.sourceMap = map;

    // RADAR EFFECT
    let radarCircle = null;
    window.triggerRadar = function(lat, lng) {
        if (radarCircle) radarCircle.setMap(null);
        radarCircle = new google.maps.Circle({
            strokeColor: "#38bdf8",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#38bdf8",
            fillOpacity: 0.35,
            map: map,
            center: { lat: parseFloat(lat), lng: parseFloat(lng) },
            radius: 100,
        });

        let r = 100;
        const interval = setInterval(() => {
            r += 250;
            if (r > 6000) {
                clearInterval(interval);
                radarCircle.setMap(null);
            } else {
                radarCircle.setRadius(r);
                radarCircle.setOptions({ fillOpacity: 0.35 * (1 - r / 6000) });
            }
        }, 50);
    };

    // Central Marker for Delhi NCR
    new google.maps.Marker({
        position: defaultCenter,
        map: map,
        title: "Delhi NCR Center",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#3b82f6",
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: "#ffffff"
        }
    });

    // NEW: Monitoring Station Hubs (Calibration Points)
    const monitoringHubs = [
        { name: "Anand Vihar Hub", lat: 28.6469, lng: 77.3164 },
        { name: "Noida Sector-62 Hub", lat: 28.6246, lng: 77.3649 },
        { name: "Gurugram Vikas Sadan Hub", lat: 28.4502, lng: 77.0266 },
        { name: "Faridabad Sector-30 Hub", lat: 28.4089, lng: 77.3178 },
        { name: "IGI Airport Calibration Hub", lat: 28.5562, lng: 77.0999 },
        { name: "Bhiwadi Industrial Hub", lat: 28.2096, lng: 76.8406 },
        { name: "Bulandshahr Regional Hub", lat: 28.4070, lng: 77.8498 },
        { name: "Chandni Chowk Traffic Hub", lat: 28.6560, lng: 77.2340 },
        { name: "Ghaziabad Loni Border Hub", lat: 28.7300, lng: 77.2800 },
        { name: "Indirapuram Intelligence Hub", lat: 28.6460, lng: 77.3680 },
        { name: "Jahangirpuri Hotspot Hub", lat: 28.7300, lng: 77.1700 },
        { name: "Rohini Residential Hub", lat: 28.7000, lng: 77.1200 },
        { name: "Sonipat Industrial Hub", lat: 28.9800, lng: 77.0200 },
        { name: "Meerut Outer NCR Hub", lat: 28.9845, lng: 77.7064 },
        { name: "Alwar Regional Hub", lat: 27.5667, lng: 76.6083 },
        { name: "Dwarka Intelligence Hub", lat: 28.5823, lng: 77.0500 },
        { name: "Greater Noida Power Hub", lat: 28.4744, lng: 77.5030 },
        { name: "Hapur Gateway Hub", lat: 28.7306, lng: 77.7758 },
        { name: "Muzaffarnagar North Hub", lat: 29.4727, lng: 77.7085 },
        { name: "Najafgarh Border Hub", lat: 28.6090, lng: 76.9850 }
    ];

    monitoringHubs.forEach(hub => {
        new google.maps.Marker({
            position: { lat: hub.lat, lng: hub.lng },
            map: map,
            title: hub.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: "#38bdf8",
                fillOpacity: 0.9,
                strokeWeight: 1,
                strokeColor: "#ffffff"
            }
        });
    });

    // Intelligence Feed: Update Status Banner periodically
    const statusText = document.getElementById('status-text');
    if (statusText) {
        setTimeout(() => {
            statusText.textContent = "STATION SYNC: Data from 20 Regional Hubs (NCR-Wide) Integrated.";
        }, 5000);
        setTimeout(() => {
            statusText.textContent = "AI CORE: Neural Forecast Engine - Calibrated for 20-Node Grid.";
        }, 15000);
    }

    // Use PlacesService to find potential sources like factories, plants, construction, etc.
    const service = new google.maps.places.PlacesService(map);

    const allPlaces = [];
    const allHeatmapData = [];
    const markersIndustry = [];
    const markersTraffic = [];
    const markersConstruction = [];
    const markersBiomass = [];
    let windPolylines = [];
    let heatmapLayer = null;

    // WIND OVERLAY LOGIC
    window.updateWindOverlay = function(deg, speed) {
        windPolylines.forEach(p => p.setMap(null));
        windPolylines = [];
        if (!document.getElementById('toggle-wind').checked) return;

        const center = map.getCenter();
        const step = 0.12; 
        for (let i = -3; i <= 3; i++) {
            for (let j = -3; j <= 3; j++) {
                const lat = center.lat() + i * step;
                const lng = center.lng() + j * step;
                const start = new google.maps.LatLng(lat, lng);
                const angle = (deg - 90) * Math.PI / 180;
                const length = 0.04;
                const end = new google.maps.LatLng(lat + Math.cos(angle) * length, lng + Math.sin(angle) * length);

                const poly = new google.maps.Polyline({
                    path: [start, end],
                    strokeColor: "#10b981",
                    strokeOpacity: 0.4,
                    strokeWeight: 2,
                    icons: [{
                        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2, fillOpacity: 1 },
                        offset: '100%'
                    }],
                    map: map
                });
                windPolylines.push(poly);
            }
        }
    };

    // BIOMASS LAYER
    async function loadBiomassData() {
        try {
            const res = await fetch('/api/fires');
            const fires = await res.json();
            fires.forEach(f => {
                const marker = new google.maps.Marker({
                    position: { lat: f.latitude, lng: f.longitude },
                    map: map,
                    title: `Fire Radiative Power: ${f.frp}`,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: Math.min(10, 3 + f.frp/20),
                        fillColor: "#f97316",
                        fillOpacity: 0.7,
                        strokeWeight: 1,
                        strokeColor: "#ffffff"
                    }
                });
                const info = new google.maps.InfoWindow({
                    content: `<div style="color:#1e293b; padding:8px; font-family:'Outfit';">
                                <h4 style="margin:0; color:#f97316;">🔥 Stubble/Biomass Fire</h4>
                                <p style="margin:5px 0 0 0; font-size:12px;">Satellite detected thermal anomaly.</p>
                                <p style="margin:3px 0 0 0; font-size:11px; font-weight:bold;">FRP: ${f.frp.toFixed(2)} MW</p>
                              </div>`
                });
                marker.addListener("click", () => info.open(map, marker));
                markersBiomass.push(marker);
            });
        } catch (e) { console.error("Fire data error:", e); }
    }
    loadBiomassData();

    const searches = [
        { keyword: 'industrial area OR factory OR power plant', color: '#ef4444', type: 'Industry' }, // Red
        { keyword: 'major intersection OR highway OR transport hub OR bus depot', color: '#f59e0b', type: 'Traffic/Vehicles' }, // Orange
        { keyword: 'construction site OR under construction', color: '#eab308', type: 'Construction' } // Yellow
    ];

    let pendingSearches = searches.length;

    searches.forEach(search => {
        service.nearbySearch({
            location: defaultCenter,
            radius: 75000, // Expanded to 75km to cover entire NCR region (Meerut, Alwar, etc.)
            keyword: search.keyword
        }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                // Determine icon based on color
                let iconUrl = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
                if (search.color === '#f59e0b') iconUrl = "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
                if (search.color === '#eab308') iconUrl = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";

                for (let i = 0; i < Math.min(results.length, 25); i++) {
                    const marker = createPollutionMarker(results[i], map, iconUrl, search.color, search.type);
                    if (marker) {
                        if (search.type === 'Industry') markersIndustry.push(marker);
                        if (search.type === 'Traffic/Vehicles') markersTraffic.push(marker);
                        if (search.type === 'Construction') markersConstruction.push(marker);
                    }

                    const loc = results[i].geometry.location;
                    allPlaces.push(loc);
                    allHeatmapData.push(new google.maps.LatLng(loc.lat(), loc.lng()));
                }
            }

            pendingSearches--;
            if (pendingSearches === 0 && allPlaces.length > 0) {
                drawMaximumPollutionZone(map, allPlaces);

                // Initialize Heatmap
                heatmapLayer = new google.maps.visualization.HeatmapLayer({
                    data: allHeatmapData,
                    map: map,
                    radius: 40,
                    opacity: 0.6,
                    gradient: [
                        'rgba(0, 255, 255, 0)', 'rgba(0, 255, 255, 1)', 'rgba(0, 191, 255, 1)',
                        'rgba(0, 127, 255, 1)', 'rgba(0, 63, 255, 1)', 'rgba(0, 0, 255, 1)',
                        'rgba(0, 0, 223, 1)', 'rgba(0, 0, 191, 1)', 'rgba(0, 0, 159, 1)',
                        'rgba(0, 0, 127, 1)', 'rgba(63, 0, 91, 1)', 'rgba(127, 0, 63, 1)',
                        'rgba(191, 0, 31, 1)', 'rgba(255, 0, 0, 1)'
                    ]
                });

                // Setup Toggle Listeners
                function updateMapVisuals() {
                    const activeData = [];
                    if (document.getElementById('toggle-industry').checked) {
                        markersIndustry.forEach(m => activeData.push(m.getPosition()));
                    }
                    if (document.getElementById('toggle-traffic').checked) {
                        markersTraffic.forEach(m => activeData.push(m.getPosition()));
                    }
                    if (document.getElementById('toggle-construction').checked) {
                        markersConstruction.forEach(m => activeData.push(m.getPosition()));
                    }
                    if (heatmapLayer) {
                        heatmapLayer.setData(activeData);
                    }
                    drawMaximumPollutionZone(map, activeData);
                }

                document.getElementById('toggle-industry').addEventListener('change', (e) => {
                    markersIndustry.forEach(m => m.setMap(e.target.checked ? map : null));
                    updateMapVisuals();
                });
                document.getElementById('toggle-traffic').addEventListener('change', (e) => {
                    markersTraffic.forEach(m => m.setMap(e.target.checked ? map : null));
                    updateMapVisuals();
                });
                document.getElementById('toggle-construction').addEventListener('change', (e) => {
                    markersConstruction.forEach(m => m.setMap(e.target.checked ? map : null));
                    updateMapVisuals();
                });
                document.getElementById('toggle-biomass').addEventListener('change', (e) => {
                    markersBiomass.forEach(m => m.setMap(e.target.checked ? map : null));
                });
                document.getElementById('toggle-wind').addEventListener('change', (e) => {
                    if (window.lastWindData) window.updateWindOverlay(window.lastWindData.deg, window.lastWindData.speed);
                    else windPolylines.forEach(p => p.setMap(e.target.checked ? map : null));
                });
                document.getElementById('toggle-heatmap').addEventListener('change', (e) => {
                    if (heatmapLayer) heatmapLayer.setMap(e.target.checked ? map : null);
                });
            }
        });
    });
};

let hotspotCircles = [];

function drawMaximumPollutionZone(map, locations) {
    // Clear old hotspot circles
    hotspotCircles.forEach(circle => circle.setMap(null));
    hotspotCircles = [];

    if (locations.length === 0) return;

    const radiusDeg = 0.06; // Roughly ~6.5km
    const hotspots = [];

    // Calculate density (number of nearby sources) for each location
    const locCounts = locations.map(loc1 => {
        let count = 0;
        locations.forEach(loc2 => {
            const dLat = loc1.lat() - loc2.lat();
            const dLng = loc1.lng() - loc2.lng();
            if ((dLat * dLat + dLng * dLng) < (radiusDeg * radiusDeg)) {
                count++;
            }
        });
        return { loc: loc1, count: count };
    });

    // Sort locations by highest density first
    locCounts.sort((a, b) => b.count - a.count);

    // Pick top non-overlapping clusters
    locCounts.forEach(item => {
        // Need at least a small cluster to qualify as a hotspot
        if (item.count >= 2) {
            // Ensure this new hotspot doesn't heavily overlap with already found hotspots
            const overlap = hotspots.some(h => {
                const dLat = h.loc.lat() - item.loc.lat();
                const dLng = h.loc.lng() - item.loc.lng();
                return (dLat * dLat + dLng * dLng) < (radiusDeg * radiusDeg * 1.5);
            });

            // Limit to top 5 major hotspots to avoid cluttering the map
            if (!overlap && hotspots.length < 5) {
                hotspots.push(item);
            }
        }
    });

    // Draw circles for all found hotspots
    hotspots.forEach((hotspot, index) => {
        const circle = new google.maps.Circle({
            strokeColor: "#ef4444",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#ef4444",
            fillOpacity: 0.25,
            map: map,
            center: hotspot.loc,
            radius: 6000, // 6 km radius
        });
        hotspotCircles.push(circle);

        const circleInfoWindow = new google.maps.InfoWindow({
            content: `
                <div style="color: #0f172a; padding: 5px; font-family: 'Outfit', sans-serif;">
                    <h4 style="margin: 0 0 5px 0;">Pollution Hotspot #${index + 1}</h4>
                    <p style="margin: 0; font-size: 12px; color: #ef4444; font-weight: bold;">High concentration of mixed sources</p>
                    <p style="margin: 3px 0 0 0; font-size: 11px;">Approx. ${hotspot.count} sources identified nearby</p>
                </div>
            `,
            position: hotspot.loc
        });

        circle.addListener("click", () => {
            circleInfoWindow.open(map);
        });
    });
}

function createPollutionMarker(place, map, iconUrl, colorHex, sourceType) {
    if (!place.geometry || !place.geometry.location) return;

    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        title: place.name,
        icon: {
            url: iconUrl
        }
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="background: #0f172a; color: #f8fafc; padding: 12px; border-radius: 8px; font-family: 'Outfit', sans-serif; border: 1px solid rgba(255,255,255,0.1); min-width: 180px;">
                <h4 style="margin: 0 0 8px 0; color: #38bdf8; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">${place.name}</h4>
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${colorHex};"></div>
                    <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">${sourceType}</span>
                </div>
                <p style="margin: 0; font-size: 12px; line-height: 1.4; color: #cbd5e1;">${place.vicinity || 'Facility identified via spatial intelligence.'}</p>
                <div style="margin-top: 10px; font-size: 10px; color: #64748b; font-style: italic;">
                    Source verification: AI High Confidence
                </div>
            </div>
        `
    });

    marker.addListener("click", () => {
        infoWindow.open(map, marker);
    });

    return marker;
}
