"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, ArcElement, Filler
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [attStatus, setAttStatus] = useState<any>(null);
    const [attLoading, setAttLoading] = useState(false);
    const [finHistory, setFinHistory] = useState<any[]>([]);
    const [staffGrowth, setStaffGrowth] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const config = {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
        };

        // Fetch Basic Stats
        axios.get("http://localhost:8001/api/v1/reports/dashboard-stats", config)
            .then(res => setStats(res.data))
            .catch(err => {
                console.error("Dashboard Stats Error:", err);
                if (err.response?.status === 401) window.location.href = '/login';
            });

        // Fetch Financial History
        axios.get("http://localhost:8001/api/v1/reports/financial-history", config)
            .then(res => setFinHistory(res.data))
            .catch(err => console.error("Fin History Error:", err));

        // Fetch Staff Growth
        axios.get("http://localhost:8001/api/v1/reports/staff-growth", config)
            .then(res => setStaffGrowth(res.data))
            .catch(err => console.error("Staff Growth Error:", err));

        // Fetch Companies
        axios.get("http://localhost:8001/api/v1/companies/", config)
            .then(res => setCompanies(res.data))
            .catch(err => console.error("Companies Error:", err));

        // Fetch Recent Activity
        axios.get("http://localhost:8001/api/v1/reports/recent-activity", config)
            .then(res => setActivities(res.data))
            .catch(err => console.error("Recent Activity Error:", err));

        // Fetch Attendance Status
        axios.get("http://localhost:8001/api/v1/hr/attendance/my-status", config)
            .then(res => setAttStatus(res.data))
            .catch(err => console.error("Attendance Status Error:", err));
    }, []);

    const handleAttendanceAction = async () => {
        const token = localStorage.getItem("token");
        setAttLoading(true);
        try {
            const res = await axios.post("http://localhost:8001/api/v1/hr/attendance/check-in-out", {}, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000
            });
            setAttStatus(res.data);
            alert(res.data.check_out ? "Successfully Checked Out!" : "Successfully Checked In!");
        } catch (err: any) {
            console.error("Attendance Action Error:", err);
            let errorMessage = "Failed to update attendance.";
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail.map((d: any) => d.msg || d.type).join(", ");
                }
            } else if (err.message === "Network Error") {
                errorMessage = "Network Error: Unable to reach the server. Please ensure the backend is running at http://localhost:8001";
            } else {
                errorMessage = err.message || errorMessage;
            }
            alert(errorMessage);
        } finally {
            setAttLoading(false);
        }
    };

    if (!stats) {
        return (
            <div className="d-flex justify-content-center align-items-center h-100 py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const revenueExpensesData = {
        labels: finHistory.map(h => h.month),
        datasets: [
            {
                label: "Revenue",
                data: finHistory.map(h => h.revenue),
                backgroundColor: "#1d256d",
                borderRadius: 4,
            },
            {
                label: "Expenses",
                data: finHistory.map(h => h.expenses),
                backgroundColor: "#D0DD28",
                borderRadius: 4,
            }
        ]
    };

    const payrollTrendsData = {
        labels: finHistory.map(h => h.month),
        datasets: [
            {
                label: "Expenses Trend",
                data: finHistory.map(h => h.expenses),
                borderColor: "#1d256d",
                backgroundColor: "rgba(29, 37, 109, 0.5)",
                fill: true,
                tension: 0.4,
            }
        ]
    };

    const staffGrowthData = {
        labels: staffGrowth.map(g => g.month),
        datasets: [
            {
                label: "Staff Count",
                data: staffGrowth.map(g => g.count),
                borderColor: "#1d256d",
                backgroundColor: "#fff",
                pointBackgroundColor: "#fff",
                pointBorderColor: "#1d256d",
                tension: 0.1,
            }
        ]
    };

    return (
        <div className="container-fluid pb-5 pt-4 px-4 min-vh-100" style={{ backgroundColor: '#F8F9FA' }}>
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bolder text-dark mb-1">Dashboard</h2>
                    <p className="text-secondary mb-0">Welcome back! Here's your HR overview</p>
                </div>
                <div className="text-end">
                    <p className="text-secondary mb-1 small fw-medium">Today</p>
                    <h5 className="fw-bolder text-dark mb-0 fs-5">{formattedDate}</h5>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="row g-3 g-md-4 mb-4">
                <div className="col-12 col-sm-6 col-xl-4">
                    <div className="card h-100 p-4 border-light shadow-sm bg-white" style={{ borderRadius: '12px' }}>
                        <div className="d-flex align-items-start justify-content-between">
                            <div>
                                <p className="text-secondary mb-1 fw-medium small">Total Staff</p>
                                <h2 className="fw-bold text-dark mb-2">{stats.total_employees}</h2>
                                <div className="text-success small fw-medium">Across all departments</div>
                            </div>
                            <div className="bg-primary bg-opacity-10 rounded d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                <i className="bi bi-people fs-4 text-primary"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-4">
                    <div className="card h-100 p-4 border-light shadow-sm bg-white" style={{ borderRadius: '12px' }}>
                        <div className="d-flex align-items-start justify-content-between">
                            <div>
                                <p className="text-secondary mb-1 fw-medium small">Total Expenses (MTD)</p>
                                <h2 className="fw-bold text-dark mb-2">${stats.total_expenses?.toLocaleString()}</h2>
                                <div className="text-secondary small fw-medium">Revenue: ${stats.total_revenue?.toLocaleString()}</div>
                            </div>
                            <div className="bg-opacity-10 p-3 rounded d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(208, 221, 40, 0.2)' }}>
                                <i className="bi bi-currency-dollar fs-4" style={{ color: '#C1CB20' }}></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-12 col-xl-4">
                    <div className="card h-100 p-4 border-light shadow-sm bg-white" style={{ borderRadius: '12px' }}>
                        <div className="d-flex align-items-start justify-content-between">
                            <div>
                                <p className="text-secondary mb-1 fw-medium small">Profitability</p>
                                <h2 className={`fw-bold mb-2 ${stats.profitability >= 0 ? 'text-success' : 'text-danger'}`}>
                                    ${stats.profitability?.toLocaleString()}
                                </h2>
                                <div className="text-secondary small fw-medium">Net movement</div>
                            </div>
                            <div className="bg-success bg-opacity-10 p-3 rounded d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                <i className={`bi ${stats.profitability >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'} fs-4 text-success`}></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-4 d-flex align-items-center gap-4">
                <h6 className="fw-bold text-dark mb-0">Quick Actions</h6>
            </div>
            <div className="row g-3 mb-5">
                <div className="col-6 col-md-3">
                    <Link href="/dashboard/hr/staff/add" className="btn w-100 text-white p-4 shadow-sm border-0 d-flex flex-column align-items-center justify-content-center gap-2 transition-all hover-scale text-decoration-none" style={{ backgroundColor: '#1d256d', borderRadius: '10px' }}>
                        <i className="bi bi-person-plus fs-3"></i>
                        <span className="fw-medium small">Add Staff</span>
                    </Link>
                </div>
                <div className="col-6 col-md-3">
                    <Link href="/dashboard/finance/payroll" className="btn w-100 text-dark p-4 shadow-sm border-0 d-flex flex-column align-items-center justify-content-center gap-2 transition-all hover-scale text-decoration-none" style={{ backgroundColor: '#ffc107', borderRadius: '10px' }}>
                        <i className="bi bi-calculator fs-3"></i>
                        <span className="fw-medium small">Run Payroll</span>
                    </Link>
                </div>
                <div className="col-6 col-md-3">
                    <button className="btn w-100 text-white p-4 shadow-sm border-0 d-flex flex-column align-items-center justify-content-center gap-2 transition-all hover-scale" style={{ backgroundColor: '#28a745', borderRadius: '10px' }}>
                        <i className="bi bi-file-earmark-text fs-3"></i>
                        <span className="fw-medium small">Request Payment</span>
                    </button>
                </div>
                <div className="col-6 col-md-3">
                    <button
                        onClick={handleAttendanceAction}
                        disabled={attLoading || (attStatus && attStatus.check_in && attStatus.check_out)}
                        className={`btn w-100 text-white p-4 shadow-sm border-0 d-flex flex-column align-items-center justify-content-center gap-2 transition-all hover-scale ${attLoading ? 'opacity-50' : ''}`}
                        style={{
                            backgroundColor: (attStatus && attStatus.check_in && attStatus.check_out) ? '#6c757d' : (attStatus && attStatus.check_in ? '#dc3545' : '#a855f7'),
                            borderRadius: '10px'
                        }}
                    >
                        {attLoading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                            <>
                                <i className={`bi ${attStatus && attStatus.check_in && attStatus.check_out ? 'bi-check-all' : (attStatus && attStatus.check_in ? 'bi-box-arrow-right' : 'bi-clipboard-check')} fs-3`}></i>
                                <span className="fw-medium small">
                                    {attStatus && attStatus.check_in && attStatus.check_out
                                        ? 'Attendance Completed'
                                        : (attStatus && attStatus.check_in ? 'Check Out' : 'Check In')}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Managed Companies */}
            <div className="mb-4 d-flex align-items-center gap-4">
                <h6 className="fw-bold text-dark mb-0">Managed Companies</h6>
            </div>
            <div className="row g-3 g-md-4 mb-5">
                {companies.map((company) => {
                    let gradient = 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)';
                    let icon = 'bi-building';
                    
                    if (company.name.toLowerCase().includes('orange')) {
                        gradient = 'linear-gradient(135deg, #FF7900 0%, #CC6100 100%)';
                        icon = 'bi-tower';
                    } else if (company.name.toLowerCase().includes('finch') || company.name.toLowerCase().includes('logging')) {
                        gradient = 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)';
                        icon = 'bi-tree';
                    } else if (company.name.toLowerCase().includes('talentia')) {
                        gradient = 'linear-gradient(135deg, #1d256d 0%, #171d54 100%)';
                        icon = 'bi-shield-check';
                    }

                    return (
                        <div key={company.id} className="col-12 col-md-6 col-xl-4">
                            <Link href={`/dashboard/companies/${company.id}`} className="text-decoration-none transition-all hover-scale d-block">
                                <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '15px', background: gradient }}>
                                    <div className="card-body p-4 text-white d-flex align-items-center justify-content-between">
                                        <div>
                                            <h5 className="fw-bold mb-1">{company.name}</h5>
                                            <p className="small mb-0 opacity-75">{company.description || 'Enterprise Management'}</p>
                                        </div>
                                        <div className="bg-white bg-opacity-20 p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                            <i className={`bi ${icon} fs-3`}></i>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-black bg-opacity-10 d-flex justify-content-between align-items-center">
                                        <span className="small fw-medium">View Staff & Payroll</span>
                                        <i className="bi bi-arrow-right"></i>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="row g-3 g-md-4 mb-4">
                <div className="col-12 col-xl-6">
                    <div className="card shadow-sm border-light bg-white p-4 h-100" style={{ borderRadius: '12px' }}>
                        <h6 className="fw-bold mb-4 text-dark">Payroll Trends</h6>
                        <div style={{ height: "300px" }}>
                            <Line data={payrollTrendsData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                        </div>
                    </div>
                </div>
                <div className="col-12 col-xl-6">
                    <div className="card shadow-sm border-light bg-white p-4 h-100" style={{ borderRadius: '12px' }}>
                        <h6 className="fw-bold mb-4 text-dark">Revenue vs Expenses</h6>
                        <div style={{ height: "300px" }}>
                            <Bar data={revenueExpensesData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                        </div>
                        <div className="d-flex justify-content-center gap-4 mt-2">
                            <div className="d-flex align-items-center gap-2">
                                <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#1d256d' }}></span>
                                <span className="small text-muted fw-medium">Revenue</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#D0DD28' }}></span>
                                <span className="small text-muted fw-medium">Expenses</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="row g-3 g-md-4">
                <div className="col-12 col-xl-8">
                    <div className="card shadow-sm border-light bg-white p-4 h-100" style={{ borderRadius: '12px' }}>
                        <h6 className="fw-bold mb-4 text-dark">Staff Growth</h6>
                        <div style={{ height: "300px" }}>
                            <Line data={staffGrowthData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                        </div>
                        <div className="d-flex justify-content-center gap-4 mt-2">
                            <div className="d-flex align-items-center gap-2">
                                <span className="rounded-pill" style={{ width: '16px', height: '6px', backgroundColor: '#1d256d' }}></span>
                                <span className="small text-muted fw-medium">Staff Count</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-xl-4">
                    <div className="card shadow-sm border-light bg-white p-4 h-100" style={{ borderRadius: '12px' }}>
                        <h6 className="fw-bold mb-4 text-dark">Recent Activity</h6>
                        <div className="mt-2 h-100 overflow-auto custom-scrollbar pe-2">
                            {activities.length === 0 ? (
                                <div className="text-center py-5 text-muted small">No recent activity found.</div>
                            ) : activities.map((act, i) => (
                                <div key={i} className={`position-relative ps-4 pb-4 border-start border-${act.color} opacity-100 border-2 ms-2 ${i === activities.length - 1 ? 'border-0 pb-0' : ''}`}>
                                    <span className={`position-absolute translate-middle p-1 bg-${act.color} border border-light rounded-circle border-2`} style={{ left: 0, top: '5px' }}></span>
                                    <div className="fw-bold text-dark lh-sm small">{act.title}</div>
                                    <small className="text-secondary d-block" style={{ fontSize: '0.75rem' }}>{act.subtitle}</small>
                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>{act.time}</small>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
