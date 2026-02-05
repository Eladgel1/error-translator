
function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
      <div className="max-w-xl w-full px-4">
        <h1 className="text-3xl font-semibold mb-4 text-center">
          Error Translator
        </h1>
        <p className="text-slate-300 mb-6 text-center">
          Frontend bootstrap is ready. This placeholder screen will be replaced
          with the actual error analysis UI in the next steps.
        </p>
        <div className="border border-slate-700 rounded-xl p-4 text-sm text-slate-300">
          <p className="mb-2 font-medium">Next steps:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Connect to the backend /api/analyze endpoint.</li>
            <li>Add a form for pasting error messages.</li>
            <li>Render AI analysis and follow-up suggestions.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
