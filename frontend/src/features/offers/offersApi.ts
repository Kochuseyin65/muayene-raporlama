import { baseApi } from '@/store/api/baseApi'

export interface OfferItem {
  equipmentId: number
  equipmentName?: string
  quantity: number
  unitPrice: number
}

export interface Offer {
  id: number
  offer_number: string
  customer_company_id: number
  customer_name: string
  customer_email?: string
  items: OfferItem[]
  notes?: string
  total_amount: number
  status: 'pending' | 'approved' | 'sent' | 'viewed' | 'rejected'
  tracking_token?: string
  created_at?: string
  updated_at?: string
  created_by?: number
  created_by_name?: string
  created_by_surname?: string
  approved_by?: number
  approved_by_name?: string
  approved_by_surname?: string
}

export const offersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listOffers: b.query<{ success: boolean; data: { offers: Offer[]; pagination: any } }, { page: number; limit: number; status?: string; search?: string; customerCompanyId?: number }>({
      query: (params) => ({ url: '/offers', params }),
      providesTags: [{ type: 'Offers', id: 'LIST' }],
    }),
    getOffer: b.query<{ success: boolean; data: Offer }, number>({
      query: (id) => ({ url: `/offers/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Offers', id }],
    }),
    createOffer: b.mutation<{ success: boolean; data: Offer }, { customerCompanyId: number; items: OfferItem[]; notes?: string }>({
      query: (body) => ({ url: '/offers', method: 'POST', body }),
      invalidatesTags: [{ type: 'Offers', id: 'LIST' }],
    }),
    updateOffer: b.mutation<{ success: boolean; data: Offer }, { id: number; body: { customerCompanyId: number; items: OfferItem[]; notes?: string } }>({
      query: ({ id, body }) => ({ url: `/offers/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Offers', id }, { type: 'Offers', id: 'LIST' }],
    }),
    deleteOffer: b.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({ url: `/offers/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Offers', id: 'LIST' }],
    }),
    approveOffer: b.mutation<{ success: boolean; data: Offer }, number>({
      query: (id) => ({ url: `/offers/${id}/approve`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Offers', id }, { type: 'Offers', id: 'LIST' }],
    }),
    sendOffer: b.mutation<{ success: boolean; data: Offer }, number>({
      query: (id) => ({ url: `/offers/${id}/send`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Offers', id }, { type: 'Offers', id: 'LIST' }],
    }),
    convertToWorkOrder: b.mutation<{ success: boolean; data: any; message?: string }, { id: number; scheduledDate?: string; notes?: string }>({
      query: ({ id, ...body }) => ({ url: `/offers/${id}/convert-to-work-order`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Offers', id: 'LIST' }, { type: 'WorkOrders', id: 'LIST' }],
    }),
  }),
})

export const { useListOffersQuery, useLazyListOffersQuery, useGetOfferQuery, useCreateOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation, useApproveOfferMutation, useSendOfferMutation, useConvertToWorkOrderMutation } = offersApi

