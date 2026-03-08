import styled from "styled-components";

const FormButton = styled.button`
    margin: 1em;
    align-self: center;
    justify-self: center;
    padding: 1em;
    width: 100%;
    font-weight: bold;
    background-color: lightgreen;
    color: black;
    &:hover {
        transform: scale(1.02);
    }
    transition: all 0.2s ease-in-out;   
`;

export default FormButton;