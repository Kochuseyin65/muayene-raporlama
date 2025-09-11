import { createSlice } from '@reduxjs/toolkit'

interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  sidebarCollapsed: boolean
}

const initialState: UIState = {
  theme: (typeof window !== 'undefined' && (localStorage.getItem('theme') as 'light' | 'dark')) || 'light',
  sidebarOpen: false,
  sidebarCollapsed: typeof window !== 'undefined' ? localStorage.getItem('sidebarCollapsed') === 'true' : false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme)
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarCollapsed', String(state.sidebarCollapsed))
      }
    },
    setSidebarOpen: (state, { payload }: { payload: boolean }) => {
      state.sidebarOpen = payload
    },
  },
})

export const { toggleTheme, toggleSidebar, toggleSidebarCollapsed, setSidebarOpen } = uiSlice.actions
export default uiSlice.reducer
