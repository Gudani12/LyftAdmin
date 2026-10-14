import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import { DataProvider } from './context/DataContext.jsx'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const clerkFrontendApi = import.meta.env.VITE_CLERK_FRONTEND_API

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      frontendApi={clerkFrontendApi}
      navigate={(to) => window.history.pushState(null, '', to)}
    >
      <BrowserRouter>
        <DataProvider>
          <App />
        </DataProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
)
