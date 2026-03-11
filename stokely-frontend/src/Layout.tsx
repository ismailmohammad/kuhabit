import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { api } from "./api/api";
import Header from "./components/Header";
import { clearUserInfo, setUserInfo } from "./redux/userSlice";
import { syncPushSubscriptionOnDevice } from "./utils/pushNotifications";

export default function Layout() {
    const dispatch = useDispatch();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const me = await api.auth.me();
                if (!cancelled) dispatch(setUserInfo(me));
                try {
                    await syncPushSubscriptionOnDevice();
                } catch {
                    // Ignore push sync errors on bootstrap.
                }
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
