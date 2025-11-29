import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App';
import { Provider } from 'react-redux'
import { store } from '@/redux/store';
import './styles/tailwind.css';  // <--- import Tailwind CSS

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi'; // Import ngôn ngữ tiếng Việt

dayjs.extend(relativeTime); // Kích hoạt plugin relativeTime
dayjs.locale('vi');         // Set ngôn ngữ mặc định là tiếng Việt


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
