import styled from "styled-components";
import LogoImage from '../assets/header-logo.png';
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearUserInfo } from "../redux/userSlice";
import { api } from "../api/api";
import toast from "react-hot-toast";
import type { RootState } from "../redux/store";

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
    &:hover {
        background: #3a3a3a;
        border-color: #666;
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

const UserLabel = styled.span`
    color: #aaa;
    font-size: 0.85rem;
    @media (max-width: 480px) {
        display: none;
    }
`;

const Header = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userInfo = useSelector((state: RootState) => state.user.userInfo);

    const handleLogout = async () => {
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
                        <UserLabel>@{userInfo.username}</UserLabel>
                        <Link to="/dashboard"><NavBtn>Dashboard</NavBtn></Link>
                        <NavBtn onClick={handleLogout}>Log out</NavBtn>
                    </>
                ) : (
                    <>
                        <Link to="/login"><NavBtn>Sign In</NavBtn></Link>
                        <Link to="/register"><PrimaryBtn>Get Started</PrimaryBtn></Link>
                    </>
                )}
            </NavActions>
        </AppHeader>
    );
};

export default Header;
