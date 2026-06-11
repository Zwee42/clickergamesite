import type { AppProps } from 'next/app';
import { GameProvider } from '../lib/gameContext';
import '../style.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GameProvider>
      <Component {...pageProps} />
    </GameProvider>
  );
}
