import { useState } from 'react'
import { Layout } from '../components/Layout'
import { useAdmin } from '../context/AdminContext'

export function AdminLoginPage() {
  const admin = useAdmin()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('l243736590')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  function submit() {
    const result = mode === 'login' ? admin.login(username, password) : admin.register(username, password)
    setMessage(result.message)
    if (result.ok) {
      admin.setEditMode(true)
      window.setTimeout(() => {
        window.location.href = '/'
      }, 500)
    }
  }

  if (admin.isAuthenticated) {
    return (
      <Layout compact>
        <section className="auth-panel">
          <p className="eyebrow">Admin Console</p>
          <h1>已登录管理员账号</h1>
          <p>当前账号：{admin.currentUser}</p>
          <div className="button-row">
            <a className="primary-button" href="/">
              返回首页编辑
            </a>
            <button type="button" onClick={() => admin.setEditMode(!admin.editMode)}>
              {admin.editMode ? '关闭编辑模式' : '开启编辑模式'}
            </button>
            <button type="button" onClick={admin.logout}>
              退出登录
            </button>
          </div>
        </section>
      </Layout>
    )
  }

  return (
    <Layout compact>
      <section className="auth-panel">
        <p className="eyebrow">Admin Login</p>
        <h1>管理员登录</h1>
        <p>LOGO 连点 9 下进入这里。登录后才能开启网页编辑、添加图片和调整图层。</p>
        <p className="auth-demo-credential">演示账号：l243736590 / lvzeyu-19930412</p>

        <div className="auth-tabs" role="group" aria-label="登录或注册">
          <button className={mode === 'login' ? 'is-active' : ''} type="button" onClick={() => setMode('login')}>
            登录
          </button>
          <button className={mode === 'register' ? 'is-active' : ''} type="button" onClick={() => setMode('register')}>
            注册
          </button>
        </div>

        <label>
          管理员账号
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="l243736590" />
        </label>
        <label>
          密码
          <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} placeholder="默认 lvzeyu-19930412" />
        </label>
        <button className="primary-button" type="button" onClick={submit}>
          {mode === 'login' ? '登录并开启编辑' : '注册并开启编辑'}
        </button>
        {message && <p className="auth-message">{message}</p>}
      </section>
    </Layout>
  )
}
