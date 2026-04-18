"use client";

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

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
    // If on /players, route to relative path and preserve sort state
    if(pathname == "/players") {
      if(name) {
        params.set('name', name);
      }
      else {
        params.delete('name');
      }
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