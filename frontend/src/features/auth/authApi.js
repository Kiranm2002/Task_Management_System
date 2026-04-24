import { apiSlice } from "../../api/apiSlice";
import { setCredentials } from "./authSlice"

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: { ...credentials },
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: { ...userData },
      }),
    }),
    verifyEmail: builder.query({
      query: (token) => ({
        url: `/auth/verify-email/${token}`,
        method: "GET",
      }),
    }),
    verifyOTP: builder.mutation({
      query: (otpData) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: { ...otpData },
      }),
    }),
    refresh: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({...data}));
        } catch (err) {
          console.error("Token refresh failed:", err);
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
    forgotPassword: builder.mutation({
    query: (email) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: { email },
    }),
    }),
    resetPassword: builder.mutation({
    query: ({ token, password }) => ({
        url: `/auth/reset-password/${token}`,
        method: 'PATCH',
        body: { password },
    }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOTPMutation,
  useRefreshMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailQuery
} = authApi;