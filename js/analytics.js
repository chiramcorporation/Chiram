(function () {
    // 1. Inject CSS for Modal and Button
    const style = document.createElement('style');
    style.textContent = `
      .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5); }
      .modal-content { background-color: #fefefe; margin: 5% auto; padding: 20px; border: 1px solid #888; width: 90%; max-width: 1100px; border-radius: 8px; position: relative; }
      .close-modal { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; position: absolute; right: 20px; top: 10px; }
      .close-modal:hover { color: black; }
      .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-bottom: 20px; }
      .metric-card { flex: 1; background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e9ecef; }
      .metric-card h3 { margin: 0 0 5px 0; font-size: 14px; color: #6c757d; }
      .metric-card p { margin: 0; font-size: 20px; font-weight: bold; color: #2a72d6; }
      .metric-card p.danger { color: #dc3545; }
      .metric-card p.success { color: #28a745; }
      .content-row { display: flex; flex-wrap: wrap; gap: 20px; }
      .chart-wrapper { flex: 2; min-width: 350px; height: 400px; position: relative; overflow: auto; }
      .table-wrapper { flex: 1; min-width: 250px; }
      .top-table { width: 100%; border-collapse: collapse; font-size: 14px; }
      .top-table th { text-align: left; border-bottom: 2px solid #dee2e6; padding: 8px; color: #495057; }
      .top-table td { border-bottom: 1px solid #dee2e6; padding: 8px; color: #212529; }
      .btn-analytics { display: block; width: 90%; margin: 20px auto; padding: 10px; background-color: #2a72d6; color: white; border: none; border-radius: 4px; cursor: pointer; }
      .btn-analytics:hover { background-color: #1959b0; }
      .btn-download { position: absolute; top: 0; right: 0; padding: 5px 10px; font-size: 12px; background: #6c757d; color: white; border: none; border-radius: 0 0 0 4px; cursor: pointer; z-index: 10; }
      .btn-download:hover { background: #5a6268; }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML Elements (Button & Modal)
    function initAnalyticsUI() {
        // Inject Button into Right Banner
        const rightBanner = document.querySelector('.right-banner');
        if (rightBanner && !document.getElementById('openAnalyticsBtn')) {
            const btn = document.createElement('button');
            btn.id = 'openAnalyticsBtn';
            btn.className = 'btn-analytics';
            btn.textContent = 'View Analytics';
            btn.onclick = openAnalyticsModal;
            rightBanner.appendChild(btn);
        }

        // Inject Modal into Body
        if (!document.getElementById('analyticsModal')) {
            const modal = document.createElement('div');
            modal.id = 'analyticsModal';
            modal.className = 'modal';
            modal.innerHTML = `
          <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Portfolio Analytics</h2>
            
            <div class="analytics-grid">
              <div class="metric-card">
                <h3>Total Holdings</h3>
                <p id="ana-total-holdings">0</p>
              </div>
              <div class="metric-card">
                <h3>Total Recoverable</h3>
                <p id="ana-total-amount">0</p>
              </div>
              <div class="metric-card">
                <h3>Items in Loss</h3>
                <p id="ana-loss-count" class="danger">0</p>
              </div>
              <div class="metric-card">
                <h3>Realized Profit</h3>
                <p id="ana-profit-amount" class="success">0</p>
              </div>
              <div class="metric-card">
                <h3>Total Loss</h3>
                <p id="ana-loss-amount" class="danger">0</p>
              </div>
              <div class="metric-card">
                <h3>Top Loser</h3>
                <p id="ana-top-loser" class="danger">-</p>
              </div>
            </div>

            <div class="content-row">
              <div class="chart-wrapper">
                <canvas id="portfolioChart"></canvas>
                <button id="btn-download-chart" class="btn-download">Download Chart</button>
              </div>
              <div class="table-wrapper">
                <h3>Top 5 Holdings</h3>
                <table class="top-table">
                  <thead><tr><th>Symbol</th><th>Amount</th></tr></thead>
                  <tbody id="ana-top-tbody"></tbody>
                </table>
              </div>
            </div>
          </div>
        `;
            document.body.appendChild(modal);

            // Close events
            modal.querySelector('.close-modal').onclick = () => modal.style.display = "none";
            window.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = "none";
            });
        }
    }

    // 3. Chart Generation Logic
    function openAnalyticsModal() {
        const modal = document.getElementById('analyticsModal');
        modal.style.display = "block";

        if (typeof Chart === 'undefined') {
            alert("Chart.js library is still loading. Please try again in a moment.");
            return;
        }

        // Access global data from stockX-V2.js
        const data = window.processedHoldingsData || [];

        // 1. Update Summary Cards
        const totalHoldings = data.length;
        const totalAmount = data.reduce((acc, item) => acc + (parseFloat(item.amount_to_recover) || 0), 0);
        document.getElementById('ana-total-holdings').textContent = totalHoldings;
        document.getElementById('ana-total-amount').textContent = totalAmount.toFixed(2);

        // 2a. Calculate Loss Metrics (Closed positions with positive recoverable amount)
        // We assume a position is 'closed' if Quantity is near 0
        const closedPositions = data.filter(item => (parseFloat(item['Quantity Available']) || 0) <= 0.01);
        const lossPositions = closedPositions.filter(item => (parseFloat(item.amount_to_recover) || 0) > 0);
        const profitPositions = closedPositions.filter(item => (parseFloat(item.amount_to_recover) || 0) < 0);

        const lossCount = lossPositions.length;
        const totalLoss = lossPositions.reduce((acc, item) => acc + (parseFloat(item.amount_to_recover) || 0), 0);
        const totalProfit = profitPositions.reduce((acc, item) => acc + (parseFloat(item.amount_to_recover) || 0), 0);
        const topLoserRec = lossPositions.sort((a, b) => (parseFloat(b.amount_to_recover) || 0) - (parseFloat(a.amount_to_recover) || 0))[0];

        document.getElementById('ana-loss-count').textContent = lossCount;
        document.getElementById('ana-profit-amount').textContent = Math.abs(totalProfit).toFixed(2);
        document.getElementById('ana-loss-amount').textContent = totalLoss.toFixed(2);
        document.getElementById('ana-top-loser').textContent = topLoserRec
            ? `${topLoserRec.Symbol} (${parseFloat(topLoserRec.amount_to_recover).toFixed(0)})`
            : '-';

        // 2b. Update Top 5 Table
        const sortedData = [...data].sort((a, b) => (parseFloat(b.amount_to_recover) || 0) - (parseFloat(a.amount_to_recover) || 0)).slice(0, 5);
        const tbody = document.getElementById('ana-top-tbody');
        tbody.innerHTML = sortedData.map(item => `
        <tr>
          <td>${item.Symbol}</td>
          <td>${(parseFloat(item.amount_to_recover) || 0).toFixed(2)}</td>
        </tr>
      `).join('');

        const ctx = document.getElementById('portfolioChart').getContext('2d');
        if (window.myPortfolioChart) {
            window.myPortfolioChart.destroy();
        }

        // Group data by Sector
        const sectorMap = {};
        data.forEach(item => {
            const sector = (item.Sector && item.Sector.trim() !== "") ? item.Sector : 'Unknown';
            const amount = parseFloat(item.amount_to_recover) || 0;
            sectorMap[sector] = (sectorMap[sector] || 0) + amount;
        });

        const labels = Object.keys(sectorMap);
        const values = Object.values(sectorMap);

        window.myPortfolioChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                        '#E7E9ED', '#76A346', '#4D5360', '#FDB45C', '#949FB1', '#4D5360'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    title: {
                        display: true,
                        text: 'Sector Allocation (Amount to Recover)',
                        padding: { bottom: 20 }
                    }
                }
            }
        });
        // Download Chart Event
        document.getElementById('btn-download-chart').onclick = function () {
            const link = document.createElement('a');
            link.download = 'sector_allocation.png';
            link.href = document.getElementById('portfolioChart').toDataURL();
            link.click();
        };
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnalyticsUI);
    } else {
        initAnalyticsUI();
    }
})();
