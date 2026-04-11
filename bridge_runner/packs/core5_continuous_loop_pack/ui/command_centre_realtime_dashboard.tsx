import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/core5-dashboard')
      .then(res => res.json())
      .then(setData)
  }, [])

  if (!data) return <div>Loading...</div>

  return (
    <div>
      <h2>Core5 Live Dashboard</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
