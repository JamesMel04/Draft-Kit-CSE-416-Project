"use client"

import { useState } from "react"
import { searchPlayer } from "@/_lib/api"
import { PlayerData } from "@/_lib/types"
import { useRouter } from "next/navigation"

export default function PlayerSearch() {
  const [query, setQuery] = useState("")
  const [results,  setResults] = useState<PlayerData[]>([])
  const router = useRouter();

  function handleSubmit(e : FormDataEvent) {
    e.preventDefault();
    console.log(query);
    // Route to the actual search page
    // Right now, query is simply the name parameter
    // In the future, we wil make the query state object have attributes for each possible search parameter

    router.push(`/search?name=${query}`);
  }
  async function searchPlayers(q: string) {
    const data = await searchPlayer(q);


    setResults(data);
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Search for player..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          searchPlayers(e.target.value)
        }}
      />

    </form>
  )
}