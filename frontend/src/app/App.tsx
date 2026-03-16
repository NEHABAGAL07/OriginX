import { RouterProvider } from 'react-router';
import { router } from './routes';
import { DarkModeProvider } from './components/DarkModeContext';
import { LanguageProvider } from './components/LanguageContext';

function App() {
  return (
    <DarkModeProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </DarkModeProvider>
  );
}

export default App;
