import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { ClerkProvider } from '@clerk/clerk-react'
import { enUS } from '@clerk/localizations'

// Deep copy and override the specific Clerk error string the user experienced
const customLocale = JSON.parse(JSON.stringify(enUS))
const traverseAndReplace = (obj: any, target: string, replacement: string) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string' && obj[key].includes(target)) {
      obj[key] = replacement
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      traverseAndReplace(obj[key], target, replacement)
    }
  }
}
traverseAndReplace(customLocale, "The External Account was not found.", "No account found, sign up first!")

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey} localization={customLocale}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
