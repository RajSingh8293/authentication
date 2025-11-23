import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./slices/useSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
  },
});
