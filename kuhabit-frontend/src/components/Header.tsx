import styled from "styled-components";
import LogoImage from '../assets/cube-logo.png';

const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: white;
`;

const Button = styled.button`

`;

const AppHeader = styled.header`
    display: flex;
    padding: 1%;
    top: 0;
    position: fixed;
    background: #6B7280;
    width: 100vw;
    align-content: space-between;
    align-items: center;
`;

const Logo = styled.img`
    max-width: 3em;
    padding: 1em;
`

const Link = styled.a`
    background: red;
`;

const LinkContainer = styled.div`
    display: flex;
    align-items: center;
    align-content: center;
`


const Header = () =>  {
    return(
        <AppHeader>
            <>
            <Logo alt="KuHabit Logo" src={LogoImage}></Logo>
            <Title>KuHabit</Title>
            </>
            <LinkContainer>
                <Link>Home</Link>
            </LinkContainer>
        </AppHeader>
    );
}

export default Header;