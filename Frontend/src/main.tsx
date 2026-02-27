import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { ThemeProvider } from './components/ThemeProvider'
import { SpeedInsights } from "@vercel/speed-insights/next"

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');


createRoot(rootElement).render(
    <Provider store={store}>
        <ThemeProvider defaultTheme="system" storageKey="spidergo-theme">
            <BrowserRouter>
                <App />
                <SpeedInsights />
            </BrowserRouter>
        </ThemeProvider>
    </Provider>
)
