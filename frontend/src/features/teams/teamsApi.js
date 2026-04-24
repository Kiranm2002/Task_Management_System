import { apiSlice } from "../../api/apiSlice";

export const teamsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTeams: builder.query({
      query: () => "/teams/all-teams", 
      providesTags: ["Team"],
    }),

    getAllUsers: builder.query({
      query: () => "/users", 
      providesTags: ["User"],
    }),

    createTeam: builder.mutation({
      query: (body) => ({ 
        url: "/teams", 
        method: "POST", 
        body 
      }),
      invalidatesTags: ["Team"],
    }),

    updateTeam: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/teams/${id}`,
        method: "PATCH", 
        body,
      }),
      invalidatesTags: ["Team"],
    }),

    deleteTeam: builder.mutation({
      query: (id) => ({
        url: `/teams/${id}`,
        method: "DELETE", 
      }),
      invalidatesTags: ["Team"],
    }),

  }),
});

export const {
  useGetTeamsQuery,
  useGetAllUsersQuery, 
  useCreateTeamMutation,
  useUpdateTeamMutation, 
  useDeleteTeamMutation, 
  useGetProjectsByTeamQuery,
  useCreateProjectMutation,
} = teamsApi;