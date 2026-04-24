import { apiSlice } from "../../api/apiSlice";

export const taskApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: () => '/tasks',
      providesTags: ['Task'],
    }),
    getTaskById: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),
    createTask: builder.mutation({
      query: (body) => ({ 
        url: '/tasks', 
        method: 'POST', 
        body 
      }),
      invalidatesTags: ['Task'],
    }),
    getUserKanbanTasks: builder.query({
      query: () => '/tasks/my-tasks',
      transformResponse: (response) => response.data,
      providesTags: ['Task'],
    }),
    getUpcomingTasks: builder.query({
      query: () => '/tasks/my-tasks?limit=5',
      transformResponse: (response) => response.data,
      providesTags: ['Task'],
    }),
    updateTask: builder.mutation({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body : data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Task', id },'Task'],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
    // generateTaskDetails: builder.mutation({
    //   query: (title) => ({
    //     url: "/ai/generate-task-details",
    //     method: "POST",
    //     body: { title },
    //   }),
    // }),
    uploadAttachment: builder.mutation({
      query: ({ taskId, formData }) => ({
        url: `/tasks/${taskId}/attachments`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
    addComment: builder.mutation({
      query: (commentData) => ({
        url: '/collaboration/comments',
        method: 'POST',
        body: commentData,
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Task', id: taskId }, 'Task'],
    }),
    getAllUsers: builder.query({
      query: () => '/users',
      transformResponse: (response) => response.data || response,
      providesTags: ['User'],
    }),
  }),
});

export const { 
  useGetTasksQuery, 
  useGetTaskByIdQuery, 
  useCreateTaskMutation, 
  useGetUserKanbanTasksQuery,
  useGetUpcomingTasksQuery,
  useUpdateTaskMutation, 
  useDeleteTaskMutation, 
  useGenerateTaskDetailsMutation,
  useUploadAttachmentMutation,
  useAddCommentMutation,
  useGetAllUsersQuery 
} = taskApi;