import { AdminProvider } from './context/AdminContext'
import { LanguageProvider } from './i18n/LanguageContext'
import { AdminLoginPage } from './routes/AdminLoginPage'
import { CreatePage } from './routes/CreatePage'
import { LicensorAdminPage } from './routes/LicensorAdminPage'
import { ResultPage } from './routes/ResultPage'
import { VerifyPage } from './routes/VerifyPage'

function CurrentRoute() {
  const { pathname } = window.location

  if (pathname.startsWith('/admin/licensor')) {
    return <LicensorAdminPage />
  }

  if (pathname.startsWith('/admin/login')) {
    return <AdminLoginPage />
  }

  if (pathname.startsWith('/result/')) {
    const certificateId = decodeURIComponent(pathname.replace('/result/', ''))
    return <ResultPage certificateId={certificateId} />
  }

  if (pathname.startsWith('/verify/')) {
    const certificateId = decodeURIComponent(pathname.replace('/verify/', ''))
    return <VerifyPage certificateId={certificateId} />
  }

  return <CreatePage />
}

function App() {
  return (
    <LanguageProvider>
      <AdminProvider>
        <CurrentRoute />
      </AdminProvider>
    </LanguageProvider>
  )
}

export default App
