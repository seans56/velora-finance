import { supabase } from '../lib/supabase'

export default function Login() {
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/dashboard'
      }
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#1a1a2e',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid #2a2a3e',
        width: '320px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#ffd700', fontSize: '24px', marginBottom: '8px' }}>
          Velora Finance
        </h1>
        <p style={{ color: '#9e9e9e', fontSize: '13px', marginBottom: '32px' }}>
          Personal Wealth Tracker
        </p>
        <button
          onClick={loginWithGoogle}
          style={{
            width: '100%',
            background: '#1565c0',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Login dengan Google
        </button>
      </div>
    </div>
  )
}