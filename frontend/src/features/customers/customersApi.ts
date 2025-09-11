import { baseApi } from '@/store/api/baseApi'

export interface CustomerCompany {
  id: number
  name: string
  tax_number?: string
  address?: string
  contact?: string
  email: string
  authorized_person?: string
  created_at?: string
  updated_at?: string
  actions?: any
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCustomers: b.query<{ success: boolean; data: { customers: CustomerCompany[]; pagination: any } }, { page: number; limit: number; search?: string }>({
      query: ({ page, limit, search }) => ({ url: `/customer-companies`, params: { page, limit, search } }),
      providesTags: (res) => [{ type: 'Customers', id: 'LIST' }],
    }),
    getCustomer: b.query<{ success: boolean; data: CustomerCompany }, number>({
      query: (id) => ({ url: `/customer-companies/${id}` }),
      providesTags: (_res, _e, id) => [{ type: 'Customers', id }],
    }),
    createCustomer: b.mutation<{ success: boolean; data: CustomerCompany }, Partial<CustomerCompany> & { taxNumber?: string; authorizedPerson?: string }>({
      query: (body) => ({ url: `/customer-companies`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Customers', id: 'LIST' }],
    }),
    updateCustomer: b.mutation<{ success: boolean; data: CustomerCompany }, { id: number; body: any }>({
      query: ({ id, body }) => ({ url: `/customer-companies/${id}`, method: 'PUT', body }),
      invalidatesTags: (_res, _e, { id }) => [{ type: 'Customers', id }, { type: 'Customers', id: 'LIST' }],
    }),
    deleteCustomer: b.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({ url: `/customer-companies/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Customers', id: 'LIST' }],
    }),
  }),
})

export const {
  useListCustomersQuery,
  useLazyListCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi

