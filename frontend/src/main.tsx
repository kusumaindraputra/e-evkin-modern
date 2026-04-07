import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd';
import idID from 'antd/locale/id_ID';
import { evkinTheme, evkinThemeDark } from './theme';
import { useTheme } from './hooks/useTheme';
import App from './App'
import './index.css'

function Root() {
  const { isDark, algorithm } = useTheme();
  const themeConfig = isDark ? evkinThemeDark : evkinTheme;

  return (
    <ConfigProvider
      locale={idID}
      theme={{ ...themeConfig, algorithm }}
    >
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
