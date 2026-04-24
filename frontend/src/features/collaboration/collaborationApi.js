import { apiSlice } from "../../api/apiSlice";

export const collaborationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTaskActivity: builder.query({
      query: (taskId) => `/tasks/${taskId}/activity`,
      providesTags: (result, error, taskId) => [{ type: 'Activity', id: taskId }],
    }),
    addComment: builder.mutation({
      query: ({ taskId, text, mentions }) => ({
        url: `/tasks/${taskId}/comments`,
        method: 'POST',
        body: { text, mentions },
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Activity', id: taskId }],
    }),
  }),
});

export const { useGetTaskActivityQuery, useAddCommentMutation } = collaborationApi;