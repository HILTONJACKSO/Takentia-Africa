"use client";
import { API_BASE_URL } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

export default function PerformancePage() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get("company_id");

    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0, highPerformers: 0 });

    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        if (!token) {
            setError("Authentication token missing. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
            const companyQuery = isCompanyIdValid ? `company_id=${companyId}` : "";
            const res = await axios.get(`${API_BASE_URL}/hr/performance-reviews`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = res.data;
            if (!Array.isArray(data)) {
                throw new Error("Invalid data format received from server.");
            }

            setReviews(data);

            // Calculate stats
            if (data.length > 0) {
                const total = data.length;
                const sum = data.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
                const avg = sum / total;
                const high = data.filter((r: any) => (r.rating || 0) >= 4).length;
                setStats({
                    avgRating: isNaN(avg) ? 0 : parseFloat(avg.toFixed(1)),
                    totalReviews: total,
                    highPerformers: high
                });
            } else {
                setStats({ avgRating: 0, totalReviews: 0, highPerformers: 0 });
            }
        } catch (err: any) {
            console.error("Error fetching performance data:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            let errorMessage = "Failed to load performance data.";
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    // Handle FastAPI validation error list
                    errorMessage = err.response.data.detail.map((d: any) => d.msg || d.type).join(", ");
                }
            } else {
                errorMessage = err.message || errorMessage;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, [companyId]);

    const renderStars = (rating: number) => {
        return (
            <div className="d-flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                    <i key={s} className={`bi bi-star-fill ${s <= rating ? 'text-warning' : 'text-light'}`} style={{ fontSize: '0.8rem' }}></i>
                ))}
            </div>
        );
    };

    return (
        <div className="container-fluid py-4 min-vh-100 bg-light">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 mb-5">
                <div>
                    <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Performance Management</h2>
                    <p className="text-secondary mb-0 small fw-medium">Monitor and evaluate staff growth and contributions</p>
                </div>
                <Link
                    href={`/dashboard/hr/performance/new${companyId && companyId !== "null" ? `?company_id=${companyId}` : ""}`}
                    className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2"
                >
                    <i className="bi bi-plus-lg"></i> New Evaluation
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Avg. Organization Rating', value: `${stats.avgRating} / 5`, icon: 'bi-star-half', color: '#1d256d' },
                    { label: 'Completed Reviews', value: stats.totalReviews, icon: 'bi-clipboard-check', color: '#19c37d' },
                    { label: 'High Performers (4+)', value: stats.highPerformers, icon: 'bi-trophy', color: '#ffc107' },
                ].map((stat, i) => (
                    <div className="col-12 col-md-4" key={stat.label}>
                        <div className="card border-0 shadow-sm h-100 p-3" style={{ borderRadius: '18px' }}>
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-3 rounded-4 d-flex align-items-center justify-content-center" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                    <i className={`bi ${stat.icon} fs-4`}></i>
                                </div>
                                <div>
                                    <small className="text-secondary fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>{stat.label}</small>
                                    <h3 className="fw-bolder mb-0 text-dark">{stat.value}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="alert alert-danger border-0 shadow-sm mb-4 d-flex align-items-center gap-3" style={{ borderRadius: '18px' }}>
                    <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                    <div>
                        <div className="fw-bold">Failed to load evaluations</div>
                        <small className="opacity-75">{error}</small>
                    </div>
                    <button className="btn btn-sm btn-outline-danger ms-auto fw-bold" onClick={fetchData}>Retry</button>
                </div>
            )}

            {/* Main Content: Performance Records */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '24px' }}>
                <h5 className="fw-bold mb-4">Recent Evaluations</h5>

                <div className="table-responsive">
                    <table className="table table-hover align-middle border-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0 px-4 py-3 text-secondary small fw-bold text-uppercase">Employee</th>
                                <th className="border-0 py-3 text-secondary small fw-bold text-uppercase">Evaluation Date</th>
                                <th className="border-0 py-3 text-secondary small fw-bold text-uppercase">Rating</th>
                                <th className="border-0 py-3 text-secondary small fw-bold text-uppercase">Core Strength</th>
                                <th className="border-0 py-3 text-end px-4 text-secondary small fw-bold text-uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                            ) : reviews.length === 0 ? (
                                <tr><td colSpan={5} className="text-center text-muted py-5">No performance reviews recorded for this company.</td></tr>
                            ) : reviews.map((rev) => (
                                <tr key={rev.id}>
                                    <td className="px-4 py-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle fw-bold shadow-sm" style={{ width: 40, height: 40 }}>
                                                {rev.employee?.first_name?.[0]}{rev.employee?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark">{rev.employee?.first_name} {rev.employee?.last_name}</div>
                                                <small className="text-muted">{rev.employee?.position}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 text-secondary fw-medium">{new Date(rev.review_date).toLocaleDateString()}</td>
                                    <td className="py-3">
                                        <div className="d-flex flex-column gap-1">
                                            <span className={`fw-bold ${rev.rating >= 4 ? 'text-success' : rev.rating >= 3 ? 'text-warning' : 'text-danger'}`}>
                                                {rev.rating}.0 / 5
                                            </span>
                                            {renderStars(rev.rating)}
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <span className="badge bg-primary text-white px-3 py-2 rounded-pill small fw-medium shadow-sm">
                                            {rev.strengths?.split(',')[0] || "Consistency"}
                                        </span>
                                    </td>
                                    <td className="py-3 text-end px-4">
                                        <Link 
                                            href={companyId ? `/dashboard/hr/staff/${rev.employee_id}?company_id=${companyId}` : `/dashboard/hr/staff/${rev.employee_id}`}
                                            className="btn btn-light btn-sm rounded-3 me-1 hover-scale"
                                            title="View Staff Profile"
                                        >
                                            <i className="bi bi-eye"></i>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
