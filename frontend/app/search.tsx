"use client"

import { useState } from "react"
import { searchPlayer } from "@/_lib/api"
import { PlayerData } from "@/_lib/types"

export default function PlayerSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])

  async function searchPlayers(q: string) {
    const data = await searchPlayer(q);
    console.log(`Data:${data}`);
    setResults(data);
  }

  return (
    <div>

      <input
        placeholder="Search for player..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          searchPlayers(e.target.value)
        }}
      />

      <div>
        {results.map(({p} : {player: PlayerData[]}) => (
          <div key={p.id}>{p.name}</div>
        ))}
      </div>

    </div>
  )
}