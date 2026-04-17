"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function ReportsContent() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get('company_id');

    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [distribution, setDistribution] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            const companyQuery = companyId ? `company_id=${companyId}` : "";

            const [statsRes, historyRes, distRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/reports/dashboard-stats?${companyQuery}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/reports/financial-history?${companyQuery}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/reports/distribution?${companyQuery}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setStats(statsRes.data);
            setHistory(historyRes.data);
            setDistribution(distRes.data);

        } catch (err: any) {
            console.error("Error fetching report data:", err);
            setError(err.response?.data?.detail || err.message || "Failed to load reports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [companyId]);

    if (loading) return <div className="text-center py-5 mt-5"><div className="spinner-border text-primary spinner-border-lg"></div></div>;

    const lineData = {
        labels: history.map(h => h.month),
        datasets: [
            {
                label: 'Revenue',
                data: history.map(h => h.revenue),
                borderColor: '#19c37d',
                backgroundColor: 'rgba(25, 195, 125, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Expenses',
                data: history.map(h => h.expenses),
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const doughnutData = {
        labels: distribution?.expenses_by_category.map((e: any) => e.category) || [],
        datasets: [
            {
                data: distribution?.expenses_by_category.map((e: any) => e.amount) || [],
                backgroundColor: [
                    '#1d256d', '#19c37d', '#fd7e14', '#6610f2', '#0dcaf0', '#6c757d'
                ],
                borderWidth: 0,
            },
        ],
    };

    const barData = {
        labels: distribution?.employees_by_department.map((d: any) => d.department) || [],
        datasets: [
            {
                label: 'Headcount',
                data: distribution?.employees_by_department.map((d: any) => d.count) || [],
                backgroundColor: '#1d256d',
                borderRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 20 } },
        },
        scales: {
            y: { beginAtZero: true, grid: { display: false } },
            x: { grid: { display: false } }
        }
    };

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Header */}
            <div className="mb-5">
                <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Analytics & Reports</h2>
                <p className="text-secondary small fw-medium">Insightful data visualizations for company performance</p>
            </div>

            {/* KPI Cards */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Total Revenue', val: stats?.total_revenue, icon: 'bi-currency-dollar', color: '#19c37d' },
                    { label: 'Total Expenses', val: stats?.total_expenses, icon: 'bi-dash-circle', color: '#dc3545' },
                    { label: 'Profitability', val: stats?.profitability, icon: 'bi-graph-up-arrow', color: stats?.profitability >= 0 ? '#19c37d' : '#dc3545' },
                    { label: 'Team Size', val: stats?.total_employees, icon: 'bi-people', color: '#1d256d' }
                ].map((kpi, i) => (
                    <div className="col-12 col-sm-6 col-xl-3" key={i}>
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100 border-start border-4" style={{ borderLeftColor: kpi.color + ' !important' }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="text-secondary fw-bold text-uppercase mb-0" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>{kpi.label}</h6>
                                <i className={`bi ${kpi.icon} fs-5`} style={{ color: kpi.color }}></i>
                            </div>
                            <h3 className="fw-bolder mb-0">
                                {typeof kpi.val === 'number' && kpi.label !== 'Team Size' ? `$${kpi.val.toLocaleString()}` : kpi.val}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="row g-4 mb-5">
                <div className="col-12 col-xl-8">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <h5 className="fw-bold mb-4">Financial Trends (Last 6 Months)</h5>
                        <div style={{ height: '350px' }}>
                            <Line data={lineData} options={chartOptions} />
                        </div>
                    </div>
                </div>
                <div className="col-12 col-xl-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <h5 className="fw-bold mb-4">Expense Distribution</h5>
                        <div style={{ height: '350px' }} className="d-flex align-items-center justify-content-center">
                            <Doughnut data={doughnutData} options={{ ...chartOptions, cutout: '70%' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="row g-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h5 className="fw-bold mb-4">Workforce Distribution by Department</h5>
                        <div style={{ height: '300px' }}>
                            <Bar data={barData} options={chartOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <ReportsContent />
        </Suspense>
    );
}
