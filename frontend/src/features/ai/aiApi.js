import { apiSlice } from "../../api/apiSlice";

export const aiApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    askAssistant: builder.mutation({
      query: (message) => ({
        url: "/ai/chat",
        method: "POST",
        body: { message },
      }),
    }),
    generateTaskDetails: builder.mutation({
      query: (data) => ({
        url: "/ai/generate-task",
        method: "POST",
        body: data,
      }),
    }),
    getSmartSearch: builder.query({
      query: (query) => `/ai/search?q=${query}`,
    }),
    recommendUser: builder.mutation({
      query: (data) => ({
        url: "/ai/recommend",
        method: "POST",
        body: data, 
      }),
    }),
  }),
});

export const { 
  useAskAssistantMutation, 
  useGenerateTaskDetailsMutation,
  useGetSmartSearchQuery, 
  useLazyGetSmartSearchQuery,
  useRecommendUserMutation 
} = aiApi;