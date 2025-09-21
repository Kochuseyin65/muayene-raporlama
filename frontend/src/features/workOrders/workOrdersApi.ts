import { baseApi } from '@/store/api/baseApi'

export interface WorkOrder {
  id: number
  work_order_number: string
  customer_company_id: number
  customer_name: string
  status: 'not_started' | 'in_progress' | 'completed' | 'approved' | 'sent'
  scheduled_date?: string
  notes?: string
  offer_id?: number
  offer_number?: string
  inspection_count?: number
  completed_inspections?: number
  assignedTechnicians?: { id: number; name: string; surname: string; email: string }[]
  created_at?: string
}

const buildParams = (params: Record<string, any>) => {
  const result: Record<string, any> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (key === 'mine' && value) {
      result[key] = 'true'
    } else {
      result[key] = value
    }
  })
  return result
}

export const workOrdersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listWorkOrders: b.query<{ success: boolean; data: { workOrders: WorkOrder[]; pagination: any } }, { page: number; limit: number; status?: string; search?: string; customerCompanyId?: number; assignedTo?: number; mine?: boolean }>({
      query: (params) => ({ url: '/work-orders', params: buildParams(params) }),
      providesTags: [{ type: 'WorkOrders', id: 'LIST' }],
    }),
    getWorkOrder: b.query<{ success: boolean; data: WorkOrder }, number>({
      query: (id) => ({ url: `/work-orders/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'WorkOrders', id }],
    }),
    createWorkOrder: b.mutation<{ success: boolean; data: WorkOrder }, { customerCompanyId: number; assignedTechnicians?: number[]; scheduledDate?: string; equipmentIds?: number[]; notes?: string }>({
      query: (body) => ({ url: '/work-orders', method: 'POST', body }),
      invalidatesTags: [{ type: 'WorkOrders', id: 'LIST' }],
    }),
    updateWorkOrder: b.mutation<{ success: boolean; data: WorkOrder }, { id: number; body: { customerCompanyId?: number; scheduledDate?: string; notes?: string } }>({
      query: ({ id, body }) => ({ url: `/work-orders/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'WorkOrders', id }, { type: 'WorkOrders', id: 'LIST' }],
    }),
    assignTechnicians: b.mutation<{ success: boolean; data: WorkOrder }, { id: number; technicianIds: number[] }>({
      query: ({ id, technicianIds }) => ({ url: `/work-orders/${id}/assign`, method: 'PUT', body: { technicianIds } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'WorkOrders', id }, { type: 'WorkOrders', id: 'LIST' }],
    }),
    updateStatus: b.mutation<{ success: boolean; data: WorkOrder }, { id: number; status: WorkOrder['status'] }>({
      query: ({ id, status }) => ({ url: `/work-orders/${id}/status`, method: 'PUT', body: { status } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'WorkOrders', id }, { type: 'WorkOrders', id: 'LIST' }],
    }),
    deleteWorkOrder: b.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({ url: `/work-orders/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'WorkOrders', id: 'LIST' }],
    }),
  }),
})

export const { useListWorkOrdersQuery, useLazyListWorkOrdersQuery, useGetWorkOrderQuery, useCreateWorkOrderMutation, useUpdateWorkOrderMutation, useAssignTechniciansMutation, useUpdateStatusMutation, useDeleteWorkOrderMutation } = workOrdersApi

