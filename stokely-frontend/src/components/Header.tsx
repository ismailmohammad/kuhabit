import styled from "styled-components";
import LogoImage from '../assets/header-logo.png';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearUserInfo } from "../redux/userSlice";
import { api } from "../api/api";
import toast from "react-hot-toast";
import type { RootState } from "../redux/store";
import { useState, useEffect, useRef } from "react";
import SettingsModal from "./SettingsModal";

const AppHeader = styled.header`
    display: flex;
    background: linear-gradient(
    180deg,
    #1f1f1f,
    #1a1a1a
);
    width: 100%;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    box-sizing: border-box;
    border-bottom: 1px solid #333;
    position: sticky;
    top: 0;
    z-index: 100;
`;

const LogoContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: transform 0.2s ease;
    min-width: 0;
    flex-shrink: 1;

    &:hover {
        transform: translateY(-1px);
    }
`;

const Logo = styled.img`
    width: 2.5rem;
    height: 2.5rem;
    margin: 0.5rem 0;
    object-fit: contain;
    flex-shrink: 0;
    transition: transform 0.25s ease, filter 0.25s ease;
     filter:
            drop-shadow(0 0 8px rgba(45, 202, 142, 0.35))
            drop-shadow(0 0 12px rgba(255, 120, 40, 0.22));
    &:hover {
        transform: translateY(-1px) scale(1.03);
       
    }
`;

const Title = styled.span`
    font-size: 1.25rem;
    font-weight: 800;

    background: linear-gradient(
        90deg,
        #2dca8e,
        #42e676,
        #ffab66
    );

    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`;

const NavActions = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    min-width: 0;
    flex-shrink: 0;
`;

const NavBtn = styled.button`
    background: #2a2a2a;
    color: white;
    border: 1px solid #444;
    border-radius: 8px;
    padding: 0.4rem 0.9rem;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    &:hover {
        background: #3a3a3a;
        border-color: #666;
    }

    @media (max-width: 480px) {
        padding: 0.4rem 0.65rem;
        font-size: 0.82rem;
    }
`;

const PrimaryBtn = styled(NavBtn)`
    background: #2dca8e;
    color: #111;
    border-color: #2dca8e;
    font-weight: 600;

    &:hover {
        background: #25b07b;
        border-color: #25b07b;
        box-shadow: 0 0 10px rgba(45,202,142,0.35);
    }
`;

const DropdownWrap = styled.div`
    position: relative;
`;

const DropdownMenu = styled.div`
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: #1e1e1e;
    border: 1px solid #333;
    border-radius: 8px;
    min-width: 140px;
    z-index: 300;
    overflow: hidden;
`;

const DropdownItem = styled.button`
    display: block;
    width: 100%;
    background: none;
    border: none;
    color: white;
    text-align: left;
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    cursor: pointer;
    &:hover { background: #2a2a2a; }
    &:not(:last-child) { border-bottom: 1px solid #2a2a2a; }
`;

const Header = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const onDashboardRoute = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        setDropdownOpen(false);
        try {
            await api.auth.logout();
        } catch {
            // ignore
        }
        dispatch(clearUserInfo());
        toast.success("Logged out");
        navigate("/");
    };

    return (
        <>
            <AppHeader>
                <Link to="/" style={{ textDecoration: "none" }}>
                    <LogoContainer>
                        <Logo alt="Stokely Logo" src={LogoImage} />
                        <Title>Stokely</Title>
                    </LogoContainer>
                </Link>

                <NavActions>
                    {userInfo ? (
                        <>
                            {!onDashboardRoute && (
                                <Link to="/dashboard"><NavBtn>Dashboard</NavBtn></Link>
                            )}
                            <DropdownWrap ref={dropdownRef}>
                                <NavBtn onClick={() => setDropdownOpen(p => !p)}>
                                    @{userInfo.username} ▾
                                </NavBtn>
                                {dropdownOpen && (
                                    <DropdownMenu>
                                        <DropdownItem onClick={() => { setSettingsOpen(true); setDropdownOpen(false); }}>
                                            Settings
                                        </DropdownItem>
                                        <DropdownItem onClick={handleLogout}>Log out</DropdownItem>
                                    </DropdownMenu>
                                )}
                            </DropdownWrap>
                        </>
                    ) : (
                        <>
                            <Link to="/login"><NavBtn>Sign In</NavBtn></Link>
                            <Link to="/register"><PrimaryBtn>Get Started</PrimaryBtn></Link>
                        </>
                    )}
                </NavActions>
            </AppHeader>

            {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
        </>
    );
};

export default Header;
