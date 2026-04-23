import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./salesReports.css";

const PERIOD_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Annual" },
];

const PERIOD_LABELS = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Annual",
};

const CATEGORY_COLORS = {
  high: "#16a34a",
  medium: "#f59e0b",
  low: "#ef4444",
};

const CHART_THEME = {
  text: "#0f172a",
  axis: "#475569",
  axisLine: "#cbd5e1",
  grid: "rgba(148, 163, 184, 0.35)",
  barPrimaryStart: "#38bdf8",
  barPrimaryEnd: "#2563eb",
  barSecondaryStart: "#86efac",
  barSecondaryEnd: "#059669",
  barAccentStart: "#facc15",
  barAccentEnd: "#f97316",
};

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;

const getPeriodUnitLabel = (selectedPeriod) => {
  if (selectedPeriod === "monthly") return "month";
  if (selectedPeriod === "quarterly") return "quarter";
  return "year";
};

const formatShortDate = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getMonthLabelsInRange = (startDateValue, endDateValue) => {
  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return [];
  }

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const limit = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const monthLabels = [];
  let guard = 0;

  while (cursor <= limit && guard < 24) {
    monthLabels.push(
      cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    );
    cursor.setMonth(cursor.getMonth() + 1);
    guard += 1;
  }

  return monthLabels;
};

const CustomTooltip = ({ active, payload, label, valueFormatter, labelFormatter }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="report-tooltip">
      <p className="report-tooltip-label">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      {payload.map((entry) => {
        const color = entry.color || entry.fill || "#334155";
        const formattedValue = valueFormatter
          ? valueFormatter(entry.value, entry.name)
          : entry.value;

        return (
          <div key={entry.dataKey || entry.name} className="report-tooltip-row">
            <span className="report-tooltip-dot" style={{ backgroundColor: color }} />
            <span className="report-tooltip-name">{entry.name}</span>
            <span className="report-tooltip-value">{formattedValue}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function SalesReports() {
  const [period, setPeriod] = useState("monthly");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const selectedPeriodLabel = PERIOD_LABELS[period] || "Monthly";
  const periodUnitLabel = getPeriodUnitLabel(period);
  const periodRevenue = Number(report?.summary?.totalRevenue || 0);

  const fetchReport = async (selectedPeriod) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/reports?period=${selectedPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch reports");
      }

      setReport(data);
    } catch (err) {
      setError(err.message || "Failed to load report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  const chartData = (report?.chartData || []).slice(0, 10);

  const productCountDistribution = useMemo(
    () => [
      {
        name: "High Selling",
        value: report?.groups?.highSelling?.length || 0,
        color: CATEGORY_COLORS.high,
      },
      {
        name: "Medium Selling",
        value: report?.groups?.mediumSelling?.length || 0,
        color: CATEGORY_COLORS.medium,
      },
      {
        name: "Low Selling",
        value: report?.groups?.lowSelling?.length || 0,
        color: CATEGORY_COLORS.low,
      },
    ],
    [report]
  );

  const revenueDistribution = useMemo(
    () => [
      {
        name: "High Selling",
        value: (report?.groups?.highSelling || []).reduce((sum, p) => sum + p.totalRevenue, 0),
        color: CATEGORY_COLORS.high,
      },
      {
        name: "Medium Selling",
        value: (report?.groups?.mediumSelling || []).reduce((sum, p) => sum + p.totalRevenue, 0),
        color: CATEGORY_COLORS.medium,
      },
      {
        name: "Low Selling",
        value: (report?.groups?.lowSelling || []).reduce((sum, p) => sum + p.totalRevenue, 0),
        color: CATEGORY_COLORS.low,
      },
    ],
    [report]
  );

  const hasCategoryDistribution = productCountDistribution.some((item) => item.value > 0);

  const periodCoverageText = useMemo(() => {
    const startDate = report?.range?.startDate;
    const endDate = report?.range?.endDate;

    if (!startDate || !endDate) return "";

    if (period === "quarterly") {
      const quarterMonths = getMonthLabelsInRange(startDate, endDate);
      if (quarterMonths.length > 0) {
        return `Quarter months: ${quarterMonths.join(" | ")}`;
      }
    }

    return `Range: ${formatShortDate(startDate)} to ${formatShortDate(endDate)}`;
  }, [period, report]);

  const downloadPDF = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/reports-pdf?period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sales-report-${period}-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download PDF: " + err.message);
    }
  };

  return (
    <div className="container py-4 sales-reports-page">
      <h1 className="mb-4 text-center report-page-title">📊 Sales Reports</h1>

      <div className="card shadow-sm mb-4 report-surface report-control-card">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h5 className="mb-1">Generate Report</h5>
            <small className="text-muted">Choose report period: monthly, quarterly, annual</small>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <select
              className="form-select"
              style={{ maxWidth: "220px" }}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              className="btn btn-success"
              onClick={downloadPDF}
              disabled={!report}
              title="Download report as PDF"
            >
              📥 Download PDF
            </button>
          </div>
        </div>
      </div>

      {loading && <p className="text-center report-loading">Loading report...</p>}

      {error && (
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && report && (
        <>
          <div className="report-metric-grid mb-4">
            <div className="report-metric-item">
              <div className="card shadow-sm h-100 report-surface report-metric-card">
                <div className="card-body">
                  <h6 className="text-muted">Total Orders</h6>
                  <h4 className="mb-0 report-metric-value">{report.summary?.totalOrders || 0}</h4>
                </div>
              </div>
            </div>
            <div className="report-metric-item">
              <div className="card shadow-sm h-100 report-surface report-metric-card">
                <div className="card-body">
                  <h6 className="text-muted">Total Units Sold</h6>
                  <h4 className="mb-0 report-metric-value">{report.summary?.totalUnitsSold || 0}</h4>
                </div>
              </div>
            </div>
            <div className="report-metric-item">
              <div className="card shadow-sm h-100 report-surface report-metric-card">
                <div className="card-body">
                  <h6 className="text-muted">Total Products</h6>
                  <h4 className="mb-0 report-metric-value">{report.summary?.totalProducts || 0}</h4>
                </div>
              </div>
            </div>
            <div className="report-metric-item">
              <div className="card shadow-sm h-100 report-surface report-metric-card">
                <div className="card-body">
                  <h6 className="text-muted">{selectedPeriodLabel} Revenue</h6>
                  <h4 className="mb-0 report-metric-value">{formatCurrency(periodRevenue)}</h4>
                </div>
              </div>
            </div>
            <div className="report-metric-item">
              <div className="card shadow-sm h-100 report-surface report-metric-card">
                <div className="card-body">
                  <h6 className="text-muted">Highest Selling</h6>
                  <h6 className="mb-0 report-metric-highlight">{report.summary?.topProduct?.productName || "N/A"}</h6>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4 report-surface report-chart-card">
            <div className="card-body">
              <h5 className="mb-1 report-chart-title">Top Products for {selectedPeriodLabel} Report</h5>
              {periodCoverageText && (
                <div className="report-period-meta report-chart-period-meta mb-2">
                  {periodCoverageText}
                </div>
              )}
              <p className="text-muted small mb-3 report-chart-subtitle">
                This chart shows the 10 best-selling products based on quantity sold in the selected period.
              </p>

              {chartData.length === 0 ? (
                <p className="text-muted mb-0">No sales data found for selected period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 16, right: 24, left: 8, bottom: 80 }}
                  >
                    <defs>
                      <linearGradient id="unitsSoldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_THEME.barPrimaryStart} />
                        <stop offset="100%" stopColor={CHART_THEME.barPrimaryEnd} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke={CHART_THEME.grid} vertical={false} />
                    <XAxis
                      dataKey="label"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fill: CHART_THEME.axis, fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: CHART_THEME.axisLine }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: CHART_THEME.axis, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Quantity Sold",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: CHART_THEME.axis, fontSize: 12, fontWeight: 600 },
                      }}
                    />
                    <Tooltip
                      content={
                        <CustomTooltip
                          valueFormatter={(value) => `${value} units`}
                          labelFormatter={(label) => `Product: ${label}`}
                        />
                      }
                    />
                    <Legend wrapperStyle={{ color: CHART_THEME.text, fontWeight: 600, paddingTop: 8 }} />
                    <Bar
                      dataKey="qty"
                      name="Units Sold"
                      fill="url(#unitsSoldGradient)"
                      radius={[10, 10, 0, 0]}
                      barSize={34}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card shadow-sm mb-4 report-surface report-chart-card">
            <div className="card-body">
              <h5 className="mb-3 report-chart-title">Product Distribution by Sales Level</h5>
              {periodCoverageText && (
                <div className="report-period-meta report-chart-period-meta mb-3">
                  {periodCoverageText}
                </div>
              )}

              {!report.groups || !hasCategoryDistribution ? (
                <p className="text-muted mb-0">No product data available.</p>
              ) : (
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-center report-subchart-title">Product Count by Category</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={productCountDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) =>
                            percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ""
                          }
                          innerRadius={58}
                          outerRadius={95}
                          cornerRadius={8}
                          paddingAngle={2}
                          stroke="#ffffff"
                          strokeWidth={2}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {productCountDistribution.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" wrapperStyle={{ color: CHART_THEME.text, fontWeight: 600 }} />
                        <Tooltip
                          content={
                            <CustomTooltip valueFormatter={(value) => `${value} products`} />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="col-md-6">
                    <h6 className="text-center report-subchart-title">Revenue by Sales Level</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={revenueDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) =>
                            percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ""
                          }
                          innerRadius={58}
                          outerRadius={95}
                          cornerRadius={8}
                          paddingAngle={2}
                          stroke="#ffffff"
                          strokeWidth={2}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {revenueDistribution.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" wrapperStyle={{ color: CHART_THEME.text, fontWeight: 600 }} />
                        <Tooltip
                          content={
                            <CustomTooltip valueFormatter={(value) => formatCurrency(value)} />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm mb-4 report-surface report-chart-card">
            <div className="card-body">
              <h5 className="mb-3 report-chart-title">Top 10 Customers by Total Spent</h5>
              {periodCoverageText && (
                <div className="report-period-meta report-chart-period-meta mb-3">
                  {periodCoverageText}
                </div>
              )}

              {(!report.topCustomers || report.topCustomers.length === 0) ? (
                <p className="text-muted mb-0">No customer data found for selected period.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={report.topCustomers}
                      margin={{ top: 16, right: 24, left: 12, bottom: 100 }}
                    >
                      <defs>
                        <linearGradient id="customerSpentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_THEME.barSecondaryStart} />
                          <stop offset="100%" stopColor={CHART_THEME.barSecondaryEnd} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke={CHART_THEME.grid} vertical={false} />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tick={{ fill: CHART_THEME.axis, fontSize: 11, fontWeight: 500 }}
                        axisLine={{ stroke: CHART_THEME.axisLine }}
                        tickLine={false}
                      />
                      <YAxis 
                        label={{ value: "Total Spent (₹)", angle: -90, position: "insideLeft" }}
                        tickFormatter={(value) => `₹${Number(value || 0).toLocaleString("en-IN")}`}
                        tick={{ fill: CHART_THEME.axis, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        content={
                          <CustomTooltip
                            valueFormatter={(value) => formatCurrency(value)}
                            labelFormatter={(label) => {
                              const customer = report.topCustomers.find((c) => c.name === label);
                              return customer
                                ? `${customer.name} (${customer.orders} orders)`
                                : label;
                            }}
                          />
                        }
                      />
                      <Legend wrapperStyle={{ color: CHART_THEME.text, fontWeight: 600, paddingTop: 8 }} />
                      <Bar
                        dataKey="spent"
                        name="Total Spent"
                        fill="url(#customerSpentGradient)"
                        radius={[10, 10, 0, 0]}
                        barSize={34}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-3">
                    <small className="text-muted">
                      Showing {report.topCustomers.length} customer{report.topCustomers.length !== 1 ? 's' : ''}
                    </small>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card shadow-sm mb-4 report-surface report-chart-card">
            <div className="card-body">
              <h5 className="mb-1 report-chart-title">{selectedPeriodLabel} Sales vs Orders Comparison</h5>
              {periodCoverageText && (
                <div className="report-period-meta report-chart-period-meta mb-2">
                  {periodCoverageText}
                </div>
              )}
              <p className="text-muted small mb-3 report-chart-subtitle">
                Compare total sales amount and total number of orders across each {periodUnitLabel} in the selected report.
              </p>

              {(!report.salesTrend || report.salesTrend.length === 0) ? (
                <p className="text-muted mb-0">No sales data available.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={report.salesTrend}
                      margin={{ top: 16, right: 24, left: 8, bottom: 70 }}
                    >
                      <defs>
                        <linearGradient id="salesAmountGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_THEME.barPrimaryStart} />
                          <stop offset="100%" stopColor={CHART_THEME.barPrimaryEnd} />
                        </linearGradient>
                        <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_THEME.barAccentStart} />
                          <stop offset="100%" stopColor={CHART_THEME.barAccentEnd} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke={CHART_THEME.grid} vertical={false} />
                      <XAxis
                        dataKey="period"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fill: CHART_THEME.axis, fontSize: 11, fontWeight: 500 }}
                        axisLine={{ stroke: CHART_THEME.axisLine }}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="left"
                        label={{ value: "Sales Amount (₹)", angle: -90, position: "insideLeft" }}
                        tickFormatter={(value) => `₹${Number(value || 0).toLocaleString("en-IN")}`}
                        tick={{ fill: CHART_THEME.axis, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        label={{ value: "Orders", angle: 90, position: "insideRight" }}
                        tick={{ fill: CHART_THEME.axis, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        content={
                          <CustomTooltip
                            valueFormatter={(value, name) => {
                              if (name === "Total Sales") return formatCurrency(value);
                              return `${value} orders`;
                            }}
                            labelFormatter={(label) => `${selectedPeriodLabel} Period: ${label}`}
                          />
                        }
                      />
                      <Legend wrapperStyle={{ color: CHART_THEME.text, fontWeight: 600, paddingTop: 8 }} />
                      <Bar
                        yAxisId="left"
                        dataKey="sales"
                        name="Total Sales"
                        fill="url(#salesAmountGradient)"
                        radius={[10, 10, 0, 0]}
                        barSize={30}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="orders"
                        name="Total Orders"
                        fill="url(#ordersGradient)"
                        radius={[10, 10, 0, 0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-3">
                    <small className="text-muted">
                      Showing {report.salesTrend.length} {periodUnitLabel}{report.salesTrend.length !== 1 ? 's' : ''} of comparison data
                    </small>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <div className="card border-success h-100 report-group-card">
                <div className="card-header bg-success text-white">High Selling</div>
                <ul className="list-group list-group-flush">
                  {(report.groups?.highSelling || []).slice(0, 8).map((item) => (
                    <li key={item.productName} className="list-group-item d-flex justify-content-between">
                      <span>{item.productName}</span>
                      <strong>{item.totalQty}</strong>
                    </li>
                  ))}
                  {(report.groups?.highSelling || []).length === 0 && (
                    <li className="list-group-item text-muted">No data</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-warning h-100 report-group-card">
                <div className="card-header bg-warning">Medium Selling</div>
                <ul className="list-group list-group-flush">
                  {(report.groups?.mediumSelling || []).slice(0, 8).map((item) => (
                    <li key={item.productName} className="list-group-item d-flex justify-content-between">
                      <span>{item.productName}</span>
                      <strong>{item.totalQty}</strong>
                    </li>
                  ))}
                  {(report.groups?.mediumSelling || []).length === 0 && (
                    <li className="list-group-item text-muted">No data</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-danger h-100 report-group-card">
                <div className="card-header bg-danger text-white">Low Selling</div>
                <ul className="list-group list-group-flush">
                  {(report.groups?.lowSelling || []).slice(0, 8).map((item) => (
                    <li key={item.productName} className="list-group-item d-flex justify-content-between">
                      <span>{item.productName}</span>
                      <strong>{item.totalQty}</strong>
                    </li>
                  ))}
                  {(report.groups?.lowSelling || []).length === 0 && (
                    <li className="list-group-item text-muted">No data</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
