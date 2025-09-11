import { baseApi } from '@/store/api/baseApi'

export interface Equipment {
  id: number
  name: string
  type: string
  template: any
  is_active: boolean
  created_at?: string
  updated_at?: string
  actions?: any
}

export const equipmentApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listEquipment: b.query<{ success: boolean; data: { equipment: Equipment[]; pagination: any } }, { page: number; limit: number; search?: string; type?: string }>({
      query: ({ page, limit, search, type }) => ({ url: `/equipment`, params: { page, limit, search, type } }),
      providesTags: [{ type: 'Equipment', id: 'LIST' }],
    }),
    getEquipmentTypes: b.query<{ success: boolean; data: string[] }, void>({
      query: () => ({ url: `/equipment/types` }),
    }),
    createEquipment: b.mutation<{ success: boolean; data: Equipment }, { name: string; type: string; template: any }>({
      query: (body) => ({ url: `/equipment`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Equipment', id: 'LIST' }],
    }),
    updateEquipment: b.mutation<{ success: boolean; data: Equipment }, { id: number; body: Partial<Equipment> }>({
      query: ({ id, body }) => ({ url: `/equipment/${id}`, method: 'PUT', body }),
      invalidatesTags: [{ type: 'Equipment', id: 'LIST' }],
    }),
    updateTemplate: b.mutation<{ success: boolean; data: Equipment }, { id: number; template: any }>({
      query: ({ id, template }) => ({ url: `/equipment/${id}/template`, method: 'PUT', body: { template } }),
      invalidatesTags: [{ type: 'Equipment', id: 'LIST' }],
    }),
    deleteEquipment: b.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({ url: `/equipment/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Equipment', id: 'LIST' }],
    }),
  }),
})

export const { useListEquipmentQuery, useGetEquipmentTypesQuery, useCreateEquipmentMutation, useUpdateEquipmentMutation, useUpdateTemplateMutation, useDeleteEquipmentMutation } = equipmentApi

