import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header({ currentUser }) {
    const navigate = useNavigate();
    const isAdmin = currentUser?.role === 'admin';
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/login';
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="header">
            <nav className="nav-container">
                <Link to={isAdmin ? "/admin" : "/"} className="nav-logo">
                    Ludo Contest
                </Link>
                
                <button 
                    className="menu-toggle" 
                    onClick={toggleMenu}
                    aria-expanded={isMenuOpen}
                >
                    <span className="hamburger"></span>
                </button>

                <div className={`nav-right ${isMenuOpen ? 'show' : ''}`}>
                    {isAdmin ? (
                        // Admin Navigation
                        <>
                            <Link to="/admin" className="nav-link" onClick={toggleMenu}>Dashboard</Link>
                            <Link to="/admin/games" className="nav-link" onClick={toggleMenu}>Games</Link>
                            <Link to="/admin/transactions" className="nav-link" onClick={toggleMenu}>Transactions</Link>
                            <Link to="/admin/disputes" className="nav-link" onClick={toggleMenu}>Disputes</Link>
                            <button onClick={handleLogout} className="logout-btn">Logout</button>
                        </>
                    ) : (
                        // User Navigation
                        <>
                            <Link to="/" className="nav-link" onClick={toggleMenu}>Home</Link>
                            <Link to="/wallet" className="nav-link" onClick={toggleMenu}>Wallet</Link>
                            <Link to="/game-history" className="nav-link" onClick={toggleMenu}>History</Link>
                            <button onClick={handleLogout} className="logout-btn">Logout</button>
                        </>
                    )}
                </div>
            </nav>

            <style>{`
                .header {
                    background: #1a1a1a;
                    padding: 10px 0;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }

                .nav-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 15px;
                    position: relative;
                }

                .nav-logo {
                    color: #fff;
                    text-decoration: none;
                    font-size: 1.2rem;
                    font-weight: bold;
                }

                .menu-toggle {
                    display: none;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 10px;
                    margin-left: auto;
                }

                .hamburger {
                    display: block;
                    width: 24px;
                    height: 2px;
                    background: white;
                    position: relative;
                    transition: background 0.2s;
                }

                .hamburger::before,
                .hamburger::after {
                    content: '';
                    position: absolute;
                    width: 24px;
                    height: 2px;
                    background: white;
                    transition: transform 0.2s;
                }

                .hamburger::before {
                    top: -6px;
                }

                .hamburger::after {
                    bottom: -6px;
                }

                .nav-right {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .nav-link {
                    color: #fff;
                    text-decoration: none;
                    font-size: 0.9rem;
                    padding: 5px 10px;
                    border-radius: 4px;
                }

                .nav-link:hover {
                    background: rgba(255,255,255,0.1);
                }

                .logout-btn {
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 5px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9rem;
                }

                .logout-btn:hover {
                    background: #c82333;
                }

                @media (max-width: 768px) {
                    .menu-toggle {
                        display: block;
                        position: absolute;
                        right: 15px;
                        top: 50%;
                        transform: translateY(-50%);
                    }

                    .nav-right {
                        display: none;
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: #1a1a1a;
                        flex-direction: column;
                        padding: 10px;
                        gap: 10px;
                    }

                    .nav-right.show {
                        display: flex;
                    }

                    .nav-link {
                        width: 100%;
                        text-align: center;
                        padding: 10px;
                    }

                    .logout-btn {
                        width: 100%;
                        padding: 10px;
                    }

                    /* Animate hamburger to X when menu is open */
                    .menu-toggle[aria-expanded="true"] .hamburger {
                        background: transparent;
                    }

                    .menu-toggle[aria-expanded="true"] .hamburger::before {
                        transform: rotate(45deg);
                        top: 0;
                    }

                    .menu-toggle[aria-expanded="true"] .hamburger::after {
                        transform: rotate(-45deg);
                        bottom: 0;
                    }
                }
            `}</style>
        </header>
    );
}

export default Header;
