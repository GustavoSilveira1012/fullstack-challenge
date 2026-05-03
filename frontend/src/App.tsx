import { useTheme } from '@hooks/useTheme';

function App() {
  useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <h1 className="text-3xl font-bold text-center pt-10">Crash Game Frontend</h1>
      <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
        Project setup complete. Routes will be added in subsequent tasks.
      </p>
    </div>
  );
}

export default App;
