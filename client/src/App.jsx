import { useState } from 'react'
import { useTheme } from './ThemeContext.jsx'
import './App.css'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import HotList from './components/HotList.jsx'
import TodoList from './components/TodoList.jsx'
import ToolBox from './components/ToolBox.jsx'

function App() {
  const [activePage, setActivePage] = useState('home')
  const { colors } = useTheme()

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HotList />
      case 'todo':
        return <TodoList />
      case 'tools':
        return <ToolBox />
      default:
        return <HotList />
    }
  }

  return (
    <div className="app-layout" style={{ background: colors.bg, color: colors.text }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="main-area">
        <Header />
        <div className="content-area">
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

export default App
