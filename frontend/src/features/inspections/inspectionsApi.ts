import { baseApi } from '@/store/api/baseApi'

export interface Inspection {
  id: number
  work_order_id: number
  work_order_number: string
  customer_name: string
  equipment_id: number
  equipment_name: string
  equipment_type: string
  technician_id: number
  technician_name: string
  technician_surname: string
  inspection_date?: string
  start_time?: string
  end_time?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'approved'
  report_id?: number
  is_signed?: boolean
  qr_token?: string
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

export const inspectionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listInspections: b.query<{ success: boolean; data: { inspections: Inspection[]; pagination: any } }, { page: number; limit: number; workOrderId?: number; technicianId?: number; status?: string; dateFrom?: string; dateTo?: string; equipmentType?: string; mine?: boolean }>({
      query: (params) => ({ url: '/inspections', params: buildParams(params) }),
      providesTags: [{ type: 'Inspections', id: 'LIST' }],
    }),
    getInspection: b.query<{ success: boolean; data: any }, number>({
      query: (id) => ({ url: `/inspections/${id}` }),
      providesTags: (_r,_e,id) => [{ type: 'Inspections', id }],
    }),
  }),
})

export const { useListInspectionsQuery, useLazyListInspectionsQuery, useGetInspectionQuery } = inspectionsApi

