import styled from "styled-components";

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
`;

const Logo = styled.img`
 max-width: 10%;
`

const Link = styled.a`
`;

type Links = {
    
}

const Header = () =>  {
    return(
        <AppHeader>
            <Logo alt="KuHabit Logo"></Logo>
            <Title>KuHabit</Title>
            <div className="header-links-container"></div>
        </AppHeader>
    );
}

export default Header;