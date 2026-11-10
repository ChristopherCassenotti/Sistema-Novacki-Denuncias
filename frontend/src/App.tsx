import { AppRouter } from './routes/AppRouter';
import { NetworkStatusBanner } from './components/system/NetworkStatusBanner';

export default function App() {
  return (
    <>
      <NetworkStatusBanner />
      <AppRouter />
    </>
  );
}
