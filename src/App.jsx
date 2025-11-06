import React, { useEffect, useState } from 'react'
import { Terminal } from 'lucide-react'
import Editor from './Editor';
import ThemeToggle from './ThemeToggle.jsx';

const PISTON_BASE = 'https://emkc.org/api/v2/piston'
export default function App() {
  const [runtimes, setRuntimes] = useState([])
  const [language, setLanguage] = useState('javascript')
  const [version, setVersion] = useState('')
  const [code, setCode] = useState("console.log('hello from piston')")
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // fetch runtimes once
    fetch(`${PISTON_BASE}/runtimes`)
      .then((r) => r.json())
      .then((data) => {
        setRuntimes(data.filter(d => d.language === 'javascript' || d.language === 'php'))
        // pick a default version if available
        const first = data.find((r) => r.language === 'javascript' || r.language === 'php')
        if (first) {
          setLanguage(first.language)
          setVersion(first.version)
        }
      })
      .catch((err) => setError(err.message))
  }, [])


  useEffect(() => {
    // when language changes, pick a matching version
    const found = runtimes.find((r) => r.language === language)
    if (found) setVersion(found.version)
  }, [language, runtimes])


  async function runCode() {
    setLoading(true)
    setOutput('')
    setError(null)


    const payload = {
      language: language,
      version: version || undefined,
      files: [
        {
          name: language === 'php' ? 'main.php' : 'main.js',
          content: code,
        },
      ],
      stdin: '',
      args: [],
    }


    try {
      const res = await fetch(`${PISTON_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })


      if (!res.ok) throw new Error(`server returned ${res.status}`)


      const json = await res.json()


      // Piston returns run.output or run.stdout depending on backend; check common fields
      const out = json.run?.stdout ?? json.stdout ?? JSON.stringify(json, null, 2)
      const err = json.run?.stderr ?? json.stderr


      setOutput(`${out}${err ? '\n' + err : ''}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-carbon-500 dark:bg-gray-900 p-6 text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Terminal className="w-8 h-8" />
            <h1 className="text-2xl font-semibold">Piston in the Browser — Starter</h1>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="col-span-2">
            <Editor value={code} onChange={setCode} language={language} />
          </div>

          <aside className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Language</label>
              <select
                className="mt-1 block w-full rounded border p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {/* show unique languages discovered */}
                {[...new Set(runtimes.map((r) => r.language))].map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
                {/* fallback options */}
                {!runtimes.length && (
                  <>
                    <option value="javascript">javascript</option>
                    <option value="php">php</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Version</label>
              <input
                className="mt-1 block w-full rounded border p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="leave empty for default"
              />
            </div>

            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                onClick={runCode}
                disabled={loading}
              >
                {loading ? 'Running...' : 'Run'}
              </button>


              <button
                className="px-4 py-2 border rounded border-gray-300 dark:border-gray-600"
                onClick={() => {
                  setCode(language === 'php' ? "<?php\necho 'hello from php';\n" : "console.log('hello from piston')")
                }}
              >
                Reset
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium">Runtimes (fetched)</label>
              <div className="mt-2 max-h-40 overflow-auto text-sm border rounded p-2 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                {runtimes.length ? (
                  runtimes.map((r) => (
                    <div key={`${r.language}-${r.version}`} className="py-1">
                      <strong>{r.language}</strong> — {r.version}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">Fetching runtimes...</div>
                )}
              </div>
            </div>
          </aside>
        </div>

        <section>
          <h2 className="text-lg font-medium mb-2">Output</h2>
          <pre className="whitespace-pre-wrap bg-black dark:bg-gray-950 text-white rounded p-4 min-h-[120px]">
            {error ? `Error: ${error}` : output || 'No output yet.'}
          </pre>
        </section>

        <footer className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Uses public Piston API at <code>{PISTON_BASE}</code>. If the POST route fails because of a typo in the endpoint name, try replacing '/execute'.
        </footer>

      </div>
    </div>

  );
}
