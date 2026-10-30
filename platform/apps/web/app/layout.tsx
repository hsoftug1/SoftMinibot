import type { ReactNode } from 'react';
import './style.css';
export const metadata = { title:'SoftMinibot | Hifi Tech Solutions', description:'Manage your WhatsApp automation securely.' };
export default function RootLayout({children}:{children:ReactNode}) {
  return <html lang="en"><body><header className="top"><a href="/" className="brand">◉ Soft<span>Minibot</span></a><nav><a href="/">Home</a><a href="/dashboard">Dashboard</a><a href="/login">Sign in</a></nav></header><main>{children}</main><footer>© Hifi Tech Solutions · SoftMinibot</footer></body></html>;
}
