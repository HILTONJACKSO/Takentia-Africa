"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { Bar, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend, ArcElement
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function CompanyDashboardPage() {
    const { companyId } = useParams();
    const [company, setCompany] = useState<any>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const fetchData = async () => {
            try {
                const resComp = await axios.get("http://localhost:8001/api/v1/companies/", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const currentComp = resComp.data.find((c: any) => c.id === parseInt(companyId as string));
                setCompany(currentComp);

                const resEmp = await axios.get(`http://localhost:8001/api/v1/hr/employees?company_id=${companyId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEmployees(resEmp.data);

                const resPayroll = await axios.get(`http://localhost:8001/api/v1/payroll/runs?company_id=${companyId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPayrollRuns(resPayroll.data);
            } catch (err) {
                console.error("Error fetching company data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [companyId]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center h-100 py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!company) {
        return <div className="p-4 text-center">Company not found.</div>;
    }

    const isOrange = company.name.toLowerCase().includes("orange");
    const isFinch = company.name.toLowerCase().includes("finch");

    const brandColor = isOrange ? "#FF7900" : (isFinch ? "#065F46" : "#1d256d");
    const secondaryBrandColor = isOrange ? "#CC6100" : (isFinch ? "#064E3B" : "#D0DD28");

    const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
    const otherCount = employees.length - activeCount;

    const doughnutData = {
        labels: ["Active", "Other"],
        datasets: [{
            data: [activeCount, otherCount],
            backgroundColor: [brandColor, "#e9ecef"],
            borderWidth: 0,
        }]
    };

    const chartData = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May"],
        datasets: [
            {
                label: isOrange ? "Network Uptime (%)" : (isFinch ? "Logging Yield (m³)" : "Revenue"),
                data: isOrange ? [99.8, 99.9, 99.7, 99.8, 99.9] : (isFinch ? [450, 520, 480, 610, 590] : [100, 200, 150, 250, 300]),
                backgroundColor: brandColor,
                borderRadius: 4,
            }
        ]
    };

    return (
        <div className="p-4 min-vh-100" style={{ backgroundColor: '#F8F9FA' }}>
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <Link href="/dashboard" className="text-secondary text-decoration-none small mb-2 d-inline-block">
                        <i className="bi bi-arrow-left me-1"></i> Back to Talentia Africa
                    </Link>
                    <h2 className="fw-bolder text-dark mb-1">{company.name}</h2>
                    <p className="text-secondary mb-0">{company.description}</p>
                </div>
                <div>
                    <span className={`badge p-2 px-3 rounded-pill border`} style={{
                        backgroundColor: `${brandColor}15`,
                        color: brandColor,
                        borderColor: `${brandColor}30`
                    }}>
                        {isOrange ? "Telecom Operations" : (isFinch ? "Forestry Management" : "Active Management")}
                    </span>
                </div>
            </div>

            {/* Industry Specific Hero Stats */}
            <div className="row g-3 g-md-4 mb-4">
                <div className="col-6 col-md-3">
                    <div className="card h-100 p-4 border-0 shadow-sm bg-white" style={{ borderRadius: '15px' }}>
                        <p className="text-secondary mb-1 small fw-bold text-uppercase">Total Staff</p>
                        <h2 className="fw-bold text-dark mb-0">{employees.length}</h2>
                        <div className="mt-2 small text-success fw-medium">All active</div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card h-100 p-4 border-0 shadow-sm bg-white" style={{ borderRadius: '15px' }}>
                        <p className="text-secondary mb-1 small fw-bold text-uppercase">
                            {isOrange ? "Active Techs" : (isFinch ? "Heavy Fleet" : "Payroll Runs")}
                        </p>
                        <h2 className="fw-bold text-dark mb-0">
                            {isOrange ? "12" : (isFinch ? "8" : payrollRuns.length)}
                        </h2>
                        <div className="mt-2 small text-secondary">
                            {isOrange ? "Field Operations" : (isFinch ? "Maintenance OK" : "Last: Feb 28")}
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card h-100 p-4 border-0 shadow-sm bg-white" style={{ borderRadius: '15px' }}>
                        <p className="text-secondary mb-1 small fw-bold text-uppercase">
                            {isOrange ? "Uptime" : (isFinch ? "Yield" : "Efficiency")}
                        </p>
                        <h2 className="fw-bold mb-0" style={{ color: brandColor }}>
                            {isOrange ? "99.9%" : (isFinch ? "590 m³" : "94%")}
                        </h2>
                        <div className="mt-2 small text-secondary">Current Monthly</div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card h-100 p-4 border-0 shadow-sm text-white" style={{
                        borderRadius: '15px',
                        background: `linear-gradient(135deg, ${brandColor} 0%, ${secondaryBrandColor} 100%)`
                    }}>
                        <p className="mb-1 small fw-bold text-uppercase opacity-75">Quick Action</p>
                        <Link href={`/dashboard/hr/staff?company_id=${companyId}`} className="text-white text-decoration-none d-flex align-items-center justify-content-between mt-2">
                            <span className="fw-bold">Manage Unit</span>
                            <i className="bi bi-arrow-right-circle fs-4"></i>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-8">
                    <div className="card border-0 shadow-sm bg-white p-3 p-md-4 mb-4" style={{ borderRadius: '15px' }}>
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-2">
                            <h6 className="fw-bold mb-0">Operational Performance</h6>
                            <span className="small text-secondary">Last 5 Months</span>
                        </div>
                        <div style={{ height: '300px' }}>
                            <Bar
                                data={chartData}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { beginAtZero: isFinch } }
                                }}
                            />
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm bg-white p-3 p-md-4" style={{ borderRadius: '15px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h6 className="fw-bold mb-0">Key Staff Members</h6>
                            <Link href={`/dashboard/hr/staff?company_id=${companyId}`} className="small text-primary text-decoration-none">View All</Link>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-borderless align-middle mb-0">
                                <thead>
                                    <tr className="text-secondary small text-uppercase">
                                        <th className="ps-0">Member</th>
                                        <th>Position</th>
                                        <th className="text-end pe-0">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.slice(0, 5).map(emp => (
                                        <tr key={emp.id} className="border-bottom-faint">
                                            <td className="ps-0 py-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px', border: `1px solid ${brandColor}20` }}>
                                                        <span className="fw-bold small" style={{ color: brandColor }}>{emp.first_name[0]}{emp.last_name[0]}</span>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark mb-0">{emp.first_name} {emp.last_name}</div>
                                                        <div className="text-secondary small">{emp.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="small text-secondary">{emp.position}</td>
                                            <td className="text-end pe-0">
                                                <span className={`badge rounded-pill ${emp.status === 'ACTIVE' ? 'bg-success' : 'bg-warning'} bg-opacity-10 text-${emp.status === 'ACTIVE' ? 'success' : 'warning'}`}>
                                                    {emp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {employees.length === 0 && (
                                        <tr><td colSpan={3} className="text-center py-5 text-secondary">No staff members found for this company.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-4">
                    <div className="card border-0 shadow-sm bg-white p-3 p-md-4 mb-4" style={{ borderRadius: '15px' }}>
                        <h6 className="fw-bold mb-4">Company Profile</h6>
                        <div className="d-flex flex-column gap-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-3 rounded bg-light" style={{ color: brandColor }}>
                                    <i className={`bi ${isOrange ? 'bi-broadcast-pin' : (isFinch ? 'bi-truck' : 'bi-building')} fs-4`}></i>
                                </div>
                                <div>
                                    <div className="small text-secondary text-uppercase fw-bold ls-1">Sector</div>
                                    <div className="fw-bold text-dark">{isOrange ? "Telecommunications" : (isFinch ? "Forestry & Logging" : "Management")}</div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-3 rounded bg-light" style={{ color: brandColor }}>
                                    <i className="bi bi-geo-alt fs-4"></i>
                                </div>
                                <div>
                                    <div className="small text-secondary text-uppercase fw-bold ls-1">HQ Location</div>
                                    <div className="fw-bold text-dark">Monrovia, Liberia</div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-3 rounded bg-light" style={{ color: brandColor }}>
                                    <i className="bi bi-envelope fs-4"></i>
                                </div>
                                <div>
                                    <div className="small text-secondary text-uppercase fw-bold ls-1">Support</div>
                                    <div className="fw-bold text-dark small">contact@{company.name.toLowerCase().replace(/ /g, '')}.com</div>
                                </div>
                            </div>
                        </div>
                        <hr className="my-4 opacity-50" />
                        <button className="btn w-100 py-2 fw-bold" style={{ backgroundColor: brandColor, color: '#fff', borderRadius: '10px' }}>
                            Edit Company Info
                        </button>
                    </div>

                    <div className="card border-0 shadow-sm bg-white p-4 mb-4" style={{ borderRadius: '15px' }}>
                        <h6 className="fw-bold mb-4">Staff Composition</h6>
                        <div style={{ height: '180px' }} className="mb-3">
                            <Doughnut
                                data={doughnutData}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }
                                }}
                            />
                        </div>
                        <div className="text-center small text-secondary">
                            {activeCount} Active Members ({Math.round((activeCount / (employees.length || 1)) * 100)}%)
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm bg-white p-4" style={{ borderRadius: '15px' }}>
                        <h6 className="fw-bold mb-3">Recent Finance</h6>
                        <p className="small text-secondary mb-4">Summary of latest payroll activity for this unit.</p>
                        {payrollRuns.length > 0 ? (
                            <div className="d-flex flex-column gap-3">
                                {payrollRuns.slice(0, 3).map(run => (
                                    <div key={run.id} className="p-3 rounded bg-light border-start border-4" style={{ borderColor: brandColor }}>
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="fw-bold small">Run #{run.id}</span>
                                            <span className="badge bg-white text-dark small">${run.total_amount?.toLocaleString()}</span>
                                        </div>
                                        <div className="small text-secondary">{run.period_start} to {run.period_end}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-secondary small">
                                <i className="bi bi-receipt fs-1 opacity-25 d-block mb-2"></i>
                                No recent payroll runs.
                            </div>
                        )}
                        <Link href={`/dashboard/finance/payroll?company_id=${companyId}`} className="btn btn-outline-secondary w-100 mt-4 py-2 border-0 small fw-bold">
                            Review Finance History
                        </Link>
                    </div>

                    <div className="card border-0 shadow-sm bg-white p-4 mt-4" style={{ borderRadius: '15px' }}>
                        <h6 className="fw-bold mb-3 text-secondary" style={{ letterSpacing: '0.5px' }}>Entity Switcher</h6>
                        <p className="small text-secondary mb-4">Switch to another managed office.</p>
                        <div className="d-flex flex-column gap-2">
                            {isOrange ? (
                                <Link href="/dashboard/companies/3" className="btn btn-outline-success border-0 w-100 py-3 d-flex align-items-center justify-content-between px-3" style={{ backgroundColor: '#065F4610', borderRadius: '12px' }}>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#065F46' }}></div>
                                        <span className="fw-bold small text-dark">African Finch Logging</span>
                                    </div>
                                    <i className="bi bi-chevron-right text-secondary"></i>
                                </Link>
                            ) : isFinch ? (
                                <Link href="/dashboard/companies/2" className="btn btn-outline-warning border-0 w-100 py-3 d-flex align-items-center justify-content-between px-3" style={{ backgroundColor: '#FF790010', borderRadius: '12px' }}>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#FF7900' }}></div>
                                        <span className="fw-bold small text-dark">Orange Liberia</span>
                                    </div>
                                    <i className="bi bi-chevron-right text-secondary"></i>
                                </Link>
                            ) : null}
                            <Link href="/dashboard" className="btn btn-light w-100 py-2 border-0 small fw-bold mt-2" style={{ borderRadius: '10px', backgroundColor: '#F3F4F6' }}>
                                <i className="bi bi-house-door me-2"></i> Return to Talentia HQ
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
