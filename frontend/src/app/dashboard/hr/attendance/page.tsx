"use client";
import { API_BASE_URL } from "@/lib/api";
import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function AttendancePage() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get("company_id");

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<any[]>([]);
    const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, on_leave: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Manual Logging States
    const [showModal, setShowModal] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [logForm, setLogForm] = useState({
        employee_id: "",
        date: selectedDate,
        status: "PRESENT",
        notes: ""
    });
    
    const fetchEmployees = async () => {
        const token = localStorage.getItem("token");
        try {
            const url = companyId && companyId !== "null" ? `${API_BASE_URL}/hr/attendance` : `${API_BASE_URL}/hr/attendance`;
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            setEmployees(res.data);
        } catch(err) {
            console.error("Failed to fetch employees", err);
        }
    };
    
    useEffect(() => {
        fetchEmployees();
    }, [companyId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        try {
            const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
            const companyQuery = isCompanyIdValid ? `company_id=${companyId}` : "";
            const dateQuery = `date=${selectedDate}`;
            const fullQuery = [companyQuery, dateQuery].filter(Boolean).join("&");

            const [recordsRes, summaryRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/hr/attendance`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                isCompanyIdValid ? axios.get(`${API_BASE_URL}/hr/attendance`, {
                    headers: { Authorization: `Bearer ${token}` }
                }) : Promise.resolve({ data: null })
            ]);

            setRecords(recordsRes.data);
            if (summaryRes.data) {
                setSummary(summaryRes.data);
            } else {
                // Calculate summary manually if companyId is missing (e.g., global view)
                const recs = recordsRes.data;
                setSummary({
                    present: recs.filter((r: any) => r.status === "PRESENT").length,
                    absent: recs.filter((r: any) => r.status === "ABSENT").length,
                    late: recs.filter((r: any) => r.status === "LATE").length,
                    on_leave: recs.filter((r: any) => r.status === "ON_LEAVE").length,
                    total: recs.length
                });
            }
        } catch (err: any) {
            console.error("Error fetching attendance data:", err);
            let errorMessage = "Failed to load attendance data.";
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [companyId, selectedDate]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PRESENT': return <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill small">● Present</span>;
            case 'LATE': return <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-pill small">● Late Arrival</span>;
            case 'ABSENT': return <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill small">● Absent</span>;
            case 'ON_LEAVE': return <span className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill small">● On Leave</span>;
            default: return <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2 rounded-pill small">{status}</span>;
        }
    };

    const handleLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                ...logForm,
                employee_id: parseInt(logForm.employee_id),
                company_id: parseInt(companyId || "1"), // Fallback
                check_in: logForm.status === "PRESENT" || logForm.status === "LATE" 
                        ? new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                        : "",
                check_out: ""
            };
            
            await axios.post(`${API_BASE_URL}/hr/attendance`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            fetchData(); // Refresh table
            
            // Reset form
            setLogForm({ ...logForm, employee_id: "", status: "PRESENT", notes: "" });
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to log attendance");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClockOut = async (recordId: number) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_BASE_URL}/hr/attendance`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to clock out");
        }
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
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 mb-5">
                <div>
                    <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Attendance Management</h2>
                    <p className="text-secondary mb-0 small fw-medium">Track and monitor staff consistency and presence</p>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <button 
                         className="btn btn-primary d-flex align-items-center gap-2 fw-bold px-4 py-2 hover-scale shadow-sm text-white border-0"
                         style={{ backgroundColor: '#1d256d', borderRadius: '10px' }}
                         onClick={() => setShowModal(true)}
                    >
                         <i className="bi bi-clock-history"></i>
                         Log Attendance
                    </button>
                    <div className="bg-white p-2 rounded-3 shadow-sm d-flex align-items-center gap-2 border">
                        <i className="bi bi-calendar3 text-primary ms-2"></i>
                        <input
                            type="date"
                            className="form-control border-0 shadow-none fw-bold text-dark"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{ width: '160px' }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Total Logs', value: summary.total, icon: 'bi-people', color: '#1d256d' },
                    { label: 'Present', value: summary.present, icon: 'bi-check-circle', color: '#19c37d' },
                    { label: 'Late', value: summary.late, icon: 'bi-clock-history', color: '#ffc107' },
                    { label: 'Absentees', value: summary.absent, icon: 'bi-x-circle', color: '#dc3545' },
                    { label: 'On Leave', value: summary.on_leave, icon: 'bi-airplane', color: '#0dcaf0' }
                ].map((stat, i) => (
                    <div className="col-12 col-md-6 col-lg" key={stat.label}>
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

            {/* Main Content Table */}
            <div className="card border-0 shadow-sm p-4 overflow-hidden" style={{ borderRadius: '24px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                    <h5 className="fw-bold mb-0">Daily Logs: {new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</h5>
                    <button className="btn btn-light btn-sm fw-bold border-0 px-3 py-2 rounded-3" onClick={fetchData}>
                        <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle border-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0 px-4 py-3 text-secondary small fw-bold text-uppercase">Employee</th>
                                <th className="border-0 py-3 text-secondary small fw-bold text-uppercase">Check In</th>
                                <th className="border-0 py-3 text-secondary small fw-bold text-uppercase">Check Out</th>
                                <th className="border-0 py-3 text-secondary small fw-bold text-uppercase text-center">Status</th>
                                <th className="border-0 py-3 text-secondary small fw-bold text-uppercase">Notes</th>
                                <th className="border-0 py-3 text-end px-4 text-secondary small fw-bold text-uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-muted py-5 fw-medium">No records found for this date.</td></tr>
                            ) : records.map((rec) => (
                                <tr key={rec.id} className="transition-all hover-bg-light">
                                    <td className="px-4 py-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center rounded-circle fw-bold" style={{ width: 40, height: 40 }}>
                                                {rec.employee?.first_name?.[0]}{rec.employee?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark">{rec.employee?.first_name} {rec.employee?.last_name}</div>
                                                <small className="text-muted">{rec.employee?.position}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 fw-medium text-dark">{rec.check_in || "--:--"}</td>
                                    <td className="py-3 fw-medium text-dark">{rec.check_out || "--:--"}</td>
                                    <td className="py-3 text-center">
                                        {getStatusBadge(rec.status)}
                                    </td>
                                    <td className="py-3 text-secondary small">{rec.notes || "-"}</td>
                                    <td className="py-3 text-end px-4">
                                        {!rec.check_out && (rec.status === "PRESENT" || rec.status === "LATE") && (
                                            <button 
                                                onClick={() => handleClockOut(rec.id)}
                                                className="btn btn-warning btn-sm rounded-3 me-2 fw-bold text-dark border-0 hover-scale"
                                                title="Clock Out"
                                            >
                                                <i className="bi bi-box-arrow-right me-1"></i> Clock Out
                                            </button>
                                        )}
                                        <Link 
                                            href={companyId ? `/dashboard/hr/staff/${rec.employee_id}?company_id=${companyId}` : `/dashboard/hr/staff/${rec.employee_id}`}
                                            className="btn btn-light btn-sm rounded-3 border-0 hover-scale"
                                            title="View Staff Profile"
                                        >
                                            <i className="bi bi-person-badge"></i>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log Attendance Modal */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-light p-4 pb-3">
                                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-clock-history text-primary me-2"></i> Log Manual Attendance</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleLogSubmit}>
                                <div className="modal-body p-4 pt-2">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-secondary">Employee</label>
                                            <select 
                                                className="form-select border-light bg-light py-2 shadow-none" 
                                                required 
                                                value={logForm.employee_id} 
                                                onChange={e => setLogForm({...logForm, employee_id: e.target.value})}
                                            >
                                                <option value="">Select Employee...</option>
                                                {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.position})</option>)}
                                            </select>
                                        </div>
                                        
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-secondary">Status</label>
                                            <select 
                                                className="form-select border-light bg-light py-2 shadow-none" 
                                                value={logForm.status} 
                                                onChange={e => setLogForm({...logForm, status: e.target.value})}
                                            >
                                                <option value="PRESENT">Present</option>
                                                <option value="LATE">Late Arrival</option>
                                                <option value="ABSENT">Absent</option>
                                                <option value="ON_LEAVE">On Leave</option>
                                            </select>
                                        </div>

                                        <div className="col-12 mt-2">
                                            <div className="alert alert-info py-2 small mb-0 d-flex align-items-center gap-2 border-0 bg-opacity-10">
                                                <i className="bi bi-info-circle-fill"></i>
                                                Check-in time will be captured dynamically via the system clock on submission.
                                            </div>
                                        </div>

                                        <div className="col-12 mt-2">
                                            <label className="form-label small fw-bold text-secondary">Notes (Optional)</label>
                                            <input 
                                                type="text" 
                                                className="form-control border-light bg-light shadow-none py-2" 
                                                placeholder="Traffic delay, Doctor's appointment..."
                                                value={logForm.notes} 
                                                onChange={e => setLogForm({...logForm, notes: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-light p-4 pt-0">
                                    <button type="button" className="btn btn-light fw-bold px-4" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" disabled={submitting} className="btn btn-primary fw-bold px-4 text-white hover-scale" style={{ backgroundColor: '#1d256d', border: 'none' }}>
                                        {submitting ? <span className="spinner-border spinner-border-sm"></span> : "Save Record"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .transition-all { transition: all 0.2s ease; }
                .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            `}</style>
        </div>
    );
}
