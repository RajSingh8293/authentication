import { createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";

const initialState = {
  user: null,
  loading: false,
  error: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setLoading, setUser, setError } = userSlice.actions;

export default userSlice.reducer;

export const getUserProfile = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axiosInstance.get(`/api/users/profile`);
    if (data?.success) {
      dispatch(setUser(data?.user));
    }
  } catch (error) {
    console.log("Error :", error);
  } finally {
    dispatch(setLoading(false));
  }
};
export const logoutUser = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axiosInstance.post("/api/users/logout");
    data;
    if (data.success) {
      dispatch(setUser(null));
      toast.success(data.message || "Logout successfully");
    }
  } catch (error) {
    console.log("Error :", error);
  } finally {
    dispatch(setLoading(false));
  }
};
