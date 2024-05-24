import { useRouteError } from "react-router-dom";
import styled from "styled-components";

const ErrorDiv = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    color: black;
`;

export default function ErrorPage() {
  const error: any = useRouteError();
  console.error(error);

  return (
    <ErrorDiv id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.status} {error.statusText || error.message}</i>
      </p>
    </ErrorDiv>
  );
}