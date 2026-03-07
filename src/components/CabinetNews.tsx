"use client"

import { useEffect, useState } from "react"

export default function CabinetNews({ name }: { name:string }) {
  const [articles,setArticles] = useState<any[]>([])

  useEffect(()=>{
    async function loadNews(){
      const res = await fetch(`/api/cabinet-news/${encodeURIComponent(name)}`)
      const data = await res.json()
      setArticles(data.articles || [])
    }

    loadNews()
  },[name])

  if(!articles.length){
    return <p className="text-gray-500">No recent news found.</p>
  }

  return(
    <div className="space-y-4">
      {articles.map((a,i)=>(
        <a
          key={i}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border rounded-lg p-4 hover:shadow-sm"
        >
          <h3 className="font-semibold">
            {a.title}
          </h3>
          <div className="text-sm text-gray-500 mt-1">
            {a.source} • {new Date(a.publishedAt).toLocaleDateString()}
          </div>
        </a>
      ))}
    </div>
  )
}
