"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSidebar } from '@/context/SidebarContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { closeSidebar } = useSidebar();
    const [activeCompany, setActiveCompany] = useState<any>(null);
    const [allCompanies, setAllCompanies] = useState<any[]>([]);

    const pathMatch = pathname.match(/\/dashboard\/companies\/(\d+)/);
    const [idState, setIdState] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const searchId = params.get("company_id");
        const detectedId = pathMatch ? pathMatch[1] : searchId;
        setIdState(detectedId);
    }, [pathname]);

    const companyId = idState;

    useEffect(() => {
        if (companyId) {
            const token = localStorage.getItem("token");
            axios.get(`http://localhost:8001/api/v1/companies/`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setAllCompanies(res.data);
                const comp = res.data.find((c: any) => c.id === parseInt(companyId));
                if (comp) setActiveCompany(comp);
            }).catch(err => console.error("Error fetching company for sidebar:", err));
        } else {
            setActiveCompany(null);
            // Even if no active company id in path, we might want all companies for the switcher
            const token = localStorage.getItem("token");
            if (token) {
                axios.get(`http://localhost:8001/api/v1/companies/`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).then(res => setAllCompanies(res.data))
                    .catch(() => { });
            }
        }
    }, [companyId]);

    const sections = [
        {
            title: 'OVERVIEW',
            links: [
                { name: 'Dashboard', href: '/dashboard', icon: 'bi-grid' },
            ]
        },
        {
            title: 'HR MANAGEMENT',
            links: [
                { name: 'Staff Management', href: '/dashboard/hr/staff', icon: 'bi-people' },
                { name: 'Payroll', href: '/dashboard/finance/payroll', icon: 'bi-currency-dollar' },
                { name: 'Attendance', href: '/dashboard/hr/attendance', icon: 'bi-clock' },
                { name: 'Performance', href: '/dashboard/hr/performance', icon: 'bi-graph-up-arrow' },
            ]
        },
        {
            title: 'OFFICE OPERATIONS',
            links: [
                { name: 'Petty Cash', href: '/dashboard/operations/petty-cash', icon: 'bi-wallet2' },
                { name: 'Cash Movement', href: '/dashboard/operations/cash-movement', icon: 'bi-arrow-left-right' },
                { name: 'Payment Requests', href: '/dashboard/operations/payment-requests', icon: 'bi-file-earmark-text' },
                { name: 'Revenues', href: '/dashboard/operations/revenues', icon: 'bi-graph-up' },
                { name: 'Expenses', href: '/dashboard/operations/expenses', icon: 'bi-cart3' },
                { name: 'Assets', href: '/dashboard/operations/assets', icon: 'bi-box-seam' },
                { name: 'Maintenance', href: '/dashboard/operations/maintenance', icon: 'bi-tools' },
            ]
        },
        {
            title: 'SYSTEM',
            links: [
                { name: 'Reports', href: '/dashboard/reports', icon: 'bi-bar-chart' },
                { name: 'Settings', href: '/dashboard/settings', icon: 'bi-gear' },
            ]
        }
    ];

    const getLinkHref = (baseHref: string) => {
        if (!companyId || baseHref === '#') return baseHref;
        if (baseHref === '/dashboard') return `/dashboard/companies/${companyId}`;
        return `${baseHref}?company_id=${companyId}`;
    };

    const displayTitle = activeCompany ? activeCompany.name : "Talentia Africa";
    const displaySubtitle = activeCompany ? "Managed Company" : "Monrovia, Liberia";
    const logoLetter = activeCompany ? activeCompany.name.charAt(0) : "T";
    const logoColor = activeCompany ?
        (activeCompany.name.includes("Orange") ? "#FF7900" : "#065F46") :
        "#D0DD28";

    return (
        <aside className="sidebar h-100 d-flex flex-column fs-6 overflow-auto custom-scrollbar border-end border-white border-opacity-10 shadow-lg">
            <div className="py-4 px-3 flex-grow-1">
                <div className="d-flex align-items-center mb-4 px-2 gap-3">
                    {activeCompany ? (
                        <div className="text-white fw-bold rounded d-flex align-items-center justify-content-center flex-shrink-0 animate-fade-in"
                            style={{ width: '40px', height: '40px', fontSize: '1.2rem', backgroundColor: logoColor }}>
                            {logoLetter}
                        </div>
                    ) : (
                        <div className="bg-white rounded p-1 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '45px', height: '45px' }}>
                            <img src="/logo.png" alt="Talentia Logo" className="img-fluid" style={{ maxHeight: '100%' }} />
                        </div>
                    )}
                    <div className="overflow-hidden">
                        <h5 className="text-white fw-bold mb-0 text-truncate" style={{ fontSize: '1.25rem' }}>{displayTitle}</h5>
                        <small className="fw-medium text-truncate d-block" style={{ color: logoColor, fontSize: '0.85rem' }}>{displaySubtitle}</small>
                    </div>
                </div>

                {/* Company Switcher */}
                <div className="mb-4 px-2">
                    <div className="dropdown w-100">
                        <button className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-between px-3 py-2 border-opacity-25"
                            type="button" data-bs-toggle="dropdown"
                            style={{ borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                            <span className="fw-bold text-truncate me-2">
                                <i className="bi bi-arrow-left-right me-2"></i>
                                Switch Entity
                            </span>
                            <i className="bi bi-chevron-down small"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-dark shadow-lg w-100 border-0 mt-2 p-2" style={{ borderRadius: '12px', minWidth: '220px', backgroundColor: '#1e293b' }}>
                            <li><h6 className="dropdown-header small text-uppercase opacity-50 px-3">Main Office</h6></li>
                            <li>
                                <Link href="/dashboard" onClick={closeSidebar} className={`dropdown-item py-2 rounded-3 d-flex align-items-center gap-2 ${!companyId ? 'active bg-primary' : ''}`}>
                                    <i className="bi bi-building"></i> Talentia Africa
                                </Link>
                            </li>
                            <li><hr className="dropdown-divider opacity-10 mx-2" /></li>
                            <li><h6 className="dropdown-header small text-uppercase opacity-50 px-3">Subsidiaries</h6></li>
                            {allCompanies.filter(c => c.id !== 1).map(c => (
                                <li key={c.id}>
                                    <Link href={`/dashboard/companies/${c.id}`} onClick={closeSidebar} className={`dropdown-item py-2 rounded-3 d-flex align-items-center gap-2 ${companyId === String(c.id) ? 'active bg-primary' : ''}`}>
                                        <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: c.name.includes('Orange') ? '#FF7900' : '#065F46' }}></div>
                                        {c.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <nav className="mb-auto">
                    {sections.map((section, idx) => (
                        <div key={idx} className="mb-4">
                            <div className="text-uppercase fw-bold mb-3 px-3" style={{ letterSpacing: '1px', color: '#D0DD28', fontSize: '0.75rem', opacity: 0.8 }}>{section.title}</div>
                            <ul className="nav flex-column gap-1">
                                {section.links.map((link) => {
                                    const href = getLinkHref(link.href);
                                    const isActive = pathname === link.href || (link.href !== '/dashboard' && link.href !== '#' && pathname.startsWith(link.href));
                                    return (
                                        <li className="nav-item" key={link.name}>
                                            <Link
                                                href={href}
                                                onClick={closeSidebar}
                                                className={`nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all ${isActive ? 'fw-bold' : 'text-white text-opacity-75'}`}
                                                style={isActive ? { backgroundColor: '#D0DD28', color: '#1d256d' } : {}}
                                            >
                                                <i className={`bi ${link.icon} ${isActive ? 'fs-5' : 'fs-5'}`}></i>
                                                <span style={{ fontSize: '1.05rem' }}>{link.name}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </div>

            <div className="mt-auto pt-3 px-3 pb-4">
                <hr className="text-white-50 mt-1 mb-4 opacity-10" />
                <div className="d-flex align-items-center justify-content-between px-2">
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-dark fw-bold rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: '40px', height: '40px', backgroundColor: '#D0DD28' }}>
                            AD
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-white fw-bold text-truncate" style={{ fontSize: '1.05rem' }}>Admin User</div>
                            <small className="fw-medium d-block text-truncate" style={{ fontSize: '0.8rem', color: '#D0DD28' }}>admin@talentia.africa</small>
                        </div>
                    </div>
                    <button
                        className="btn btn-link p-0 text-white opacity-50 hover-opacity-100"
                        style={{ border: 'none', background: 'transparent' }}
                        onClick={() => {
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        }}
                        title="Secure Logout"
                    >
                        <i className="bi bi-box-arrow-right fs-5"></i>
                    </button>
                </div>
            </div>
        </aside>
    );
}

