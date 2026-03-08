import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserInfo } from '../types/habit';

interface UserState {
    userInfo: UserInfo | null;
}

const initialState: UserState = {
    userInfo: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserInfo(state, action: PayloadAction<UserInfo>) {
            state.userInfo = action.payload;
        },
        clearUserInfo(state) {
            state.userInfo = null;
        },
    },
});

export const { setUserInfo, clearUserInfo } = userSlice.actions;
export default userSlice.reducer;
