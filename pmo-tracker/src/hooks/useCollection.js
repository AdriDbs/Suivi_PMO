import { useState, useEffect } from 'react'

export function useCollection(subscribeFn) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeFn((snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setData(items)
      setLoading(false)
    }, (err) => {
      setError(err)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { data, loading, error }
}
