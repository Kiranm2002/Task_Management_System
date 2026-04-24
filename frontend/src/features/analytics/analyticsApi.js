import { apiSlice } from "../../api/apiSlice";

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query({
      query: () => "/analytics/admin/dashboard",
      providesTags: ["Analytics"],
    }),
    
    getDeepAnalytics: builder.query({
      query: () => "/analytics/admin/deep",
      providesTags: ["Analytics"],
    }),

    getTeamPerformance: builder.query({
      query: () => "/analytics/admin/teams",
      providesTags: ["Teams", "Tasks"],
    }),

    getUserStats: builder.query({
      query: () => "/analytics/user/dashboard",
      providesTags: ["Tasks"],
    }),
  }),
});

export const { 
  useGetAdminStatsQuery, 
  useGetDeepAnalyticsQuery, 
  useGetTeamPerformanceQuery,
  useGetUserStatsQuery 
} = analyticsApi;