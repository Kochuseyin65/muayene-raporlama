import { baseApi } from '@/store/api/baseApi'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  data: {
    token: string
    user: any
  }
}

interface ProfileResponse {
  success: boolean
  data: any
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    profile: builder.query<ProfileResponse, void>({
      query: () => ({ url: '/auth/profile', method: 'GET' }),
    }),
  }),
})

export const { useLoginMutation, useProfileQuery, useLazyProfileQuery } = authApi
