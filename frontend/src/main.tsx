import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd';
import idID from 'antd/locale/id_ID';
import { evkinTheme } from './theme';
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={idID} theme={evkinTheme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
