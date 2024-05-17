import styled from "styled-components";
import LogoImage from '../assets/cube-logo.png';

const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: white;
`;

const AppHeader = styled.header`
    display: flex;
    background: #6B7280;
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
`

const Link = styled.a`
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

const LinkContainer = styled.div`
    display: flex;
    align-items: center;
    align-content: center;
`

const UserActions = styled.div`
    display: flex;
    padding: 20px;
`;

const UserLink = styled(Link)`
    border-radius: 15px;
    padding: 10px;
    margin: 10px;
    background: #413c3c;
    &:hover {
        color: lightgray;
        transform: scale(1.05);
        filter: drop-shadow(0 0 2em #61dafbaa);
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

const Header = () =>  {
    return(
        <AppHeader>
            <LogoContainer>
                <Logo alt="KuHabit Logo" src={LogoImage}></Logo>
                <Title>KuHabit</Title>
            </LogoContainer> 
            <UserActions>
                <UserLink>Log in</UserLink>
                <GetStartedLink>Get Started</GetStartedLink>
            </UserActions>
        </AppHeader>
    );
}

export default Header;