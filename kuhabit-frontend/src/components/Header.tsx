import styled from "styled-components";
import LogoImage from '../assets/cube-logo-white.png';
import { Link } from "react-router-dom";

const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: white;
`;

const AppHeader = styled.header`
    display: flex;
    background: #363333;
    width: 100vw;
    justify-content: space-between;
    align-items: center;
`;

const LogoContainer = styled.div`
    display: flex;
    align-items: center;
`;

const Logo = styled.img`
    max-width: 3em;
    padding: 1em;
    animation: logo-jiggle infinite 2s linear;
`;

const LinkItem = styled.a`
    border-radius: 5px;
    color: white;
    font-size: 1.5em;
    padding: 0.1em;
    margin: 0.1em;
    text-align: center;
    cursor: pointer;
    &:hover {
        color: white;
        transform: scale(1.05);
    }
`;



const UserActions = styled.div`
    display: flex;
    padding: 20px;
`;

const UserLink = styled(LinkItem)`
    border-radius: 15px;
    padding: 10px;
    margin: 10px;
    background: #413c3c;
    &:hover {
        color: lightgray;
        transform: scale(1.05);
        filter: drop-shadow(0 0 2em #293e44aa);
        transition: all 0.3s ease-in-out;
    }
    transition: ease-in-out;
`

const GetStartedLink = styled(UserLink)`
    background: #2dca8e;
    color: black;
    &:hover {
        color: #2e2a2a;
    }
`;

interface HeaderProps {
    staticHeader: boolean
}

const Header = (headerProps: HeaderProps) => {
    return (
        <AppHeader>
            <Link to="/">
                <LogoContainer>
                    <Logo alt="KuHabit Logo" src={LogoImage}></Logo>
                    <Title>KuHabit</Title>
                </LogoContainer>
            </Link>
            {!headerProps.staticHeader ? 
            <UserActions>
                <Link to={"/login"}><UserLink>Log in</UserLink></Link>
                <Link to={"/register"}><GetStartedLink>Get Started</GetStartedLink></Link>
            </UserActions>
            : null}
        </AppHeader>
    );
}

export default Header;