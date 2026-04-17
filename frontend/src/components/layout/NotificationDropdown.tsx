"use client";
import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await axios.get(`${API_BASE_URL}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: any) => !n.is_read).length);
        } catch (err: any) {
            if (err.response && err.response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
            } else {
                console.error("Failed to fetch notifications", err);
            }
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: number) => {
        const token = localStorage.getItem("token");
        try {
            await axios.patch(`${API_BASE_URL}`, { is_read: true }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const markAllRead = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.post(`${API_BASE_URL}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error("Failed to mark all read", err);
        }
    };

    return (
        <div className="position-relative" ref={dropdownRef}>
            <div 
                className="cursor-pointer d-none d-sm-block position-relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <i className={`bi ${unreadCount > 0 ? 'bi-bell-fill text-primary' : 'bi-bell text-secondary'} fs-5`}></i>
                {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-dark border border-white" style={{ backgroundColor: '#D0DD28', fontSize: '0.6rem' }}>
                        {unreadCount}
                    </span>
                )}
            </div>

            {isOpen && (
                <div className="position-absolute end-0 mt-2 bg-white shadow-lg rounded-4 border-0 overflow-hidden z-3" style={{ width: '320px', maxHeight: '450px' }}>
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                        <h6 className="fw-bold mb-0">Notifications</h6>
                        {unreadCount > 0 && (
                            <button 
                                className="btn btn-link btn-sm text-decoration-none p-0 fw-bold small" 
                                style={{ color: '#1d256d' }}
                                onClick={markAllRead}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="overflow-auto" style={{ maxHeight: '380px' }}>
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-muted">
                                <i className="bi bi-bell-slash fs-2 d-block mb-2 opacity-25"></i>
                                <small>No notifications yet</small>
                            </div>
                        ) : (
                            <div className="list-group list-group-flush">
                                {notifications.map((n) => (
                                    <div 
                                        key={n.id} 
                                        className={`list-group-item list-group-item-action border-0 px-3 py-3 ${!n.is_read ? 'bg-light bg-opacity-50' : ''}`}
                                        style={{ borderLeft: !n.is_read ? '4px solid #D0DD28' : '4px solid transparent' }}
                                    >
                                        <div className="d-flex justify-content-between mb-1">
                                            <h6 className={`small mb-0 ${!n.is_read ? 'fw-bold' : 'fw-medium'}`}>{n.title}</h6>
                                            <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </small>
                                        </div>
                                        <p className="small text-secondary mb-2" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                                            {n.message}
                                        </p>
                                        <div className="d-flex align-items-center gap-3">
                                            {n.link && (
                                                <Link 
                                                    href={n.link} 
                                                    className="btn btn-sm btn-link p-0 text-decoration-none fw-bold"
                                                    style={{ fontSize: '0.7rem' }}
                                                    onClick={() => {
                                                        markAsRead(n.id);
                                                        setIsOpen(false);
                                                    }}
                                                >
                                                    View Details
                                                </Link>
                                            )}
                                            {!n.is_read && (
                                                <button 
                                                    className="btn btn-sm btn-link p-0 text-decoration-none text-muted"
                                                    style={{ fontSize: '0.7rem' }}
                                                    onClick={() => markAsRead(n.id)}
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
