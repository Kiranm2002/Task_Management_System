import { apiSlice } from "../../api/apiSlice";

export const attachmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addAttachment: builder.mutation({
      query: ({ taskId, fileData }) => ({
        url: `/tasks/${taskId}/attachments`,
        method: 'POST',
        body: fileData, 
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
    deleteAttachment: builder.mutation({
      query: ({ taskId, attachmentId }) => ({
        url: `/tasks/${taskId}/attachments/${attachmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
  }),
});

export const { useAddAttachmentMutation, useDeleteAttachmentMutation } = attachmentApi;