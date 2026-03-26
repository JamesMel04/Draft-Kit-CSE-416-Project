"use client"

import { useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

export default function PlayerSearch() {
  const [query, setQuery] = useState("")
  const router = useRouter();
  // Use this to preserve the current string and make a new search
  const searchParams = useSearchParams(); 
  const pathname = usePathname();


  function handleSubmit(name : string) {
    // console.log(`Name: ${name}`);
    const params = new URLSearchParams(searchParams);
    // console.log(`Pathname: ${pathname}`)
    // If on /players, route to relative path, keeping sorting and ascension boolean intact
    // While changing page to be 1 again
    if(pathname == "/players") {
      if(name) {
        params.set('name', name);
      }
      else {
        params.delete('name');
      }
      // Reset to page 1
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`);
    }
    
    // If not on players page, route to /player?name=name
    else {
      router.push(`/players?name=${name}`);
    }
  }
  
  return (
    <form onSubmit={(e) => {e.preventDefault(); handleSubmit(query);}}>
      <input
        placeholder="Search for player..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
        }}
      />
    </form>
  )
}