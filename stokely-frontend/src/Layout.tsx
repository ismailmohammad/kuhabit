import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { api } from "./api/api";
import Header from "./components/Header";
import { clearUserInfo, setUserInfo } from "./redux/userSlice";

export default function Layout() {
    const dispatch = useDispatch();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const me = await api.auth.me();
                if (!cancelled) dispatch(setUserInfo(me));
            } catch {
                if (!cancelled) dispatch(clearUserInfo());
            }
        })();
        return () => { cancelled = true; };
    }, [dispatch]);

    return (
        <>
            <Header />
            <Outlet />
        </>
    );
}
