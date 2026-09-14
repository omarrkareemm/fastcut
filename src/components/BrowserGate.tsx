import { useEffect, useState, type ReactNode } from 'react';
import { probeCapabilities, type Capabilities } from '../hooks/useBrowserCapabilities';
export function BrowserGate({ children }: { children: ReactNode }) {
  const [caps, setCaps] = useState<Capabilities | null>(null);
  useEffect(() => { probeCapabilities().then(setCaps); }, []);
  if (!caps) return <div style={{ padding: 24 }}>Checking browser capabilities…</div>;
  if (!caps.supported) return <div style={{ padding: 24, fontFamily: 'system-ui' }}><h2>Unsupported Browser</h2><p>{caps.reason}</p></div>;
  return <>{children}</>;
}