import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {
  readLoungeComposerDraftPendingWork,
  shouldShowLoungeColdBootSplash,
} from './utils/loungeColdBootSplash.js'

if (shouldShowLoungeColdBootSplash({ tab: 'home', pendingWork: readLoungeComposerDraftPendingWork() })) {
  void import('./features/lounge/SocialFeed.jsx')
  void import('@lottiefiles/dotlottie-web/dotlottie-player.wasm?url')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
