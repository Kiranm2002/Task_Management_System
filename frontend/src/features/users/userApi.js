import { apiSlice } from "../../api/apiSlice";

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => '/users', 
      providesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'PATCH', 
        body: { isActive: false },
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { 
  useGetUsersQuery, 
  useUpdateUserMutation, 
  useDeleteUserMutation 
} = userApi;