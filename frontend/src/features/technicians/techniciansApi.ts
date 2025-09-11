import { baseApi } from '@/store/api/baseApi'

export interface Technician {
  id: number
  name: string
  surname: string
  email: string
  phone?: string
  permissions: string[]
  is_active: boolean
  created_at?: string
  updated_at?: string
  actions?: any
}

export const techniciansApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listTechnicians: b.query<{ success: boolean; data: Technician[] }, void>({
      query: () => ({ url: `/technicians` }),
      providesTags: [{ type: 'Technicians', id: 'LIST' }],
    }),
    createTechnician: b.mutation<{ success: boolean; data: Technician }, { name: string; surname: string; email: string; phone?: string; password: string; eSignaturePin?: string; permissions?: string[] }>({
      query: (body) => ({ url: `/technicians`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Technicians', id: 'LIST' }],
    }),
    updateTechnician: b.mutation<{ success: boolean; data: Technician }, { id: number; body: Partial<Technician> & { eSignaturePin?: string } }>({
      query: ({ id, body }) => ({ url: `/technicians/${id}`, method: 'PUT', body }),
      invalidatesTags: [{ type: 'Technicians', id: 'LIST' }],
    }),
    updatePermissions: b.mutation<{ success: boolean; data: Technician }, { id: number; permissions: string[] }>({
      query: ({ id, permissions }) => ({ url: `/technicians/${id}/permissions`, method: 'PUT', body: { permissions } }),
      invalidatesTags: [{ type: 'Technicians', id: 'LIST' }],
    }),
    updatePassword: b.mutation<{ success: boolean; message: string }, { id: number; newPassword: string }>({
      query: ({ id, newPassword }) => ({ url: `/technicians/${id}/password`, method: 'PUT', body: { newPassword } }),
    }),
    deleteTechnician: b.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({ url: `/technicians/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Technicians', id: 'LIST' }],
    }),
  }),
})

export const { useListTechniciansQuery, useCreateTechnicianMutation, useUpdateTechnicianMutation, useUpdatePermissionsMutation, useUpdatePasswordMutation, useDeleteTechnicianMutation } = techniciansApi

