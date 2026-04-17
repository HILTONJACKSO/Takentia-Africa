"use client";
import { API_BASE_URL } from "@/lib/api";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

import { useSearchParams } from "next/navigation";

export default function StaffDirectory() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get("company_id");
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
        const url = isCompanyIdValid
            ? `${API_BASE_URL}/hr/employees?company_id=${companyId}`
            : `${API_BASE_URL}/hr/employees`;

        setLoading(true);
        setError(null);
        axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setStaff(res.data))
            .catch(err => {
                if (err.response?.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                let errorMessage = "Failed to load staff data.";
                if (err.response?.data?.detail) {
                    if (typeof err.response.data.detail === 'string') {
                        errorMessage = err.response.data.detail;
                    } else if (Array.isArray(err.response.data.detail)) {
                        errorMessage = err.response.data.detail.map((d: any) => d.msg || d.type).join(", ");
                    }
                } else {
                    errorMessage = err.message || errorMessage;
                }
                setError(errorMessage);
                console.error(err);
            })
            .finally(() => setLoading(false));
    }, [companyId]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) return;
        
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_BASE_URL}/hr/employees/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setStaff(prev => prev.filter(s => s.id !== id));
        } catch (err: any) {
            let errorMessage = "Failed to delete staff member.";
            if (err.response?.data?.detail) {
                errorMessage = typeof err.response.data.detail === 'string' ? err.response.data.detail : err.message;
            }
            alert(errorMessage);
        }
    };

    // Statistics Calculation
    const stats = useMemo(() => {
        const total = staff.length;
        const active = staff.filter(s => s.status === 'ACTIVE').length;
        const onLeave = staff.filter(s => s.status === 'ON_LEAVE').length;
        const prospective = staff.filter(s => s.status === 'PROSPECTIVE').length;
        const qualified = staff.filter(s => s.qualification && s.qualification.toLowerCase().includes('bsc') || s.qualification?.toLowerCase().includes('msc') || s.qualification?.toLowerCase().includes('mba') || s.qualification?.toLowerCase().includes('cpa')).length;

        return { total, active, onLeave, prospective, qualified };
    }, [staff]);

    // Filtering logic
    const filteredStaff = useMemo(() => {
        return staff.filter(emp =>
            `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [staff, searchTerm]);

    // Upcoming Birthdays
    const upcomingBirthdays = useMemo(() => {
        const today = new Date();
        return staff.filter(emp => {
            if (!emp.date_of_birth) return false;
            const dob = new Date(emp.date_of_birth);
            const thisYearDob = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
            const diffTime = thisYearDob.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 30;
        }).sort((a, b) => {
            const dobA = new Date(a.date_of_birth);
            const dobB = new Date(b.date_of_birth);
            return dobA.getMonth() - dobB.getMonth() || dobA.getDate() - dobB.getDate();
        });
    }, [staff]);

    // Distribution Data (vibrant colors matching brand)
    const distributionData = {
        labels: ['Active', 'On Leave', 'Prospective', 'Inactive/Others'],
        datasets: [{
            data: [
                staff.filter(s => s.status === 'ACTIVE').length,
                staff.filter(s => s.status === 'ON_LEAVE').length,
                staff.filter(s => s.status === 'PROSPECTIVE').length,
                staff.filter(s => s.status !== 'ACTIVE' && s.status !== 'ON_LEAVE' && s.status !== 'PROSPECTIVE').length,
            ],
            backgroundColor: ['#D0DD28', '#1d256d', '#6c757d', '#adb5bd'],
            borderWidth: 0,
        }]
    };

    // Recent Hires Monthly Trend (Mocked based on hire_date)
    const hiresByMonth = useMemo(() => {
        const counts: Record<string, number> = {};
        staff.forEach(emp => {
            const d = new Date(emp.hire_date);
            const key = d.toLocaleString('default', { month: 'short' });
            counts[key] = (counts[key] || 0) + 1;
        });
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
            labels: months,
            datasets: [{
                label: 'New Hires',
                data: months.map(m => counts[m] || 0),
                backgroundColor: '#1d256d',
                borderRadius: 4,
            }]
        };
    }, [staff]);

    const exportToCSV = () => {
        const headers = ["First Name", "Last Name", "Email", "Phone", "Department", "Position", "Contract", "Status", "Hire Date", "Qualification"];
        const csvRows = staff.map(emp => [
            emp.first_name,
            emp.last_name,
            emp.email,
            emp.phone,
            emp.department?.name,
            emp.position,
            emp.contract_type,
            emp.status,
            emp.hire_date,
            emp.qualification
        ].map(val => `"${val || ''}"`).join(','));

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `talentia_staff_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container-fluid py-4 min-vh-100 bg-light">
            {error && (
                <div className="alert alert-danger border-0 shadow-sm mb-4 d-flex align-items-center gap-3" style={{ borderRadius: '18px' }}>
                    <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                    <div>
                        <div className="fw-bold">Error</div>
                        <small className="opacity-75">{error}</small>
                    </div>
                </div>
            )}
            {/* Header 섹션 */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5 mt-2">
                <div>
                    <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Staff Directory</h2>
                    <p className="text-secondary mb-0">Manage and track your enterprise human resources</p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="btn btn-outline-dark border-2 px-4 shadow-sm fw-bold d-flex align-items-center gap-2"
                    >
                        <i className="bi bi-file-earmark-arrow-down"></i> Export
                    </button>
                    <Link href={companyId ? `/dashboard/hr/staff/add?company_id=${companyId}` : "/dashboard/hr/staff/add"} className="btn btn-primary px-4 shadow-sm fw-bold d-flex align-items-center gap-2" style={{ backgroundColor: '#1d256d' }}>
                        <i className="bi bi-person-plus-fill"></i> Add Staff
                    </Link>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Total Staff', value: stats.total, icon: 'bi-people', color: '#1d256d' },
                    { label: 'Active', value: stats.active, icon: 'bi-check-circle', color: '#19c37d' },
                    { label: 'On Leave', value: stats.onLeave, icon: 'bi-clock', color: '#ffc107' },
                    { label: 'Qualified', value: stats.qualified, icon: 'bi-mortarboard', color: '#D0DD28' },
                    { label: 'Prospective', value: stats.prospective, icon: 'bi-person-badge', color: '#6c757d' }
                ].map((stat, i) => (
                    <div className="col-6 col-md-4 col-lg" key={i}>
                        <div className="card border-0 shadow-sm h-100 p-3" style={{ borderRadius: '18px' }}>
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-3 rounded-4 d-flex align-items-center justify-content-center" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                    <i className={`bi ${stat.icon} fs-4`}></i>
                                </div>
                                <div>
                                    <small className="text-secondary fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>{stat.label}</small>
                                    <h3 className="fw-bolder mb-0 text-dark">{stat.value}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts & Birthdays Row */}
            <div className="row g-3 g-md-4 mb-5">
                <div className="col-12 col-md-6 col-xl-4">
                    <div className="card border-0 shadow-sm h-100 p-4" style={{ borderRadius: '24px' }}>
                        <h5 className="fw-bold mb-4">Employee Distribution</h5>
                        <div style={{ height: '240px' }} className="d-flex justify-content-center">
                            <Doughnut data={distributionData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100 p-4" style={{ borderRadius: '24px' }}>
                        <h5 className="fw-bold mb-4">Recent Hire Trend</h5>
                        <div style={{ height: '240px' }}>
                            <Bar data={hiresByMonth} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} />
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100 p-4" style={{ borderRadius: '24px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold mb-0">Upcoming Birthdays</h5>
                            <i className="bi bi-gift-fill text-danger"></i>
                        </div>
                        <div className="overflow-auto custom-scrollbar" style={{ maxHeight: '240px' }}>
                            {upcomingBirthdays.length === 0 ? (
                                <p className="text-center text-muted py-4">No birthdays this month.</p>
                            ) : upcomingBirthdays.map((emp, i) => (
                                <div key={i} className="d-flex align-items-center justify-content-between py-2 border-bottom border-light last-border-none">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-primary bg-opacity-10 text-primary small fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                            {emp.first_name[0]}{emp.last_name[0]}
                                        </div>
                                        <div>
                                            <div className="fw-bold small text-dark">{emp.first_name} {emp.last_name}</div>
                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>{emp.position}</small>
                                        </div>
                                    </div>
                                    <div className="badge bg-light text-primary border rounded-pill small">
                                        {new Date(emp.date_of_birth).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Employee Table */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '24px' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 mb-4">
                    <h5 className="fw-bold mb-0">Employees Directory</h5>
                    <div className="position-relative" style={{ width: '100%', maxWidth: '350px' }}>
                        <i className="bi bi-search position-absolute text-muted" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)' }}></i>
                        <input
                            type="text"
                            className="form-control border-0 ps-5 bg-light py-2 shadow-none"
                            style={{ borderRadius: '12px' }}
                            placeholder="Search by name, position, or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle border-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0 px-4 py-3 text-secondary small fw-bold text-uppercase">Staff Member</th>
                                <th className="border-0 py-3 text-secondary small fw-bold text-uppercase">Role / Position</th>
                                <th className="border-0 py-3 text-secondary small fw-bold text-uppercase">Phone / Contact</th>
                                <th className="border-0 py-3 text-secondary small fw-bold text-uppercase">Qualification</th>
                                <th className="border-0 py-3 text-center text-secondary small fw-bold text-uppercase">Status</th>
                                <th className="border-0 py-3 text-end px-4 text-secondary small fw-bold text-uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></td></tr>
                            ) : filteredStaff.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-muted py-5 fw-medium">No results found for "{searchTerm}"</td></tr>
                            ) : filteredStaff.map((emp) => (
                                <tr key={emp.id} className="transition-all hover-bg-light">
                                    <td className="px-4 py-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center rounded-circle fw-bold shadow-sm" style={{ width: 44, height: 44, border: '2px solid white' }}>
                                                {emp.first_name[0]}{emp.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark">{emp.first_name} {emp.last_name}</div>
                                                <small className="text-muted">{emp.email}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <div className="fw-bold text-dark">{emp.position}</div>
                                        <small className="text-primary fw-medium">{emp.department?.name}</small>
                                    </td>
                                    <td className="py-3 text-muted small fw-medium">{emp.phone || "N/A"}</td>
                                    <td className="py-3">
                                        <span className="badge bg-white text-dark border shadow-none px-2 py-1 small fw-medium">{emp.qualification || "Not Listed"}</span>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={`badge px-3 py-2 rounded-pill font-monospace small ${emp.status === 'ACTIVE' ? 'bg-success bg-opacity-10 text-success' :
                                            emp.status === 'ON_LEAVE' ? 'bg-warning bg-opacity-10 text-warning' :
                                                emp.status === 'PROSPECTIVE' ? 'bg-info bg-opacity-10 text-info' : 'bg-danger bg-opacity-10 text-danger'
                                            }`}>
                                            ● {emp.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-end px-4">
                                        <Link href={companyId ? `/dashboard/hr/staff/${emp.id}?company_id=${companyId}` : `/dashboard/hr/staff/${emp.id}`} className="btn btn-light btn-sm rounded-3 me-1 px-2 border-0" title="View/Edit Profile">
                                            <i className="bi bi-pencil-square"></i>
                                        </Link>
                                        <button onClick={() => handleDelete(emp.id)} className="btn btn-light btn-sm rounded-3 px-2 border-0 text-danger" title="Delete Profile"><i className="bi bi-trash"></i></button>
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
