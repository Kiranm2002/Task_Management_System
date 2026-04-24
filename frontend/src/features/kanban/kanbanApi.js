import { apiSlice } from "../../api/apiSlice";

export const kanbanApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query({
      query: () => '/projects',
      providesTags: ['Project'],
    }),
    getBoard: builder.query({
      query: (projectId) => `/projects/${projectId}/board`,
      providesTags: (result, error, projectId) => {
        const tags = [
          { type: 'Board', id: projectId },
          { type: 'Task', id: 'LIST' }
        ];
        if (result && result.tasks) {
          Object.keys(result.tasks).forEach((taskId) => {
            tags.push({ type: 'Task', id: taskId });
          });
        }

        return tags;
      }
      
    }),
    updateTaskStatus: builder.mutation({
      query: ({ taskId, status }) => ({
        url: `/tasks/${taskId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Task', 'Board'],
    }),
  }),
});

export const { useGetProjectsQuery, useGetBoardQuery, useUpdateTaskStatusMutation } = kanbanApi;