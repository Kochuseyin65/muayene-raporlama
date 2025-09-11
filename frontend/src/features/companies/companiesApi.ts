import { baseApi } from '@/store/api/baseApi'

export interface CompanyProfile {
  id: number
  name: string
  tax_number?: string
  logo_url?: string
}

export const companiesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMyCompanyProfile: b.query<{ success: boolean; data: CompanyProfile }, void>({
      query: () => ({ url: '/companies/profile' }),
    }),
  }),
})

export const { useGetMyCompanyProfileQuery, useLazyGetMyCompanyProfileQuery } = companiesApi

